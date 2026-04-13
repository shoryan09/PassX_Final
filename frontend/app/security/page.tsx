'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Layout from '@/components/Layout';
import { useVault } from '@/hooks/useVault';
import {
  analyzePasswordHealth,
  calculateSecurityScore,
  groupItemsBySecurityLevel,
  SecurityLevel,
} from '@passx/shared';
import { Shield, AlertTriangle, CheckCircle, Clock, RefreshCw, Plus } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import InteractiveBackground from '@/components/InteractiveBackground';

function SecurityDashboardContent() {
  const masterPassword =
    typeof window !== 'undefined' ? sessionStorage.getItem('masterPassword') : null;
  const { items, loading, decryptItem } = useVault(masterPassword);
  const [decryptedData, setDecryptedData] = useState<Map<string, any>>(new Map());
  const [securityData, setSecurityData] = useState<any>(null);
  const [decrypting, setDecrypting] = useState(false);
  const decryptedItemIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const loadDecryptedData = async () => {
      if (!masterPassword || items.length === 0 || loading) {
        if (items.length === 0) {
          setDecryptedData(new Map());
          setSecurityData(null);
          decryptedItemIdsRef.current.clear();
        }
        return;
      }
      
      // Only decrypt website items (password health only applies to websites)
      const websiteItems = items.filter(item => item.type === 'website');
      if (websiteItems.length === 0) {
        setDecryptedData(new Map());
        decryptedItemIdsRef.current.clear();
        return;
      }
      
      // Check if we already have decrypted data for these items
      const websiteItemIds = new Set(websiteItems.map(item => item.id));
      const idsMatch = websiteItemIds.size === decryptedItemIdsRef.current.size && 
        Array.from(websiteItemIds).every(id => decryptedItemIdsRef.current.has(id));
      
      if (idsMatch && decryptedData.size > 0) {
        // Already decrypted, skip
        return;
      }
      
      setDecrypting(true);
      
      try {
        // Decrypt all items in parallel for better performance
        const decryptionPromises = websiteItems.map(async (item) => {
          const decrypted = await decryptItem(item);
          return decrypted ? [item.id, decrypted] : null;
        });
        
        const results = await Promise.all(decryptionPromises);
        const newMap = new Map<string, any>();
        
        results.forEach((result) => {
          if (result) {
            const [itemId, decrypted] = result as [string, any];
            newMap.set(itemId, decrypted);
            decryptedItemIdsRef.current.add(itemId);
          }
        });
        
        setDecryptedData(newMap);
      } catch (error) {
        console.error('Error decrypting items:', error);
      } finally {
        setDecrypting(false);
      }
    };

    loadDecryptedData();
  }, [items, masterPassword, decryptItem, loading]);

  // Memoize security analysis to avoid recalculating on every render
  const securityDataMemo = useMemo(() => {
    if (decryptedData.size === 0 || items.length === 0 || decrypting) return null;
    
    // Only analyze website items
    const websiteItems = items.filter(item => item.type === 'website');
    if (websiteItems.length === 0) {
      return {
        overallScore: 100,
        weakPasswords: 0,
        reusedPasswords: 0,
        oldPasswords: 0,
        strongPasswords: 0,
        itemsByLevel: {
          [SecurityLevel.WEAK]: [],
          [SecurityLevel.REUSED]: [],
          [SecurityLevel.OLD]: [],
          [SecurityLevel.STRONG]: [],
        },
        healthReports: [],
      };
    }
    
    const healthReports = analyzePasswordHealth(websiteItems, decryptedData);
    const score = calculateSecurityScore(healthReports);
    const grouped = groupItemsBySecurityLevel(websiteItems, healthReports);

    return {
      overallScore: score,
      weakPasswords: grouped[SecurityLevel.WEAK].length,
      reusedPasswords: grouped[SecurityLevel.REUSED].length,
      oldPasswords: grouped[SecurityLevel.OLD].length,
      strongPasswords: grouped[SecurityLevel.STRONG].length,
      itemsByLevel: grouped,
      healthReports,
    };
  }, [decryptedData, items, decrypting]);

  useEffect(() => {
    if (securityDataMemo) {
      setSecurityData(securityDataMemo);
    }
  }, [securityDataMemo]);

  const getScoreColor = (score: number) => {
    if (score > 75) return 'text-green-600 dark:text-green-400';
    if (score >= 50 && score <= 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score > 75) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 50 && score <= 75) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  if (!masterPassword) {
    return (
      <>
        <InteractiveBackground />
        <Layout>
          <div className="card text-center relative z-10">
            <p className="text-gray-600 dark:text-gray-400">Please enter your master password to view security dashboard.</p>
          </div>
        </Layout>
      </>
    );
  }

  // Check if there are no items or no website items
  const websiteItems = items.filter(item => item.type === 'website');
  const hasNoItems = !loading && items.length === 0;
  const hasNoWebsiteItems = !loading && !decrypting && items.length > 0 && websiteItems.length === 0;

  if (hasNoItems || hasNoWebsiteItems) {
    return (
      <>
        <InteractiveBackground />
        <Layout>
          <div className="space-y-6 font-urbanist relative z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Security Dashboard</h1>
          </div>
          <div className="card text-center py-12">
            <Shield className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Passwords Stored
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {hasNoItems 
                ? 'There are currently no passwords stored in your vault. Add some items to view security analysis.'
                : 'There are no website passwords stored. Security analysis is only available for website logins.'}
            </p>
            <a
              href="/vault?action=new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Your First Item
            </a>
          </div>
        </div>
      </Layout>
      </>
    );
  }

  if (loading || decrypting || !securityData) {
    return (
      <>
        <InteractiveBackground />
        <Layout>
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {decrypting ? 'Decrypting vault items...' : 'Loading security data...'}
          </p>
        </div>
      </Layout>
      </>
    );
  }

  return (
    <>
      <InteractiveBackground />
      <Layout>
      <div className="space-y-6 font-urbanist">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Security Dashboard</h1>
        </div>

        {/* Overall Score */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Overall Security Score</h2>
            <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex items-center gap-6">
            <div
              className={`w-32 h-32 rounded-full flex items-center justify-center ${getScoreBgColor(
                securityData.overallScore
              )}`}
            >
              <span className={`text-4xl font-bold ${getScoreColor(securityData.overallScore)}`}>
                {securityData.overallScore}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                {securityData.overallScore > 75
                  ? 'Your vault security is excellent!'
                  : securityData.overallScore >= 50 && securityData.overallScore <= 75
                  ? 'Your vault security is good, but there\'s room for improvement.'
                  : 'Your vault security needs attention. Consider updating weak or reused passwords.'}
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {securityData.strongPasswords}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Strong Passwords</div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {securityData.weakPasswords + securityData.reusedPasswords + securityData.oldPasswords}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">Issues Found</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Weak</h3>
            </div>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{securityData.weakPasswords}</div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Passwords need strengthening</p>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <RefreshCw className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Reused</h3>
            </div>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{securityData.reusedPasswords}</div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Passwords used multiple times</p>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Old</h3>
            </div>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{securityData.oldPasswords}</div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Passwords older than 1 year</p>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Strong</h3>
            </div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{securityData.strongPasswords}</div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Secure passwords</p>
          </div>
        </div>

        {/* Issues List */}
        {(securityData.weakPasswords > 0 ||
          securityData.reusedPasswords > 0 ||
          securityData.oldPasswords > 0) && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Issues to Address</h2>
            <div className="space-y-3">
              {securityData.healthReports
                .filter(
                  (report: any) =>
                    report.level === SecurityLevel.WEAK ||
                    report.level === SecurityLevel.REUSED ||
                    report.level === SecurityLevel.OLD
                )
                .map((report: any) => {
                  const item = items.find((i) => i.id === report.itemId);
                  if (!item) return null;

                  return (
                    <div
                      key={report.itemId}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-l-4 border-red-500 dark:border-red-400"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            Security Score: <span className="font-medium">{report.score}/100</span>
                          </p>
                          <ul className="mt-2 space-y-1">
                            {report.issues.map((issue: string, idx: number) => (
                              <li key={idx} className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="ml-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              report.level === SecurityLevel.WEAK
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                : report.level === SecurityLevel.REUSED
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                            }`}
                          >
                            {report.level.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="card bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Recommendations</h2>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {securityData.weakPasswords > 0 && (
              <li>• Update {securityData.weakPasswords} weak password(s) using the password generator</li>
            )}
            {securityData.reusedPasswords > 0 && (
              <li>
                • Replace {securityData.reusedPasswords} reused password(s) with unique passwords
              </li>
            )}
            {securityData.oldPasswords > 0 && (
              <li>
                • Rotate {securityData.oldPasswords} password(s) that haven't been changed in over a year
              </li>
            )}
            {securityData.overallScore > 75 && (
              <li>• Great job! Your vault security is excellent. Keep it up!</li>
            )}
          </ul>
        </div>
      </div>
      </Layout>
    </>
  );
}

export default function SecurityDashboardPage() {
  return (
    <ProtectedRoute>
      <SecurityDashboardContent />
    </ProtectedRoute>
  );
}

