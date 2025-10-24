// pages/HeaderPage.js
const BasePage = require('./BasePage');

class HeaderPage extends BasePage {
  constructor(page) {
    super(page); // 🔹 Llama al constructor de BasePage

    // 🔹 Elementos del header
    this.bannerSuperiorHref ="//*[contains(@class,'imageElementLink--global__header--top-bar')]";
    this.minicartButton = "//*[@href='#icon-minicart']";
    this.agregardireccionButton = "//*[@class='chedrauimx-locator-2-x-triggerAddress']"
    this.direccionButton = "//*[@class='chedrauimx-locator-2-x-triggerAddress']";
    this.ingresarButton = "//*[contains(text(),'Ingresar')]";
    this.principalHeader = "//*[@title='Envío gratis en la compra de productos de supermercado']";
    this.ayudaMessage = "//*[@data-testid='Icon--chat']";
    this.enviaraDiv = "//*[@class='chedrauimx-locator-2-x-triggerAddress']//p";
    this.buscandoInput = "//*[@placeholder='¿Qué estás buscando?']";
    this.logoImg = "//*[@alt='Logo']";
    this.holaUser = "//*[contains(text(),'Hola,')]";
    this.cerrarminicartButton = "//*[@class=' vtex-minicart-2-x-closeIcon']"; 
  }
}

module.exports = HeaderPage;
  