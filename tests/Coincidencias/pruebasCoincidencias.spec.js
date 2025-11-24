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

test.beforeEach(async ({}, testInfo) => {
  const browser = await chromium.launch({
    headless: false,
    args: ['--start-maximized']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  testInfo.browser = browser;
  testInfo.context = context;
  testInfo.page = page;

  // --- Cookies ---
  if (fs.existsSync('./sessionCookies.json')) {
    const cookies = JSON.parse(fs.readFileSync('./sessionCookies.json'));
    await context.addCookies(cookies);
  }

  // --- LocalStorage ---
  if (fs.existsSync('./sessionLocalStorage.json')) {
    const localStorageData = JSON.parse(fs.readFileSync('./sessionLocalStorage.json'));
    await page.goto(config.urls.PROD);
    await page.evaluate((data) => {
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, value);
      }
    }, localStorageData);
  }

  testInfo.headerPage = new HeaderPage(page);
  testInfo.resumencarritos = new ResumenCarritoPage(page);
  testInfo.productosPage = new ProductosEncontradosPage(page);
  testInfo.carritoUtils = new NavegacionActions();
});

test.afterEach(async ({}, testInfo) => {
  await testInfo.context.close();
  await testInfo.browser.close();
});

test('C1 - Errores Ortográficos', async ({}, testInfo) => {
  const { page, headerPage, productosPage, carritoUtils } = testInfo;

  const data = getExcelData(excelurl, excelerrores);

  // 🔥 Arreglo para guardar TODO lo evaluado
  const resultadosTotales = [];

  for (const row of data) {

    const Termino = row['Término'];
    const equivalencias = row['Equivalencia']
      .split(',')
      .map(e => e.trim().toLowerCase());

    console.log(`\n=== Buscando: ${Termino} ===`);

    // 1️⃣ Buscar el término
    const hayResultados = await carritoUtils.buscarProducto(
      page,
      headerPage,
      productosPage,
      Termino
    );

    // Estructura base del resultado
    let registroTermino = {
      termino: Termino,
      equivalencias,
      hayResultados,
      coincidencias: [],
      noCoincidencias: [],
      listaDetallada: []
    };

    // 2️⃣ Si hay resultados reales, evaluar equivalencias
    if (hayResultados) {
      const evaluacion = await carritoUtils.evaluarBusquedaErroresOrtograficos(
        page,
        productosPage,
        equivalencias
      );

      // Guardamos directamente lo que devolvió el método
      registroTermino.coincidencias = evaluacion.coincidencias;
      registroTermino.noCoincidencias = evaluacion.noCoincidencias;
      registroTermino.listaDetallada = evaluacion.listaDetallada;

      console.log(`🟢 Coincidencias:`, evaluacion.coincidencias);
      console.log(`🔸 No Coincidencias:`, evaluacion.noCoincidencias);

    } else {
      console.log(`❌ No hubo productos reales para evaluar equivalencias`);
    }

    // 3️⃣ Guardar el resultado de ESTE término
    resultadosTotales.push(registroTermino);

    await page.waitForTimeout(500);
  }

  // 🔥🔥🔥 Al final del test
  console.log("\n=============== RESULTADOS CONSOLIDADOS ===============");
  console.log(JSON.stringify(resultadosTotales, null, 2));
  console.log("=======================================================\n");

  // Si quisieras escribirlos a archivo JSON:
  // fs.writeFileSync("./logs/resultados_C1.json", JSON.stringify(resultadosTotales, null, 2));
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

  // 🔥 Arreglo para guardar TODO lo evaluado
  const resultadosTotales = [];

  for (const row of data) {

    const Termino = row['Término'];
    const equivalencias = row['Equivalencia']
      .split(',')
      .map(e => e.trim().toLowerCase());

    console.log(`\n=== Buscando: ${Termino} ===`);

    // 1️⃣ Buscar el término
    const hayResultados = await carritoUtils.buscarProducto(
      page,
      headerPage,
      productosPage,
      Termino
    );

    // Estructura base del resultado
    let registroTermino = {
      termino: Termino,
      equivalencias,
      hayResultados,
      coincidencias: [],
      noCoincidencias: [],
      listaDetallada: []
    };

    // 2️⃣ Si hay resultados reales, evaluar equivalencias (mismo método que C1)
    if (hayResultados) {
      const evaluacion = await carritoUtils.evaluarBusquedaErroresOrtograficos(
        page,
        productosPage,
        equivalencias
      );

      registroTermino.coincidencias = evaluacion.coincidencias;
      registroTermino.noCoincidencias = evaluacion.noCoincidencias;
      registroTermino.listaDetallada = evaluacion.listaDetallada;

      console.log(`🟢 Coincidencias:`, evaluacion.coincidencias);
      console.log(`🔸 No Coincidencias:`, evaluacion.noCoincidencias);

    } else {
      console.log(`❌ No hubo productos reales para evaluar equivalencias`);
    }

    // 3️⃣ Guardar el resultado de ESTE término
    resultadosTotales.push(registroTermino);

    await page.waitForTimeout(500);
  }

  // 🔥🔥🔥 Al final del test
  console.log("\n=============== RESULTADOS CONSOLIDADOS C4 ===============");
  console.log(JSON.stringify(resultadosTotales, null, 2));
  console.log("===========================================================\n");

  // Si quieres escribirlos a archivo JSON:
  // fs.writeFileSync("./logs/resultados_C4.json", JSON.stringify(resultadosTotales, null, 2));
});