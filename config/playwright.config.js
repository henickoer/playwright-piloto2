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

  // 🔁 Reintentos automáticos para pruebas fallidas
  retries: 2, // Cambia a la cantidad de intentos que desees (0 desactiva los reintentos)

  // Opcional: modo "headless" o configuración por defecto del navegador
  use: {
    headless: true,
  },
});
