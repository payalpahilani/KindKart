import React, { useState, useEffect } from "react";
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
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import MapView, { Marker } from "react-native-maps";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const { width } = Dimensions.get("window");

// Helper component for info rows
function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function AdDetailsScreen({ route, navigation }) {
  const { ad } = route.params;
  const [adData, setAdData] = useState(ad);
  const [selectedImage, setSelectedImage] = useState(
    ad.imageUrls && ad.imageUrls.length > 0 ? ad.imageUrls[0] : ad.firstImage
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userContact, setUserContact] = useState("Not specified");

  // Real-time Firestore listeners for ad and user
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

    return () => unsubscribeAd();
    // eslint-disable-next-line
  }, ad.id);

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

  // Helper to format Firestore Timestamp
  const formatDate = (ts) => {
    if (!ts) return "Not specified";
    try {
      if (typeof ts.toDate === "function") {
        return ts.toDate().toLocaleString();
      } else if (typeof ts === "string") {
        return new Date(ts).toLocaleString();
      }
      return String(ts);
    } catch {
      return String(ts);
    }
  };

  if (loading || !adData) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2CB67D" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.galleryContainer}>
          <Image
            source={{ uri: selectedImage }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          {adData.imageUrls && adData.imageUrls.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.thumbnailRow}
            >
              {adData.imageUrls.map((img, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedImage(img)}
                >
                  <Image
                    source={{ uri: img }}
                    style={[
                      styles.thumbnail,
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

        {/* Product Heading and Price */}
        <View style={styles.headingRow}>
          <Text style={styles.heading}>{adData.title || "No title"}</Text>
          <Text style={styles.price}>
            {adData.price
              ? `${adData.price} ${adData.currency || ""}`
              : "No price"}
          </Text>
        </View>

        {/* Description */}
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>
          {adData.description || "No description provided."}
        </Text>

        {/* Message Seller */}
        <View style={styles.messageBox}>
          <TextInput
            style={styles.input}
            placeholder="Send seller a message"
            value={message}
            onChangeText={setMessage}
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity style={styles.sendButton}>
            <Icon name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Details Table */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Details</Text>
          <InfoRow
            label="Category"
            value={adData.category || "Not specified"}
          />
          <InfoRow
            label="Condition"
            value={adData.condition || "Not specified"}
          />
          <InfoRow
            label="Sale Price"
            value={adData.salePrice ? `${adData.salePrice}` : "Not specified"}
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
          />
        </View>

        {/* NGO and Cause */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>NGO & Cause</Text>
          <InfoRow
            label="NGO Name"
            value={adData.ngoName || adData.ngo || "Not specified"}
          />
          <InfoRow
            label="Cause"
            value={adData.ngoCause || adData.cause || "Not specified"}
          />
        </View>

        {/* Location */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Location</Text>
          <InfoRow
            label="Pickup Location"
            value={adData.pickupLocation || "Not specified"}
          />
          <InfoRow label="Address" value={adData.address || "Not specified"} />
        </View>
        <View style={styles.mapCard}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude:
                (adData.pickupCoords && adData.pickupCoords.latitude) ||
                adData.latitude ||
                28.6139,
              longitude:
                (adData.pickupCoords && adData.pickupCoords.longitude) ||
                adData.longitude ||
                77.209,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker
              coordinate={{
                latitude:
                  (adData.pickupCoords && adData.pickupCoords.latitude) ||
                  adData.latitude ||
                  28.6139,
                longitude:
                  (adData.pickupCoords && adData.pickupCoords.longitude) ||
                  adData.longitude ||
                  77.209,
              }}
              title={adData.pickupLocation}
            />
          </MapView>
          <Text style={styles.mapLabel}>
            {adData.pickupLocation || "No location"}
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionBtn}>
          <Icon name="heart-outline" size={24} color="#2CB67D" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Icon name="share-variant" size={24} color="#23253A" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  galleryContainer: {
    backgroundColor: "#f6f6f6",
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    paddingBottom: 12,
    alignItems: "center",
  },
  mainImage: {
    width: width,
    height: width * 0.55,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
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
  messageBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F6F6",
    borderRadius: 10,
    marginHorizontal: 18,
    marginVertical: 14,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "ios" ? 12 : 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#23253A",
    paddingVertical: 6,
    backgroundColor: "transparent",
  },
  sendButton: {
    backgroundColor: "#2CB67D",
    borderRadius: 8,
    padding: 8,
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
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
    alignItems: "center",
  },
  infoLabel: {
    fontWeight: "600",
    color: "#23253A",
    fontSize: 14,
    width: 120,
  },
  infoValue: {
    color: "#444",
    fontSize: 14,
    flex: 1,
    flexWrap: "wrap",
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
  actionBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 14,
    borderTopWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
  },
  actionBtn: {
    marginLeft: 18,
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F6F6F6",
  },
});
