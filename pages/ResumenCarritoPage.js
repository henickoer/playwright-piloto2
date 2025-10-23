// pages/ResumenCarritoPage.js
const BasePage = require('./BasePage');

class ResumenCarritoPage extends BasePage {
  constructor(page) {
    super(page);
    this.page = page;

    // 🔹 Locators estáticos
    this.vaciarcarritoButton = "//*[contains(text(),'Vaciar carrito')]";
    this.comprarcarritoButton = "//*[contains(text(),'Comprar')]";
    this.cerrarminicartButton = "//*[contains(@class,'minicart')]//*[@href='#sti-close--line']";
    this.codigodescuentoInput = "//*[@placeholder='Escribe el código']";
    this.codigodescuentoaplicarButton = "//button//*[contains(text(),'Aplicar')]";
    this.continuarconlacompraButton = "//button//*[contains(text(),'Continuar con la compra')]";
    this.iralpagoButton = "//button[contains(text(),'Ir al pago')]";
    this.vamosacomprarButton = "//*[contains(text(),'Vamos a comprar')]";
    this.diasentrega = "//*[@class='chedrauimx-checkout-io-1-x-calendar__day']";
    this.horarioentregaButton = "//*[@class='chedrauimx-checkout-io-1-x-calendar__day-schedule']";
    this.contactonombreInput = "//*[@id='firstName']";
    this.contactoapellidoInput = "//*[@id='lastName']";
    this.contactotelefonoInput = "//*[@id='phoneNumber']";
    this.editardatoscontactoButton = "//*[@href='/checkout-io/profile' and @title]";
    this.editarentregaButton = "//*[@href='/checkout-io/shipping' and @title]";
    this.pagarButton = "//*[@id='payment-data-submit' and contains(@data-bind,('isPaymentButtonVisible'))]";
    this.irenvioButton = "//*[@type='submit' and contains(text(),'Ir al Envío')]";
  }

  // 🔹 Locators dinámicos
  diaenterga(num) {
    return `//*[@class='chedrauimx-checkout-io-1-x-calendar__day'][${num}]`;
  }

  formapagovaleschedrahuiOption(formapago) {
    return `//*[@class='payment-group-item-name' and contains(text(),'${formapago}')]`;
  }
}

module.exports = ResumenCarritoPage;
