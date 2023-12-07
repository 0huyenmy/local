const { URI } = require("../constants/common");
const mongoose=require("mongoose");
const DBConfig = {
    connect: async function connect(){
        try{
            await mongoose.connect(URI);
            console.log("Connected to MongoDB");
        }catch(error){
            console.log("Can not connect to MongoDB" , `mess: ${error.message}`);
        }
    }
}


module.exports = {
    DBConfig
}