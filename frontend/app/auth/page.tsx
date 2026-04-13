'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DarkModeToggle from '@/components/DarkModeToggle';
import InteractiveBackground from '@/components/InteractiveBackground';
import PhoneAuth from '@/components/PhoneAuth';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';

type AuthMode = 'signin' | 'signup';

function AuthPageContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>((searchParams.get('mode') as AuthMode) || 'signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isPhoneAuthOpen, setIsPhoneAuthOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const { login, register, loginWithGoogle, loginWithFacebook, loginWithGitHub, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Update mode based on URL params
  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'signup' || urlMode === 'signin') {
      setMode(urlMode);
    }
  }, [searchParams]);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowError(false);
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
      setShowError(true);
      // Reset error animation after animation completes
      setTimeout(() => setShowError(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowError(false);

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setShowError(true);
      setTimeout(() => setShowError(false), 500);
      return;
    }

    setLoading(true);

    if (!name.trim()) {
      setError('Name is required');
      setShowError(true);
      setTimeout(() => setShowError(false), 500);
      setLoading(false);
      return;
    }

    try {
      await register(email, name.trim(), password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Registration failed');
      setShowError(true);
      setTimeout(() => setShowError(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError('');
    setShowError(false);
    // Clear form fields when switching
    setEmail('');
    setPassword('');
    setName('');
    setShowPassword(false);
  };

  // Show loading while checking auth or redirecting
  if (authLoading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 relative overflow-hidden font-urbanist">
      {/* Interactive background */}
      <InteractiveBackground />
      
      {/* Animated gradient orbs - enhanced for light mode */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob dark:bg-blue-800 dark:mix-blend-screen dark:opacity-10"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000 dark:bg-purple-800 dark:mix-blend-screen dark:opacity-10"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000 dark:bg-pink-800 dark:mix-blend-screen dark:opacity-10"></div>
        {/* Additional orb for light mode */}
        <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-25 animate-blob animation-delay-3000 dark:hidden"></div>
      </div>

      {/* Floating geometric shapes - enhanced for light mode */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute opacity-15 dark:opacity-5"
            style={{
              left: `${8 + (i * 7)}%`,
              top: `${10 + (i % 4) * 25}%`,
              animation: `float ${6 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          >
            <div
              className={`w-16 h-16 ${
                i % 4 === 0
                  ? 'bg-blue-500 rounded-full'
                  : i % 4 === 1
                  ? 'bg-purple-500 rotate-45'
                  : i % 4 === 2
                  ? 'bg-pink-500 rounded-lg rotate-12'
                  : 'bg-cyan-500 rounded-full rotate-90'
              } blur-sm shadow-lg`}
              style={{
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              }}
            />
          </div>
        ))}
      </div>

      {/* Dark mode toggle */}
      <div className="absolute top-4 right-4 z-50">
        <DarkModeToggle />
      </div>

      {/* Main container */}
      <div className="w-full max-w-5xl mx-4 relative z-10">
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-[3rem] shadow-2xl overflow-hidden relative min-h-[650px] flex border border-white/20">
          {/* Sign In Form Panel */}
          <div
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              mode === 'signin'
                ? 'translate-x-0 opacity-100 z-10'
                : 'translate-x-[-100%] opacity-0 z-0 pointer-events-none'
            }`}
            style={{
              width: mode === 'signin' ? '45%' : '55%',
            }}
          >
            <div className="h-full flex flex-col justify-center px-12 py-16 bg-white dark:bg-gray-800 relative overflow-hidden">
              {/* Curved divider on the right */}
              <div className={`absolute right-0 top-0 bottom-0 w-20 transition-all duration-1000 ease-in-out z-0 ${
                mode === 'signin' ? 'opacity-100' : 'opacity-0'
              }`}>
                <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path
                    d={`M 0 0 Q 50 20 50 50 T 0 100`}
                    fill="white"
                    className="dark:fill-gray-800"
                  />
                  <path
                    d={`M 0 0 Q 50 30 50 50 T 0 100`}
                    fill="white"
                    className="dark:fill-gray-800"
                    opacity="0.3"
                  />
                </svg>
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 font-science-gothic">Sign In</h2>
              
              {/* Social login buttons */}
              <div className="flex gap-4 mt-6 mb-4">
                <button 
                  onClick={async () => {
                    try {
                      await loginWithGoogle();
                      router.push('/dashboard');
                    } catch (err: any) {
                      if (err.code !== 'auth/popup-closed-by-user') {
                        setError(err.message || 'Google sign-in failed');
                        setShowError(true);
                        setTimeout(() => setShowError(false), 500);
                      }
                    }
                  }}
                  className="w-16 h-16 rounded-xl border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-red-500 dark:hover:border-red-400 hover:scale-110 transition-all duration-300 hover:shadow-md cursor-pointer"
                  title="Sign in with Google"
                >
                  <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">G</span>
                </button>
                <button 
                  onClick={async () => {
                    try {
                      await loginWithFacebook();
                      router.push('/dashboard');
                    } catch (err: any) {
                      if (err.code !== 'auth/popup-closed-by-user') {
                        setError(err.message || 'Facebook sign-in failed');
                        setShowError(true);
                        setTimeout(() => setShowError(false), 500);
                      }
                    }
                  }}
                  className="w-16 h-16 rounded-xl border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-blue-500 dark:hover:border-blue-400 hover:scale-110 transition-all duration-300 hover:shadow-md cursor-pointer"
                  title="Sign in with Facebook"
                >
                  <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">f</span>
                </button>
                <button 
                  onClick={async () => {
                    try {
                      await loginWithGitHub();
                      router.push('/dashboard');
                    } catch (err: any) {
                      if (err.code !== 'auth/popup-closed-by-user') {
                        setError(err.message || 'GitHub sign-in failed');
                        setShowError(true);
                        setTimeout(() => setShowError(false), 500);
                      }
                    }
                  }}
                  className="w-16 h-16 rounded-xl border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-gray-800 dark:hover:border-gray-300 hover:scale-110 transition-all duration-300 hover:shadow-md cursor-pointer"
                  title="Sign in with GitHub"
                >
                  <svg className="w-7 h-7 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </button>
                <button
                  onClick={() => setIsPhoneAuthOpen(true)}
                  className="w-16 h-16 rounded-xl border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-primary-500 dark:hover:border-primary-400 hover:scale-110 transition-all duration-300 hover:shadow-md cursor-pointer"
                  title="Sign in with Phone"
                >
                  <svg className="w-7 h-7 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
              </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">or use your email password</p>

                <form onSubmit={handleSignIn} className="space-y-4">
                {error && mode === 'signin' && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${showError && mode === 'signin' ? 'input-error' : ''}`}
                    placeholder="Email"
                  />
                </div>

                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={`w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${showError && mode === 'signin' ? 'input-error' : ''}`}
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Forget Your Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-2xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed glow-hover disabled:hover:shadow-none"
                >
                  {loading ? 'Signing in...' : 'SIGN IN'}
                </button>
              </form>
              </div>
            </div>
          </div>

          {/* Welcome Panel (Right side when signin) */}
          <div
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              mode === 'signin'
                ? 'translate-x-0 opacity-100'
                : 'translate-x-[100%] opacity-0 pointer-events-none'
            }`}
            style={{
              width: mode === 'signin' ? '55%' : '45%',
              left: mode === 'signin' ? '45%' : '55%',
            }}
          >
            <div className="h-full bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700 flex flex-col justify-center items-center px-12 py-16 text-white relative overflow-hidden">
              {/* Large curved corner decoration */}
              <div className="absolute top-0 left-0 w-64 h-64 bg-white dark:bg-gray-800 transform transition-all duration-1000 z-0" 
                style={{
                  clipPath: 'ellipse(60% 60% at 0% 0%)',
                  transform: 'translate(-30%, -30%)',
                }}
              ></div>
              
              {/* Additional decorative blob */}
              <div className="absolute bottom-0 right-0 w-96 h-96 opacity-20 transition-all duration-1000 z-0" 
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                  transform: 'translate(20%, 20%)',
                }}
              ></div>
              
              {/* Wave decoration */}
              <div className="absolute left-0 top-1/2 w-full h-32 -translate-y-1/2 transition-all duration-1000 z-0">
                <svg className="h-full w-full" viewBox="0 0 200 100" preserveAspectRatio="none">
                  <path
                    d="M 0 50 Q 25 20 50 50 T 100 50 T 150 50 T 200 50 L 200 100 L 0 100 Z"
                    fill="rgba(255,255,255,0.1)"
                  />
                </svg>
              </div>
              
              <div className="relative z-20 text-center">
                <h2 className="text-4xl font-bold mb-4 font-science-gothic">Welcome Back!</h2>
                <p className="text-blue-100 mb-8 text-lg">
                  Enter your personal details to use all of site features
                </p>
                <button
                  onClick={toggleMode}
                  className="px-8 py-3 border-2 border-white rounded-2xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300 hover:scale-105 glow-hover-white"
                >
                  SIGN UP
                </button>
              </div>
            </div>
          </div>

          {/* Sign Up Form Panel */}
          <div
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              mode === 'signup'
                ? 'translate-x-0 opacity-100 z-10'
                : 'translate-x-[100%] opacity-0 z-0 pointer-events-none'
            }`}
            style={{
              width: mode === 'signup' ? '55%' : '45%',
              left: mode === 'signup' ? '45%' : '55%',
            }}
          >
            <div className="h-full flex flex-col justify-center px-12 py-16 bg-white dark:bg-gray-800 relative overflow-hidden">
              {/* Curved divider on the left */}
              <div className={`absolute left-0 top-0 bottom-0 w-20 transition-all duration-1000 ease-in-out z-0 ${
                mode === 'signup' ? 'opacity-100' : 'opacity-0'
              }`}>
                <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path
                    d={`M 100 0 Q 50 20 50 50 T 100 100`}
                    fill="white"
                    className="dark:fill-gray-800"
                  />
                  <path
                    d={`M 100 0 Q 50 30 50 50 T 100 100`}
                    fill="white"
                    className="dark:fill-gray-800"
                    opacity="0.3"
                  />
                </svg>
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 font-science-gothic">Create Account</h2>
              
              {/* Social login buttons */}
              <div className="flex gap-4 mt-6 mb-4">
                <button 
                  onClick={async () => {
                    try {
                      await loginWithGoogle();
                      router.push('/dashboard');
                    } catch (err: any) {
                      if (err.code !== 'auth/popup-closed-by-user') {
                        setError(err.message || 'Google sign-in failed');
                        setShowError(true);
                        setTimeout(() => setShowError(false), 500);
                      }
                    }
                  }}
                  className="w-16 h-16 rounded-xl border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-red-500 dark:hover:border-red-400 hover:scale-110 transition-all duration-300 hover:shadow-md cursor-pointer"
                  title="Sign up with Google"
                >
                  <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">G</span>
                </button>
                <button 
                  onClick={async () => {
                    try {
                      await loginWithFacebook();
                      router.push('/dashboard');
                    } catch (err: any) {
                      if (err.code !== 'auth/popup-closed-by-user') {
                        setError(err.message || 'Facebook sign-in failed');
                        setShowError(true);
                        setTimeout(() => setShowError(false), 500);
                      }
                    }
                  }}
                  className="w-16 h-16 rounded-xl border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-blue-500 dark:hover:border-blue-400 hover:scale-110 transition-all duration-300 hover:shadow-md cursor-pointer"
                  title="Sign up with Facebook"
                >
                  <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">f</span>
                </button>
                <button 
                  onClick={async () => {
                    try {
                      await loginWithGitHub();
                      router.push('/dashboard');
                    } catch (err: any) {
                      if (err.code !== 'auth/popup-closed-by-user') {
                        setError(err.message || 'GitHub sign-in failed');
                        setShowError(true);
                        setTimeout(() => setShowError(false), 500);
                      }
                    }
                  }}
                  className="w-16 h-16 rounded-xl border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-gray-800 dark:hover:border-gray-300 hover:scale-110 transition-all duration-300 hover:shadow-md cursor-pointer"
                  title="Sign up with GitHub"
                >
                  <svg className="w-7 h-7 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </button>
                <button
                  onClick={() => setIsPhoneAuthOpen(true)}
                  className="w-16 h-16 rounded-xl border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-primary-500 dark:hover:border-primary-400 hover:scale-110 transition-all duration-300 hover:shadow-md cursor-pointer"
                  title="Sign up with Phone"
                >
                  <svg className="w-7 h-7 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
              </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">or use your email for registeration</p>

                <form onSubmit={handleSignUp} className="space-y-4">
                {error && mode === 'signup' && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${showError && mode === 'signup' ? 'input-error' : ''}`}
                    placeholder="Username"
                  />
                </div>

                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${showError && mode === 'signup' ? 'input-error' : ''}`}
                    placeholder="Email"
                  />
                </div>

                <div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={`w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${showError && mode === 'signup' ? 'input-error' : ''}`}
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-2xl transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed glow-hover disabled:hover:shadow-none"
                >
                  {loading ? 'Creating account...' : 'SIGN UP'}
                </button>
              </form>
              </div>
            </div>
          </div>

          {/* Welcome Panel (Left side when signup) */}
          <div
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              mode === 'signup'
                ? 'translate-x-0 opacity-100'
                : 'translate-x-[-100%] opacity-0 pointer-events-none'
            }`}
            style={{
              width: mode === 'signup' ? '45%' : '55%',
            }}
          >
            <div className="h-full bg-gradient-to-br from-blue-500 via-blue-600 to-purple-700 flex flex-col justify-center items-center px-12 py-16 text-white relative overflow-hidden">
              {/* Large curved corner decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white dark:bg-gray-800 transform transition-all duration-1000 z-0" 
                style={{
                  clipPath: 'ellipse(60% 60% at 100% 0%)',
                  transform: 'translate(30%, -30%)',
                }}
              ></div>
              
              {/* Additional decorative blob */}
              <div className="absolute bottom-0 left-0 w-96 h-96 opacity-20 transition-all duration-1000 z-0" 
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                  transform: 'translate(-20%, 20%)',
                }}
              ></div>
              
              {/* Wave decoration */}
              <div className="absolute right-0 top-1/2 w-full h-32 -translate-y-1/2 transition-all duration-1000 z-0">
                <svg className="h-full w-full" viewBox="0 0 200 100" preserveAspectRatio="none">
                  <path
                    d="M 200 50 Q 175 20 150 50 T 100 50 T 50 50 T 0 50 L 0 100 L 200 100 Z"
                    fill="rgba(255,255,255,0.1)"
                  />
                </svg>
              </div>
              
              <div className="relative z-20 text-center">
                <h2 className="text-4xl font-bold mb-4 font-science-gothic">Hello, Friend!</h2>
                <p className="text-blue-100 mb-8 text-lg">
                  Register with your personal details to use all of site features
                </p>
                <button
                  onClick={toggleMode}
                  className="px-8 py-3 border-2 border-white rounded-2xl font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300 hover:scale-105 glow-hover-white"
                >
                  SIGN IN
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <PhoneAuth
      isOpen={isPhoneAuthOpen}
      onClose={() => setIsPhoneAuthOpen(false)}
      onSuccess={() => {
        router.push('/dashboard');
      }}
    />
    <ForgotPasswordModal
      isOpen={isForgotPasswordOpen}
      onClose={() => setIsForgotPasswordOpen(false)}
      onSuccess={() => {
        // Optionally show success message or redirect
      }}
    />
    </>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    }>
      <AuthPageContent />
    </Suspense>
  );
}

