import Joi from "joi";
import { CreateBooking } from "@/protocols";

export const createBookingSchema = Joi.object<CreateBooking>({
  roomId: Joi.number().min(1).required(),
});
