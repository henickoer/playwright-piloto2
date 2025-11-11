// tests/loginCookie.spec.js
const { test, chromium } = require('@playwright/test');
const HeaderPage = require('../pages/HeaderPage');
const DirectionsPage = require('../pages/DirectionsPage');
const { loginConCorreo } = require('../utils/LoginActions');
const config = require('../utils/Environment');

test.describe('Login y sesión persistente', () => {
  let context;
  let page;
  let headerPage;
  let directionsPage;
  

  test.beforeAll(async () => {
    test.setTimeout(300000);
    context = await chromium.launchPersistentContext('', { headless: false });
    page = await context.newPage();

    headerPage = new HeaderPage(page);
    await loginConCorreo(page, headerPage, headerPage);

    // Guardar session en archivo
    //await context.storageState({ path: 'storageState.json' });
  });

test('Test usando sesión guardada', async () => {
  test.setTimeout(300000); // ⏱️ 5 minutos
  console.log('✅ Login y sesión seteada correctamente.');

  await page.waitForSelector('iframe#launcher', { state: 'visible', timeout: 30000 });

  const directionsPage = new DirectionsPage(page);
  await directionsPage.safeClick(directionsPage.seleccionarDireccionButton);

  try {
    // Esperar brevemente a que cargue la sección de direcciones
    await page.waitForTimeout(1000);
    // Localizar botones de "Editar dirección"
    const editarButtons = page.locator(directionsPage.editardireccionButton);
    const count = await editarButtons.count();

    if (count > 0) {
      console.log(`📦 Existen ${count} direcciones configuradas.`);
    } else {
      console.log('⚠️ No existen direcciones configuradas.');

       // 🔹 Recorrer todas las sucursales del archivo de Environment
      for (const [nombre, direccion] of Object.entries(config.sucursales)) {
        console.log(`➡️ Agregando sucursal: ${nombre} (${direccion})`);
        await directionsPage.agregarDireccion(nombre, direccion);
        await page.waitForTimeout(500); // espera ligera entre registros
      }
      
   
    }
  } catch (error) {
    console.log('❌ Error al verificar las direcciones:', error.message);
  }      


});

  test.afterAll(async () => {
    await context.close();
  });
});
