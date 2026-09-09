import request from "supertest";
import app from "../../src/app/app.js";
import { Food } from "../../src/modules/food/food.model.js";
import { Category } from "../../src/modules/category/category.model.js";

describe("Food Module", () => {
  let categoryId;

  beforeEach(async () => {
    const category = await Category.create({
      name: "Test Category",
      slug: "test-category",
    });
    categoryId = category._id;
  });

  test("GET /api/v1/foods returns empty list", async () => {
    const response = await request(app).get("/api/v1/foods");
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.data).toHaveLength(0);
  });

  test("GET /api/v1/foods returns foods", async () => {
    await Food.create({
      name: "Test Food",
      slug: "test-food",
      description: "A test food description",
      price: 100,
      category: categoryId,
      images: [{ url: "https://example.com/food.jpg", fileId: "file-123" }],
    });

    const response = await request(app).get("/api/v1/foods");
    expect(response.status).toBe(200);
    expect(response.body.data.data).toHaveLength(1);
    expect(response.body.data.data[0].name).toBe("Test Food");
  });

  test("GET /api/v1/foods/:id returns food", async () => {
    const food = await Food.create({
      name: "Test Food",
      slug: "test-food",
      description: "A test food description",
      price: 100,
      category: categoryId,
      images: [{ url: "https://example.com/food.jpg", fileId: "file-123" }],
    });

    const response = await request(app).get(`/api/v1/foods/${food._id}`);
    expect(response.status).toBe(200);
    expect(response.body.data.food.name).toBe("Test Food");
  });

  test("GET /api/v1/foods/:id with invalid ID returns 400", async () => {
    const response = await request(app).get("/api/v1/foods/invalid-id");
    expect(response.status).toBe(400);
  });
});
