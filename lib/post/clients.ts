/**
 * PrimeCode's real clients (Brand Brain §15). A post that mentions one needs written permission
 * on file before it can be approved (`clientPermission` in lib/post/schema.ts).
 */
export const CLIENTS = [
  { name: "Thiboloha Special School", match: /thiboloha/i },
  { name: "BZ Fitness and Wellness", match: /\bBZ\s+Fitness/i },
  { name: "Deliwe Legacy", match: /\bdeliwe\b/i },
  { name: "Borotho Tafoleng", match: /\bborotho\b/i },
] as const;

export type ClientName = (typeof CLIENTS)[number]["name"];

/** Clients named anywhere in `texts`. */
export function clientsNamedIn(texts: readonly string[]): ClientName[] {
  return CLIENTS.filter((c) => texts.some((t) => c.match.test(t))).map((c) => c.name);
}
