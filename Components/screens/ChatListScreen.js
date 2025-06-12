import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export default function ChatListScreen({ navigation }) {
  const { t } = useTranslation();
  const [chatRooms, setChatRooms] = useState([]);
  const [contacts, setContacts] = useState([]);
  const currentUser = auth.currentUser;

  // Fetch chat rooms
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
          return {
            id: docSnap.id,
            name: userDoc.exists() ? userDoc.data().name : 'Unknown',
            lastMessage: room.lastMessage || '',
            type: 'chat',
          };
        })
      );
      setChatRooms(roomsData);
    });
    return () => unsubscribe();
  }, [currentUser.uid]);

  // Fetch contacts
  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      where('uid', '!=', currentUser.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'contact',
      }));
      setContacts(users);
    });
    return () => unsubscribe();
  }, [currentUser.uid]);

  const openChat = (roomId, userName) => {
    navigation.navigate('ChatScreen', { roomId, userName });
  };

  const startChatWithUser = (user) => {
    navigation.navigate('ChatScreen', {
      otherUserId: user.uid,
      otherUserName: user.name,
    });
  };

  const renderItem = ({ item }) => {
    if (item.type === 'chat') {
      return (
        <TouchableOpacity
          style={styles.chatItem}
          onPress={() => openChat(item.id, item.name)}
          activeOpacity={0.7}
        >
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.message} numberOfLines={1} ellipsizeMode="tail">
            {item.lastMessage}
          </Text>
        </TouchableOpacity>
      );
    } else if (item.type === 'contact') {
      return (
        <TouchableOpacity
          style={styles.contactItem}
          onPress={() => startChatWithUser(item)}
        >
          <Text style={styles.name}>{item.name || item.email}</Text>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const sections = [
    {
      title: t('chatList.activeChats'),
      data: chatRooms.length ? chatRooms : [{ id: 'empty-chat', name: t('chatList.noActiveChats'), type: 'empty' }],
    },
    {
      title: t('chatList.contacts'),
      data: contacts.length ? contacts : [{ id: 'empty-contacts', name: t('chatList.noContacts'), type: 'empty' }],
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('chatList.messages')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          item.type === 'empty' ? (
            <Text style={styles.emptyText}>{item.name}</Text>
          ) : (
            renderItem({ item })
          )
        }
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.heading}>{title}</Text>
        )}
        contentContainerStyle={styles.container}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 60,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
    backgroundColor: '#fafafa',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
    color: '#222',
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    marginVertical: 12,
    color: '#333',
  },
  emptyText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#888',
    marginBottom: 20,
  },
  chatItem: {
    backgroundColor: '#f4f4f4',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 12,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  contactItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  name: {
    fontSize: 18,
    color: '#222',
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});
