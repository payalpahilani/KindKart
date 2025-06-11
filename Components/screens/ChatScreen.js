import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  query,
  getDocs,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function ChatScreen({ route, navigation }) {
  const {
    otherUserId,
    userName: otherUserName,
    roomId: passedRoomId,
  } = route.params || {};
  const currentUser = auth.currentUser;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [roomId, setRoomId] = useState(passedRoomId || null);

  // If roomId is not passed, try to find or create the chat room
  useEffect(() => {
    if (!roomId && otherUserId) {
      const findOrCreateRoom = async () => {
        const roomsRef = collection(db, "chatRooms");
        const q = query(
          roomsRef,
          where("users", "array-contains", currentUser.uid)
        );

        const snapshot = await getDocs(q);
        let existingRoom = null;

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (
            data.users.includes(otherUserId) &&
            data.users.includes(currentUser.uid) &&
            data.users.length === 2
          ) {
            existingRoom = { id: docSnap.id, ...data };
          }
        });

        if (existingRoom) {
          setRoomId(existingRoom.id);
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
      };

      findOrCreateRoom();
    }
  }, [otherUserId, roomId]);

  // Listen to messages collection in the room
  useEffect(() => {
    if (!roomId) return;

    const messagesRef = collection(db, "chatRooms", roomId, "messages");
    const q = query(messagesRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      // Sort messages by createdAt ascending
      msgs.sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [roomId]);

  const sendMessage = async () => {
    if (!input.trim() || !roomId) return;

    const messagesRef = collection(db, "chatRooms", roomId, "messages");
    await addDoc(messagesRef, {
      text: input,
      senderId: currentUser.uid,
      createdAt: serverTimestamp(),
    });

    const roomDoc = doc(db, "chatRooms", roomId);
    await updateDoc(roomDoc, {
      lastMessage: input,
      lastUpdated: serverTimestamp(),
    });

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
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={28} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{otherUserName || "Chat"}</Text>
          <View style={{ width: 28 }} />
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageBubble,
                item.senderId === currentUser.uid
                  ? styles.myMessage
                  : styles.otherMessage,
              ]}
            >
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
            multiline={true}
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Ionicons name="send" size={22} color="white" />
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
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    color: "#222",
  },
  messageList: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingBottom: 20,
  },
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
  myMessage: {
    backgroundColor: "#EFAC3A",
    alignSelf: "flex-end",
  },
  otherMessage: {
    backgroundColor: "#777",
    alignSelf: "flex-start",
  },
  messageText: {
    color: "#fff",
    fontSize: 16,
  },
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
