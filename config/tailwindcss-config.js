module.exports = {
  mode: 'jit',
  purge: [
    './app/**/*.html',
    './app/**/*.hbs',
    './app/**/*.js',
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {}
  },
  variants: {
    extend: {}
  },
  plugins: [
    require('@tailwindcss/forms')
  ]
}
