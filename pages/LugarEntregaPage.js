// pages/LugarEntregaPage.js
const BasePage = require('./BasePage');

class LugarEntregaPage extends BasePage {
  constructor(page) {
    super(page);

    this.enviaraTab = "//*[text()='Enviar a']";
    this.recogerTab = "//*[text()='Recoger en']";
    this.ubicacionactualButton = "//*[text()='Ubicación actual']";
    this.direccionbusquedaInput = "//*[contains(@class,'containerInputSearchAddress ')]//input";
    this.enviaraButton = "//*[text()='Enviar a esta dirección']";
    this.recogerenButton = "//*[text()='Recoger en esta tienda']";
    this.direccionopcionbusquedaSpan = "//*[contains(@class,'InputSelect__content absolute')]//span[@class]";
  }
}

module.exports = LugarEntregaPage;
