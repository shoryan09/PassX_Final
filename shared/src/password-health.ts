import {
  VaultItem,
  SecurityLevel,
  PasswordHealth,
  WebsiteLogin,
} from './types';
import { calculatePasswordStrength } from './password-generator';

const WEAK_THRESHOLD = 40;
const OLD_PASSWORD_DAYS = 365; // 1 year

export function analyzePasswordHealth(
  items: VaultItem[],
  decryptedDataMap: Map<string, any>
): PasswordHealth[] {
  const healthReports: PasswordHealth[] = [];
  const passwordMap = new Map<string, { itemId: string; password: string }[]>();

  // Group passwords by their value to detect reuse
  for (const item of items) {
    const decrypted = decryptedDataMap.get(item.id);
    if (!decrypted) continue;

    if (item.type === 'website' && decrypted.password) {
      const password = decrypted.password;
      if (!passwordMap.has(password)) {
        passwordMap.set(password, []);
      }
      passwordMap.get(password)!.push({
        itemId: item.id,
        password: password,
      });
    }
  }

  // Analyze each item
  for (const item of items) {
    const decrypted = decryptedDataMap.get(item.id);
    if (!decrypted) continue;

    if (item.type !== 'website') continue;

    const login = decrypted as WebsiteLogin;
    const password = login.password;
    const issues: string[] = [];
    const levels: SecurityLevel[] = [];
    let primaryLevel: SecurityLevel = SecurityLevel.STRONG;
    let score = calculatePasswordStrength(password);

    // Check if weak
    const isWeak = score < WEAK_THRESHOLD;
    if (isWeak) {
      levels.push(SecurityLevel.WEAK);
      primaryLevel = SecurityLevel.WEAK;
      issues.push('Password is too weak');
    }

    // Check if reused
    const passwordOccurrences = passwordMap.get(password) || [];
    const isReused = passwordOccurrences.length > 1;
    if (isReused) {
      levels.push(SecurityLevel.REUSED);
      primaryLevel = SecurityLevel.REUSED; // Reused takes priority for primary level
      issues.push(
        `Password is reused across ${passwordOccurrences.length} accounts`
      );
      score = Math.min(score, 30); // Cap score for reused passwords
    }

    // Check if old
    // Handle both Date objects and date strings (from MongoDB/Prisma)
    let updatedAtDate: Date;
    if (item.updatedAt instanceof Date) {
      updatedAtDate = item.updatedAt;
    } else if (typeof item.updatedAt === 'string') {
      updatedAtDate = new Date(item.updatedAt);
    } else if (item.updatedAt && typeof item.updatedAt === 'object' && 'getTime' in item.updatedAt) {
      // Handle Prisma Date objects
      updatedAtDate = new Date(item.updatedAt as any);
    } else {
      // Fallback to current date if invalid
      updatedAtDate = new Date();
    }
    
    const daysSinceUpdate =
      (Date.now() - updatedAtDate.getTime()) / (1000 * 60 * 60 * 24);
    const isOld = daysSinceUpdate > OLD_PASSWORD_DAYS;
    if (isOld) {
      levels.push(SecurityLevel.OLD);
      if (primaryLevel === SecurityLevel.STRONG) {
        primaryLevel = SecurityLevel.OLD;
      }
      issues.push(
        `Password hasn't been changed in ${Math.floor(daysSinceUpdate)} days`
      );
      score = Math.max(0, score - 20);
    }

    // If no issues, mark as strong
    if (levels.length === 0) {
      levels.push(SecurityLevel.STRONG);
    }

    healthReports.push({
      itemId: item.id,
      level: primaryLevel, // Keep primary level for backward compatibility
      levels: levels, // Store all applicable levels
      issues,
      score: Math.max(0, Math.min(100, score)),
      lastChanged: updatedAtDate,
    });
  }

  return healthReports;
}

export function calculateSecurityScore(healthReports: PasswordHealth[]): number {
  if (healthReports.length === 0) return 100;

  const totalScore = healthReports.reduce((sum, report) => sum + report.score, 0);
  return Math.round(totalScore / healthReports.length);
}

export function groupItemsBySecurityLevel(
  items: VaultItem[],
  healthReports: PasswordHealth[]
): Record<SecurityLevel, VaultItem[]> {
  const grouped: Record<SecurityLevel, VaultItem[]> = {
    [SecurityLevel.WEAK]: [],
    [SecurityLevel.REUSED]: [],
    [SecurityLevel.OLD]: [],
    [SecurityLevel.STRONG]: [],
  };

  const healthMap = new Map(
    healthReports.map((report) => [report.itemId, report])
  );

  for (const item of items) {
    const health = healthMap.get(item.id);
    if (health) {
      // If health report has multiple levels, add item to all applicable categories
      const levelsToAdd = health.levels || [health.level];
      for (const level of levelsToAdd) {
        // Avoid duplicates
        if (!grouped[level].find(i => i.id === item.id)) {
          grouped[level].push(item);
        }
      }
    } else {
      grouped[SecurityLevel.STRONG].push(item);
    }
  }

  return grouped;
}

