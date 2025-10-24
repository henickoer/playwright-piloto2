// tests/loginCorreo.spec.js
const { test, chromium } = require('@playwright/test');
const HeaderPage = require('../pages/HeaderPage');
const ProductosEncontradosPage = require('../pages/ProductosEncontradosPage'); 
const ResumenCarritoPage = require('../pages/ResumenCarritoPage');
const config = require('../utils/Environment');
const { expect } = require('@playwright/test');
const fs = require('fs');

test('C1 - Cargar sesión existente', async () => {
  test.setTimeout(180000);
  // Lanzar un contexto persistente sin headless para depurar si quieres
  const context = await chromium.launchPersistentContext('', { headless: false });
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
  
  const producto = 'Tomate Saladet por Kg';
  await headerPage.humanType(headerPage.buscandoInput, producto);
  
  await page.locator(headerPage.buscandoInput).focus();
  const sugerido = page.locator(productos.autocompletarbusqueda).first();
  await sugerido.waitFor({ state: 'visible' });
  await expect(sugerido).toBeEnabled();

  // Hacemos click
  await sugerido.click();
  await productos.safeClick(productos.agregarproductolateralButton);
  await headerPage.safeClick(headerPage.minicartButton);
  await resumencarritos.safeClick(resumencarritos.comprarcarritoButton); 
  await page.waitForTimeout(2500); // 1000 ms = 1 segundo 
  await resumencarritos.safeClick(resumencarritos.continuarconlacompraButton); 

  await page.waitForTimeout(1000);
  await page.waitForLoadState('domcontentloaded');

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
      const dias = page.locator(resumencarritos.diasentrega);
      // Espera breve para dar chance a que carguen los días (sin depender de que existan)
      await page.waitForTimeout(1000);
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
        await page.pause();
        console.warn(`⚠️ Día ${j + 1}: Sin horarios configurados.`);
      }
    }

    // Volvemos a la lista de sucursales
    await resumencarritos.safeClick(resumencarritos.cambiarDireccionLink);
    await page.waitForTimeout(200);
  }

  // 🧾 Reporte final de todas las sucursales y las sin días configurados
  console.log('\n📌 Resumen final:');
  console.log('\n🏪 Sucursales evaluadas:');
  for (const s of sucursalesEvaluadas) {
    console.log(`- ${s}`);
  }

  if (sucursalesSinDias.length > 0) {
    console.warn('\n🚨 Sucursales sin días configurados:');
    for (const s of sucursalesSinDias) {
      console.warn(`- ${s}`);
    }
  } else {
    console.log('\n✅ Todas las sucursales tienen al menos un día configurado.');
  }

  await resumencarritos.safeClick(resumencarritos.verificaPedidoTab);
  await resumencarritos.safeClick(resumencarritos.vaciarcarritoButton);
  await resumencarritos.safeClick(resumencarritos.vaciarButton);

});
