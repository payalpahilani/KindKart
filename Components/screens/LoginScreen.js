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
      return Alert.alert(t('login.errorTitle'), t('login.errorMessage'));
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
      Alert.alert(t('login.loginFailedTitle'), err.message);
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

        <TextInput
          style={styles.input}
          placeholder={t('login.passwordPlaceholder')}
          placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          selectionColor={isDarkMode ? '#ffc107' : '#1F2E41'}
        />

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
    marginBottom: 20,
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
    marginBottom: 40,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
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
};

const lightStyles = StyleSheet.create({
  ...baseStyles,
  container: {
    ...baseStyles.container,
    backgroundColor: '#fff',
  },
  content: {
    ...baseStyles.content,
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
  registerText: {
    ...baseStyles.registerText,
    color: '#333',
  },
  registerLink: {
    ...baseStyles.registerLink,
    color: '#EFAC3A',
  },
});

const darkStyles = StyleSheet.create({
  ...baseStyles,
  container: {
    ...baseStyles.container,
    backgroundColor: '#121212',
  },
  content: {
    ...baseStyles.content,
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
  registerText: {
    ...baseStyles.registerText,
    color: '#ddd',
  },
  registerLink: {
    ...baseStyles.registerLink,
    color: '#FFC107',
  },
});
