const mysql=require("mysql")

const db=mysql.createConnection({
    host:"127.0.0.1",
    username:"root",
    password:"123456",
    port:"3307",
    database:"demo-db"
});

db.connect(()=>{
    console.log("connect succesfull");
});

module.exports=db;