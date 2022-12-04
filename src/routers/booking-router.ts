import { Router } from "express";
import { authenticateToken, validateBody } from "@/middlewares";
import { getBooking, postBooking } from "@/controllers/booking-controller";
import { createBookingSchema } from "@/schemas";
const bookingRouter = Router();

bookingRouter
  .all("/*", authenticateToken)
  .get("/", getBooking)
  .post("/", validateBody(createBookingSchema), postBooking);
  
export { bookingRouter };
