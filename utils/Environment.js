// utils/Environment.js
const ambiente = process.env.TEST_ENV || 'PROD'; // 'QA'
const headless = process.env.HEADLESS !== 'false'; // TRUE por defecto

const config = {
  ambiente,
  headless,

  urls: {
    PROD: 'https://www.chedraui.com.mx',
    QA: 'https://www.chedraui-qa.com.mx',
    PRODauth0: 'https://chedraui-prod.us.auth0.com',
    QAauth0: 'https://chedraui-prod-qa.us.auth0.com',
    misdatos: '/account#/mis-datos/',
  },

  getEnviromentURL() {
    return this.urls[this.ambiente] || this.urls.PROD;
  },

  mailslurp: {
    apiKey: "d1840d194ec422cbe0664c8985d1afe8cec89868d0882c9586aa8f146533ce65",
    inboxId: "483078d1-cc0b-4078-bde0-c9dece2b875d",
    emailAddress: "483078d1-cc0b-4078-bde0-c9dece2b875d@mailslurp.info",
  },

  emails: {
    validUser: process.env.EMAIL_VALID_USER || 'usuario.valido@dominio.com',
    invalidUser: process.env.EMAIL_INVALID_USER || 'invalido@abc',
    noRegistrado: process.env.EMAIL_NO_REGISTRADO || 'noexistente@dominio.com',
  },

  timeouts: {
    waitForEmail: 200000,
    redirect: 10000,
    retryClick: 5000,
  },
};

module.exports = config;
