module.exports = {
  content: [
    './app/**/*.{html,hbs,js}'
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {}
  },
  plugins: [
    require('@tailwindcss/forms')
  ]
}
