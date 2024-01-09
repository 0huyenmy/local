require('dotenv').config();
const URL = process.env.MONGO_URL ;
const mongoose=require("mongoose");
const DBConfig = {
    connect: async function connect(){
        try{
            await mongoose.connect(URL);
            console.log("Connected to MongoDB");
        }catch(error){
            console.log("Can not connect to MongoDB" , `mess: ${error.message}`);
        }
    }
}

const Pusher = require('pusher');
require('dotenv').config();
const pusher = new Pusher({
    appId: process.env.appId,
    key: process.env.key,
    secret: process.env.secret,
    cluster: process.env.cluster,
    useTLS: true
  });
module.exports = {
    DBConfig, pusher
}