import { PasswordGeneratorOptions } from './types';

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const SIMILAR_CHARS = 'il1Lo0O';
const AMBIGUOUS_SYMBOLS = '{}[]()/\\\'"`~,;:.<>';

export function generatePassword(options: PasswordGeneratorOptions): string {
  let charset = '';

  if (options.includeLowercase) {
    charset += LOWERCASE;
  }
  if (options.includeUppercase) {
    charset += UPPERCASE;
  }
  if (options.includeNumbers) {
    charset += NUMBERS;
  }
  if (options.includeSymbols) {
    charset += SYMBOLS;
  }

  if (charset.length === 0) {
    throw new Error('At least one character type must be selected');
  }

  // Remove similar characters if requested
  if (options.avoidSimilar) {
    charset = charset
      .split('')
      .filter((char) => !SIMILAR_CHARS.includes(char))
      .join('');
  }

  // Remove ambiguous symbols if requested
  if (options.avoidAmbiguous) {
    charset = charset
      .split('')
      .filter((char) => !AMBIGUOUS_SYMBOLS.includes(char))
      .join('');
  }

  // Ensure at least one character from each selected type
  const requiredChars: string[] = [];
  if (options.includeLowercase) {
    const available = LOWERCASE.split('').filter(
      (c) => charset.includes(c)
    );
    if (available.length > 0) {
      requiredChars.push(
        available[Math.floor(Math.random() * available.length)]
      );
    }
  }
  if (options.includeUppercase) {
    const available = UPPERCASE.split('').filter(
      (c) => charset.includes(c)
    );
    if (available.length > 0) {
      requiredChars.push(
        available[Math.floor(Math.random() * available.length)]
      );
    }
  }
  if (options.includeNumbers) {
    const available = NUMBERS.split('').filter((c) => charset.includes(c));
    if (available.length > 0) {
      requiredChars.push(
        available[Math.floor(Math.random() * available.length)]
      );
    }
  }
  if (options.includeSymbols) {
    const available = SYMBOLS.split('').filter((c) => charset.includes(c));
    if (available.length > 0) {
      requiredChars.push(
        available[Math.floor(Math.random() * available.length)]
      );
    }
  }

  // Generate random password
  const passwordLength = Math.max(options.length, requiredChars.length);
  const passwordArray: string[] = [...requiredChars];

  // Fill the rest randomly
  for (let i = requiredChars.length; i < passwordLength; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    passwordArray.push(charset[randomIndex]);
  }

  // Shuffle the array
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join('');
}

export function calculatePasswordStrength(password: string): number {
  let score = 0;

  // Length score (max 25 points)
  if (password.length >= 8) score += 5;
  if (password.length >= 12) score += 5;
  if (password.length >= 16) score += 10;
  if (password.length >= 20) score += 5;

  // Character variety (max 40 points)
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 10;

  // Complexity (max 35 points)
  const uniqueChars = new Set(password).size;
  score += Math.min(15, (uniqueChars / password.length) * 15);

  // Pattern detection (penalties)
  const commonPatterns = [
    /12345/,
    /abcde/,
    /qwerty/,
    /password/i,
    /admin/i,
  ];
  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      score -= 20;
      break;
    }
  }

  // Repetition penalty
  const maxRepeat = Math.max(
    ...password.split('').map((char) => {
      // Escape special regex characters
      const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`${escapedChar}+`, 'g');
      const matches = password.match(regex);
      return matches ? Math.max(...matches.map((m) => m.length)) : 0;
    })
  );
  if (maxRepeat > 3) score -= 10;

  return Math.max(0, Math.min(100, score));
}

