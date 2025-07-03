import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './locales/en.json';
import fr from './locales/fr.json';

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: (callback) => {
    const deviceLang = Localization.locale.slice(0, 2).toLowerCase();
    if (deviceLang === 'fr') {
      callback('fr');
    } else {
      callback('en'); 
    }
  },
  init: () => {},
  cacheUserLanguage: () => {}
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      fr: { translation: fr }
    },
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;
