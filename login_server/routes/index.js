const { Router } = require("express");
const {authRouter} = require("./auth.route");
const {notiRouter} = require("./noti.route")
const rootRouter = Router();

rootRouter.use("/auth",authRouter)
rootRouter.use("/noti",notiRouter)
module.exports = {
    rootRouter
}