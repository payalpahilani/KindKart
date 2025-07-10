import React, { useState, useContext } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../Utilities/ThemeContext'; // your ThemeContext

export default function NgoLoginScreen({ navigation }) {
  const { t } = useTranslation();
  const { isDarkMode } = useContext(ThemeContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const styles = isDarkMode ? darkStyles : lightStyles;

  const handleNgoLogin = () => {
    if (!email || !password) {
      return Alert.alert(t('ngoLogin.error'), t('ngoLogin.enterEmailPassword'));
    }

    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        navigation.replace('NgoHome');
      })
      .catch(err => Alert.alert(t('ngoLogin.loginFailed'), err.message));
  };

  return (
    <SafeAreaView style={styles.container}>
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

        <TouchableOpacity onPress={handleNgoLogin}>
          <LinearGradient
            colors={['#FF7E00', '#FFB347']} // Orange gradient for button
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
});
