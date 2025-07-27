// Definición de temas
const themes = {
  light: {
    // Colores Base CMM (tema actual)
    '--cmm-primary-50': '#f8fafc',
    '--cmm-primary-100': '#f1f5f9',
    '--cmm-primary-200': '#e2e8f0',
    '--cmm-primary-300': '#cbd5e1',
    '--cmm-primary-400': '#94B4C1',
    '--cmm-primary-500': '#547792',
    '--cmm-primary-600': '#3d5a7a',
    '--cmm-primary-700': '#2d4a6a',
    '--cmm-primary-800': '#213448',
    '--cmm-primary-900': '#1a2a3a',
    '--cmm-accent': '#ECEFCA',
    '--cmm-success': '#16a34a',
    '--cmm-success-500': '#16a34a',
    '--cmm-warning': '#d97706',
    '--cmm-warning-500': '#d97706',
    '--cmm-error': '#dc2626',
    '--cmm-error-500': '#dc2626',
    '--cmm-info': '#3b82f6',
    '--cmm-info-500': '#3b82f6',
    '--cmm-bg-primary': '#f8fafc',
    '--cmm-bg-secondary': '#ffffff',
    '--cmm-bg-sidebar': '#1a2a3a',
    '--cmm-bg-header': '#ffffff',
    '--cmm-text-primary': '#213448',
    '--cmm-text-secondary': '#547792',
    '--cmm-text-placeholder': '#94B4C1', // Color más tenue para placeholders
    '--cmm-text-sidebar': '#ECEFCA',
    '--cmm-table-row': '#ffffff',
    '--cmm-table-hover': '#f1f5f9',
    '--cmm-table-header': '#e2e8f0',
    '--cmm-table-header-hover': '#cbd5e1',
    '--cmm-border-color': '#e2e8f0',
    '--cmm-border-input': '#7A94B3',
    '--cmm-shadow-color': 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    // Tema oscuro exclusivamente en escala de grises
    '--cmm-primary-50': '#fafafa',    // Muy claro - fondo principal
    '--cmm-primary-100': '#f5f5f5',   // Claro - fondo secundario
    '--cmm-primary-200': '#525252',   // Gris oscuro - bordes armoniosos
    '--cmm-primary-300': '#404040',   // Gris muy oscuro - separadores
    '--cmm-primary-400': '#a3a3a3',   // Medio claro
    '--cmm-primary-500': '#737373',   // Medio
    '--cmm-primary-600': '#525252',   // Medio oscuro
    '--cmm-primary-700': '#404040',   // Oscuro
    '--cmm-primary-800': '#262626',   // Muy oscuro
    '--cmm-primary-900': '#171717',   // Extremadamente oscuro
    '--cmm-accent': '#ffffff',        // Blanco puro para acentos
    '--cmm-success': '#22c55e',       // Verde (mantener para estados)
    '--cmm-success-500': '#22c55e',   // Verde (mantener para estados)
    '--cmm-warning': '#f59e0b',       // Naranja (mantener para estados)
    '--cmm-warning-500': '#f59e0b',   // Naranja (mantener para estados)
    '--cmm-error': '#ef4444',         // Rojo (mantener para estados)
    '--cmm-error-500': '#ef4444',     // Rojo (mantener para estados)
    '--cmm-info': '#3b82f6',          // Azul (mantener para estados)
    '--cmm-info-500': '#3b82f6',      // Azul (mantener para estados)
    '--cmm-bg-primary': '#171717',    // Fondo principal muy oscuro
    '--cmm-bg-secondary': '#262626',  // Fondo secundario oscuro
    '--cmm-bg-sidebar': '#171717',    // Sidebar muy oscuro
    '--cmm-bg-header': '#262626',     // Header oscuro
    '--cmm-text-primary': '#ffffff',  // Texto principal blanco
    '--cmm-text-secondary': '#d4d4d4', // Texto secundario gris claro
    '--cmm-text-placeholder': '#737373', // Color más tenue para placeholders en modo oscuro
    '--cmm-text-sidebar': '#ffffff',  // Texto sidebar blanco
    '--cmm-table-row': '#262626',     // Fila normal en modo oscuro
    '--cmm-table-hover': '#404040',   // Gris oscuro elegante para hover en modo oscuro
    '--cmm-table-header': '#171717',  // Header más oscuro que el fondo secundario
    '--cmm-table-header-hover': '#262626', // Hover del header en modo oscuro
    '--cmm-border-color': '#404040',  // Borde en modo oscuro
    '--cmm-border-input': '#525252',  // Borde más visible para inputs en modo oscuro
    '--cmm-shadow-color': 'rgba(0, 0, 0, 0.3)', // Sombra más intensa en modo oscuro
  },
  blue: {
    // Tema azul (nuevo tema)
    '--cmm-primary-50': '#eff6ff',
    '--cmm-primary-100': '#dbeafe',
    '--cmm-primary-200': '#bfdbfe',
    '--cmm-primary-300': '#93c5fd',
    '--cmm-primary-400': '#60a5fa',
    '--cmm-primary-500': '#3b82f6',
    '--cmm-primary-600': '#2563eb',
    '--cmm-primary-700': '#1d4ed8',
    '--cmm-primary-800': '#1e40af',
    '--cmm-primary-900': '#1e3a8a',
    '--cmm-accent': '#fef3c7',
    '--cmm-success': '#16a34a',
    '--cmm-success-500': '#16a34a',
    '--cmm-warning': '#d97706',
    '--cmm-warning-500': '#d97706',
    '--cmm-error': '#dc2626',
    '--cmm-error-500': '#dc2626',
    '--cmm-info': '#3b82f6',
    '--cmm-info-500': '#3b82f6',
    '--cmm-bg-primary': '#f8fafc',
    '--cmm-bg-secondary': '#ffffff',
    '--cmm-bg-sidebar': '#1e3a8a',
    '--cmm-bg-header': '#ffffff',
    '--cmm-text-primary': '#1e40af',
    '--cmm-text-secondary': '#3b82f6',
    '--cmm-text-placeholder': '#60a5fa', // Color más tenue para placeholders en tema azul
    '--cmm-text-sidebar': '#fef3c7',
    '--cmm-table-row': '#ffffff',
    '--cmm-table-hover': '#dbeafe',
    '--cmm-table-header': '#bfdbfe',
    '--cmm-table-header-hover': '#93c5fd',
    '--cmm-border-color': '#bfdbfe',
    '--cmm-border-input': '#93c5fd',  // Borde más visible para inputs en tema azul
    '--cmm-shadow-color': 'rgba(59, 130, 246, 0.1)',
  },
};

