// BasePage.js
class BasePage {
    constructor(page) {
        this.page = page; // instancia de Playwright
    }

    // Navegar a una URL
    async navigate(url) {
        await this.page.goto(url);
    }

    // Hacer click de forma segura: espera que esté visible y habilitado
    async safeClick(selector) {
        const el = this.page.locator(selector);
        await el.waitFor({ state: 'visible' });
        await this.page.waitForFunction(el => !el.disabled, el);
        await el.click();
    }

    // Llenar un input de forma segura: espera que esté visible
    async safeFill(selector, text) {
        const el = this.page.locator(selector);
        await el.waitFor({ state: 'visible' });
        await el.fill(text);
    }

    async humanType(selector, text){
        
        const elemento = this.page.locator(selector); // guardar locator una vez
        await elemento.waitFor({ state: 'visible' });

        //await elemento.focus();
        //elemento.fill("");
        
        for (const char of text) {
            await elemento.type(char,{ delay: 50 }); 
            await this.page.keyboard.press('End');
        
        }
    }

    // Obtener texto de un elemento
    async getText(selector) {
        return await this.page.locator(selector).textContent();
    }

    // Verificar si un elemento es visible
    async isVisible(selector) {
        return await this.page.locator(selector).isVisible();
    }

    // Esperar que un elemento esté habilitado (no deshabilitado)
    async waitForEnabled(selector) {
        const el = this.page.locator(selector);
        await el.waitFor({ state: 'visible' });
        await this.page.waitForFunction(el => !el.disabled, el);
    }

    // Esperar un tiempo específico (ms)
    async wait(ms) {
        await this.page.waitForTimeout(ms);
    }
}

module.exports = BasePage;
