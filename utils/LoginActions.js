const config = require('./Environment');
const { getFixedInbox, waitForCode, deleteEmail } = require('./mailslurp-utils');
const { expect } = require('@playwright/test');
const fs = require('fs');

async function loginConCorreo(page, headerPage, loginPage) {
  const inbox = await getFixedInbox();
  const emailAddress = inbox.emailAddress;
  const inboxId = inbox.id;

  await deleteEmail(inboxId);

  // Visitar sitio principal
  await page.goto(config.urls.PROD);
  await page.waitForSelector('iframe#launcher', { state: 'visible', timeout: 30000 });

  if (!(await page.title()).toLowerCase().includes('supermercado')) {
    throw new Error('No se encontró "supermercado" en el título de la página');
  }

  // Ir al login
  await page.click(headerPage.ingresarButton);

  // Llenar email de forma "humana"
  await page.isVisible('#email');
  await headerPage.humanType('#email', emailAddress);

  // Esperar botón activo y clic
  const nextBtn = page.locator('#btn-next');
  await nextBtn.waitFor({ state: 'visible' });
  await expect(nextBtn).toBeEnabled();
  await nextBtn.click();

  // Verificar correo mostrado
  const displayedEmail = await page.textContent('#sendEmail');
  if (!displayedEmail.includes(inbox.emailAddress.split('@')[0])) {
    throw new Error(`El email mostrado no coincide: ${displayedEmail}`);
  }

  // Esperar código y llenar
  const code = await waitForCode(inboxId, config.timeouts.waitForEmail);
  await headerPage.humanType('#codigo', code);
  await page.click('#btn-login-passwordless');

  // Esperar redirección al home
  await page.waitForURL(config.urls.PROD, { timeout: 20000 });
  
  // ===== Guardar sesión =====
  console.log(' Login exitoso, guardando sesión...');

  // Guardar cookies
  const cookies = await page.context().cookies();
  fs.writeFileSync('sessionCookies.json', JSON.stringify(cookies, null, 2));

  // Guardar localStorage
  const localStorageData = await page.evaluate(() => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      data[key] = localStorage.getItem(key);
    }
    return data;
  });
  fs.writeFileSync('sessionLocalStorage.json', JSON.stringify(localStorageData, null, 2));

  console.log(' Sesión guardada en sessionCookies.json y sessionLocalStorage.json');
}




module.exports = { loginConCorreo };
