const Router = require("express");
const router = new Router;
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

// roles ("guest", "student", "employer", "admin")

router.post("/registration", userController.registration);
router.post("/login", userController.login);
router.post("/update", userController.update);
router.get("/getAll", userController.getAll);
router.get("/getOne", userController.getOne);

router.get("/getUserProfile", userController.getUserProfile);

router.get("/auth", authMiddleware, userController.check);

router.get("/", (req, res) => res.json({message: "You connected to user"}));

module.exports = router;