import { describe, expect, it } from "vitest";
import { questConfig } from "../config/quest.config";
import { assertValidConfig, validateQuestConfig } from "./configValidator";

describe("validateQuestConfig", () => {
  it("accepts the shipped quest config", () => {
    const result = validateQuestConfig(questConfig);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects a mismatched task count", () => {
    const result = validateQuestConfig({
      ...questConfig,
      taskCount: 2,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.field === "tasks")).toBe(true);
  });

  it("throws from assertValidConfig when invalid", () => {
    expect(() =>
      assertValidConfig({ ...questConfig, taskCount: 0, tasks: [] }),
    ).toThrow(/invalid/i);
  });
});
