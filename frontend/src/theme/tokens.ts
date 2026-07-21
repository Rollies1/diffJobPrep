export type ThemeMode = 'midnight' | 'oled' | 'daylight';

export interface ThemeTokens {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceOverlay: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
  };
  border: string;
  borderStrong: string;
  premium: {
    gold: string;
    purple: string;
    rose: string;
    gradient: readonly string[];
    glow: string;
    glowGold: string;
  };
  semantic: {
    success: string;
    error: string;
    warning: string;
    info: string;
  };
  glass: {
    background: string;
    backgroundStrong: string;
    blur: number;
    tint: 'dark' | 'light';
  };
  shadows: {
    card: object;
    premiumGlow: object;
  };
  isDark: boolean;
}

export const themes: Record<ThemeMode, ThemeTokens> = {
  midnight: {
    background: '#0B0B14',
    surface: '#13131F',
    surfaceElevated: '#1E1E2D',
    surfaceOverlay: 'rgba(255,255,255,0.03)',
    text: {
      primary: '#F0F0F5',
      secondary: '#8E8EA0',
      muted: '#5C5C73',
      inverse: '#0B0B14',
    },
    border: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.15)',
    premium: {
      gold: '#F2C94C',
      purple: '#8B5CF6',
      rose: '#F43F5E',
      gradient: ['#F2C94C', '#F59E0B', '#8B5CF6'],
      glow: 'rgba(139,92,246,0.25)',
      glowGold: 'rgba(242,201,76,0.15)',
    },
    semantic: {
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#3B82F6',
    },
    glass: {
      background: 'rgba(255,255,255,0.04)',
      backgroundStrong: 'rgba(255,255,255,0.08)',
      blur: 24,
      tint: 'dark',
    },
    shadows: {
      card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
      },
      premiumGlow: {
        shadowColor: '#8B5CF6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 12,
      },
    },
    isDark: true,
  },

  oled: {
    background: '#000000',
    surface: '#0A0A0A',
    surfaceElevated: '#141414',
    surfaceOverlay: 'rgba(255,255,255,0.02)',
    text: {
      primary: '#E8E8ED',
      secondary: '#8A8A9A',
      muted: '#555566',
      inverse: '#000000',
    },
    border: 'rgba(255,255,255,0.06)',
    borderStrong: 'rgba(255,255,255,0.12)',
    premium: {
      gold: '#E5B80B',
      purple: '#A78BFA',
      rose: '#FB7185',
      gradient: ['#E5B80B', '#F59E0B', '#A78BFA'],
      glow: 'rgba(167,139,250,0.20)',
      glowGold: 'rgba(229,184,11,0.12)',
    },
    semantic: {
      success: '#34D399',
      error: '#FCA5A5',
      warning: '#FBBF24',
      info: '#60A5FA',
    },
    glass: {
      background: 'rgba(255,255,255,0.03)',
      backgroundStrong: 'rgba(255,255,255,0.06)',
      blur: 20,
      tint: 'dark',
    },
    shadows: {
      card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 10,
      },
      premiumGlow: {
        shadowColor: '#A78BFA',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 14,
      },
    },
    isDark: true,
  },

  daylight: {
    background: '#F5F5F7',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceOverlay: 'rgba(0,0,0,0.02)',
    text: {
      primary: '#1A1A2E',
      secondary: '#6B6B80',
      muted: '#A1A1B3',
      inverse: '#FFFFFF',
    },
    border: 'rgba(0,0,0,0.08)',
    borderStrong: 'rgba(0,0,0,0.15)',
    premium: {
      gold: '#B48A00',
      purple: '#7C3AED',
      rose: '#E11D48',
      gradient: ['#B48A00', '#D97706', '#7C3AED'],
      glow: 'rgba(124,58,237,0.15)',
      glowGold: 'rgba(180,138,0,0.10)',
    },
    semantic: {
      success: '#059669',
      error: '#DC2626',
      warning: '#D97706',
      info: '#2563EB',
    },
    glass: {
      background: 'rgba(245,245,247,0.85)',
      backgroundStrong: 'rgba(235,235,240,0.95)',
      blur: 24,
      tint: 'light',
    },
    shadows: {
      card: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 4,
      },
      premiumGlow: {
        shadowColor: '#7C3AED',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
      },
    },
    isDark: false,
  },
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const radii = {
  sm: 8, md: 12, lg: 16, xl: 24, pill: 9999,
};
