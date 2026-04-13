'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Lock, 
  Shield, 
  Key, 
  Zap, 
  Globe,
  Sparkles
} from 'lucide-react';

interface FeatureCard {
  id: number;
  icon: React.ElementType;
  title: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
}

const features: FeatureCard[] = [
  {
    id: 1,
    icon: Lock,
    title: 'Zero-Knowledge Encryption',
    description: 'Your master password never leaves your device. All encryption happens client-side for maximum security.',
    gradientFrom: '#3b82f6',
    gradientTo: '#06b6d4',
  },
  {
    id: 2,
    icon: Shield,
    title: 'AES-256 Security',
    description: 'Military-grade encryption ensures your passwords are protected with industry-standard security protocols.',
    gradientFrom: '#a855f7',
    gradientTo: '#ec4899',
  },
  {
    id: 3,
    icon: Key,
    title: 'Smart Password Generator',
    description: 'Create strong, unique passwords with customizable options. Generate secure passwords instantly.',
    gradientFrom: '#10b981',
    gradientTo: '#059669',
  },
  {
    id: 4,
    icon: Zap,
    title: 'Password Health Dashboard',
    description: 'Monitor your password strength, identify weak passwords, and get security recommendations.',
    gradientFrom: '#f97316',
    gradientTo: '#ef4444',
  },
  {
    id: 5,
    icon: Globe,
    title: 'Multi-Platform Support',
    description: 'Store website logins, credit cards, and secure notes. Organize everything in one secure vault.',
    gradientFrom: '#6366f1',
    gradientTo: '#a855f7',
  },
  {
    id: 6,
    icon: Sparkles,
    title: 'Advanced Features',
    description: 'Custom tags, categories, search functionality, and secure sharing options for your credentials.',
    gradientFrom: '#ec4899',
    gradientTo: '#f43f5e',
  },
];

export default function FeatureCarousel() {
  // Start at the beginning of the second set for seamless infinite scroll
  const [currentIndex, setCurrentIndex] = useState(features.length);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isResettingRef = useRef(false);

  // Duplicate items for infinite scroll (3 sets)
  const duplicatedFeatures = [...features, ...features, ...features];

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        // When reaching the end of the second set, reset to start of second set
        if (next >= features.length * 2) {
          return features.length;
        }
        return next;
      });
    }, 2500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused]);

  useEffect(() => {
    if (!carouselRef.current) return;

    const cardWidth = 320 + 24; // card width (320px) + gap (24px)
    const targetPosition = currentIndex * cardWidth;
    
    // Check if we need to reset (when at the end of second set)
    if (currentIndex === features.length * 2 && !isResettingRef.current) {
      // Mark that we're resetting to prevent loops
      isResettingRef.current = true;
      // Instantly reset without transition
      carouselRef.current.style.transition = 'none';
      carouselRef.current.style.transform = `translateX(-${features.length * cardWidth}px)`;
      // Immediately update state to reset position
      requestAnimationFrame(() => {
        setCurrentIndex(features.length);
        setIsTransitioning(true);
        isResettingRef.current = false;
      });
    } else if (!isResettingRef.current) {
      // Normal transition
      carouselRef.current.style.transition = isTransitioning 
        ? 'transform 1500ms ease-in-out' 
        : 'none';
      carouselRef.current.style.transform = `translateX(-${targetPosition}px)`;
    }
  }, [currentIndex, isTransitioning]);

  const handleCardClick = (index: number) => {
    // Normalize index to the second set (for seamless infinite scroll)
    const normalizedIndex = (index % features.length) + features.length;
    setCurrentIndex(normalizedIndex);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000); // Resume after 5 seconds
  };

  const goToSlide = (index: number) => {
    // Normalize index to the second set (for seamless infinite scroll)
    const normalizedIndex = index + features.length;
    setCurrentIndex(normalizedIndex);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 5000);
  };

  return (
    <div className="relative w-full overflow-hidden py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 font-science-gothic">
          Features
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Discover what makes PassX secure and powerful
        </p>
      </div>

      <div 
        className="relative h-[300px] overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Gradient fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white dark:from-gray-900 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white dark:from-gray-900 to-transparent z-10 pointer-events-none"></div>
        
        <div
          ref={carouselRef}
          className="flex gap-6"
          style={{
            width: `${duplicatedFeatures.length * 344}px`,
          }}
        >
          {duplicatedFeatures.map((feature, index) => {
            const Icon = feature.icon;
            const normalizedIndex = index % features.length;
            const isActive = Math.abs(index - currentIndex) <= 1;
            
            return (
              <div
                key={`${feature.id}-${index}`}
                className={`flex-shrink-0 w-80 h-[300px] group cursor-pointer transition-all duration-500 ${
                  isActive
                    ? 'opacity-100 scale-100'
                    : 'opacity-50 scale-95'
                }`}
                onClick={() => handleCardClick(index)}
              >
                <div 
                  className="h-[300px] rounded-2xl p-[2px] transition-all duration-300 group-hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${feature.gradientFrom}, ${feature.gradientTo})`,
                  }}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-2xl h-full p-6 flex flex-col transition-all duration-300 group-hover:shadow-2xl overflow-hidden">
                    {/* Icon - Fixed height: 56px + 16px margin = 72px */}
                    <div 
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                      style={{
                        background: `linear-gradient(135deg, ${feature.gradientFrom}, ${feature.gradientTo})`,
                      }}
                    >
                      <Icon className="w-7 h-7 text-white flex-shrink-0" />
                    </div>
                    
                    {/* Title - Fixed height: 2 lines max, ~56px + 12px margin = 68px */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 font-science-gothic group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 min-h-[56px] flex-shrink-0">
                      {feature.title}
                    </h3>
                    
                    {/* Description - Fixed height: 4 lines, ~88px + 16px margin = 104px */}
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-4 mb-4 flex-shrink-0 min-h-[88px]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="flex justify-center gap-2 mt-6">
        {features.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all duration-300 hover:scale-125 ${
              (currentIndex % features.length) === index
                ? 'w-8 bg-primary-600 dark:bg-primary-400'
                : 'w-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

