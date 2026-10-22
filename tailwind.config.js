/** Configuración de Tailwind: colores y tipografías de la marca. */
module.exports = {
  content: ['./*.html', './js/*.js'],
  theme: {
    extend: {
      colors: {
        ocean: { 50: '#f0f8fa', 100: '#d8eef2', 500: '#2b8a9e', 600: '#1f6f82', 700: '#195a6a', 800: '#14485a', 900: '#0e2f3b' },
        sand: { 50: '#fcfaf7', 100: '#f4f1eb', 200: '#e8e2d5', 300: '#d5cbb3' },
        coral: { 500: '#e2725b', 600: '#cf5d45' }
      },
      fontFamily: {
        serif: ['Fraunces', 'serif'],
        sans: ['Inter', 'sans-serif']
      }
    }
  }
};
