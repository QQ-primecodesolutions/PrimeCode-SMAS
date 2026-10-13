/**
 * BRAND-01 (PrimeCode Services): one service per slide, its icon on the brand gradient and a short
 * line, with the same four-service grid along the bottom of every slide (current service lit).
 * Lists only what PrimeCode sells (lib/post/services.ts; the schema refuses future services).
 */
import { FONTS, type Theme } from "@/brand/tokens";
import { SERVICES, type ServiceKey } from "@/lib/post/services";
import { BRAND, TYPE, type ServiceSlide } from "../model";
import { Icon, TextBody, themeOf } from "../parts";
import { upper } from "../text";

function ServiceTile({ service, size, lit, t }: { service: ServiceKey; size: number; lit: boolean; t: Theme }) {
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
        ...(lit ? { backgroundImage: t.tileLit } : { border: `3px solid ${t.tileEdge}` }),
      }}
    >
      <Icon
        name={service}
        size={Math.round(size * 0.5)}
        color={lit ? t.tileLitIcon : t.tileIcon}
        stroke={lit ? 2 : 1.75}
      />
    </div>
  );
}

export function ServiceBody({ model }: { model: ServiceSlide }) {
  const t = themeOf(model);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", marginBottom: model.text.title.fontSize * TYPE.gap }}>
        <ServiceTile service={model.service} size={BRAND.tile} lit t={t} />
      </div>
      <TextBody text={model.text} t={t} />
    </div>
  );
}

/** The four services in a row, each a tile and a label; `active` is lit. */
export function ServiceGrid({ active, width, t }: { active: ServiceKey | null; width: number; t: Theme }) {
  return (
    <div style={{ display: "flex", width, marginTop: BRAND.gridGap, height: BRAND.gridHeight }}>
      {SERVICES.map((s) => (
        <div key={s.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", flexGrow: 1, flexBasis: 0 }}>
          <ServiceTile service={s.key} size={BRAND.gridTile} lit={s.key === active} t={t} />
          <div
            style={{
              display: "flex",
              marginTop: 14,
              fontFamily: FONTS.mono,
              fontSize: BRAND.gridLabel,
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: s.key === active ? t.headline : t.muted,
            }}
          >
            {upper(s.short)}
          </div>
        </div>
      ))}
    </div>
  );
}
