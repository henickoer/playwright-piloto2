// pages/LoginPage.js
const BasePage = require('./BasePage');

class LoginPage extends BasePage {
  constructor(page) {
    super(page);

    this.emailInput = "//*[@id='email']";
    this.nextButton = "//*[@id='btn-next']";
    this.codigoInput = "//*[@id='codigo']";
    this.returnButton = "//button[contains(text(),'Regresar')]";
    this.loginButton = "//button[contains(text(),' Iniciar')]";
    this.resendHref = "//*[@id='linkReSend']";
    this.errorMessage = "//*[@id='error-messages']";
    this.facebookButton = "//*[@id='btn-facebook']";
    this.googleButton = "//*[@id='btn-google']";
    this.appleButton = "//*[@id='btn-apple']";
    this.terminosycondicionesHref = "//*[contains(text(),'condiciones')]";
    this.avisoprivacidadHref = "//*[contains(text(),'Aviso')]";
  }

    async goToLogin() {
        await this.navigate('https://www.chedraui.com.mx/');
    }

    async login(username, password) {
        await this.type(this.usernameInput, username);
        await this.type(this.passwordInput, password);
        await this.click(this.loginButton);
    }

    async getErrorMessage() {
        return await this.getText(this.errorMessage);
    }
}

module.exports = LoginPage;
