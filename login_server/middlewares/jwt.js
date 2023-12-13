const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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
 module.exports ={generateToken};
 