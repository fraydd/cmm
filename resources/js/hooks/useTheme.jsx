import { useMemo, useState, useEffect } from 'react';
import { generateAntDesignTokens, onThemeChange, getCurrentTheme } from '../utils/themeManager';

export function useTheme() {
  const [currentThemeName, setCurrentThemeName] = useState(getCurrentTheme());

  // Suscribirse a cambios de tema
  useEffect(() => {
    const unsubscribe = onThemeChange((themeName) => {
      setCurrentThemeName(themeName);
    });

    return unsubscribe;
  }, []);

  // Generar tokens de Ant Design basados en el tema actual
  const theme = useMemo(() => {
    return generateAntDesignTokens(currentThemeName);
  }, [currentThemeName]);

  return theme;
} 