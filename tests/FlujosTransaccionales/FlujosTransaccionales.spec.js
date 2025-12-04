// tests/TimeSlotScraper.spec.js
const { test, chromium } = require('@playwright/test');
const HeaderPage = require('../../pages/HeaderPage');
const ProductosEncontradosPage = require('../../pages/ProductosEncontradosPage'); 
const ResumenCarritoPage = require('../../pages/ResumenCarritoPage');
const config = require('../../utils/Environment');
const fs = require('fs');
const path = require('path');
const NavegacionActions = require('../../utils/NavegacionActions');
const PdfPrinter = require('pdfmake');
const vfsFonts = require('pdfmake/build/vfs_fonts.js');
const { sendEmail } = require('../../utils/mailslurp-utils');
const { generarReportePDF } = require('../../utils/creadorpdf');
//const excelurl = '.\\data\\FlujosTransaccionales.xlsx';
const exceltab = 'Datos Flujos';



test('C1 - Visualizar metodos de pago', async () => { 
  test.setTimeout(300000);
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: ['--start-maximized']
  });
  const page = await context.newPage();
  const headerPage = new HeaderPage(page);
  const resumencarritos = new ResumenCarritoPage(page);
  const productos = new ProductosEncontradosPage(page);
  const carritoUtils = new NavegacionActions();

  // --- Sesión persistente ---
  if (fs.existsSync('./sessionCookies.json')) { 
    const cookies = JSON.parse(fs.readFileSync('./sessionCookies.json'));
    await context.addCookies(cookies);
  }

  if (fs.existsSync('./sessionLocalStorage.json')) {
    const localStorageData = JSON.parse(fs.readFileSync('./sessionLocalStorage.json'));

    // Primero navegar UNA sola vez
    await page.goto(config.urls.PROD, { waitUntil: 'domcontentloaded' });

    // Inyectar localStorage ANTES de cualquier otra navegación
    await page.evaluate((data) => {
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, value);
      }
    }, localStorageData);

    // Recargar SOLO después de setear localStorage
    await page.reload({ waitUntil: 'domcontentloaded' });
  }

  // --- Flujo principal ---
  await page.goto(config.urls.PROD);
  await headerPage.safeClick(headerPage.aceptarCookiesButton);
  await page.goto(config.urls.PROD);
  await page.waitForSelector('iframe#launcher', { state: 'visible', timeout: 30000 });

  await headerPage.safeClick(headerPage.minicartButton);  
  await page.waitForTimeout(2000);

  const vaciarButton = await page.locator(resumencarritos.vaciarcarritoButton);
  if (await vaciarButton.count() > 0) {
    console.log('Vaciando el carrito...');
    await resumencarritos.safeClick(resumencarritos.vaciarcarritoButton);
    await resumencarritos.safeClick(resumencarritos.eliminarItemsCarritoButton);
    await headerPage.safeClick(headerPage.cerrarminicartButton);
  } else {
    await headerPage.safeClick(headerPage.cerrarminicartButton);
    console.log('🛒 El carrito ya está vacío.');
  }

  await page.goto(config.urls.PROD);

    const listaProductos = [
      'Aguacate Hass por Kg',  // 1
      'Plátano Chiapas por Kg', // 2
      'Cebolla Blanca por kg',  // 3
      'Zanahoria por kg',       // 4
      'Ajo por Kg'              // 5
    ];

    let productosAgregados = 0;

    for (const producto of listaProductos) {
    console.warn(`Se ingresó al for, producto actual: `+producto);

    if (productosAgregados >= 4) break;
      console.warn(`Se ingresó al if productosAgregados`);
      
      try {
          console.warn(`Se intenta agregar producto: ${producto}`);
          const exito = await carritoUtils.buscarYAgregarProducto(page, headerPage, productos, producto);
          if (exito) {
            productosAgregados++;
            console.log(`✅ Producto agregado: ${producto} (total agregados: ${productosAgregados})`);
          }
        } catch (err) {
          console.warn(`⚠️ No se pudo agregar producto: ${producto} → ${err.message}`);
        }
  }

  console.log(`🛒 Total de productos agregados al carrito: ${productosAgregados}`);
  await page.goto(config.urls.PROD);

  await headerPage.safeClick(headerPage.minicartButton);
  await page.waitForTimeout(2000);
  await resumencarritos.safeClick(resumencarritos.comprarcarritoButton);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  await carritoUtils.avanzarCarrito(page, resumencarritos);
  await page.waitForTimeout(2000);
 
const botonHorario = page.locator(resumencarritos.horarioentregaButton).first();
await botonHorario.waitFor({ state: "visible" });
await botonHorario.click();
await headerPage.safeClick(resumencarritos.iralpagoButton);

/*const data = getExcelData(excelurl, exceltab);
console.log(`\n=== Buscando: ${data} ===`);
*/

await page.pause();

/*
await sendEmail(
  config.correos,
  '📄 Reporte PDF',
  'Adjunto el reporte más reciente.',
  '../reports/reporteSucursales.pdf'
);
*/

});