// utils/mailslurp-utils.js
const MailSlurp = require('mailslurp-client').default;
const config = require('./Environment');

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

module.exports = { getFixedInbox, waitForCode, deleteEmail, mailslurp };
