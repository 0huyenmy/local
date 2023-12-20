// Configure nodemailer (replace with your email service details)
const nodemailer = require("nodemailer")
const transporterMiddle = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
module.exports = { transporterMiddle }