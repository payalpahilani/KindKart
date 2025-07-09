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
  KeyboardAvoidingView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import Checkbox from "expo-checkbox";
import CustomDropdown from "../Utilities/CustomDropdown";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import axios from "axios";
import { GOOGLE_API_KEY } from "@env";

const BACKEND_URL = "https://kindkart-0l245p6y.b4a.run";
const MAX_IMAGES = 5;
const currencyOptions = ["CAD($)", "USD($)", "INR(₹)"];
const conditionOptions = ["New", "Used", "Refurbished"];
const categoryOptions = [
  "Electronics",
  "Jewellery",
  "Fashion & Apparel",
  "Home & Kitchen",
  "Beauty & Personal Care",
  "Sports & Outdoors",
  "Books & Educational",
  "Pet Supplies",
  "Toys & Games",
  "Health & Wellness",
];
const categoryData = categoryOptions.map((opt) => ({ label: opt, value: opt }));

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
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserEmail(user ? user.email : null);
    });
    return unsubscribe;
  }, []);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [ngo, setNgo] = useState(null);
  const [ngoLabel, setNgoLabel] = useState("");
  const [cause, setCause] = useState("");
  const [causeLabel, setCauseLabel] = useState("");
  const [ngoOptions, setNgoOptions] = useState([]);
  const [causeOptions, setCauseOptions] = useState([]);
  const [loadingNgos, setLoadingNgos] = useState(true);
  const [loadingCauses, setLoadingCauses] = useState(true);
  const [salePrice, setSalePrice] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [currency, setCurrency] = useState(currencyOptions[0]);
  const [condition, setCondition] = useState(conditionOptions[0]);
  const [description, setDescription] = useState("");
  const [useAddress, setUseAddress] = useState(false);
  const [agree, setAgree] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [pickupLocation, setPickupLocation] = useState("");
  const [pickupCoords, setPickupCoords] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [region, setRegion] = useState(null);

  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [autocompleteLoading, setAutocompleteLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const [category, setCategory] = useState(categoryOptions[0]);
  const currencyData = currencyOptions.map((opt) => ({
    label: opt,
    value: opt,
  }));
  const conditionData = conditionOptions.map((opt) => ({
    label: opt,
    value: opt,
  }));

  const pickImages = async () => {
    if ((images || []).length >= MAX_IMAGES) {
      Alert.alert(`Max number of images is ${MAX_IMAGES}.`);
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_IMAGES - (images || []).length,
    });
    if (!result.canceled) {
      const newImages = result.assets
        ? result.assets.slice(0, MAX_IMAGES - (images || []).length)
        : [result];
      setImages([...(images || []), ...newImages].slice(0, MAX_IMAGES));
    }
  };

  const removeImage = (idx) => {
    setImages((imgs) =>
      Array.isArray(imgs) ? imgs.filter((_, i) => i !== idx) : []
    );
  };

  const uploadImageToS3 = async (img, userId, itemId) => {
    const fileName = img.fileName || img.uri.split("/").pop();
    const fileType =
      img.type && img.type.startsWith("image/")
        ? img.type
        : getMimeType(img.uri);

    const res = await fetch(
      `${BACKEND_URL}/get-presigned-url?fileName=${encodeURIComponent(
        fileName
      )}&fileType=${encodeURIComponent(
        fileType
      )}&userId=${userId}&itemId=${itemId}`
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

  useEffect(() => {
    setLoadingNgos(true);
    const unsubscribe = onSnapshot(collection(db, "ngo"), (snapshot) => {
      const ngos = snapshot.docs
        .map((doc) => ({
          label: doc.data().ngoName,
          value: doc.data().uid,
        }))
        .filter((ngo) => ngo.label && ngo.value);
      setNgoOptions(ngos);
      setLoadingNgos(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!ngo) {
      setCauseOptions([]);
      setCause("");
      setCauseLabel("");
      setLoadingCauses(false);
      return;
    }
    setLoadingCauses(true);
    const unsubscribe = onSnapshot(
      collection(db, "campaigns"),
      (snapshot) => {
        const causes = snapshot.docs
          .filter((doc) => {
            const createdBy = doc.data().createdBy;
            const ngoValue =
              typeof ngo === "object" && ngo !== null ? ngo.value : ngo;
            return createdBy === ngoValue;
          })
          .map((doc) => ({
            label: doc.data().title,
            value: doc.id,
          }))
          .filter((cause) => cause.label && cause.value);
        setCauseOptions(causes);
        setLoadingCauses(false);
      },
      (error) => {
        setLoadingCauses(false);
      }
    );
    return () => unsubscribe();
  }, [ngo]);

  const handleSubmit = async () => {
    if (!agree) {
      Alert.alert("Please agree to the terms before submitting.");
      return;
    }
    if (
      !title.trim() ||
      !price.trim() ||
      !description.trim() ||
      !ngo ||
      !cause ||
      (images || []).length === 0
    ) {
      Alert.alert("Please fill all fields and select at least one image.");
      return;
    }
    if (!pickupLocation) {
      Alert.alert("Please select a pickup location.");
      return;
    }
    setLoading(true);
    try {
      const auth = getAuth();
      const userId = auth.currentUser ? auth.currentUser.uid : "unknown";
      const email = userEmail;
      const itemId = Math.random().toString(36).substring(2, 15);
      const imageUrls = await uploadAllImages(userId, itemId);

      await addDoc(collection(db, "items"), {
        title,
        ngo,
        ngoName: ngoLabel,
        cause,
        causeName: causeLabel,
        price: parseFloat(price),
        salePrice: salePrice ? parseFloat(salePrice) : 0,
        negotiable,
        currency,
        condition,
        category,
        description,
        useAddress,
        imageUrls,
        userId,
        email,
        pickupLocation,
        pickupCoords,
        createdAt: serverTimestamp(),
      });

      Alert.alert("Ad listed successfully!");
      setTitle("");
      setNgo("");
      setNgoLabel("");
      setCause("");
      setCauseLabel("");
      setPrice("");
      setSalePrice("");
      setNegotiable(false);
      setCurrency(currencyOptions[0]);
      setCondition(conditionOptions[0]);
      setCategory(categoryOptions[0]);
      setDescription("");
      setUseAddress(false);
      setImages([]);
      setAgree(false);
      setPickupLocation("");
      setPickupCoords(null);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
    setLoading(false);
  };

  const renderImageItem = ({ item, index }) => (
    <View style={styles.imageBox}>
      <Image
        source={{
          uri:
            typeof item === "string"
              ? item
              : item.publicUrl || item.downloadUrl || item.uri,
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

  const renderAddImageBtn = () => (
    <TouchableOpacity
      style={styles.imageBox}
      onPress={pickImages}
      disabled={(images || []).length >= MAX_IMAGES}
    >
      <Text style={{ fontSize: 32, color: "#bbb" }}>+</Text>
    </TouchableOpacity>
  );

  const safeImages = Array.isArray(images) ? images : [];

  const openLocationModal = async () => {
    setModalVisible(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission to access location was denied");
        setModalVisible(false);
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (err) {
      setModalVisible(false);
    }
  };

  const fetchSuggestions = async (text) => {
    setSearch(text);
    if (!text) {
      setSuggestions([]);
      return;
    }
    setAutocompleteLoading(true);
    try {
      const res = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
        {
          params: {
            key: GOOGLE_API_KEY,
            input: text,
            language: "en",
            types: "address",
          },
        }
      );
      setSuggestions(res.data.predictions || []);
    } catch (err) {
      setSuggestions([]);
    }
    setAutocompleteLoading(false);
  };

  const fetchPlaceDetails = async (placeId) => {
    try {
      const res = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            key: GOOGLE_API_KEY,
            place_id: placeId,
            fields: "geometry,formatted_address,address_components",
          },
        }
      );
      return res.data.result;
    } catch (err) {
      return null;
    }
  };

  const getPostalCode = (components) => {
    if (!components) return "";
    const pc = components.find((c) => c.types.includes("postal_code"));
    return pc ? pc.long_name : "";
  };

  const handleSelect = async (item) => {
    setAutocompleteLoading(true);
    const details = await fetchPlaceDetails(item.place_id);
    if (details) {
      setSelected({
        address: details.formatted_address,
        coords: details.geometry.location,
        postalCode: getPostalCode(details.address_components),
      });
      setRegion({
        latitude: details.geometry.location.lat,
        longitude: details.geometry.location.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setPickupCoords({
        latitude: details.geometry.location.lat,
        longitude: details.geometry.location.lng,
      });
      setPickupLocation(
        getPostalCode(details.address_components) ||
          details.formatted_address ||
          item.description
      );
      setSearch(
        getPostalCode(details.address_components) ||
          details.formatted_address ||
          item.description
      );
      setSuggestions([]);
    }
    setAutocompleteLoading(false);
  };

  const handleApplyLocation = () => {
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingTop: 12 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Text style={styles.header}>List your Ad</Text>
            <Text style={styles.label}>Ad Images/Video</Text>
            <View>
              <FlatList
                data={[
                  ...safeImages,
                  ...(safeImages.length < MAX_IMAGES ? [{}] : []),
                ]}
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
                Prepare images before uploading. Upload images larger than 750px
                × 450px. Max number of images is 5. Max image size is 134MB.
              </Text>
            </View>

            <Text style={styles.inputLabel}>CATEGORY</Text>
            <CustomDropdown
              data={categoryData}
              value={category}
              onChange={setCategory}
              placeholder="Select Category"
              testID="categoryDropdown"
            />

            <Text style={styles.sectionHeader}>Tell us about your item</Text>
            <Text style={styles.inputLabel}>TITLE</Text>
            <TextInput
              placeholder="The item's title"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Select NGO</Text>
            {loadingNgos ? (
              <ActivityIndicator size="small" color="#2CB67D" />
            ) : (
              <CustomDropdown
                data={ngoOptions}
                value={ngo}
                onChange={(item) => {
                  setNgo(item.value);
                  setNgoLabel(item.label);
                  setCause("");
                  setCauseLabel("");
                }}
                placeholder="Select NGO"
                testID="ngoDropdown"
              />
            )}

            <Text style={styles.inputLabel}>Select Cause</Text>
            {loadingCauses ? (
              <ActivityIndicator size="small" color="#2CB67D" />
            ) : (
              <CustomDropdown
                data={causeOptions}
                value={cause}
                onChange={(item) => {
                  setCause(item.value);
                  setCauseLabel(item.label);
                }}
                placeholder={
                  ngo
                    ? loadingCauses
                      ? "Loading causes..."
                      : "Select Cause"
                    : "Select NGO first"
                }
                testID="causeDropdown"
                disabled={!ngo}
              />
            )}

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
              style={[
                styles.input,
                { minHeight: 60, textAlignVertical: "top" },
              ]}
            />

            <View style={styles.pickupRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>PICKUP LOCATION</Text>
                <TouchableOpacity
                  onPress={openLocationModal}
                  activeOpacity={0.7}
                >
                  <TextInput
                    placeholder="Pickup Location"
                    value={pickupLocation}
                    editable={false}
                    pointerEvents="none"
                    style={[styles.input, { backgroundColor: "#f7f7f7" }]}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <Modal
              visible={modalVisible}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setModalVisible(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                  <View style={styles.dragIndicator} />
                  <TouchableOpacity
                    style={styles.closeIcon}
                    onPress={() => setModalVisible(false)}
                    hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                  >
                    <Text style={{ fontSize: 22, color: "#888" }}>×</Text>
                  </TouchableOpacity>
                  <TextInput
                    placeholder="Search address"
                    value={search}
                    onChangeText={fetchSuggestions}
                    style={styles.modalSearch}
                    autoFocus
                  />
                  {autocompleteLoading && <ActivityIndicator size="small" />}
                  <FlatList
                    data={suggestions || []}
                    keyExtractor={(item) => item.place_id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.suggestion}
                        onPress={() => handleSelect(item)}
                      >
                        <Text>{item.description}</Text>
                      </TouchableOpacity>
                    )}
                    style={{
                      maxHeight: 160,
                      marginBottom: 8,
                      backgroundColor: "#fff",
                      borderRadius: 6,
                    }}
                    keyboardShouldPersistTaps="handled"
                  />
                  <View style={styles.mapContainer}>
                    {region && (
                      <MapView
                        style={styles.map}
                        region={region}
                        showsUserLocation={true}
                      >
                        {pickupCoords && (
                          <Marker
                            coordinate={{
                              latitude: pickupCoords.latitude,
                              longitude: pickupCoords.longitude,
                            }}
                          />
                        )}
                      </MapView>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={handleApplyLocation}
                    disabled={!pickupLocation}
                  >
                    <Text style={styles.applyButtonText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
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
                  setNgo("");
                  setNgoLabel("");
                  setCause("");
                  setCauseLabel("");
                  setPrice("");
                  setSalePrice("");
                  setNegotiable(false);
                  setCurrency(currencyOptions[0]);
                  setCondition(conditionOptions[0]);
                  setCategory(categoryOptions[0]);
                  setDescription("");
                  setUseAddress(false);
                  setImages([]);
                  setAgree(false);
                  setPickupLocation("");
                  setPickupCoords(null);
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
      </KeyboardAvoidingView>
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
  pickupRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginHorizontal: 0,
    marginTop: 18,
    marginBottom: 8,
    gap: 8,
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
  // Modal UI
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.32)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
    minHeight: 480,
    maxHeight: "90%",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    position: "relative",
  },
  dragIndicator: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#e0e0e0",
    alignSelf: "center",
    marginBottom: 12,
  },
  closeIcon: {
    position: "absolute",
    top: 10,
    right: 12,
    zIndex: 2,
  },
  modalSearch: {
    borderWidth: 1,
    borderColor: "#DCE3E9",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f8fafb",
    marginBottom: 8,
    marginTop: 8,
    elevation: 1,
  },
  mapContainer: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
    marginTop: 8,
    marginBottom: 16,
    height: 220,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  applyButton: {
    backgroundColor: "#F6B93B",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    marginTop: 8,
    marginBottom: Platform.OS === "ios" ? 12 : 0,
    elevation: 2,
  },
  applyButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18, 
    letterSpacing: 0.5,
  },
  suggestion: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
});
