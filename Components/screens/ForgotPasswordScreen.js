import React, { useState, useContext } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
} from "react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../firebaseConfig";
import { ThemeContext } from "../Utilities/ThemeContext";

export default function ForgotPasswordScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const styles = isDarkMode ? darkStyles : lightStyles;

  const [email, setEmail] = useState("");

  const handleResetPassword = async () => {
    if (!email) {
      return Alert.alert("Error", "Please enter your email address.");
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        "Email Sent",
        "Password reset email sent! Please check your inbox."
      );
      navigation.goBack();
    } catch (error) {
      Alert.alert("Reset Failed", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={styles.container.backgroundColor}
      />
      <View style={styles.content}>
        <Text style={styles.title}>Reset Your Password</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor={isDarkMode ? "#888" : "#aaa"}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TouchableOpacity
          onPress={handleResetPassword}
          style={styles.resetButton}
        >
          <Text style={styles.resetButtonText}>Send Reset Email</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const baseStyles = {
  container: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 80,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 30,
  },
  input: {
    width: "100%",
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 20,
    fontSize: 16,
  },
  resetButton: {
    width: "100%",
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
};

const lightStyles = StyleSheet.create({
  ...baseStyles,
  container: {
    ...baseStyles.container,
    backgroundColor: "#fff",
  },
  title: {
    ...baseStyles.title,
    color: "#1F2E41",
  },
  input: {
    ...baseStyles.input,
    backgroundColor: "#F5F5F5",
    color: "#222",
  },
  resetButton: {
    ...baseStyles.resetButton,
    backgroundColor: "#F3E8DD",
  },
  resetButtonText: {
    ...baseStyles.resetButtonText,
    color: "#1F2E41",
  },
});

const darkStyles = StyleSheet.create({
  ...baseStyles,
  container: {
    ...baseStyles.container,
    backgroundColor: "#121212",
  },
  title: {
    ...baseStyles.title,
    color: "#ddd",
  },
  input: {
    ...baseStyles.input,
    backgroundColor: "#2a2a2a",
    color: "#eee",
  },
  resetButton: {
    ...baseStyles.resetButton,
    backgroundColor: "#F6B93B",
  },
  resetButtonText: {
    ...baseStyles.resetButtonText,
    color: "#121212",
  },
});
