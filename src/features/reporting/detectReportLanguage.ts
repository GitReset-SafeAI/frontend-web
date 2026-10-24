import type { ReportLanguageHint } from '../../services/contracts/incident'

// Small prototype vocabulary, not a general language model. Shared words and
// spelling variations make Romanized Sinhala and Latin-only mixing ambiguous.
// False negatives are intentional: an incorrect `en` hint bypasses translation.
const englishWords = new Set([
  'the', 'was', 'were', 'with', 'from', 'when', 'they', 'their', 'someone', 'followed',
  'after', 'before', 'kept', 'near', 'man', 'my', 'and', 'walking', 'harassed', 'me',
])
const sinhalaLatinWords = new Set([
  'mama', 'mata', 'mage', 'api', 'ape', 'eka', 'ekka', 'eke',
  'kenek', 'giya', 'hitiya', 'una', 'thibuna', 'karanna', 'karanawa',
])

function evidence(words: string[], vocabulary: Set<string>) {
  const matched = words.filter((word) => vocabulary.has(word))
  return { distinct: new Set(matched).size, coverage: matched.length / Math.max(words.length, 1) }
}

/**
 * Best-effort hint from text alone. Never changes the input or reads UI locale.
 * Script evidence identifies writing systems, not semantic language boundaries;
 * names/loanwords are not enough to establish mixing. Short/uncertain input is
 * unknown. Romanized Tamil/other Latin languages and unlisted Sinhala spellings
 * are not reliably distinguished. `si-Latn` does not imply translator support.
 */
export function detectReportLanguage(text: string): ReportLanguageHint {
  const letters = text.match(/\p{L}/gu) ?? []
  if (letters.length < 8) return 'unknown'

  const sinhala = letters.filter((letter) => /\p{Script=Sinhala}/u.test(letter)).length
  const tamil = letters.filter((letter) => /\p{Script=Tamil}/u.test(letter)).length
  const latin = letters.filter((letter) => /\p{Script=Latin}/u.test(letter)).length
  if (sinhala + tamil + latin !== letters.length) return 'unknown'

  const words = text.toLowerCase().match(/\p{L}+/gu) ?? []
  const latinWords = words.filter((word) => /^[a-z]+$/.test(word))
  const english = evidence(latinWords, englishWords)
  const romanized = evidence(latinWords, sinhalaLatinWords)
  const hasSinhala = sinhala >= 4 && sinhala / letters.length >= 0.2
  const hasTamil = tamil >= 4 && tamil / letters.length >= 0.2
  const hasEnglish = latinWords.length >= 4 && english.distinct >= 3 && english.coverage >= 0.5
  const hasRomanized = latinWords.length >= 4 && romanized.distinct >= 3 && romanized.coverage >= 0.4

  if (hasSinhala && hasTamil) return 'mixed'
  if ((hasSinhala || hasTamil) && hasEnglish) return 'mixed'
  if (hasTamil && hasRomanized) return 'mixed'
  if (hasSinhala && tamil === 0 && (sinhala / letters.length >= 0.6 || hasRomanized)) return 'si'
  if (hasTamil && sinhala === 0 && tamil / letters.length >= 0.6) return 'ta'
  // Any script evidence prevents a Latin-only label, including weak fragments.
  if (sinhala || tamil || latinWords.join('').length !== latin) return 'unknown'

  if (hasEnglish && romanized.distinct >= 2 && romanized.coverage >= 0.25) return 'mixed'
  if (hasRomanized && english.distinct <= 1) return 'si-Latn'
  if (latinWords.length >= 6 && english.distinct >= 4 && english.coverage >= 0.5 && romanized.distinct === 0) return 'en'
  return 'unknown'
}
