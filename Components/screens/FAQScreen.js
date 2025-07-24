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
    question: "How do I list an item for sale?",
    answer:
      "Go to the 'Sell' tab, fill out the item details, and submit your listing. Make sure to include clear pictures and detailed descriptions for best results.",
  },
  {
    question: "How do I start a chat with a seller?",
    answer:
      "On an item's detail screen, tap the 'Chat' button to start a conversation. This will create a chat room where you and the seller can discuss the item.",
  },
  {
    question: "How does the payment process work?",
    answer:
      "Payments are securely processed via Stripe. Follow the prompts during checkout to complete your purchase. Your payment details are never stored on our servers.",
  },
  {
    question: "Can I edit or delete my listing?",
    answer:
      "Yes, go to the 'Your Ads' tab, select the listing, and use the Edit or Delete options to modify or remove your ad accordingly.",
  },
  {
    question: "What if I forget my password?",
    answer:
      "Use the 'Forgot Password' option on the login screen to receive password reset instructions via email.",
  },
  {
    question: "How can I reset my password?",
    answer:
      "You can reset your password by navigating to the login screen and tapping on 'Forgot Password'. Follow the instructions sent to your email.",
  },
  {
    question: "How is my data protected?",
    answer:
      "We take your privacy seriously. All your data is securely stored and processed following industry-standard encryption and our privacy policy.",
  },
  {
    question: "Why can't I see an ad preview in chat?",
    answer:
      "The ad preview is shown only if the chat room has a linked listing. If it's missing, it might be due to the ad being deleted or a sync issue.",
  },
  {
    question: "What do I do if messages are not sending?",
    answer:
      "Check your internet connection and try restarting the app. If the problem persists, contact support for further assistance.",
  },
];

export default function FAQScreen({ navigation }) {
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
            backgroundColor: isDarkMode ? "#1E1E1E" : "#fff",
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
          {"Frequently Asked Questions"}
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
