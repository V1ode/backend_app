const Router = require("express");
const router = new Router;

const userRouter = require("./userRouter");
const portfolioRouter = require("./portfolioRouter");
const chatRouter = require("./chatRouter");

router.use("/user", userRouter);
router.use("/portfolio", portfolioRouter);
router.use("/chat", chatRouter);

router.use("/", (req, res) => res.json({message: "You connected to server"}))

module.exports = router;