// pages/ProductosEncontradosPage.js
const BasePage = require('./BasePage');
const { expect } = require('@playwright/test');


class ProductosEncontradosPage extends BasePage {
  constructor(page) {
    super(page);
    this.page = page;

    // 🔹 Locators estáticos
    this.borrarCampoBusquedaButton = "//*[@aria-label='Borrar campo de búsqueda']";
    this.orderporSelect = "//*[contains(@class,'orderByText')]";
    this.preciobusquedaLabel = "//*[@id='gallery-layout-container']/div[1]/section/a/article/div[4]/div/div[1]/span[1]";
    this.autocompletarbusqueda = "//*[@data-af-element='search-autocomplete']//span[contains(@class,'global__vitrina__h--name t-small')]";
    this.agregarproductolateralButton = "//*[@class='sellerText']/../../../../../../../../..//*[@type='button' and contains(@class,'chedrauimx-add-to-cart')]";
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
