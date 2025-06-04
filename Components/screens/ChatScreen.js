import React, { useEffect, useState, useRef } from 'react';
import {
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import socket from '../Utilitis/Socket';

const Chat = ({ navigation }) => {
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const flatListRef = useRef();

  useEffect(() => {
    socket.on('receive_message', (data) => {
      setChatMessages((prev) => [...prev, { message: data, from: 'other' }]);
    });

    return () => {
      socket.off('receive_message');
    };
  }, []);

  const sendMessage = () => {
    if (message.trim() !== '') {
      socket.emit('send_message', message);
      setChatMessages((prev) => [...prev, { message, from: 'me' }]);
      setMessage('');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User</Text>
        <View style={{ width: 24 }} />
        </View>


      {/* Chat messages */}
      <FlatList
        ref={flatListRef}
        data={chatMessages}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.from === 'me' ? styles.myMsg : styles.otherMsg,
            ]}
          >
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        )}
        keyExtractor={(_, index) => index.toString()}
        onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
      />

      {/* Message input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#F4F4F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2E41',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  messageBubble: {
    marginVertical: 5,
    padding: 10,
    maxWidth: '75%',
    borderRadius: 10,
  },
  myMsg: {
    backgroundColor: '#EFAC3A',
    alignSelf: 'flex-end',
    borderTopRightRadius: 0,
  },
  otherMsg: {
    backgroundColor: '#e0e0e0',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 0,
  },
  messageText: {
    fontSize: 15,
    color: '#1F2E41',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#1F2E41',
    borderRadius: 20,
    padding: 10,
  },
});

export default Chat;
