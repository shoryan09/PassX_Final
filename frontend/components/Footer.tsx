'use client';

import { Mail, Github, Linkedin, ExternalLink } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: 'Gmail',
      icon: Mail,
      href: 'mailto:royshoryan01209@gmail.com',
      color: 'hover:bg-red-500 hover:text-white dark:hover:bg-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      href: 'https://www.linkedin.com/in/shoryanroy/',
      color: 'hover:bg-blue-600 hover:text-white dark:hover:bg-blue-700',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    },
    {
      name: 'GitHub',
      icon: Github,
      href: 'https://github.com/shoryan09',
      color: 'hover:bg-gray-800 hover:text-white dark:hover:bg-gray-700',
      bgColor: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    },
  ];

  return (
    <footer className="relative mt-auto border-t border-gray-200 dark:border-gray-700 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 transition-colors">
      {/* Decorative gradient line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-50"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Left Section - Project Info */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-gray-900 dark:text-white font-science-gothic">
              PassX: Password Manager
            </h3>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Created by{' '}
                <span className="text-primary-600 dark:text-primary-400 font-science-gothic">
                  Shoryan Roy
                </span>
              </p>
            </div>
          </div>

          {/* Right Section - Contact & Social */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-gray-900 dark:text-white font-science-gothic">
              Get in Touch
            </h3>
            
            {/* Social Links */}
            <div className="flex flex-wrap gap-2">
              {socialLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.name}
                    href={link.href}
                    target={link.href.startsWith('http') ? '_blank' : '_self'}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className={`
                      group relative flex items-center gap-2 px-3 py-2 rounded-lg
                      ${link.bgColor}
                      ${link.color}
                      border border-gray-200 dark:border-gray-700
                      transition-all duration-300 ease-in-out
                      hover:scale-105 hover:shadow-lg hover:border-transparent
                      active:scale-95
                    `}
                  >
                    <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                    <span className="text-sm font-medium">{link.name}</span>
                    {link.href.startsWith('http') && (
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                    
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-400/0 via-primary-400/20 to-primary-400/0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300 -z-10"></div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">
              © {currentYear} PassX. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Made with</span>
              <span className="text-red-500 animate-pulse">♥</span>
              <span>by Shoryan Roy</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

