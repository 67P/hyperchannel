module.exports = {
  content: ['./index.html', './app/**/*.{html,hbs,js,gjs}'],
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/forms')],
};
