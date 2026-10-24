import { ChevronDown, Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { type AppLanguage, isAppLanguage, languageNames, persistLanguage, supportedLanguages } from '../../i18n'

// A native <select> scales to any number of languages and gives keyboard and screen-reader support
// for free. Each option is written in its own language and carries its own `lang`.
export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const current: AppLanguage = isAppLanguage(i18n.language) ? i18n.language : 'en'

  const onChange = (value: string) => {
    if (!isAppLanguage(value)) return
    void i18n.changeLanguage(value)
    persistLanguage(value)
  }

  return (
    <div className="relative">
      <Languages className="pointer-events-none absolute left-3 top-1/2 hidden size-5 -translate-y-1/2 text-navy sm:block" aria-hidden />
      <select
        value={current}
        aria-label={t('language')}
        onChange={(event) => { onChange(event.target.value) }}
        className="min-h-12 cursor-pointer appearance-none rounded-full border border-ink-muted/60 bg-surface py-0 pl-3 pr-9 text-[0.9375rem] font-semibold text-navy hover:bg-mint-soft sm:pl-10"
      >
        {supportedLanguages.map((language) => (
          <option key={language} value={language} lang={language}>{languageNames[language]}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-navy" aria-hidden />
    </div>
  )
}
