'use client';

import { useTheme } from '@/contexts/ThemeContext';

export default function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="relative w-20 h-10 rounded-full p-1 transition-all duration-700 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 overflow-hidden"
      aria-label="Toggle dark mode"
      style={{
        background: isDark
          ? 'linear-gradient(90deg, #0f172a 0%, #1e293b 20%, #334155 40%, #475569 60%, #64748b 80%, #94a3b8 100%)'
          : 'linear-gradient(90deg, #fbbf24 0%, #fcd34d 15%, #60a5fa 35%, #93c5fd 55%, #dbeafe 75%, #eff6ff 100%)',
        boxShadow: isDark 
          ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
          : '0 4px 12px rgba(251, 191, 36, 0.3)',
      }}
    >
      {/* Background gradient overlay for smooth transition */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: isDark
            ? 'radial-gradient(circle at 20% 50%, rgba(148, 163, 184, 0.1) 0%, transparent 50%)'
            : 'radial-gradient(circle at 80% 50%, rgba(251, 191, 36, 0.2) 0%, transparent 50%)',
          opacity: 1,
        }}
      />

      {/* Toggle thumb */}
      <div
        className={`absolute top-1 w-8 h-8 rounded-full transition-all duration-700 ease-in-out flex items-center justify-center ${
          isDark ? 'translate-x-10' : 'translate-x-0'
        }`}
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%)'
            : 'linear-gradient(135deg, #fef3c7 0%, #fbbf24 50%, #f59e0b 100%)',
          boxShadow: isDark
            ? '0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
            : '0 2px 8px rgba(251, 191, 36, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        }}
      >
        {/* Sun icon for light mode */}
        {!isDark && (
          <svg
            className="w-5 h-5 text-yellow-600 transition-all duration-500"
            fill="currentColor"
            viewBox="0 0 24 24"
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(251, 191, 36, 0.5))',
            }}
          >
            <circle cx="12" cy="12" r="5" />
            <path d="M12 1v4M12 19v4M1 12h4M19 12h4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
        
        {/* Moon icon for dark mode */}
        {isDark && (
          <svg
            className="w-5 h-5 text-slate-200 transition-all duration-500"
            fill="currentColor"
            viewBox="0 0 24 24"
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(148, 163, 184, 0.5))',
            }}
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </div>

      {/* Stars for dark mode */}
      <div className="absolute inset-0">
        {[
          { top: '12%', left: '8%', delay: '0s', size: 'w-1 h-1' },
          { top: '25%', left: '15%', delay: '0.1s', size: 'w-0.5 h-0.5' },
          { top: '8%', left: '22%', delay: '0.2s', size: 'w-1 h-1' },
          { top: '30%', left: '12%', delay: '0.15s', size: 'w-0.5 h-0.5' },
          { top: '18%', left: '18%', delay: '0.25s', size: 'w-1 h-1' },
        ].map((star, index) => (
          <div
            key={index}
            className={`absolute ${star.size} bg-white rounded-full transition-all duration-700 ${
              isDark ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
            }`}
            style={{
              top: star.top,
              left: star.left,
              transitionDelay: star.delay,
              boxShadow: isDark ? '0 0 2px rgba(255, 255, 255, 0.8)' : 'none',
            }}
          />
        ))}
      </div>

      {/* Clouds for light mode */}
      <div className="absolute inset-0">
        {/* Cloud 1 */}
        <div
          className={`absolute top-3 right-4 transition-all duration-700 ${
            !isDark ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
          style={{ transitionDelay: '0.1s' }}
        >
          <div className="w-4 h-2.5 bg-white/90 rounded-full" />
          <div className="absolute -left-1 top-1 w-3 h-2 bg-white/90 rounded-full" />
          <div className="absolute -right-1 top-1 w-2.5 h-2 bg-white/90 rounded-full" />
        </div>
        
        {/* Cloud 2 */}
        <div
          className={`absolute top-5 right-8 transition-all duration-700 ${
            !isDark ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
          style={{ transitionDelay: '0.2s' }}
        >
          <div className="w-3 h-2 bg-white/80 rounded-full" />
          <div className="absolute -left-0.5 top-0.5 w-2 h-1.5 bg-white/80 rounded-full" />
          <div className="absolute -right-0.5 top-0.5 w-2 h-1.5 bg-white/80 rounded-full" />
        </div>
        
        {/* Cloud 3 */}
        <div
          className={`absolute top-2 right-6 transition-all duration-700 ${
            !isDark ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
          style={{ transitionDelay: '0.15s' }}
        >
          <div className="w-3.5 h-2 bg-white/85 rounded-full" />
          <div className="absolute -left-1 top-0.5 w-2.5 h-1.5 bg-white/85 rounded-full" />
        </div>
      </div>
    </button>
  );
}


