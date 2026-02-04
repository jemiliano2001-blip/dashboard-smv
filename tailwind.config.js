/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'grid-cols-[repeat(auto-fill,minmax(380px,1fr))]',
    // Dynamic grid columns (2-12)
    ...Array.from({ length: 11 }, (_, i) => `grid-cols-${i + 2}`),
    ...Array.from({ length: 11 }, (_, i) => `lg:grid-cols-${i + 2}`),
    ...Array.from({ length: 11 }, (_, i) => `xl:grid-cols-${i + 2}`),
    ...Array.from({ length: 11 }, (_, i) => `2xl:grid-cols-${i + 2}`),
    // Dynamic grid rows (2-10)
    ...Array.from({ length: 9 }, (_, i) => `grid-rows-${i + 2}`),
    ...Array.from({ length: 9 }, (_, i) => `lg:grid-rows-${i + 2}`),
    ...Array.from({ length: 9 }, (_, i) => `xl:grid-rows-${i + 2}`),
    ...Array.from({ length: 9 }, (_, i) => `2xl:grid-rows-${i + 2}`),
    // Gap sizes
    'gap-2', 'gap-3', 'gap-4',
    // Appearance settings classes
    'density-compact', 'density-comfortable', 'density-spacious',
    'font-size-small', 'font-size-medium', 'font-size-large',
    'contrast-normal', 'contrast-high',
    'animations-enabled', 'animations-disabled',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      colors: {
        industrial: {
          bg: '#0f172a',
          dark: '#1e293b',
          accent: '#3b82f6',
        },
        minimal: {
          bg: 'rgba(255, 255, 255, 0.05)',
          border: 'rgba(255, 255, 255, 0.1)',
          hover: 'rgba(255, 255, 255, 0.1)',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-blue-purple': 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
        'gradient-progress': 'linear-gradient(90deg, #3b82f6 0%, #06b6d4 50%, #3b82f6 100%)',
        'gradient-progress-critical': 'linear-gradient(90deg, #ef4444 0%, #f97316 50%, #ef4444 100%)',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2)',
        'glow-blue-lg': '0 0 30px rgba(59, 130, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.3)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.4), 0 0 40px rgba(139, 92, 246, 0.2)',
        'inner-lg': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
        'multi': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(148, 163, 184, 0.1)',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-in-smooth': 'fadeInSmooth 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-from-bottom': 'slideInFromBottom 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-up-smooth': 'slideUpSmooth 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'progress-bar': 'progressBar 1.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInSmooth: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideInFromBottom: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUpSmooth: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.4), 0 0 40px rgba(59, 130, 246, 0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(59, 130, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.3)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        progressBar: {
          '0%': { transform: 'scaleX(0)', transformOrigin: 'left' },
          '100%': { transform: 'scaleX(1)', transformOrigin: 'left' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
