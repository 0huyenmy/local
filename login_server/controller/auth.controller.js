
// mongodb user model
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const handleSignUp = async (req, res) => {

   try {
      const { name, email, password, dateOfBirth } = req.body;
      const ress = await User.create({
         name, email, password, dateOfBirth
      });
      res.status(201).send({
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
   try {
      if (name === "" || email === "" || password === "" || dateOfBirth === "") {
         return res.status(400).json({
            status: "FAILED",
            message: "Empty input fields!",
         });
      } else if (!/^[a-zA-Z ]*$/.test(name)) {
         return res.status(400).json({
            status: "FAILED",
            message: "Invalid name entered",
         });
      } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
         return res.status(400).json({
            status: "FAILED",
            message: "Invalid email entered",
         });
      } else if (!new Date(dateOfBirth).getTime()) {
         return res.status(400).json({
            status: "FAILED",
            message: "Invalid date of birth entered",
         });
      } else if (password.length < 8) {
         return res.status(400).json({
            status: "FAILED",
            message: "Password is too short!",
         });
      }
      const existingUser = await User.findOne({ email });

      if (existingUser) {
         return res.status(409).json({
            status: "FAILED",
            message: "User with the provided email already exists",
         });
      }
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const newUser = new User({
         name,
         email,
         password: hashedPassword,
         dateOfBirth,
      });

      const savedUser = await newUser.save();

      const { accessToken, refreshToken } = generateToken(savedUser);

      res.status(201).json({
         status: "SUCCESS",
         message: "Signup successful",
         data: {
            name: savedUser.name,
            email: savedUser.email,
            token: {
               accessToken,
               refreshToken
            }

         }

      });
   } catch (error) {
      console.error(error);
      res.status(500).json({
         status: "FAILED",
         message: "An error occurred during signup",
      });
   }
}
const generateToken = (user) => {
   const accessTokenPayload = {
      userId: user._id,
      email: user.email,
   };

   const refreshTokenPayload = {
      userId: user._id,
   };

   const secretKey = 'SecretKey';
   const accessToken = jwt.sign(accessTokenPayload, secretKey, { expiresIn: '2m' });
   const refreshToken = jwt.sign(refreshTokenPayload, secretKey, { expiresIn: '3d' });

   return { accessToken, refreshToken };
};


const signIn = async (req, res) => {
   const { email, password } = req.body;

   try {
      if (email === "" || password === "") {
         return res.status(400).json({
            status: "FAILED",
            message: "Empty credentials supplied",
         });
      }
      const user = await User.findOne({ email });

      if (!user) {
         return res.status(401).json({
            status: "FAILED",
            message: "User not found",
         });
      }
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (passwordMatch) {
         const { accessToken, refreshToken } = generateToken(user);
         res.status(200).json({
            status: "SUCCESS",
            message: "Signin successful",
            data: {
               email: user.email,
               name: user.name,
               token:{
                  accessToken, 
                  refreshToken
               }
               
            },
         });
      } else {
         res.status(401).json({
            status: "FAILED",
            message: "Password not correct",
         });
      }
   } catch (error) {
      console.error(error);
      res.status(500).json({
         status: "FAILED",
         message: "An error occurred during signin",
      });
   }
};

const blacklistedTokens = new Set();

const signOut = (req, res) => {
   try {
      const accessToken = req.headers.authorization?.split(' ')[1];
      const refreshToken = req.body.refreshToken;

      if (accessToken) {
         blacklistedTokens.delete(accessToken);
      }

      if (refreshToken) {
         blacklistedTokens.delete(refreshToken);
      }

      res.status(200).json({
         status: "SUCCESS",
         message: "Signout successful",
      });
   } catch (error) {
      console.error(error);
      res.status(500).json({
         status: "FAILED",
         message: "An error occurred during signout",
      });
   }
};




module.exports = { signUp, handleSignUp, signIn, signOut }