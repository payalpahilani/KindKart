import React, { useEffect, useState, useContext } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, db } from "../../firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { ThemeContext } from "../Utilities/ThemeContext";
import { Swipeable } from "react-native-gesture-handler";

export default function ChatListScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const styles = isDarkMode ? darkStyles : lightStyles;

  const currentUser = auth.currentUser;
  const [chatRooms, setChatRooms] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserAvatar, setCurrentUserAvatar] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);

  // Fetch current user's avatar
  useEffect(() => {
    async function fetchAvatar() {
      if (!currentUser?.uid) return;
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCurrentUserAvatar(userData.avatarUrl || null);
      }
    }
    fetchAvatar();
  }, [currentUser]);

  // Fetch chat rooms with ad previews
  useEffect(() => {
    if (!currentUser?.uid) return;

    const q = query(
      collection(db, "chatRooms"),
      where("users", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rooms = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const roomData = docSnap.data();
          const otherUserId = roomData.users.find(
            (uid) => uid !== currentUser.uid
          );

          // Fetch other user info
          const userDoc = await getDoc(doc(db, "users", otherUserId));
          const userData = userDoc.exists() ? userDoc.data() : {};

          // Fetch ad data by adId if exists
          let adData = null;
          if (roomData.adId) {
            const adDoc = await getDoc(doc(db, "items", roomData.adId));
            if (adDoc.exists()) {
              adData = { id: adDoc.id, ...adDoc.data() };
            }
          }

          return {
            id: docSnap.id,
            name: userData.name || "Unknown",
            avatar: userData.avatarUrl || null,
            lastMessage: roomData.lastMessage || "",
            lastMessageTime: roomData.lastUpdated || null,
            unreadCount: roomData.unreadCounts?.[currentUser.uid] || 0,
            otherUserId,
            ad: adData,
          };
        })
      );

      setChatRooms(rooms);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Filter chat rooms by search input
  const filteredRooms = chatRooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Alert to confirm chat delete
  const confirmDelete = (roomId) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this chat?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteChat(roomId) },
      ],
      { cancelable: true }
    );
  };

  // Delete chat room from Firestore
  const deleteChat = async (roomId) => {
    try {
      await deleteDoc(doc(db, "chatRooms", roomId));
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  };

  // Handle long press opens modal
  const handleLongPress = (chat) => {
    setSelectedChat(chat);
    setModalVisible(true);
  };

  // Swipeable Delete button
  const renderRightActions = (progress, dragX, roomId) => (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={() => confirmDelete(roomId)}
      activeOpacity={0.7}
    >
      <Text style={styles.deleteButtonText}>Delete</Text>
    </TouchableOpacity>
  );

  // Render each chat item
  const renderItem = ({ item }) => {
    const timestamp = item.lastMessageTime
      ? item.lastMessageTime.toDate().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    return (
      <Swipeable
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}
      >
        <TouchableOpacity
          style={styles.chatItem}
          onPress={() =>
            navigation.navigate("ChatScreen", {
              roomId: item.id,
              userName: item.name,
              userAvatar: item.avatar,
              otherUserId: item.otherUserId,
              adId: item.ad?.id,
              ad: item.ad,
            })
          }
          onLongPress={() => handleLongPress(item)}
          activeOpacity={0.7}
        >
          <Image
            source={
              item.avatar
                ? { uri: item.avatar }
                : require("../../assets/Images/avatar.jpg")
            }
            style={styles.avatar}
          />
          <View style={styles.chatContent}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>

            {item.ad && (
              <View style={styles.adPreviewInList}>
                {(item.ad.imageUrl ||
                  (item.ad.imageUrls && item.ad.imageUrls.length > 0)) && (
                  <Image
                    source={{ uri: item.ad.imageUrl ?? item.ad.imageUrls[0] }}
                    style={styles.adImageInList}
                  />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.adTitleInList} numberOfLines={1}>
                    {item.ad.title}
                  </Text>
                  <Text style={styles.adPriceInList}>${item.ad.price}</Text>
                </View>
              </View>
            )}

            <Text style={styles.message} numberOfLines={1}>
              {item.lastMessage || "No messages yet"}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
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
              : require("../../assets/Images/avatar.jpg")
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

      {/* Modal for chat options */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={[styles.modalBox, isDarkMode && styles.modalBoxDark]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>
              {selectedChat?.name}
            </Text>

            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonTop]}
              activeOpacity={0.7}
              onPress={() => {
                setModalVisible(false);
                navigation.navigate("ChatScreen", {
                  roomId: selectedChat?.id,
                  userName: selectedChat?.name,
                  otherUserId: selectedChat?.otherUserId,
                  userAvatar: selectedChat?.avatar,
                  adId: selectedChat?.ad?.id,
                  ad: selectedChat?.ad,
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

const baseStyles = {
  safe: { flex: 1 },
  header: {
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderColor: "#ccc",
    backgroundColor: "transparent",
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    flex: 1,
    color: "#222",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderRadius: 14,
    shadowColor: "#000",
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
    backgroundColor: "#ddd",
  },
  chatContent: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    color: "#666",
    opacity: 0.8,
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  deleteButton: {
    backgroundColor: "#e33057",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    marginVertical: 8,
    borderRadius: 14,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 25,
    paddingHorizontal: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  modalBoxDark: {
    backgroundColor: "#2c2c2c",
    shadowColor: "#000",
    shadowOpacity: 0.6,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 25,
    color: "#111",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  modalTitleDark: {
    color: "#eee",
  },
  modalButton: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: "#eaeaea",
  },
  modalButtonTop: {
    borderTopWidth: 0,
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: "#222",
  },
  modalButtonTextDark: {
    color: "#ddd",
  },
  modalDeleteButton: {
    borderTopWidth: 1,
    borderColor: "#e33057",
    backgroundColor: "transparent",
  },
  modalDeleteText: {
    color: "#e33057",
    fontWeight: "700",
  },
  unreadBadge: {
    backgroundColor: "#e33057",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },

  // Ad preview styles inside chat list
  adPreviewInList: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 4,
  },
  adImageInList: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: "#ddd",
  },
  adTitleInList: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    maxWidth: 150,
  },
  adPriceInList: {
    fontSize: 13,
    color: "#888",
  },
};

const lightStyles = StyleSheet.create({
  ...baseStyles,
  safe: { ...baseStyles.safe, backgroundColor: "#fff" },
  headerTitle: { ...baseStyles.headerTitle, color: "#222" },
  searchContainer: { ...baseStyles.searchContainer, backgroundColor: "#f0f0f0" },
  searchInput: { ...baseStyles.searchInput, color: "#333" },
  chatItem: { ...baseStyles.chatItem, backgroundColor: "#fff" },
  name: { ...baseStyles.name, color: "#111" },
  message: { ...baseStyles.message, color: "#666" },
  timestamp: { ...baseStyles.timestamp, color: "#999" },
  emptyText: { ...baseStyles.emptyText, color: "#999" },
});

const darkStyles = StyleSheet.create({
  ...baseStyles,
  safe: { ...baseStyles.safe, backgroundColor: "#121212" },
  headerTitle: { ...baseStyles.headerTitle, color: "#eee" },
  searchContainer: {
    ...baseStyles.searchContainer,
    backgroundColor: "#2a2a2a",
    shadowColor: "#000",
    shadowOpacity: 0.2,
  },
  searchInput: { ...baseStyles.searchInput, color: "#eee" },
  chatItem: {
    ...baseStyles.chatItem,
    backgroundColor: "#1e1e1e",
    shadowColor: "#000",
    shadowOpacity: 0.3,
  },
  name: { ...baseStyles.name, color: "#fff" },
  message: { ...baseStyles.message, color: "#ccc" },
  timestamp: { ...baseStyles.timestamp, color: "#aaa" },
  emptyText: { ...baseStyles.emptyText, color: "#777" },
  modalBox: {
    backgroundColor: "#1e1e1e",
    padding: 24,
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    color: "#fff",
  },
  modalButton: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#444",
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#eee",
    textAlign: "center",
  },
  modalDeleteButton: {
    borderColor: "#e33057",
  },
  modalDeleteText: {
    color: "#e33057",
  },
  adPreviewInList: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 4,
  },
  adImageInList: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: "#444",
  },
  adTitleInList: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ccc",
    maxWidth: 150,
  },
  adPriceInList: {
    fontSize: 13,
    color: "#aaa",
  },
});
