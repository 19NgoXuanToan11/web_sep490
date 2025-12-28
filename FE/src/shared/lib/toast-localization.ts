import type { ReactNode } from 'react'
import { ENGLISH_TO_VIETNAMESE_PATTERNS } from './error-messages'

type LocalizationRule =
  | {
      pattern: RegExp
      replacement: string
    }
  | {
      pattern: RegExp
      replacer: (match: RegExpExecArray) => string
    }

const VIETNAMESE_CHAR_PATTERN =
  /[ăâđêôơưáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i

const GENERIC_TRANSLATIONS: LocalizationRule[] = [
  { pattern: /\bsuccess\b/gi, replacement: 'Thành công' },
  { pattern: /\berror\b/gi, replacement: 'Lỗi' },
  { pattern: /\bwarning\b/gi, replacement: 'Cảnh báo' },
  { pattern: /please try again/gi, replacement: 'Vui lòng thử lại.' },
  {
    pattern: /updated successfully/gi,
    replacement: 'Đã cập nhật thành công.',
  },
  {
    pattern: /created successfully/gi,
    replacement: 'Tạo mới thành công.',
  },
  {
    pattern: /deleted successfully/gi,
    replacement: 'Xóa thành công.',
  },
  {
    pattern: /saved successfully/gi,
    replacement: 'Lưu dữ liệu thành công.',
  },
  {
    pattern: /(\d+)\s+items?\s+found/gi,
    replacer: match => `Tìm thấy ${match[1]} mục.`,
  },
]

export const localizeToastText = (text?: ReactNode, fallback?: string): ReactNode | undefined => {
  if (text === undefined || text === null) {
    return fallback
  }

  if (typeof text !== 'string') {
    return text
  }

  if (VIETNAMESE_CHAR_PATTERN.test(text)) {
    return text
  }
  const wordCount = text.trim().split(/\s+/).length
  const shouldApplyGenericTranslations = wordCount <= 6

  if (shouldApplyGenericTranslations) {
    for (const rule of GENERIC_TRANSLATIONS) {
      const execResult = rule.pattern.exec(text)
      if (execResult) {
        return 'replacer' in rule ? rule.replacer(execResult) : rule.replacement
      }
    }
  }

  const patternMatch = ENGLISH_TO_VIETNAMESE_PATTERNS.find(rule => rule.pattern.test(text))
  if (patternMatch) {
    return patternMatch.vietnamese
  }

  return fallback ?? text
}
