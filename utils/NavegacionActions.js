const { expect } = require('@playwright/test');

class NavegacionActions {
    
  async avanzarCarrito(page, resumencarritos) {
    const currentUrl = page.url();

    if (currentUrl.includes(resumencarritos.paso3URL)) {
      console.warn('Ya estamos en paso 3, listo para continuar.');
      await page.waitForTimeout(500);
    }

    if (currentUrl.includes(resumencarritos.paso2URL)) {
      console.warn('Estamos en paso 2, completando datos...');
      await resumencarritos.humanType(resumencarritos.contactonombreInput, 'Joaquin');
      await resumencarritos.humanType(resumencarritos.contactoapellidoInput, 'Soto Castillo');
      await resumencarritos.humanType(resumencarritos.contactotelefonoInput, '5550553518');
      await page.waitForSelector(resumencarritos.telefonoCapturadoCheck, { state: 'visible', timeout: 30000 });
      await resumencarritos.safeClick(resumencarritos.irenvioButton);
      await page.waitForTimeout(4000);
      return await this.avanzarCarrito(page, resumencarritos);
    }

    if (currentUrl.includes(resumencarritos.paso1URL)) {
      console.warn(`Estamos en paso 1. Intentando avanzar...`);
      await page.waitForTimeout(2000);
      await resumencarritos.safeClick(resumencarritos.continuarconlacompraButton);
      await page.waitForTimeout(3000);
      return await this.avanzarCarrito(page, resumencarritos);
    } 

    console.warn('URL desconocida, esperando a que avance de manera natural...');
    return;
  }

  async buscarYAgregarProducto(page, headerPage, productos, producto) {
    console.warn("Se ingresar a BuscarYAgregarProducto");
    await page.waitForSelector('iframe#launcher', { state: 'visible', timeout: 30000 });
    await page.locator(headerPage.buscandoInput).focus();
    await page.locator(headerPage.buscandoInput).fill("");
    await headerPage.humanType(headerPage.buscandoInput, producto);

    const sugerido = await page.locator(productos.autocompletarbusqueda).first();
    await sugerido.waitFor({ state: 'visible' });
    await sugerido.click();

    const botonAgregar = page.locator(productos.agregarproductolateralButton);
    const labelAgotado = page.locator(productos.productoAgotadoButton);

    try {
      await Promise.race([
        botonAgregar.waitFor({ state: 'visible', timeout: 5000 }),
        labelAgotado.waitFor({ state: 'visible', timeout: 5000 })
      ]);
    } catch (err) {
      console.warn(`⏳ Timeout esperando botón o label para producto: ${producto}`);
      return false;
    }

    if (await botonAgregar.count() > 0 && await botonAgregar.isVisible()) {
      await botonAgregar.click();
      await headerPage.safeClick(headerPage.logoImg);
      return true;
    }

    if (await labelAgotado.count() > 0 && await labelAgotado.isVisible()) {
      console.warn(`⚠️ Producto agotado: ${producto}`);
      return false;
    }

    return false;
  }

