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
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import Checkbox from "expo-checkbox";
import CustomDropdown from "../Utilities/CustomDropdown"; // Adjust path as needed
import { getAuth, onAuthStateChanged } from "firebase/auth"; // <-- ADDED

const BACKEND_URL = "http://10.0.0.43:4000"; // Replace with your backend server address

const MAX_IMAGES = 5;

const ngoOptions = ["Orphan Foundation", "Food Relief", "Animal Care", "Other"];
const causeOptions = [
  "Help children for orphanage scholarship",
  "Feed the hungry",
  "Support animal shelters",
  "Other",
];
const currencyOptions = ["CAD($)", "USD($)", "INR(₹)"];
const conditionOptions = ["New", "Used", "Refurbished"];

// Helper to get MIME type from file extension
function getMimeType(uri) {
  const extension = uri.split(".").pop().toLowerCase();
  switch (extension) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "bmp":
      return "image/bmp";
    case "svg":
      return "image/svg+xml";
    default:
      return "image/png";
  }
}

export default function ListItemScreen() {
  const [userEmail, setUserEmail] = useState(null); // <-- ADDED

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserEmail(user ? user.email : null);
    });
    return unsubscribe;
  }, []);

  const [title, setTitle] = useState("");
  const [ngo, setNgo] = useState(ngoOptions[0]);
  const [cause, setCause] = useState(causeOptions[0]);
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [currency, setCurrency] = useState(currencyOptions[0]);
  const [condition, setCondition] = useState(conditionOptions[0]);
  const [description, setDescription] = useState("");
  const [useAddress, setUseAddress] = useState(false);
  const [agree, setAgree] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Dropdown data arrays
  const ngoData = ngoOptions.map((opt) => ({ label: opt, value: opt }));
  const causeData = causeOptions.map((opt) => ({ label: opt, value: opt }));
  const currencyData = currencyOptions.map((opt) => ({
    label: opt,
    value: opt,
  }));
  const conditionData = conditionOptions.map((opt) => ({
    label: opt,
    value: opt,
  }));

  // Pick images
  const pickImages = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert(`Max number of images is ${MAX_IMAGES}.`);
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_IMAGES - images.length,
    });
    if (!result.canceled) {
      const newImages = result.assets
        ? result.assets.slice(0, MAX_IMAGES - images.length)
        : [result];
      setImages([...images, ...newImages].slice(0, MAX_IMAGES));
    }
  };

  // Remove image
  const removeImage = (idx) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  // Upload a single image to S3 using pre-signed URL and store downloadUrl for display
  const uploadImageToS3 = async (img, userId, itemId) => {
    const fileName = img.fileName || img.uri.split("/").pop();
    const fileType =
      img.type && img.type.startsWith("image/")
        ? img.type
        : getMimeType(img.uri);

    // 1. Get pre-signed upload and download URLs from backend
    const res = await fetch(
      `${BACKEND_URL}/get-presigned-url?fileName=${encodeURIComponent(
        fileName
      )}&fileType=${encodeURIComponent(
        fileType
      )}&userId=${userId}&itemId=${itemId}`
    );
    if (!res.ok) throw new Error("Failed to get S3 URL");
    const { uploadUrl, downloadUrl } = await res.json();

    // 2. Upload image to S3
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
    // Return the downloadUrl for displaying the image
    return downloadUrl;
  };

  // Upload all images and return their S3 download URLs
  const uploadAllImages = async (userId, itemId) => {
    const uploadedUrls = [];
    for (const img of images) {
      const url = await uploadImageToS3(img, userId, itemId);
      uploadedUrls.push(url);
    }
    return uploadedUrls;
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!agree) {
      Alert.alert("Please agree to the terms before submitting.");
      return;
    }
    if (!title || !price || !description || images.length === 0) {
      Alert.alert("Please fill all fields and select at least one image.");
      return;
    }
    setLoading(true);
    try {
      // const userId = "user123"; // Replace with actual user ID from auth
      const auth = getAuth();
      const userId = auth.currentUser ? auth.currentUser.uid : "unknown"; // <-- UPDATED
      const email = userEmail; // <-- Use the fetched email
      const itemId = Math.random().toString(36).substring(2, 15);
      const imageUrls = await uploadAllImages(userId, itemId);

      await addDoc(collection(db, "items"), {
        title,
        ngo,
        cause,
        price: parseFloat(price),
        salePrice: salePrice ? parseFloat(salePrice) : 0,
        negotiable,
        currency,
        condition,
        description,
        useAddress,
        imageUrls,
        userId,
        email, // <-- Save email to Firestore
        createdAt: serverTimestamp(),
      });

      Alert.alert("Ad listed successfully!");
      setTitle("");
      setNgo(ngoOptions[0]);
      setCause(causeOptions[0]);
      setPrice("");
      setSalePrice("");
      setNegotiable(false);
      setCurrency(currencyOptions[0]);
      setCondition(conditionOptions[0]);
      setDescription("");
      setUseAddress(false);
      setImages([]);
      setAgree(false);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
    setLoading(false);
  };

  // Image grid render (show local preview before upload, downloadUrl after upload)
  const renderImageItem = ({ item, index }) => (
    <View style={styles.imageBox}>
      <Image
        source={{
          uri: item.downloadUrl || item.uri, // Use downloadUrl if available, else local uri
        }}
        style={styles.imageThumb}
      />
      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => removeImage(index)}
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>×</Text>
      </TouchableOpacity>
    </View>
  );

  // Add image button for grid
  const renderAddImageBtn = () => (
    <TouchableOpacity
      style={styles.imageBox}
      onPress={pickImages}
      disabled={images.length >= MAX_IMAGES}
    >
      <Text style={{ fontSize: 32, color: "#bbb" }}>+</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          <Text style={styles.header}>List your Ad</Text>
          <Text style={styles.label}>Ad Images/Video</Text>
          <View>
            <FlatList
              data={[...images, ...(images.length < MAX_IMAGES ? [{}] : [])]}
              renderItem={({ item, index }) =>
                item.uri
                  ? renderImageItem({ item, index })
                  : renderAddImageBtn()
              }
              keyExtractor={(_, idx) => idx.toString()}
              horizontal
              contentContainerStyle={{ marginBottom: 6 }}
              showsHorizontalScrollIndicator={false}
            />
            <Text style={styles.imageHint}>
              Prepare images before uploading. Upload images larger than 750px ×
              450px. Max number of images is 5. Max image size is 134MB.
            </Text>
          </View>

          <Text style={styles.sectionHeader}>Tell us about your item</Text>
          <Text style={styles.inputLabel}>TITLE</Text>
          <TextInput
            placeholder="The item's title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />

          <Text style={styles.inputLabel}>SELECT NGO</Text>
          <CustomDropdown
            data={ngoData}
            value={ngo}
            onChange={setNgo}
            placeholder="Select NGO"
            testID="ngoDropdown"
          />

          <Text style={styles.inputLabel}>SELECT CAUSE</Text>
          <CustomDropdown
            data={causeData}
            value={cause}
            onChange={setCause}
            placeholder="Select Cause"
            testID="causeDropdown"
          />

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>PRICE</Text>
              <TextInput
                placeholder="0.00"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>SALE PRICE</Text>
              <TextInput
                placeholder="0.00"
                value={salePrice}
                onChangeText={setSalePrice}
                keyboardType="numeric"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.checkboxRow}>
            <Checkbox
              value={negotiable}
              onValueChange={setNegotiable}
              color={negotiable ? "#F6B93B" : undefined}
              style={styles.checkbox}
            />
            <Text style={styles.checkboxLabel}>Is price negotiable?</Text>
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>CURRENCY</Text>
              <CustomDropdown
                data={currencyData}
                value={currency}
                onChange={setCurrency}
                placeholder="Select Currency"
                testID="currencyDropdown"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>CONDITION</Text>
              <CustomDropdown
                data={conditionData}
                value={condition}
                onChange={setCondition}
                placeholder="Select Condition"
                testID="conditionDropdown"
              />
            </View>
          </View>

          <Text style={styles.inputLabel}>DESCRIPTION</Text>
          <TextInput
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            style={[styles.input, { minHeight: 60, textAlignVertical: "top" }]}
          />

          <Text style={styles.sectionHeader}>Location & Contact</Text>
          <View style={styles.checkboxRow}>
            <Checkbox
              value={useAddress}
              onValueChange={setUseAddress}
              color={useAddress ? "#F6B93B" : undefined}
              style={styles.checkbox}
            />
            <Text style={styles.checkboxLabel}>
              Use address set in profile section
            </Text>
          </View>
          <View style={styles.checkboxRow}>
            <Checkbox
              value={agree}
              onValueChange={setAgree}
              color={agree ? "#F6B93B" : undefined}
              style={styles.checkbox}
            />
            <Text style={styles.checkboxLabel}>
              I agree to{" "}
              <Text style={{ color: "#F6B93B" }}>terms & conditions</Text>
            </Text>
          </View>

          <View
            style={{ flexDirection: "row", marginTop: 16, marginBottom: 32 }}
          >
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: "#DCE3E9", marginRight: 8 },
              ]}
              onPress={() => {
                setTitle("");
                setNgo(ngoOptions[0]);
                setCause(causeOptions[0]);
                setPrice("");
                setSalePrice("");
                setNegotiable(false);
                setCurrency(currencyOptions[0]);
                setCondition(conditionOptions[0]);
                setDescription("");
                setUseAddress(false);
                setImages([]);
                setAgree(false);
              }}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: "#2d3a4b" }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: agree ? "#F6B93B" : "#F7DCA5",
                  flex: 1,
                },
              ]}
              disabled={!agree || loading}
              onPress={handleSubmit}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    backgroundColor: "#fff",
    flex: 1,
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    alignSelf: "center",
    marginVertical: 12,
  },
  label: {
    fontWeight: "600",
    fontSize: 18,
    marginBottom: 10,
  },
  imageHint: {
    fontSize: 12,
    color: "#888",
    marginBottom: 10,
    marginTop: 8,
  },
  sectionHeader: {
    fontWeight: "600",
    fontSize: 18,
    marginVertical: 8,
  },
  inputLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 12,
    marginBottom: 2,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#DCE3E9",
    borderRadius: 6,
    padding: 10,
    marginBottom: 2,
    fontSize: 15,
    backgroundColor: "#f8fafb",
  },
  imageBox: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f2f2f2",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  imageThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeBtn: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#F6B93B",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    elevation: 2,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  checkbox: {
    marginRight: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#2d3a4b",
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
