import { Response } from "express";
import { AuthenticatedRequest } from "@/middlewares";
import httpStatus from "http-status";
import bookingService from "@/services/booking-service";

export async function getBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const booking = await bookingService.getBooking(userId);
    return res.status(httpStatus.OK).send(booking);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
    if (error.name === "Forbidden Error") {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
    return res.sendStatus(httpStatus.PAYMENT_REQUIRED);
  }
}

export async function postBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { roomId } = req.body;

  const numberRoomId = Number(roomId);

  try {
    const newBookingId = await bookingService.postBooking(userId, numberRoomId);
    return res.status(httpStatus.OK).send(newBookingId);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
    if (error.name === "Forbidden Error") {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
    if (error.name === "Payment Required Error") {
      return res.sendStatus(httpStatus.PAYMENT_REQUIRED);
    }
    return res.sendStatus(httpStatus.BAD_REQUEST);
  }
}

export async function putBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { roomId } = req.body;
  const { bookingId } = req.params;

  const numberBookingId = Number(bookingId);
  const numberRoomId = Number(roomId);

  if (isNaN(numberBookingId) || numberBookingId < 1) {
    return res.sendStatus(httpStatus.BAD_REQUEST);
  }

  try {
    const newBookingId = await bookingService.putBooking(userId, numberRoomId, numberBookingId);
    return res.status(httpStatus.OK).send(newBookingId);
  } catch (error) {
    if (error.name === "NotFoundError") {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
    if (error.name === "Forbidden Error") {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
    if (error.name === "Payment Required Error") {
      return res.sendStatus(httpStatus.PAYMENT_REQUIRED);
    }
    return res.sendStatus(httpStatus.BAD_REQUEST);
  }
}
