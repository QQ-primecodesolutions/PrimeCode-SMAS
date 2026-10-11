/**
 * BIZ-01 (Tech for Business): a problem slide, then one numbered sign or solution per slide with a
 * tick (or a cross, for a mistake), and a checklist along the bottom that fills in as you swipe.
 */
import { COLORS, FONTS, MARKS } from "@/brand/tokens";
import { BIZ, TYPE, type SignSlide } from "../model";
import { Icon, TextBody } from "../parts";

function MarkBox({ mark, size, filled }: { mark: SignSlide["mark"]; size: number; filled: boolean }) {
  const colour = MARKS[mark];
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
        border: filled ? "none" : `3px solid rgba(255, 255, 255, 0.22)`,
      }}
    >
      {filled ? <Icon name={mark} size={Math.round(size * 0.62)} color={COLORS.bg} stroke={3} /> : null}
    </div>
  );
}

export function SignBody({ model }: { model: SignSlide }) {
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
        <MarkBox mark={model.mark} size={BIZ.badge} filled />
        <div
          style={{
            display: "flex",
            marginLeft: 28,
            fontFamily: FONTS.mono,
            fontWeight: 600,
            fontSize: BIZ.numberSize,
            color: MARKS[model.mark],
          }}
        >
          {model.number}
        </div>
      </div>
      <TextBody text={model.text} />
    </div>
  );
}

/** Every sign as a box: ticked up to the current slide, empty after it. */
export function Checklist({ model }: { model: SignSlide }) {
  return (
    <div style={{ display: "flex", marginTop: BIZ.checklistGap }}>
      {model.checklist.map((c, i) => (
        <div key={i} style={{ display: "flex", marginLeft: i === 0 ? 0 : BIZ.checkGap }}>
          <MarkBox mark={c.mark} size={BIZ.check} filled={c.done} />
        </div>
      ))}
    </div>
  );
}
