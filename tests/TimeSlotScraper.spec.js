// tests/TimeSlotScraper.spec.js
const { test, chromium } = require('@playwright/test');
const HeaderPage = require('../pages/HeaderPage');
const ProductosEncontradosPage = require('../pages/ProductosEncontradosPage'); 
const ResumenCarritoPage = require('../pages/ResumenCarritoPage');
const config = require('../utils/Environment');
const fs = require('fs');
const path = require('path');
const NavegacionActions = require('../utils/NavegacionActions');
const PdfPrinter = require('pdfmake');
const vfsFonts = require('pdfmake/build/vfs_fonts.js');


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
  await page.goto(config.urls.PROD);

  // Crear el locator sin await
  const headers = page.locator(headerPage.bannerSuperiorHref);
  // Seleccionar el primer elemento del locator
  const headerActual = headers.first();
  // Esperar a que esté visible y habilitado
  await headerActual.waitFor({ state: 'visible' });
 
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

  await carritoUtils.buscarYAgregarProducto(page, headerPage, productos, 'Aguacate Hass por Kg');
  await carritoUtils.buscarYAgregarProducto(page, headerPage, productos, 'Plátano Chiapas por Kg');
  await carritoUtils.buscarYAgregarProducto(page, headerPage, productos, 'Cebolla Blanca por kg');

  await page.goto(config.urls.PROD);

  await headerPage.safeClick(headerPage.minicartButton);
  await resumencarritos.safeClick(resumencarritos.comprarcarritoButton);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);

  await carritoUtils.avanzarCarrito(page, resumencarritos);
  await page.waitForTimeout(1000);
  await resumencarritos.safeClick(resumencarritos.cambiarDireccionLink);



  const sucursales = page.locator(resumencarritos.sucursales);
  const total = await sucursales.count();
  console.warn('total sucursales ' + total);
  
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
      console.log(`CONSOLE\n🗓️ total dias: ${totalDias}`);

      if (totalDias > 0) {
        for (let j = 0; j < totalDias; j++) {
          const diaTexto = await dias.nth(j).innerText();
          console.log(`\n🗓️ Día ${j + 1}: ${diaTexto.trim()}`);

          // ===> Capturamos TODOS los elementos de horarios en un array real:
          const horariosElementos = await page.$$(resumencarritos.horarioentregaButton);
          console.log(`⏱️ total de horarios encontrados para ${diaTexto.trim()}: ${horariosElementos.length}`);

          let listaHorarios = [];
          for (let k = 0; k < horariosElementos.length; k++) {
            const textoHorario = (await horariosElementos[k].innerText()).trim();

            // Separa el horario del precio si viene junto (por el símbolo $)
            const horarioLimpio = textoHorario.split('$')[0].trim();

            listaHorarios.push(horarioLimpio);
          }

          diasConfigurados.push({
            nombreDia: diaTexto.trim(),
            horarios: listaHorarios.join(', ') + '.'
          });

          console.log(`⏰ Horarios para "${diaTexto.trim()}": ${listaHorarios.join(', ')}.`);
        }
      } else {
        console.warn(`❌ Sucursal sin días configurados: ${nombreSucursal}`);
        sucursalesSinDias.push(nombreSucursal);
      }
    } catch (err) {
      console.warn(`⚠️ Error al obtener los días y horarios para ${nombreSucursal}:`, err);
      sucursalesSinDias.push(nombreSucursal);
    }

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
reporteTexto += `📅 Sucursales con días configurados:\n`;
console.log(`📅 Sucursales con días configurados:\n`);
for (const s of sucursalesEvaluadas.filter(s => s.dias.length > 0)) {
  console.log(`🏪 ${s.nombre}`);
  reporteTexto += `🏪 ${s.nombre}\n`;

  if (s.dias.length > 0) {
    for (const d of s.dias) {
      // d es ahora { nombreDia, horarios }
      const nombreDia = d.nombreDia || String(d);
      const horarios = d.horarios || '';

      console.log(`   - Día: ${nombreDia}`);
      console.log(`     Horarios: ${horarios}`);
      reporteTexto += ` - Día: ${nombreDia}\n`;
      reporteTexto += `   Horarios: ${horarios}\n`;
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

// --- Funciones auxiliares ---
function normalizarTexto(texto) {
  if (!texto || typeof texto !== "string") return "";
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Busca la sucursal (clave/nombre canónico) a partir de un texto de dirección.
 * Compara contra las direcciones definidas en config.sucursales (objeto clave:direccion).
 * Devuelve la clave encontrada o "Desconocida".
 */
function obtenerSucursalPorDireccion(texto) {

  const textoNormalizado = normalizarTexto(texto);
  const sucursalesConfig = config.sucursales || {};

  // Verifica si hay sucursales cargadas
  const entries = Object.entries(sucursalesConfig);

  // Si no hay sucursales, termina temprano
  if (entries.length === 0) {
    console.warn("⚠️ No hay sucursales configuradas en config.");
    return "Desconocida";
  }

  // Recorre todas las sucursales del config
  for (const [nombreSucursal, direccionConfigurada] of entries) {
    const dirConfigNorm = normalizarTexto(direccionConfigurada);
    const partes = dirConfigNorm.split(",");
    const aliasCorto =
      partes.length >= 2 ? `${partes[0]}, ${partes[1].trim()}` : dirConfigNorm;
    const primerFragmento = partes[0].trim();

    // Comparación de texto normalizado
    if (
      textoNormalizado.includes(primerFragmento) ||
      textoNormalizado.includes(aliasCorto)
    ) {
      console.warn("✅ Match encontrado →", nombreSucursal);
      return nombreSucursal;
    }
  }

  console.warn("❌ No hubo coincidencias. Se devolverá 'Desconocida'");
  return "Desconocida";
}


// --- Resto del código para generar PDF (sin cambios funcionales, sólo uso de la función corregida) ---

// --- Definición de fuentes usando VFS embebido ---
const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

const printer = new PdfPrinter(fonts);
printer.vfs = vfsFonts.vfs; // evita que busque archivos físicos

// --- Construcción dinámica del contenido PDF ---
const contenidoResumen = [
  { text: 'Resumen Final', style: 'titulo' },
  { text: `Fecha ejecución: ${fechaHora}`, style: 'subtitulo' },
  { text: '\n' },
  { text: `Total de sucursales evaluadas: ${totalSucursales}`, style: 'texto' },
  { text: `Total configuradas con días: ${totalConfiguradas}`, style: 'texto' },
  { text: `Total sin días configurados: ${totalNoConfiguradas}\n\n`, style: 'texto' },
  { text: 'Sucursales sin días configurados', style: 'encabezadoNaranja' }
];

if (sucursalesSinDias.length > 0) {
  sucursalesSinDias.forEach(nombre => {
    contenidoResumen.push({ text: `${nombre}`, style: 'texto' });
  });
} else {
  contenidoResumen.push({ text: 'Todas las sucursales se encuentran configuradas.', style: 'texto' });
}

// --- Salto de página antes del detalle ---
contenidoResumen.push({ text: '', pageBreak: 'after' });

// --- Detalle: cada sucursal en su propia página ---
const sucursalesConDias = sucursalesEvaluadas.filter(s => Array.isArray(s.dias) && s.dias.length > 0);
const contenidoDetalle = [];

for (const [index, s] of sucursalesConDias.entries()) {
  const nombreDetectado = obtenerSucursalPorDireccion(s.nombre);

  // --- Encabezado de sucursal ---
  contenidoDetalle.push({
    text: `Sucursal: ${nombreDetectado}`,
    style: 'encabezadoSucursal'
  });

  // Dirección
  contenidoDetalle.push({
    text: [
      { text: 'Dirección: ', color: '#ff8800', bold: true },
      { text: `${s.nombre}`, color: '#000000' }
    ],
    style: 'texto'
  });

  contenidoDetalle.push({ text: '\n', style: 'texto' });

  // Días y horarios
  for (const d of s.dias) {
    // Extraer fecha si viene en el mismo texto (ej: "Hoy\n31 de octubre")
    let nombreDia = d.nombreDia || '';
    let fecha = '';

    // Si el nombreDia tiene un salto de línea, separamos
    if (nombreDia.includes('\n')) {
      const partes = nombreDia.split('\n');
      nombreDia = partes[0].trim();
      fecha = partes[1] ? partes[1].trim() : '';
    }

    contenidoDetalle.push({
      text: [
        { text: 'Día: ', color: '#ff8800', bold: true },
        { text: `${nombreDia}${fecha ? ', ' + fecha : ''}`, color: '#000000' }
      ],
      style: 'texto'
    });

    // Horarios
    contenidoDetalle.push({
      text: [
        { text: 'Horarios: ', color: '#ff8800', bold: true },
        { text: `${d.horarios}`, color: '#000000' }
      ],
      style: 'texto'
    });

    contenidoDetalle.push({ text: '\n', style: 'texto' });
  }

  // Salto de página después de cada sucursal excepto la última
  if (index < sucursalesConDias.length - 1) {
    contenidoDetalle.push({ text: '', pageBreak: 'after' });
  }
}

// --- Definición del documento PDF ---
const docDefinition = {
  content: [
    ...contenidoResumen,
    ...contenidoDetalle
  ],
  styles: {
    titulo: { fontSize: 18, bold: true, color: '#ff8800', margin: [0,0,0,10] },
    subtitulo: { fontSize: 12, italics: true, color: '#555', margin: [0,0,0,15] },
    texto: { fontSize: 11, margin: [0,2,0,2] },
    encabezadoNaranja: { fontSize: 13, bold: true, color: '#ff8800', margin: [0,10,0,5] },
    encabezadoSucursal: { fontSize: 14, bold: true, color: '#ff6600', margin: [0,12,0,8] }
  },
  defaultStyle: { font: 'Roboto' },
  pageMargins: [40,60,40,60]
};

// --- Guardado del PDF ---
const reportPDF = path.join(__dirname, '../reports');
if (!fs.existsSync(reportPDF)) fs.mkdirSync(reportPDF);

const pdfPath = path.join(reportPDF, 'reporteSucursales.pdf');

if (fs.existsSync(pdfPath)) {
  try {
    fs.unlinkSync(pdfPath);
    console.log('🧹 PDF anterior eliminado correctamente.');
  } catch (err) {
    console.error('⚠️ No se pudo eliminar el PDF anterior:', err);
  }
}

const pdfDoc = printer.createPdfKitDocument(docDefinition);
const stream = fs.createWriteStream(pdfPath);

pdfDoc.pipe(stream);
pdfDoc.end();

stream.on('finish', () => {
  console.log(`📄 Reporte PDF generado en: ${pdfPath}`);
});

stream.on('error', (err) => {
  console.error('❌ Error al generar el PDF:', err);
});


// --- Limpieza final ---
await page.waitForTimeout(1500);
await resumencarritos.safeClick(resumencarritos.logoHref);
await page.waitForTimeout(1500);
await headerPage.safeClick(headerPage.minicartButton);
await page.waitForTimeout(1500);
await resumencarritos.safeClick(resumencarritos.vaciarcarritoButton);
await page.waitForTimeout(1500);
await resumencarritos.safeClick(resumencarritos.eliminarItemsCarritoButton);

});