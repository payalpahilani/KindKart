import React, { useLayoutEffect, useEffect, useState, useContext } from "react";
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import socket from "../Utilities/Socket";
import { auth, db } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  query,
  where,
  getDocs,
  getDoc,
  deleteDoc,
  orderBy,
} from "firebase/firestore";
import { ThemeContext } from "../Utilities/ThemeContext";

export default function ChatScreen({ route, navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const styles = isDarkMode ? darkStyles : lightStyles;

  useLayoutEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
    return () => navigation.getParent()?.setOptions({ tabBarStyle: undefined });
  }, [navigation]);

  const {
    otherUserId,
    otherUserName: otherUserNameParam,
    roomId: passedRoomId,
    ad,
  } = route.params || {};

  const currentUser = auth.currentUser;
  const [roomId, setRoomId] = useState(passedRoomId || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [otherUserNameFetched, setOtherUserNameFetched] = useState(null);
  const [deletionTime, setDeletionTime] = useState(null);

  // Fetch other user info
 useEffect(() => {
  if (!otherUserId) return;
  (async () => {
    try {
      console.log("Fetching user with ID:", otherUserId);
      const userDoc = await getDoc(doc(db, "users", otherUserId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("User data fetched:", userData);
        setOtherUserNameFetched(userData.name || "Unknown");
      } else {
        console.log("User document does not exist");
        setOtherUserNameFetched("Unknown");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setOtherUserNameFetched("Unknown");
    }
  })();
}, [otherUserId]);


  // Find or create chat room
  useEffect(() => {
    if (!roomId && otherUserId) {
      (async () => {
        const roomsRef = collection(db, "chatRooms");
        const q = query(roomsRef, where("users", "array-contains", currentUser.uid));
        const snap = await getDocs(q);
        let existing = null;
        snap.forEach((docSnap) => {
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
              [otherUserId]: otherUserNameParam || otherUserNameFetched || "User",
            },
            createdAt: serverTimestamp(),
            unreadCounts: {
              [currentUser.uid]: 0,
              [otherUserId]: 0,
            },
          });
          setRoomId(newRoom.id);
        }
      })();
    }
  }, [currentUser.uid, otherUserId, otherUserNameParam, otherUserNameFetched]);

  // Handle message deletion time for filtering messages
  useEffect(() => {
    if (!roomId) return;
    (async () => {
      const roomSnap = await getDoc(doc(db, "chatRooms", roomId));
      if (roomSnap.exists()) {
        const data = roomSnap.data();
        if (data.deletedFor && data.deletedFor[currentUser.uid]) {
          setDeletionTime(data.deletedFor[currentUser.uid]);
        } else {
          setDeletionTime(null);
        }
      }
    })();
  }, [roomId]);

  // Listen for messages with optional filtering by deletionTime
  useEffect(() => {
    if (!roomId) return;

    let messagesRef = collection(db, "chatRooms", roomId, "messages");
    let messagesQuery;

    if (deletionTime) {
      messagesQuery = query(
        messagesRef,
        where("createdAt", ">", deletionTime),
        orderBy("createdAt", "asc")
      );
    } else {
      messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));
    }

    const unsubFs = onSnapshot(messagesQuery, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(msgs);
    });

    return () => unsubFs();
  }, [roomId, deletionTime]);

  // Socket join/leave and receive message events
  useEffect(() => {
    if (!roomId) return;

    socket.emit("joinRoom", roomId);

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.emit("leaveRoom", roomId);
      socket.off("receiveMessage");
    };
  }, [roomId]);

  // Reset unread count for current user when opening chat
  useEffect(() => {
    if (!roomId) return;
    const chatRoomRef = doc(db, "chatRooms", roomId);
    updateDoc(chatRoomRef, {
      [`unreadCounts.${currentUser.uid}`]: 0,
    }).catch(console.error);
  }, [roomId]);

  // Send message and update unread counts for other users
  const sendMessage = async () => {
    if (!input.trim() || !roomId) return;

    const messageText = input.trim();

    try {
      const roomRef = doc(db, "chatRooms", roomId);

      // Reset deletedFor for current user on sending new message
      await updateDoc(roomRef, {
        [`deletedFor.${currentUser.uid}`]: null,
        lastMessage: messageText,
        lastUpdated: serverTimestamp(),
      });

      // Add message to subcollection
      await addDoc(collection(db, "chatRooms", roomId, "messages"), {
        text: messageText,
        senderId: currentUser.uid,
        createdAt: serverTimestamp(),
      });

      // Get current unreadCounts and increment others
      const roomSnap = await getDoc(roomRef);
      const unreadCounts = roomSnap.exists() ? roomSnap.data().unreadCounts || {} : {};

      const newUnreadCounts = { ...unreadCounts };
      for (const userId of Object.keys(newUnreadCounts)) {
        if (userId !== currentUser.uid) {
          newUnreadCounts[userId] = (newUnreadCounts[userId] || 0) + 1;
        } else {
          newUnreadCounts[userId] = 0; // reset for sender
        }
      }

      await updateDoc(roomRef, {
        unreadCounts: newUnreadCounts,
      });

      // Emit socket event
      socket.emit("sendMessage", {
        text: messageText,
        senderId: currentUser.uid,
        createdAt: new Date().toISOString(),
        roomId,
      });

      setInput("");
      setDeletionTime(null);
    } catch {
      Alert.alert("Error", "Failed to send message.");
    }
  };

  // Modal & message actions
  const handleLongPress = (message) => {
    setSelectedMessage(message);
    setModalVisible(true);
  };

  const copyToClipboard = async (text) => {
    await Clipboard.setStringAsync(text);
    setModalVisible(false);
    Alert.alert("Copied", "Message copied to clipboard.");
  };

  const deleteMessage = async (msgId) => {
    if (!roomId || !msgId) return;
    try {
      await deleteDoc(doc(db, "chatRooms", roomId, "messages", msgId));

      const messagesSnapshot = await getDocs(collection(db, "chatRooms", roomId, "messages"));
      if (messagesSnapshot.empty) {
        await deleteDoc(doc(db, "chatRooms", roomId));
        setModalVisible(false);
        navigation.goBack();
        return;
      }

      setModalVisible(false);
    } catch {
      Alert.alert("Error", "Failed to delete the message.");
    }
  };

  // Find the index of first message from current user to show ad preview above it
  const firstMyMsgIndex = messages.findIndex((msg) => msg.senderId === currentUser.uid);

  // Fallback if user hasn't sent any message yet
  const noMyMessages = firstMyMsgIndex === -1;

  const renderItem = ({ item, index }) => {
    const isMyMessage = item.senderId === currentUser.uid;

    // Debug logs - remove after testing
    // console.log("Render message", index, "isMyMessage:", isMyMessage, "firstMyMsgIndex:", firstMyMsgIndex);
    // console.log("Ad preview condition:", ad && isMyMessage && index === firstMyMsgIndex);

    const showAdPreviewHere = ad && isMyMessage && index === firstMyMsgIndex;

    return (
      <>
        {showAdPreviewHere && (
          <View style={styles.adPreviewBox}>
            {(ad.imageUrl || (ad.imageUrls && ad.imageUrls.length > 0)) && (
              <Image
                source={{ uri: ad.imageUrl ?? ad.imageUrls[0] }}
                style={styles.adImage}
              />
            )}
            <View style={styles.adTextWrapper}>
              <Text style={styles.adTitle}>{ad.title}</Text>
              <Text style={styles.adPrice}>${ad.price}</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={() => handleLongPress(item)}
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessage : styles.otherMessage,
          ]}
        >
          <Text style={styles.messageText}>{item.text}</Text>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={navigation.goBack} style={styles.backButton}>
            <Ionicons
              name="arrow-back"
              size={28}
              color={isDarkMode ? "#eee" : "#007AFF"}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {otherUserNameParam || otherUserNameFetched || "Chat"}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Show ad preview at top if no messages by current user */}
        {ad && noMyMessages && (
          <View style={styles.adPreviewBox}>
            {(ad.imageUrl || (ad.imageUrls && ad.imageUrls.length > 0)) && (
              <Image
                source={{ uri: ad.imageUrl ?? ad.imageUrls[0] }}
                style={styles.adImage}
              />
            )}
            <View style={styles.adTextWrapper}>
              <Text style={styles.adTitle}>{ad.title}</Text>
              <Text style={styles.adPrice}>${ad.price}</Text>
            </View>
          </View>
        )}

        <FlatList
          style={{ flex: 1 }}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          renderItem={renderItem}
          onContentSizeChange={() => {}}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message"
            placeholderTextColor={isDarkMode ? "#aaa" : "#999"}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Ionicons name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Message Options</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => copyToClipboard(selectedMessage?.text || "")}
            >
              <Text style={styles.modalButtonText}>Copy Text</Text>
            </TouchableOpacity>
            {selectedMessage?.senderId === currentUser.uid && (
              <TouchableOpacity
                style={[styles.modalButton, styles.modalDeleteButton]}
                onPress={() => {
                  Alert.alert(
                    "Delete Message",
                    "Are you sure you want to delete this message?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => deleteMessage(selectedMessage?.id),
                      },
                    ],
                    { cancelable: true }
                  );
                }}
              >
                <Text style={[styles.modalButtonText, { color: "#e33057" }]}>
                  Delete Message
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const baseStyles = {
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
    color: "#000",
  },
  sendButton: {
    backgroundColor: "#EFAC3A",
    borderRadius: 25,
    padding: 12,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
    color: "#111",
    textAlign: "center",
  },
  modalButton: {
    paddingVertical: 15,
    borderTopWidth: 1,
    borderColor: "#eee",
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: "#333",
  },
  modalDeleteButton: {
    borderTopWidth: 0,
  },
  adPreviewBox: {
    margin: 12,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  adImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
  },
  adTextWrapper: {
    flex: 1,
  },
  adTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
  },
  adPrice: {
    fontSize: 14,
    color: "#444",
  },
};

