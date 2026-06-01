const { Router } = require("express");
const {
  availability,
  createAppointment,
  publicBarbers,
  publicServices,
} = require("../controllers/publicController");
const validate = require("../middlewares/validate");
const { appointmentSchema, availabilityQuerySchema } = require("../schemas/appointmentSchemas");

const router = Router();

router.get("/services", publicServices);
router.get("/barbers", publicBarbers);
router.get("/availability", validate(availabilityQuerySchema, "query"), availability);
router.post("/appointments", validate(appointmentSchema), createAppointment);

module.exports = router;

