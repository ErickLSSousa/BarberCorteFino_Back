const { Router } = require("express");
const {
  loginAdmin,
  loginClient,
  registerClient,
} = require("../controllers/authController");
const validate = require("../middlewares/validate");
const { clientRegisterSchema, loginSchema } = require("../schemas/authSchemas");

const router = Router();

router.post("/login", validate(loginSchema), loginAdmin);
router.post("/admin/login", validate(loginSchema), loginAdmin);
router.post("/client/register", validate(clientRegisterSchema), registerClient);
router.post("/client/login", validate(loginSchema), loginClient);

module.exports = router;
