const express=require("express");
const {rootRouter} = require("./routes");
const {DBConfig} = require( "./config/config")
const bodyParser = require('body-parser');
// create application/json parser
const jsonParser = bodyParser.json()
const app=express();

app.use('/api/v1', jsonParser,  rootRouter);

(async ()=>{
  await  DBConfig.connect().then(() => {
        console.log("connect db success");
        app.listen(3001,()=>{
            console.log("success");
        })
      
      }).catch(()=>{ console.log("connect db fail")});
})()

