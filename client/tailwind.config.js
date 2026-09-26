/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    screens: {
      sm: '640px',   // Mobile landscape / Small tablets
      md: '768px',   // Tablets
      lg: '1024px',  // Laptops / Desktops
      xl: '1280px',  // Large Desktops
      '2xl': '1536px'// High-DPI / Ultrawide screens
    },
    extend: {
      colors: {
        background: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        border: 'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',
        foreground: 'var(--color-text-primary)',
        'foreground-secondary': 'var(--color-text-secondary)',
        'foreground-muted': 'var(--color-text-muted)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          active: 'var(--color-primary-active)',
          contrast: 'var(--color-primary-contrast)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          hover: 'var(--color-secondary-hover)',
          text: 'var(--color-secondary-text)',
        },
        focus: 'var(--color-focus)',
        status: {
          success: 'var(--color-success)',
          'success-bg': 'var(--color-success-bg)',
          warning: 'var(--color-warning)',
          'warning-bg': 'var(--color-warning-bg)',
          error: 'var(--color-error)',
          'error-bg': 'var(--color-error-bg)',
          info: 'var(--color-info)',
          'info-bg': 'var(--color-info-bg)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        none: 'var(--shadow-none)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        focus: '0 0 0 3px var(--color-focus)',
      },
      zIndex: {
        dropdown: '1000',
        sticky: '1020',
        'modal-backdrop': '1040',
        modal: '1050',
        tooltip: '1070',
        'skip-link': '9999',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '200ms',
      },
    },
  },
  plugins: [],
};
