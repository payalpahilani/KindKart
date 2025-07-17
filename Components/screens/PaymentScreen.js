import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useStripe } from '@stripe/stripe-react-native';
import { auth } from '../../firebaseConfig';

export default function PaymentScreen() {
  const [amount, setAmount] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const route = useRoute();
  const navigation = useNavigation();

  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [paymentLoading, setPaymentLoading] = useState(false);

  const {
    campaignId,
    title,
    ngoName,
    currency = 'CAD',
    imageUrls = [],
  } = route.params || {};

  const handlePay = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid donation amount.');
      return;
    }
  
    setPaymentLoading(true);
    try {
      const response = await fetch('https://kindkart-0l245p6y.b4a.run/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount * 100, // Convert to cents
          currency,
          description: `Donation to ${title}`,
          userId: auth.currentUser?.uid || 'anonymous',
          campaignId,
        }),
      });
  
      const { clientSecret } = await response.json();
  
      const init = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'KindKart',
        returnURL: 'kindkartpay://stripe-redirect',
      });
  
      if (init.error) throw init.error;
  
      const result = await presentPaymentSheet();
      if (result.error) throw result.error;
  
      Alert.alert('Thank you!', `Your donation of ${currency} ${numAmount.toFixed(2)} to "${title}" was successful.`);
      navigation.goBack();
  
    } catch (err) {
      Alert.alert('Payment failed', err.message);
    }
  
    setPaymentLoading(false);
  };

  const thumbnails = imageUrls.map((url, index) => (
    <TouchableOpacity key={index} onPress={() => setSelectedImage({ uri: url })}>
      <Image source={{ uri: url }} style={styles.thumb} />
    </TouchableOpacity>
  ));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>

          {/* Back Button */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="chevron-left" size={26} color="#EFAC3A" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.pageTitle}>Complete Your Donation</Text>

          {/* Campaign Image */}
          <Image
            source={selectedImage || { uri: imageUrls[0] }}
            style={styles.mainImage}
          />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
            {thumbnails}
          </ScrollView>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtext}>Organized by {ngoName}</Text>

          <Text style={styles.label}>Enter donation amount ({currency})</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            placeholder="e.g. 25.00"
            value={amount}
            onChangeText={setAmount}
          />

          <TouchableOpacity style={styles.payButton} onPress={handlePay}>
            <Text style={styles.payButtonText}>Pay Now</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 20 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backText: { color: '#EFAC3A', fontWeight: '600', fontSize: 15 },

  pageTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  mainImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  thumbRow: { flexDirection: 'row', marginBottom: 20 },
  thumb: { width: 70, height: 70, borderRadius: 8, marginRight: 10 },

  title: { fontSize: 18, fontWeight: '800', marginBottom: 4, textAlign: 'left' },
  subtext: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'left' },

  label: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  payButton: {
    backgroundColor: '#F6B93B',
    padding: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  payButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
