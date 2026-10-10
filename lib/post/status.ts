/**
 * Post status workflow (workbook Reference sheet). Only the founder sets APPROVED; Claude may draft
 * and move posts up to HUMAN_REVIEW (or back to REVISION).
 */
export const STATUSES = [
  "IDEA",
  "SELECTED",
  "DRAFT",
  "AI_REVIEW",
  "HUMAN_REVIEW",
  "REVISION",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "ANALYSED",
  "ARCHIVED",
] as const;

export type Status = (typeof STATUSES)[number];

const rank = (s: Status) => STATUSES.indexOf(s);

/** APPROVED or any later stage: a human has signed the post off. */
export const isApprovedOrLater = (s: Status) => rank(s) >= rank("APPROVED");

/** Cleared to load into Meta Business Suite (Reference: "Only APPROVED or SCHEDULED"). */
export const isCleared = (s: Status) => s === "APPROVED" || s === "SCHEDULED" || s === "PUBLISHED";

/** Statuses Claude may set. Everything from APPROVED on is the founder's call. */
export const canAgentSet = (s: Status) => !isApprovedOrLater(s);

/** Still being written: a carousel may have a placeholder single slide. */
export const isEarly = (s: Status) => s === "IDEA" || s === "SELECTED";
