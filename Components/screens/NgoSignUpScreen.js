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
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../Utilities/ThemeContext'; // Your ThemeContext providing isDarkMode

export default function NgoSignUpScreen({ navigation }) {
  const { t } = useTranslation();
  const { isDarkMode } = useContext(ThemeContext);

  const [ngoName, setNgoName] = useState('');
  const [email, setEmail] = useState('');
  const [ngoCode, setNgoCode] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const styles = isDarkMode ? darkStyles : lightStyles;

  const handleNgoSignUp = async () => {
    if (!ngoName || !email || !ngoCode || !contact || !password || !confirmPassword) {
      return Alert.alert(t('ngoSignUp.error'), t('ngoSignUp.fillAllFields'));
    }
    if (password !== confirmPassword) {
      return Alert.alert(t('ngoSignUp.error'), t('ngoSignUp.passwordsNotMatch'));
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
      Alert.alert(t('ngoSignUp.success'), t('ngoSignUp.accountCreated'));
      navigation.replace('NgoLogin');
    } catch (err) {
      Alert.alert(t('ngoSignUp.signUpError'), err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 20 }}>
          <Text style={styles.backText}>← {t('ngoSignUp.back')}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t('ngoSignUp.register')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('ngoSignUp.ngoName')}
          placeholderTextColor={isDarkMode ? '#999' : '#aaa'}
          value={ngoName}
          onChangeText={setNgoName}
          autoComplete="off"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder={t('ngoSignUp.ngoEmail')}
          placeholderTextColor={isDarkMode ? '#999' : '#aaa'}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder={t('ngoSignUp.ngoCode')}
          placeholderTextColor={isDarkMode ? '#999' : '#aaa'}
          value={ngoCode}
          onChangeText={setNgoCode}
          autoComplete="off"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder={t('ngoSignUp.contactNumber')}
          placeholderTextColor={isDarkMode ? '#999' : '#aaa'}
          keyboardType="phone-pad"
          value={contact}
          onChangeText={setContact}
        />
        <TextInput
          style={styles.input}
          placeholder={t('ngoSignUp.password')}
          placeholderTextColor={isDarkMode ? '#999' : '#aaa'}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder={t('ngoSignUp.confirmPassword')}
          placeholderTextColor={isDarkMode ? '#999' : '#aaa'}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity onPress={handleNgoSignUp}>
          <LinearGradient
            colors={['#FF7E00', '#FFB347']} // Orange gradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.signUpButton}
          >
            <Text style={styles.signUpButtonText}>{t('ngoSignUp.signUp')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.replace('NgoLogin')}>
          <Text style={styles.loginText}>
            {t('ngoSignUp.alreadyHaveAccount')}{' '}
            <Text style={styles.loginLink}>{t('ngoSignUp.logIn')}</Text>
          </Text>
        </TouchableOpacity>
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
    color: '#fff',  // White text on orange button
  },
  loginText: {
    textAlign: 'center',
    fontSize: 14,
  },
  loginLink: {
    fontWeight: '600',
  },
  backText: {
    fontWeight: '600',
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
  loginText: {
    ...base.loginText,
    color: '#333',
  },
  loginLink: {
    ...base.loginLink,
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
  loginText: {
    ...base.loginText,
    color: '#ddd',
  },
  loginLink: {
    ...base.loginLink,
    color: '#EFAC3A',
  },
  backText: {
    color: '#EFAC3A',
  },
});
