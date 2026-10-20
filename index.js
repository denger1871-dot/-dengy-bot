import express from "express";
import { getMarinReply } from "./marin.js";
const app = express();
app.get("/", (req,res)=> res.send("DENGY TOYS - Marin activa"));
app.get("/chat", async (req,res)=>{
  const msg = req.query.msg || "hola";
  const reply = await getMarinReply(msg, []);
  res.send(reply);
});
app.listen(process.env.PORT || 3000, ()=> console.log("Marin lista"));
