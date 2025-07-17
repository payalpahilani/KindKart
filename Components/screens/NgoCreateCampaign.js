import React, { useState, useEffect, useContext } from "react";
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
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { getAuth } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomDropdown from "../Utilities/CustomDropdown";
import { ThemeContext } from '../Utilities/ThemeContext';
import { useTranslation } from 'react-i18next';

const BACKEND_URL = "https://kindkart-0l245p6y.b4a.run";
const MAX_IMAGES = 5;

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
  const { t } = useTranslation();
  const { isDarkMode } = useContext(ThemeContext);

  const colors = {
    background: isDarkMode ? "#121212" : "#FAF6F2",
    text: isDarkMode ? "#EEE" : "#2D3A4B",
    inputBg: isDarkMode ? "#222" : "#fff",
    border: isDarkMode ? "#555" : "#ccc",
    placeholder: isDarkMode ? "#888" : "#aaa",
    buttonCancelBg: isDarkMode ? "#555" : "#DCE3E9",
    buttonSubmitBg: "#F6B93B",
    error: "#D94141",
    buttonTextCancel: isDarkMode ? "#ddd" : "#000",
    buttonTextSubmit: "#000",
    removeBtnBg: "#D94141",
    primary: "#F6B93B",
  };

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

  useEffect(() => {
    const fetchNgoInfo = async () => {
      const uid = getAuth().currentUser?.uid;
      if (!uid) return;
      try {
        const docSnap = await getDoc(doc(db, "ngo", uid));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCampaignerName(data.ngoName);
        }
      } catch (err) {
        console.log("Failed to fetch NGO data", err);
      }
    };
    fetchNgoInfo();
  }, []);

  const pickImages = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert(t('createCampaign.max_image_limit'));
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(t('createCampaign.permission_denied'), t('createCampaign.allow_photo_access'));
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

    if (!res.ok) throw new Error(t('createCampaign.failed_get_s3_url'));
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
      throw new Error(t('createCampaign.failed_upload_s3'));
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
      Alert.alert(t('createCampaign.user_not_authenticated'));
      return;
    }

    if (!title || !campaignerName || !campaignDate || !totalDonation || !story || images.length === 0) {
      Alert.alert(t('createCampaign.fill_all_fields'));
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

      Alert.alert(t('createCampaign.campaign_created'));
      navigation.goBack();
    } catch (err) {
      Alert.alert(t('createCampaign.error'), err.message);
    }
    setLoading(false);
  };

  const handleCancel = () => {
    Alert.alert(
      t('createCampaign.discard_changes'),
      t('createCampaign.discard_warning'),
      [
        { text: t('createCampaign.keep_editing'), style: "cancel" },
        { text: t('createCampaign.discard'), style: "destructive", onPress: () => navigation.goBack() },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.navRow}>
            <TouchableOpacity onPress={handleCancel}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.header, { color: colors.text }]}>{t('createCampaign.create_campaign')}</Text>
            <View style={{ width: 24 }} />
          </View>

          <Text style={[styles.label, { color: colors.text }]}>{t('createCampaign.upload_images')}</Text>
          <FlatList
            data={[...images, ...(images.length < MAX_IMAGES ? [{}] : [])]}
            renderItem={({ item, index }) => {
              if (!item || !item.uri) {
                return (
                  <TouchableOpacity
                    style={[styles.imageBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                    onPress={pickImages}
                  >
                    <Text style={{ fontSize: 30, color: colors.placeholder }}>+</Text>
                  </TouchableOpacity>
                );
              }

              return (
                <View style={[styles.imageBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                  <Image source={{ uri: item.uri }} style={styles.imageThumb} />
                  <TouchableOpacity
                    style={[styles.removeBtn, { backgroundColor: colors.removeBtnBg }]}
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

          <Text style={[styles.imageHint, { color: colors.placeholder }]}>
            {t('createCampaign.image_upload_hint')}
          </Text>

          <View style={styles.section}>
            <TextInput
              placeholder={t('createCampaign.title')}
              value={title}
              onChangeText={setTitle}
              placeholderTextColor={colors.placeholder}
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            />
            <TextInput
              placeholder={t('createCampaign.campaigner_name')}
              value={campaignerName}
              onChangeText={setCampaignerName}
              placeholderTextColor={colors.placeholder}
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            />

            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[styles.input, { justifyContent: "center", backgroundColor: colors.inputBg, borderColor: colors.border }]}
            >
              <Text style={{ color: campaignDate ? colors.text : colors.placeholder }}>
                {campaignDate || t('createCampaign.select_campaign_end_date')}
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
                    const formatted =
                      selectedDate.getFullYear() +
                      "-" +
                      String(selectedDate.getMonth() + 1).padStart(2, "0") +
                      "-" +
                      String(selectedDate.getDate()).padStart(2, "0");
                    setCampaignDate(formatted);

                    const today = new Date();
                    const diffTime = new Date(formatted) - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    setDaysLeft(diffDays);
                  }
                }}
              />
            )}

            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ flex: 1, fontSize: 15, color: colors.text }}>{t('createCampaign.mark_as_urgent')}</Text>
              <TouchableOpacity
                onPress={() => setUrgent(!urgent)}
                style={{
                  backgroundColor: urgent ? colors.primary : "#555",
                  width: 50,
                  height: 28,
                  borderRadius: 14,
                  justifyContent: "center",
                  paddingHorizontal: 5,
                }}
              >
                <View
                  style={{
                    backgroundColor: "#fff",
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    alignSelf: urgent ? "flex-end" : "flex-start",
                  }}
                />
              </TouchableOpacity>
            </View>

            <CustomDropdown
              data={[
                { label: t('createCampaign.donation'), value: "donation" },
                { label: t('createCampaign.charity'), value: "charity" },
                { label: t('createCampaign.campaign'), value: "campaign" },
                { label: t('createCampaign.support'), value: "support" },
                { label: t('createCampaign.fundraiser'), value: "fundraiser" },
                { label: t('createCampaign.awareness'), value: "awareness" },
                { label: t('createCampaign.events'), value: "events" },
              ]}
              value={category}
              onChange={setCategory}
              placeholder={t('createCampaign.select_category')}
              inputStyle={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />

            <CustomDropdown
              data={[
                { label: t('createCampaign.medical_aid'), value: "medical_aid" },
                { label: t('createCampaign.disaster_relief'), value: "disaster_relief" },
                { label: t('createCampaign.child_welfare'), value: "child_welfare" },
                { label: t('createCampaign.women_empowerment'), value: "women_empowerment" },
                { label: t('createCampaign.education'), value: "education" },
                { label: t('createCampaign.environment'), value: "environment" },
                { label: t('createCampaign.animal_welfare'), value: "animal_welfare" },
                { label: t('createCampaign.community_development'), value: "community_development" },
                { label: t('createCampaign.elderly_support'), value: "elderly_support" },
                { label: t('createCampaign.livelihood_support'), value: "livelihood_support" },
              ]}
              value={campaignCategory}
              onChange={setCampaignCategory}
              placeholder={t('createCampaign.select_campaign_category')}
              inputStyle={[styles.input, { borderColor: colors.border, color: colors.text }]}
            />

            <TextInput
              placeholder={t('createCampaign.total_donation')}
              value={totalDonation}
              onChangeText={setTotalDonation}
              keyboardType="numeric"
              placeholderTextColor={colors.placeholder}
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            />

           <CustomDropdown
            data={[
              { label: "CAD", value: "CAD" },
              { label: "USD", value: "USD" },
            ]}
            value={currency}
            onChange={setCurrency}
            placeholder={t('createCampaign.select_currency')}
          inputStyle={{ color: isDarkMode ? '#fff' : '#2d3a4b' }}
          itemTextStyle={{ color: isDarkMode ? '#fff' : '#2d3a4b' }}
          dropdownTextStyle={{ color: isDarkMode ? '#fff' : '#2d3a4b' }}
          dropdownStyle={{ backgroundColor: isDarkMode ? '#232327' : '#fff' }}
          />

          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>{t('createCampaign.story_campaign_details')}</Text>
            <TextInput
              placeholder={t('createCampaign.story_placeholder')}
              value={story}
              onChangeText={setStory}
              multiline
              placeholderTextColor={colors.placeholder}
              style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { backgroundColor: colors.buttonCancelBg }]}
              onPress={handleCancel}
            >
              <Text style={[styles.buttonText, { color: colors.buttonTextCancel }]}>{t('createCampaign.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.buttonText, { color: colors.buttonTextSubmit }]}>{t('createCampaign.submit')}</Text>
              )}
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
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  section: {
    marginTop: 16,
  },
  input: {
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
    marginBottom: 10,
    marginTop: 8,
  },
  imageBox: {
    width: 80,
    height: 80,
    borderWidth: 1,
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
    marginRight: 10,
  },
  submitButton: {
    backgroundColor: "#F6B93B",
    marginLeft: 10,
  },
  buttonText: {
    fontWeight: "600",
    fontSize: 16,
  },
});
