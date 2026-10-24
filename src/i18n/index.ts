import { createInstance } from 'i18next'
import { initReactI18next } from 'react-i18next'

import enAccount from './locales/en/account.json'
import enCommon from './locales/en/common.json'
import enEmergency from './locales/en/emergency.json'
import enIncidentAi from './locales/en/incidentAi.json'
import enReporting from './locales/en/reporting.json'
import enSafety from './locales/en/safety.json'
import enWeb from './locales/en/web.json'
import siAccount from './locales/si/account.json'
import siCommon from './locales/si/common.json'
import taAccount from './locales/ta/account.json'
import taCommon from './locales/ta/common.json'
import siEmergency from './locales/si/emergency.json'
import taEmergency from './locales/ta/emergency.json'
import siIncidentAi from './locales/si/incidentAi.json'
import taIncidentAi from './locales/ta/incidentAi.json'
import siReporting from './locales/si/reporting.json'
import taReporting from './locales/ta/reporting.json'
import siSafety from './locales/si/safety.json'
import taSafety from './locales/ta/safety.json'
import siWeb from './locales/si/web.json'
import taWeb from './locales/ta/web.json'

export const supportedLanguages = ['en', 'si', 'ta'] as const
export type AppLanguage = (typeof supportedLanguages)[number]

// Each language is named in itself, so it is recognisable to the people who read it.
export const languageNames: Record<AppLanguage, string> = { en: 'English', si: 'සිංහල', ta: 'தமிழ்' }

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return supportedLanguages.some((language) => language === value)
}

const storageKey = 'safestep.language'

// Interface language only. It is a convenience preference, never report content.
function initialLanguage(): AppLanguage {
  try {
    const stored = window.localStorage.getItem(storageKey)
    if (isAppLanguage(stored)) return stored
  } catch {
    // Storage can be blocked; fall through to the browser language.
  }
  const browser = window.navigator.language.toLowerCase().split('-')[0]
  return isAppLanguage(browser) ? browser : 'en'
}

export function persistLanguage(language: AppLanguage) {
  try {
    window.localStorage.setItem(storageKey, language)
  } catch {
    // Not persisting is fine.
  }
}

const i18n = createInstance()

void i18n.use(initReactI18next).init({
  resources: {
    en: { account: enAccount, common: enCommon, emergency: enEmergency, incidentAi: enIncidentAi, reporting: enReporting, safety: enSafety, web: enWeb },
    si: { account: siAccount, common: siCommon, emergency: siEmergency, incidentAi: siIncidentAi, reporting: siReporting, safety: siSafety, web: siWeb },
    ta: { account: taAccount, common: taCommon, emergency: taEmergency, incidentAi: taIncidentAi, reporting: taReporting, safety: taSafety, web: taWeb },
  },
  lng: initialLanguage(),
  supportedLngs: [...supportedLanguages],
  fallbackLng: 'en',
  defaultNS: 'common',
  initAsync: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

// Keep <html lang> in step so screen readers and fonts pick the right voice and script.
const syncDocumentLanguage = (language: string) => { document.documentElement.lang = language }
syncDocumentLanguage(i18n.language)
i18n.on('languageChanged', syncDocumentLanguage)

export default i18n
