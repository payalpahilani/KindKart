import React, { useState, useContext } from 'react';
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
import { ThemeContext } from '../Utilities/ThemeContext';
import { useTranslation } from 'react-i18next';
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { checkAndAwardBadges } from '../Utilities/firebaseHelpers';

export default function PaymentScreen() {
  const [amount, setAmount] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const route = useRoute();
  const navigation = useNavigation();

  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [unlockedBadge, setUnlockedBadge] = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  const { isDarkMode } = useContext(ThemeContext);
  const { t } = useTranslation();
  const styles = isDarkMode ? darkStyles : lightStyles;

  const {
    campaignId,
    title,
    ngoName,
    ngoId,
    currency = 'CAD',
    imageUrls = [],
  } = route.params || {};

  const handlePay = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert(t('payment.invalidAmountTitle'), t('payment.invalidAmountMessage'));
      return;
    }

    if (!ngoId) {
      Alert.alert("Error", "NGO ID missing. Cannot proceed.");
      return;
    }

    setPaymentLoading(true);
    try {
      const response = await fetch('https://kindkart-0l245p6y.b4a.run/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(numAmount * 100),
          currency,
          description: `Donation to ${title}`,
          userId: auth.currentUser?.uid || 'anonymous',
          campaignId,
        }),
      });

      const raw = await response.text();
      console.log("🧾 Raw response from backend:", raw);

      let clientSecret, paymentIntentId;
      try {
        const parsed = JSON.parse(raw);
        clientSecret = parsed.clientSecret;
        paymentIntentId = parsed.paymentIntentId;
      } catch (err) {
        Alert.alert("Stripe Error", "Invalid response from server. Try again.");
        setPaymentLoading(false);
        return;
      }

      if (!clientSecret) {
        Alert.alert("Stripe Error", "Client secret not received.");
        setPaymentLoading(false);
        return;
      }

      const init = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'KindKart',
        returnURL: 'kindkartpay://stripe-redirect',
      });

      if (init.error) throw init.error;

      const result = await presentPaymentSheet();
      if (result.error) throw result.error;

      const userId = auth.currentUser?.uid;

      if (userId) {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
      
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const currentDonationCount = userData.donationCount || 0;
          const currentTotalDonated = userData.totalDonated || 0;
      
          // ✅ Update user's donation count and total donated
          await updateDoc(userRef, {
            donationCount: currentDonationCount + 1,
            totalDonated: currentTotalDonated + numAmount,
          });
      
          // ✅ Check for badges
          const unlocked = await checkAndAwardBadges(userId);
      
          // ✅ Update campaign raised amount
          const campaignRef = doc(db, "campaigns", campaignId);
          const campaignSnap = await getDoc(campaignRef);
      
          if (campaignSnap.exists()) {
            const campaignData = campaignSnap.data();
            const updatedRaised = (campaignData.raisedAmount || 0) + numAmount;
      
            await updateDoc(campaignRef, {
              raisedAmount: updatedRaised,
              isEnded: updatedRaised >= campaignData.totalDonation,
            });
          }
      
          // ✅ Save donation record
          try {
            console.log("📤 Saving donation to Firestore...");
            await addDoc(collection(db, 'donations'), {
              campaignId,
              ngoId,
              userId,
              amount: numAmount,
              currency,
              timestamp: serverTimestamp(),
              paymentIntentId: paymentIntentId || 'manual',
            });
            console.log("✅ Donation saved to Firestore.");
          } catch (saveError) {
            console.error("❌ Failed to save donation:", saveError);
            Alert.alert("Error", "Donation was successful, but record was not saved.");
          }
      
          // ✅ Handle badge modal or success alert
          if (unlocked && unlocked.length > 0) {
            setUnlockedBadge(unlocked[0]);
            setShowBadgeModal(true);
            return; // Don't show success alert, modal will show
          } else {
            Alert.alert(
              "🎉 Donation Successful!",
              `You donated ${currency} ${numAmount.toFixed(2)}. Thank you for your kindness!`
            );
          }
        }
      }

      navigation.goBack();
    } catch (err) {
      Alert.alert(t('payment.failedTitle'), err.message);
    }

    setPaymentLoading(false);
  };

  const thumbnails = imageUrls.map((url, index) => (
    <TouchableOpacity key={index} onPress={() => setSelectedImage({ uri: url })}>
      <Image source={{ uri: url }} style={styles.thumb} />
    </TouchableOpacity>
  ));

  return (
    <>
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={isDarkMode ? '#121212' : '#fff'} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Icon name="chevron-left" size={26} color="#EFAC3A" />
              <Text style={styles.backText}>{t('payment.back')}</Text>
            </TouchableOpacity>

            <Text style={styles.pageTitle}>{t('payment.completeDonation')}</Text>

            <Image
              source={selectedImage || (imageUrls.length > 0 ? { uri: imageUrls[0] } : require('../../assets/Images/campaign1.jpg'))}
              style={styles.mainImage}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
              {thumbnails}
            </ScrollView>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtext}>{t('payment.organizedBy')} {ngoName}</Text>

            <Text style={styles.label}>{t('payment.enterAmount', { currency })}</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="25.00"
              placeholderTextColor={isDarkMode ? '#888' : '#aaa'}
              value={amount}
              onChangeText={setAmount}
            />

            <TouchableOpacity style={styles.payButton} onPress={handlePay} disabled={paymentLoading}>
              <Text style={styles.payButtonText}>
                {paymentLoading ? t('payment.processing') : t('payment.payNow')}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {showBadgeModal && (
        <View style={styles.badgeModalOverlay}>
          <View style={styles.badgeModal}>
            <Text style={styles.badgeTitle}>🎉 Badge Unlocked!</Text>
            <Text style={styles.badgeName}>
              {unlockedBadge === 'firstDonation' ? 'First Donation 🥉' : unlockedBadge}
            </Text>
            <TouchableOpacity onPress={() => {
              setShowBadgeModal(false);
              navigation.goBack();
            }} style={styles.badgeButton}>
              <Text style={styles.badgeButtonText}>Awesome!</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </>
  );
}


