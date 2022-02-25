module.exports = {
  content: [
    './app/**/*.{html,hbs,js}'
  ],
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {}
  },
  plugins: [
    require('@tailwindcss/forms')
  ]
}
