import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Image,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId:
      "731786242882-036vr75864aapuuvelh4i3ogoc88bpnk.apps.googleusercontent.com",
    webClientId:
      "731786242882-036vr75864aapuuvelh4i3ogoc88bpnk.apps.googleusercontent.com",
    iosClientId:
      "731786242882-t76sffnd4rnqmpmocqquumn5spoa6ag7.apps.googleusercontent.com",
    scopes: ["profile", "email"],
  });

  // Google sign-in response handler
  useEffect(() => {
    if (response?.type === "success") {
      const { idToken, accessToken } = response.authentication;
      const credential = GoogleAuthProvider.credential(idToken, accessToken);

      signInWithCredential(auth, credential)
        .then(async (userCred) => {
          const user = userCred.user;

          // ✅ Save user to Firestore
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            name: user.displayName || "",
            email: user.email,
            phone: "", // You can allow editing later
            avatarUrl: user.photoURL || "",
            createdAt: serverTimestamp(),
          });

          Alert.alert("Welcome", `Logged in as ${user.displayName}`);
          navigation.replace("Home");
        })
        .catch((err) => Alert.alert("Google Sign Up Error", err.message));
    }
  }, [response]);

  const handleSignUp = async () => {
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      return Alert.alert("Error", "Please fill in all fields.");
    }
    if (password !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match.");
    }

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCred.user;

      await updateProfile(user, { displayName: fullName });

      if (rememberMe) {
        await AsyncStorage.setItem(
          "userCredentials",
          JSON.stringify({ email, password })
        );
      }

      // ✅ Save user data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: fullName,
        email: email,
        phone: phone,
        avatarUrl: "",
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Account created!");
      navigation.replace("Home");
    } catch (err) {
      Alert.alert("Sign Up Error", err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create your account</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#aaa"
          value={fullName}
          onChangeText={setFullName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          placeholderTextColor="#aaa"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <View style={styles.rememberMeContainer}>
          <Text style={styles.rememberMeText}>Remember Me</Text>
          <Switch
            value={rememberMe}
            onValueChange={setRememberMe}
            trackColor={{ false: "#767577", true: "#ffc107" }}
            thumbColor={rememberMe ? "#fff" : "#f4f3f4"}
          />
        </View>

        <TouchableOpacity onPress={handleSignUp} style={styles.signUpButton}>
          <Text style={styles.signUpButtonText}>SIGN UP</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.replace("MainTabs", { screen: "HomeScreen" })}>
          <Text style={styles.loginText}>
            Already have an account?{" "}
            <Text style={styles.loginLink}>Log In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, paddingHorizontal: 30, paddingTop: 80 },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1F2E41",
    marginBottom: 30,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#F5F5F5",
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 20,
    fontSize: 16,
  },
  rememberMeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  rememberMeText: { fontSize: 16, color: "#333" },
  signUpButton: {
    width: "100%",
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F3E8DD",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  signUpButtonText: { fontSize: 16, fontWeight: "600", color: "#1F2E41" },
  orText: { textAlign: "center", color: "#AAA", marginBottom: 16 },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 40,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: { width: 30, height: 30, resizeMode: "contain" },
  loginText: { textAlign: "center", color: "#333", fontSize: 14 },
  loginLink: { color: "#EFAC3A", fontWeight: "600" },
});
