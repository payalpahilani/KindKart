import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig"; // Adjust path as needed
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { ThemeContext } from "../Utilities/ThemeContext"; // Your existing theme context
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";

export default function SellerDetailScreen({ route, navigation }) {
  const { userId } = route.params;
  const { isDarkMode } = useContext(ThemeContext);

  const [seller, setSeller] = useState(null);
  const [ads, setAds] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingSeller, setLoadingSeller] = useState(true);
  const [loadingAds, setLoadingAds] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch seller profile
  useEffect(() => {
    setLoadingSeller(true);
    const unsubscribe = onSnapshot(
      doc(db, "users", userId),
      (docSnap) => {
        if (docSnap.exists()) {
          setSeller({ id: docSnap.id, ...docSnap.data() });
          setError(null);
        } else {
          setSeller(null);
          setError("Seller not found");
        }
        setLoadingSeller(false);
      },
      (err) => {
        setError("Failed to load seller profile");
        setLoadingSeller(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Fetch seller ads
  const fetchAds = async () => {
    try {
      setLoadingAds(true);
      const q = query(collection(db, "items"), where("userId", "==", userId));
      const snap = await getDocs(q);
      const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAds(items);
      setError(null);
    } catch (err) {
      setError("Failed to load ads");
    } finally {
      setLoadingAds(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, [userId]);

  // Fetch recent reviews
  useEffect(() => {
    if (!userId) return;
    setLoadingReviews(true);
    const reviewsRef = collection(db, "users", userId, "reviews");
    const unsubscribe = onSnapshot(reviewsRef, (snap) => {
      const docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const sorted = docs.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );
      setReviews(sorted);
      setLoadingReviews(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Pull to refresh handler
  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([fetchAds()]).finally(() => setRefreshing(false));
  };

  // Loading UI for seller profile
  if (loadingSeller) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          isDarkMode ? darkStyles.container : lightStyles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#2CB67D" />
      </SafeAreaView>
    );
  }

  // Error UI
  if (error && !seller) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          isDarkMode ? darkStyles.container : lightStyles.container,
          {
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          },
        ]}
      >
        <Text
          style={[
            styles.errorText,
            isDarkMode ? darkStyles.errorText : lightStyles.errorText,
            { textAlign: "center" },
          ]}
        >
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setError(null);
            setLoadingSeller(true);
            setLoadingAds(true);
            fetchAds();
          }}
          style={[
            styles.retryButton,
            {
              marginTop: 16,
              backgroundColor: "#2CB67D",
              padding: 10,
              borderRadius: 8,
            },
          ]}
        >
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // No seller info
  if (!seller) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          isDarkMode ? darkStyles.container : lightStyles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text
          style={[
            styles.infoText,
            isDarkMode ? darkStyles.infoText : lightStyles.infoText,
          ]}
        >
          No seller information available.
        </Text>
      </SafeAreaView>
    );
  }

  const reviewCount = reviews.length;
  const averageRating = reviewCount
    ? (
        reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount
      ).toFixed(1)
    : null;

  return (
    <SafeAreaView
      style={[
        styles.container,
        isDarkMode ? darkStyles.container : lightStyles.container,
      ]}
    >
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon
            name="arrow-left"
            size={26}
            color={isDarkMode ? "#fff" : "#23253A"}
          />
        </TouchableOpacity>

        {/* Seller Profile */}
        <View style={styles.profileContainerRow}>
          <Image
            source={{
              uri: seller.avatarUrl || "https://via.placeholder.com/120",
            }}
            style={styles.profileImageSmall}
            resizeMode="cover"
            defaultSource={require("../../assets/Images/avatar.jpg")}
          />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Text
                style={[
                  styles.sellerName,
                  isDarkMode ? darkStyles.sellerName : lightStyles.sellerName,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {seller.name || "Unnamed Seller"}
              </Text>
              {averageRating && (
                <View style={styles.sellerRatingRow}>
                  <Text
                    style={[
                      styles.sellerRatingText,
                      isDarkMode
                        ? darkStyles.sellerRatingText
                        : lightStyles.sellerRatingText,
                    ]}
                  >
                    {averageRating}
                  </Text>
                  <Icon
                    name="star"
                    size={16}
                    color="#f6c700"
                    style={{ marginLeft: 2, marginTop: 1 }}
                  />
                  <Text
                    style={[
                      styles.sellerRatingCount,
                      isDarkMode
                        ? darkStyles.sellerRatingCount
                        : lightStyles.sellerRatingCount,
                    ]}
                  >
                    ({reviewCount})
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.sellerEmail,
                isDarkMode ? darkStyles.sellerEmail : lightStyles.sellerEmail,
              ]}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {seller.email || "Email not available"}
            </Text>
            {seller.bio ? (
              <Text
                style={[
                  styles.sellerBio,
                  isDarkMode ? darkStyles.sellerBio : lightStyles.sellerBio,
                  { marginTop: 8 },
                ]}
                numberOfLines={3}
                ellipsizeMode="tail"
              >
                {seller.bio}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Reviews Header */}
        <View style={styles.reviewsHeaderRow}>
          <Text
            style={[
              styles.reviewSectionTitle,
              isDarkMode ? darkStyles.sectionTitle : lightStyles.sectionTitle,
            ]}
          >
            Recent Reviews
          </Text>
          {reviews.length > 0 && (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("AllReviewsScreen", { userId })
              }
              activeOpacity={0.7}
              style={styles.allReviewsButton}
            >
              <Text
                style={[
                  styles.allReviewsText,
                  isDarkMode
                    ? darkStyles.allReviewsText
                    : lightStyles.allReviewsText,
                ]}
              >
                All Reviews
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal Scrollable Reviews */}
        {loadingReviews ? (
          <ActivityIndicator
            size="small"
            color="#2CB67D"
            style={{ marginVertical: 10 }}
          />
        ) : reviews.length === 0 ? (
          <Text
            style={{
              color: isDarkMode ? "#888" : "#777",
              fontStyle: "italic",
              marginTop: 6,
              marginLeft: 20,
            }}
          >
            No reviews yet.
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.reviewsScrollContainer}
          >
            {reviews.slice(0, 2).map((review, idx) => (
              <LinearGradient
                key={review.id || idx}
                colors={
                  isDarkMode
                    ? ["#191b24", "#23253a"] // a subtle dark for dark mode; you can fine-tune
                    : ["#F5EEE6", "#E9F6F8", "#CDE7F0"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.reviewCard,
                  isDarkMode ? darkStyles.reviewCard : lightStyles.reviewCard,
                ]}
              >
                <View style={styles.reviewHeader}>
                  <Image
                    source={
                      review.reviewerAvatar && review.reviewerAvatar.length > 0
                        ? { uri: review.reviewerAvatar }
                        : require("../../assets/Images/avatar.jpg")
                    }
                    style={styles.reviewerAvatar}
                  />

                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text
                      style={[
                        styles.reviewerName,
                        isDarkMode
                          ? darkStyles.reviewerName
                          : lightStyles.reviewerName,
                      ]}
                      numberOfLines={1}
                    >
                      {review.reviewerName || "Anonymous"}
                    </Text>

                    <View style={{ flexDirection: "row", marginTop: 2 }}>
                      {Array.from({ length: review.rating || 5 }).map(
                        (_, i) => (
                          <Icon key={i} name="star" size={16} color="#f6c700" />
                        )
                      )}
                    </View>
                  </View>
                </View>
                {review.tags && review.tags.length > 0 && (
                  <View style={styles.reviewTagsContainer}>
                    {review.tags.map((tag, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.reviewTag,
                          isDarkMode
                            ? darkStyles.reviewTag
                            : lightStyles.reviewTag,
                        ]}
                      >
                        <Text
                          style={[
                            styles.reviewTagText,
                            isDarkMode
                              ? darkStyles.reviewTagText
                              : lightStyles.reviewTagText,
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                <Text
                  style={[
                    styles.reviewText,
                    isDarkMode ? darkStyles.reviewText : lightStyles.reviewText,
                  ]}
                  numberOfLines={3}
                  ellipsizeMode="tail"
                >
                  {review.text}{" "}
                </Text>
              </LinearGradient>
            ))}
          </ScrollView>
        )}
        {/* Seller Ads */}
        <View style={styles.adsContainer}>
          <Text
            style={[
              styles.sectionTitle,
              isDarkMode ? darkStyles.sectionTitle : lightStyles.sectionTitle,
            ]}
          >
            Ads by Seller ({ads.length})
          </Text>

          {loadingAds && (
            <ActivityIndicator
              size="small"
              color="#2CB67D"
              style={{ marginVertical: 12 }}
            />
          )}

          {!loadingAds && ads.length === 0 && (
            <Text
              style={[
                styles.infoText,
                isDarkMode ? darkStyles.infoText : lightStyles.infoText,
              ]}
            >
              This seller has no ads currently.
            </Text>
          )}

          {ads.map((ad) => (
            <TouchableOpacity
              key={ad.id}
              style={[
                styles.adCard,
                isDarkMode ? darkStyles.adCard : lightStyles.adCard,
              ]}
              onPress={() => navigation.navigate("AdDetailsScreen", { ad })}
              activeOpacity={0.8}
            >
              <Image
                source={{
                  uri:
                    (ad.imageUrls && ad.imageUrls[0]) ||
                    ad.firstImage ||
                    "https://via.placeholder.com/80",
                }}
                style={styles.adImage}
                resizeMode="cover"
                defaultSource={require("../../assets/Images/avatar.jpg")}
              />
              <View style={styles.adInfo}>
                <Text
                  style={[
                    styles.adTitle,
                    isDarkMode ? darkStyles.adTitle : lightStyles.adTitle,
                  ]}
                  numberOfLines={1}
                >
                  {ad.title || "Untitled"}
                </Text>
                <Text
                  style={[
                    styles.adPrice,
                    isDarkMode ? darkStyles.adPrice : lightStyles.adPrice,
                  ]}
                >
                  {ad.price != null
                    ? `${
                        ad.currency ? ad.currency.label || ad.currency : "USD"
                      } ${ad.price}`
                    : "Price not listed"}
                </Text>
              </View>
              <Icon
                name="chevron-right"
                size={24}
                color={isDarkMode ? "#ccc" : "#888"}
                style={{ alignSelf: "center" }}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const PROFILE_IMAGE_SIZE_SMALL = 80;
const AD_IMAGE_SIZE = 80;

const styles = StyleSheet.create({
  container: { flex: 1 },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 18,
  },

  backButtonText: {
    fontSize: 18,
    marginLeft: 8,
    fontWeight: "500",
  },

  profileContainerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    marginTop: 8,
    marginBottom: 32,
  },

  profileImageSmall: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ccc",
  },

  sellerName: {
    fontSize: 24,
    fontWeight: "bold",
  },

  sellerEmail: {
    marginTop: 4,
    fontSize: 15,
  },

  sellerBio: {
    marginTop: 8,
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "left",
    maxWidth: "100%",
  },

  reviewsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 12,
    marginTop: 8,
    fontSize: 16
  },

  allReviewsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  allReviewsText:{
    fontSize:16,
    color: "#2CB67D",
  },

  allReviewsButtonText: {
    fontWeight: "600",
    fontSize: 15,
    color: "#2CB67D",
    marginRight: 4,
  },

  reviewsScrollContainer: {
    paddingLeft: 18,
    paddingRight: 12,
  },

  reviewSectionTitle:{
    fontSize:18,
  },

  reviewCard: {
    width: 280,
    borderRadius: 14,
    padding: 14,
    marginRight: 14,
    backgroundColor: "#fff", // Override for dark mode below
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    // Android elevation
    elevation: 4,
  },

  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  reviewerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ccc",
  },

  reviewerName: {
    fontSize: 17,
    fontWeight: "600",
  },

  reviewText: {
    fontSize: 15,
    lineHeight: 20,
  },

  adsContainer: {
    paddingHorizontal: 18,
    marginTop: 16,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },

  adCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },

  adImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#ddd",
  },

  adInfo: {
    flex: 1,
    marginLeft: 16,
  },

  adTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 4,
  },

  adPrice: {
    fontSize: 15,
  },

  errorText: {
    fontSize: 16,
    color: "#FF4D4F",
  },

  infoText: {
    fontSize: 16,
    color: "#888",
  },

  retryButton: {
    alignSelf: "center",
  },

  sellerRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    marginTop: 2,
  },

  sellerRatingText: {
    fontSize: 16,
    fontWeight: "600",
  },

  sellerRatingCount: {
    fontSize: 16,
    fontWeight: "400",
    marginLeft: 2,
    opacity: 0.7,
  },
  reviewTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },

  reviewTag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 6,
  },
  reviewTagText: {
    fontSize: 13,
    fontWeight: "600",
  },
});

// Light mode styles
const lightStyles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
  },
  backButtonText: {
    color: "#23253A",
  },
  sellerName: {
    color: "#23253A",
  },
  sellerEmail: {
    color: "#666",
  },
  sellerBio: {
    color: "#444",
  },
  sectionTitle: {
    color: "#23253A",
  },
  adCard: {
    borderColor: "#e0e0e0",
    backgroundColor: "#fefefe",
  },
  adTitle: {
    color: "#23253A",
  },
  adPrice: {
    color: "#2CB67D",
  },
  errorText: {
    color: "#D32F2F",
  },
  infoText: {
    color: "#555",
  },
  reviewerName: {
    color: "#23253A",
  },
  reviewText: {
    color: "#23253A",
  },
  allReviewsButtonText: {
    color: "#2CB67D",
  },
  reviewCard: {
    backgroundColor: "#fff",
  },
  sellerRatingText: {
    color: "#23253A",
  },
  sellerRatingCount: {
    color: "#23253A",
  },
  reviewTag: {
    borderColor: "#2CB67D",
    backgroundColor: "#E6F4EA",
  },
  reviewTagText: {
    color: "#2CB67D",
  },
});

