/**
 * BIZ-01 (Tech for Business): a problem slide, then one numbered sign or solution per slide with a
 * tick (or a cross, for a mistake), and a checklist along the bottom that fills in as you swipe.
 */
import { FONTS, type Theme } from "@/brand/tokens";
import { BIZ, TYPE, type SignSlide } from "../model";
import { Icon, TextBody, themeOf } from "../parts";

function MarkBox({ mark, size, filled, t }: { mark: SignSlide["mark"]; size: number; filled: boolean; t: Theme }) {
  const colour = t[mark];
  return (
    <div
      style={{
        display: "flex",
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: mark === "tick" ? size / 2 : size * 0.28,
        background: filled ? colour : "transparent",
        border: filled ? "none" : `3px solid ${t.tileEdge}`,
      }}
    >
      {filled ? <Icon name={mark} size={Math.round(size * 0.62)} color={t.markInk} stroke={3} /> : null}
    </div>
  );
}

export function SignBody({ model }: { model: SignSlide }) {
  const t = themeOf(model);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: BIZ.badge,
          marginBottom: model.text.title.fontSize * TYPE.gap,
        }}
      >
        <MarkBox mark={model.mark} size={BIZ.badge} filled t={t} />
        <div
          style={{
            display: "flex",
            marginLeft: 28,
            fontFamily: FONTS.mono,
            fontWeight: 600,
            fontSize: BIZ.numberSize,
            color: t[model.mark],
          }}
        >
          {model.number}
        </div>
      </div>
      <TextBody text={model.text} t={t} />
    </div>
  );
}

/** Every sign as a box: ticked up to the current slide, empty after it. */
export function Checklist({ model }: { model: SignSlide }) {
  const t = themeOf(model);
  return (
    <div style={{ display: "flex", marginTop: BIZ.checklistGap }}>
      {model.checklist.map((c, i) => (
        <div key={i} style={{ display: "flex", marginLeft: i === 0 ? 0 : BIZ.checkGap }}>
          <MarkBox mark={c.mark} size={BIZ.check} filled={c.done} t={t} />
        </div>
      ))}
    </div>
  );
}
