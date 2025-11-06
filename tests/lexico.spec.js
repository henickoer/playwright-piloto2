// tests/TimeSlotScraper.spec.js
const { test, chromium } = require('@playwright/test');
const HeaderPage = require('../pages/HeaderPage');
const ProductosEncontradosPage = require('../pages/ProductosEncontradosPage'); 
const config = require('../utils/Environment');
const fs = require('fs');
const NavegacionActions = require('../utils/NavegacionActions');
const { getExcelData } = require('../utils/excelReader');
const ResumenCarritoPage = require('../pages/ResumenCarritoPage');

test('C1 - Lexico - Errores Ortograficos', async () => {
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
    await page.goto(config.urls.PROD);
    await page.evaluate((data) => {
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, value);
      }
    }, localStorageData);
  }

const excelurl = '.\\data\\ChedrahuiQA_Lexico.xlsx';
const excelhoja = 'Errores Ortográficos';
const data = getExcelData(excelurl, excelhoja);



console.log(data);

    for (const row of data) {
    test(`Validar término "${row['Término']}" → ${row['Equivalencia']}`, async ({ page }) => {
        // Ejemplo de uso del valor
        console.log(`🔹 Equivalencia esperada: ${row['Equivalencia']}`);
        const Equivalencia = row['Equivalencia'];
        console.log(`🔹 Término: ${row['Término']}`);
        const Termino = row['Término'];
        
        const resultado = await Promise.race([
            page.locator(productosPage.sinresultadosLabel).waitFor({ state: 'visible',timeout: 5000 }),
            page.locator(productosPage.resultadobusquedaLabel).first().waitFor({ state: 'visible',timeout: 5000 })
        ]);

        if (await page.locator(productosPage.sinresultadosLabel).isVisible()) {
            console.log('❌ No se encontraron resultados');
            } else {
            console.log('✅ Se encontraron productos');             
            const productos = page.locator(productosPage.resultadobusquedaLabel);
            const count = await productos.count();

            for (let i = 0; i < count; i++) {
                const textoProducto = await productos.nth(i).innerText();
                
                if (textoProducto.includes(Equivalencia)) {
                console.log(`✅ Producto encontrado contiene: ${Equivalencia}`);
                } else {
                console.log(`❌ Producto ${i + 1} no contiene: ${Equivalencia}`);
                }
            }
        }

        const sucursal = productos.getText(productos.produc)
        const Front = await sucursal.innerText();
     
    });
}





});