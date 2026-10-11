/**
 * What PrimeCode sells (Brand Brain §4, Brand Knowledge sheet). BRAND-01 graphics list only these.
 * Future services may be mentioned in educational posts, never presented as something we sell.
 */
export const SERVICES = [
  { key: "websites", name: "Websites", short: "Websites", match: /^websites?$/i },
  { key: "web-applications", name: "Web applications", short: "Web apps", match: /^web\s+(applications?|apps?)$/i },
  { key: "custom-software", name: "Custom software", short: "Custom software", match: /^custom\s+software$/i },
  { key: "seo", name: "SEO", short: "SEO", match: /^seo$/i },
] as const;

export type ServiceKey = (typeof SERVICES)[number]["key"];

/** The service a slide title names ("WEBSITES", "Web apps"), if any. */
export function serviceOf(title: string): ServiceKey | null {
  const t = title.trim().replace(/[.:!]+$/, "");
  return SERVICES.find((s) => s.match.test(t))?.key ?? null;
}

/** Brand Knowledge: "Future services (educational mention only)". */
export const FUTURE_SERVICES = [
  { name: "Mobile apps", match: /\bmobile\s+apps?\b/i },
  { name: "Backend/API development", match: /\bAPIs?\b/ },
  { name: "System integration", match: /\bintegrations?\b/i },
  { name: "IT support", match: /\bIT\s+support\b/ },
  { name: "UI/UX", match: /\bUI\s*\/\s*UX\b/i },
  { name: "Automation", match: /\bautomat(e|es|ed|ing|ion)\b/i },
] as const;

/** Future services mentioned anywhere in `texts`. */
export function futureServicesIn(texts: readonly string[]): string[] {
  return FUTURE_SERVICES.filter((f) => texts.some((t) => f.match.test(t))).map((f) => f.name);
}