  /**
   * 🔹 Buscar producto con estabilización de resultados
   */
async buscarProducto(page, headerPage, productos, producto) {
  console.warn("Se ingresar a buscarProducto");

  await page.waitForSelector('iframe#launcher', { state: 'visible', timeout: 30000 });

  const input = page.locator(headerPage.buscandoInput);
  await input.waitFor({ state: 'visible' });

  await page.locator(headerPage.buscandoInput).focus();
  await page.locator(headerPage.buscandoInput).fill("");
  await headerPage.humanType(headerPage.buscandoInput, producto);
  await page.keyboard.press('Enter');

  // --- 🔸 Espera resultados o mensaje sin resultados ---
  await Promise.race([
    page.locator(productos.sinresultadosLabel).waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
    page.locator(productos.resultadobusquedaLabel).first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
  ]);



  // --- 🔸 Si hay resultados, estabilizar el conteo por visibilidad ---
  if (await page.locator(productos.resultadobusquedaLabel).first().isVisible()) {
    let elementos = page.locator(`${productos.resultadobusquedaLabel} >> visible=true`);

    let prevVisibleCount = -1;
    let stableRounds = 0;
    let visibles = 0;

    for (let i = 0; i < 10; i++) {

      elementos = page.locator(`${productos.resultadobusquedaLabel} >> visible=true`);
      let total = await elementos.count();
      visibles = 0;

      for (let j = 0; j < total; j++) {
        if (await elementos.nth(j).isVisible()) visibles++;
      }

      console.log(`Iteración ${i} → visibles: ${visibles}, prev: ${prevVisibleCount}`);

      if (visibles === prevVisibleCount) {
        stableRounds++;
        console.log(`Visibilidad estable (${stableRounds})`);

        // 🔥 Scroll hasta el botón "Next page"
        // Volver a leer después del scroll
        elementos = page.locator(`${productos.resultadobusquedaLabel} >> visible=true`);
        total = await elementos.count();
        console.log(`Después del scroll → total detectados: ${total}`);

        if (stableRounds >= 2) {
          console.log("🟢 Completado: la lista dejó de crecer");
          break;
        }

      } else {
        console.log(`❌ Cambio detectado (visibles: ${visibles}), reseteando...`);
        stableRounds = 0;
        prevVisibleCount = visibles;
        await page.locator('//*[@aria-label="Next page"]').scrollIntoViewIfNeeded();
        await page.locator('//*[@class="chedrauimx-search-result-3-x-orderBy--layout"]').scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);

        continue;
      }

      prevVisibleCount = visibles;
    }

    const hayMensajeNoResultados = await page
      .locator(productos.sinresultadosLabel)
      .isVisible()
      .catch(() => false);

    if (hayMensajeNoResultados) {
      console.log(`❌ El sistema muestra "sin resultados". Los ${visibles} visibles son sugerencias.`);
      return false;
    }

    console.log(`🟢 Conteo estabilizado: ${visibles} productos visibles reales.`);
    return true;
  }


  console.log('❌ No se encontraron resultados');
  return false;
}

async evaluarBusquedaErroresOrtograficos(page, productos, equivalencias) {

  const productosVisibles = page.locator(`${productos.resultadobusquedaLabel} >> visible=true`);
  await productosVisibles.first().waitFor({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);

  async function obtenerTextoConReintento(locator) {
    for (let intento = 0; intento < 3; intento++) {
      try {
        let txt = await locator.textContent({ timeout: 500 });
        if (txt && txt.trim().length > 0) {
          return txt.toLowerCase().trim();
        }
      } catch {}
      await new Promise(r => setTimeout(r, 250));
    }
    return null;
  }

  const count = await productosVisibles.count();

  let coincidencias = [];
  let noCoincidencias = [];
  let listaDetallada = [];

  for (let i = 0; i < count; i++) {

    let textoProducto = await obtenerTextoConReintento(productosVisibles.nth(i));

    if (!textoProducto) {
      console.log(`⚠️ No se pudo obtener innerText del producto ${i}, registrando como NO LEÍDO`);
      
      listaDetallada.push({
        texto: "[NO LEÍDO]",
        coincide: false
      });

      noCoincidencias.push("[NO LEÍDO]");
      continue;
    }

    const coincide = equivalencias.some(eq => textoProducto.includes(eq));

    if (coincide) coincidencias.push(textoProducto);
    else noCoincidencias.push(textoProducto);

    listaDetallada.push({
      texto: textoProducto,
      coincide
    });
  }

  return { coincidencias, noCoincidencias, listaDetallada };
}

async obtenerProductosEncontrados(page, productosPage) {

  await page.waitForTimeout(4000);
  const locator = page.locator(`${productosPage.resultadobusquedaLabel} >> visible=true`);
  const count = await locator.count();
  const textos = [];

  for (let i = 0; i < count; i++) {
    try {
      let txt = await locator.nth(i).textContent();
      if (txt && txt.trim().length > 0) {
        textos.push(txt.trim());
      }
    } catch (e) {
      console.warn("⚠ No se pudo leer un producto:", e);
    }
  }
  return textos;
}

}

module.exports = NavegacionActions;
