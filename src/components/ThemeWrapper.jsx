import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getBackgroundThemeStyles } from '../utils/themeUtils';

const ThemeWrapper = ({ children }) => {
  const { userBackgroundTheme } = useAuth();
  const themeStyles = getBackgroundThemeStyles(userBackgroundTheme);

  return (
    <div className={`min-h-screen ${themeStyles.pageBg}`}>
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${themeStyles.contentBg}`}>
        {children}
      </div>
    </div>
  );
};

export default ThemeWrapper;
