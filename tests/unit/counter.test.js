import { getNextSequence } from "../../src/models/counter.model.js";

describe("Atomic Counter", () => {
  test("getNextSequence increments atomically", async () => {
    const seq1 = await getNextSequence("testCounter");
    const seq2 = await getNextSequence("testCounter");
    const seq3 = await getNextSequence("testCounter");

    expect(seq1).toBe(1);
    expect(seq2).toBe(2);
    expect(seq3).toBe(3);
  });

  test("concurrent getNextSequence produces unique values", async () => {
    const promises = Array.from({ length: 10 }, () =>
      getNextSequence("concurrentCounter"),
    );
    const results = await Promise.all(promises);

    const uniqueResults = new Set(results);
    expect(uniqueResults.size).toBe(10);
  });
});
