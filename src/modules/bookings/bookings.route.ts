import { Router } from "express";
import { bookingsController } from "./bookings.controller";
import auth from "../../middleware/auth";
import { Roles } from "../auth/auth.constant";

const router = Router();

router.post("/", auth(Roles.admin, Roles.customer), bookingsController.createBooking);
router.get("/", auth(Roles.admin, Roles.customer), bookingsController.getBookings);
router.put("/:bookingId", auth(Roles.admin, Roles.customer), bookingsController.updateBooking);

export const bookingsRoute = router;
