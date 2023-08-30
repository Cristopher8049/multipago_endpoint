const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const makeWASocket = require("@whiskeysockets/baileys").default;
const { sleep } = require("./utilities");
const { pushUsers } = require("./database");
const fs = require("fs");


let authInfo = null;
let sock = null;

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

const sendMessage = async (params, res, sock) => {
  let coutMessage = 0;
  let coutTotal = 0;
  let time = new Date();
  let codeStatus = 0;


  const id = `${params.phone}@s.whatsapp.net`;

  try {
    await sock.sendMessage(id, { text: params.message });
    if (params.img !== "null") {
      await sock.sendMessage(id, {
        image: { url: params.img },
        caption: "",
      });
    }
    if (params.pdf !== "null") {
      await sock.sendMessage(id, {
        document: { url: params.pdf },
        caption: "",
      });
    }

    console.log(`Mensaje enviado correctamente a ${params.phone} | ${time}.`);
    res.status(200).json({ msg: "Mensaje enviado correctamente" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Ocurrió un error al enviar el mensaje" });
  }
};
const get_enviarmensaje = async (req, res) => {
  if (!sock) {
    res.status(500).json({ msg: "Error: La conexión no está establecida" });
    return;
  }
  
  await sendMessage(req.query, res, sock);
};

const post_enviarmensaje = async (req, res) => {
  if (!sock) {
    res.status(500).json({ msg: "Error: La conexión no está establecida" });
    return;
  }
  
  await sendMessage(req.body, res, sock);
};

const close = async (req, res) => {
  if (fs.existsSync("./auth_info_multi.json"))
    fs.rmSync("./auth_info_multi.json");
  if (authInfo != null) authInfo = null;
  if (sock && (sock.state === "open" || sock.state === "connecting")) {
    await sock.close();
    sock = null;
  }
  if (res !== null) res.jsonp({ msg: "Sesion cerrada con exito", data: {} });
};

module.exports = {
  connect,
  get_enviarmensaje,
  post_enviarmensaje,
  close,
};