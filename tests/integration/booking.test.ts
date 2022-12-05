import app, { init } from "@/app";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import { createEnrollmentWithAddress, createUser, createTicket, createHotel, 
  createRoomWithHotelId, createTicketTypeWithHotel, createTicketTypeRemote,
  createRoomWithHotelIdAndCapacity1 } from "../factories";
import { createBooking } from "../factories/booking-factory";
import { cleanDb, generateValidToken } from "../helpers";
import bookingRepository  from "@/repositories/booking-repository";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/booking");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("Should respond whith status 404 when user doesn`t have a booking", async () => {
      const user = await createUser();  
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      
      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });
    it("should respond with status 403 when user ticket is remote ", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
 
      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
    });
    it("should respond with status 402 when user ticket is RESERVED", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
    });
    it("should respond with status 404 when user has no enrollment ", async () => {
      const user = await createUser();  
      const token = await generateValidToken(user);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it("Should respond whith status 200 and booking when have a booking", async () => {
      const user = await createUser();  
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const hotel = await createHotel();
      const room = await createRoomWithHotelId(hotel.id);
      const booking = await createBooking(user.id, room.id);
  
      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);
      
      expect(response.body).toEqual({
        id: booking.id,
        Room: {
          id: room.id,
          name: room.name,
          capacity: room.capacity,
          hotelId: room.hotelId,
          createdAt: room.createdAt.toISOString(),
          updatedAt: room.updatedAt.toISOString()
        }
      });
      expect(response.status).toBe(httpStatus.OK);
    });
  });
});

describe("POST /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.post("/booking");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    describe("when body is valid", () => {
      it("should respond with status 404 when user has no enrollment ", async () => {
        const user = await createUser();  
        const token = await generateValidToken(user);
        const body = { roomId: 1 };
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
  
        expect(response.status).toBe(httpStatus.NOT_FOUND);
      });
      it("Should respond whith status 404 when user doesn`t have a room", async () => {
        const user = await createUser();  
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const body = { roomId: 1 };
  
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
        expect(response.status).toBe(httpStatus.NOT_FOUND);
      });
      it("should respond with status 403 when user ticket is remote", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeRemote();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const body = { roomId: 1 };

        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
  
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });
      it("should respond with status 402 when user ticket is RESERVED", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeRemote();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
        const body = { roomId: 1 };

        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
    
        expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
      });
      it("should respond with status 403 when room capacity is full", async () => {
        const user = await createUser();  
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const hotel = await createHotel();
        const room = await createRoomWithHotelIdAndCapacity1(hotel.id);
        await createBooking(user.id, room.id);

        const body = { roomId: room.id };
        
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);

        expect(response.status).toBe(httpStatus.FORBIDDEN);
      });
      it("should respond with status 200 and the id of the new booking", async () => {
        const user = await createUser();  
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
        const body = { roomId: room.id };
  
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
        const booking = await bookingRepository.findBooking(user.id);
        expect(response.status).toBe(httpStatus.OK);
        expect(response.body.id).toEqual(booking.id);
      });
    });

    describe("when body is invalid", () => {
      const generateInvalidBody = () => ({
        roomId: "teste",
      });
      it("should respond with status 400 when body is not present", async () => {
        const user = await createUser();  
        const token = await generateValidToken(user);
        
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`);
  
        expect(response.status).toBe(httpStatus.BAD_REQUEST);
      });
      it("should respond with status 400 when body is not valid", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const body = generateInvalidBody();
  
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
  
        expect(response.status).toBe(httpStatus.BAD_REQUEST);
      });
      it("should respond with status 400 when roomId is less than 1", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const body = { roomId: 0 };

        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);

        expect(response.status).toBe(httpStatus.BAD_REQUEST);
      });
    });    
  });
});

describe("PUT /booking/:bookingId", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.put("/booking/1");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    describe("when body is valid", () => {
      it("should respond with status 404 when user has no enrollment ", async () => {
        const user = await createUser();  
        const token = await generateValidToken(user);
        const body = { roomId: 1 };
        const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send(body);
  
        expect(response.status).toBe(httpStatus.NOT_FOUND);
      });
      it("Should respond whith status 404 when user doesn`t have a room", async () => {
        const user = await createUser();  
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const body = { roomId: 1 };
  
        const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send(body);
        expect(response.status).toBe(httpStatus.NOT_FOUND);
      });
      it("should respond with status 403 when user ticket is remote", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeRemote();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const body = { roomId: 1 };

        const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send(body);
  
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
      });
      it("should respond with status 402 when user ticket is RESERVED", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeRemote();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
        const body = { roomId: 1 };

        const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send(body);
    
        expect(response.status).toEqual(httpStatus.PAYMENT_REQUIRED);
      });
      it("should respond with status 403 when room capacity is full", async () => {
        const user = await createUser();  
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const hotel = await createHotel();
        const room = await createRoomWithHotelIdAndCapacity1(hotel.id);
        await createBooking(user.id, room.id);

        const body = { roomId: room.id };
        
        const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send(body);

        expect(response.status).toBe(httpStatus.FORBIDDEN);
      });
      it("should respond with status 403 when not have booking", async () => {
        const user = await createUser();  
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);

        const body = { roomId: room.id };
        
        const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send(body);

        expect(response.status).toBe(httpStatus.NOT_FOUND);
      });

      it("should respond with status 200 and the id of the new booking", async () => {
        const user = await createUser();  
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const hotel = await createHotel();
        const room = await createRoomWithHotelId(hotel.id);
        const room2 = await createRoomWithHotelId(hotel.id);
        const booking = await createBooking(user.id, room.id);
        const body = { roomId: room2.id };
  
        const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send(body);
        const findbooking = await bookingRepository.findBooking(user.id);
        expect(response.status).toBe(httpStatus.OK);
        expect(response.body.id).toEqual(findbooking.id);
      });
    });

    describe("when body is invalid", () => {
      const generateInvalidBody = () => ({
        roomId: "teste",
      });
      it("should respond with status 400 when body is not present", async () => {
        const user = await createUser();  
        const token = await generateValidToken(user);
        
        const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`);
  
        expect(response.status).toBe(httpStatus.BAD_REQUEST);
      });
      it("should respond with status 400 when body is not valid", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const body = generateInvalidBody();
  
        const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send(body);
  
        expect(response.status).toBe(httpStatus.BAD_REQUEST);
      });
      it("should respond with status 400 when roomId is less than 1", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const body = { roomId: 0 };

        const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send(body);

        expect(response.status).toBe(httpStatus.BAD_REQUEST);
      });
      it("should respond with status 400 when bookingId is less than 1", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const body = { roomId: 1 };

        const response = await server.put("/booking/0").set("Authorization", `Bearer ${token}`).send(body);

        expect(response.status).toBe(httpStatus.BAD_REQUEST);
      });
      it("should respond with status 400 when bookingId isNaN", async () => {
        const user = await createUser();
        const token = await generateValidToken(user);
        const body = { roomId: 1 };

        const response = await server.put("/booking/teste").set("Authorization", `Bearer ${token}`).send(body);

        expect(response.status).toBe(httpStatus.BAD_REQUEST);
      });
    });    
  });
});
