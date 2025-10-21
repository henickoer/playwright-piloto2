import { type Page, type Locator } from '@playwright/test';

// 'export' permite que esta clase sea usada en otros archivos (tus tests).
export class LoginPage {
  
  // 1. Declarar las variables de la clase
  // 'readonly' significa que no cambiarán.
  // 'Page' es el objeto navegador que controla la pestaña.
  readonly page: Page;
  
  // 'Locator' es la "pista" para encontrar el elemento.
  readonly inputUsername: Locator;
  readonly inputPassword: Locator;
  readonly botonLogin: Locator;
  readonly mensajeError: Locator;

  // 2. El Constructor (se ejecuta cuando creas una 'new LoginPage()')
  constructor(page: Page) {
    // Guarda la 'page' que nos pasa el test para poder usarla.
    this.page = page;

    // 3. Definir los Locators (¡Usando las mejores prácticas!)
    // Aquí centralizas todos tus selectores.
    this.inputUsername = page.getByLabel('Username'); // Busca un <label>
    this.inputPassword = page.getByLabel('Password');
    this.botonLogin = page.getByRole('button', { name: 'Log in' });
    this.mensajeError = page.getByTestId('error-message'); // Si tuvieras un 'data-testid'
  }

  // 4. Métodos (Acciones del usuario)
  // Creamos funciones que agrupan acciones.
  
  /**
   * Navega a la página de login.
   */
  async goto() {
    await this.page.goto('https://tu-sitio.com/login'); // ¡Cambia esta URL!
  }

  /**
   * Llena el formulario de login y lo envía.
   * @param username - El nombre de usuario.
   * @param password - La contraseña.
   */
  async login(username: string, password: string) {
    await this.inputUsername.fill(username);
    await this.inputPassword.fill(password);
    await this.botonLogin.click();
  }
}