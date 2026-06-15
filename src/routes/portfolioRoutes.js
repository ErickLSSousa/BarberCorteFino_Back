const express = require("express");
const upload =
  require("../middlewares/uploadMiddleware");
const { 
  listPortfolio,
  createPortfolio,
  removePortfolio,
  uploadImage,    
  listPortfolioAdmin,
  togglePortfolio,
} = require("../controllers/portfolioController");

const router = express.Router();

router.get("/", listPortfolio);

router.get(
  "/admin",
  listPortfolioAdmin
);

router.post("/", createPortfolio);

router.post(
  "/upload",
  upload.single("image"),
  uploadImage
);

router.patch(
  "/:id/toggle",
  togglePortfolio
);

router.delete("/:id", removePortfolio);

module.exports = router;