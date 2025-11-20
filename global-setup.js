const { chromium } = require('@playwright/test');
const HeaderPage = require('./pages/HeaderPage');
const DirectionsPage = require('./pages/DirectionsPage');
const { loginConCorreo } = require('./utils/LoginActions');
const config = require('./utils/Environment');

module.exports = async function globalSetup() {

  console.log("🔥 GLOBAL SETUP INICIADO 🔥");
  console.log("🔐 Ejecutando login para generar sesión...");

  // 👉 contexto persistente para guardar cookies
  const context = await chromium.launchPersistentContext('', { headless: false });
  const page = await context.newPage();

  const headerPage = new HeaderPage(page);

  // 👉 login real
  await loginConCorreo(page, headerPage, headerPage);

  // 👉 abrir menú direcciones
  const directionsPage = new DirectionsPage(page);
  await page.waitForSelector('iframe#launcher', { state: 'visible', timeout: 30000 });
  await directionsPage.safeClick(directionsPage.aceptarCookiesButton);
  await directionsPage.safeClick(directionsPage.seleccionarDireccionButton);
  await page.waitForTimeout(2000);

  // 👉 revisar direcciones existentes
  const editarButtons = page.locator(directionsPage.editardireccionButton);
  const count = await editarButtons.count();

  if (count === 0) {
    console.log("⚠️ No hay direcciones, agregando todas las sucursales...");
    await page.waitForTimeout(500);
    for (const [nombre, direccion] of Object.entries(config.sucursales)) {
      console.log(`➡️ Agregando sucursal: ${nombre} (${direccion})`);
      await directionsPage.agregarDireccion(nombre, direccion);
      await page.waitForTimeout(500);
    }
  } else {
    console.log(`📦 Ya existen ${count} direcciones.`);
  }

  // 👉 Guardar sesión
  await context.storageState({ path: 'storageState.json' });

  await context.close();

  console.log("✅ Sesión generada y guardada correctamente.");
};