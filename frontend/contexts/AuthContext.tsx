'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
  linkWithPopup,
  fetchSignInMethodsForEmail,
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider, githubProvider } from '@/lib/firebase';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface User {
  id: string;
  email: string;
  username?: string;
  createdAt: string;
  displayName?: string;
  photoURL?: string;
  profilePicture?: string | null;
  provider?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  loginWithGitHub: () => Promise<void>;
  loginWithPhone: (phoneNumber: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync Firebase auth state with backend
  const syncUserWithBackend = async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) return;
    try {
      const idToken = await firebaseUser.getIdToken();
      
      // Send token to backend to verify and get/create user
      const response = await axios.post(
        `${API_URL}/auth/verify-firebase-token`,
        { idToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const { user: backendUser, token: backendToken } = response.data;
      
      // Fetch full profile to get profilePicture
      let profilePicture = null;
      try {
        const profileResponse = await axios.get(`${API_URL}/profile`, {
          headers: { Authorization: `Bearer ${backendToken}` },
        });
        profilePicture = profileResponse.data.user.profilePicture || null;
      } catch (err) {
        console.log('Could not fetch profile picture:', err);
      }
      
      const userData = {
        id: backendUser.id,
        email: backendUser.email,
        username: backendUser.username || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        displayName: firebaseUser.displayName || undefined,
        photoURL: firebaseUser.photoURL || profilePicture || undefined,
        profilePicture: profilePicture,
        provider: firebaseUser.providerData[0]?.providerId || 'password',
        createdAt: backendUser.createdAt,
      };
      
      setUser(userData);
      setToken(backendToken);
      localStorage.setItem('token', backendToken);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${backendToken}`;
    } catch (error: any) {
      console.error('Error syncing user with backend:', error);
      // If backend sync fails, still allow Firebase auth
      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        displayName: firebaseUser.displayName || undefined,
        photoURL: firebaseUser.photoURL || undefined,
        provider: firebaseUser.providerData[0]?.providerId || 'password',
        createdAt: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncUserWithBackend(firebaseUser);
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await syncUserWithBackend(userCredential.user);
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        throw new Error('Cannot connect to server. Please make sure the backend is running on port 3001.');
      }
      throw error;
    }
  };

  const register = async (email: string, username: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update Firebase user profile with username
      if (userCredential.user) {
        // Note: Firebase doesn't have a username field, we'll store it in backend
      }
      
      await syncUserWithBackend(userCredential.user);
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
        throw new Error('Cannot connect to server. Please make sure the backend is running on port 3001.');
      }
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncUserWithBackend(result.user);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        return; // User closed popup, don't throw error
      }
      if (error.code === 'auth/account-exists-with-different-credential') {
        const email = error.customData?.email;
        const pendingCredential = error.credential;
        
        // If user is already signed in, try to link the account
        if (auth.currentUser) {
          try {
            await linkWithPopup(auth.currentUser, googleProvider);
            await syncUserWithBackend(auth.currentUser);
            return; // Successfully linked, don't throw error
          } catch (linkError: any) {
            throw new Error(
              `An account with ${email} already exists. Please sign in with email/password first, then you can link your Google account from your profile.`
            );
          }
        }
        
        // Check what sign-in methods are available
        try {
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (methods.includes('password')) {
            throw new Error(
              `An account with ${email} already exists. Please sign in with your email and password first. After signing in, you can link your Google account from your profile settings.`
            );
          } else {
            throw new Error(
              `An account with ${email} already exists. Please sign in with the original method you used (${methods[0] || 'email/password'}).`
            );
          }
        } catch (methodError: any) {
          // If we can't fetch methods, use generic message
          throw new Error(
            `An account with ${email} already exists. Please sign in with email/password or the original sign-in method you used.`
          );
        }
      }
      throw error;
    }
  };

  const loginWithFacebook = async () => {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      await syncUserWithBackend(result.user);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        return; // User closed popup, don't throw error
      }
      if (error.code === 'auth/account-exists-with-different-credential') {
        const email = error.customData?.email;
        
        // If user is already signed in, try to link the account
        if (auth.currentUser) {
          try {
            await linkWithPopup(auth.currentUser, facebookProvider);
            await syncUserWithBackend(auth.currentUser);
            return; // Successfully linked, don't throw error
          } catch (linkError: any) {
            throw new Error(
              `An account with ${email} already exists. Please sign in with email/password first, then you can link your Facebook account from your profile.`
            );
          }
        }
        
        // Check what sign-in methods are available
        try {
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (methods.includes('password')) {
            throw new Error(
              `An account with ${email} already exists. Please sign in with your email and password first. After signing in, you can link your Facebook account from your profile settings.`
            );
          } else {
            throw new Error(
              `An account with ${email} already exists. Please sign in with the original method you used (${methods[0] || 'email/password'}).`
            );
          }
        } catch (methodError: any) {
          throw new Error(
            `An account with ${email} already exists. Please sign in with email/password or the original sign-in method you used.`
          );
        }
      }
      throw error;
    }
  };

  const loginWithGitHub = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      await syncUserWithBackend(result.user);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        return; // User closed popup, don't throw error
      }
      if (error.code === 'auth/account-exists-with-different-credential') {
        const email = error.customData?.email;
        
        // If user is already signed in, try to link the account
        if (auth.currentUser) {
          try {
            await linkWithPopup(auth.currentUser, githubProvider);
            await syncUserWithBackend(auth.currentUser);
            return; // Successfully linked, don't throw error
          } catch (linkError: any) {
            throw new Error(
              `An account with ${email} already exists. Please sign in with email/password first, then you can link your GitHub account from your profile.`
            );
          }
        }
        
        // Check what sign-in methods are available
        try {
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (methods.includes('password')) {
            throw new Error(
              `An account with ${email} already exists. Please sign in with your email and password first. After signing in, you can link your GitHub account from your profile settings.`
            );
          } else {
            throw new Error(
              `An account with ${email} already exists. Please sign in with the original method you used (${methods[0] || 'email/password'}).`
            );
          }
        } catch (methodError: any) {
          throw new Error(
            `An account with ${email} already exists. Please sign in with email/password or the original sign-in method you used.`
          );
        }
      }
      throw error;
    }
  };

  const loginWithPhone = async (phoneNumber: string) => {
    // This is handled by PhoneAuth component
    // The component will call syncUserWithBackend after successful verification
    // This method is here for consistency with other auth methods
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        login, 
        register, 
        loginWithGoogle,
        loginWithFacebook,
        loginWithGitHub,
        loginWithPhone,
        logout, 
        loading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
