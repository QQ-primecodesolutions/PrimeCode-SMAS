/**
 * INSIGHT-01 (PrimeCode Insight): typography only; the sentence is the design. A cyan rule, one
 * bold sentence, supporting text below. Other templates use it for their opening and closing slides;
 * a slide with a section label shows the label instead of the rule.
 */
import { COLORS } from "@/brand/tokens";
import type { SlideLogo } from "../assets";
import { REVEAL, TYPE, type LogoSlide, type StatementSlide } from "../model";
import { TextBody, themeOf } from "../parts";

export function StatementBody({ model }: { model: StatementSlide }) {
  const t = themeOf(model);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {model.text.label ? null : (
        <div
          style={{
            display: "flex",
            width: 96,
            height: TYPE.rule,
            borderRadius: TYPE.rule / 2,
            background: t.accent,
            marginBottom: model.text.title.fontSize * TYPE.gap,
          }}
        />
      )}
      <TextBody text={model.text} t={t} />
    </div>
  );
}

/** A logo reveal: the full logo or the mark on a white panel (the logo's own colours), text below. */
export function LogoBody({ model, logo }: { model: LogoSlide; logo: SlideLogo }) {
  const t = themeOf(model);
  const { panel } = model;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: panel.width,
          height: panel.height,
          borderRadius: REVEAL.radius,
          border: `2px solid ${t.panelEdge}`,
          background: COLORS.white,
          marginBottom: model.text.title.fontSize * TYPE.gap,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- Satori, not the DOM */}
        <img src={logo[model.reveal.which]} alt="" width={model.reveal.width} height={model.reveal.height} />
      </div>
      <TextBody text={model.text} t={t} />
    </div>
  );
}