const baseStyles = {
  container: { flex: 1 },
  scroll: { padding: 20 },
  backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backText: { fontWeight: '600', fontSize: 15 },

  pageTitle: { fontSize: 20, fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  mainImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 12 },
  thumbRow: { flexDirection: 'row', marginBottom: 20 },
  thumb: { width: 70, height: 70, borderRadius: 8, marginRight: 10 },

  title: { fontSize: 18, fontWeight: '800', marginBottom: 4, textAlign: 'left' },
  subtext: { fontSize: 14, marginBottom: 20, textAlign: 'left' },

  label: { fontSize: 15, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  payButton: {
    padding: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  payButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  badgeModalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  badgeModal: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: 280,
  },
  badgeTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
    color: '#F6B93B',
  },
  badgeName: {
    fontSize: 18,
    marginBottom: 20,
    color: '#222',
  },
  badgeButton: {
    backgroundColor: '#F6B93B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  badgeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  
};

const lightStyles = StyleSheet.create({
  ...baseStyles,
  container: { ...baseStyles.container, backgroundColor: '#fff' },
  backText: { ...baseStyles.backText, color: '#EFAC3A' },
  pageTitle: { ...baseStyles.pageTitle, color: '#222' },
  subtext: { ...baseStyles.subtext, color: '#666' },
  label: { ...baseStyles.label, color: '#222' },
  input: { ...baseStyles.input, borderColor: '#ccc', color: '#222' },
  payButton: { ...baseStyles.payButton, backgroundColor: '#F6B93B' },
  payButtonText: { ...baseStyles.payButtonText, color: '#fff' },
  backBtn: { ...baseStyles.backBtn },
  thumb: { ...baseStyles.thumb },
});

const darkStyles = StyleSheet.create({
  ...baseStyles,
  container: { ...baseStyles.container, backgroundColor: '#121212' },
  title: { ...baseStyles.title, color: '#FFFFFF' },
  backText: { ...baseStyles.backText, color: '#FFB74D' },
  pageTitle: { ...baseStyles.pageTitle, color: '#FFF' },
  subtext: { ...baseStyles.subtext, color: '#CCC' },
  label: { ...baseStyles.label, color: '#EEE' },
  input: { ...baseStyles.input, borderColor: '#555', color: '#EEE' },
  payButton: { ...baseStyles.payButton, backgroundColor: '#F6B93B' },
  payButtonText: { ...baseStyles.payButtonText, color: '#121212' },
  backBtn: { ...baseStyles.backBtn },
  thumb: { ...baseStyles.thumb },
});
