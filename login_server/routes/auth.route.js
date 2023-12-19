const { Router } = require("express")
const authRouter = Router();

// Password handler

const { handleSignUp , signUp, signIn, signOut, getCurrent, forgotPass, resetPass} = require("../controller/auth.controller");


authRouter.post("/create",handleSignUp)


authRouter.post("/signup", signUp);
authRouter.post("/signin", signIn);
authRouter.get("/signout", signOut);
authRouter.get("/getCurrent", getCurrent);
authRouter.post("/forgotPass", forgotPass);
authRouter.post("/resetPass", resetPass);
module.exports = { authRouter };