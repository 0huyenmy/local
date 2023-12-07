
// mongodb user model
const User = require("../models/User");
const bcrypt = require("bcrypt");

const handleSignUp = async (req, res) => {

   try {
      const { name, email, password, dateOfBirth } = req.body;
      const ress = await User.create({
         name, email, password, dateOfBirth
      });
      res.status(201).send.json({
         mess: "tao thanh cong", data: ress
      })
   } catch (err) {
      res.status(500).send({
         mess: err.message
      })
   }
}

const signUp = async (req, res) => {
   const { name, email, password, dateOfBirth } = req.body;

   if (name == "" || email == "" || password == "" || dateOfBirth == "") {
      res.json({
         status: "FAILED",
         message: "Empty input fields!",
      });
   } else if (!/^[a-zA-Z ]*$/.test(name)) {
      res.json({
         status: "FAILED",
         message: "Invalid name entered",
      });
   } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      res.json({
         status: "FAILED",
         message: "Invalid email entered",
      });
   } else if (!new Date(dateOfBirth).getTime()) {
      res.json({
         status: "FAILED",
         message: "Invalid date of birth entered",
      });
   } else if (password.length < 8) {
      res.json({
         status: "FAILED",
         message: "Password is too short!",
      });
   } else {
      // Checking if user already exists
      User.find({ email })
         .then((result) => {
            if (result.length) {
               // A user already exists
               res.json({
                  status: "FAILED",
                  message: "User with the provided email already exists",
               });
            } else {
               // Try to create new user

               // password handling
               const saltRounds = 10;
               bcrypt
                  .hash(password, saltRounds)
                  .then((hashedPassword) => {
                     const newUser = new User({
                        name,
                        email,
                        password: hashedPassword,
                        dateOfBirth,
                     });

                     newUser
                        .save()
                        .then((result) => {
                           res.json({
                              status: "SUCCESS",
                              message: "Signup successful",
                              data: result,
                           });
                        })
                        .catch((err) => {
                           res.json({
                              status: "FAILED",
                              message: "An error occurred while saving user account!",
                           });
                        });
                  })
                  .catch((err) => {
                     res.json({
                        status: "FAILED",
                        message: "An error occurred while hashing password!",
                     });
                  });
            }
         })
         .catch((err) => {
            console.log(err);
            res.json({
               status: "FAILED",
               message: "An error occurred while checking for existing user!",
            });
         });
   }
}

module.exports = { handleSignUp };
module.exports = { signUp }