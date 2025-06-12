import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, collection } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

export default function SignUpScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = async () => {
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      return Alert.alert('Error', 'Please fill in all fields.');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match.');
    }
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName: fullName });

      await setDoc(doc(collection(db, 'users'), userCred.user.uid), {
        fullName,
        email,
        phone,
        uid: userCred.user.uid,
      });


      Alert.alert('Success', 'Account created!');
      navigation.replace('Login');
    } catch (err) {
      Alert.alert('Sign Up Error', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 20 }}>
          <Text style={{ color: '#EFAC3A', fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Create your account</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#aaa"
          value={fullName}
          onChangeText={setFullName}
          autoComplete="off"
          autoCorrect={false}
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

        <TouchableOpacity onPress={handleSignUp} style={styles.signUpButton}>
          <Text style={styles.signUpButtonText}>SIGN UP</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.replace('Login')}>
          <Text style={styles.loginText}>
            Already have an account? <Text style={styles.loginLink}>Log In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#fff' },
  content:       { flex: 1, paddingHorizontal: 30, paddingTop: 80 },
  title:         { fontSize: 26, fontWeight: '700', color: '#1F2E41', marginBottom: 30 },
  input:         {
                   width: '100%',
                   height: 50,
                   backgroundColor: '#F5F5F5',
                   borderRadius: 25,
                   paddingHorizontal: 20,
                   marginBottom: 20,
                   fontSize: 16,
                 },
  signUpButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3E8DD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  signUpButtonText: { fontSize: 16, fontWeight: '600', color: '#1F2E41' },
  loginText:   { textAlign: 'center', color: '#333', fontSize: 14 },
  loginLink:   { color: '#EFAC3A', fontWeight: '600' },
});
