const { Router } = require("express")
const authRouter = Router();


// Password handler

const { handleSignUp , signUp, signIn, signOut} = require("../controller/auth.controller");


authRouter
.post("/create",handleSignUp)

authRouter.post("/signup", signUp);
authRouter.post("/signin", signIn);
authRouter.get("/signout", signOut);

module.exports = { authRouter };