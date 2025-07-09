import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const { height } = Dimensions.get('window');

const LaunchScreen = ({ navigation }) => {
  const { t } = useTranslation();

  return (
    <LinearGradient
      colors={['#F3E8DD', '#B8D6DF']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
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
              {t('launchScreen.wantToRaiseCampaign')} <Text style={{ fontWeight: 'bold', color: '#1F2E41' }}>{t('launchScreen.clickHere')}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default LaunchScreen;

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1, justifyContent: 'space-between' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  bottom: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 160, height: 160, marginBottom: 24, resizeMode: 'contain' },
  title: { fontSize: 36, fontWeight: '700', color: '#1F2E41', marginBottom: 4 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#555', marginBottom: 16 },
  button: { backgroundColor: '#F3E8DD', paddingVertical: 14, paddingHorizontal: 40, borderRadius: 30, elevation: 3, marginBottom: 16 },
  buttonText: { color: '#1F2E41', fontWeight: '600', fontSize: 16 },
  linkText: { fontSize: 14, color: '#666' },
});
