/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ds: {
          bg: {
            base: 'rgb(var(--ds-bg-base))',
            elevated: 'rgb(var(--ds-bg-elevated))',
            surface: 'rgb(var(--ds-bg-surface))',
            'surface-hover': 'rgb(var(--ds-bg-surface-hover))',
          },
          text: {
            primary: 'rgb(var(--ds-text-primary))',
            secondary: 'rgb(var(--ds-text-secondary))',
            muted: 'rgb(var(--ds-text-muted))',
            inverse: 'rgb(var(--ds-text-inverse))',
          },
          accent: 'rgb(var(--ds-accent))',
          'accent-teal': 'rgb(var(--ds-accent-teal))',
          'accent-success': 'rgb(var(--ds-accent-success))',
          'accent-warning': 'rgb(var(--ds-accent-warning))',
          'accent-danger': 'rgb(var(--ds-accent-danger))',
        },
      },
      fontFamily: {
        sans: ['var(--ds-font-sans)'],
        display: ['var(--ds-font-display)'],
      },
      fontSize: {
        'ds-display': ['var(--ds-text-display)', { lineHeight: 'var(--ds-leading-tight)' }],
        'ds-hero': ['var(--ds-text-hero)', { lineHeight: 'var(--ds-leading-tight)' }],
        'ds-title': ['var(--ds-text-title)', { lineHeight: 'var(--ds-leading-snug)' }],
        'ds-heading': ['var(--ds-text-heading)', { lineHeight: 'var(--ds-leading-snug)' }],
        'ds-subheading': ['var(--ds-text-subheading)', { lineHeight: 'var(--ds-leading-normal)' }],
        'ds-body': ['var(--ds-text-body)', { lineHeight: 'var(--ds-leading-normal)' }],
        'ds-body-sm': ['var(--ds-text-body-sm)', { lineHeight: 'var(--ds-leading-normal)' }],
        'ds-micro': ['var(--ds-text-micro)', { lineHeight: 'var(--ds-leading-normal)' }],
      },
      spacing: {
        'ds-1': 'var(--ds-space-1)', 'ds-2': 'var(--ds-space-2)', 'ds-3': 'var(--ds-space-3)',
        'ds-4': 'var(--ds-space-4)', 'ds-5': 'var(--ds-space-5)', 'ds-6': 'var(--ds-space-6)',
        'ds-8': 'var(--ds-space-8)', 'ds-10': 'var(--ds-space-10)', 'ds-12': 'var(--ds-space-12)',
        'ds-16': 'var(--ds-space-16)', 'ds-20': 'var(--ds-space-20)', 'ds-24': 'var(--ds-space-24)',
      },
      maxWidth: { 'ds-container': 'var(--ds-container-max)' },
      boxShadow: {
        'ds-card': 'var(--ds-card-shadow)',
        'ds-surface': 'var(--ds-surface-shadow)',
        'ds-surface-lg': 'var(--ds-surface-shadow-lg)',
      },
      backgroundImage: {
        'ds-gradient-bg': 'var(--ds-gradient-bg)',
        'ds-gradient-accent': 'var(--ds-gradient-accent)',
        'ds-gradient-hero-left': 'var(--ds-gradient-hero-left)',
      },
    },
  },
  plugins: [],
}
