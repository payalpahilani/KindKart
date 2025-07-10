import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ThemeContext } from "../Utilities/ThemeContext";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db, auth } from "../../firebaseConfig";
import { doc, setDoc, collection, getDocs } from "firebase/firestore";

const categories = [
  { label: "Donation", icon: "hand-heart" },
  { label: "Charity", icon: "charity" },
  { label: "Campaign", icon: "bullhorn" },
  { label: "Support", icon: "lifebuoy" },
];

const DonateButton = ({ onPress, title, isDarkMode }) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.donateButton, isDarkMode && styles.donateButtonDark]}
  >
    <Text
      style={[
        styles.donateButtonText,
        isDarkMode && styles.donateButtonTextDark,
      ]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

export default function HomeScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const [urgentDonations, setUrgentDonations] = useState([]);
  const [nonUrgentDonations, setNonUrgentDonations] = useState([]);
  const [showAllOthers, setShowAllOthers] = useState(false);


  const [randomBanner, setRandomBanner] = useState(null);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "campaigns"));
        const allCampaigns = [];
        const urgent = [];
        const nonUrgent = [];

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const campaign = {
            id: docSnap.id,
            title: data.title ? data.title.slice(0, 50) +  "" : "",
            description: data.story ? data.story.slice(0, 50) + "" : "",
            imageUrl: data.imageUrls?.[0] || null,
            raised: `$${data.totalDonation?.toLocaleString() || "0"}`,
            daysLeft: calculateDaysLeft(data.campaignDate),
            fullStory: data.story || "",
          };

          allCampaigns.push(campaign);

          if (data.urgent === true) {
            urgent.push(campaign);
          } else {
            nonUrgent.push(campaign);
          }
        });

        setUrgentDonations(urgent);
        setNonUrgentDonations(nonUrgent);

        if (allCampaigns.length > 0) {
          const randomIndex = Math.floor(Math.random() * allCampaigns.length);
          setRandomBanner(allCampaigns[randomIndex]);
        }
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      }
    };

    fetchCampaigns();
  }, []);

  const calculateDaysLeft = (dateStr) => {
    try {
      const target = new Date(dateStr); // works with "YYYY-MM-DD"
      const now = new Date();
      const diff = target - now;
      return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
    } catch {
      return 0;
    }
  };
  

  useEffect(() => {
    const requestAndStoreLocation = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const permissionKey = `locationPermission_${user.uid}`;
        const storedPermission = await AsyncStorage.getItem(permissionKey);

        if (storedPermission === "granted" || storedPermission === "denied") return;

        Alert.alert(
          "Location Permission",
          "KindKart would like to access your location to show nearby donation opportunities. Do you want to allow access?",
          [
            {
              text: "Don't Allow",
              onPress: async () => {
                await AsyncStorage.setItem(permissionKey, "denied");
              },
              style: "cancel",
            },
            {
              text: "Allow",
              onPress: async () => {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === "granted") {
                  const location = await Location.getCurrentPositionAsync({});
                  await AsyncStorage.setItem(permissionKey, "granted");

                  await setDoc(doc(db, "locations", user.uid), {
                    uid: user.uid,
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    timestamp: new Date().toISOString(),
                  });
                } else {
                  await AsyncStorage.setItem(permissionKey, "denied");
                }
              },
            },
          ]
        );
      } catch (error) {
        console.error("Error requesting location permission:", error);
      }
    };

    requestAndStoreLocation();
  }, []);

  return (
    <SafeAreaView
      style={[styles.safeArea, isDarkMode ? styles.darkBg : styles.lightBg]}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        contentContainerStyle={[styles.container, isDarkMode ? styles.darkBg : styles.lightBg]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.searchBarContainer, { backgroundColor: isDarkMode ? "#2C2C2C" : "#F5F6FA" }, isDarkMode && { shadowOpacity: 0 }]}
        >
          <Icon name="magnify" size={22} color={isDarkMode ? "#bbb" : "#888"} style={{ marginLeft: 10 }} />
          <TextInput
            style={[styles.searchBar, { color: isDarkMode ? "#eee" : "#222" }]}
            placeholder="What do you want to help?"
            placeholderTextColor={isDarkMode ? "#999" : "#888"}
          />
        </View>

        {randomBanner && (
          <View style={styles.banner}>
            <Image source={{ uri: randomBanner.imageUrl }} style={styles.bannerImage} resizeMode="cover" />
            <View style={styles.bannerOverlay}>
              <Text style={styles.bannerText}>{randomBanner.title}</Text>
              <TouchableOpacity
                style={styles.bannerButton}
                onPress={() => navigation.navigate("DonationDetail", { campaignId: randomBanner.id })}
              >
                <Text style={styles.bannerButtonText}>View more</Text>
              </TouchableOpacity>

            </View>
          </View>
        )}

