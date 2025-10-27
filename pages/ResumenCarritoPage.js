// pages/ResumenCarritoPage.js
const BasePage = require('./BasePage');

class ResumenCarritoPage extends BasePage {
  constructor(page) {
    super(page);
    this.page = page;

    // 🔹 Locators estáticos
    this.diasEntregaLabel = "//*[@class='chedrauimx-checkout-io-1-x-calendar__day-date']";
    this.paso1URL= "/checkout-io/cart";
    this.paso2URL= "/checkout-io/profile";
    this.paso3URL= "/checkout-io/shipping";
    this.paso4URL= "/checkout?checkout=io/#/payment";
    this.logoHref = "//*[@class='chedrauimx-checkout-io-1-x-header-io__containerHeader']//*[@href]";
    this.eliminarItemsCarritoButton = "//button[@class]//*[contains(text(),'Eliminar')]";
    this.aceptarCambioDireccionButton = "//*[@class='chedrauimx-checkout-io-1-x-alert--button-accept']";
    this.cambiarDireccionLink = "//*[contains(text(),'Selecciona otra dirección')]";
    this.verificaPedidoTab = "//*[@class='chedrauimx-checkout-io-1-x-timeline__label' and contains(text(),'Verifica tu pedido')]";
    this.completaTusDatosTab = "//*[@class='chedrauimx-checkout-io-1-x-timeline__step  chedrauimx-checkout-io-1-x-timeline__step ']//*[contains(text(),'Completa tus datos')]";
    this.programaEntregaActivoTab = "//*[contains(@class,'--active')]//*[contains(text(),'Programa tu entrega')]";
    this.vaciarcarritoButton = "//button[@class]//*[contains(text(),'Vaciar carrito')]";
    this.vaciarButton = "//button[@class='chedrauimx-checkout-io-1-x-alert--button-accept' and contains(text(),'Vaciar')]";
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
    this.irenvioButton = "//*[@type='submit' and contains(text(),'Ir al Envío') and @form='profile-form']";
    this.sucursales = "//*[@class='chedrauimx-checkout-io-1-x-address-list-container__list-button']";
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
