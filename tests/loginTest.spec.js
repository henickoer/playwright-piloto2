// tests/loginCorreo.spec.js
const { test, chromium } = require('@playwright/test');
const HeaderPage = require('../pages/HeaderPage');
const config = require('../utils/Environment');
const fs = require('fs');

test('C1 - Cargar sesión existente', async () => {
  // Lanzar un contexto persistente sin headless para depurar si quieres
  const context = await chromium.launchPersistentContext('', { headless: false });
  const page = await context.newPage();

  // Crear HeaderPage con la página
  const headerPage = new HeaderPage(page);

  // Cargar cookies si existe el archivo
  if (fs.existsSync('./sessionCookies.json')) {
    const cookies = JSON.parse(fs.readFileSync('./sessionCookies.json'));
    for (const cookie of cookies) {
      await context.addCookies([cookie]);
    }
  }

  // Cargar localStorage si existe
  if (fs.existsSync('./sessionLocalStorage.json')) {
    const localStorageData = JSON.parse(fs.readFileSync('./sessionLocalStorage.json'));
    await page.goto(config.urls.PROD); // Necesario para setear localStorage
    await page.evaluate((data) => {
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, value);
      }
    }, localStorageData);
  }

  // Ir a la página principal
  await page.goto(config.urls.PROD);

  // Dejar abierta para debug si quieres
  //await page.pause();

  //await context.close();

  //aqui iniciamos la wea de los productos





});
