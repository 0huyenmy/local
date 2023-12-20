const { Router } = require("express")
const authRouter = Router();

// Password handler

const { createUserController , signUpController, signInController, 
    signOutController, getCurrentController, forgotPassController, 
    resetPassController} = require("../controller/auth.controller");


authRouter.post("/create",createUserController)
authRouter.post("/signup", signUpController);
authRouter.post("/signin", signInController);
authRouter.get("/signout", signOutController);
authRouter.get("/getCurrent", getCurrentController);
authRouter.post("/forgotPass", forgotPassController);
authRouter.post("/resetPass", resetPassController);
module.exports = { authRouter };