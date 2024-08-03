const {
  useMultiFileAuthState,
  DisconnectReason,
} = require("@whiskeysockets/baileys");
const makeWASocket = require("@whiskeysockets/baileys").default;
const { sleep } = require("./utilities");
const { pushUsers } = require("./database");
const fs = require("fs");

let authInfo = null;
let sock = null;

const connect = async function (req, res) {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
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
  let failures = [];

  const sendSingleMessage = async (phone, message) => {
    const id = `${phone}@s.whatsapp.net`;

    try {
      let button = {};
      if (message.buttons.length > 0) {
        button = {
          buttons: message.buttons.map((b, i) => {
            return {
              buttonId: i,
              buttonText: { displayText: b.text },
              type: 1,
            };
          }),
        };
      }

      if (message.message.length > 0) {
        await sleep(2000);
        await sock.sendMessage(id, { text: message.message, ...button });
        console.log(`Mensaje de texto enviado correctamente a ${phone} | ${time}.`);
      }

      if (message.img !== null) {
        await sock.sendMessage(id, {
          image: { url: message.img },
          caption: "",
          ...button,
        });
        console.log(`Mensaje de imagen enviado correctamente a ${phone} | ${time}.`);
      }
      if (message.pdf !== null) {
        await sock.sendMessage(id, {
          document: { url: message.pdf },
          mimetype: "application/pdf",
          caption: "",
          ...button,
        });
        console.log(`Mensaje de pdf enviado correctamente a ${phone} | ${time}.`);
      }
    } catch (err) {
      console.error(err);
      failures.push(message);
    }
  };

  const processMessages = async () => {
    for (let i = 0; i < params.length; i++) {
      const { phone, messages } = params[i];

      for (let j = 0; j < messages.length; j++) {
        const message = messages[j];
        await sendSingleMessage(phone, message);
        coutMessage++;
      }
    }

    res.status(200).json({ msg: "Mensaje enviado correctamente", failures });
  };

  try {
    await processMessages();
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Error interno del servidor" });
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
  if (res !== null) res.jsonp({ msg: "Sesión cerrada con éxito", data: {} });
};

module.exports = {
  connect,
  get_enviarmensaje,
  post_enviarmensaje,
  close,
};
