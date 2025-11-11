const { test, chromium } = require('@playwright/test');
const HeaderPage = require('../pages/HeaderPage');
const ProductosEncontradosPage = require('../pages/ProductosEncontradosPage'); 
const config = require('../utils/Environment');
const fs = require('fs');
const NavegacionActions = require('../utils/NavegacionActions');
const { getExcelData } = require('../utils/excelReader');
const ResumenCarritoPage = require('../pages/ResumenCarritoPage');

const excelurl = '.\\data\\ChedrahuiQA_Lexico.xlsx';
const excelhoja = 'Errores Ortográficos';
const data = getExcelData(excelurl, excelhoja);

test('Validar términos desde Excel en una sola sesión', async () => {
  test.setTimeout(900000); // aumenta tiempo total del test

  // 🔹 Lanzar navegador una sola vez
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: ['--start-maximized']
  });
  const page = await context.newPage();

  const headerPage = new HeaderPage(page);
  const resumencarritos = new ResumenCarritoPage(page);
  const productosPage = new ProductosEncontradosPage(page);
  const carritoUtils = new NavegacionActions();

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

  // 🔹 Iterar todos los registros del Excel en la misma sesión
  for (const row of data) {
    const Termino = row['Término'];
    const equivalencias = row['Equivalencia']
      .split(',')
      .map(e => e.trim().toLowerCase());

    console.log(`\n==============================`);
    console.log(`🔹 Buscando término: ${Termino}`);
    console.log(`   Equivalencias esperadas: ${equivalencias.join(', ')}`);
    console.log(`==============================`);

    // Buscar el producto
    await carritoUtils.buscarProducto(page, headerPage,productosPage , Termino);

    // Esperar resultados o mensaje sin resultados
    await Promise.race([
      page.locator(productosPage.sinresultadosLabel).waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
      page.locator(productosPage.resultadobusquedaLabel).first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
    ]);

    // Validar resultados
    if (await page.locator(productosPage.sinresultadosLabel).isVisible()) {
      console.log('❌ No se encontraron resultados');
    } else {
      console.log('✅ Se encontraron productos');

      let productos = page.locator(`${productosPage.resultadobusquedaLabel} >> visible=true`);
      let prevCount = 0;
      let stableCount = 0;

      for (let i = 0; i < 5; i++) {
        const total = await productos.count();
        let visibles = 0;
        for (let j = 0; j < total; j++) {
          if (await productos.nth(j).isVisible()) visibles++;
        }
        if (visibles === prevCount) {
          stableCount++;
          if (stableCount >= 2) break;
        } else {
          stableCount = 0;
        }
        prevCount = visibles;
        await page.waitForTimeout(500);
      }

      console.log(`🟢 Se encontraron ${prevCount} productos visibles (conteo estabilizado)`);

      productos = page.locator(`${productosPage.resultadobusquedaLabel} >> visible=true`);
      const count = await productos.count();

      for (let i = 0; i < count; i++) {
        const textoProducto = (await productos.nth(i).innerText()).toLowerCase();
        console.log(`Texto del producto ${i}: ${textoProducto}`);

        const contiene = equivalencias.some(eq => textoProducto.includes(eq));

        if (contiene) {
          console.log(`✅ Producto ${i + 1} contiene al menos una equivalencia (${equivalencias.join(', ')})`);
        } else {
          console.log(`❌ Producto ${i + 1} no contiene ninguna equivalencia (${equivalencias.join(', ')})`);
        }
      }
    }

    // 🔸 Pequeña pausa entre búsquedas para evitar sobrecarga
    await page.waitForTimeout(1000);
  }

  // Cerrar navegador al final
  await context.close();
});
