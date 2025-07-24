
import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig"; // Adjust path as needed
import { collection, onSnapshot } from "firebase/firestore";
import { ThemeContext } from "../Utilities/ThemeContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";

export default function AllReviewsScreen({ route, navigation }) {
  const { userId } = route.params;
  const { isDarkMode } = useContext(ThemeContext);

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all reviews for the seller
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    const reviewsRef = collection(db, "users", userId, "reviews");
    const unsub = onSnapshot(reviewsRef, (snap) => {
      const docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const sorted = docs.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );
      setReviews(sorted);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

 const renderReview = ({ item }) => (
   <LinearGradient
     colors={
       isDarkMode ? ["#191b24", "#23253a"] : ["#F5EEE6", "#E9F6F8", "#CDE7F0"]
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
         source={{
           uri: item.reviewerAvatar || "https://via.placeholder.com/40",
         }}
         style={styles.reviewerAvatar}
       />
       <View style={{ marginLeft: 12, flex: 1 }}>
         <Text
           style={[
             styles.reviewerName,
             isDarkMode ? darkStyles.reviewerName : lightStyles.reviewerName,
           ]}
           numberOfLines={1}
         >
           {item.reviewerName || "Anonymous"}
         </Text>

         <View style={{ flexDirection: "row", marginTop: 2 }}>
           {Array.from({ length: item.rating || 5 }).map((_, i) => (
             <Icon key={i} name="star" size={17} color="#f6c700" />
           ))}
         </View>
       </View>

       {item.createdAt && (
         <Text
           style={[
             styles.dateText,
             isDarkMode ? darkStyles.dateText : lightStyles.dateText,
           ]}
         >
           {formatDate(item.createdAt.seconds)}{" "}
         </Text>
       )}
     </View>
     {item.tags && item.tags.length > 0 && (
       <View style={styles.reviewTagsContainer}>
         {item.tags.map((tag, idx) => (
           <View
             key={idx}
             style={[
               styles.reviewTag,
               isDarkMode ? darkStyles.reviewTag : lightStyles.reviewTag,
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
     >
       {item.text}
     </Text>
   </LinearGradient>
 );


  function formatDate(seconds) {
    const date = new Date(seconds * 1000);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        isDarkMode ? darkStyles.container : lightStyles.container,
      ]}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Icon
            name="arrow-left"
            size={26}
            color={isDarkMode ? "#fff" : "#23253A"}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            isDarkMode ? darkStyles.headerTitle : lightStyles.headerTitle,
          ]}
        >
          All Reviews
        </Text>
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#2CB67D" />
        </View>
      ) : reviews.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", marginTop: 50 }}>
          <Text
            style={[
              styles.noReviewsText,
              isDarkMode ? darkStyles.noReviewsText : lightStyles.noReviewsText,
            ]}
          >
            No reviews yet.
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{
            padding: 18,
            paddingTop: 2,
            paddingBottom: 30,
          }}
          data={reviews}
          renderItem={renderReview}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: "#ececec",
  },
  backBtn: {
    padding: 4,
    marginRight: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    flex: 1,
    textAlign: "left",
    marginLeft: 8,
  },
  reviewCard: {
    borderRadius: 14,
    padding: 15,
    marginBottom: 16,
    backgroundColor: "#fff", // updated in dark mode below
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.11,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 4,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewerAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#eee",
  },
  reviewerName: {
    fontSize: 17,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 13,
    color: "#aaa",
    marginLeft: 12,
    alignSelf: "flex-start",
  },
  reviewText: {
    fontSize: 15,
    lineHeight: 21,
    marginLeft: 2,
  },
  noReviewsText: {
    fontSize: 16,
    color: "#999",
    marginTop: 30,
    fontStyle: "italic",
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

// Light mode
const lightStyles = StyleSheet.create({
  container: { backgroundColor: "#fff" },
  headerTitle: { color: "#23253A" },
  noReviewsText: { color: "#888" },
  reviewerName: { color: "#23253A" },
  reviewText: { color: "#23253A" },
  dateText: { color: "#888" },
  reviewCard: { backgroundColor: "#fff" },
  reviewTag: {
    borderColor: "#2CB67D",
    backgroundColor: "#E6F4EA",
  },
  reviewTagText: {
    color: "#2CB67D",
  },
});

// Dark mode
const darkStyles = StyleSheet.create({
  container: { backgroundColor: "#121212" },
  headerTitle: { color: "#fff" },
  noReviewsText: { color: "#aaa" },
  reviewerName: { color: "#fff" },
  reviewText: { color: "#fff" },
  dateText: { color: "#bbb" },
  reviewCard: {
    backgroundColor: "#1E1E1E",
    shadowColor: "transparent",
    elevation: 0,
  },
  reviewTag: {
    borderColor: "#4CAF50",
    backgroundColor: "#2C3E26",
  },
  reviewTagText: {
    color: "#A5D6A7",
  },
});