// Sistema de eventos para notificar cambios de tema
const themeChangeListeners = [];

// Función para suscribirse a cambios de tema
export function onThemeChange(callback) {
  themeChangeListeners.push(callback);
  return () => {
    const index = themeChangeListeners.indexOf(callback);
    if (index > -1) {
      themeChangeListeners.splice(index, 1);
    }
  };
}

// Función para notificar cambios de tema
function notifyThemeChange(themeName) {
  themeChangeListeners.forEach(callback => {
    try {
      callback(themeName);
    } catch (error) {
      console.error('Error en listener de cambio de tema:', error);
    }
  });
}

// Función para generar tokens de Ant Design basados en CSS variables
export function generateAntDesignTokens(themeName) {
  const theme = themes[themeName];
  if (!theme) {
    console.warn(`Tema "${themeName}" no encontrado`);
    return null;
  }

  // Extraer colores de las CSS variables
  const getColor = (varName) => theme[varName] || '#000000';

  return {
    token: {
      // Colores principales
      colorPrimary: getColor('--cmm-primary-500'),
      colorSuccess: getColor('--cmm-success'),
      colorWarning: getColor('--cmm-warning'),
      colorError: getColor('--cmm-error'),
      colorInfo: getColor('--cmm-primary-500'),
      
      // Colores de fondo
      colorBgContainer: getColor('--cmm-bg-secondary'),
      colorBgElevated: getColor('--cmm-bg-secondary'),
      colorBgLayout: getColor('--cmm-bg-primary'),
      colorBgSpotlight: getColor('--cmm-bg-secondary'),
      
      // Colores de texto
      colorText: getColor('--cmm-text-primary'),
      colorTextSecondary: getColor('--cmm-text-secondary'),
      colorTextTertiary: getColor('--cmm-primary-400'),
      colorTextQuaternary: getColor('--cmm-primary-300'),
      colorTextLightSolid: '#ffffff',
      
      // Bordes
      colorBorder: getColor('--cmm-primary-200'),
      colorBorderSecondary: getColor('--cmm-primary-100'),
      colorSplit: getColor('--cmm-primary-200'),
      
      // Tamaños (mantener consistentes)
      borderRadius: 6,
      borderRadiusLG: 8,
      borderRadiusSM: 4,
      borderRadiusXS: 2,
      
      // Espaciados
      margin: 16,
      marginLG: 24,
      marginSM: 12,
      marginXS: 8,
      marginXXS: 4,
      
      padding: 16,
      paddingLG: 24,
      paddingSM: 12,
      paddingXS: 8,
      paddingXXS: 4,
      
      // Alturas de control
      controlHeight: 32,
      controlHeightLG: 40,
      controlHeightSM: 24,
      
      // Fuentes
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'",
      fontSize: 14,
      fontSizeLG: 16,
      fontSizeSM: 12,
      fontSizeXL: 20,
      fontSizeHeading1: 38,
      fontSizeHeading2: 30,
      fontSizeHeading3: 24,
      fontSizeHeading4: 20,
      fontSizeHeading5: 16,
      
      // Sombras
      boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
      boxShadowSecondary: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
      
      // Animaciones
      motionDurationFast: '0.1s',
      motionDurationMid: '0.2s',
      motionDurationSlow: '0.3s',
      motionEaseInOut: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
      motionEaseInOutCirc: 'cubic-bezier(0.78, 0.14, 0.15, 0.86)',
      motionEaseInOutQuint: 'cubic-bezier(0.86, 0, 0.07, 1)',
      motionEaseOut: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
      motionEaseOutCirc: 'cubic-bezier(0.08, 0.82, 0.17, 1)',
      motionEaseOutQuint: 'cubic-bezier(0.23, 1, 0.32, 1)',
      motionEaseIn: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
      motionEaseInCirc: 'cubic-bezier(0.6, 0.04, 0.98, 0.335)',
      motionEaseInQuint: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
    },
    components: {
      // Layout
      Layout: {
        headerBg: getColor('--cmm-bg-header'),
        siderBg: getColor('--cmm-bg-sidebar'),
        triggerBg: getColor('--cmm-primary-800'),
        bodyBg: getColor('--cmm-bg-primary'),
      },
      
      // Menu
      Menu: {
        darkItemBg: getColor('--cmm-bg-sidebar'),
        itemBg: 'transparent',
        itemSelectedBg: getColor('--cmm-primary-500'),
        itemHoverBg: getColor('--cmm-primary-600'),
        subMenuItemBg: 'transparent',
        darkSubMenuItemBg: 'transparent',
        darkItemSelectedBg: getColor('--cmm-primary-500'),
        darkItemHoverBg: getColor('--cmm-primary-600'),
        darkItemBgSelected: getColor('--cmm-primary-500'),
        darkItemBgHover: getColor('--cmm-primary-600'),
        colorText: getColor('--cmm-text-sidebar'),
        colorTextSelected: '#ffffff',
        colorTextHover: '#ffffff',
        colorTextDisabled: getColor('--cmm-primary-400'),
        colorSplit: getColor('--cmm-primary-700'),
        borderRadius: 0,
        motionDurationSlow: '0.2s',
        collapsedIconSize: 16,
        collapsedWidth: 80,
        itemMarginInline: 0,
        itemPaddingInline: 16,
        itemMarginBlock: 4,
        itemHeight: 40,
      },
      
      // Typography
      Typography: {
        colorText: getColor('--cmm-text-primary'),
        colorTextHeading: getColor('--cmm-text-primary'),
        colorTextDescription: getColor('--cmm-text-secondary'),
        colorTextDisabled: getColor('--cmm-primary-400'),
        colorTextSecondary: getColor('--cmm-primary-600'),
        colorTextTertiary: getColor('--cmm-primary-400'),
        colorTextQuaternary: getColor('--cmm-primary-300'),
        colorTextLightSolid: '#ffffff',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif",
        fontSize: 14,
        fontSizeLG: 16,
        fontSizeSM: 12,
        fontSizeXL: 20,
        fontSizeHeading1: 38,
        fontSizeHeading2: 30,
        fontSizeHeading3: 24,
        fontSizeHeading4: 20,
        fontSizeHeading5: 16,
        lineHeight: 1.5714285714285714,
        lineHeightLG: 1.5,
        lineHeightSM: 1.6666666666666667,
        lineHeightHeading1: 1.2105263157894737,
        lineHeightHeading2: 1.2666666666666666,
        lineHeightHeading3: 1.3333333333333333,
        lineHeightHeading4: 1.4,
        lineHeightHeading5: 1.5,
        fontWeightStrong: 600,
        fontWeight: 400,
        fontWeightLG: 600,
        fontWeightSM: 400,
        fontWeightXL: 600,
      },

      // Tooltip
      Tooltip: {
        colorBgSpotlight: getColor('--cmm-primary-800'),
        colorTextLightSolid: '#ffffff',
        colorText: '#ffffff',
        borderRadius: 6,
        boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
      },

      // Button
      Button: {
        colorPrimary: getColor('--cmm-primary-500'),
        colorPrimaryHover: getColor('--cmm-primary-600'),
        colorPrimaryActive: getColor('--cmm-primary-700'),
        borderRadius: 6,
        controlHeight: 32,
        controlHeightLG: 40,
        controlHeightSM: 24,
        boxShadow: 'none',
        boxShadowSecondary: 'none',
        primaryShadow: `0 2px 0 ${getColor('--cmm-primary-700')}40`,
        primaryHoverShadow: `0 2px 0 ${getColor('--cmm-primary-600')}40`,
        primaryActiveShadow: `0 1px 0 ${getColor('--cmm-primary-800')}40`,
      },

      // Card
      Card: {
        colorBgContainer: getColor('--cmm-bg-secondary'),
        colorBorderSecondary: getColor('--cmm-primary-200'),
        borderRadius: 8,
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },

      // Table
      Table: {
        colorBgContainer: getColor('--cmm-bg-secondary'),
        colorFillAlter: getColor('--cmm-primary-50'),
        colorBorderSecondary: getColor('--cmm-primary-200'),
        borderRadius: 6,
      },
    },
  };
}

// Función para cambiar tema
export function setTheme(themeName) {
  const theme = themes[themeName];
  if (!theme) {
    console.warn(`Tema "${themeName}" no encontrado`);
    return;
  }

  // Aplicar variables CSS al root
  const root = document.documentElement;
  Object.entries(theme).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });

  // Guardar preferencia en localStorage
  localStorage.setItem('cmm-theme', themeName);

  // Notificar cambio de tema
  notifyThemeChange(themeName);
}

// Función para obtener tema actual
export function getCurrentTheme() {
  return localStorage.getItem('cmm-theme') || 'light';
}

// Función para alternar tema
export function toggleTheme() {
  const current = getCurrentTheme();
  const newTheme = current === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  return newTheme;
}

// Función para inicializar tema
export function initializeTheme() {
  const savedTheme = getCurrentTheme();
  setTheme(savedTheme);
}

// Función para obtener temas disponibles
export function getAvailableThemes() {
  return Object.keys(themes);
} 