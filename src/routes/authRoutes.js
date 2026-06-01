const { Router } = require("express");
const { login } = require("../controllers/authController");
const validate = require("../middlewares/validate");
const { loginSchema } = require("../schemas/adminSchemas");

const router = Router();

router.post("/login", validate(loginSchema), login);

module.exports = router;

