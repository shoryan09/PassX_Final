'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useVault } from '@/hooks/useVault';
import {
  analyzePasswordHealth,
  calculateSecurityScore,
  SecurityLevel,
} from '@passx/shared';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import InteractiveBackground from '@/components/InteractiveBackground';
import { User, Edit2, Save, X, Upload, Shield, Lock, Mail, Calendar, Clock } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function ProfileContent() {
  const { user, token } = useAuth();
  const masterPassword =
    typeof window !== 'undefined' ? sessionStorage.getItem('masterPassword') : null;
  const { items, loading: vaultLoading, decryptItem } = useVault(masterPassword);
  
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingUsername, setEditingUsername] = useState(false);
  const [username, setUsername] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [securityScore, setSecurityScore] = useState<number | null>(null);
  const [passwordCount, setPasswordCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [decryptedData, setDecryptedData] = useState<Map<string, any>>(new Map());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log('Profile data received:', response.data.user);
        setProfileData(response.data.user);
        setUsername(response.data.user.username || '');
        const pic = response.data.user.profilePicture;
        console.log('Profile picture value:', pic ? 'exists' : 'null/undefined', pic?.substring(0, 50));
        setProfilePicture(pic || null);
        setPasswordCount(response.data.user.passwordCount || 0);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.response?.data?.error || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  // Calculate security score
  useEffect(() => {
    const calculateScore = async () => {
      if (!masterPassword || items.length === 0 || vaultLoading) {
        setSecurityScore(null);
        return;
      }

      const websiteItems = items.filter(item => item.type === 'website');
      if (websiteItems.length === 0) {
        setSecurityScore(100);
        return;
      }

      try {
        // Decrypt website items
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
          }
        });
        
        setDecryptedData(newMap);
        
        // Calculate security score
        const healthReports = analyzePasswordHealth(websiteItems, newMap);
        const score = calculateSecurityScore(healthReports);
        setSecurityScore(score);
      } catch (error) {
        console.error('Error calculating security score:', error);
        setSecurityScore(null);
      }
    };

    calculateScore();
  }, [items, masterPassword, decryptItem, vaultLoading]);

  // Auto-hide success/error messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleEditUsername = () => {
    setEditingUsername(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancelEdit = () => {
    setEditingUsername(false);
    setUsername(profileData?.username || '');
    setError(null);
    setSuccess(null);
  };

  const handleSaveUsername = async () => {
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const response = await axios.put(
        `${API_URL}/profile`,
        { username: username.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setProfileData(response.data.user);
      setEditingUsername(false);
      setSuccess('Username updated successfully!');
      
      // Update auth context
      setTimeout(() => window.location.reload(), 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update username');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      
      // Validate base64 string
      if (!base64String || !base64String.startsWith('data:image/')) {
        setError('Failed to process image. Please try again.');
        return;
      }
      
      try {
        setSaving(true);
        setError(null);
        const response = await axios.put(
          `${API_URL}/profile`,
          { profilePicture: base64String },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        console.log('Upload successful, response:', response.data);
        const updatedPic = response.data.user.profilePicture;
        console.log('Updated profile picture:', updatedPic ? 'exists' : 'null', updatedPic?.substring(0, 50));
        setProfilePicture(updatedPic || base64String);
        setProfileData(response.data.user);
        setSuccess('Profile picture updated successfully!');
        
        // Update user in AuthContext by reloading page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err: any) {
        console.error('Upload error:', err);
        const errorMessage = err.response?.data?.error || 
                            err.response?.data?.details?.map((d: any) => d.message).join(', ') ||
                            err.message ||
                            'Failed to update profile picture. Please try again.';
        setError(errorMessage);
      } finally {
        setSaving(false);
      }
    };
    reader.onerror = () => {
      setError('Failed to read image file. Please try selecting a different image.');
      setSaving(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePicture = async () => {
    try {
      setSaving(true);
      setError(null);
      const response = await axios.put(
        `${API_URL}/profile`,
        { profilePicture: null },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      setProfilePicture(null);
      setProfileData(response.data.user);
      setSuccess('Profile picture removed successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove profile picture');
    } finally {
      setSaving(false);
    }
  };

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

  const getUserInitials = () => {
    const displayName = username || (user?.email ? user.email.split('@')[0] : 'User');
    return displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <>
        <InteractiveBackground />
        <Layout>
          <div className="card text-center py-12 animate-fade-in">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading profile...</p>
          </div>
        </Layout>
      </>
    );
  }

  return (
    <>
      <InteractiveBackground />
      <Layout>
        <div className={`space-y-6 font-urbanist relative z-10 ${mounted ? 'animate-fade-in' : ''}`}>
          {/* Header */}
          <div className="flex items-center gap-4 animate-slide-up">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Profile</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account settings</p>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className={`card bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 shadow-lg animate-slide-up ${mounted ? 'animate-fade-in' : ''}`}>
              <p className="text-green-700 dark:text-green-400 font-medium flex items-center gap-2">
                <span className="animate-pulse">✓</span>
                {success}
              </p>
            </div>
          )}
          {error && (
            <div className={`card bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-2 border-red-300 dark:border-red-700 shadow-lg animate-slide-up ${mounted ? 'animate-fade-in' : ''}`}>
              <p className="text-red-700 dark:text-red-400 font-medium flex items-center gap-2">
                <span className="animate-pulse">✕</span>
                {error}
              </p>
            </div>
          )}

          {/* Profile Picture Section */}
          <div className={`card bg-gradient-to-br from-white to-primary-50/30 dark:from-gray-800 dark:to-primary-900/10 border-2 border-primary-200/50 dark:border-primary-800/50 shadow-xl hover:shadow-2xl transition-all duration-300 group shimmer-card ${mounted ? 'animate-slide-up' : ''}`} style={{ animationDelay: '0.1s' }}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              Profile Picture
            </h2>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
              <div className="relative group/picture">
                {profilePicture && profilePicture.trim() !== '' ? (
                  <div className="relative">
                    <img
                      src={profilePicture}
                      alt="Profile"
                      className="w-40 h-40 rounded-full object-cover border-4 border-primary-300 dark:border-primary-700 shadow-2xl transform group-hover/picture:scale-110 transition-all duration-500 group-hover/picture:rotate-3"
                      onError={(e) => {
                        console.error('Image load error:', e);
                        setError('Failed to load profile picture. Please try uploading again.');
                        setProfilePicture(null);
                      }}
                      onLoad={() => console.log('Profile picture loaded successfully')}
                    />
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-400/20 to-transparent opacity-0 group-hover/picture:opacity-100 transition-opacity duration-300"></div>
                  </div>
                ) : (
                  <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center text-white font-bold text-5xl border-4 border-primary-300 dark:border-primary-700 shadow-2xl transform group-hover/picture:scale-110 transition-all duration-500 group-hover/picture:rotate-3 animate-pulse-slow">
                    {getUserInitials()}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                  <User className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex flex-col gap-4 flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                  className="group/btn inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  <Upload className="w-5 h-5 group-hover/btn:rotate-12 transition-transform duration-300" />
                  <span>{profilePicture ? 'Change Picture' : 'Upload Picture'}</span>
                </button>
                {profilePicture && (
                  <button
                    onClick={handleRemovePicture}
                    disabled={saving}
                    className="group/btn inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  >
                    <X className="w-5 h-5 group-hover/btn:rotate-90 transition-transform duration-300" />
                    <span>Remove Picture</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Username Section */}
          <div className={`card bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-900/10 border-2 border-blue-200/50 dark:border-blue-800/50 shadow-xl hover:shadow-2xl transition-all duration-300 group shimmer-card ${mounted ? 'animate-slide-up' : ''}`} style={{ animationDelay: '0.2s' }}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Edit2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              Username
            </h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {editingUsername ? (
                <div className="flex-1 flex flex-col sm:flex-row gap-4 animate-fade-in">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="flex-1 px-5 py-3 border-2 border-blue-300 dark:border-blue-700 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 shadow-lg"
                    placeholder="Enter username"
                    disabled={saving}
                    autoFocus
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveUsername}
                      disabled={saving || !username.trim()}
                      className="group/btn inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                    >
                      <Save className="w-5 h-5 group-hover/btn:rotate-12 transition-transform duration-300" />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="group/btn inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                    >
                      <X className="w-5 h-5 group-hover/btn:rotate-90 transition-transform duration-300" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                  <div className="flex-1 px-5 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-600 shadow-inner">
                    <p className="text-gray-900 dark:text-white font-semibold text-lg">
                      {username || 'Not set'}
                    </p>
                  </div>
                  <button
                    onClick={handleEditUsername}
                    className="group/btn inline-flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  >
                    <Edit2 className="w-5 h-5 group-hover/btn:rotate-12 transition-transform duration-300" />
                    <span>Edit</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Statistics Section */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${mounted ? 'animate-slide-up' : ''}`} style={{ animationDelay: '0.3s' }}>
            {/* Password Count */}
            <div className="card bg-gradient-to-br from-white via-primary-50/50 to-primary-100/30 dark:from-gray-800 dark:via-primary-900/10 dark:to-primary-900/20 border-2 border-primary-200/50 dark:border-primary-800/50 shadow-xl hover:shadow-2xl transition-all duration-300 group shimmer-card transform hover:scale-105">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Passwords Stored</h3>
              </div>
              <div className="text-6xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2 animate-pulse-slow">
                {passwordCount}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total items in your vault</p>
            </div>

            {/* Security Score */}
            <div className={`card bg-gradient-to-br from-white via-green-50/50 to-emerald-100/30 dark:from-gray-800 dark:via-green-900/10 dark:to-emerald-900/20 border-2 ${securityScore !== null ? getScoreBgColor(securityScore).replace('bg-', 'border-') : 'border-green-200/50 dark:border-green-800/50'} shadow-xl hover:shadow-2xl transition-all duration-300 group shimmer-card transform hover:scale-105`}>
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-16 h-16 rounded-2xl ${securityScore !== null ? getScoreBgColor(securityScore) : 'bg-gradient-to-br from-green-500 to-emerald-700'} flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}>
                  <Shield className={`w-8 h-8 ${securityScore !== null ? getScoreColor(securityScore) : 'text-green-600 dark:text-green-400'}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Security Score</h3>
              </div>
              {securityScore !== null ? (
                <>
                  <div className={`text-6xl font-bold mb-2 animate-pulse-slow ${getScoreColor(securityScore)}`}>
                    {securityScore}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {securityScore > 75
                      ? 'Excellent security'
                      : securityScore >= 50 && securityScore <= 75
                      ? 'Good security'
                      : 'Needs improvement'}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-6xl font-bold text-gray-400 dark:text-gray-500 mb-2">—</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {vaultLoading ? 'Calculating...' : 'No website passwords to analyze'}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Account Information */}
          <div className={`card bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-800 dark:to-purple-900/10 border-2 border-purple-200/50 dark:border-purple-800/50 shadow-xl hover:shadow-2xl transition-all duration-300 group shimmer-card ${mounted ? 'animate-slide-up' : ''}`} style={{ animationDelay: '0.4s' }}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              Account Information
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 group/item">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center group-hover/item:scale-110 transition-transform duration-300">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Email</span>
                </div>
                <span className="text-gray-900 dark:text-white font-semibold text-lg">{user?.email}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 group/item">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center group-hover/item:scale-110 transition-transform duration-300">
                    <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Member Since</span>
                </div>
                <span className="text-gray-900 dark:text-white font-semibold">
                  {profileData?.createdAt
                    ? new Date(profileData.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '—'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 group/item">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center group-hover/item:scale-110 transition-transform duration-300">
                    <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Last Updated</span>
                </div>
                <span className="text-gray-900 dark:text-white font-semibold">
                  {profileData?.updatedAt
                    ? new Date(profileData.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileContent />
    </ProtectedRoute>
  );
}
