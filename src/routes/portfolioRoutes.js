const express = require("express");
const upload =
  require("../middlewares/uploadMiddleware");
const { 
  listPortfolio,
  createPortfolio,
  removePortfolio,
    uploadImage,    
} = require("../controllers/portfolioController");

const router = express.Router();

router.get("/", listPortfolio);

router.post("/", createPortfolio);

router.post(
  "/upload",
  upload.single("image"),
  uploadImage
);

router.delete("/:id", removePortfolio);

module.exports = router;