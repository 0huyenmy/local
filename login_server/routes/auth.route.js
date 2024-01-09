const { Router } = require("express")
const authRouter = Router();

// Password handler

const { createUserController , signUpController, signInController, 
    signOutController, getCurrentController, forgotPassController, 
    resetPassController, getPosts} = require("../controller/auth.controller");


authRouter.post("/create",createUserController)
authRouter.post("/signup", signUpController);
authRouter.post("/signin", signInController);
authRouter.get("/signout", signOutController);
authRouter.get("/getCurrent", getCurrentController);
authRouter.post("/forgotPass", forgotPassController);
authRouter.post("/resetPass", resetPassController);
authRouter.get("/getPost", getPosts);
module.exports = { authRouter };