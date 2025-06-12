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
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';

export default function NgoSignUpScreen({ navigation }) {
  const [ngoName, setNgoName] = useState('');
  const [email, setEmail] = useState('');
  const [ngoCode, setNgoCode] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleNgoSignUp = async () => {
    if (!ngoName || !email || !ngoCode || !contact || !password || !confirmPassword) {
      return Alert.alert('Error', 'Please fill in all fields.');
    }
    if (password !== confirmPassword) {
      return Alert.alert('Error', 'Passwords do not match.');
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(collection(db, 'ngo'), userCred.user.uid), {
        ngoName,
        email,
        ngoCode,
        contact,
        uid: userCred.user.uid,
      });
      Alert.alert('Success', 'NGO Account Created!');
      navigation.replace('NgoLogin');
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
        <Text style={styles.title}>Register Your NGO</Text>

        <TextInput
          style={styles.input}
          placeholder="NGO Name"
          placeholderTextColor="#aaa"
          value={ngoName}
          onChangeText={setNgoName}
          autoComplete="off"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="NGO Email"
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="NGO Code"
          placeholderTextColor="#aaa"
          value={ngoCode}
          onChangeText={setNgoCode}
          autoComplete="off"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="Contact Number"
          placeholderTextColor="#aaa"
          keyboardType="phone-pad"
          value={contact}
          onChangeText={setContact}
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

        <TouchableOpacity onPress={handleNgoSignUp}>
          <LinearGradient
            colors={['#F3E8DD', '#B8D6DF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.signUpButton}
          >
            <Text style={styles.signUpButtonText}>SIGN UP</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.replace('NgoLogin')}>
          <Text style={styles.loginText}>
            Already have an account?{' '}
            <Text style={styles.loginLink}>Log In</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2E41',
  },
  loginText: {
    textAlign: 'center',
    color: '#333',
    fontSize: 14,
  },
  loginLink: {
    color: '#EFAC3A',
    fontWeight: '600',
  },
});
