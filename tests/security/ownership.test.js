import request from "supertest";
import app from "../../src/app/app.js";
import { User } from "../../src/modules/auth/user/user.model.js";
import { Order } from "../../src/modules/order/order.model.js";
import jwt from "jsonwebtoken";
import { env } from "../../src/config/env.js";

describe("Ownership Security", () => {
  let user1, user2, user1Token, user2Token;

  beforeEach(async () => {
    user1 = await User.create({
      email: "user1@test.com",
      name: "User One",
      phone: "1234567890",
    });

    user2 = await User.create({
      email: "user2@test.com",
      name: "User Two",
      phone: "0987654321",
    });

    user1Token = jwt.sign(
      { sub: user1._id.toString(), userId: user1._id.toString(), type: "user" },
      env.USER_JWT_SECRET,
      { expiresIn: "15m" },
    );

    user2Token = jwt.sign(
      { sub: user2._id.toString(), userId: user2._id.toString(), type: "user" },
      env.USER_JWT_SECRET,
      { expiresIn: "15m" },
    );

    await Order.create({
      orderNumber: "ORD-TEST-001",
      userId: user1._id,
      items: [
        {
          food: new mongoose.Types.ObjectId(),
          name: "Test",
          unitPrice: 10,
          quantity: 1,
          lineTotal: 10,
        },
      ],
      subtotal: 10,
      totalAmount: 10,
      customerName: "User One",
      phone: "1234567890",
      orderType: "pickup",
      paymentMethod: "cash",
      status: "completed",
    });
  });

  test("User cannot access another user order", async () => {
    const order = await Order.findOne({ userId: user1._id });

    const response = await request(app)
      .get(`/api/v1/orders/${order._id}`)
      .set("Authorization", `Bearer ${user2Token}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});
