/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2563EB',
          'blue-dark': '#1D4ED8',
          'blue-hover': '#1E40AF',
          'blue-light': '#60A5FA',
          'blue-subtle': '#EFF6FF',
          indigo: '#4F46E5',
          'indigo-dark': '#3730A3',
          orange: '#FF5722',
          'orange-hover': '#E64A19',
          'orange-light': '#FFF3E0',
          coral: '#F97316',
          emerald: '#10B981',
          teal: '#14B8A6',
          amber: '#F59E0B',
          purple: '#8B5CF6',
          violet: '#7C3AED',
          pink: '#EC4899',
          rose: '#F43F5E',
          navy: '#0B132B',
          dark: '#0B0F19',
          surface: '#111827'
        }
      },
      boxShadow: {
        'uber': '0 20px 40px -15px rgba(0, 0, 0, 0.07), 0 0 1px 1px rgba(0, 0, 0, 0.04)',
        'uber-hover': '0 25px 50px -12px rgba(15, 23, 42, 0.12), 0 0 1px 1px rgba(0, 0, 0, 0.05)',
        'glow-blue': '0 0 25px -4px rgba(37, 99, 235, 0.35)',
        'glow-orange': '0 0 25px -4px rgba(255, 87, 34, 0.4)',
        'glow-green': '0 0 20px -4px rgba(16, 185, 129, 0.35)',
        'glow-purple': '0 0 25px -4px rgba(139, 92, 246, 0.35)',
        'card-subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.02), 0 1px 2px -1px rgba(0, 0, 0, 0.03)'
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
        'pulse-subtle': 'pulseSubtle 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.02)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
