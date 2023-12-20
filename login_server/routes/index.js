const { Router } = require("express");
const {authRouter} = require("./auth.route");

const rootRouter = Router();

rootRouter.use("/auth",authRouter)
module.exports = {
    rootRouter
}