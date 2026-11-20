// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    rules: {
      // Allow calling setState in useEffect for async operations
      // This is a common pattern for session restoration and data fetching
      "react-hooks/set-state-in-effect": "off",
    },
  }
]);