import { describe, expect, it } from "vitest";
import { futureServicesIn, serviceOf } from "@/lib/post/services";

describe("services", () => {
  it("recognises the four services in slide titles", () => {
    expect(["WEBSITES", "Website", "WEB APPLICATIONS", "Web apps", "Custom software.", "SEO"].map(serviceOf)).toEqual([
      "websites",
      "websites",
      "web-applications",
      "web-applications",
      "custom-software",
      "seo",
    ]);
    expect(serviceOf("Mobile apps")).toBeNull();
    expect(serviceOf("Websites. Web applications. Custom software.")).toBeNull();
  });

  it("spots future services", () => {
    expect(futureServicesIn(["We build mobile apps", "API integrations", "Automate your invoices"])).toEqual([
      "Mobile apps",
      "Backend/API development",
      "System integration",
      "Automation",
    ]);
    expect(futureServicesIn(["Bookings. Registrations. Dashboards."])).toEqual([]);
  });
});
