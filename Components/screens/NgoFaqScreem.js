import React, { useState, useContext } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ThemeContext } from "../Utilities/ThemeContext";

// Enable LayoutAnimation for Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_DATA = [
  {
    question: "How do I create a new campaign?",
    answer: "Go to 'Create Campaign' from the NGO Dashboard. Fill in the details like title, category, goal amount, urgency, and upload images before submitting.",
  },
  {
    question: "How can I edit or close an existing campaign?",
    answer: "Navigate to 'Your Campaigns' and tap on the campaign you'd like to edit. You can modify details or close it if your goal is met.",
  },
  {
    question: "How do I upload my NGO profile image?",
    answer: "On the Profile screen, tap the profile image section to select and upload a new image. It will be saved and shown across the app.",
  },
  {
    question: "How do I track the donations received?",
    answer: "Each campaign shows a progress bar with the total amount received. You can view more details in the campaign detail view.",
  },
  {
    question: "Can I contact the donors?",
    answer: "Currently, donor contact details are private to ensure security. You can post thank-you notes or updates in your campaign description.",
  },
  {
    question: "How do I log out of my NGO account?",
    answer: "Go to your profile and select the 'Sign Out' option at the bottom of the screen.",
  },
];

export default function NgoFAQScreen({ navigation }) {
  const [expandedIndex, setExpandedIndex] = useState(null);
  const { isDarkMode } = useContext(ThemeContext);

  const toggleExpand = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const renderItem = ({ item, index }) => {
    const expanded = expandedIndex === index;

    return (
      <View
        style={[
          styles.itemContainer,
          {
            backgroundColor: isDarkMode ? "#fff" : "#fff",
            shadowColor: isDarkMode ? "#000" : "#AAA",
            borderColor: isDarkMode ? "#333" : "#DDD",
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => toggleExpand(index)}
          style={styles.questionContainer}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={`FAQ question: ${item.question || ""}`}
        >
          <Text
            style={[
              styles.questionText,
              { color: isDarkMode ? "#FFF" : "#222" },
            ]}
          >
            {item.question || "Question missing"}
          </Text>
          <Icon
            name={expanded ? "minus-circle-outline" : "plus-circle-outline"}
            size={26}
            color="#F6B93B"
          />
        </TouchableOpacity>

        {expanded && (
          <View style={styles.answerContainer}>
            <Text
              style={[
                styles.answerText,
                { color: isDarkMode ? "#CCC" : "#555" },
              ]}
            >
              {item.answer || "No answer available."}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDarkMode ? "#121212" : "#F8F8F8" },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: isDarkMode ? "#333" : "#DDD" },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation?.goBack?.()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-left" size={28} color="#F6B93B" />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: "#F6B93B" }]}
          accessibilityRole="header"
        >
          {"NGO FAQs"}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={FAQ_DATA}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingRight: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  listContent: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  itemContainer: {
    borderRadius: 12,
    paddingHorizontal: 20,
    marginBottom: 14,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    borderWidth: 1,
  },
  questionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
  },
  questionText: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
    paddingRight: 10,
  },
  answerContainer: {
    paddingBottom: 18,
  },
  answerText: {
    fontSize: 16,
    lineHeight: 22,
  },
});
