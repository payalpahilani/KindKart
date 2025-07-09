
import React, { useContext } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../Utilities/ThemeContext';

const { height } = Dimensions.get('window');

const LaunchScreen = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { isDarkMode } = useContext(ThemeContext);

  const gradientColors = isDarkMode ? ['#141414', '#1E1E1E'] : ['#F3E8DD', '#B8D6DF'];
  const styles = isDarkMode ? darkStyles : lightStyles;

  return (
    <LinearGradient colors={gradientColors} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? '#0F0F0F' : '#fff'} />

        <View style={styles.content}>
          <Image source={require('../../assets/Images/HeartImage.png')} style={styles.logo} />
          <Text style={styles.title}>{t('launchScreen.title')}</Text>
          <Text style={styles.subtitle}>{t('launchScreen.subtitle')}</Text>
        </View>

        <View style={styles.bottom}>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.buttonText}>{t('launchScreen.getStarted')}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('NgoLogin')}>
            <Text style={styles.linkText}>
              {t('launchScreen.wantToRaiseCampaign')}{' '}
              <Text style={styles.linkHighlight}>{t('launchScreen.clickHere')}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default LaunchScreen;

const baseStyles = {
  gradient: { flex: 1 },
  container: { flex: 1, justifyContent: 'space-between' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  bottom: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 160, height: 160, marginBottom: 24, resizeMode: 'contain' },
  title: { fontSize: 36, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 16 },
  button: { paddingVertical: 14, paddingHorizontal: 40, borderRadius: 30, elevation: 3, marginBottom: 16 },
  buttonText: { fontWeight: '600', fontSize: 16 },
  linkText: { fontSize: 14 },
  linkHighlight: { fontWeight: 'bold' },
};

const lightStyles = StyleSheet.create({
  ...baseStyles,
  title: { ...baseStyles.title, color: '#1F2E41' },
  subtitle: { ...baseStyles.subtitle, color: '#555' },
  button: { ...baseStyles.button, backgroundColor: '#F3E8DD' },
  buttonText: { ...baseStyles.buttonText, color: '#1F2E41' },
  linkText: { ...baseStyles.linkText, color: '#666' },
  linkHighlight: { ...baseStyles.linkHighlight, color: '#1F2E41' },
});

const darkStyles = StyleSheet.create({
  ...baseStyles,
  container: { ...baseStyles.container, backgroundColor: '#0F0F0F' },
  title: { ...baseStyles.title, color: '#FFFFFF' },
  subtitle: { ...baseStyles.subtitle, color: '#CCCCCC' },
  button: {
    ...baseStyles.button,
    backgroundColor: '#1F1F1F',
    borderWidth: 1,
    borderColor: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: { ...baseStyles.buttonText, color: '#FFFFFF' },
  linkText: { ...baseStyles.linkText, color: '#AAAAAA' },
  linkHighlight: { ...baseStyles.linkHighlight, color: '#FFD369' },
});
