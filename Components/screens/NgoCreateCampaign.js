import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { getAuth } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform } from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { KeyboardAvoidingView } from 'react-native';
import { doc, getDoc } from "firebase/firestore";
import CustomDropdown from "../Utilities/CustomDropdown"; 




const BACKEND_URL = "https://kindkart-0l245p6y.b4a.run";

const MAX_IMAGES = 5;

const PRIMARY = "#0AB1E7";
const BACKGROUND = "#F3E8DD";
const ACCENT = "#DCE3E9";
const DARK_TEXT = "#2D3A4B";
const BUTTON = "#F6B93B";
const ERROR = "#D94141";

function getMimeType(uri) {
  const ext = uri.split(".").pop().toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "png": return "image/png";
    case "gif": return "image/gif";
    default: return "image/png";
  }
}

export default function NgoCreateCampaignScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = useState("");
  const [campaignerName, setCampaignerName] = useState("");
  const [campaignDate, setCampaignDate] = useState("");
  const [category, setCategory] = useState("");
  const [campaignCategory, setCampaignCategory] = useState("");
  const [totalDonation, setTotalDonation] = useState("");
  const [currency, setCurrency] = useState("CAD");
  const [story, setStory] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [daysLeft, setDaysLeft] = useState(null);
  const [tempCategory, setTempCategory] = useState("");



  useEffect(() => {
    const fetchNgoInfo = async () => {
      const uid = getAuth().currentUser?.uid;
      if (!uid) return;
      try {
        const docSnap = await getDoc(doc(db, "ngo", uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCampaignerName(data.ngoName); // auto-fills campaigner
        }
      } catch (err) {
        console.log("Failed to fetch NGO data", err);
      }
    };
    fetchNgoInfo();
  }, []);
  

  const pickImages = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert("Max image limit reached.");
      return;
    }
  
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert("Permission denied", "Please allow access to your photo library.");
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_IMAGES - images.length,
    });
  
    if (!result.canceled) {
      const newImages = result.assets || [result];
      setImages([...images, ...newImages].slice(0, MAX_IMAGES));
    }
  };
  

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const uploadImageToS3 = async (img, userId, itemId) => {
    const fileName = img.fileName || img.uri.split("/").pop();
    const fileType = img.type?.startsWith("image/") ? img.type : getMimeType(img.uri);
  
    const res = await fetch(
      `${BACKEND_URL}/get-presigned-url?fileName=${encodeURIComponent(
        fileName
      )}&fileType=${encodeURIComponent(
        fileType
      )}&userId=${userId}&itemId=${itemId}&type=ngo`
    );
  
    if (!res.ok) throw new Error("Failed to get S3 URL");
    const { uploadUrl, publicUrl } = await res.json();
  
    const imgRes = await fetch(img.uri);
    const blob = await imgRes.blob();
  
    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      body: blob,
      headers: {
        "Content-Type": fileType,
        "x-amz-server-side-encryption": "AES256",
      },
    });
  
    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.log("S3 upload error response:", errorText);
      throw new Error("Failed to upload image to S3");
    }
  
    return publicUrl;
  };
  

  const uploadAllImages = async (userId, itemId) => {
    const uploadedUrls = [];
    for (const img of images || []) {
      const url = await uploadImageToS3(img, userId, itemId);
      uploadedUrls.push(url);
    }
    return uploadedUrls;
  };
  

  const handleSubmit = async () => {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;

    if (!userId) {
      Alert.alert("User not authenticated.");
      return;
    }

    if (!title || !campaignerName || !campaignDate || !totalDonation || !story || images.length === 0) {
      Alert.alert("Please fill all required fields and add at least one image.");
      return;
    }

    setLoading(true);
    try {
      const itemId = Math.random().toString(36).substring(2, 12);
      const imageUrls = await uploadAllImages(userId, itemId);

      await addDoc(collection(db, "campaigns"), {
        title,
        campaignerName,
        campaignDate,
        category,
        campaignCategory,
        totalDonation: parseFloat(totalDonation),
        currency,
        story,
        imageUrls,
        urgent,
        daysLeft,
        createdBy: userId,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Campaign created!");
      navigation.goBack();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
    setLoading(false);
  };

  const handleCancel = () => {
    Alert.alert(
      "Discard Changes?",
      "Your progress will be lost.",
      [
        { text: "Keep Editing", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => navigation.goBack() },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : undefined}
    keyboardVerticalOffset={100}
  >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={handleCancel}>
            <Ionicons name="arrow-back" size={24} color={DARK_TEXT} />
          </TouchableOpacity>
          <Text style={styles.header}>Create Campaign</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.label}>Upload Images</Text>
        <FlatList
          data={[...images, ...(images.length < MAX_IMAGES ? [{}] : [])]}
          renderItem={({ item, index }) => {
            if (!item || !item.uri) {
              return (
                <TouchableOpacity style={styles.imageBox} onPress={pickImages}>
                  <Text style={{ fontSize: 30, color: "#999" }}>+</Text>
                </TouchableOpacity>
              );
            }

            return (
              <View style={styles.imageBox}>
                <Image source={{ uri: item.uri }} style={styles.imageThumb} />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeImage(index)}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>×</Text>
                </TouchableOpacity>
              </View>
            );
          }}
          keyExtractor={(_, idx) => idx.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
        />

            <Text style={styles.imageHint}>
                Prepare images before uploading. Upload images larger than 750px
                × 450px. Max number of images is 5. Max image size is 134MB.
              </Text>

        <View style={styles.section}>
          <TextInput placeholder="Title" value={title} onChangeText={setTitle} style={styles.input} />
          <TextInput placeholder="Campaigner Name" value={campaignerName} onChangeText={setCampaignerName} style={styles.input} />
          {/* <TextInput placeholder="Campaign Date (e.g. 06/03/2025)" value={campaignDate} onChangeText={setCampaignDate} style={styles.input} /> */}
          
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
            <Text style={{ color: campaignDate ? DARK_TEXT : "#aaa" }}>
            {campaignDate || "Select Campaign End Date"}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
        <DateTimePicker
            value={campaignDate ? new Date(campaignDate) : new Date()}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                const formatted = selectedDate.getFullYear() + '-' + 
                String(selectedDate.getMonth() + 1).padStart(2, '0') + '-' + 
                String(selectedDate.getDate()).padStart(2, '0');

                setCampaignDate(formatted);
            
                const today = new Date();
                const diffTime = new Date(formatted) - today;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                setDaysLeft(diffDays);
              }
            }}
            
            
        />
        )}

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ flex: 1, fontSize: 15 }}>Mark as Urgent Donation</Text>
        <TouchableOpacity
          onPress={() => setUrgent(!urgent)}
          style={{
            backgroundColor: urgent ? '#0AB1E7' : '#ccc',
            width: 50,
            height: 28,
            borderRadius: 14,
            justifyContent: 'center',
            paddingHorizontal: 5,
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              width: 22,
              height: 22,
              borderRadius: 11,
              alignSelf: urgent ? 'flex-end' : 'flex-start',
            }}
          />
        </TouchableOpacity>
      </View>

      <CustomDropdown
      data={[
        { label: "Donation", value: "donation" },
        { label: "Charity", value: "charity" },
        { label: "Campaign", value: "campaign" },
        { label: "Support", value: "support" },
        { label: "Fundraiser", value: "Fundraiser" },
        { label: "Awareness", value: "awareness" },
        { label: "Events", value: "events" },
      ]}
      value={category}
      onChange={setCategory}
      placeholder="Select Category"
      inputStyle={styles.input}
