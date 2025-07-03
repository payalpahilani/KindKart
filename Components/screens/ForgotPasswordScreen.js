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
        {/* Back Button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

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

        <TouchableOpacity onPress={handleResetPassword} style={styles.resetButton}>
          <Text style={styles.resetButtonText}>Send Reset Email</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const baseStyles = {
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 24,
  },
  backText: {
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 32,
  },
  input: {
    width: "100%",
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 24,
    fontSize: 16,
  },
  resetButton: {
    width: "100%",
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
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
  backText: {
    ...baseStyles.backText,
    color: "#EFAC3A",
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
    backgroundColor: "#EFAC3A",
  },
  resetButtonText: {
    ...baseStyles.resetButtonText,
    color: "#fff",
  },
});

const darkStyles = StyleSheet.create({
  ...baseStyles,
  container: {
    ...baseStyles.container,
    backgroundColor: "#121212",
  },
  backText: {
    ...baseStyles.backText,
    color: "#FFC107",
  },
  title: {
    ...baseStyles.title,
    color: "#fff",
  },
  input: {
    ...baseStyles.input,
    backgroundColor: "#2a2a2a",
    color: "#eee",
  },
  resetButton: {
    ...baseStyles.resetButton,
    backgroundColor: "#EFAC3A",
  },
  resetButtonText: {
    ...baseStyles.resetButtonText,
    color: "#121212",
  },
});
