export default {
  extends: 'recommended',

  ignore: ['dist/**', 'release/**'],

  rules: {
    'no-invalid-interactive': false,
    'link-href-attributes': false,
    'require-input-label': 'warn',
  },
};
