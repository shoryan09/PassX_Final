'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Lock, Shield, Home, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import DarkModeToggle from '@/components/DarkModeToggle';
import Footer from '@/components/Footer';

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Get user initials for profile icon
  const getUserInitials = () => {
    if (!user) return 'U';
    const displayName = user.username || (user.email ? user.email.split('@')[0] : 'User');
    return displayName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get profile picture or fallback to initials
  const getProfilePicture = () => {
    if (!user) return null;
    return user.profilePicture || user.photoURL || null;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  const allNavItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/vault', icon: Lock, label: 'Vault' },
    { path: '/security', icon: Shield, label: 'Security' },
  ];

  // Only show vault and security nav items when authenticated
  const navItems = user 
    ? allNavItems 
    : allNavItems.filter(item => item.path === '/dashboard');

  const handleLogout = () => {
    logout();
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors flex flex-col font-urbanist">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard" className="text-xl font-bold text-primary-600 dark:text-primary-400">
                  PassX
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-primary-500 text-gray-900 dark:text-white'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DarkModeToggle />
              {user ? (
                <>
                  {/* Profile Dropdown */}
                  <div className="relative" ref={profileRef}>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-full transition-all duration-200 hover:scale-105"
                    >
                      <div className="relative w-10 h-10">
                        {getProfilePicture() ? (
                          <img
                            src={getProfilePicture()!}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover border-2 border-primary-300 dark:border-primary-700 shadow-md hover:shadow-lg transition-shadow"
                            onError={(e) => {
                              // Hide image and show initials fallback
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.parentElement?.querySelector('.profile-initials') as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`profile-initials w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold text-sm shadow-md hover:shadow-lg transition-shadow ${getProfilePicture() ? 'hidden absolute inset-0' : ''}`}
                        >
                          {getUserInitials()}
                        </div>
                      </div>
                      <ChevronDown 
                        className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${
                          isProfileOpen ? 'rotate-180' : ''
                        }`} 
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 transform transition-all duration-200 ease-out opacity-100 translate-y-0">
                        <Link
                          href="/profile"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          <span>View Profile</span>
                        </Link>
                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                        <button
                          onClick={() => {
                            setIsProfileOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth?mode=signin"
                    className="login-button btn-secondary px-4 py-2 text-sm transition-all duration-300"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth?mode=signup"
                    className="signup-button btn-primary px-4 py-2 text-sm transition-all duration-300"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 pt-24">
        {children}
      </main>

      <Footer />
    </div>
  );
}

