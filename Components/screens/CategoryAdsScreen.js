import React, { useEffect, useState, useContext } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  Dimensions,
  TouchableOpacity,
  Platform,
  Image
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


const { width } = Dimensions.get("window");

const light = {
  gridCard: {
    flex: 1,
    margin: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    minWidth: (width - 48) / 2,
    maxWidth: (width - 48) / 2,
  },
  gridImage: {
    width: "100%",
    height: 120,
    backgroundColor: "#eee",
  },
  gridTitle: {
    fontWeight: "700",
    fontSize: 15,
    marginTop: 8,
    marginHorizontal: 8,
    color: "#23253A",
  },
  gridPrice: {
    fontWeight: "600",
    fontSize: 14,
    marginHorizontal: 8,
    marginBottom: 4,
    color: "#2CB67D",
  },
};

const dark = {
  gridCard: {
    ...light.gridCard,
    backgroundColor: "#1E1E1E",
    shadowColor: "#000",
  },
  gridImage: {
    ...light.gridImage,
    backgroundColor: "#222",
  },
  gridTitle: {
    ...light.gridTitle,
    color: "#fff",
  },
  gridPrice: {
    ...light.gridPrice,
    color: "#4CAF50",
  },
};

function AdGridCard({ ad, st, navigation }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => navigation.navigate("AdDetails", { ad })}
      style={{ flex: 1 }}
    >
      <View style={st.gridCard}>
        <Image source={{ uri: ad.firstImage }} style={st.gridImage} />
        <Text style={st.gridTitle}>{ad.title}</Text>
        {/* Price with currency in green */}
        <Text style={[st.gridPrice, { color: "#2CB67D", marginBottom: 2 }]}>
          {ad.price ? `${ad.currency.label || ""} ${ad.price}` : ""}
        </Text>
        {/* Location in red, below price */}
        {ad.pickupLocation ? (
          <Text style={{ color: "#FF4D4F", fontSize: 13, marginBottom: 4 }}>
            {ad.pickupLocation}
          </Text>
        ) : null}
        <TouchableOpacity
          onPress={() => handleShare(ad)}
          style={{ position: "absolute", top: 8, right: 8 }}
        >
          <Icon name="share-variant" size={18} color="#A0A0A0" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function CategoryAdsScreen({ route, navigation }) {
  const { category } = route.params;
  const { isDarkMode } = useContext(ThemeContext);

  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "items"),
      where("category.value", "==", category),
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

  const styles = isDarkMode ? dark : light;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: isDarkMode ? "#121212" : "#fff",
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: Platform.OS === "ios" ? 48 : 18,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: isDarkMode ? "#222" : "#eee",
          backgroundColor: isDarkMode ? "#121212" : "#fff",
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 6, marginRight: 8 }}
        >
          <Icon
            name="arrow-left"
            size={26}
            color={isDarkMode ? "#fff" : "#23253A"}
          />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 19,
            fontWeight: "bold",
            color: isDarkMode ? "#fff" : "#23253A",
            flex: 1,
          }}
        >
          {category}
        </Text>
      </View>

      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#2CB67D" />
        </View>
      ) : (
        <FlatList
          data={ads}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <AdGridCard ad={item} st={styles} navigation={navigation} />
          )}
          contentContainerStyle={{ padding: 8, paddingBottom: 32 }}
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
      )}
    </SafeAreaView>
  );
}
