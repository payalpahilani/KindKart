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
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../Utilities/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NgoLoginScreen({ navigation }) {
  const { t } = useTranslation();
  const { isDarkMode } = useContext(ThemeContext);

  const styles = isDarkMode ? darkStyles : lightStyles;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const loadCredentials = async () => {
      const saved = await AsyncStorage.getItem('ngoCredentials');
      if (saved) {
        const { email, password } = JSON.parse(saved);
        setEmail(email);
        setPassword(password);
        setRememberMe(true);
      }
    };
    loadCredentials();
  }, []);

  const handleNgoLogin = async () => {
    if (!email || !password) {
      return Alert.alert(t('ngoLogin.error'), t('ngoLogin.enterEmailPassword'));
    }

    try {
      const ngoCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = ngoCredential.user;

      if (rememberMe) {
        await AsyncStorage.setItem('ngoCredentials', JSON.stringify({ email, password }));
      } else {
        await AsyncStorage.removeItem('ngoCredentials');
      }

      await AsyncStorage.setItem('userId', user.uid); // Optional: Store ID
      navigation.replace('NgoHome');
    } catch (err) {
      Alert.alert(t('ngoLogin.loginFailed'), err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={styles.container.backgroundColor} />
      <View style={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 20 }}>
          <Text style={styles.backText}>← {t('ngoLogin.back')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('ngoLogin.welcome')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('ngoLogin.emailPlaceholder')}
          placeholderTextColor={isDarkMode ? '#999' : '#aaa'}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder={t('ngoLogin.passwordPlaceholder')}
          placeholderTextColor={isDarkMode ? '#999' : '#aaa'}
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

        <TouchableOpacity onPress={handleNgoLogin}>
          <LinearGradient
            colors={isDarkMode ? ['#EFAC3A', '#FFC107'] : ['#F3E8DD', '#B8D6DF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loginButton}
          >
            <Text style={styles.loginButtonText}>{t('ngoLogin.login')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>
            {t('ngoLogin.noAccount')}{' '}
            <Text
              onPress={() => navigation.navigate('NgoSignUp')}
              style={styles.registerLink}
            >
              {t('ngoLogin.registerNow')}
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}


const base = {
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 30, paddingTop: 80 },
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
    color: '#fff', // white text on orange button
  },
  registerContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
  },
  registerLink: {
    fontWeight: '600',
    marginLeft: 4,
  },
  backText: {
    fontWeight: '900',
    fontSize: 16,
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

};

const lightStyles = StyleSheet.create({
  ...base,
  container: { ...base.container, backgroundColor: '#fff' },
  title: { ...base.title, color: '#1F2E41' },
  input: {
    ...base.input,
    backgroundColor: '#F5F5F5',
    color: '#000',
  },
  registerText: {
    ...base.registerText,
    color: '#333',
  },
  registerLink: {
    ...base.registerLink,
    color: '#EFAC3A',
  },
  backText: {
    color: '#EFAC3A',
  },
rememberMeText: {
  ...base.rememberMeText,
  color: '#333',
},
});

const darkStyles = StyleSheet.create({
  ...base,
  container: { ...base.container, backgroundColor: '#121212' },
  title: { ...base.title, color: '#F3E8DD' },
  input: {
    ...base.input,
    backgroundColor: '#2a2a2a',
    color: '#F3E8DD',
  },
  registerText: {
    ...base.registerText,
    color: '#ddd',
  },
  registerLink: {
    ...base.registerLink,
    color: '#EFAC3A',
  },
  backText: {
    color: '#EFAC3A',
  },
rememberMeText: {
  ...base.rememberMeText,
  color: '#ddd',
},

});
