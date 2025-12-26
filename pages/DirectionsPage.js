// pages/DirectionsPage.js
const BasePage = require('./BasePage');

class DirectionsPage extends BasePage {
  constructor(page) {
    super(page); // 🔹 Llama al constructor de BasePage

    // 🔹 Elementos del header
    this.editardireccionButton ="//*[@class='chedrauimx-locator-2-x-btnEditAddress']";
    this.seleccionarDireccionButton ="//*[@class='chedrauimx-locator-2-x-selectAddress  chedrauimx-locator-2-x-selectAddress_active']";
    this.direccionpropuestabusquedaOption = "//*[@class='chedrauimx-locator-2-x-InputSelect__content_select_list_item_store_text']";
    this.direccionbusquedaInput = "//*[contains(text(),'Encuentra tu dirección')]/../..//input"; 
    this.aliasotroButton = "//button//*[contains(text(),'Otro')]";
    this.aliasparejaButton ="//button//*[contains(text(),'Novi@')]";
    this.aliastrabajoButton ="//button//*[contains(text(),'Trabajo')]";
    this.aliascasaButton = "//button//*[contains(text(),'Casa')]";
    this.aliastextInput = "//input[@placeholder='Ingresa un alias para esta dirección']";
    this.guardardireccionButton = "//button//*[contains(text(),'Guardar dirección')]";
    this.enviarestadireccionButton = "//button//*[contains(text(),'Enviar a esta dirección')]";    

    
    }

    xpathDireccionEspecifica(direccion){
        return `//*[@class='flex flex-row items-center chedrauimx-locator-2-x-titleAddress']//*[contains(text(),'${direccion}')]`;
    }

    async SeleccionarDireccionEspecifica(direccion) {
        console.log(`Se inicia seleccion de direccion`);    
        const xpathdireccion = this.xpathDireccionEspecifica(direccion);
        console.log(`xpath es: `+ xpathdireccion);
        await this.page.click(xpathdireccion);
        console.log(`Se da clic en: `+ xpathdireccion);
        await this.page.click(this.enviarestadireccionButton);
        await this.page.waitForTimeout(6000);

    }

    async agregarDireccion(nombre, direccion) {
    console.log(`📝 Iniciando registro de dirección: ${nombre} (${direccion})`);

    try {
        // 1️⃣ Escribir dirección en el campo de búsqueda
        await this.humanType(this.direccionbusquedaInput, direccion);
        await this.wait(1000); // breve espera por sugerencias

        // 2️⃣ Esperar a que aparezca la sugerencia y hacer clic
         // 2️⃣ Esperar a que aparezca la sugerencia y hacer clic en la primera
        await this.page.locator(this.direccionpropuestabusquedaOption).first().waitFor({ state: 'visible', timeout: 10000 });
        await this.page.locator(this.direccionpropuestabusquedaOption).first().click();
        await this.wait(2000);
        // 3️⃣ Seleccionar “Otro” como alias
        await this.safeClick(this.aliasotroButton);
        // 4️⃣ Llenar campo de alias con el nombre de la sucursal
        await this.humanType(this.aliastextInput, nombre);
        // 5️⃣ Guardar dirección
        await this.safeClick(this.guardardireccionButton);
        console.log(`✅ Dirección "${nombre}" guardada correctamente.`);
        // 6️⃣ Esperar a que vuelva a cargar la lista y reactivar botón principal
        await this.page.waitForSelector('iframe#launcher', { state: 'visible', timeout: 30000 });
        await this.safeClick(this.seleccionarDireccionButton);

    } catch (error) {
        console.error(`❌ Error al agregar dirección "${nombre}": ${error.message}`);
        throw error;
    }
}


    
}

module.exports = DirectionsPage;
  