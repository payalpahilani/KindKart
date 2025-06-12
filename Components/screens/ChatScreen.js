import React, { useLayoutEffect, useEffect, useState } from "react";
import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import socket from "../Utilities/Socket";
import { auth, db } from "../../firebaseConfig";
import { collection, addDoc, updateDoc, doc, serverTimestamp, onSnapshot, query, where, getDocs } from "firebase/firestore";

export default function ChatScreen({ route, navigation }) {

  useLayoutEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
    return () => navigation.getParent()?.setOptions({ tabBarStyle: undefined });
  }, [navigation]);

  const { otherUserId, otherUserName, roomId: passedRoomId } = route.params || {};
  const currentUser = auth.currentUser;
  const [roomId, setRoomId] = useState(passedRoomId || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  // Create/find room
  useEffect(() => {
    if (!roomId && otherUserId) {
      (async () => {
        const roomsRef = collection(db, "chatRooms");
        const q = query(roomsRef, where("users", "array-contains", currentUser.uid));
        const snap = await getDocs(q);
        let existing = null;
        snap.forEach(docSnap => {
          const data = docSnap.data();
          if (data.users.includes(otherUserId) && data.users.length === 2) {
            existing = { id: docSnap.id, ...data };
          }
        });
        if (existing) {
          setRoomId(existing.id);
        } else {
          const newRoom = await addDoc(roomsRef, {
            users: [currentUser.uid, otherUserId],
            lastMessage: "",
            lastUpdated: serverTimestamp(),
            userNames: {
              [currentUser.uid]: currentUser.displayName || "You",
              [otherUserId]: otherUserName || "User",
            },
            createdAt: serverTimestamp(),
          });
          setRoomId(newRoom.id);
        }
      })();
    }
  }, [currentUser.uid, otherUserId]);

  // Listen to Firestore messages
  useEffect(() => {
    if (!roomId) return;
    const messagesRef = collection(db, "chatRooms", roomId, "messages");
    const unsubFs = onSnapshot(messagesRef, snap => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      msgs.sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);
      setMessages(msgs);
    });
    return () => unsubFs();
  }, [roomId]);

  // Socket.IO syncing
  useEffect(() => {
    if (!roomId) return;

    socket.emit("joinRoom", roomId);

    socket.on("receiveMessage", msg => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.emit("leaveRoom", roomId);
      socket.off("receiveMessage");
    };
  }, [roomId]);

  // Send message via Firestore + Socket
  const sendMessage = async () => {
    if (!input.trim() || !roomId) return;

    const messageData = {
      text: input.trim(),
      senderId: currentUser.uid,
      createdAt: new Date().toISOString(),
      roomId,
    };

    // Save to Firestore
    await addDoc(collection(db, "chatRooms", roomId, "messages"), {
      text: messageData.text,
      senderId: messageData.senderId,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, "chatRooms", roomId), {
      lastMessage: messageData.text,
      lastUpdated: serverTimestamp(),
    });

    // Send via Socket
    socket.emit("sendMessage", messageData);

    setInput("");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={navigation.goBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{otherUserName || "Chat"}</Text>
          <View style={{ width: 28 }} />
        </View>

        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => (
            <View style={[
              styles.messageBubble,
              item.senderId === currentUser.uid ? styles.myMessage : styles.otherMessage
            ]}>
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
          )}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message"
            placeholderTextColor="#999"
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Ionicons name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    justifyContent: "space-between",
  },
  backButton: { padding: 6 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    color: "#222",
  },
  messageList: { paddingHorizontal: 15, paddingVertical: 10, paddingBottom: 20 },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginVertical: 6,
    borderRadius: 20,
    maxWidth: "75%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  myMessage: { backgroundColor: "#EFAC3A", alignSelf: "flex-end" },
  otherMessage: { backgroundColor: "#777", alignSelf: "flex-start" },
  messageText: { color: "#fff", fontSize: 16 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fafafa",
  },
  input: {
    flex: 1,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  sendButton: {
    backgroundColor: "#EFAC3A",
    borderRadius: 25,
    padding: 12,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
