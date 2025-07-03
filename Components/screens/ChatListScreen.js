import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { ThemeContext } from '../Utilities/ThemeContext';
import { Swipeable } from 'react-native-gesture-handler';

export default function ChatListScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const styles = isDarkMode ? darkStyles : lightStyles;

  const [chatRooms, setChatRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserAvatar, setCurrentUserAvatar] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);

  const currentUser = auth.currentUser;

  // Fetch current user avatar
  useEffect(() => {
    async function fetchAvatar() {
      if (!currentUser?.uid) return;
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setCurrentUserAvatar(userData.avatarUrl || null);
      }
    }
    fetchAvatar();
  }, [currentUser]);

  // Fetch chat rooms and other user info, including unread counts
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, 'chatRooms'),
      where('users', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rooms = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const roomData = docSnap.data();
          const otherUserId = roomData.users.find(uid => uid !== currentUser.uid);
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          const userData = userDoc.exists() ? userDoc.data() : {};

          return {
            id: docSnap.id,
            name: userData.name || 'Unknown',
            avatar: userData.avatarUrl || null,
            lastMessage: roomData.lastMessage || '',
            lastMessageTime: roomData.lastMessageTime || null,
            unreadCount: roomData.unreadCounts?.[currentUser.uid] || 0,  // Add unread count
          };
        })
      );
      setChatRooms(rooms);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Filter rooms by search input
  const filteredRooms = chatRooms.filter(room =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Confirm delete alert (for slide delete)
  const confirmDelete = (roomId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this chat?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: () => deleteChat(roomId), style: 'destructive' },
      ],
      { cancelable: true }
    );
  };

  // Delete chat room from Firestore
  const deleteChat = async (roomId) => {
    try {
      await deleteDoc(doc(db, 'chatRooms', roomId));
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  // Handle long press on chat item (open modal)
  const handleLongPress = (chat) => {
    setSelectedChat(chat);
    setModalVisible(true);
  };

  // Render right action for Swipeable (Delete button)
  const renderRightActions = (progress, dragX, roomId) => {
    return (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => confirmDelete(roomId)}
        activeOpacity={0.7}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item }) => {
    const timestamp = item.lastMessageTime?.toDate?.().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }) || '';

    return (
      <Swipeable
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}
      >
        <TouchableOpacity
          style={styles.chatItem}
          onPress={() =>
            navigation.navigate('ChatScreen', {
              roomId: item.id,
              userName: item.name,
              userAvatar: item.avatar,
              otherUserId: item.id === currentUser.uid ? null : item.id, // Pass otherUserId if needed
            })
          }
          onLongPress={() => handleLongPress(item)}
          activeOpacity={0.7}
        >
          <Image
            source={
              item.avatar
                ? { uri: item.avatar }
                : require('../../assets/Images/avatar.jpg')
            }
            style={styles.avatar}
          />
          <View style={styles.chatContent}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.message} numberOfLines={1}>
              {item.lastMessage || 'No messages yet'}
            </Text>
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
              </View>
            )}
            <Text style={styles.timestamp}>{timestamp}</Text>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Image
          source={
            currentUserAvatar
              ? { uri: currentUserAvatar }
              : require('../../assets/Images/avatar.jpg')
          }
          style={styles.profileIcon}
        />
        <Text style={styles.headerTitle}>Chats</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={{ marginHorizontal: 10 }} />
        <TextInput
          placeholder="Search chats"
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filteredRooms}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No chats found.</Text>
          </View>
        }
      />

      {/* Modal for long press options */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={[styles.modalBox, isDarkMode && styles.modalBoxDark]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>
              {selectedChat?.name}
            </Text>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonTop]}
              activeOpacity={0.7}
              onPress={() => {
                setModalVisible(false);
                navigation.navigate('ChatScreen', {
                  roomId: selectedChat?.id,
                  userName: selectedChat?.name,
                  userAvatar: selectedChat?.avatar,
                });
              }}
            >
              <Text style={[styles.modalButtonText, isDarkMode && styles.modalButtonTextDark]}>
                Open Chat
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalDeleteButton]}
              activeOpacity={0.7}
              onPress={() => {
                setModalVisible(false);
                confirmDelete(selectedChat?.id);
              }}
            >
              <Text style={[styles.modalButtonText, styles.modalDeleteText]}>
                Delete Chat
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const base = {
  safe: { flex: 1 },
  header: {
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
    backgroundColor: 'transparent',
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    flex: 1,
    color: '#222',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 7,
    elevation: 3,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 16,
    backgroundColor: '#ddd',
  },
  chatContent: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: '#666',
    opacity: 0.8,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },

  deleteButton: {
    backgroundColor: '#e33057',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: 8,
    borderRadius: 14,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',  // Slightly stronger overlay
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 25,
    paddingHorizontal: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },

  modalBoxDark: {
    backgroundColor: '#2c2c2c', // Darker background for dark mode
    shadowColor: '#000',
    shadowOpacity: 0.6,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 25,
    color: '#111',
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  modalTitleDark: {
    color: '#eee',
  },

  modalButton: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: '#eaeaea',
    borderStyle: 'solid',
  },

  modalButtonTop: {
    borderTopWidth: 0,
  },

  modalButtonText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#222',
  },

  modalButtonTextDark: {
    color: '#ddd',
  },

  modalDeleteButton: {
    borderTopWidth: 1,
    borderColor: '#e33057',
    backgroundColor: 'transparent',
  },

  modalDeleteText: {
    color: '#e33057',
    fontWeight: '700',
  },

  unreadBadge: {
    backgroundColor: '#e33057',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
};

const lightStyles = StyleSheet.create({
  ...base,
  safe: { ...base.safe, backgroundColor: '#fff' },
  headerTitle: { ...base.headerTitle, color: '#222' },
  searchContainer: { ...base.searchContainer, backgroundColor: '#f0f0f0' },
  searchInput: { ...base.searchInput, color: '#333' },
  chatItem: { ...base.chatItem, backgroundColor: '#fff' },
  name: { ...base.name, color: '#111' },
  message: { ...base.message, color: '#666' },
  timestamp: { ...base.timestamp, color: '#999' },
  emptyText: { ...base.emptyText, color: '#999' },
});

const darkStyles = StyleSheet.create({
  ...base,
  safe: { ...base.safe, backgroundColor: '#121212' },
  headerTitle: { ...base.headerTitle, color: '#eee' },
  searchContainer: {
    ...base.searchContainer,
    backgroundColor: '#2a2a2a',
    shadowColor: '#000',
    shadowOpacity: 0.2,
  },
  searchInput: { ...base.searchInput, color: '#eee' },
  chatItem: {
    ...base.chatItem,
    backgroundColor: '#1e1e1e',
    shadowColor: '#000',
    shadowOpacity: 0.3,
  },
  name: { ...base.name, color: '#fff' },
  message: { ...base.message, color: '#ccc' },
  timestamp: { ...base.timestamp, color: '#aaa' },
  emptyText: { ...base.emptyText, color: '#777' },
  modalBox: {
    backgroundColor: '#1e1e1e',
    padding: 24,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
    color: '#fff',
  },
  modalButton: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#444',
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#eee',
    textAlign: 'center',
  },
  modalDeleteButton: {
    borderColor: '#e33057',
  },
  modalDeleteText: {
    color: '#e33057',
  },
});
