import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import fr from './locales/fr.json';

i18n
  .use(initReactI18next) 
  .init({
    compatibilityJSON: 'v3', 
    lng: 'en', 
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    interpolation: {
      escapeValue: false, 
    },
  });

export default i18n;
