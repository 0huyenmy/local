const { Router } = require("express")
const authRouter = Router();


// Password handler

const { handleSignUp } = require("../controller/auth.controller");
const { signUp } = require("../controller/auth.controller");

// authRouter
// .post("/create",handleSignUp)

authRouter.post("/signup", signUp);


module.exports = { authRouter };