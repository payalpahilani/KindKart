import React, { useEffect, useState, useContext } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { ThemeContext } from "../Utilities/ThemeContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// You can import AdGridCard from MarketplaceScreen.js if you export it

const { width } = Dimensions.get("window");

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
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
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
      },
      (error) => {
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [category]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2CB67D" />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDarkMode ? "#121212" : "#fff" }}
    >
      <FlatList
        data={ads}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <AdGridCard
            ad={item}
            st={isDarkMode ? dark : light}
            navigation={navigation}
          />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListEmptyComponent={
          <Text
            style={{
              color: "#888",
              fontSize: 16,
              textAlign: "center",
              marginTop: 40,
            }}
          >
            No ads in this category yet.
          </Text>
        }
      />
    </SafeAreaView>
  );
}

// You can reuse the AdGridCard from MarketplaceScreen.js
