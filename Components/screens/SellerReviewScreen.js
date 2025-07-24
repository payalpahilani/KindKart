import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db, auth } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { ThemeContext } from "../Utilities/ThemeContext";

const TAG_OPTIONS = [
  "Friendly",
  "Responsive",
  "Quality Products",
  "Fast Shipping",
  "Honest",
  "Reliable",
  "Helpful",
];

export default function SellerReviewScreen({ route, navigation }) {
  const { sellerId } = route.params; // Pass seller's userId
  const { isDarkMode } = useContext(ThemeContext);

  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);



  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const submitReview = async () => {
    if (!rating || !text.trim()) {
      Alert.alert("Please add a rating and review.");
      return;
    }
    setSubmitting(true);

    try {
      const reviewer = auth.currentUser;
      if (!reviewer) throw new Error("User not logged in");

      const userDoc = await getDoc(doc(db, "users", reviewer.uid));
      const avatarUrl = userDoc.exists() ? userDoc.data().avatarUrl || "" : "";

      await addDoc(collection(db, "users", sellerId, "reviews"), {
        reviewerId: reviewer.uid,
        reviewerName: reviewer.displayName || "Anonymous",
        reviewerAvatar: avatarUrl,
        rating,
        text,
        tags: selectedTags,
        createdAt: serverTimestamp(),
      });

      navigation.goBack();
    } catch (err) {
      Alert.alert("Submit failed, please try again");
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, isDarkMode ? styles.dark : styles.light]}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={[
            styles.title,
            isDarkMode ? styles.titleDark : styles.titleLight,
          ]}
        >
          Thank you for your purchase!
        </Text>

        {/* Rating Stars */}
        <View
          style={{ flexDirection: "row", marginVertical: 1, marginBottom: 10 }}
        >
          {[1, 2, 3, 4, 5].map((num) => (
            <TouchableOpacity key={num} onPress={() => setRating(num)}>
              <Icon
                name={rating >= num ? "star" : "star-outline"}
                size={36}
                color="#F6C700"
                style={{ marginHorizontal: 4 }}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Tags Selection */}
        <Text
          style={[
            styles.subTitle,
            isDarkMode ? styles.titleDark : styles.titleLight,
            { marginBottom: 8 },
          ]}
        >
          Select Tags
        </Text>
        <View style={styles.tagsContainer}>
          {TAG_OPTIONS.map((tag) => {
            const selected = selectedTags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tag,
                  selected ? styles.tagSelected : null,
                  isDarkMode && !selected ? styles.tagDark : null,
                ]}
                onPress={() => toggleTag(tag)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tagText,
                    selected
                      ? styles.tagTextSelected
                      : isDarkMode
                      ? styles.tagTextDark
                      : null,
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Review Text Input */}
        <TextInput
          placeholder="Share your experience..."
          placeholderTextColor={isDarkMode ? "#888" : "#aaa"}
          style={[
            styles.input,
            isDarkMode ? styles.inputDark : styles.inputLight,
          ]}
          multiline
          value={text}
          onChangeText={setText}
          editable={!submitting}
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.button, { opacity: submitting ? 0.6 : 1 }]}
          onPress={submitReview}
          disabled={submitting}
        >
          <Text style={styles.buttonText}>
            {submitting ? "Submitting..." : "Submit Review"}
          </Text>
        </TouchableOpacity>
        {/* No Thanks Button */}
        <TouchableOpacity
          style={[styles.noThanksButton]}
          onPress={() => navigation.goBack()}
          disabled={submitting}
        >
          <Text style={styles.noThanksButtonText}>No thanks</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const BUTTON_COLOR = "#0066CC";
const BUTTON_COLOR_DARK = "#3399FF";
const BUTTON_YELLOW = "#F6C700";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dark: {
    backgroundColor: "#121212",
  },
  light: {
    backgroundColor: "#f9f9f9",
  },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 12,
  },
  titleDark: {
    color: "#eee",
  },
  titleLight: {
    color: "#111",
  },
  subTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
  },

  tag: {
    borderWidth: 1,
    borderColor: "#bbb",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  tagDark: {
    borderColor: "#555",
  },
  tagSelected: {
    backgroundColor: BUTTON_COLOR,
    borderColor: BUTTON_COLOR,
  },
  tagText: {
    fontSize: 14,
    color: "#555",
  },
  tagTextDark: {
    color: "#ccc",
  },
  tagTextSelected: {
    color: "white",
    fontWeight: "600",
  },

  input: {
    minHeight: 100,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: "top",
    marginBottom: 24,
  },
  inputDark: {
    backgroundColor: "#1e1e1e",
    color: "#eee",
  },
  inputLight: {
    backgroundColor: "#fff",
    color: "#222",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  button: {
    backgroundColor: BUTTON_YELLOW,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  noThanksButton: {
    marginTop: 12,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: BUTTON_YELLOW,
  },

  noThanksButtonText: {
    color: BUTTON_YELLOW,
    fontWeight: "700",
    fontSize: 16,
  },
});
