import React, { useState, useEffect, useContext } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../Utilities/ThemeContext';

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const { isDarkMode } = useContext(ThemeContext);

  const styles = isDarkMode ? darkStyles : lightStyles;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');


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

  const validateInputs = () => {
    let valid = true;
  
    if (!email) {
      setEmailError(t('Email is required'));
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError(t('Invalid email address'));
      valid = false;
    } else {
      setEmailError('');
    }
  
    if (!password) {
      setPasswordError(t('Password is required'));
      valid = false;
    } else if (password.length < 6) {
      setPasswordError(t('Password must be at least 6 characters'));
      valid = false;
    } else {
      setPasswordError('');
    }
  
    return valid;
  };
  
  const handleLogin = async () => {
    const isValid = validateInputs();
    if (!isValid) return;
  
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
      Alert.alert(t('login.loginFailedTitle'), t('Login failed. Incorrect email/password. Please try again.') || 'Login failed. Please try again.');
    }
  };
  

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={styles.container.backgroundColor} />

      <View style={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 20 }}>
          <Text style={styles.backText}>← {t('login.back')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('login.welcome')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('login.emailPlaceholder')}
          placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          selectionColor={isDarkMode ? '#ffc107' : '#1F2E41'}
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}


        <TextInput
          style={styles.input}
          placeholder={t('login.passwordPlaceholder')}
          placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          selectionColor={isDarkMode ? '#ffc107' : '#1F2E41'}
        />
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}


        <View style={styles.rememberMeContainer}>
          <Text style={styles.rememberMeText}>{t('login.rememberMe')}</Text>
          <Switch
            value={rememberMe}
            onValueChange={setRememberMe}
            trackColor={{ false: '#767577', true: '#ffc107' }}
            thumbColor={rememberMe ? '#fff' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity onPress={handleLogin}>
          <LinearGradient
            colors={isDarkMode ? ['#EFAC3A', '#FFC107'] : ['#F3E8DD', '#B8D6DF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loginButton}
          >
            <Text style={styles.loginButtonText}>{t('login.loginButton')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Forgot Password */}
        <View style={styles.forgotPasswordContainer}>
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotPasswordText}>{t('login.forgotPassword')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>
            {t('login.noAccount')}{' '}
            <Text
              onPress={() => navigation.navigate('SignUp')}
              style={styles.registerLink}
            >
              {t('login.registerNow')}
            </Text>
          </Text>
        </View>
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
    paddingHorizontal: 30,
    paddingTop: 80,
  },
  backText: {
    fontWeight: '600',
    fontSize: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 20,
    marginBottom: 10,
    fontSize: 16,
    borderWidth: 1,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  rememberMeText: {
    fontSize: 16,
  },
  forgotText: {
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
    marginBottom: 10,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 20,
    marginTop: 5,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: 'grey',
  },
  registerContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
  },
  registerLink: {
    marginLeft: 4,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF4D4D',
    margin: 10,
    marginTop: 0,
    fontSize: 13,
  },
  
};

const lightStyles = StyleSheet.create({
  ...baseStyles,
  container: {
    ...baseStyles.container,
    backgroundColor: '#fff',
  },
  backText: {
    ...baseStyles.backText,
    color: '#EFAC3A',
  },
  title: {
    ...baseStyles.title,
    color: '#1F2E41',
  },
  input: {
    ...baseStyles.input,
    backgroundColor: '#F5F5F5',
    borderColor: '#ccc',
    color: '#222',
  },
  rememberMeText: {
    ...baseStyles.rememberMeText,
    color: '#333',
  },
  forgotText: {
    ...baseStyles.forgotText,
    color: '#AAA',
  },
  loginButton: {
    ...baseStyles.loginButton,
    backgroundColor: 'transparent',
  },
  loginButtonText: {
    ...baseStyles.loginButtonText,
    color: '#1F2E41',
  },
  forgotPasswordText: {
    ...baseStyles.forgotPasswordText,
    color: 'grey',
  },
  registerText: {
    ...baseStyles.registerText,
    color: '#333',
  },
  registerLink: {
    ...baseStyles.registerLink,
    color: '#EFAC3A',
  },
  errorText: {
    color: '#FF4D4D',
    margin: 10,
    marginTop: 0,
    fontSize: 13,
  },
});

const darkStyles = StyleSheet.create({
  ...baseStyles,
  container: {
    ...baseStyles.container,
    backgroundColor: '#121212',
  },
  backText: {
    ...baseStyles.backText,
    color: '#FFC107',
  },
  title: {
    ...baseStyles.title,
    color: '#fff',
  },
  input: {
    ...baseStyles.input,
    backgroundColor: '#2a2a2a',
    borderColor: '#555',
    color: '#eee',
  },
  rememberMeText: {
    ...baseStyles.rememberMeText,
    color: '#ddd',
  },
  forgotText: {
    ...baseStyles.forgotText,
    color: '#777',
  },
  loginButton: {
    ...baseStyles.loginButton,
    backgroundColor: 'transparent',
  },
  loginButtonText: {
    ...baseStyles.loginButtonText,
    color: '#fff',
  },
  forgotPasswordText: {
    ...baseStyles.forgotPasswordText,
    color: 'grey',
  },
  registerText: {
    ...baseStyles.registerText,
    color: '#ddd',
  },
  registerLink: {
    ...baseStyles.registerLink,
    color: '#FFC107',
  },
  errorText: {
    color: '#FF4D4D',
    margin: 10,
    marginTop: 0,
    fontSize: 13,
  },
});