// Dark mode styles
const darkStyles = StyleSheet.create({
  container: {
    backgroundColor: "#121212",
  },
  backButtonText: {
    color: "#fff",
  },
  sellerName: {
    color: "#fff",
  },
  sellerEmail: {
    color: "#aaa",
  },
  sellerBio: {
    color: "#CCC",
  },
  sectionTitle: {
    color: "#fff",
  },
  adCard: {
    borderColor: "#333",
    backgroundColor: "#1E1E1E",
  },
  adTitle: {
    color: "#fff",
  },
  adPrice: {
    color: "#2CB67D",
  },
  errorText: {
    color: "#FF8A80",
  },
  infoText: {
    color: "#aaa",
  },
  reviewerName: {
    color: "#fff",
  },
  reviewText: {
    color: "#ddd",
  },
  allReviewsButtonText: {
    color: "#2CB67D",
  },
  reviewCard: {
    backgroundColor: "#1E1E1E",
    shadowColor: "transparent",
    elevation: 0,
  },
  sellerRatingText: {
    color: "#fff",
  },
  sellerRatingCount: {
    color: "#fff",
  },
  reviewTag: {
    borderColor: "#4CAF50",
    backgroundColor: "#2C3E26",
  },
  reviewTagText: {
    color: "#A5D6A7",
  },
});
