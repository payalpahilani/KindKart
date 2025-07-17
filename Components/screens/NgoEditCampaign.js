import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import CustomDropdown from '../Utilities/CustomDropdown';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ThemeContext } from '../Utilities/ThemeContext';
import { useTranslation } from 'react-i18next';

const MAX_IMAGES = 5;
const BACKEND_URL = 'https://kindkart-0l245p6y.b4a.run';

function getMimeType(uri) {
  const ext = uri.split('.').pop().toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/png';
  }
}

export default function NgoEditCampaign() {
  const navigation = useNavigation();
  const route = useRoute();
  const { campaign } = route.params;

  const { isDarkMode } = useContext(ThemeContext);
  const { t } = useTranslation();

  const colors = {
    background: isDarkMode ? '#121212' : '#FAF6F2',
    text: isDarkMode ? '#EEE' : '#2D3A4B',
    inputBg: isDarkMode ? '#222' : '#fff',
    border: isDarkMode ? '#555' : '#ccc',
    placeholder: isDarkMode ? '#888' : '#aaa',
    buttonCancelBg: isDarkMode ? '#555' : '#B8D6DF',
    buttonSubmitBg: '#EFAC3A',
    error: '#D94141',
    buttonTextCancel: isDarkMode ? '#ddd' : '#000',
    buttonTextSubmit: '#000',
    removeBtnBg: '#D94141',
    iconColor: isDarkMode ? '#EEE' : '#333',
  };

  const [title, setTitle] = useState(campaign.title || '');
  const [story, setStory] = useState(campaign.story || '');
  const [goal, setGoal] = useState(String(campaign.totalDonation) || '');
  const [currency, setCurrency] = useState(campaign.currency || '');
  const [status, setStatus] = useState(campaign.status || 'active');
  const [updating, setUpdating] = useState(false);
  const [images, setImages] = useState(campaign.imageUrls || []);
  const [campaignDate, setCampaignDate] = useState(campaign.campaignDate || '');
  const [category, setCategory] = useState(campaign.category || '');
  const [campaignCategory, setCampaignCategory] = useState(campaign.campaignCategory || '');
  const [urgent, setUrgent] = useState(campaign.urgent || false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [daysLeft, setDaysLeft] = useState(campaign.daysLeft || null);

  const pickImages = async () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert(t('editCampaign.max_image_limit'));
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert(t('editCampaign.permission_denied'), t('editCampaign.allow_photo_access'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: MAX_IMAGES - images.length,
    });

    if (!result.canceled) {
      const newImages = result.assets || [];
      setImages([...images, ...newImages].slice(0, MAX_IMAGES));
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const uploadImageToS3 = async (img, userId, itemId) => {
    const fileName = img.fileName || img.uri.split('/').pop();
    const fileType = img.type?.startsWith('image/') ? img.type : getMimeType(img.uri);

    const res = await fetch(
      `${BACKEND_URL}/get-presigned-url?fileName=${encodeURIComponent(
        fileName
      )}&fileType=${encodeURIComponent(fileType)}&userId=${userId}&itemId=${itemId}&type=ngo`
    );

    if (!res.ok) throw new Error(t('editCampaign.failed_presigned_url'));
    const { uploadUrl, publicUrl } = await res.json();

    const imgRes = await fetch(img.uri);
    const blob = await imgRes.blob();

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': fileType,
        'x-amz-server-side-encryption': 'AES256',
      },
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.log('S3 upload error response:', errorText);
      throw new Error(t('editCampaign.failed_upload_s3'));
    }

    return publicUrl;
  };

  const uploadAllImages = async (userId, itemId) => {
    const uploadedUrls = [];
    for (const img of images) {
      if (typeof img === 'string' && img.startsWith('https://')) {
        uploadedUrls.push(img); // already uploaded
      } else {
        const url = await uploadImageToS3(img, userId, itemId);
        uploadedUrls.push(url);
      }
    }
    return uploadedUrls;
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const auth = getAuth();
      const userId = auth.currentUser?.uid;
      const itemId = campaign.id;

      const imageUrls = await uploadAllImages(userId, itemId);

      const docRef = doc(db, 'campaigns', campaign.id);
      await updateDoc(docRef, {
        title,
        story,
        totalDonation: parseFloat(goal),
        currency,
        status,
        imageUrls,
        campaignDate,
        daysLeft,
        category,
        campaignCategory,
        urgent,
      });

      Alert.alert(t('editCampaign.updated'), t('editCampaign.campaign_updated_success'));
      navigation.goBack();
    } catch (err) {
      console.error('Update failed:', err);
      Alert.alert(t('editCampaign.error'), t('editCampaign.failed_update'));
    } finally {
      setUpdating(false);
    }
  };

  const toggleCampaignStatus = async () => {
    const newStatus = status === 'closed' ? 'active' : 'closed';
    Alert.alert(
      newStatus === 'closed' ? t('editCampaign.close_campaign') : t('editCampaign.reopen_campaign'),
      t(
        newStatus === 'closed'
          ? 'editCampaign.confirm_close_campaign'
          : 'editCampaign.confirm_reopen_campaign'
      ),
      [
        { text: t('editCampaign.cancel'), style: 'cancel' },
        {
          text: newStatus === 'closed' ? t('editCampaign.close') : t('editCampaign.reopen'),
          style: 'destructive',
          onPress: async () => {
            try {
              const docRef = doc(db, 'campaigns', campaign.id);
              await updateDoc(docRef, { status: newStatus });
              setStatus(newStatus);
              Alert.alert(t('editCampaign.updated'), t('editCampaign.campaign_now', { status: newStatus }));
              navigation.goBack();
            } catch (err) {
              console.error('Status update failed:', err);
              Alert.alert(t('editCampaign.error'), t('editCampaign.failed_update_status'));
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.navRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.iconColor} />
            </TouchableOpacity>
            <Text style={[styles.header, { color: colors.text }]}>{t('editCampaign.edit_campaign')}</Text>
            <View style={{ width: 24 }} />
          </View>

          <Text style={[styles.label, { color: colors.text }]}>{t('editCampaign.images')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {[...images, ...(images.length < MAX_IMAGES ? [{}] : [])].map((item, index) => {
              if (!item?.uri && !item?.startsWith?.('http')) {
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.imageBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                    onPress={pickImages}
                  >
                    <Text style={{ fontSize: 30, color: colors.placeholder }}>+</Text>
                  </TouchableOpacity>
                );
              }
              const uri = item.uri || item;
              return (
                <View
                  key={index}
                  style={[styles.imageBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                >
                  <Image source={{ uri }} style={styles.imageThumb} />
                  <TouchableOpacity style={[styles.removeBtn, { backgroundColor: colors.removeBtnBg }]} onPress={() => removeImage(index)}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>×</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>

          <Text style={[styles.label, { color: colors.text }]}>{t('editCampaign.campaign_title')}</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            placeholder={t('editCampaign.enter_campaign_title')}
            placeholderTextColor={colors.placeholder}
          />

          <Text style={[styles.label, { color: colors.text }]}>{t('editCampaign.story')}</Text>
          <TextInput
            value={story}
            onChangeText={setStory}
            multiline
            style={[
              styles.input,
              { height: 100, backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text },
            ]}
            placeholder={t('editCampaign.enter_story')}
            placeholderTextColor={colors.placeholder}
          />

          <Text style={[styles.label, { color: colors.text }]}>{t('editCampaign.goal_amount')}</Text>
          <TextInput
            value={goal}
            onChangeText={setGoal}
            keyboardType="numeric"
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            placeholder={t('editCampaign.enter_goal_amount')}
            placeholderTextColor={colors.placeholder}
          />

          <Text style={[styles.label, { color: colors.text }]}>{t('editCampaign.campaign_end_date')}</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={[styles.input, { justifyContent: 'center', backgroundColor: colors.inputBg, borderColor: colors.border }]}
          >
            <Text style={{ color: campaignDate ? colors.text : colors.placeholder }}>
              {campaignDate || t('editCampaign.select_end_date')}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={campaignDate ? new Date(campaignDate) : new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  const formatted = selectedDate.toISOString().split('T')[0];
                  setCampaignDate(formatted);
                  const today = new Date();
                  const diffTime = new Date(formatted) - today;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  setDaysLeft(diffDays);
                }
              }}
            />
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ flex: 1, fontSize: 15, color: colors.text }}>{t('editCampaign.mark_urgent')}</Text>
            <TouchableOpacity
              onPress={() => setUrgent(!urgent)}
              style={{
                backgroundColor: urgent ? '#0AB1E7' : '#555',
                width: 50,
                height: 28,
                borderRadius: 14,
                justifyContent: 'center',
                paddingHorizontal: 5,
              }}
            >
              <View
                style={{
                  backgroundColor: '#fff',
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  alignSelf: urgent ? 'flex-end' : 'flex-start',
                }}
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.text }]}>{t('editCampaign.category')}</Text>
          <CustomDropdown
            data={[
              { label: t('editCampaign.categories.donation'), value: 'donation' },
              { label: t('editCampaign.categories.charity'), value: 'charity' },
              { label: t('editCampaign.categories.campaign'), value: 'campaign' },
              { label: t('editCampaign.categories.support'), value: 'support' },
              { label: t('editCampaign.categories.fundraiser'), value: 'fundraiser' },
              { label: t('editCampaign.categories.awareness'), value: 'awareness' },
              { label: t('editCampaign.categories.events'), value: 'events' },
            ]}
            value={category}
            onChange={setCategory}
            placeholder={t('editCampaign.select_category')}
            inputStyle={{
              borderColor: colors.border,
              color: colors.text,
              fontSize: 16,
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
            }}
          />

          <Text style={[styles.label, { color: colors.text }]}>{t('editCampaign.campaign_category')}</Text>
          <CustomDropdown
            data={[
              { label: t('editCampaign.categories.medical_aid'), value: 'medical_aid' },
              { label: t('editCampaign.categories.disaster_relief'), value: 'disaster_relief' },
              { label: t('editCampaign.categories.child_welfare'), value: 'child_welfare' },
              { label: t('editCampaign.categories.women_empowerment'), value: 'women_empowerment' },
              { label: t('editCampaign.categories.education'), value: 'education' },
              { label: t('editCampaign.categories.environment'), value: 'environment' },
              { label: t('editCampaign.categories.animal_welfare'), value: 'animal_welfare' },
              { label: t('editCampaign.categories.community_development'), value: 'community_development' },
              { label: t('editCampaign.categories.elderly_support'), value: 'elderly_support' },
              { label: t('editCampaign.categories.livelihood_support'), value: 'livelihood_support' },
            ]}
            value={campaignCategory}
            onChange={setCampaignCategory}
            placeholder={t('editCampaign.select_campaign_category')}
            inputStyle={{
              borderColor: colors.border,
              color: colors.text,
              fontSize: 16,
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
            }}
          />

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.buttonSubmitBg }]}
            onPress={handleUpdate}
            disabled={updating}
          >
            <Text style={[styles.saveText, { color: colors.buttonTextSubmit }]}>
              {updating ? t('editCampaign.updating') : t('editCampaign.update_campaign')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.buttonCancelBg }]} onPress={toggleCampaignStatus}>
            <Text style={[styles.closeText, { color: colors.buttonTextCancel }]}>
              {status === 'closed' ? t('editCampaign.reopen_campaign') : t('editCampaign.close_campaign')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  backBtn: { marginBottom: 16, alignSelf: 'flex-start' },
  header: {
    fontSize: 24,
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  saveBtn: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveText: { fontWeight: '600', fontSize: 16 },
  closeBtn: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeText: { fontWeight: '600', fontSize: 16 },
  imageBox: {
    width: 80,
    height: 80,
    borderWidth: 1,
    marginRight: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageThumb: { width: 78, height: 78, borderRadius: 12 },
  removeBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
