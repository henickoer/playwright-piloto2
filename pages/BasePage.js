// BasePage.js

const { expect } = require('@playwright/test');

class BasePage {
    constructor(page) {
        this.page = page; // instancia de Playwright
        this.aceptarCookiesButton = "//*[contains(@class,'cookiesButtonAccept')]";
    }

    // Navegar a una URL
    async navigate(url) {
        await this.page.goto(url);
    }

    // Hacer click de forma segura: espera que esté visible y habilitado
    async safeClick(selector) {
    const el = this.page.locator(selector).first();

    try {
        await this.page.waitForSelector(selector, { state: 'visible', timeout: 15000 });
        await this.page.waitForTimeout(300);

        await expect(el).toBeVisible({ timeout: 10000 });
        await expect(el).toBeEnabled({ timeout: 10000 });

        // 🔸 Chequeo opcional de overlay (no crítico)
        try {
            await this.page.waitForFunction(
                (selector) => {
                    const el = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                    if (!el) return false;
                    const rect = el.getBoundingClientRect();
                    const elOnTop = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
                    return el.contains(elOnTop);
                },
                selector,
                { timeout: 2000 } // más corto y tolerante
            );
        } catch {
            //console.warn(`⚠️ Overlay check falló, pero se continuará con el clic: ${selector}`);
        }

        // 🔁 Intento de clic con reintentos
        let clicked = false;
        for (let i = 0; i < 3 && !clicked; i++) {
            try {
                await el.click({ timeout: 10000, delay: 100 });
                clicked = true;
            } catch (err) {
                console.warn(`🔁 Retry ${i + 1} en safeClick(${selector}) por: ${err.message}`);
                await this.page.waitForTimeout(500);
            }
        }

        if (!clicked) throw new Error(`❌ No se pudo hacer clic en ${selector}`);

        } catch (error) {
            console.warn(`⚠️ Error en safeClick(${selector}): ${error.message}`);
            await this.page.screenshot({ path: `error_safeClick_${Date.now()}.png`, fullPage: true });
            throw error;
        }
    }

    // Llenar un input de forma segura: espera que esté visible
    async safeFill(selector, text) {
        const el = this.page.locator(selector);
        await el.waitFor({ state: 'visible' });
        await el.fill(text);
    }

    // Escribir texto como un humano
    async humanType(selector, text) {
        const el = this.page.locator(selector);
        await el.waitFor({ state: 'visible' });

        for (const char of text) {
            await el.type(char, { delay: 50 });
            //await this.page.keyboard.press('End');
        }
    }

    // Presionar Enter de forma segura en un input
    async safePressEnter(selector) {
        const el = this.page.locator(selector);
        await el.waitFor({ state: 'visible' });
        await el.press('Enter');
    }

    // Obtener texto de un elemento
    async getText(selector) {
        const el = this.page.locator(selector);
        await el.waitFor({ state: 'visible' });
        return await el.textContent();
    }

    // Verificar si un elemento es visible
    async isVisible(selector) {
        const el = this.page.locator(selector);
        return await el.isVisible();
    }

    // Esperar que un elemento esté habilitado (no deshabilitado)
    async waitForEnabled(selector) {
        const el = this.page.locator(selector);
        await el.waitFor({ state: 'visible' });
        await el.waitFor({ state: 'enabled' });
    }

    // Esperar un tiempo específico (ms)
    async wait(ms) {
        await this.page.waitForTimeout(ms);
    }

    // Esperar y hacer click en el primer resultado de autocompletar (ejemplo VTEX)
    async clickFirstAutocomplete(selector, itemXPath) {
        const input = this.page.locator(selector);
        await input.waitFor({ state: 'visible' });

        const primerItem = this.page.locator(itemXPath);
        await primerItem.waitFor({ state: 'visible' });
        await primerItem.click();
    }
}

module.exports = BasePage;
