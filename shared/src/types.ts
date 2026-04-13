export enum ItemType {
  WEBSITE = 'website',
  CARD = 'card',
  NOTE = 'note'
}

export enum SecurityLevel {
  WEAK = 'weak',
  REUSED = 'reused',
  OLD = 'old',
  STRONG = 'strong'
}

export interface VaultItem {
  id: string;
  type: ItemType;
  name: string;
  encryptedData: string; // Base64 encoded encrypted JSON
  iv: string; // Initialization vector (Base64)
  salt?: string; // Salt for this item (Base64)
  tags?: string[];
  category?: string;
  createdAt: Date;
  updatedAt: Date;
  lastAccessed?: Date;
}

export interface WebsiteLogin {
  url: string;
  username: string;
  password: string;
  notes?: string;
}

export interface Card {
  cardholderName: string;
  cardNumber: string; // Last 4 digits only in plaintext, full encrypted
  expiryMonth: string;
  expiryYear: string;
  // CVV never stored, only encrypted if absolutely necessary
  bankName?: string;
  notes?: string;
}

export interface SecureNote {
  title: string;
  content: string;
}

export interface VaultMetadata {
  userId: string;
  itemCount: number;
  lastSynced: Date;
  securityScore: number; // 0-100
}

export interface PasswordHealth {
  itemId: string;
  level: SecurityLevel; // Primary level (for backward compatibility)
  levels?: SecurityLevel[]; // All applicable levels (weak, reused, old, etc.)
  issues: string[];
  score: number; // 0-100
  lastChanged?: Date;
}

export interface SecurityDashboard {
  overallScore: number;
  weakPasswords: number;
  reusedPasswords: number;
  oldPasswords: number;
  strongPasswords: number;
  itemsByLevel: Record<SecurityLevel, VaultItem[]>;
  healthReports: PasswordHealth[];
}

export interface PasswordGeneratorOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  avoidSimilar: boolean;
  avoidAmbiguous: boolean;
}

