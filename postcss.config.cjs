module.exports = {
  plugins: {
    'unocss/postcss': {
      content: ['./landing.html', './app/**/*.{js,ts,jsx,tsx}'],
    },
    autoprefixer: {},
  },
}
