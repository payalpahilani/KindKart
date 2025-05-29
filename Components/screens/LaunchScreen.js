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

const { height } = Dimensions.get('window');

const LaunchScreen = ({ navigation }) => {
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
          <Text style={styles.title}>KindKart</Text>
          <Text style={styles.subtitle}>Turn everyday stuff into real world impact</Text>
        </View>

        <View style={styles.bottom}>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.linkText}>
              Want to raise campaign? <Text style={{ fontWeight: 'bold', color: '#1F2E41' }}>Click Here</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default LaunchScreen;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  bottom: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 24,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1F2E41',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#F3E8DD',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    elevation: 3,
    marginBottom: 16,
  },
  buttonText: {
    color: '#1F2E41',
    fontWeight: '600',
    fontSize: 16,
  },
  linkText: {
    fontSize: 14,
    color: '#666',
  },
});
