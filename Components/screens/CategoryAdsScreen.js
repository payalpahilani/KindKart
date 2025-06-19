import React, { useEffect, useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from "react-native";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { ThemeContext } from "../Utilities/ThemeContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function CategoryAdsScreen({ route, navigation }) {
  const { category } = route.params;
  const { isDarkMode } = useContext(ThemeContext);
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "items"),
      where("category", "==", category),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedItems = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const firstImage =
          Array.isArray(data.imageUrls) && data.imageUrls.length > 0
            ? data.imageUrls[0]
            : "https://via.placeholder.com/150";
        return {
          id: doc.id,
          ...data,
          firstImage,
        };
      });
      setAds(fetchedItems);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [category]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: isDarkMode ? "#121212" : "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: isDarkMode ? "#121212" : "#fff",
        padding: 16,
      }}
    >
      <Text
        style={{
          fontSize: 22,
          fontWeight: "bold",
          marginBottom: 16,
          color: isDarkMode ? "#eee" : "#23253A",
        }}
      >
        {category} Ads
      </Text>
      {ads.length === 0 ? (
        <Text style={{ color: "#888", fontSize: 16, textAlign: "center" }}>
          No ads found for this category.
        </Text>
      ) : (
        <FlatList
          data={ads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate("AdDetails", { ad: item })}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: isDarkMode ? "#1E1E1E" : "#fff",
                borderRadius: 10,
                padding: 10,
                marginBottom: 12,
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Image
                source={{ uri: item.firstImage }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 8,
                  marginRight: 12,
                }}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: 16,
                    color: isDarkMode ? "#eee" : "#23253A",
                  }}
                >
                  {item.title}
                </Text>
                <Text style={{ color: "#2CB67D", marginTop: 4 }}>
                  {item.price}
                </Text>
                <Text style={{ color: "#888", marginTop: 2 }}>
                  {item.pickupLocation}
                </Text>
              </View>
              <Icon name="chevron-right" size={24} color="#bbb" />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
