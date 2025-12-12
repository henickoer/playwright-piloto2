// tests/TimeSlotScraper.spec.js
const { test, chromium } = require('@playwright/test');
const HeaderPage = require('../../pages/HeaderPage');
const { getExcelData } = require('../../utils/excelReader');
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
const excelurl = '.\\data\\FlujosTransaccionales.xlsx';
const exceltab = 'Datos Flujos';

let context;
let page;
let headerPage;
let resumencarritos;
let productos;
let carritoUtils;

// ------------------------
// BEFORE ALL
// ------------------------
test.beforeAll(async () => {

  context = await chromium.launchPersistentContext('', {
    headless: false,
    args: ['--start-maximized']
  });

  page = await context.newPage();
  headerPage = new HeaderPage(page);
  resumencarritos = new ResumenCarritoPage(page);
  productos = new ProductosEncontradosPage(page);
  carritoUtils = new NavegacionActions();

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

});

// ------------------------
// TEST CASE
// ------------------------
test('C1 - Visualizar metodos de pago', async () => { 
  test.setTimeout(300000);

  // --- Flujo principal ---
  await page.goto(config.urls.PROD);
  await headerPage.safeClick(headerPage.aceptarCookiesButton);
  await page.goto(config.urls.PROD);
  await page.waitForSelector('iframe#launcher', { state: 'visible', timeout: 30000 });
  await headerPage.safeClick(headerPage.minicartButton);  
  await page.waitForTimeout(2000);

  await carritoUtils.vaciarCarrito(page, resumencarritos, headerPage);
  await carritoUtils.AgregarProductosDefault(page,headerPage,productos,config,2);

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

  const data = getExcelData(excelurl, exceltab);
  console.log(data); 

  for (const row of data) {
    const TipoPagoText = row['Tipos de pago'];
    const XpathTipoPago = resumencarritos.formapagochedrahuiOption(TipoPagoText);
    await resumencarritos.safeClick(XpathTipoPago);
    console.log("El tipo de pago es: " + await resumencarritos.getText(XpathTipoPago));
  }

});
