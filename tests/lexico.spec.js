const { test, chromium } = require('@playwright/test');
const HeaderPage = require('../pages/HeaderPage');
const ProductosEncontradosPage = require('../pages/ProductosEncontradosPage'); 
const config = require('../utils/Environment');
const fs = require('fs');
const NavegacionActions = require('../utils/NavegacionActions');
const { getExcelData } = require('../utils/excelReader');
const ResumenCarritoPage = require('../pages/ResumenCarritoPage');

const excelurl = '.\\data\\ChedrahuiQA_Lexico.xlsx';
const excelerrores = 'Errores Ortográficos';
const excellong = 'Long Tail';
const excelfrecuencia = 'Frecuencia Alta';
const excelsemantico = 'Semánticos';

let context, page;
let headerPage, resumencarritos, productosPage, carritoUtils;

test.beforeAll(async () => {
  context = await chromium.launchPersistentContext('', {
    headless: false,
    args: ['--start-maximized']
  });
  page = await context.newPage();

  // --- Cargar sesión persistente si existe ---
  if (fs.existsSync('./sessionCookies.json')) { 
    const cookies = JSON.parse(fs.readFileSync('./sessionCookies.json'));
    await context.addCookies(cookies);
  }

  if (fs.existsSync('./sessionLocalStorage.json')) {
    const localStorageData = JSON.parse(fs.readFileSync('./sessionLocalStorage.json'));
    await page.goto(config.urls.PROD);
    await page.evaluate((data) => {
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, value);
      }
    }, localStorageData);
  }

  // Instanciar tus PageObjects y utils
  headerPage = new HeaderPage(page);
  resumencarritos = new ResumenCarritoPage(page);
  productosPage = new ProductosEncontradosPage(page);
  carritoUtils = new NavegacionActions();
});

test('C1 - Errores Ortográficos ', async () => {
  test.setTimeout(900000);
  const data = getExcelData(excelurl, excelerrores);

  for (const row of data) {
    const Termino = row['Término'];
    const equivalencias = row['Equivalencia']
      .split(',')
      .map(e => e.trim().toLowerCase());

    console.log(`\n==============================`);
    console.log(`🔹 Buscando término: ${Termino}`);
    console.log(`   Equivalencias esperadas: ${equivalencias.join(', ')}`);
    console.log(`==============================`);

    // 🔹 Realiza búsqueda completa (con espera y estabilización)
    await carritoUtils.buscarProducto(page, headerPage, productosPage, Termino);

    // 🔹 Evalúa productos encontrados
    await carritoUtils.evaluarBusquedaErroresOrtograficos(page, productosPage, equivalencias);

    await page.waitForTimeout(1000);
  }

  await context.close();
});



test('C2 - Long Tail', async () => {
  test.setTimeout(900000); // aumenta tiempo total del test
  const data = getExcelData(excelurl, excellong);

    console.log(`\n==============================`);
    console.log(`🔹 Buscando término: ${Termino}`);
    console.log(`==============================`);

    // 🔹 Realiza búsqueda completa (con espera y estabilización)
    await carritoUtils.buscarProducto(page, headerPage, productosPage, Termino);

  


});

test('C3 - Frecuencia Alta ', async () => {
  test.setTimeout(900000); // aumenta tiempo total del test
  const data = getExcelData(excelurl, excelfrecuencia);

    console.log(`\n==============================`);
    console.log(`🔹 Buscando término: ${Termino}`);
    console.log(`==============================`);

    // 🔹 Realiza búsqueda completa (con espera y estabilización)
    await carritoUtils.buscarProducto(page, headerPage, productosPage, Termino);
  


});


test('C4 - Semántico ', async () => {
  test.setTimeout(900000); // aumenta tiempo total del test
    const Termino = row['Término'];
    const equivalencias = row['Equivalencia']
      .split(',')
      .map(e => e.trim().toLowerCase());

    console.log(`\n==============================`);
    console.log(`🔹 Buscando término: ${Termino}`);
    console.log(`   Equivalencias esperadas: ${equivalencias.join(', ')}`);
    console.log(`==============================`);

    // 🔹 Realiza búsqueda completa (con espera y estabilización)
    await carritoUtils.buscarProducto(page, headerPage, productosPage, Termino);
  


});
