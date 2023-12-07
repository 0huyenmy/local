const { Router } = require("express");
const {authRouter, signUpRouter} = require("./auth.route");

const rootRouter = Router();

rootRouter.use("/auth",authRouter)
// rootRouter.use("/auth",signUpRouter)
module.exports = {
    rootRouter
}