'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, Shield, Key, Plus } from 'lucide-react';
import Layout from '@/components/Layout';
import FeatureCarousel from '@/components/FeatureCarousel';
import InteractiveBackground from '@/components/InteractiveBackground';

export default function DashboardPage() {
  const { user } = useAuth();

  // Fallback to email username if username is not available (for existing users)
  const displayName = user?.username || (user?.email ? user.email.split('@')[0] : 'User');

  return (
    <>
      <InteractiveBackground />
      <Layout>
        <div className="space-y-8 font-urbanist relative z-10">
        {user ? (
          <>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back</h1>
              <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {displayName}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                href="/vault"
                className="card hover:shadow-lg transition-shadow cursor-pointer group shimmer-card relative"
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className="card-icon-container vault-icon-container w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-800 transition-colors">
                    <Lock className="card-icon vault-icon w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Vault</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage your passwords</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/security"
                className="card hover:shadow-lg transition-shadow cursor-pointer group shimmer-card relative"
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className="card-icon-container security-icon-container w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                    <Shield className="card-icon security-icon w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Security</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Check password health</p>
                  </div>
                </div>
              </Link>

              <Link
                href="/vault?action=new"
                className="card hover:shadow-lg transition-shadow cursor-pointer group shimmer-card relative"
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className="card-icon-container add-item-icon-container w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                    <Plus className="card-icon add-item-icon w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Add Item</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Create new entry</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* Feature Carousel */}
            <FeatureCarousel />

            <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <div className="flex items-center gap-4">
                <Key className="w-8 h-8" />
                <div>
                  <h3 className="font-semibold text-lg">Zero-Knowledge Architecture</h3>
                  <p className="text-primary-50 mt-1">
                    Your master password never leaves your device. All encryption happens client-side.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 dark:bg-primary-900 rounded-full mb-6">
                <Lock className="w-10 h-10 text-primary-600 dark:text-primary-400" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Welcome to PassX
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
                Your secure password manager with zero-knowledge encryption. 
                Your master password never leaves your device.
              </p>
              <Link
                href="/auth?mode=signup"
                className="get-started-button inline-flex items-center justify-center px-8 py-3 bg-primary-600 dark:bg-white hover:bg-primary-700 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-semibold rounded-full transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Get Started
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card shimmer-card relative group">
                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <div className="card-icon-container zero-knowledge-icon-container w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-800 transition-colors">
                    <Shield className="card-icon zero-knowledge-icon w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Zero-Knowledge</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 relative z-10">
                  Your master password never leaves your device. All encryption happens client-side.
                </p>
              </div>

              <div className="card shimmer-card relative group">
                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <div className="card-icon-container encryption-icon-container w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                    <Key className="card-icon encryption-icon w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">AES-256 Encryption</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 relative z-10">
                  Industry-standard encryption ensures your passwords are protected with military-grade security.
                </p>
              </div>

              <div className="card shimmer-card relative group">
                <div className="flex items-center gap-4 mb-4 relative z-10">
                  <div className="card-icon-container vault-icon-container w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                    <Lock className="card-icon vault-feature-icon w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Secure Vault</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 relative z-10">
                  Store passwords, credit cards, and secure notes in your encrypted vault.
                </p>
              </div>
            </div>

            {/* Feature Carousel */}
            <FeatureCarousel />
          </>
        )}
        </div>
      </Layout>
    </>
  );
}

