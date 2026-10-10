import { describe, expect, it } from "vitest";
import { STATUSES, canAgentSet, isApprovedOrLater, isCleared } from "@/lib/post/status";

describe("status", () => {
  it("only lets Claude set statuses before APPROVED", () => {
    expect(STATUSES.filter(canAgentSet)).toEqual(["IDEA", "SELECTED", "DRAFT", "AI_REVIEW", "HUMAN_REVIEW", "REVISION"]);
  });

  it("clears APPROVED, SCHEDULED and PUBLISHED for publishing", () => {
    expect(STATUSES.filter(isCleared)).toEqual(["APPROVED", "SCHEDULED", "PUBLISHED"]);
    expect(isApprovedOrLater("ARCHIVED")).toBe(true);
    expect(isApprovedOrLater("REVISION")).toBe(false);
  });
});
