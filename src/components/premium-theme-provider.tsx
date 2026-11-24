'use client';

import React, { createContext, useContext } from 'react';

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
  isPremium: true,
  premiumFeatures: {
    advancedColors: true,
    customThemes: true,
    aiInsights: true,
    habitStacking: true,
    energyTracking: true,
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
  const value: PremiumThemeContextType = {
    isPremium: true,
    premiumFeatures: {
      advancedColors: true,
      customThemes: true,
      aiInsights: true,
      habitStacking: true,
      energyTracking: true,
    },
  };

  return (
    <PremiumThemeContext.Provider value={value}>
      {children}
    </PremiumThemeContext.Provider>
  );
}
