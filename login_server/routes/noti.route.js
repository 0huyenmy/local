const { Router } = require("express")
const notiRouter = Router();

// Password handler

const { notiUserJoinController, notiResultController, 
    notiTimeUserJoinController, postItemAuctionController, time, 
    postAuctionController} = require("../controller/noti.controller");


notiRouter.post("/userjoin",notiUserJoinController)
notiRouter.post("/notiresult", notiResultController)
notiRouter.post("/notitime",notiTimeUserJoinController)
notiRouter.post("/postitem", postItemAuctionController)
notiRouter.post("/time", time)
notiRouter.post("/auction", postAuctionController)
module.exports = { notiRouter };