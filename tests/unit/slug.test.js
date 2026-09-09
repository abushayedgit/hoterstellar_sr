import {
  generateSlug,
  isValidSlug,
  generateUniqueSlug,
} from "../../src/utils/slug.js";

describe("Slug Utilities", () => {
  test("generateSlug converts text to slug", () => {
    expect(generateSlug("Hello World")).toBe("hello-world");
    expect(generateSlug("  Multiple   Spaces  ")).toBe("multiple-spaces");
    expect(generateSlug("Special!@#$%^&*()Chars")).toBe("specialchars");
  });

  test("isValidSlug validates slug format", () => {
    expect(isValidSlug("valid-slug-123")).toBe(true);
    expect(isValidSlug("Invalid Slug")).toBe(false);
    expect(isValidSlug("")).toBe(false);
  });

  test("generateUniqueSlug appends number if exists", async () => {
    let count = 0;
    const checkExists = async () => {
      count++;
      return count === 1; // First check returns true (exists)
    };

    const slug = await generateUniqueSlug("Test", checkExists);
    expect(slug).toBe("test-1");
  });
});
