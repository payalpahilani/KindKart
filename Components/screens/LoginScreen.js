import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const loadCredentials = async () => {
      const saved = await AsyncStorage.getItem('userCredentials');
      if (saved) {
        const { email, password } = JSON.parse(saved);
        setEmail(email);
        setPassword(password);
        setRememberMe(true);
      }
    };
    loadCredentials();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert('Error', 'Please enter both email and password.');
    }
  
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      if (rememberMe) {
        await AsyncStorage.setItem('userCredentials', JSON.stringify({ email, password }));
      } else {
        await AsyncStorage.removeItem('userCredentials');
      }
      
      await AsyncStorage.setItem('userId', user.uid);
  
      navigation.replace('MainTabs');
    } catch (err) {
      Alert.alert('Login failed', err.message);
    }
  };
  

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 20 }}>
          <Text style={{ color: '#EFAC3A', fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>

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

        <View style={styles.rememberMeContainer}>
          <Text style={styles.rememberMeText}>Remember Me</Text>
          <Switch
            value={rememberMe}
            onValueChange={setRememberMe}
            trackColor={{ false: '#767577', true: '#ffc107' }}
            thumbColor={rememberMe ? '#fff' : '#f4f3f4'}
          />
        </View>

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
  container:       { flex: 1, backgroundColor: '#fff' },
  content:         { flex: 1, paddingHorizontal: 30, paddingTop: 80 },
  title:           { fontSize: 26, fontWeight: '700', color: '#1F2E41', marginBottom: 30 },
  input:           {
                     width: '100%',
                     height: 50,
                     backgroundColor: '#F5F5F5',
                     borderRadius: 25,
                     paddingHorizontal: 20,
                     marginBottom: 20,
                     fontSize: 16,
                   },
  rememberMeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeText:  { fontSize: 16, color: '#333' },
  forgotText:      { color: '#AAA', textAlign: 'right', marginBottom: 24, fontSize: 14 },
  loginButton:     {
                     width: '100%',
                     height: 50,
                     borderRadius: 25,
                     justifyContent: 'center',
                     alignItems: 'center',
                     marginBottom: 40,
                   },
  loginButtonText: { color: '#1F2E41', fontSize: 16, fontWeight: '600' },
  registerContainer: { alignItems: 'center', marginTop: 20 },
  registerText:    { color: '#333', fontSize: 14 },
  registerLink:    { color: '#EFAC3A', fontWeight: '600', marginLeft: 4 },
});
