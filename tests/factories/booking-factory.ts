import { prisma } from "@/config";

export async function createBooking(userId: number, roomId: number) {
  return await prisma.booking.create({
    data: {
      userId: userId,
      roomId: roomId,
    }
  });
}

export async function countBookingsWithRoomId(roomId: number) {
  return prisma.booking.count({
    where: {
      roomId: roomId,
    },
  });
}
