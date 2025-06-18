import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function DonationDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { campaign } = route.params;

  return (
    <ScrollView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Media</Text>
        <TouchableOpacity onPress={() => alert("Share clicked!")}>
          <Icon name="share-variant" size={24} />
        </TouchableOpacity>
      </View>

      {/* Main Image */}
      <Image source={{ uri: campaign.imageUrl }} style={styles.mainImage} />

      {/* Title & Tag */}
      <Text style={styles.title}>{campaign.title}</Text>
      <View style={styles.tag}>
        <Text style={styles.tagText}>Donation</Text>
      </View>

      {/* Date, Raised, Days Left */}
      <Text style={styles.date}>May 1, 2024</Text>
      <View style={styles.row}>
        <Text style={styles.raised}>{campaign.raised} from $40000</Text>
        <Text style={styles.daysLeft}>{campaign.daysLeft} days left</Text>
      </View>

      <View style={styles.line} />

      {/* Campaigner */}
      <Text style={styles.sectionTitle}>Campaigner</Text>
      <View style={styles.campaignerBox}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>OF</Text>
        </View>
        <View>
          <Text style={styles.campaignerName}>Orphan Foundation</Text>
          <Text style={styles.verified}>Verified Account from May 01 2023</Text>
        </View>
      </View>

      {/* Story */}
      <Text style={styles.sectionTitle}>Campaign story</Text>
      <Text style={styles.story}>
        {campaign.fullStory || "Join us in making a lasting impact..."}
      </Text>

      {/* Donators */}
      <Text style={styles.sectionTitle}>Donators</Text>
      <View style={styles.donatorBox}>
        <Image
          source={require("../../assets/Images/avatar.jpg")}
          style={styles.donatorAvatar}
        />
        <View>
          <Text style={styles.donatorName}>Anonymous</Text>
          <Text style={styles.donationTime}>Donate $20 · 1 minute ago</Text>
        </View>
      </View>

      {/* Donate Button */}
      <TouchableOpacity style={styles.donateButton} onPress={() => alert("Donate now!")}>
        <Text style={styles.donateButtonText}>Donate Now</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  mainImage: { width: "100%", height: 200, borderRadius: 12 },
  title: { fontSize: 18, fontWeight: "bold", marginTop: 16 },
  tag: {
    backgroundColor: "#D6F2EE",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
  },
  tagText: { color: "#4CAF93", fontWeight: "600" },
  date: { color: "#555", marginTop: 6 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8,
  },
  raised: { fontSize: 16, fontWeight: "bold" },
  daysLeft: { color: "#999" },
  line: {
    height: 1,
    backgroundColor: "#ccc",
    marginVertical: 16,
  },
  sectionTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 8 },
  campaignerBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
  },
  avatar: {
    backgroundColor: "#E5F6F5",
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: "#4CAF93", fontWeight: "bold", fontSize: 18 },
  campaignerName: { fontWeight: "bold" },
  verified: { color: "#666" },
  story: { color: "#444", marginBottom: 20 },
  donatorBox: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  donatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  donatorName: { fontWeight: "bold" },
  donationTime: { color: "#777" },
  donateButton: {
    backgroundColor: "#F6B93B",
    padding: 14,
    borderRadius: 28,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  donateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
