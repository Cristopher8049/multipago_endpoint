const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const makeWASocket = require("@whiskeysockets/baileys").default;
const fs = require('fs');

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        connect();
      }
    } else if (connection === "open") {
      console.log("Conectado a WA!");
      sendMessage(sock);
    }
  });

  sock.ev.on('creds.update', saveCreds);

  return sock;
}

async function sendMessage(sock) {
  const id = `59169097532@s.whatsapp.net`;
  await sock.sendMessage(id, { text: 'hola' });
}

(async () => {
  const sock = await connect();
})();