const lightStyles = StyleSheet.create({
  ...baseStyles,
});

const darkStyles = StyleSheet.create({
  ...baseStyles,
  container: { ...baseStyles.container, backgroundColor: "#121212" },
  header: { ...baseStyles.header, borderBottomColor: "#333" },
  headerTitle: { ...baseStyles.headerTitle, color: "#eee" },
  messageBubble: {
    ...baseStyles.messageBubble,
    shadowOpacity: 0.35,
  },
  myMessage: { ...baseStyles.myMessage, backgroundColor: "#efac3a" },
  otherMessage: { ...baseStyles.otherMessage, backgroundColor: "#444" },
  messageText: { ...baseStyles.messageText, color: "#eee" },
  inputRow: {
    ...baseStyles.inputRow,
    borderTopColor: "#333",
    backgroundColor: "#222",
  },
  input: {
    ...baseStyles.input,
    backgroundColor: "#333",
    color: "#eee",
    borderColor: "#555",
  },
  sendButton: {
    ...baseStyles.sendButton,
    backgroundColor: "#efac3a",
  },
  modalBox: {
    ...baseStyles.modalBox,
    backgroundColor: "#222",
  },
  modalTitle: {
    ...baseStyles.modalTitle,
    color: "#eee",
  },
  modalButtonText: {
    ...baseStyles.modalButtonText,
    color: "#ddd",
  },
  adPreviewBox: {
    ...baseStyles.adPreviewBox,
    backgroundColor: "#1e1e1e",
  },
  adTitle: {
    ...baseStyles.adTitle,
    color: "#eee",
  },
  adPrice: {
    ...baseStyles.adPrice,
    color: "#bbb",
  },
});
