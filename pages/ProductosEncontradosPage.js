// pages/ProductosEncontradosPage.js
const BasePage = require('./BasePage');

class ProductosEncontradosPage extends BasePage {
  constructor(page) {
    super(page);
    this.page = page;

    // 🔹 Locators estáticos
    this.orderporSelect = "//*[contains(@class,'orderByText')]";
    this.preciobusquedaLabel = "//*[@id='gallery-layout-container']/div[1]/section/a/article/div[4]/div/div[1]/span[1]";
  }

  // 🔹 Locators dinámicos
  agregarproductoacarritoButton(productname) {
    return `//*[contains(@class,'conditionalContainerTop')]/..//*[contains(@aria-label,'${productname}')]/../../..//*[@type='button' and contains(@class,'add-to-cart')]`;
  }

  agregarproductoafavoritosButton(productname) {
    return `//*[contains(@aria-label,'${productname}')]/..//*[contains(@class,'wishlistIconContainer')]//button`;
  }

  cantidadproductoagregadoButton(productname) {
    return `//*[contains(@aria-label,'${productname}')]//*[@inputmode="numeric"]`;
  }

  incrementarproductoButton(productname) {
    return `//*[contains(@aria-label,'${productname}')]//*[contains(@class,'chedrauiPlusButton')]`;
  }

  disminuirproductoButton(productname) {
    return `//*[contains(@aria-label,'${productname}')]//*[contains(@class,'chedrauiMinusButton')]`;
  }

  orderporOption(optionText) {
    return `//*[contains(@class,'orderBy')]//*[contains(text(),'${optionText}')]`;
  }

  filtrosbusquedaSpan(filtro) {
    return `//*[contains(@class,'filtersWrapper')]//*[contains(text(),'${filtro}')]`;
  }

  filtrobusquedaCheck(name) {
    return `//*[contains(@class,'checkbox__container')]//*[@name='${name}']`;
  }
}

module.exports = ProductosEncontradosPage;
