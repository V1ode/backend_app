const Router = require("express");
const router = new Router;
const protfolioController = require("../controllers/portfolioController");
const checkRoleMiddleware = require("../middleware/checkRoleMiddleware");

router.post("/createPortfolio", protfolioController.createPortfolio);
router.post("/updatePortfolio", checkRoleMiddleware("student"), protfolioController.updatePortfolio);
router.post("/deletePortfolio", protfolioController.deletePortfolio);
router.get("/getAllPortfolio", protfolioController.getAllPortfolio);
router.get("/getOnePortfolio", protfolioController.getOnePortfolio);

router.post("/createTeg", protfolioController.createTeg);
router.get("/updateTeg", protfolioController.updateTeg);
router.get("/getAllTegs", protfolioController.getAllTegs);

router.post("/createProject", protfolioController.createProject);
router.post("/updateProject", protfolioController.updateProject);
router.post("/getAllProjects", protfolioController.getAllProjects);
router.get("/getAllProjectsById", protfolioController.getAllProjectsById);

router.post("/postMailMassage", protfolioController.postMailMassage);

router.get("/getPortfolioCard", protfolioController.getPortfolioCard);

router.get("/", (req, res) => res.json({message: "You connected to portfolio"}));

module.exports = router;