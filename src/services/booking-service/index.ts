import enrollmentRepository from "@/repositories/enrollment-repository";
import ticketRepository from "@/repositories/ticket-repository";
import bookingRepository from "@/repositories/booking-repository";
import { notFoundError } from "@/errors";
import { paymentRequiredError } from "@/errors/Cannot-list-booking-error";
import { forbiddenError } from "@/errors/forbidden-error";

async function verificEnrollmnetAndTicket(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) {
    throw notFoundError();
  }

  const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
  
  if (ticket.status === "RESERVED") {
    throw paymentRequiredError();
  }
  if (!ticket || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
    throw forbiddenError();
  }
}

async function getBooking(userId: number) {
  await verificEnrollmnetAndTicket(userId);

  const booking = await bookingRepository.findBooking(userId);
  if (!booking) {
    throw notFoundError();
  }
  return booking;
}

async function postBooking(userId: number, roomId: number) {
  await verificEnrollmnetAndTicket(userId);
  const room = await bookingRepository.findRoomWithRoomId(roomId);
  if (!room) {
    throw notFoundError();
  }
  const countBooking = await bookingRepository.countBookingsWithRoomId(roomId);
  if(room.capacity <= countBooking) {
    throw forbiddenError();
  }
  const newBooking = await bookingRepository.createBooking(userId, roomId);
  if (!newBooking) {
    throw notFoundError();
  }
  return newBooking;
}

async function putBooking(userId: number, roomId: number, bookingId: number) {
  await verificEnrollmnetAndTicket(userId);
  const room = await bookingRepository.findRoomWithRoomId(roomId);
  if (!room) {
    throw notFoundError();
  }
  const countBooking = await bookingRepository.countBookingsWithRoomId(roomId);
  if(room.capacity <= countBooking) {
    throw forbiddenError();
  }
  const booking = await bookingRepository.findBooking(userId);
  if (!booking) {
    throw notFoundError();
  }

  const newBooking = await bookingRepository.updateBooking(bookingId, roomId);
  if (!newBooking) {
    throw notFoundError();
  }
  return newBooking;
}

const bookingService = {
  getBooking,
  postBooking,
  putBooking
};

export default bookingService;
