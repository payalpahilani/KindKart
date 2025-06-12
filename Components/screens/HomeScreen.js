import React, { useContext, useEffect } from "react";
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
import { db } from "../../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { auth } from "../../firebaseConfig";

// Sample Data
const categories = [
  { label: "Donation", icon: "hand-heart" },
  { label: "Charity", icon: "charity" },
  { label: "Campaign", icon: "bullhorn" },
  { label: "Support", icon: "lifebuoy" },
];

const urgentDonations = [
  {
    id: "1",
    title: "Orphan Foundation",
    description: "Help children for orphanage scholarship...",
    image: require("../../assets/Images/orphanage.jpg"),
    raised: "$2,400",
    daysLeft: 22,
  },
  {
    id: "2",
    title: "Animal Kaiser",
    description: "Help and care for abandoned animals in S...",
    image: require("../../assets/Images/animals.jpg"),
    raised: "$2,400",
    daysLeft: 22,
  },
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

export default function HomeScreen() {
  const { isDarkMode } = useContext(ThemeContext);

  useEffect(() => {
    const requestAndStoreLocation = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          console.warn("No authenticated user found.");
          return;
        }
  
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
  
                  console.log("Location saved for:", user.uid);
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
        contentContainerStyle={[
          styles.container,
          isDarkMode ? styles.darkBg : styles.lightBg,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View
          style={[
            styles.searchBarContainer,
            { backgroundColor: isDarkMode ? "#2C2C2C" : "#F5F6FA" },
            isDarkMode && { shadowOpacity: 0 },
          ]}
        >
          <Icon
            name="magnify"
            size={22}
            color={isDarkMode ? "#bbb" : "#888"}
            style={{ marginLeft: 10 }}
          />
          <TextInput
            style={[styles.searchBar, { color: isDarkMode ? "#eee" : "#222" }]}
            placeholder="What do you want to help?"
            placeholderTextColor={isDarkMode ? "#999" : "#888"}
          />
        </View>

        {/* Banner */}
        <View style={styles.banner}>
          <Image
            source={require("../../assets/Images/school.jpg")}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerText}>
              Support campaign cost for children's school
            </Text>
            <TouchableOpacity style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>View more</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
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
              <Text
                style={[styles.categoryLabel, isDarkMode && styles.darkText]}
              >
                {cat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Urgent Donations */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>
            Urgent donation
          </Text>
          <TouchableOpacity>
            <Text style={[styles.seeAll, isDarkMode && styles.seeAllDark]}>
              See all
            </Text>
          </TouchableOpacity>
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
                isDarkMode && {
                  shadowColor: "#000",
                  shadowOpacity: 0.6,
                },
              ]}
            >
              <Image source={item.image} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, isDarkMode && styles.darkText]}>
                  {item.title}
                </Text>
                <Text
                  style={[styles.cardDesc, isDarkMode && styles.cardDescDark]}
                >
                  {item.description}
                </Text>
                <View style={styles.cardInfoRow}>
                  <View style={styles.cardInfoBox}>
                    <Text
                      style={[
                        styles.cardInfoLabel,
                        isDarkMode && styles.cardInfoLabelDark,
                      ]}
                    >
                      Raised
                    </Text>
                    <Text
                      style={[
                        styles.cardInfoValue,
                        isDarkMode && styles.darkText,
                      ]}
                    >
                      {item.raised}
                    </Text>
                  </View>
                  <View style={styles.cardInfoBox}>
                    <Text
                      style={[
                        styles.cardInfoLabel,
                        isDarkMode && styles.cardInfoLabelDark,
                      ]}
                    >
                      Days left
                    </Text>
                    <Text
                      style={[
                        styles.cardInfoValue,
                        isDarkMode && styles.darkText,
                      ]}
                    >
                      {item.daysLeft.toString()}
                    </Text>
                  </View>
                </View>
                <DonateButton
                  title="Donate"
                  onPress={() => {}}
                  isDarkMode={isDarkMode}
                />
              </View>
            </View>
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
  categoryLabel: {
    fontSize: 14,
    color: "#333",
    marginTop: 2,
    fontWeight: "500",
  },
  darkText: {
    color: "#eee",
  },
  cardDescDark: {
    color: "#ccc",
  },
  cardInfoLabelDark: {
    color: "#aaa",
  },
  donationCard: {
    width: 220,
    borderRadius: 18,
    marginRight: 16,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginVertical: 8,
  },
  cardImage: {
    width: "100%",
    height: 100,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  cardContent: { padding: 12 },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 2,
  },
  cardDesc: {
    color: "#777",
    fontSize: 13,
    marginBottom: 8,
  },
  cardInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardInfoBox: { alignItems: "center" },
  cardInfoLabel: {
    fontSize: 12,
    color: "#888",
  },
  cardInfoValue: {
    fontSize: 14,
    color: "#222",
    fontWeight: "bold",
  },
  donateButton: {
    backgroundColor: "#F6B93B",
    borderRadius: 22,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 2,
    shadowColor: "#F6B93B",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  donateButtonDark: {
    backgroundColor: "#D18E00",
  },
  donateButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  donateButtonTextDark: {
    color: "#FFFDE7",
  },
});
