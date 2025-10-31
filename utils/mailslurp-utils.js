  // utils/mailslurp-utils.js
  const MailSlurp = require('mailslurp-client').default;
  const config = require('./Environment');
  const fs = require('fs');



  const mailslurp = new MailSlurp({ apiKey: process.env.MAILSLURP_API_KEY || config.mailslurp.apiKey });

  const inboxId = config.mailslurp.inboxId;
  const emailAddress = config.mailslurp.emailAddress;

  async function getFixedInbox() {
    return { id: inboxId, emailAddress };
  }

  async function deleteEmail(inboxId, timeoutMs = 100000) {
    const page = await mailslurp.inboxController.getInboxEmailsPaginated({ inboxId });
    if (!page || !page.content || page.content.length === 0) {
      console.log('[MailSlurp] Inbox ya está vacío.');
      return;
    }
    for (const email  of page.content) {
      await mailslurp.emailController.deleteEmail({ emailId: email.id });
      console.log(`[MailSlurp] Email eliminado: ${email.subject || email.id}`);
    }
  }

  async function waitForCode(inboxId, timeoutMs = 100000) {
    const email = await mailslurp.waitForLatestEmail(inboxId, timeoutMs);
    const match = email.body.match(/\b\d{6}\b/);
    if (!match) throw new Error("No se encontró código de 6 dígitos en el correo.");
    return match[0];
  }

  async function sendEmail(toList = config.correos, subject, body, filePath = null) {
    try {
      if (!toList || toList.length === 0) {
        throw new Error('[MailSlurp] Debes proporcionar al menos un correo destinatario.');
      }

      // Configuración base del mensaje
      const emailOptions = {
        to: toList,
        subject: subject || '(Sin asunto)',
        body: body || '',
        isHTML: false,
      };

      // Si se envía una ruta de archivo, convertir a base64 y adjuntar
      if (filePath && fs.existsSync(filePath)) {
        const fileBase64 = fs.readFileSync(filePath).toString('base64');
        emailOptions.attachments = [{
          filename: filePath.split('/').pop(),
          base64Contents: fileBase64,
        }];
        console.log(`[MailSlurp] 📎 Archivo adjuntado: ${filePath}`);
      } else if (filePath) {
        console.warn(`[MailSlurp] ⚠️ No se encontró el archivo en la ruta: ${filePath}`);
      }

      // Enviar el correo usando el inbox configurado
      await mailslurp.sendEmail(inboxId, emailOptions);

      console.log(`[MailSlurp] 📧 Correo enviado correctamente a: ${toList.join(', ')}`);
    } catch (error) {
      console.error('[MailSlurp] ❌ Error al enviar el correo:', error.message);
      throw error;
    }
  }


  module.exports = { getFixedInbox, waitForCode, deleteEmail, mailslurp, sendEmail };
