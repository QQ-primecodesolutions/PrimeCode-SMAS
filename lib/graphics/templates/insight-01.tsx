/**
 * INSIGHT-01 (PrimeCode Insight): typography only; the sentence is the design. One bold sentence
 * per slide on the dark brand background, supporting text below, the CTA on the final slide.
 */
import { COLORS } from "@/brand/tokens";
import { INSIGHT, type InsightSlide } from "../model";
import { DarkFrame, Lines } from "../parts";

export function InsightSlideView({ model, logo }: { model: InsightSlide; logo: string }) {
  const { title, subtitle, items, cta } = model;
  const gap = title.fontSize * INSIGHT.subGap;
  return (
    <DarkFrame frame={model} logo={logo}>
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center" }}>
        <div style={{ display: "flex", width: 96, height: INSIGHT.rule, borderRadius: INSIGHT.rule / 2, background: COLORS.accent, marginBottom: gap }} />
        <Lines block={title} style={{ fontWeight: 800, letterSpacing: `${INSIGHT.titleTracking}em` }} />
        {subtitle ? <Lines block={subtitle} style={{ marginTop: gap, color: COLORS.lightMuted }} /> : null}
        {items.length ? (
          <div style={{ display: "flex", flexDirection: "column", marginTop: gap }}>
            {items.map((item, i) => (
              <div
                key={i}
                style={{ display: "flex", marginTop: i === 0 ? 0 : item.fontSize * INSIGHT.itemGap }}
              >
                <div
                  style={{
                    display: "flex",
                    width: item.fontSize * INSIGHT.itemIndent,
                    paddingTop: (item.fontSize * item.lineHeight) / 2 - 4,
                  }}
                >
                  <div style={{ display: "flex", width: item.fontSize * 0.55, height: 8, borderRadius: 4, background: COLORS.accent }} />
                </div>
                <Lines block={item} style={{ fontWeight: 600 }} />
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {cta ? (
        <div
          style={{
            display: "flex",
            marginTop: INSIGHT.ctaGap,
            borderLeft: `6px solid ${COLORS.accent}`,
            paddingLeft: INSIGHT.ctaIndent - 6,
          }}
        >
          <Lines block={cta} style={{ fontWeight: 600, color: COLORS.white }} />
        </div>
      ) : null}
    </DarkFrame>
  );
}
