module.exports = {
  mode: 'jit',
  purge: ['./app/**/*.html', './app/**/*.hbs'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [require('@tailwindcss/forms')],
};
