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
      await page.waitForTimeout(2000);
      return await this.avanzarCarrito(page, resumencarritos);
      
    }

    if (currentUrl.includes(resumencarritos.paso1URL)) {
      console.warn(`Estamos en paso 1. Intentando avanzar...`);
      await page.waitForTimeout(1000);
      await resumencarritos.safeClick(resumencarritos.continuarconlacompraButton);
      await page.waitForTimeout(2000);
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
      await headerPage.safeClick(await headerPage.logoImg);
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

  // --- 🔸 Si hay resultados, estabilizar el conteo ---
  if (await page.locator(productos.resultadobusquedaLabel).first().isVisible()) {

    let productosEncontrados = page.locator(`${productos.resultadobusquedaLabel} >> visible=true`);
    let prevCount = 0;
    let stableCount = 0;
    let visibles = 0;

    for (let i = 0; i < 5; i++) {
      const total = await productosEncontrados.count();
      visibles = 0;
      for (let j = 0; j < total; j++) {
        if (await productosEncontrados.nth(j).isVisible()) visibles++;
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

    // 🔥 Aquí agregamos tu condición ANTES del console.log final

    const hayMensajeNoResultados = await page
      .locator(productos.sinresultadosLabel)
      .isVisible()
      .catch(() => false);

    if (hayMensajeNoResultados) {
      console.log(`❌ El sistema muestra mensaje de "sin resultados". Los ${visibles} productos visibles son sugerencias.`);
      return false;
    }

    console.log(`🟢 Se encontraron ${visibles} productos reales (conteo estabilizado)`);
    return true;
  }

  // --- Si no hay resultados visibles ---
  console.log('❌ No se encontraron resultados');
  return false;
}

  /**
   * 🔹 Evalúa los resultados de búsqueda para errores ortográficos
   * @param {import('playwright').Page} page 
   * @param {Object} productos - page object de resultados
   * @param {Array<string>} equivalencias - palabras esperadas
   */
  async evaluarBusquedaErroresOrtograficos(page, productos, equivalencias) {
    let productosVisibles = page.locator(`${productos.resultadobusquedaLabel} >> visible=true`);
    const count = await productosVisibles.count();

    for (let i = 0; i < count; i++) {
      const textoProducto = (await productosVisibles.nth(i).innerText()).toLowerCase();
      console.log(`Texto del producto ${i}: ${textoProducto}`);

      const contiene = equivalencias.some(eq => textoProducto.includes(eq));

      if (contiene) {
        console.log(`✅ Producto ${i + 1} contiene al menos una equivalencia (${equivalencias.join(', ')})`);
      } else {
        console.log(`❌ Producto ${i + 1} no contiene ninguna equivalencia (${equivalencias.join(', ')})`);
      }
    }
  }

}

module.exports = NavegacionActions;
