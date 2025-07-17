import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Platform,
  Share,
  ActivityIndicator,
  StatusBar,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import MapView, { Marker } from "react-native-maps";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { SafeAreaView } from "react-native-safe-area-context";
import { db, auth } from "../../firebaseConfig";
import { ThemeContext } from "../Utilities/ThemeContext";
import { useStripe } from "@stripe/stripe-react-native";

const { width } = Dimensions.get("window");

function InfoRow({ label, value, isDarkMode }) {
  let displayValue = value;
  if (value && typeof value === "object") {
    if ("label" in value) displayValue = value.label;
    else if ("value" in value) displayValue = value.value;
    else displayValue = JSON.stringify(value);
  }
  return (
    <View style={isDarkMode ? darkStyles.infoRow : lightStyles.infoRow}>
      <Text style={isDarkMode ? darkStyles.infoLabel : lightStyles.infoLabel}>
        {label}
      </Text>
      <Text style={isDarkMode ? darkStyles.infoValue : lightStyles.infoValue}>
        {displayValue}
      </Text>
    </View>
  );
}

export default function AdDetailsScreen({ route, navigation }) {
  const { ad } = route.params;
  const { isDarkMode } = useContext(ThemeContext);

  const [adData, setAdData] = useState(ad);
  const [selectedImage, setSelectedImage] = useState(
    ad.imageUrls && ad.imageUrls.length > 0 ? ad.imageUrls[0] : ad.firstImage
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("Seller");
  const [userAvatar, setUserAvatar] = useState(null);
  const [liked, setLiked] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Track current user ID for ownership check
  const [currentUserId, setCurrentUserId] = useState(null);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUserId(user ? user.uid : null);
    });
    return unsubscribe;
  }, []);

  // Ownership check
  const isOwner = currentUserId && adData && adData.userId === currentUserId;

  useEffect(() => {
    setLoading(true);
    const unsubscribeAd = onSnapshot(doc(db, "items", ad.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAdData({ id: docSnap.id, ...data });

        if (data.imageUrls && data.imageUrls.length > 0) {
          setSelectedImage(data.imageUrls[0]);
        } else if (data.firstImage) {
          setSelectedImage(data.firstImage);
        }
      }
      setLoading(false);
    });

    let unsubscribeUser = () => {};
    const userId = ad.userId || (adData && adData.userId);
    if (userId) {
      unsubscribeUser = onSnapshot(doc(db, "users", userId), (userSnap) => {
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserName(userData.name || "Seller");
          setUserAvatar(userData.avatarUrl || null);
        } else {
          setUserName("Seller");
          setUserAvatar(null);
        }
      });
    } else {
      setUserName("Seller");
      setUserAvatar(null);
    }

    const checkIfLiked = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const likedDoc = await getDoc(
        doc(db, "users", currentUser.uid, "liked", ad.id)
      );
      setLiked(likedDoc.exists());
    };
    checkIfLiked();

    return () => {
      unsubscribeAd();
      unsubscribeUser();
    };
    // eslint-disable-next-line
  }, [ad.id, ad.userId, adData?.userId]);

  const toggleLike = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const likeDocRef = doc(db, "users", currentUser.uid, "liked", ad.id);

    try {
      if (liked) {
        await deleteDoc(likeDocRef);
        setLiked(false);
      } else {
        await setDoc(likeDocRef, {
          adId: ad.id,
          title: ad.title || "",
          imageUrls: ad.imageUrls || [],
          price: ad.price || null,
          timestamp: serverTimestamp(),
        });
        setLiked(true);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const sendMessage = async () => {
    const currentUser = auth.currentUser;
    if (!message.trim() || !adData.userId || currentUser.uid === adData.userId)
      return;

    try {
      const roomsRef = collection(db, "chatRooms");
      const q = query(
        roomsRef,
        where("users", "array-contains", currentUser.uid)
      );
      const snap = await getDocs(q);

      let existingRoomId = null;
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.users.includes(adData.userId) && data.users.length === 2) {
          existingRoomId = docSnap.id;
        }
      });

      if (!existingRoomId) {
        const newRoom = await addDoc(roomsRef, {
          users: [currentUser.uid, adData.userId],
          lastMessage: "",
          lastUpdated: serverTimestamp(),
          userNames: {
            [currentUser.uid]: currentUser.displayName || "You",
            [adData.userId]: userName || "Seller",
          },
          createdAt: serverTimestamp(),
        });
        existingRoomId = newRoom.id;
      }

      await addDoc(collection(db, "chatRooms", existingRoomId, "messages"), {
        text: message.trim(),
        senderId: currentUser.uid,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "chatRooms", existingRoomId), {
        lastMessage: message.trim(),
        lastUpdated: serverTimestamp(),
      });

      setMessage("");
      navigation.navigate("ChatScreen", {
        roomId: existingRoomId,
        otherUserId: adData.userId,
        otherUserName: userName,
      });
    } catch (error) {
      console.error("Message send error:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this item: ${adData.title}\nPrice: ${adData.currency}-${adData.price}\n${adData.description}\n${selectedImage}`,
        url: selectedImage,
        title: adData.title,
      });
    } catch (error) {
      alert("Error sharing: " + error.message);
    }
  };

  const handleDelete = async () => {
    // Confirm delete (cross-platform)
    Alert.alert(
      "Delete Ad",
      "Are you sure you want to delete this ad?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "items", adData.id));
              alert("Ad deleted successfully.");
              navigation.goBack();
            } catch (err) {
              alert("Failed to delete ad. Please try again.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const statusBarStyle = isDarkMode ? "light-content" : "dark-content";
  const statusBarBg = isDarkMode ? "#121212" : "#fff";

  if (loading || !adData) {
    return (
      <View
        style={
          isDarkMode
            ? darkStyles.loadingContainer
            : lightStyles.loadingContainer
        }
      >
        <ActivityIndicator size="large" color="#2CB67D" />
      </View>
    );
  }

  // PAYMENT GATEWAY
  const handlePurchase = async () => {
    setPaymentLoading(true);
    try {
      // Call your backend to create a PaymentIntent
      const response = await fetch(
        "https://kindkart-0l245p6y.b4a.run/create-payment-intent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: adData.salePrice * 100, // Stripe uses cents
            currency: adData.currency?.value || adData.currency || "usd",
          }),
        }
      );
      const { clientSecret } = await response.json();

      // Initialize the payment sheet
      const initSheet = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "Kindkart",
        returnURL: "kindkartpay://stripe-redirect",
      });
      if (initSheet.error) throw initSheet.error;

      // Present the payment sheet
      const paymentResult = await presentPaymentSheet();
      if (paymentResult.error) throw paymentResult.error;

      alert("Payment successful!");
      // Optionally update your app state or Firestore here
    } catch (error) {
      alert(`Payment failed: ${error.message}`);
    }
    setPaymentLoading(false);
  };

  function getCurrencyLabel(currency) {
    if (!currency) return "";
    if (typeof currency === "object") {
      return currency.label || currency.value || "";
    }
    // If it's just a string like "usd"
    switch (currency.toLowerCase()) {
      case "usd":
        return "USD ($)";
      case "cad":
        return "CAD ($)";
      case "inr":
        return "INR (₹)";
      default:
        return currency.toUpperCase();
    }
  }

  return (
    <SafeAreaView
      style={isDarkMode ? darkStyles.safeArea : lightStyles.safeArea}
    >
      <StatusBar barStyle={statusBarStyle} backgroundColor={statusBarBg} />

      {/* Top Bar */}
      <View style={isDarkMode ? darkStyles.topBar : lightStyles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={isDarkMode ? darkStyles.backBtn : lightStyles.backBtn}
        >
          <Icon
            name="arrow-left"
            size={28}
            color={isDarkMode ? "#fff" : "#23253A"}
          />
        </TouchableOpacity>
        <View
          style={
            isDarkMode
              ? darkStyles.topRightButtons
              : lightStyles.topRightButtons
          }
        >
          <TouchableOpacity
            style={isDarkMode ? darkStyles.actionBtn : lightStyles.actionBtn}
            onPress={toggleLike}
          >
            <Icon
              name={liked ? "heart" : "heart-outline"}
              size={24}
              color={liked ? "#e63946" : "#2CB67D"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={isDarkMode ? darkStyles.actionBtn : lightStyles.actionBtn}
            onPress={handleShare}
          >
            <Icon
              name="share-variant"
              size={24}
              color={isDarkMode ? "#fff" : "#23253A"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          style={
            isDarkMode
              ? darkStyles.galleryContainer
              : lightStyles.galleryContainer
          }
        >
          <Image
            source={{ uri: selectedImage }}
            style={isDarkMode ? darkStyles.mainImage : lightStyles.mainImage}
            resizeMode="cover"
          />
          {adData.imageUrls && adData.imageUrls.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={
                isDarkMode ? darkStyles.thumbnailRow : lightStyles.thumbnailRow
              }
            >
              {adData.imageUrls.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedImage(img)}
                >
                  <Image
                    source={{ uri: img }}
                    style={[
                      isDarkMode ? darkStyles.thumbnail : lightStyles.thumbnail,
                      selectedImage === img && {
                        borderColor: "#2CB67D",
                        borderWidth: 2,
                      },
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View
          style={isDarkMode ? darkStyles.headingRow : lightStyles.headingRow}
        >
          <Text style={isDarkMode ? darkStyles.heading : lightStyles.heading}>
            {adData.title || "No title"}
          </Text>
          <Text style={isDarkMode ? darkStyles.price : lightStyles.price}>
            {adData.price
              ? `${getCurrencyLabel(adData.currency)} ${adData.salePrice}`
              : "No sale price"}
          </Text>
        </View>

        <Text
          style={
            isDarkMode ? darkStyles.sectionTitle : lightStyles.sectionTitle
          }
        >
          Description
        </Text>
        <Text
          style={isDarkMode ? darkStyles.description : lightStyles.description}
        >
          {adData.description || "No description provided."}
        </Text>

        <View
          style={
            isDarkMode
              ? darkStyles.userMessageCard
              : lightStyles.userMessageCard
          }
        >
          <View
            style={
              isDarkMode ? darkStyles.userInfoRow : lightStyles.userInfoRow
            }
          >
            <Image
              source={{ uri: userAvatar || "https://via.placeholder.com/60" }}
              style={
                isDarkMode ? darkStyles.userAvatar : lightStyles.userAvatar
              }
            />
            <Text
              style={isDarkMode ? darkStyles.userName : lightStyles.userName}
            >
              {userName}
            </Text>
          </View>
          <View
            style={isDarkMode ? darkStyles.messageBox : lightStyles.messageBox}
          >
            <TextInput
              style={isDarkMode ? darkStyles.input : lightStyles.input}
              placeholder="Send seller a message"
              placeholderTextColor={isDarkMode ? "#999" : "#aaa"}
              value={message}
              onChangeText={setMessage}
              multiline={true}
            />
            <TouchableOpacity
              style={
                isDarkMode ? darkStyles.sendButton : lightStyles.sendButton
              }
              onPress={sendMessage}
            >
              <Icon name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={isDarkMode ? darkStyles.detailsCard : lightStyles.detailsCard}
        >
          <Text
            style={
              isDarkMode ? darkStyles.detailsTitle : lightStyles.detailsTitle
            }
          >
            Details
          </Text>
          <InfoRow
            label="Category"
            value={adData.category || "Not specified"}
            isDarkMode={isDarkMode}
          />
          <InfoRow
            label="Condition"
            value={adData.condition || "Not specified"}
            isDarkMode={isDarkMode}
          />
          <InfoRow
            label="Price"
            value={
              adData.price
                ? `${getCurrencyLabel(adData.currency)} ${adData.price}`
                : "Not specified"
            }
            isDarkMode={isDarkMode}
          />
          <InfoRow
            label="Negotiable"
            value={
              adData.negotiable !== undefined
                ? adData.negotiable
                  ? "Yes"
                  : "No"
                : "Not specified"
            }
            isDarkMode={isDarkMode}
          />
        </View>

        <View
          style={isDarkMode ? darkStyles.detailsCard : lightStyles.detailsCard}
        >
          <Text
            style={
              isDarkMode ? darkStyles.detailsTitle : lightStyles.detailsTitle
            }
          >
            NGO & Cause
          </Text>
          <InfoRow
            label="NGO Name"
            value={adData.ngoName || adData.ngo || "Not specified"}
            isDarkMode={isDarkMode}
          />
          <InfoRow
            label="Cause"
            value={adData.causeName || "Not specified"}
            isDarkMode={isDarkMode}
          />
        </View>

        <View
          style={isDarkMode ? darkStyles.detailsCard : lightStyles.detailsCard}
        >
          <Text
            style={
              isDarkMode ? darkStyles.detailsTitle : lightStyles.detailsTitle
            }
          >
            Location
          </Text>
          <InfoRow
            label="Pickup"
            value={adData.pickupLocation || "Not specified"}
            isDarkMode={isDarkMode}
          />
        </View>

        <View style={isDarkMode ? darkStyles.mapCard : lightStyles.mapCard}>
          <MapView
            style={isDarkMode ? darkStyles.map : lightStyles.map}
            initialRegion={{
              latitude:
                adData?.pickupCoords?.latitude || adData.latitude || 28.6139,
              longitude:
                adData?.pickupCoords?.longitude || adData.longitude || 77.209,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker
              coordinate={{
                latitude:
                  adData?.pickupCoords?.latitude || adData.latitude || 28.6139,
                longitude:
                  adData?.pickupCoords?.longitude || adData.longitude || 77.209,
              }}
              title={adData.pickupLocation}
            />
          </MapView>
          <Text style={isDarkMode ? darkStyles.mapLabel : lightStyles.mapLabel}>
            {adData.pickupLocation || "No location"}
          </Text>
        </View>

        {/* Owner sees Edit/Delete, others see Purchase */}
        <View style={{ padding: 18 }}>
          {isOwner ? (
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: "#008060",
                  borderRadius: 10,
                  padding: 16,
                  alignItems: "center",
                  flex: 1,
                  marginRight: 8,
                }}
                onPress={() =>
                  navigation.navigate("EditListingScreen", { ad: adData })
                }
              >
                <Text
                  style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}
                >
                  Edit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: "#FF4D4F",
                  borderRadius: 10,
                  padding: 16,
                  alignItems: "center",
                  flex: 1,
                  marginLeft: 8,
                }}
                onPress={handleDelete}
              >
                <Text
                  style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={{
                backgroundColor: "#2CB67D",
                borderRadius: 10,
                padding: 16,
                alignItems: "center",
                opacity: paymentLoading ? 0.6 : 1,
              }}
              onPress={handlePurchase}
              disabled={paymentLoading}
            >
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 18 }}>
                {paymentLoading ? "Processing..." : "Purchase"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}


const lightStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  backBtn: {
    padding: 4,
  },
  topRightButtons: {
    flexDirection: "row",
  },
  actionBtn: {
    marginLeft: 18,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F6F6F6",
  },
  galleryContainer: {
    backgroundColor: "#f6f6f6",
    borderRadius: 18,
    paddingBottom: 12,
    paddingTop: 30,
    paddingLeft: 30,
    paddingRight: 30,
    alignItems: "center",
    overflow: "hidden",
  },
  mainImage: {
    width: "100%",
    height: width * 0.55,
    borderRadius: 18,
    backgroundColor: "#eee",
  },
  thumbnailRow: {
    flexDirection: "row",
    marginTop: 10,
    paddingHorizontal: 12,
  },
  thumbnail: {
    width: 54,
    height: 54,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: "#eee",
  },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 4,
    paddingHorizontal: 18,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#23253A",
    flex: 1,
    marginRight: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2CB67D",
  },
  sectionTitle: {
    fontWeight: "600",
    fontSize: 18,
    color: "#23253A",
    marginTop: 18,
    marginBottom: 4,
    paddingHorizontal: 18,
  },
  description: {
    fontSize: 16,
    color: "#444",
    marginBottom: 8,
    paddingHorizontal: 18,
  },
  userMessageCard: {
    backgroundColor: "#fff",
    marginHorizontal: 18,
    marginVertical: 16,
    borderRadius: 12,
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ccc",
    marginRight: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#23253A",
  },
  messageBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F6F6",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#23253A",
    paddingVertical: 6,
    backgroundColor: "transparent",
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#2CB67D",
    borderRadius: 8,
    padding: 10,
    marginLeft: 8,
  },
  detailsCard: {
    backgroundColor: "#F6F6F6",
    borderRadius: 12,
    marginHorizontal: 18,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  detailsTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#23253A",
    marginBottom: 6,
  },
  mapCard: {
    borderRadius: 14,
    overflow: "hidden",
    marginHorizontal: 18,
    marginVertical: 10,
    backgroundColor: "#eee",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  map: {
    width: "100%",
    height: 140,
  },
  mapLabel: {
    padding: 10,
    fontSize: 14,
    color: "#23253A",
    fontWeight: "500",
    backgroundColor: "#fff",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderTopWidth: 1,
    borderColor: "#e0e0e0",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 2,
  },
  infoLabel: {
    fontWeight: "600",
    fontSize: 15,
    color: "#23253A",
    minWidth: 90,
  },
  infoValue: {
    fontSize: 15,
    color: "#23253A",
    flex: 1,
    flexWrap: "wrap",
  },
});

const darkStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121212",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#222",
    backgroundColor: "#121212",
  },
  backBtn: {
    padding: 4,
  },
  topRightButtons: {
    flexDirection: "row",
  },
  actionBtn: {
    marginLeft: 18,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#1E1E1E",
  },
  galleryContainer: {
    backgroundColor: "#1E1E1E",
    borderRadius: 18,
    paddingBottom: 12,
    paddingTop: 30,
    paddingLeft: 30,
    paddingRight: 30,
    alignItems: "center",
    overflow: "hidden",
  },
  mainImage: {
    width: "100%",
    height: width * 0.55,
    borderRadius: 18,
    backgroundColor: "#2A2A2A",
  },
  thumbnailRow: {
    flexDirection: "row",
    marginTop: 10,
    paddingHorizontal: 12,
  },
  thumbnail: {
    width: 54,
    height: 54,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: "#2A2A2A",
  },
  headingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 4,
    paddingHorizontal: 18,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
    marginRight: 8,
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2CB67D",
  },
  sectionTitle: {
    fontWeight: "600",
    fontSize: 18,
    color: "#FFFFFF",
    marginTop: 18,
    marginBottom: 4,
    paddingHorizontal: 18,
  },
  description: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 8,
    paddingHorizontal: 18,
  },
  userMessageCard: {
    backgroundColor: "#333333",
    marginHorizontal: 18,
    marginVertical: 16,
    borderRadius: 12,
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#444",
    marginRight: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  messageBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    paddingVertical: 6,
    backgroundColor: "transparent",
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#2CB67D",
    borderRadius: 8,
    padding: 10,
    marginLeft: 8,
  },
  detailsCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    marginHorizontal: 18,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#333",
  },
  detailsTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 6,
  },
  mapCard: {
    borderRadius: 14,
    overflow: "hidden",
    marginHorizontal: 18,
    marginVertical: 10,
    backgroundColor: "#2A2A2A",
    borderWidth: 1,
    borderColor: "#333",
  },
  map: {
    width: "100%",
    height: 140,
  },
  mapLabel: {
    padding: 10,
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "500",
    backgroundColor: "#121212",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderTopWidth: 1,
    borderColor: "#333",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingVertical: 2,
  },
  infoLabel: {
    fontWeight: "600",
    fontSize: 15,
    color: "#fff",
    minWidth: 90,
  },
  infoValue: {
    fontSize: 15,
    color: "#fff",
    flex: 1,
    flexWrap: "wrap",
  },
});
