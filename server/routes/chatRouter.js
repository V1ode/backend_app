const Router = require("express");
const router = new Router;
const chatController = require("../controllers/chatController");

router.post("/createWebsiteMail", chatController.createWebsiteMail);
router.post("/updateWebsiteMail", chatController.updateWebsiteMail);
router.get("/getAllWebsiteMails", chatController.getAllWebsiteMails);

router.post("/createChat", chatController.createChat);
router.post("/updateChat", chatController.updateChat);
router.get("/getAllChats", chatController.getAllChats);

router.post("/createChatMessage", chatController.createChatMessage);
router.post("/updateChatMessage", chatController.updateChatMessage);
router.get("/getAllChatMessages", chatController.getAllChatMessages);

module.exports = router;