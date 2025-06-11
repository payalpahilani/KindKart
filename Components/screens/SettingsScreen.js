import React, { useContext } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { ThemeContext } from '../Utilities/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

export default function SettingsScreen() {
  const { isDarkMode, toggleDarkMode } = useContext(ThemeContext);
  const navigation = useNavigation();

  const backgroundColor = isDarkMode ? '#121212' : '#F5F5F5';
  const cardColor = isDarkMode ? '#1E1E1E' : '#FFFFFF';
  const textColor = isDarkMode ? '#FFFFFF' : '#23253A';
  const borderColor = isDarkMode ? '#2C2C2C' : '#DDDDDD';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Back Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Icon name="arrow-left" size={26} color={textColor} />
      </TouchableOpacity>

      {/* Header */}
      <Text style={[styles.title, { color: textColor }]}>Settings</Text>

      {/* Card */}
      <View style={[styles.card, { backgroundColor: cardColor, borderColor }]}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: textColor }]}>Dark Mode</Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#767577', true: '#2CB67D' }}
            thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    marginBottom: 12,
    padding: 6,
    borderRadius: 50,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: '500',
  },
});
