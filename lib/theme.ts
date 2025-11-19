/**
 * Centralized Theme Configuration
 * Update colors here to change the entire app's theme
 */

export const theme = {
  colors: {
    // Backgrounds
    background: {
      primary: '#FFFFFF',      // Main page background
      secondary: '#FAFAFA',    // Card backgrounds
    },

    // Gold Accent Colors
    accent: {
      primary: '#D4AF37',      // Main gold accent
      hover: '#C5A028',        // Gold hover state
      dark: '#B8941F',         // Dark gold for gradients
      light: '#F5E6D3',        // Light gold backgrounds
    },

    // Text Colors
    text: {
      primary: '#2D2D2D',      // Headlines and important text
      secondary: '#6B6B6B',    // Body text and labels
      tertiary: '#9E9E9E',     // Subtle descriptions
    },

    // Borders
    border: {
      primary: '#000000',      // Main borders (black)
      secondary: '#E8E8E8',    // Subtle borders (light gray)
    },

    // Status Colors
    status: {
      error: '#DC2626',        // Error/delete actions (red)
      success: '#16A34A',      // Success states (green)
      warning: '#F59E0B',      // Warning states (amber)
    }
  },

  // Shadow Styles
  shadows: {
    gold: '0 4px 12px rgba(212, 175, 55, 0.3)',
    goldLight: '0 2px 8px rgba(212, 175, 55, 0.2)',
    card: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },

  // Border Styles
  borders: {
    card: '2px solid #000000',
    input: '1px solid #E8E8E8',
    accent: '2px solid #D4AF37',
  },

  // Typography
  typography: {
    fontFamily: 'Arial, Helvetica, sans-serif',
  }
} as const;

// CSS Variables for use in stylesheets
export const cssVariables = `
:root {
  /* Backgrounds */
  --bg-primary: ${theme.colors.background.primary};
  --bg-secondary: ${theme.colors.background.secondary};

  /* Accents */
  --accent-primary: ${theme.colors.accent.primary};
  --accent-hover: ${theme.colors.accent.hover};
  --accent-dark: ${theme.colors.accent.dark};
  --accent-light: ${theme.colors.accent.light};

  /* Text */
  --text-primary: ${theme.colors.text.primary};
  --text-secondary: ${theme.colors.text.secondary};
  --text-tertiary: ${theme.colors.text.tertiary};

  /* Borders */
  --border-primary: ${theme.colors.border.primary};
  --border-secondary: ${theme.colors.border.secondary};

  /* Status */
  --status-error: ${theme.colors.status.error};
  --status-success: ${theme.colors.status.success};
  --status-warning: ${theme.colors.status.warning};

  /* Shadows */
  --shadow-gold: ${theme.shadows.gold};
  --shadow-gold-light: ${theme.shadows.goldLight};
  --shadow-card: ${theme.shadows.card};
}
`;

// Helper function to get theme values
export const getTheme = () => theme;
