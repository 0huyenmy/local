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

//người đã đặt hàng nhiều nhất
app.get("/users", (req, res) => {
   const query = `SELECT fullname, u.user_id, COUNT(order_id) AS so_don_dat_hang
      FROM orders o join users u on o.user_id=u.user_id 
      GROUP BY o.user_id
      ORDER BY so_don_dat_hang DESC
      LIMIT 1`;
   connection.query(query, (error, result) => {
      if (error) {
         res.status(500).json({ error: error });
         return;
      }

      res.status(200).json({ data: result });
   });
});

//tìm 2 nhà hàng có lượt like nhiều nhất
app.get("/users/like", (req, res) => {
   const query = `SELECT res_name, r.res_id, COUNT(like_id) AS luot_like
   FROM restaurants r join like_res l  on r.res_id=l.res_id 
   GROUP BY l.res_id
   ORDER BY luot_like DESC
   LIMIT 2;`;
   connection.query(query, (error, result) => {
      if (error) {
         res.status(500).json({ error: error });
         return;
      }

      res.status(200).json({ data: result });
   });
});

//2 người đã like nhà hàng nhiều nhất
app.get("/users/userlike", (req, res) => {
   const query = `SELECT fullname, u.user_id, COUNT(like_id) AS luot_like
   FROM like_res l join users u on l.user_id=u.user_id 
   GROUP BY l.user_id
   ORDER BY luot_like DESC
   LIMIT 2;`;
   connection.query(query, (error, result) => {
      if (error) {
         res.status(500).json({ error: error });
         return;
      }
      res.status(200).json({ data: result });
   });
});

//tìm người không hđ trong hệ thống
app.get("/users/find", (req, res) => {
   const query = `SELECT u.user_id, u.fullname
   FROM users u
   LEFT JOIN orders o ON u.user_id = o.user_id
   LEFT JOIN like_res l ON u.user_id = l.user_id
   LEFT JOIN rate_res r ON u.user_id = r.user_id
   WHERE o.order_id IS NULL AND l.like_id IS NULL AND r.rate_id IS NULL;`;
   connection.query(query, (error, result) => {
      if (error) {
         res.status(500).json({ error: error });
         return;
      }
      res.status(200).json({ data: result });
   });
});

//tính trung bình sub của một food
app.get("/users/avg/:food_name", (req, res) => {
   const food_name  = req.params.food_name;
   if (!food_name) {
      res.status(400).json({ error: "Tên food không được bỏ trống." });
      return;
   }
   const query = `
   SELECT food_name, AVG(sub_price) AS trung_binh_sub
   FROM sub_food s  join foods f on s.food_id=f.food_id where food_name=?`;
    connection.query(query, [food_name], (error, result) => {
      if (error) {
         res.status(500).json({ error: error });
         return;
      }
      res.status(200).json({ data: result });
   });
});

app.use(express.json());
app.post("/users",(req, res)=>{
   const query="INSERT INTO users(`user_id`,`fullname`,`email`,`password`) VALUE(?)";
   const {user_id, fullname, email, password} = req.body
   const values=[
      user_id, fullname, email, password
   ];
   connection.query(query,[values],(error,result)=>{
      if (error) {
         res.status(500).json({ error: error });
         return;
      }

      res.status(200).json({ data: {user_id, fullname, email, password},
        });
   })
})



// app.post("/users",(req, res)=>{
//    const query="INSERT INTO users(`name`,`age`,`id`) VALUE(?)";
//    const {name, age, id} = req.body
//    const values=[
      
//       name, age, id
//    ];
//    connection.query(query,[values],(error,result)=>{
//       if (error) {
//          res.status(500).json({ error: error });
//          return;
//       }

//       res.status(200).json({ data: {name, age, id},
//         });
//    })
// })

// app.delete("/users/:id",(req,res)=>{
//    const userId=req.params.id;
//    const query="delete from users where id=?";
//    connection.query(query,[userId],(error, result)=>{
//       if (error) {
//          res.status(500).json({ error: error });
//          return;
//       }

//       return res.json("delete sucessfull");
       
//    })
// })

// app.put("/users/:id",(req,res)=>{
//    const userId=req.params.id;
//    const query="update users set `name`=?, `age`=? where id=?";
//    const {name, age, id} = req.body
//    const values=[
//       name, age
//    ];
//    connection.query(query,[...values,userId],(error, result)=>{
//       if (error) {
//          res.status(500).json({ error: error });
//          return;
//       }

//       res.status(200).json({ data: {name, age, id},
//       });
       
//    })
// })

app.listen(3001, () => {
   console.log("server");
});
