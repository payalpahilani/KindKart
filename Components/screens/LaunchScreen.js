import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

const LaunchScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Image source={require('../../assets/Images/HeartImage.png')} style={styles.logo} />
      <Text style={styles.title}>KindKart</Text>
      <Text style={styles.subtitle}>Turn everyday stuff into real world impact</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>

      <TouchableOpacity>
        <Text style={styles.linkText}>Want to raise campaign? Click here</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LaunchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FDF6F0',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FFC107',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginBottom: 10,
  },
  buttonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
  linkText: {
    color: '#007BFF',
    marginTop: 10,
    fontSize: 14,
  },
});
