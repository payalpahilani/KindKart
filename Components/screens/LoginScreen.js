
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId:  '731786242882-036vr75864aapuuvelh4i3ogoc88bpnk.apps.googleusercontent.com',   // from Firebase console → OAuth 2.0 Client IDs
    webClientId:   '731786242882-036vr75864aapuuvelh4i3ogoc88bpnk.apps.googleusercontent.com',
    iosClientId:   '731786242882-t76sffnd4rnqmpmocqquumn5spoa6ag7.apps.googleusercontent.com',    // only for standalone
  });


  useEffect(() => {
    if (response?.type === 'success') {
      const { idToken, accessToken } = response.authentication;
      const credential = GoogleAuthProvider.credential(idToken, accessToken);

      signInWithCredential(auth, credential)
        .then(() => navigation.replace('Home'))
        .catch(err => Alert.alert('Google Login Error', err.message));
    }
  }, [response]);

  const handleLogin = () => {
    if (!email || !password) {
      return Alert.alert('Error', 'Please enter both email and password.');
    }
    signInWithEmailAndPassword(auth, email, password)
      .then(() => navigation.replace('Home'))
      .catch(err => Alert.alert('Login failed', err.message));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ← NEW wrapper view */}
      <View style={styles.content}>

        <Text style={styles.title}>Welcome! Login to KindKart.</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity onPress={() => Alert.alert('Reset via email')}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogin}>
          <LinearGradient
            colors={['#F3E8DD', '#B8D6DF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loginButton}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.orContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>Or login with</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.socialContainer}>
          <TouchableOpacity onPress={() => promptAsync()} style={styles.socialButton}>
            <Image source={require('../../assets/Images/google.png')} style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Image source={require('../../assets/Images/facebook.png')} style={styles.icon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Image source={require('../../assets/Images/apple.png')} style={styles.icon} />
          </TouchableOpacity>
        </View>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>
            Don’t have an account?{' '}
            <Text
              onPress={() => navigation.navigate('SignUp')}
              style={styles.registerLink}
            >
              Register Now
            </Text>
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // NEW: this wraps all your fields & buttons
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 80,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1F2E41',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 20,
    fontSize: 16,
  },
  forgotText: {
    color: '#AAA',
    textAlign: 'right',
    marginBottom: 24,
    fontSize: 14,
  },
  loginButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  loginButtonText: {
    color: '#1F2E41',
    fontSize: 16,
    fontWeight: '600',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#EEE',
  },
  orText: {
    marginHorizontal: 10,
    color: '#AAA',
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 50,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  registerContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: {
    color: '#333',
    fontSize: 14,
  },
  registerLink: {
    color: '#EFAC3A',
    fontWeight: '600',
    marginLeft: 4,
  },
});
