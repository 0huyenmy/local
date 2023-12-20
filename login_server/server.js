const express=require("express");
const {rootRouter} = require("./routes");
const {DBConfig} = require( "./config/config")
const bodyParser = require('body-parser');
const cookieParser =require('cookie-parser');
require('dotenv').config();
// create application/json parser
const jsonParser = bodyParser.json()
const app=express();
app.use(cookieParser())
app.use('/api/v1', jsonParser,  rootRouter);

(async ()=>{
  await  DBConfig.connect().then(() => {
        console.log("connect db success");
        app.listen(process.env.PORT,()=>{
            console.log("success");
        })
      
      }).catch(()=>{ console.log("connect db fail")});
})()

