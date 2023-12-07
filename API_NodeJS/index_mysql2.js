const express = require("express");
const mysql = require("mysql2");

const app = express();

const connection = mysql.createConnection({
   host: "127.0.0.1",
   port: 3307,
   user: "root",
   password: "123456",
   database: "demo",
});

connection.connect((err) => {
   if (err) {
      console.log("cannot connect to db", err);
      throw err;
   }

   console.log("Connected to db");
});

app.get("/foods", (req, res) => {
    const query = `SELECT * FROM foods`;
    connection.query(query, (error, result) => {
       if (error) {
          res.status(500).json({ error: error });
          return;
       }
 
       res.status(200).json({ data: result });
    });
 });