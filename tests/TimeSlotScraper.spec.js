// tests/loginCorreo.spec.js
const { test, chromium } = require('@playwright/test');
const HeaderPage = require('../pages/HeaderPage');
const ProductosEncontradosPage = require('../pages/ProductosEncontradosPage'); 
const ResumenCarritoPage = require('../pages/ResumenCarritoPage');
const config = require('../utils/Environment');
const { expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test('C1 - TimeSlot Scraper', async () => { 
  test.setTimeout(210000);
  // Lanzar un contexto persistente sin headless para depurar si quieres
const context = await chromium.launchPersistentContext('', {
  headless: false,
  args: ['--start-maximized']
  });
  const page = await context.newPage();

  // Crear HeaderPage con la página
  const headerPage = new HeaderPage(page);
  const resumencarritos = new ResumenCarritoPage(page);
  const productos = new ProductosEncontradosPage(page);


  // Cargar cookies si existe el archivo
  if (fs.existsSync('./sessionCookies.json')) { 
    const cookies = JSON.parse(fs.readFileSync('./sessionCookies.json'));
    for (const cookie of cookies) {
      await context.addCookies([cookie]);
    }
  }

  // Cargar localStorage si existe
  if (fs.existsSync('./sessionLocalStorage.json')) {
    const localStorageData = JSON.parse(fs.readFileSync('./sessionLocalStorage.json'));
    await page.goto(config.urls.PROD); // Necesario para setear localStorage
    await page.evaluate((data) => {
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, value);
      }
    }, localStorageData);
  }

  // Ir a la página principal
  await page.goto(config.urls.PROD);
  await headerPage.safeClick(headerPage.aceptarCookiesButton);
  await headerPage.safeClick(headerPage.bannerSuperiorHref);

        // await resumencarritos.safeClick(resumencarritos.logoHref);
        await headerPage.safeClick(headerPage.minicartButton);  
        await page.waitForTimeout(2000);
        // 🛒 Verificar si hay productos en el carrito antes de intentar vaciarlo
        const vaciarButton = await page.locator(resumencarritos.vaciarcarritoButton);
        if (await vaciarButton.count() > 0) {
          console.log('Vaciando el carrito...');
          await resumencarritos.safeClick(resumencarritos.vaciarcarritoButton);
          await resumencarritos.safeClick(resumencarritos.eliminarItemsCarritoButton);
          await headerPage.safeClick(headerPage.cerrarminicartButton);
        }else {
          await headerPage.safeClick(headerPage.cerrarminicartButton);
          console.log('🛒 El carrito ya está vacío.');
        }


  
  const producto = 'Plátano Chiapas por Kg';
  const producto2 = 'Cebolla Blanca por kg';
  const producto3 = 'Aguacate Hass por Kg';

  

  await page.locator(headerPage.buscandoInput).focus();
  await headerPage.humanType(headerPage.buscandoInput, producto);
  const sugerido = await page.locator(productos.autocompletarbusqueda).first();
  await sugerido.waitFor({ state: 'visible' });
  await expect(sugerido).toBeEnabled();
  // Hacemos click
  await sugerido.click();
  await productos.safeClick(productos.agregarproductolateralButton);
  await headerPage.safeClick(await headerPage.logoImg);

  await page.locator(headerPage.bannerSuperiorHref).waitFor({ state: 'visible' });
  await page.locator(headerPage.buscandoInput).focus();
  await headerPage.humanType(headerPage.buscandoInput, producto2);
  const sugerido2 = await page.locator(productos.autocompletarbusqueda).first();
  await sugerido2.waitFor({ state: 'visible' });
  await expect(sugerido2).toBeEnabled();
  // Hacemos click
  await sugerido2.click();
  await productos.safeClick(productos.agregarproductolateralButton);
  await headerPage.safeClick(await headerPage.logoImg);

  await page.locator(headerPage.bannerSuperiorHref).waitFor({ state: 'visible' });
  await page.locator(headerPage.buscandoInput).focus();
  await headerPage.humanType(headerPage.buscandoInput, producto3);
  const sugerido3 = await page.locator(productos.autocompletarbusqueda).first();
  await sugerido3.waitFor({ state: 'visible' });

  await expect(sugerido3).toBeEnabled();
  // Hacemos click
  await sugerido3.click();
  await productos.safeClick(productos.agregarproductolateralButton);


  await headerPage.safeClick(headerPage.minicartButton);
  await resumencarritos.safeClick(resumencarritos.comprarcarritoButton);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(6000); // 1000 ms = 1 segundo 
  await resumencarritos.safeClick(resumencarritos.continuarconlacompraButton); 
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(4000);
  
  // Obtener la URL actual
  const currentUrl = await page.url();

  // Evaluar si estamos en el paso 3 (shipping)
  if (!currentUrl.includes('/checkout-io/shipping')) {
    console.warn('No estamos en el paso 3, completando paso 2...');
       
    await resumencarritos.humanType(resumencarritos.contactonombreInput,'Joaquin');
    await resumencarritos.humanType(resumencarritos.contactoapellidoInput,'Soto Castillo');
    await resumencarritos.humanType(resumencarritos.contactotelefonoInput,'5550553518');
    await page.waitForTimeout(3000);
    await resumencarritos.safeClick(resumencarritos.irenvioButton);

  } else{
       console.warn('Se encontró habilitado: '+resumencarritos.programaEntregaActivoButton);
  }
  

  await resumencarritos.safeClick(resumencarritos.cambiarDireccionLink);
  const sucursales = await page.locator(resumencarritos.sucursales);
  const total = await sucursales.count();
  console.warn('total sucursales '+total);

  // 🔹 Arreglos para registrar todas las sucursales evaluadas y las sin días configurados
  const sucursalesEvaluadas = [];
  const sucursalesSinDias = [];

  for (let i = 0; i < total; i++) {
    const sucursal = sucursales.nth(0); // Siempre seleccionamos el primero, ya que las sucursales se reordenan
    await sucursal.scrollIntoViewIfNeeded();
    const nombreSucursal = await sucursal.innerText();
    console.log(`🏪 Revisando sucursal ${i + 1}: ${nombreSucursal}`);

    // Guardamos la sucursal evaluada
    sucursalesEvaluadas.push(nombreSucursal);

    await sucursal.click();
    await resumencarritos.safeClick(resumencarritos.aceptarCambioDireccionButton);
    await page.waitForTimeout(1500); // Pequeña espera para que cargue el panel de días

    // 🔸 Intentamos leer los días sin que el test falle si no hay ninguno
    let totalDias = 0;
    try {
      await page.waitForTimeout(4500);
      const dias = await page.locator(resumencarritos.diasentrega);
      // Espera breve para dar chance a que carguen los días (sin depender de que existan)
      totalDias = await dias.count();
    } catch (e) {
      console.warn(`⚠️ No se pudieron obtener los días para ${nombreSucursal}`);
    }

    if (totalDias === 0) {
      console.warn(`❌ Sucursal sin días configurados: ${nombreSucursal}`);
      sucursalesSinDias.push(nombreSucursal); // ✅ Guardamos la sucursal en el array
    } else {
      console.log(`📅 ${totalDias} días configurados en ${nombreSucursal}`);
    }

    // 🔹 Si tiene días, puedes recorrerlos como antes
    for (let j = 0; j < totalDias; j++) {
      const diaSelector = resumencarritos.diaenterga(j + 1);
      const dia = page.locator(diaSelector);
      await dia.scrollIntoViewIfNeeded();

      const horarios = page.locator(resumencarritos.horarioentregaButton);
      const totalHorarios = await horarios.count();
      const visible = totalHorarios > 0 && (await horarios.first().isVisible());

      if (!visible) {
        //await page.pause();
        console.warn(`⚠️ Día ${j + 1}: Sin horarios configurados.`);
      }
    }

    // Volvemos a la lista de sucursales
    await resumencarritos.safeClick(resumencarritos.cambiarDireccionLink);
    await page.waitForTimeout(200);
  }

  // Reporte
        // 🧾 Reporte final de todas las sucursales y las sin días configurados
      console.log('\n📌 Resumen final:');
      console.log('\n🏪 Sucursales evaluadas:');
      for (const s of sucursalesEvaluadas) {
        console.log(`- ${s}`);
      }

      let reporteTexto = `📌 Resumen final\n\n🏪 Sucursales evaluadas:\n`;
      reporteTexto += sucursalesEvaluadas.map(s => `- ${s}`).join('\n');

      if (sucursalesSinDias.length > 0) {
        console.warn('\n🚨 Sucursales sin días configurados:');
        for (const s of sucursalesSinDias) {
          console.warn(`- ${s}`);
        }
        reporteTexto += `\n\n🚨 Sucursales sin días configurados:\n`;
        reporteTexto += sucursalesSinDias.map(s => `- ${s}`).join('\n');
      } else {
        console.log('\n✅ Todas las sucursales tienen al menos un día configurado.');
        reporteTexto += `\n\n✅ Todas las sucursales tienen al menos un día configurado.\n`;
      }

      // 🗂️ Guardar reporte como archivo TXT
      const reportDir = path.join(__dirname, '../reports');
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir);
      }

      const reportPathTxt = path.join(reportDir, 'reporteSucursales.txt');
      fs.writeFileSync(reportPathTxt, reporteTexto, 'utf8');
      console.log(`\n📄 Reporte TXT generado en: ${reportPathTxt}`);


      // 🧩 Generar reporte XML estilo JUnit
      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<testsuite name="Evaluación de Sucursales" tests="${sucursalesEvaluadas.length}">\n`;

      for (const sucursal of sucursalesEvaluadas) {
        if (sucursalesSinDias.includes(sucursal)) {
          xml += `  <testcase classname="Sucursales" name="${sucursal}">\n`;
          xml += `    <failure message="Sucursal sin días configurados">No se encontraron días configurados</failure>\n`;
          xml += `  </testcase>\n`;
        } else {
          xml += `  <testcase classname="Sucursales" name="${sucursal}"/>\n`;
        }
      }

      xml += `</testsuite>\n`;

      const reportPathXml = path.join(reportDir, 'reporteSucursales.xml');
      fs.writeFileSync(reportPathXml, xml, 'utf8');
      console.log(`📊 Reporte XML JUnit generado en: ${reportPathXml}`);



    

  await resumencarritos.safeClick(resumencarritos.logoHref);
  await headerPage.safeClick(headerPage.minicartButton);
  await resumencarritos.safeClick(resumencarritos.vaciarcarritoButton);
  await page.waitForTimeout(500);
  await resumencarritos.safeClick(resumencarritos.eliminarItemsCarritoButton);  

  /*
  await resumencarritos.safeClick(resumencarritos.verificaPedidoTab);
  await resumencarritos.safeClick(resumencarritos.vaciarcarritoButton);
  await resumencarritos.safeClick(resumencarritos.vaciarButton);
  */
});
