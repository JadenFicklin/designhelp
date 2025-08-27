// Utility functions for theme management

export const getBackgroundThemeStyles = (backgroundTheme) => {
  switch (backgroundTheme) {
    case 'dark':
      return {
        pageBg: 'bg-gray-900',
        navBg: 'bg-gray-800',
        navBorder: 'border-gray-700',
        navText: 'text-gray-100',
        navHover: 'hover:text-blue-400',
        contentBg: 'bg-gray-800',
        cardBg: 'bg-gray-700',
        cardBorder: 'border-gray-600',
        textPrimary: 'text-gray-100',
        textSecondary: 'text-gray-300',
        textMuted: 'text-gray-400'
      };
    case 'nature':
      return {
        pageBg: 'bg-gradient-to-br from-green-50 to-emerald-100',
        navBg: 'bg-green-700',
        navBorder: 'border-green-600',
        navText: 'text-white',
        navHover: 'hover:text-green-200',
        contentBg: 'bg-green-50',
        cardBg: 'bg-white',
        cardBorder: 'border-green-200',
        textPrimary: 'text-green-900',
        textSecondary: 'text-green-700',
        textMuted: 'text-green-600'
      };
    case 'space':
      return {
        pageBg: 'bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900',
        navBg: 'bg-indigo-800',
        navBorder: 'border-indigo-700',
        navText: 'text-white',
        navHover: 'hover:text-indigo-200',
        contentBg: 'bg-indigo-900',
        cardBg: 'bg-indigo-800',
        cardBorder: 'border-indigo-600',
        textPrimary: 'text-indigo-100',
        textSecondary: 'text-indigo-200',
        textMuted: 'text-indigo-300'
      };
    case 'ocean':
      return {
        pageBg: 'bg-gradient-to-br from-blue-50 to-cyan-100',
        navBg: 'bg-blue-600',
        navBorder: 'border-blue-500',
        navText: 'text-white',
        navHover: 'hover:text-blue-200',
        contentBg: 'bg-blue-50',
        cardBg: 'bg-white',
        cardBorder: 'border-blue-200',
        textPrimary: 'text-blue-900',
        textSecondary: 'text-blue-700',
        textMuted: 'text-blue-600'
      };
    case 'sunset':
      return {
        pageBg: 'bg-gradient-to-br from-orange-50 via-red-50 to-pink-50',
        navBg: 'bg-orange-600',
        navBorder: 'border-orange-500',
        navText: 'text-white',
        navHover: 'hover:text-orange-200',
        contentBg: 'bg-orange-50',
        cardBg: 'bg-white',
        cardBorder: 'border-orange-200',
        textPrimary: 'text-orange-900',
        textSecondary: 'text-orange-700',
        textMuted: 'text-orange-600'
      };
    case 'cyberpunk':
      return {
        pageBg: 'bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900',
        navBg: 'bg-purple-800',
        navBorder: 'border-purple-700',
        navText: 'text-white',
        navHover: 'hover:text-purple-200',
        contentBg: 'bg-purple-900',
        cardBg: 'bg-purple-800',
        cardBorder: 'border-purple-600',
        textPrimary: 'text-purple-100',
        textSecondary: 'text-purple-200',
        textMuted: 'text-purple-300'
      };
    case 'candy':
      return {
        pageBg: 'bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50',
        navBg: 'bg-pink-500',
        navBorder: 'border-pink-400',
        navText: 'text-white',
        navHover: 'hover:text-pink-200',
        contentBg: 'bg-pink-50',
        cardBg: 'bg-white',
        cardBorder: 'border-pink-200',
        textPrimary: 'text-pink-900',
        textSecondary: 'text-pink-700',
        textMuted: 'text-pink-600'
      };
    default: // standard
      return {
        pageBg: 'bg-gray-50',
        navBg: 'bg-white',
        navBorder: 'border-gray-200',
        navText: 'text-gray-900',
        navHover: 'hover:text-blue-600',
        contentBg: 'bg-gray-50',
        cardBg: 'bg-white',
        cardBorder: 'border-gray-200',
        textPrimary: 'text-gray-900',
        textSecondary: 'text-gray-700',
        textMuted: 'text-gray-600'
      };
  }
};

export const getBackgroundThemeName = (backgroundTheme) => {
  const names = {
    standard: 'Standard',
    dark: 'Dark',
    nature: 'Nature',
    space: 'Space',
    ocean: 'Ocean',
    sunset: 'Sunset',
    cyberpunk: 'Cyberpunk',
    candy: 'Candy'
  };
  return names[backgroundTheme] || 'Standard';
};
