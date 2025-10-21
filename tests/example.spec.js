import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/loginPage'; // <-- ¡Importamos nuestro Page Object!

test.describe('Autenticación de Usuario', () => {

  test('El usuario puede iniciar sesión con credenciales válidas', async ({ page }) => {
    
    // 1. CREAR: Crea una instancia de tu Page Object.
    const loginPage = new LoginPage(page);
    
    // 2. NAVEGAR: Usa el método del POM.
    await loginPage.goto();

    // 3. ACTUAR: Usa el método de acción del POM.
    await loginPage.login('miUsuarioValido', 'miPasswordValida');

    // 4. VERIFICAR (Assert): El test siempre debe verificar algo.
    // En este caso, esperamos que la URL cambie a la del 'dashboard'.
    await expect(page).toHaveURL('https://tu-sitio.com/dashboard');
  });

  test('El usuario ve un error con credenciales inválidas', async ({ page }) => {
    
    const loginPage = new LoginPage(page);
    
    await loginPage.goto();
    await loginPage.login('usuarioInvalido', 'passInvalido');

    // 4. VERIFICAR: Usamos un locator del POM para la aserción.
    // Esperamos que el locator 'mensajeError' esté visible.
    await expect(loginPage.mensajeError).toBeVisible();
    await expect(loginPage.mensajeError).toHaveText('Error: Usuario o contraseña incorrectos.');
  });
});
