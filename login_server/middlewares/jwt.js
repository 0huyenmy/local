require('dotenv').config(); 
const jwt = require("jsonwebtoken");
const crypto = require("crypto")

const generateToken = (user) => {
    const accessTokenPayload = {
       userId: user._id,
       email: user.email,
    };
 
    const refreshTokenPayload = {
       userId: user._id,
    };
 
    const secretKey = process.env.SECRETKEY;
    const accessToken = jwt.sign(accessTokenPayload, secretKey, { expiresIn: '2m' });
    const refreshToken = jwt.sign(refreshTokenPayload, secretKey, { expiresIn: '3d' });
 
    return { accessToken, refreshToken };
 };

 const generateTokenReset = () => {
   return crypto.randomBytes(20).toString('hex');
};
 module.exports ={generateToken, generateTokenReset};
 