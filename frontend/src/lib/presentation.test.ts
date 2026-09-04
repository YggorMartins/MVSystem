import { describe, expect, it } from "vitest";
import { canAccess, getGreeting } from "./presentation";

describe("presentation rules", () => {
  it.each([
    [5, "Bom dia"],
    [11, "Bom dia"],
    [12, "Boa tarde"],
    [17, "Boa tarde"],
    [18, "Boa noite"],
    [23, "Boa noite"],
  ] as const)("greets at %i:00", (hour, expected) => {
    const date = new Date(2026, 8, 3, hour);
    expect(getGreeting(date)).toBe(expected);
  });
  it("enforces role lists", () => {
    expect(canAccess("admin", ["admin"])).toBe(true);
    expect(canAccess("caixa", ["admin"])).toBe(false);
  });
});
