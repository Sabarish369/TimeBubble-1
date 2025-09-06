'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';

interface PremiumThemeContextType {
  isPremium: boolean;
  premiumFeatures: {
    advancedColors: boolean;
    customThemes: boolean;
    aiInsights: boolean;
    habitStacking: boolean;
    energyTracking: boolean;
  };
}

const PremiumThemeContext = createContext<PremiumThemeContextType>({
  isPremium: false,
  premiumFeatures: {
    advancedColors: false,
    customThemes: false,
    aiInsights: false,
    habitStacking: false,
    energyTracking: false,
  },
});

export const usePremiumTheme = () => {
  const context = useContext(PremiumThemeContext);
  if (!context) {
    throw new Error('usePremiumTheme must be used within a PremiumThemeProvider');
  }
  return context;
};

interface PremiumThemeProviderProps {
  children: React.ReactNode;
}

export function PremiumThemeProvider({ children }: PremiumThemeProviderProps) {
  const { isPro } = useAuth();
  const [premiumFeatures, setPremiumFeatures] = useState({
    advancedColors: false,
    customThemes: false,
    aiInsights: false,
    habitStacking: false,
    energyTracking: false,
  });

  useEffect(() => {
    if (isPro) {
      setPremiumFeatures({
        advancedColors: true,
        customThemes: true,
        aiInsights: true,
        habitStacking: true,
        energyTracking: true,
      });
    } else {
      setPremiumFeatures({
        advancedColors: false,
        customThemes: false,
        aiInsights: false,
        habitStacking: false,
        energyTracking: false,
      });
    }
  }, [isPro]);

  const value: PremiumThemeContextType = {
    isPremium: isPro,
    premiumFeatures,
  };

  return (
    <PremiumThemeContext.Provider value={value}>
      {children}
    </PremiumThemeContext.Provider>
  );
}
