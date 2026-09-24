/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-raised': 'var(--surface-raised)',
        border: 'var(--border)',
        text: 'var(--text)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        accent: 'var(--accent)',
        'accent-fg': 'var(--accent-fg)',
        'accent-subtle': 'var(--accent-subtle)',
        'accent-border': 'var(--accent-border)',
        glass: 'var(--glass)',
        'glass-hover': 'var(--glass-hover)',
        'glass-strong': 'var(--glass-strong)',
        'glass-border': 'var(--glass-border)',
        'glass-border-hover': 'var(--glass-border-hover)',
        'glass-action': 'var(--glass-action)',
        'glass-action-hover': 'var(--glass-action-hover)',
        'glass-action-border': 'var(--glass-action-border)',
        field: 'var(--field)',
        scrim: 'var(--scrim)',
        danger: 'var(--danger)',
        'danger-fg': 'var(--danger-fg)',
        warning: 'var(--warning)',
      },
      fontFamily: {
        sans: ['"Zalando Sans"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
      },
      zIndex: {
        sticky: '1100',
        modal: '1300',
        toast: '1400',
      },
    },
  },
  plugins: [],
}