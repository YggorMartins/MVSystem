import { describe, expect, it, vi } from "vitest";
import { createBarcodeAccumulator } from "./barcode";
describe("barcode scanner", () => {
  it("captures rapid scanner input ending in Enter", () => {
    const scanned = vi.fn();
    const read = createBarcodeAccumulator(scanned);
    [..."789123456"].forEach((key, index) => read(key, index * 10));
    read("Enter", 100);
    expect(scanned).toHaveBeenCalledWith("789123456");
  });
  it("discards slow human typing", () => {
    const scanned = vi.fn();
    const read = createBarcodeAccumulator(scanned);
    read("1", 1);
    read("2", 200);
    read("Enter", 210);
    expect(scanned).not.toHaveBeenCalled();
  });
});
