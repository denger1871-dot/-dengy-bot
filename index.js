import express from "express";
import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import pino from "pino";
import { getMarinReply } from "./marin.js";
import fs from "fs";

const app = express();
let qrCodeData = null;
let status = "Iniciando bot...";

app.get("/", (req,res)=>res.send("DENGY TOYS - ve a /qr"));
app.get("/chat", (req,res)=>res.send(getMarinReply(req.query.msg || "")));

app.get("/qr", async (req,res)=>{
  if(status==="ONLINE") return res.send("<h1>✅ ONLINE - Ya está conectado</h1><p>Ahora escríbele al número de Marin desde otro cel</p>");
  if(!qrCodeData) return res.send(`<h1>${status}</h1><p>Generando QR... refresca en 3 seg</p><script>setTimeout(()=>location.reload(),3000)</script>`);
  const img = await QRCode.toDataURL(qrCodeData);
  res.send(`<h1>ESCANEA CON EL CEL DE MARIN</h1><img src="${img}" width="380"><p>WhatsApp > 3 puntitos > Dispositivos vinculados > Vincular dispositivo</p><script>setTimeout(()=>location.reload(),15000)</script>`);
});

app.get("/reset", (req,res)=>{
  try{ fs.rmSync("auth",{recursive:true,force:true}); }catch(e){}
  qrCodeData=null; status="Reseteado...";
  res.send("Borrado. Vete a /qr en 10 seg");
});

async function startBot(){
  try{
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const sock = makeWASocket({
      version,
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({level:"silent"})) },
      logger: pino({level:"silent"}),
      printQRInTerminal: false,
      browser: ["DENGY-TOYS","Chrome","10"]
    });

    sock.ev.on("connection.update", async ({connection,lastDisconnect,qr})=>{
      if(qr){ qrCodeData=qr; status="QR listo! Escanea ya"; console.log("QR generado"); }
      if(connection==="close"){
        const code = lastDisconnect?.error?.output?.statusCode;
        console.log("Cerrado:", code, lastDisconnect?.error?.message);
        if(code !== DisconnectReason.loggedOut){
          status="Reconectando...";
          setTimeout(startBot, 2000);
        } else {
          status="Deslogueado - ve a /reset"; 
        }
      }
      if(connection==="open"){ status="ONLINE"; qrCodeData=null; console.log("✅ ONLINE"); }
    });

    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("messages.upsert", async ({messages})=>{
      const msg = messages[0];
      if(!msg.message || msg.key.fromMe) return;
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
      if(!text) return;
      const reply = getMarinReply(text);
      await sock.sendMessage(msg.key.remoteJid, {text: reply});
    });

  }catch(e){
    console.error("Error start:", e);
    status="Error: "+e.message;
    setTimeout(startBot, 4000);
  }
}

startBot();
app.listen(process.env.PORT||8080, ()=>console.log("Marin en puerto 8080"));
