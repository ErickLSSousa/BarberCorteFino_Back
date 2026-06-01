const { Router } = require("express");
const {
  createBarber,
  listAppointments,
  listBarbers,
  listServices,
  updateAppointmentStatus,
  upsertService,
} = require("../controllers/adminController");
const requireAdmin = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { barberSchema, serviceSchema } = require("../schemas/adminSchemas");

const router = Router();

router.use(requireAdmin);
router.get("/barbers", listBarbers);
router.post("/barbers", validate(barberSchema), createBarber);
router.get("/services", listServices);
router.post("/services", validate(serviceSchema), upsertService);
router.get("/appointments", listAppointments);
router.patch("/appointments/:id/status", updateAppointmentStatus);

module.exports = router;

