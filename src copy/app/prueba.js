const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const makeWASocket = require("@whiskeysockets/baileys").default;
const fs = require('fs');


let authInfo = null;
let sock = null;
const filePath = 'datos.json';

fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer el archivo:', err);
      return;
    }
  
    // El contenido del archivo JSON se encuentra en 'data'.
    const jsonData = JSON.parse(data);
  
    // Ahora puedes trabajar con el objeto JSON 'jsonData'.
    console.log('Contenido del archivo JSON:', jsonData);
  });


const connect = async function (req, res) {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    sock = makeWASocket({
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
      }
    });
    sock.ev.on("creds.update", saveCreds);
    return sock;
  };

