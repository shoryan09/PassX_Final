'use client';

import { useState, useEffect } from 'react';
import { generatePassword, PasswordGeneratorOptions } from '@passx/shared';
import { Copy, X, Check, RefreshCw, Shield, Zap, Lock } from 'lucide-react';

interface PasswordGeneratorProps {
  onClose: () => void;
  onUsePassword?: (password: string) => void;
}

export default function PasswordGenerator({ onClose, onUsePassword }: PasswordGeneratorProps) {
  const [options, setOptions] = useState<PasswordGeneratorOptions>({
    length: 12,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    avoidSimilar: false,
    avoidAmbiguous: false,
  });
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [strength, setStrength] = useState(0);

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setStrength(0);
      return;
    }

    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    if (password.length >= 20) score += 1;

    setStrength(Math.min(score, 8));
  }, [password]);

  const generate = () => {
    setIsGenerating(true);
    try {
      setTimeout(() => {
        const newPassword = generatePassword(options);
        setPassword(newPassword);
        setCopied(false);
        setIsGenerating(false);
      }, 300);
    } catch (err) {
      alert('Error generating password. Please select at least one character type.');
      setIsGenerating(false);
    }
  };

  // Auto-generate on mount and when options change
  useEffect(() => {
    generate();
  }, []);

  const copyPassword = () => {
    if (password) {
      navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const usePassword = () => {
    if (password && onUsePassword) {
      onUsePassword(password);
      onClose();
    }
  };

  const getStrengthColor = () => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 4) return 'bg-orange-500';
    if (strength <= 6) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (strength <= 2) return 'Weak';
    if (strength <= 4) return 'Fair';
    if (strength <= 6) return 'Good';
    return 'Strong';
  };

  const activeOptionsCount = [
    options.includeUppercase,
    options.includeLowercase,
    options.includeNumbers,
    options.includeSymbols,
  ].filter(Boolean).length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full relative overflow-hidden border border-gray-200 dark:border-gray-700 animate-slide-up">
        {/* Decorative gradient background */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-science-gothic">
                Password Generator
              </h2>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Create a strong, secure password
            </p>
          </div>

          {/* Generated Password Display */}
          <div className="mb-6">
            <div className="relative group">
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-600 transition-all duration-300 hover:border-primary-400 dark:hover:border-primary-500">
                <input
                  type="text"
                  value={isGenerating ? 'Generating...' : password}
                  readOnly
                  className="flex-1 font-mono text-lg bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400"
                  placeholder="Click generate to create a password"
                />
                <button
                  onClick={copyPassword}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    copied
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : 'bg-white dark:bg-gray-600 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                  }`}
                  title="Copy password"
                >
                  {copied ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={generate}
                  disabled={isGenerating || activeOptionsCount === 0}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isGenerating
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-600 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                  }`}
                  title="Generate new password"
                >
                  <RefreshCw className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Strength Indicator */}
            {password && (
              <div className="mt-4 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Password Strength
                  </span>
                  <span className={`text-sm font-semibold ${getStrengthColor().replace('bg-', 'text-')}`}>
                    {getStrengthLabel()}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getStrengthColor()} transition-all duration-500 ease-out rounded-full`}
                    style={{ width: `${(strength / 8) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Length Slider */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Password Length
              </label>
              <span className="text-2xl font-bold text-primary-600 dark:text-primary-400 font-mono">
                {options.length}
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              value={options.length}
              onChange={(e) => {
                setOptions({ ...options, length: parseInt(e.target.value) });
                generate();
              }}
              className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>5</span>
              <span>25</span>
            </div>
          </div>

          {/* Character Options */}
          <div className="space-y-3 mb-6">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4" />
              Character Types
            </label>

            {[
              { key: 'includeUppercase', label: 'Uppercase Letters', desc: 'A-Z' },
              { key: 'includeLowercase', label: 'Lowercase Letters', desc: 'a-z' },
              { key: 'includeNumbers', label: 'Numbers', desc: '0-9' },
              { key: 'includeSymbols', label: 'Symbols', desc: '!@#$%...' },
            ].map((option) => (
              <div
                key={option.key}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer group"
                onClick={() => {
                  setOptions({
                    ...options,
                    [option.key]: !options[option.key as keyof PasswordGeneratorOptions],
                  });
                  setTimeout(() => generate(), 100);
                }}
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{option.desc}</div>
                </div>
                <div
                  className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                    options[option.key as keyof PasswordGeneratorOptions]
                      ? 'bg-primary-600 dark:bg-primary-500'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${
                      options[option.key as keyof PasswordGeneratorOptions]
                        ? 'translate-x-6'
                        : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            ))}

            {/* Advanced Options */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {[
                { key: 'avoidSimilar', label: 'Avoid Similar Characters', desc: 'i, l, 1, L, o, 0, O' },
                { key: 'avoidAmbiguous', label: 'Avoid Ambiguous Symbols', desc: '{ } [ ] ( ) / \\ \' " ` ~' },
              ].map((option) => (
                <div
                  key={option.key}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer mb-2"
                  onClick={() => {
                    setOptions({
                      ...options,
                      [option.key]: !options[option.key as keyof PasswordGeneratorOptions],
                    });
                    setTimeout(() => generate(), 100);
                  }}
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{option.desc}</div>
                  </div>
                  <div
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                      options[option.key as keyof PasswordGeneratorOptions]
                        ? 'bg-primary-600 dark:bg-primary-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${
                        options[option.key as keyof PasswordGeneratorOptions]
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={generate}
              disabled={isGenerating || activeOptionsCount === 0}
              className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.02]"
            >
              <RefreshCw className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Generating...' : 'Generate New'}
            </button>
            {onUsePassword && password && (
              <button
                onClick={usePassword}
                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
              >
                Use Password
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
