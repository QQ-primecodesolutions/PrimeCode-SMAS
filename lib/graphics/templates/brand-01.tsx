/**
 * BRAND-01 (PrimeCode Services): one service per slide, its icon on the brand gradient and a short
 * line, with the same four-service grid along the bottom of every slide (current service lit).
 * Lists only what PrimeCode sells (lib/post/services.ts; the schema refuses future services).
 */
import { COLORS, FONTS, GRADIENT_PRIMARY } from "@/brand/tokens";
import { SERVICES, type ServiceKey } from "@/lib/post/services";
import { BRAND, TYPE, type ServiceSlide } from "../model";
import { Icon, TextBody } from "../parts";
import { upper } from "../text";

function ServiceTile({ service, size, lit }: { service: ServiceKey; size: number; lit: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: size * 0.26,
        // Satori rejects backgroundImage: "none", so leave the property out instead.
        ...(lit ? { backgroundImage: GRADIENT_PRIMARY } : { border: "3px solid rgba(255, 255, 255, 0.18)" }),
      }}
    >
      <Icon
        name={service}
        size={Math.round(size * 0.5)}
        color={lit ? COLORS.white : "rgba(226, 232, 240, 0.55)"}
        stroke={lit ? 2 : 1.75}
      />
    </div>
  );
}

export function ServiceBody({ model }: { model: ServiceSlide }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", marginBottom: model.text.title.fontSize * TYPE.gap }}>
        <ServiceTile service={model.service} size={BRAND.tile} lit />
      </div>
      <TextBody text={model.text} />
    </div>
  );
}

/** The four services in a row, each a tile and a label; `active` is lit. */
export function ServiceGrid({ active, width }: { active: ServiceKey | null; width: number }) {
  return (
    <div style={{ display: "flex", width, marginTop: BRAND.gridGap, height: BRAND.gridHeight }}>
      {SERVICES.map((s) => (
        <div key={s.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", flexGrow: 1, flexBasis: 0 }}>
          <ServiceTile service={s.key} size={BRAND.gridTile} lit={s.key === active} />
          <div
            style={{
              display: "flex",
              marginTop: 14,
              fontFamily: FONTS.mono,
              fontSize: BRAND.gridLabel,
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: s.key === active ? COLORS.white : "rgba(226, 232, 240, 0.6)",
            }}
          >
            {upper(s.short)}
          </div>
        </div>
      ))}
    </div>
  );
}
