import React, { useEffect, useState, useContext } from 'react';
import {
 View,
 Text,
 StyleSheet,
 Image,
 TouchableOpacity,
 ScrollView,
 Alert,
 ActivityIndicator,
 StatusBar,
 RefreshControl,
 Switch,
 Pressable,
} from 'react-native';
import { Linking } from 'react-native';


import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';
import { ThemeContext } from '../Utilities/ThemeContext';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';


export default function NgongoProfileScreen() {
 const navigation = useNavigation();
 const { isDarkMode, toggleDarkMode } = useContext(ThemeContext);
 const { t } = useTranslation();
 const BACKEND_URL = "https://kindkart-0l245p6y.b4a.run";
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [ngo, setNgo] = useState(null);
 const [campaignStats, setCampaignStats] = useState({ count: 0, total: 0 });


const handleConnectStripe = async () => {
  try {
    if (!ngo?.email) {
      Alert.alert("Error", "Email not available for Stripe onboarding.");
      return;
    }
    const response = await fetch(`${BACKEND_URL}/create-stripe-account-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ngoId: auth.currentUser.uid,
        email: ngo.email,
      }),
    });

    const text = await response.text();

    // Debugging log if needed
    console.log("Stripe account link raw response:", text);

    const json = JSON.parse(text);
    const { url } = json;

    if (url) {
      Linking.openURL(url);
    } else {
      Alert.alert("Error", "Could not start Stripe onboarding.");
    }
  } catch (error) {
    Alert.alert("Error", error.message);
  }
};


 const fetchNgoDetails = async () => {
   try {
     const uid = auth.currentUser?.uid;
     const ngoDoc = await getDoc(doc(db, 'ngo', uid));
     if (ngoDoc.exists()) {
       setNgo(ngoDoc.data());
       fetchCampaignStats(uid);
     }
   } catch (err) {
     console.log('Error fetching NGO data:', err);
   } finally {
     setLoading(false);
     setRefreshing(false);
   }
 };


 const fetchCampaignStats = async (uid) => {
   try {
     const q = query(collection(db, 'campaigns'), where('createdBy', '==', uid));
     const querySnapshot = await getDocs(q);
     let total = 0;
     querySnapshot.forEach((doc) => {
       const data = doc.data();
       if (data.totalDonation) total += parseFloat(data.totalDonation);
     });
     setCampaignStats({ count: querySnapshot.size, total });
   } catch (err) {
     console.log('Error fetching campaign stats:', err);
   }
 };


 const handleLogout = () => {
   signOut(auth)
     .then(() => navigation.reset({ index: 0, routes: [{ name: 'Launch' }] }))
     .catch(() => Alert.alert('Error', 'Failed to sign out.'));
 };


 useEffect(() => {
   fetchNgoDetails();
 }, []);

 
 const bg = isDarkMode ? '#0B0B0B' : '#FFFFFF';
 const cardBg = isDarkMode ? '#1A1A1C' : '#FFFFFF';
 const cardBor = isDarkMode ? '#2B2B2B' : '#E3E3E3';
 const text = isDarkMode ? '#FFFFFF' : '#20222E';
 const muted = isDarkMode ? '#A7A7A7' : '#757575';
 const accent = '#F6B93B';


 const LangChip = ({ code, label, flag }) => {
   const active = i18n.language === code;
   return (
     <Pressable
       onPress={() => i18n.changeLanguage(code)}
       style={{
         borderWidth: 1,
         borderRadius: 20,
         paddingVertical: 8,
         paddingHorizontal: 16,
         marginHorizontal: 6,
         borderColor: active ? accent : muted,
         backgroundColor: active ? accent : 'transparent',
       }}
     >
       <Text style={{ color: active ? '#fff' : text, fontWeight: '600' }}>{flag} {label}</Text>
     </Pressable>
   );
 };


 if (loading) {
   return (
     <SafeAreaView style={styles.centered}>
       <ActivityIndicator size="large" color="#EFAC3A" />
     </SafeAreaView>
   );
 }


 return (
   <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
     <StatusBar
       barStyle={isDarkMode ? "light-content" : "dark-content"}
       backgroundColor={bg}
     />
     <ScrollView
       contentContainerStyle={styles.scroll}
       refreshControl={
         <RefreshControl refreshing={refreshing} onRefresh={fetchNgoDetails} />
       }
     >
       {/* Header */}
       <View style={styles.header}>
         {ngo?.avatarUrl ? (
           <Image source={{ uri: ngo.avatarUrl }} style={styles.avatar} />
         ) : (
           <View style={[styles.initialsAvatar, { backgroundColor: accent }]}>
             <Text style={styles.initialsText}>
               {ngo?.ngoName
                 ? ngo.ngoName
                     .split(" ")
                     .map((word) => word[0])
                     .join("")
                     .toUpperCase()
                 : "NGO"}
             </Text>
           </View>
         )}
         <Text style={[styles.name, { color: text }]}>
           {ngo?.ngoName || "NGO Name"}
         </Text>
         <Text style={[styles.email, { color: muted }]}>{ngo?.email}</Text>
       </View>

       {/* Info Section */}
       <Text style={[styles.sectionTitle, { color: text }]}>
         {t("ngoProfile.contactInfo")}
       </Text>
       <View
         style={[
           styles.card,
           { backgroundColor: cardBg, borderColor: cardBor },
         ]}
       >
         <InfoRow
           icon="phone"
           label={t("ngoProfile.contact")}
           value={ngo?.contact}
           textColor={text}
           mutedColor={muted}
         />
         <InfoRow
           icon="identifier"
           label={t("ngoProfile.ngoCode")}
           value={ngo?.ngoCode}
           textColor={text}
           mutedColor={muted}
         />
         <InfoRow
           icon="email"
           label={t("ngoProfile.email")}
           value={ngo?.email}
           textColor={text}
           mutedColor={muted}
         />
       </View>

       {/* Campaign Statistics */}
       <Text style={[styles.sectionTitle, { color: text }]}>
         {t("ngoProfile.campaignOverview")}
       </Text>
       <View
         style={[
           styles.card,
           styles.statsCard,
           { backgroundColor: isDarkMode ? "#302B27" : "#F3E8DD" },
         ]}
       >
         <InfoRow
           icon="bullhorn"
           label={t("ngoProfile.activeCampaigns")}
           value={campaignStats.count}
           textColor={text}
           mutedColor={muted}
         />
         <InfoRow
           icon="currency-usd"
           label={t("ngoProfile.totalRaised")}
           value={`$${campaignStats.total}`}
           textColor={text}
           mutedColor={muted}
         />
       </View>

       {/* Appearance Settings */}
       <Text style={[styles.sectionTitle, { color: text }]}>
         {t("ngoProfile.preferences")}
       </Text>
       <View
         style={[
           styles.prefRow,
           { backgroundColor: cardBg, borderColor: cardBor },
         ]}
       >
         <View style={styles.prefLabel}>
           <Icon name="palette-swatch" size={20} color={accent} />
           <Text style={[styles.prefText, { color: text }]}>
             {t("settings.dark_mode")}
           </Text>
         </View>
         <Switch
           value={isDarkMode}
           onValueChange={toggleDarkMode}
           trackColor={{ false: "#767577", true: "#2CB67D" }}
           thumbColor={isDarkMode ? "#fff" : "#f4f3f4"}
         />
       </View>
       <View
         style={[
           styles.prefRow,
           { backgroundColor: cardBg, borderColor: cardBor },
         ]}
       >
         <View style={styles.prefLabel}>
           <Icon name="translate" size={20} color={accent} />
           <Text style={[styles.prefText, { color: text }]}>
             {t("settings.select_language")}
           </Text>
         </View>
         <View style={{ flexDirection: "row" }}>
           <LangChip code="en" label="English" />
           <LangChip code="fr" label="Français" />
         </View>
       </View>

       {/* Actions */}
       <Text style={[styles.sectionTitle, { color: text }]}>
         {t("ngoProfile.actions")}
       </Text>
       {!ngo?.stripeAccountId ? (
         <TouchableOpacity style={styles.option} onPress={handleConnectStripe}>
           <Icon name="credit-card-plus-outline" size={20} color={text} />
           <Text style={[styles.optionText, { color: text }]}>
             Connect Stripe to Receive Donations
           </Text>
         </TouchableOpacity>
       ) : (
         <TouchableOpacity
           style={styles.option}
           onPress={() => {
             // Optionally open Stripe dashboard URL if you have it
             Alert.alert("Info", "Stripe account already connected.");
           }}
         >
           <Icon name="credit-card-outline" size={20} color={text} />
           <Text style={[styles.optionText, { color: text }]}>
             Stripe Account Connected
           </Text>
         </TouchableOpacity>
       )}

       <TouchableOpacity
         style={styles.option}
         onPress={() => navigation.navigate("NgoEditProfile")}
       >
         <Icon name="account-edit" size={20} color={text} />
         <Text style={[styles.optionText, { color: text }]}>
           {t("ngoProfile.editngoProfile")}
         </Text>
       </TouchableOpacity>

       <TouchableOpacity
         style = {styles.option}
         onPress={ () => navigation.navigate("NgoFaqScreen")}>
          <Icon name= "comment-question-outline" size={20} color={text} />
         <Text style={[styles.optionText, { color: text }]}>
          FAQ
         </Text>
       </TouchableOpacity>

       <TouchableOpacity
         style={styles.option}
         onPress={() => navigation.navigate("AboutUsScreen")}
       >
         <Icon name="information-outline" size={20} color={text} />
         <Text style={[styles.optionText, { color: text }]}>
           {t("ngoProfile.aboutUs")}
         </Text>
       </TouchableOpacity>
       <TouchableOpacity style={styles.option} onPress={handleLogout}>
         <Icon name="exit-to-app" size={20} color="#e74c3c" />
         <Text style={[styles.optionText, { color: "#e74c3c" }]}>
           {t("ngoProfile.logout")}
         </Text>
       </TouchableOpacity>
     </ScrollView>
   </SafeAreaView>
 );
}


function InfoRow({ icon, label, value, textColor, mutedColor }) {
 return (
   <View style={styles.infoRow}>
     <Icon name={icon} size={20} color={mutedColor} style={{ width: 24 }} />
     <Text style={[styles.infoLabel, { color: mutedColor }]}>{label}</Text>
     <Text style={[styles.infoValue, { color: textColor }]}>{value || '—'}</Text>
   </View>
 );
}


const styles = StyleSheet.create({
 container: { flex: 1 },
 scroll: { padding: 20 },
 centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
 header: { alignItems: 'center', marginBottom: 24 },
 avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 12 },
 name: { fontSize: 22, fontWeight: '700' },
 email: { fontSize: 14, marginTop: 4 },
 sectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 24, marginBottom: 8 },
 card: {
   borderRadius: 14,
   padding: 16,
   marginBottom: 16,
   shadowColor: '#000',
   shadowOpacity: 0.05,
   shadowOffset: { width: 0, height: 2 },
   shadowRadius: 6,
   elevation: 3,
   borderWidth: 1,
 },
 statsCard: {},
 infoRow: {
   flexDirection: 'row',
   alignItems: 'center',
   marginBottom: 12,
 },
 infoLabel: {
   flex: 1,
   fontSize: 14,
   marginLeft: 10,
 },
 infoValue: {
   fontSize: 14,
   fontWeight: '600',
 },
 prefRow: {
   flexDirection: 'row',
   justifyContent: 'space-between',
   alignItems: 'center',
   marginBottom: 20,
   paddingVertical: 12,
   paddingHorizontal: 16,
   borderRadius: 12,
   borderWidth: 1,
 },
 prefLabel: { flexDirection: 'row', alignItems: 'center' },
 prefText: { fontSize: 16, marginLeft: 10 },
 option: {
   flexDirection: 'row',
   alignItems: 'center',
   paddingVertical: 16,
   borderBottomWidth: 1,
   borderBottomColor: '#eee',
 },
 optionText: { fontSize: 16, marginLeft: 12 },
 initialsAvatar: {
   width: 88,
   height: 88,
   borderRadius: 44,
   justifyContent: 'center',
   alignItems: 'center',
   marginBottom: 12,
 },
 initialsText: {
   fontSize: 32,
   fontWeight: '700',
   color: '#fff',
 },
});



