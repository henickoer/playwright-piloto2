// playwright.config.js
const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  reporter: [
    ['list'],
    ['junit', { outputFile: path.join(__dirname, 'reports', 'reporteSucursales.xml') }]
  ],
  testDir: './tests', // donde están tus tests
  timeout: 300000,
});
