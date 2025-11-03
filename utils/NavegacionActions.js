const { expect } = require('@playwright/test');


class NavegacionActions {
    
  /**
   * Avanza dinámicamente por el flujo del carrito (paso 1 → 2 → 3)
   * @param {import('playwright').Page} page - instancia de Playwright
   * @param {Object} resumencarritos - objeto con locators y URLs
   * @param {number} maxRetries - máximo de intentos
   */

  async avanzarCarrito(page, resumencarritos, maxRetries = 5) {
    const currentUrl = page.url();

    if (maxRetries <= 0) {
      console.warn("Retries actual: "+maxRetries+" mientras nos encontramos en: \n"+currentUrl);
      throw new Error('No se pudo avanzar a paso 2 o 3 después de múltiples intentos.');
    }

    if (currentUrl.includes(resumencarritos.paso3URL)) {
      console.warn('Ya estamos en paso 3, listo para continuar.');
      await page.waitForTimeout(1000);
      return;
    }

    if (currentUrl.includes(resumencarritos.paso2URL)) {
      console.warn('Estamos en paso 2, completando datos...');
      await resumencarritos.humanType(resumencarritos.contactonombreInput, 'Joaquin');
      await resumencarritos.humanType(resumencarritos.contactoapellidoInput, 'Soto Castillo');
      await resumencarritos.humanType(resumencarritos.contactotelefonoInput, '5550553518');
      await page.waitForTimeout(2000);
      await resumencarritos.safeClick(resumencarritos.irenvioButton);
      await page.waitForTimeout(2000);

      return await this.avanzarCarrito(page, resumencarritos, maxRetries - 1);
    }

    if (currentUrl.includes(resumencarritos.paso1URL)) {

      console.warn(`Estamos en paso 1. Intentando avanzar... Reintentos restantes: ${maxRetries}`);
      await page.waitForTimeout(1000);
      await resumencarritos.safeClick(resumencarritos.continuarconlacompraButton);
      await page.waitForTimeout(1000);
  
      return await this.avanzarCarrito(page, resumencarritos, maxRetries - 1);
    } 

    console.warn('URL desconocida, esperando a que avance de manera natural...');
  }

  /**
   * Busca un producto y lo agrega desde la sugerencia
   * @param {import('playwright').Page} page - instancia de Playwright
   * @param {Object} headerPage - locators y métodos de header
   * @param {Object} productos - locators y métodos de productos
   * @param {string} producto - nombre del producto a buscar
   */

async buscarYAgregarProducto(page, headerPage, productos, producto) {

  console.warn("Se ingresar a BuscarYAgregarProducto");

  const headers = page.locator(headerPage.bannerSuperiorHref);
  const headerActual = headers.first();
  await headerActual.waitFor({ state: 'visible' });
  await page.waitForTimeout(500);

          const input = page.locator(headerPage.buscandoInput);

          // Espera hasta que el input sea visible
          await input.waitFor({ state: 'visible' });
          console.warn("Input Visible");

          // Evalúa el input en el DOM y extrae info
          const info = await input.evaluate(el => {
            return {
              outerHTML: el.outerHTML,       // Nodo completo como HTML
              clases: el.className,           // Clases actuales
              styles: window.getComputedStyle(el).cssText, // Estilos CSS calculados
              value: el.value                 // Valor del input
            };
          });

          console.warn('Clases:', info.clases);


  await page.locator(headerPage.buscandoInput).focus();
  await headerPage.humanType(headerPage.buscandoInput, producto);

  const sugerido = await page.locator(productos.autocompletarbusqueda).first();
  await sugerido.waitFor({ state: 'visible' });
  await sugerido.click();

  // --- Esperar dinámicamente al botón o al label de agotado ---
  const botonAgregar = page.locator(productos.agregarproductolateralButton);
  const labelAgotado = page.locator(productos.productoAgotadoButton); // <-- necesitas definir este locator

  try {
    await Promise.race([
      botonAgregar.waitFor({ state: 'visible', timeout: 5000 }),
      labelAgotado.waitFor({ state: 'visible', timeout: 5000 })
    ]);
  } catch (err) {
    console.warn(`⏳ Timeout esperando botón o label para producto: ${producto}`);
    return false; // no se pudo determinar
  }

  // --- Revisar cuál se mostró ---
  if (await botonAgregar.count() > 0 && await botonAgregar.isVisible()) {
    await botonAgregar.click();
    await headerPage.safeClick(await headerPage.logoImg);
    return true; // agregado con éxito
  }

  if (await labelAgotado.count() > 0 && await labelAgotado.isVisible()) {
    console.warn(`⚠️ Producto agotado: ${producto}`);
    return false; // no agregado
  }

  return false;
}


}
module.exports = NavegacionActions;
