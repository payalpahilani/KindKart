import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import Checkbox from "expo-checkbox";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";

const ngos = ["Orphan Foundation", "Red Cross", "Save the Children"];
const causes = [
  "Help children for orphanage scholarship",
  "Medical Aid",
  "Education Support",
];
const currencies = ["CAD($)", "USD($)", "INR(₹)"];
const conditions = ["New", "Used", "Refurbished"];

export default function ListItemScreen() {
  const [images, setImages] = useState([]);
  const [title, setTitle] = useState("");
  const [ngo, setNgo] = useState(ngos[0]);
  const [cause, setCause] = useState(causes[0]);
  const [price, setPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [negotiable, setNegotiable] = useState(false);
  const [currency, setCurrency] = useState(currencies[0]);
  const [condition, setCondition] = useState(conditions[0]);
  const [description, setDescription] = useState("");
  const [useAddress, setUseAddress] = useState(false);
  const [agree, setAgree] = useState(false);

  // Modals for pickers
  const [ngoModal, setNgoModal] = useState(false);
  const [causeModal, setCauseModal] = useState(false);
  const [currencyModal, setCurrencyModal] = useState(false);
  const [conditionModal, setConditionModal] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"], // Updated for deprecation warning
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImages([...images, ...result.assets.map((a) => a.uri)]);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#fff" }}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>List your Ad</Text>

        {/* Images/Video */}
        <Text style={styles.sectionLabel}>Ad Images/Video</Text>
        <View style={styles.imageRow}>
          {images.slice(0, 5).map((img, idx) => (
            <Image
              key={idx}
              source={{ uri: img }}
              style={styles.uploadedImage}
              resizeMode="cover"
            />
          ))}
          {images.length < 5 &&
            Array.from({ length: 5 - images.length }).map((_, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.addImageBox}
                onPress={pickImage}
              >
                <Icon name="plus" size={28} color="#B0B0B0" />
              </TouchableOpacity>
            ))}
        </View>
        <Text style={styles.imageHint}>
          Prepare images before uploading. Upload images larger than 750px x
          450px. Max number of images is 5. Max image size is 134MB.
        </Text>

        {/* Title */}
        <Text style={styles.inputLabel}>Tell us about your item</Text>
        <TextInput
          style={styles.input}
          placeholder="The item's title"
          value={title}
          onChangeText={setTitle}
        />

        {/* NGO Picker */}
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setNgoModal(true)}
        >
          <Text style={styles.dropdownText}>{ngo}</Text>
          <Icon name="chevron-down" size={22} color="#B0B0B0" />
        </TouchableOpacity>
        <Modal visible={ngoModal} transparent animationType="fade">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setNgoModal(false)}
          >
            <View style={styles.modalContent}>
              {ngos.map((n, i) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => {
                    setNgo(n);
                    setNgoModal(false);
                  }}
                  style={styles.modalItem}
                >
                  <Text style={styles.modalItemText}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        {/* Cause Picker */}
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setCauseModal(true)}
        >
          <Text style={styles.dropdownText}>{cause}</Text>
          <Icon name="chevron-down" size={22} color="#B0B0B0" />
        </TouchableOpacity>
        <Modal visible={causeModal} transparent animationType="fade">
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setCauseModal(false)}
          >
            <View style={styles.modalContent}>
              {causes.map((c, i) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => {
                    setCause(c);
                    setCauseModal(false);
                  }}
                  style={styles.modalItem}
                >
                  <Text style={styles.modalItemText}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>

        {/* Price Row */}
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <TextInput
              style={styles.input}
              placeholder="Price"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <TextInput
              style={styles.input}
              placeholder="Sale Price"
              value={salePrice}
              onChangeText={setSalePrice}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Negotiable */}
        <View style={styles.checkboxRow}>
          <Checkbox
            value={negotiable}
            onValueChange={setNegotiable}
            color={negotiable ? "#F6B93B" : undefined}
          />
          <Text style={styles.checkboxLabel}>Is price negotiable?</Text>
        </View>

        {/* Currency & Condition */}
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.dropdown, { flex: 1, marginRight: 6 }]}
            onPress={() => setCurrencyModal(true)}
          >
            <Text style={styles.dropdownText}>{currency}</Text>
            <Icon name="chevron-down" size={22} color="#B0B0B0" />
          </TouchableOpacity>
          <Modal visible={currencyModal} transparent animationType="fade">
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setCurrencyModal(false)}
            >
              <View style={styles.modalContent}>
                {currencies.map((c, i) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => {
                      setCurrency(c);
                      setCurrencyModal(false);
                    }}
                    style={styles.modalItem}
                  >
                    <Text style={styles.modalItemText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Pressable>
          </Modal>
          <TouchableOpacity
            style={[styles.dropdown, { flex: 1, marginLeft: 6 }]}
            onPress={() => setConditionModal(true)}
          >
            <Text style={styles.dropdownText}>{condition}</Text>
            <Icon name="chevron-down" size={22} color="#B0B0B0" />
          </TouchableOpacity>
          <Modal visible={conditionModal} transparent animationType="fade">
            <Pressable
              style={styles.modalOverlay}
              onPress={() => setConditionModal(false)}
            >
              <View style={styles.modalContent}>
                {conditions.map((c, i) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => {
                      setCondition(c);
                      setConditionModal(false);
                    }}
                    style={styles.modalItem}
                  >
                    <Text style={styles.modalItemText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Pressable>
          </Modal>
        </View>

        {/* Description */}
        <TextInput
          style={[styles.input, { height: 70, textAlignVertical: "top" }]}
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {/* Location & Contact */}
        <Text style={styles.sectionLabel}>Location & Contact</Text>
        <View style={styles.checkboxRow}>
          <Checkbox
            value={useAddress}
            onValueChange={setUseAddress}
            color={useAddress ? "#F6B93B" : undefined}
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
          />
          <Text style={styles.checkboxLabel}>
            I agree to{" "}
            <Text style={{ color: "#F6B93B" }}>terms & conditions</Text>
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: agree ? "#F6B93B" : "#F7DCA5" },
            ]}
            disabled={!agree}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 18,
    paddingBottom: 40,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 26,
    fontWeight: "bold",
    alignSelf: "center",
    marginVertical: 10,
    color: "#23253A",
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#23253A",
    marginBottom: 8,
    marginTop: 12,
  },
  imageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  uploadedImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: "#F5F5F5",
  },
  addImageBox: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    backgroundColor: "#F8F8F8",
  },
  imageHint: {
    fontSize: 12,
    color: "#A0A0A0",
    marginBottom: 16,
    marginLeft: 2,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#23253A",
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    fontSize: 15,
    marginBottom: 12,
    backgroundColor: "#F8F8F8",
    color: "#23253A",
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    marginBottom: 12,
    backgroundColor: "#F8F8F8",
    justifyContent: "space-between",
  },
  dropdownText: {
    fontSize: 15,
    color: "#23253A",
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    elevation: 5,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 6,
  },
  modalItemText: {
    fontSize: 16,
    color: "#23253A",
  },
  row: {
    flexDirection: "row",
    marginBottom: 12,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkboxLabel: {
    fontSize: 15,
    color: "#23253A",
    marginLeft: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#E3EFF2",
    paddingVertical: 13,
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#23253A",
    fontWeight: "bold",
    fontSize: 16,
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#F6B93B",
    paddingVertical: 13,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
