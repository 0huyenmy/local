
// mongodb user model
const {User} = require("../models/User");
const Post = require("../models/Post");
const { generateTokenMiddle, generateTokenResetMiddle } = require("../middlewares/jwt")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { transporterMiddle } = require("../middlewares/nodemailer")
require('dotenv').config();

const getPosts = async (req, res) => {
   try {
      const posts = await Post.find({});
      res.status(200).send({
         mess: "fetch success",
         data: posts
      });
   } catch (err) {
      res.status(500).send({
         mess: err.message
      });
   }
};

const createUserController = async (req, res) => {

         try {
            const { name, email, password, dateOfBirth } = req.body;
            const ress = await User.create({
               name, email, password, dateOfBirth
            });
           
           
            res.status(201).send({
               mess: "create success", data: ress
            })
         } catch (err) {
            res.status(500).send({
               mess: err.message
            })
         }
      }

      const signUpController = async (req, res) => {
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

            const { accessToken, refreshToken } = generateTokenMiddle(savedUser);

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


      const signInController = async (req, res) => {
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
               const { accessToken, refreshToken } = generateTokenMiddle(user);
               await User.findByIdAndUpdate(user._id, { refreshToken }, { new: true })
               res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 3 * 24 * 60 * 60 * 1000 })
               res.status(200).json({
                  status: "SUCCESS",
                  message: "Signin successful",
                  data: {
                     email: user.email,
                     name: user.name,
                     token: {
                        accessToken,
                        //refreshToken
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



      const signOutController = async (req, res) => {
         try {
            const cookie = req.cookies;
            if (!cookie || !cookie.refreshToken) {
               throw new Error('No refresh token in cookies');
            }

            const updatedUser = await User.findOneAndUpdate(
               { refreshToken: cookie.refreshToken },
               { refreshToken: '' },
               { new: true }
            );

            if (!updatedUser) {
               // User not found, i.e., failed sign-out
               return res.status(401).json({
                  status: "ERROR",
                  message: "Failed to sign out. User not found or invalid refresh token.",
               });
            }

            res.clearCookie('refreshToken', { httpOnly: true, secure: true });
            return res.status(200).json({
               status: "SUCCESS",
               message: "Signout successful",
            });
         } catch (error) {
            console.error(error);
            return res.status(500).json({
               status: "ERROR",
               message: "Internal Server Error",
            });
         }
      };



      const getCurrentController = async (req, res) => {
         try {
            const accessToken = req.headers.authorization?.split(' ')[1];
            const secretKey = process.env.SECRETKEY;
            if (!accessToken) {
               return res.status(401).json({
                  status: 'ERROR',
                  message: 'No access token provided',
               });
            }

            const decodedToken = jwt.verify(accessToken, secretKey);

            const userId = decodedToken.userId;

            const user = await User.findById(userId);

            if (!user) {
               return res.status(401).json({
                  status: 'ERROR',
                  message: 'User not found',
               });
            }

            return res.status(200).json({
               status: 'SUCCESS',
               data: {
                  id: user._id,
                  username: user.name,
                  email: user.email,
                  birthday: user.dateOfBirth,

               },
            });
         } catch (error) {
            console.error(error);

            if (error.name === 'JsonWebTokenError') {
               return res.status(401).json({
                  status: 'ERROR',
                  message: 'Invalid token',
               });
            }

            return res.status(500).json({
               status: 'ERROR',
               message: 'Internal Server Error',
            });
         }
      };

      const forgotPassController = async (req, res) => {
         const { email } = req.body;

         try {
            // Tìm user bằng email
            const user = await User.findOne({ email });

            if (!user) {
               return res.status(404).json({
                  status: 'ERROR',
                  message: 'User not found',
               });
            }

            // Tạo reset Token ngẫu nhiên
            const resetToken = generateTokenResetMiddle();

            // Lưu reset Token và thời gian hiệu lực vào DB
            user.resetPasswordToken = resetToken;
            user.resetPasswordExpires = Date.now() + 3 * 60 * 1000; // Token có hiệu lực trong 3min

            await user.save();

            // Gửi email với link reset
            const resetLink = `http://your-app-url/resetPassword?token=${resetToken}`;
            const mailOptions = {
               from: 'Cineflix support<support@cineflix.com>',
               to: email,
               subject: 'Password Reset',
               text: `Click the following link to reset your password: ${resetLink}`,
            };

            await transporterMiddle.sendMail(mailOptions);

            return res.status(200).json({
               status: 'SUCCESS',
               message: 'Password reset email sent successfully',
            });
         } catch (error) {
            console.error(error);
            return res.status(500).json({
               status: 'ERROR',
               message: 'Internal Server Error',
            });
         }
      };

      const resetPassController = async (req, res) => {
         const { token, newPassword } = req.body;

         try {
            // Tìm người dùng với token resetPasswordToken và token chưa hết hạn
            const user = await User.findOne({
               resetPasswordToken: token,
               resetPasswordExpires: { $gt: Date.now() },
            });

            if (!user) {
               return res.status(400).json({
                  status: 'ERROR',
                  message: 'Invalid or expired reset token',
               });
            }

            // Hash mật khẩu mới
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Cập nhật mật khẩu của người dùng và xóa thông tin reset
            user.password = hashedPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            // Lưu người dùng
            await user.save();

            return res.status(200).json({
               status: 'SUCCESS',
               message: 'Password reset successfully',
            });
         } catch (error) {
            console.error(error);
            return res.status(500).json({
               status: 'ERROR',
               message: 'Internal Server Error',
            });
         }
      };

      module.exports = { signUpController, createUserController, 
         signInController, signOutController, getCurrentController, 
         forgotPassController, resetPassController,
      getPosts }