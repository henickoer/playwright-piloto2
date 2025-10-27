// tests/loginCorreo.spec.js
const { test, chromium } = require('@playwright/test');
const HeaderPage = require('../pages/HeaderPage');
const ProductosEncontradosPage = require('../pages/ProductosEncontradosPage'); 
const ResumenCarritoPage = require('../pages/ResumenCarritoPage');
const config = require('../utils/Environment');
const fs = require('fs');
const path = require('path');
const NavegacionActions = require('../utils/NavegacionActions');

test('C1 - TimeSlot Scraper', async () => { 
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

  // --- Flujo principal ---
  await page.goto(config.urls.PROD);
  await headerPage.safeClick(headerPage.aceptarCookiesButton);
  await headerPage.safeClick(headerPage.bannerSuperiorHref);

  await headerPage.safeClick(headerPage.minicartButton);  
  await page.waitForTimeout(2000);

  const vaciarButton = page.locator(resumencarritos.vaciarcarritoButton);
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

  await carritoUtils.buscarYAgregarProducto(page, headerPage, productos, 'Plátano Chiapas por Kg');
  await carritoUtils.buscarYAgregarProducto(page, headerPage, productos, 'Cebolla Blanca por kg');
  await carritoUtils.buscarYAgregarProducto(page, headerPage, productos, 'Aguacate Hass por Kg');

  await page.goto(config.urls.PROD);

  await headerPage.safeClick(headerPage.minicartButton);
  await resumencarritos.safeClick(resumencarritos.comprarcarritoButton);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  await carritoUtils.avanzarCarrito(page, resumencarritos);
  await resumencarritos.safeClick(resumencarritos.cambiarDireccionLink);

  const sucursales = page.locator(resumencarritos.sucursales);
  const total = await sucursales.count();
  //console.warn('total sucursales ' + total);

  // --- Arreglos de control ---
  const sucursalesEvaluadas = [];
  const sucursalesSinDias = [];

  // --- Recorremos todas las sucursales ---
  for (let i = 0; i < total; i++) {
    const sucursal = sucursales.nth(0); // Siempre la primera
    await sucursal.scrollIntoViewIfNeeded();
    const nombreSucursal = (await sucursal.innerText()).trim();
    console.log(`🏪 Revisando sucursal ${i + 1}: ${nombreSucursal}`);

    await sucursal.click();
    await resumencarritos.safeClick(resumencarritos.aceptarCambioDireccionButton);
    await page.waitForTimeout(1500);

    let diasConfigurados = [];

    try {
      await page.waitForTimeout(4500);
      const dias = page.locator(resumencarritos.diasentrega);
      const totalDias = await dias.count();

      if (totalDias > 0) {
        for (let j = 0; j < totalDias; j++) {
          const diaTexto = await dias.nth(j).innerText();
          diasConfigurados.push(diaTexto.trim());
          //console.log(`🗓️ Día ${j + 1}: ${diaTexto}`);
        }
      } else {
        console.warn(`❌ Sucursal sin días configurados: ${nombreSucursal}`);
        sucursalesSinDias.push(nombreSucursal);
      }
    } catch {
      //console.warn(`⚠️ Error al obtener los días para ${nombreSucursal}`);
      sucursalesSinDias.push(nombreSucursal);
    }

    // Guardamos la sucursal con su lista de días
    sucursalesEvaluadas.push({
      nombre: nombreSucursal,
      dias: diasConfigurados
    });

    await resumencarritos.safeClick(resumencarritos.cambiarDireccionLink);
    await page.waitForTimeout(200);
  }

// --- Reporte Final ---
const fechaHora = new Date().toLocaleString('es-MX', {
  timeZone: 'America/Mexico_City',
  hour12: false
});

// Cálculos de totales
const totalSucursales = sucursalesEvaluadas.length;
const totalConfiguradas = sucursalesEvaluadas.filter(s => s.dias.length > 0).length;
const totalNoConfiguradas = totalSucursales - totalConfiguradas;

// Impresión general en consola
console.log('\n📌 Resumen final:');
console.log(`🕒 Fecha de ejecución: ${fechaHora}`);
console.log(`🏬 Total de sucursales evaluadas: ${totalSucursales}`);
console.log(`✅ Total configuradas con días: ${totalConfiguradas}`);
console.log(`🚫 Total sin días configurados: ${totalNoConfiguradas}\n`);

// --- Construcción base del reporte (texto y XML) ---
let reporteTexto = `📌 Resumen final\nFecha ejecución: ${fechaHora}\n`;
reporteTexto += `🏬 Total de sucursales evaluadas: ${totalSucursales}\n`;
reporteTexto += `✅ Total configuradas con días: ${totalConfiguradas}\n`;
reporteTexto += `🚫 Total sin días configurados: ${totalNoConfiguradas}\n\n`;

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
xml += `<testsuite name="Evaluación de Sucursales" tests="${totalSucursales}">\n`;

// --- Desglose de sucursales sin días configurados ---
reporteTexto += `🧾 Sucursales sin días configurados:\n`;
if (sucursalesSinDias.length > 0) {
  for (const nombre of sucursalesSinDias) {
    console.log(`❌ ${nombre}`);
    reporteTexto += `❌ ${nombre}\n`;
  }
} else {
  console.log(`✅ Todas las sucursales tienen días configurados.`);
  reporteTexto += `✅ Todas las sucursales tienen días configurados.\n`;
}
reporteTexto += `\n`;

// --- Desglose de sucursales con días configurados ---
reporteTexto += `📅 Sucursales con días configurados:\n`;
console.log(`📅 Sucursales con días configurados:\n`);
for (const s of sucursalesEvaluadas.filter(s => s.dias.length > 0)) {
  console.log(`🏪 ${s.nombre}`);
  reporteTexto += `🏪 ${s.nombre}\n`;

  if (s.dias.length > 0) {
    for (const d of s.dias) {
      console.log(`   - ${d}`);
      reporteTexto += `   - ${d}\n`;
    }
  } else {
    console.log(`   🚫 Sin días configurados`);
    reporteTexto += `   🚫 Sin días configurados\n`;
  }

  reporteTexto += `\n`;
  console.log('');
}

// --- XML para cada sucursal ---
for (const s of sucursalesEvaluadas) {
  if (s.dias.length > 0) {
    xml += `  <testcase classname="Sucursales" name="${s.nombre}"/>\n`;
  } else {
    xml += `  <testcase classname="Sucursales" name="${s.nombre}">\n`;
    xml += `    <failure message="Sucursal sin días configurados">No se encontraron días configurados</failure>\n`;
    xml += `  </testcase>\n`;
  }
}
xml += `</testsuite>\n`;

// --- Guardado de reportes ---
const reportDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir);

const reportPathTxt = path.join(reportDir, 'reporteSucursales.txt');
fs.writeFileSync(reportPathTxt, reporteTexto, 'utf8');
console.log(`\n📄 Reporte TXT generado en: ${reportPathTxt}`);

const reportPathXml = path.join(reportDir, 'reporteSucursales.xml');
fs.writeFileSync(reportPathXml, xml, 'utf8');
console.log(`📊 Reporte XML JUnit generado en: ${reportPathXml}`);



// --- Limpieza final ---
await resumencarritos.safeClick(resumencarritos.logoHref);
await headerPage.safeClick(headerPage.minicartButton);
await resumencarritos.safeClick(resumencarritos.vaciarcarritoButton);
await page.waitForTimeout(500);
await resumencarritos.safeClick(resumencarritos.eliminarItemsCarritoButton);

});