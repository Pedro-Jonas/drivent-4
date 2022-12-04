import { prisma } from "@/config";

async function findBooking(userId: number) {
  return prisma.booking.findFirst({
    where: {
      userId: userId,
    },
    select: {
      id: true,
      Room: true,
    },
  });
}

async function findRoomWithRoomId(roomId: number) {
  return prisma.room.findFirst({
    where: {
      id: roomId,
    },
  });
}

async function countBookingsWithRoomId(roomId: number) {
  return prisma.booking.count({
    where: {
      roomId: roomId,
    },
  });
}

async function createBooking(userId: number, roomId: number) {
  return prisma.booking.create({
    data: {
      userId: userId,
      roomId: roomId,
    }
  });
}

const bookingRepository = {
  findBooking,
  createBooking,
  findRoomWithRoomId,
  countBookingsWithRoomId
};

export default bookingRepository;
