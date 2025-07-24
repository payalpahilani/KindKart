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
import { auth, db } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  query,
  getDoc,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import { ThemeContext } from "../Utilities/ThemeContext";

export default function ChatScreen({ route, navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const styles = isDarkMode ? darkStyles : lightStyles;

  const {
    roomId: passedRoomId,
    otherUserId,
    otherUserName: otherUserNameParam,
    adId,
    ad: passedAd,
  } = route.params || {};

  const currentUser = auth.currentUser;

  const [roomId, setRoomId] = useState(passedRoomId || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [otherUserNameFetched, setOtherUserNameFetched] = useState(null);
  const [isAdSold, setIsAdSold] = useState(false);
  const [adData, setAdData] = useState(passedAd || null);

  useLayoutEffect(() => {
    navigation.getParent()?.setOptions({ tabBarStyle: { display: "none" } });
    return () => navigation.getParent()?.setOptions({ tabBarStyle: undefined });
  }, [navigation]);

  // Fetch other user's name if not passed
  useEffect(() => {
    if (otherUserId) {
      getDoc(doc(db, "users", otherUserId)).then((snap) => {
        if (snap.exists()) setOtherUserNameFetched(snap.data().name);
        else setOtherUserNameFetched("Unknown");
      });
    }
  }, [otherUserId]);

  // Fetch ad data by adId if full ad not passed
  useEffect(() => {
    if (!adData && adId) {
      const fetchAd = async () => {
        try {
          const docSnap = await getDoc(doc(db, "items", adId));
          if (docSnap.exists()) {
            setAdData({ id: docSnap.id, ...docSnap.data() });
            setIsAdSold(docSnap.data().sold === true);
          } else {
            setIsAdSold(true); // Ad removed
          }
        } catch {
          setIsAdSold(true);
        }
      };
      fetchAd();
    } else if (adData) {
      setIsAdSold(adData.sold === true);
    }
  }, [adId, adData]);

  // Listen for messages
  useEffect(() => {
    if (!roomId) return;
    const messagesRef = collection(db, "chatRooms", roomId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [roomId]);

  // Reset unread count
  useEffect(() => {
    if (!roomId) return;
    updateDoc(doc(db, "chatRooms", roomId), {
      [`unreadCounts.${currentUser.uid}`]: 0,
    }).catch(() => {});
  }, [roomId]);

  // Send message handler
  const sendMessage = async () => {
    if (!input.trim() || !roomId || isAdSold) return;

    const messageText = input.trim();

    try {
      const roomRef = doc(db, "chatRooms", roomId);
      await updateDoc(roomRef, {
        lastMessage: messageText,
        lastUpdated: serverTimestamp(),
      });

      await addDoc(collection(db, "chatRooms", roomId, "messages"), {
        text: messageText,
        senderId: currentUser.uid,
        createdAt: serverTimestamp(),
      });

      setInput("");
    } catch {
      Alert.alert("Error", "Failed to send message.");
    }
  };

  // Message options modal handlers
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
    try {
      await deleteDoc(doc(db, "chatRooms", roomId, "messages", msgId));
      setModalVisible(false);
    } catch {
      Alert.alert("Error", "Failed to delete message.");
    }
  };

  // Find index of first message by current user to show ad preview above it
  const firstMyMsgIndex = messages.findIndex((msg) => msg.senderId === currentUser.uid);

  // Render chat message with optional ad preview above first message you sent
  const renderItem = ({ item, index }) => {
    const isMyMessage = item.senderId === currentUser.uid;
    const showAdPreview = isMyMessage && index === firstMyMsgIndex && adData;

    return (
      <>
        {showAdPreview && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.adPreviewBox}
            onPress={() => navigation.navigate("AdDetails", { ad: adData })}
          >
            {(adData.imageUrl || (adData.imageUrls && adData.imageUrls.length)) && (
              <Image
                source={{ uri: adData.imageUrl ?? adData.imageUrls[0] }}
                style={styles.adImage}
              />
            )}
            <View style={styles.adTextWrapper}>
              <Text style={styles.adTitle}>{adData.title}</Text>
              <Text style={styles.adPrice}>${adData.price}</Text>
            </View>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={() => handleLongPress(item)}
          style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.otherMessage]}
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
        behavior={Platform.OS == "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={navigation.goBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={isDarkMode ? "#eee" : "#007AFF"} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {otherUserNameParam || otherUserNameFetched || "Chat"}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {isAdSold ? (
          <View style={styles.soldMessageContainer}>
            <Text style={styles.soldMessageText}>This item has been sold and chat is closed.</Text>
          </View>
        ) : (
          <>
            <FlatList
              style={{ flex: 1 }}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.messageList}
              keyboardShouldPersistTaps="handled"
            />
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Type a message"
                placeholderTextColor={isDarkMode ? "#aaa" : "#999"}
                multiline
                editable={!isAdSold}
              />
              <TouchableOpacity
                style={[styles.sendButton, isAdSold && { backgroundColor: "#999" }]}
                onPress={sendMessage}
                disabled={isAdSold}
              >
                <Ionicons name="send" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>

      {/* Modal for message options */}
      <Modal visible={modalVisible} animationType="fade" transparent onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Message Options</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => copyToClipboard(selectedMessage?.text || "")}>
              <Text style={styles.modalButtonText}>Copy Text</Text>
            </TouchableOpacity>
            {selectedMessage?.senderId === currentUser.uid && (
              <TouchableOpacity
                style={[styles.modalButton, styles.modalDeleteButton]}
                onPress={() =>
                  Alert.alert(
                    "Delete Message",
                    "Are you sure you want to delete this message?",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Delete", style: "destructive", onPress: () => deleteMessage(selectedMessage.id) },
                    ],
                    { cancelable: true }
                  )
                }
              >
                <Text style={[styles.modalButtonText, { color: "#e33057" }]}>Delete Message</Text>
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
    borderColor: "#eee",
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
  soldMessageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  soldMessageText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
};

const lightStyles = StyleSheet.create(baseStyles);

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
  soldMessageText: {
    ...baseStyles.soldMessageText,
    color: "#bbb",
  },
});
