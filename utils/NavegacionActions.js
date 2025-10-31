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
    
      // Crear el locator sin await

    const headers = page.locator(headerPage.bannerSuperiorHref);
    // Seleccionar el primer elemento del locator
    const headerActual = headers.first();
    // Esperar a que esté visible y habilitado
    await headerActual.waitFor({ state: 'visible' });
    page.waitForTimeout(500);
    
    await page.locator(headerPage.buscandoInput).focus();
    await headerPage.humanType(headerPage.buscandoInput, producto);

    const sugerido = await page.locator(productos.autocompletarbusqueda).first();
    await sugerido.waitFor({ state: 'visible' });
    await expect(sugerido).toBeEnabled();

    await sugerido.click();
    await productos.safeClick(productos.agregarproductolateralButton);
    await headerPage.safeClick(await headerPage.logoImg);
  }
}

module.exports = NavegacionActions;
