// tests/loginCookie.spec.js
const { test, chromium } = require('@playwright/test');
const HeaderPage = require('../pages/HeaderPage');
const { loginConCorreo } = require('../utils/LoginActions');
const config = require('../utils/Environment');

test.describe('Login y sesión persistente', () => {
  let context;
  let page;
  let headerPage;
  

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', { headless: false });
    page = await context.newPage();

    headerPage = new HeaderPage(page);
    await loginConCorreo(page, headerPage, headerPage);

    // Guardar session en archivo
    //await context.storageState({ path: 'storageState.json' });
  });

  test('Test usando sesión guardada', async () => {
  
      console.log('✅ Login y sesión seteada correctamente.');
      
  });

  test.afterAll(async () => {
    await context.close();
  });
});
