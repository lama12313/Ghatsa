/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Reem Kufi"', 'system-ui', 'sans-serif'],
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
      },
      colors: {
        krill: { DEFAULT: '#ff7a8a', soft: '#ffb3bc', deep: '#e0566a' },
        abyss: { 50: '#e6f6fb', 200: '#8fd3e8', 400: '#2a8fb4', 600: '#0d4a6e', 800: '#062238', 900: '#020c16' },
      },
      keyframes: {
        shake: { '0%,100%': { transform: 'translateX(0)' }, '20%,60%': { transform: 'translateX(-8px)' }, '40%,80%': { transform: 'translateX(8px)' } },
        rise: { '0%': { transform: 'translateY(0)', opacity: '0' }, '10%': { opacity: '.6' }, '100%': { transform: 'translateY(-110vh)', opacity: '0' } },
        glow: { '0%,100%': { boxShadow: '0 0 0 0 rgba(255,122,138,0)' }, '50%': { boxShadow: '0 0 40px 10px rgba(255,122,138,.6)' } },
        pop: { '0%': { transform: 'scale(.8)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
      },
      animation: { shake: 'shake .4s ease-in-out', rise: 'rise linear infinite', glow: 'glow 1.2s ease-in-out 2', pop: 'pop .3s ease-out' },
    },
  },
  plugins: [],
};