<View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            Sharing kindness
          </Text>
          <TouchableOpacity>
            <Text style={[styles.seeAll, isDarkMode && styles.seeAllDark]}>
              See all
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.categoriesRow}>
          {categories.map((cat) => (
            <View key={cat.label} style={styles.categoryItem}>
              <View
                style={[
                  styles.categoryIconWrap,
                  { backgroundColor: isDarkMode ? "#444" : "#F5F6FA" },
                ]}
              >
                <Icon name={cat.icon} size={28} color="#4A90E2" />
              </View>
              <Text style={[styles.categoryLabel, isDarkMode && styles.darkText]}>
                {cat.label}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Urgent donation</Text>
          
        </View>
        
        <FlatList
          data={urgentDonations}
          horizontal
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View
              style={[
                styles.donationCard,
                { backgroundColor: isDarkMode ? "#222" : "#fff" },
                isDarkMode && { shadowColor: "#000", shadowOpacity: 0.6 },
              ]}
            >
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
              ) : (
                <View style={[styles.cardImage, { backgroundColor: "#ccc", justifyContent: "center", alignItems: "center" }]}> 
                  <Text style={{ color: "#666" }}>No Image</Text>
                </View>
              )}
              <View style={styles.cardContent}>
          
                <Text style={[styles.cardTitle, isDarkMode && styles.darkText]}  numberOfLines={1} >{item.title}</Text>
                <Text style={[styles.cardDesc, isDarkMode && styles.cardDescDark]} numberOfLines={2}>{item.description}</Text>
                <View style={styles.cardInfoRow}>
                  <View style={styles.cardInfoBox}>
                    <Text style={[styles.cardInfoLabel, isDarkMode && styles.cardInfoLabelDark]}>Raised</Text>
                    <Text style={[styles.cardInfoValue, isDarkMode && styles.darkText]}>{item.raised}</Text>
                  </View>
                  <View style={styles.cardInfoBox}>
                    <Text style={[styles.cardInfoLabel, isDarkMode && styles.cardInfoLabelDark]}>Days left</Text>
                    <Text style={[styles.cardInfoValue, isDarkMode && styles.darkText]}>{item.daysLeft}</Text>
                  </View>
                </View>
                <DonateButton title="Donate" onPress={() => navigation.navigate("DonationDetail", { campaignId: item.id })} isDarkMode={isDarkMode} />
              </View>
            </View>
          )}
        />

<View style={styles.sectionHeader}>
  <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
    Others
  </Text>
  {nonUrgentDonations.length > 2 && (
    <TouchableOpacity onPress={() => setShowAllOthers(!showAllOthers)}>
      <Text style={[styles.seeAll, isDarkMode && styles.seeAllDark]}>
        {showAllOthers ? "Show less" : "See all"}
      </Text>
    </TouchableOpacity>
  )}
</View>

<FlatList
  data={showAllOthers ? nonUrgentDonations : nonUrgentDonations.slice(0, 2)}
  keyExtractor={(item) => item.id.toString()}
  numColumns={2}
  scrollEnabled={false}
  columnWrapperStyle={{ justifyContent: "space-between" }}
  renderItem={({ item }) => (
    <TouchableOpacity
      style={{ width: "48%", marginBottom: 16 }}
      onPress={() => navigation.navigate("DonationDetail", { campaignId: item.id })}
    >
      <View
        style={[
          styles.donationCardGrid,
          { backgroundColor: isDarkMode ? "#222" : "#fff" },
          isDarkMode && { shadowColor: "#000", shadowOpacity: 0.6 },
        ]}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
        ) : (
          <View
            style={[
              styles.cardImage,
              {
                backgroundColor: "#ccc",
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
          >
            <Text style={{ color: "#666" }}>No Image</Text>
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, isDarkMode && styles.darkText]}
          numberOfLines={1} >
            {item.title}
          </Text>
          <Text
            style={[styles.cardDesc, isDarkMode && styles.cardDescDark]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
          <Text style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
            {item.daysLeft} days left · {item.raised} raised
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )}
/>



        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  lightBg: { backgroundColor: "#fff" },
  darkBg: { backgroundColor: "#121212" },
  container: { padding: 16 },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 6,
    marginBottom: 20,
    height: 48,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchBar: {
    flex: 1,
    fontSize: 16,
    backgroundColor: "transparent",
    marginLeft: 8,
  },
  banner: { position: "relative", marginBottom: 10 },
  bannerImage: { width: "100%", height: 190, borderRadius: 18 },
  bannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    padding: 18,
    backgroundColor: "rgba(0,0,0,0.18)",
    borderRadius: 18,
  },
  bannerText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  bannerButton: {
    backgroundColor: "#F6B93B",
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 22,
    alignSelf: "flex-start",
  },
  bannerButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#222",
  },
  seeAll: {
    color: "#F6B93B",
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 16,
  },
  seeAllDark: {
    color: "#F6B93B",
  },
  categoriesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  categoryItem: { alignItems: "center", width: 80, marginHorizontal: 10 },
  categoryIconWrap: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    elevation: 1,
    backgroundColor: "#F5F6FA",
  },
  categoryLabel: { fontWeight: "600", fontSize: 13, color: "#444" },
  darkText: { color: "#eee" },
  donationCard: {
    width: 230,
    borderRadius: 18,
    marginRight: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardImage: { width: "100%", height: 130, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  cardContent: { padding: 14 },
  cardTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 4, color: "#222" , height: 22},
  cardDesc: { fontSize: 13, color: "#666", marginBottom: 12 },
  cardDescDark: { color: "#ccc" },
  cardInfoRow: { flexDirection: "row", justifyContent: "space-between" },
  cardInfoBox: { alignItems: "center" },
  cardInfoLabel: { fontSize: 12, color: "#999" },
  cardInfoLabelDark: { color: "#bbb" },
  cardInfoValue: { fontWeight: "600", fontSize: 14, color: "#222" },
  donateButton: {
    backgroundColor: "#F6B93B",
    paddingVertical: 12,
    marginTop: 14,
    borderRadius: 28,
    alignItems: "center",
  },
  donateButtonDark: { backgroundColor: "#F6B93B" },
  donateButtonText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  donateButtonTextDark: { color: "#fff" },
  donationCardGrid: {
    width: "100%",
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  }
  
});
