const { test, chromium } = require('@playwright/test');
const HeaderPage = require('../../pages/HeaderPage');
const ProductosEncontradosPage = require('../../pages/ProductosEncontradosPage'); 
const config = require('../../utils/Environment');
const fs = require('fs');
const NavegacionActions = require('../../utils/NavegacionActions');
const { getExcelData } = require('../../utils/excelReader');
const ResumenCarritoPage = require('../../pages/ResumenCarritoPage');

const excelurl = '.\\data\\ChedrahuiQA_Lexico.xlsx';
const excelerrores = 'Errores Ortográficos';
const excellong = 'Long Tail';
const excelfrecuencia = 'Frecuencia Alta';
const excelsemantico = 'Semánticos';

// 🔥 Habilitar paralelismo por archivo
test.describe.configure({ mode: 'parallel' });

// Crear una fixture por test (cada test tendrá su propio browser)
test.beforeEach(async ({}, testInfo) => {
  testInfo.context = await chromium.launchPersistentContext('', {
    headless: false,
    args: ['--start-maximized']
  });

  const page = await testInfo.context.newPage();

  // --- Cargar cookies ---
  if (fs.existsSync('./sessionCookies.json')) {
    const cookies = JSON.parse(fs.readFileSync('./sessionCookies.json'));
    await testInfo.context.addCookies(cookies);
  }

  // --- Cargar LocalStorage ---
  if (fs.existsSync('./sessionLocalStorage.json')) {
    const localStorageData = JSON.parse(fs.readFileSync('./sessionLocalStorage.json'));
    await page.goto(config.urls.PROD);
    await page.evaluate((data) => {
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, value);
      }
    }, localStorageData);
  }

  // Guardamos page + pageObjects en testInfo para que cada test lo use
  testInfo.page = page;
  testInfo.headerPage = new HeaderPage(page);
  testInfo.resumencarritos = new ResumenCarritoPage(page);
  testInfo.productosPage = new ProductosEncontradosPage(page);
  testInfo.carritoUtils = new NavegacionActions();
});

test.afterEach(async ({}, testInfo) => {
  await testInfo.context.close();
});


test('C1 - Errores Ortográficos', async ({}, testInfo) => {
  const { page, headerPage, productosPage, carritoUtils } = testInfo;

  const data = getExcelData(excelurl, excelerrores);

  for (const row of data) {
    const Termino = row['Término'];
    const equivalencias = row['Equivalencia']
      .split(',')
      .map(e => e.trim().toLowerCase());

    console.log(`\n=== Buscando: ${Termino} ===`);

    await carritoUtils.buscarProducto(page, headerPage, productosPage, Termino);
    await carritoUtils.evaluarBusquedaErroresOrtograficos(page, productosPage, equivalencias);

    await page.waitForTimeout(500);
  }
});


test('C2 - Long Tail', async ({}, testInfo) => {
  const { page, headerPage, productosPage, carritoUtils } = testInfo;

  const data = getExcelData(excelurl, excellong);
  for (const row of data) {
    const Termino = row['Término'];

    console.log(`\n=== Buscando: ${Termino} ===`);

    await carritoUtils.buscarProducto(page, headerPage, productosPage, Termino);
  }
});

test('C3 - Frecuencia Alta', async ({}, testInfo) => {
  const { page, headerPage, productosPage, carritoUtils } = testInfo;

  const data = getExcelData(excelurl, excelfrecuencia);
  for (const row of data) {
    const Termino = row['Término'];

    console.log(`\n=== Buscando: ${Termino} ===`);

    await carritoUtils.buscarProducto(page, headerPage, productosPage, Termino);
  }
});

test('C4 - Semántico', async ({}, testInfo) => {
  const { page, headerPage, productosPage, carritoUtils } = testInfo;

  const data = getExcelData(excelurl, excelsemantico);
  for (const row of data) {
    const Termino = row['Término'];

    console.log(`\n=== Buscando: ${Termino} ===`);

    await carritoUtils.buscarProducto(page, headerPage, productosPage, Termino);
  }
});