/>

<CustomDropdown
      data={[
        { label: "Medical Aid", value: "medical_aid" },
        { label: "Disaster Relief", value: "disaster_relief" },
        { label: "Child Welfare", value: "child_welfare" },
        { label: "Women Empowerment", value: "women_empowerment" },
        { label: "Education", value: "education" },
        { label: "Environment", value: "environment" },
        { label: "Animal Welfare", value: "animal_welfare" },
        { label: "Community Development", value: "community_development" },
        { label: "Elderly Support", value: "elderly_support" },
        { label: "Livelihood Support", value: "livelihood_support" },
      ]}
      value={campaignCategory}
      onChange={setCampaignCategory}
      placeholder= "Select Campaign Category"
      inputStyle={styles.input}
/>

    <TextInput placeholder="Total Donation (e.g. 1000000)" value={totalDonation} onChangeText={setTotalDonation} keyboardType="numeric" style={styles.input} />
      
    <CustomDropdown
      data={[
        { label: "CAD", value: "CAD" },
        { label: "USD", value: "USD" },
      ]}
      value={currency}
      onChange={setCurrency}
      placeholder="Select Currency"
      inputStyle={styles.input}
      />
          </View>

        <View style={styles.section}>
          <Text style={styles.label}>Story / Campaign Details</Text>
          <TextInput
            placeholder="Share the background and purpose of this campaign..."
            value={story}
            onChangeText={setStory}
            multiline
            style={[styles.input, styles.textArea]}
          />
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
      padding: 20,
    },
    navRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    header: {
      fontSize: 24,
      fontWeight: "700",
      color: "#000",
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      color: DARK_TEXT,
      marginBottom: 8,
    },
    section: {
      marginTop: 16,
    },
    input: {
      backgroundColor: "#fff",
      borderColor: "#ccc",
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      marginBottom: 12,
      fontSize: 15,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 1,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: "top",
    },
    imageHint: {
      fontSize: 12,
      color: "#888",
      marginBottom: 10,
      marginTop: 8,
    },
    imageBox: {
      width: 80,
      height: 80,
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#ccc",
      marginRight: 10,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      position: "relative",
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 3,
      elevation: 2,
    },
    imageThumb: {
      width: 80,
      height: 80,
      borderRadius: 12,
    },
    removeBtn: {
      position: "absolute",
      top: -8,
      right: -8,
      backgroundColor: ERROR,
      borderRadius: 12,
      width: 24,
      height: 24,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
    },
    actionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 28,
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
      elevation: 2,
    },
    cancelButton: {
      backgroundColor: "#DCE3E9",
      marginRight: 10,
    },
    submitButton: {
      backgroundColor: BUTTON,
      marginLeft: 10,
    },
    buttonText: {
      color: "#000",
      fontWeight: "600",
      fontSize: 16,
    },
    inputIOS: {
        backgroundColor: "#fff",
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        fontSize: 15,
        color: "#000",
      },
      inputAndroid: {
        backgroundColor: "#fff",
        borderColor: "#ccc",
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        fontSize: 15,
        color: "#000",
      },
  });
  
