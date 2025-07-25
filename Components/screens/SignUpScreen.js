import React, { useState, useContext } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { LinearGradient } from "expo-linear-gradient";
import { auth, db } from "../../firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ThemeContext } from "../Utilities/ThemeContext";

export default function SignUpScreen({ navigation }) {
  const { isDarkMode } = useContext(ThemeContext);
  const styles = getStyles(isDarkMode);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });


  const validateInputs = () => {
    let valid = true;
    const newErrors = {
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    };
  
    if (!fullName.trim()) {
      newErrors.fullName = 'Full name is required';
      valid = false;
    }
  
    if (!email.trim()) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Enter a valid email address';
      valid = false;
    }
  
    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
      valid = false;
    } else if (!/^\d{10}$/.test(phone)) {
      newErrors.phone = 'Enter a valid phone number';
      valid = false;
    }
  
    if (!password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }
  
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirm your password';
      valid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      valid = false;
    }
  
    setErrors(newErrors);
    return valid;
  };

  
  const handleSignUp = async () => {
    if (!validateInputs()) return;
  
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
  
      await updateProfile(user, { displayName: fullName });
  
      if (rememberMe) {
        await AsyncStorage.setItem("userCredentials", JSON.stringify({ email, password }));
      } else {
        await AsyncStorage.removeItem("userCredentials");
      }
  
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: fullName,
        email: email,
        phone: phone,
        avatarUrl: "",
        emailVerified: false,
        createdAt: serverTimestamp(),
      });
  
      Alert.alert("Success", "Account created!");
      navigation.replace("Login");
    } catch (err) {
      Alert.alert("Sign Up Error", err.message);
    }
  };
  

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        backgroundColor={styles.container.backgroundColor}
      />
      <View style={styles.content}>
        <Text style={styles.title}>Create your account</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor={isDarkMode ? "#aaa" : "#666"}
          value={fullName}
          onChangeText={setFullName}
        />
        {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor={isDarkMode ? "#aaa" : "#666"}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}


        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          placeholderTextColor={isDarkMode ? "#aaa" : "#666"}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}


        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={isDarkMode ? "#aaa" : "#666"}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
        

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor={isDarkMode ? "#aaa" : "#666"}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}

        <View style={styles.rememberMeContainer}>
          <Text style={styles.rememberMeText}>Remember Me</Text>
          <Switch
            value={rememberMe}
            onValueChange={setRememberMe}
            trackColor={{ false: "#767577", true: "#ffc107" }}
            thumbColor={rememberMe ? "#fff" : "#f4f3f4"}
          />
        </View>

        <TouchableOpacity onPress={handleSignUp}> 
        <LinearGradient
                    colors={isDarkMode ? ['#EFAC3A', '#FFC107'] : ['#F3E8DD', '#B8D6DF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.signUpButton}
                  >
          <Text style={styles.signUpButtonText}>SIGN UP</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.replace("Login")}>
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginLink}>Log In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#121212" : "#fff",
    },
    content: {
      flex: 1,
      paddingHorizontal: 30,
      paddingTop: 80,
    },
    title: {
      fontSize: 26,
      fontWeight: "700",
      color: isDark ? "#fff" : "#1F2E41",
      marginBottom: 30,
    },
    input: {
      width: "100%",
      height: 50,
      backgroundColor: isDark ? "#1e1e1e" : "#F5F5F5",
      borderRadius: 25,
      paddingHorizontal: 20,
      marginBottom: 10,
      fontSize: 16,
      color: isDark ? "#fff" : "#000",
    },
    rememberMeContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 24,
    },
    rememberMeText: {
      fontSize: 16,
      color: isDark ? "#fff" : "#333",
    },
    signUpButton: {
      width: "100%",
      height: 50,
      borderRadius: 25,
      backgroundColor: isDark ? "#EFAC3A" : "#F3E8DD",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    signUpButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#121212" : "#1F2E41",
    },
    loginText: {
      textAlign: "center",
      fontSize: 14,
      color: isDark ? "#ccc" : "#333",
    },
    loginLink: {
      fontWeight: "600",
      color: "#EFAC3A",
    },
    errorText: {
      color: '#FF4D4D',
      fontSize: 13,
      margin: 10,
      marginTop: 0,
    },
    
  });
