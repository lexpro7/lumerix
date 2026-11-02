import { describe, expect, it } from "vitest";
import { stepPanel, swipePanel } from "./PanelHandle";

describe("mobile panel gestures", () => {
  it("steps through all three states and clamps the endpoints", () => {
    expect(stepPanel("collapsed", -1)).toBe("collapsed");
    expect(stepPanel("collapsed", 1)).toBe("normal");
    expect(stepPanel("normal", 1)).toBe("expanded");
    expect(stepPanel("expanded", 1)).toBe("expanded");
    expect(stepPanel("expanded", -1)).toBe("normal");
    expect(stepPanel("normal", -1)).toBe("collapsed");
  });
  it("expands upward and collapses downward with slow drags", () => {
    expect(swipePanel("normal", -80, 500)).toBe("expanded");
    expect(swipePanel("normal", 80, 500)).toBe("collapsed");
  });
  it("recognizes short intentional swipes but ignores jitter and taps", () => {
    expect(swipePanel("normal", -24, 40)).toBe("expanded");
    expect(swipePanel("normal", 24, 40)).toBe("collapsed");
    expect(swipePanel("normal", 24, 500)).toBe("normal");
    expect(swipePanel("normal", -5, 1)).toBe("normal");
    expect(swipePanel("normal", 0, 0)).toBe("normal");
  });
});
