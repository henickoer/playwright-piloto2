const { test, chromium } = require('@playwright/test');
const HeaderPage = require('../../pages/HeaderPage');
const ProductosEncontradosPage = require('../../pages/ProductosEncontradosPage'); 
const config = require('../../utils/Environment');
const fs = require('fs');
const NavegacionActions = require('../../utils/NavegacionActions');
const { getExcelData } = require('../../utils/excelReader');
const ResumenCarritoPage = require('../../pages/ResumenCarritoPage');
const { generarReporteCoincidenciasPDF } = require('../../utils/creadorpdf');
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
    
    //AQUI SE REALIZA
    await page.waitForTimeout(500);
    await headerPage.safeClick(headerPage.logoImg);
    await page.waitForTimeout(200);
    await page.pause();
    await page.waitForSelector('iframe#launcher', { state: 'visible', timeout: 30000 });
   // await page.waitForTimeout(200);
  }

  // Generamos el PDF
  await generarReporteCoincidenciasPDF({
    nombreTestCase: "C1_ErroresOrtograficos",
    resultados: resultadosTotales         
  });
});

/*
test('C2 - Long Tail', async ({}, testInfo) => {
  const { page, headerPage, productosPage, carritoUtils } = testInfo;

  const data = getExcelData(excelurl, excellong);

  const resultadosTotales = [];

  for (const row of data) {
    const Termino = row['Término'];

    console.log(`\n=== Buscando: ${Termino} ===`);

    const hayResultados = await carritoUtils.buscarProducto(
      page,
      headerPage,
      productosPage,
      Termino
    );

    let productosEncontrados = [];

    if (hayResultados) {
      productosEncontrados = await carritoUtils.obtenerProductosEncontrados(
        page,
        productosPage
      );
    }

    resultadosTotales.push({
      termino: Termino,
      hayResultados,
      productosEncontrados
    });

    //AQUI SE REALIZA

    await headerPage.safeClick(headerPage.logoImg);
    await page.waitForTimeout(500);
    await page.waitForSelector('iframe#launcher', { state: 'visible', timeout: 30000 });

  }
  await generarReporteCoincidenciasPDF({
    nombreTestCase: "C2_LongTail",
    resultados: resultadosTotales
  });
});

test('C3 - Frecuencia Alta', async ({}, testInfo) => {
  const { page, headerPage, productosPage, carritoUtils } = testInfo;

  const data = getExcelData(excelurl, excelfrecuencia);

  const resultadosTotales = [];

  for (const row of data) {
    const Termino = row['Término'];

    console.log(`\n=== Buscando: ${Termino} ===`);

    const hayResultados = await carritoUtils.buscarProducto(
      page,
      headerPage,
      productosPage,
      Termino
    );

    let productosEncontrados = [];

    if (hayResultados) {
      productosEncontrados = await carritoUtils.obtenerProductosEncontrados(
        page,
        productosPage
      );
    }

    resultadosTotales.push({
      termino: Termino,
      hayResultados,
      productosEncontrados
    });

    //AQUI SE REALIZA
    await headerPage.safeClick(headerPage.logoImg);
    await page.waitForTimeout(500);
    await page.waitForSelector('iframe#launcher', { state: 'visible', timeout: 30000 });

  }

  await generarReporteCoincidenciasPDF({
    nombreTestCase: "C3_FrecuenciaAlta",
    resultados: resultadosTotales
  });
});

test('C4 - Semántico', async ({}, testInfo) => {
  const { page, headerPage, productosPage, carritoUtils } = testInfo;

  const data = getExcelData(excelurl, excelsemantico);

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

    //AQUI SE REALIZA
    await headerPage.safeClick(headerPage.logoImg);
    await page.waitForTimeout(500);
    await page.waitForSelector('iframe#launcher', { state: 'visible', timeout: 30000 });
  }

 const coincidenciasPDF = resultadosTotales.map((item, index) => ({
    step: `Producto ${index + 1}`,
    input: item.termino,
    resultado: item.hayResultados ? "Resultados encontrados" : "Sin resultados",
    detalle:
      `Equivalencias: ${item.equivalencias.join(', ')}\n\n` +
      `Coincidencias:\n${item.coincidencias.join('\n')}\n\n` +
      `No Coincidencias:\n${item.noCoincidencias.join('\n')}`
  }));

  await generarReporteCoincidenciasPDF({
    nombreTestCase: "C4_Semantico",
    resultados: resultadosTotales
  });

});
*/