import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { ThemeContext } from '../Utilities/ThemeContext';

export default function ChatListScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const styles = isDarkMode ? darkStyles : lightStyles;

  const [chatRooms, setChatRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const currentUser = auth.currentUser;

  useEffect(() => {
    const q = query(
      collection(db, 'chatRooms'),
      where('users', 'array-contains', currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const roomsData = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const room = docSnap.data();
          const otherUserId = room.users.find(id => id !== currentUser.uid);
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          const userData = userDoc.data();
          return {
            id: docSnap.id,
            name: userData?.name || 'Unknown',
            avatar: userData?.avatar || null,
            lastMessage: room.lastMessage || '',
            lastMessageTime: room.lastMessageTime || '',
          };
        })
      );
      setChatRooms(roomsData);
    });

    return () => unsubscribe();
  }, []);

  const filteredRooms = chatRooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }) => {
    const timestamp = item.lastMessageTime?.toDate?.().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }) || '';
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() =>
          navigation.navigate('ChatScreen', {
            roomId: item.id,
            userName: item.name,
          })
        }
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
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.message} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>
        <Text style={styles.timestamp}>{timestamp}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/Images/avatar.jpg')}
          style={styles.profileIcon}
        />
        <Text style={styles.headerTitle}>Chats</Text>
        <TouchableOpacity>
          <Ionicons name="create-outline" size={24} color={styles.icon.color} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#aaa" style={{ marginHorizontal: 8 }} />
        <TextInput
          placeholder="Search"
          placeholderTextColor="#aaa"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredRooms}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

// Shared base styles
const base = {
  safe: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  icon: {},
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eee',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 8,
    borderRadius: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 14,
  },
  chatContent: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    color: '#666',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
};

// Light theme
const lightStyles = StyleSheet.create({
  ...base,
  safe: { ...base.safe, backgroundColor: '#fff' },
  header: { ...base.header, backgroundColor: '#fff' },
  icon: { color: '#000' },
  headerTitle: { ...base.headerTitle, color: '#000' },
  searchContainer: { ...base.searchContainer, backgroundColor: '#eee' },
  searchInput: { ...base.searchInput, color: '#000' },
  chatItem: {
    ...base.chatItem,
    backgroundColor: '#f4f4f4',
  },
});

// Dark theme
const darkStyles = StyleSheet.create({
  ...base,
  safe: { ...base.safe, backgroundColor: '#121212' },
  header: { ...base.header, backgroundColor: '#1E1E1E' },
  icon: { color: '#fff' },
  headerTitle: { ...base.headerTitle, color: '#fff' },
  searchContainer: { ...base.searchContainer, backgroundColor: '#2a2a2a' },
  searchInput: { ...base.searchInput, color: '#fff' },
  chatItem: {
    ...base.chatItem,
    backgroundColor: '#1e1e1e',
  },
  name: { ...base.name, color: '#fff' },
  message: { ...base.message, color: '#ccc' },
  timestamp: { ...base.timestamp, color: '#aaa' },
});
