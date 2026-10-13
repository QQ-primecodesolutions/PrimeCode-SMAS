/**
 * INSIGHT-01 (PrimeCode Insight): typography only; the sentence is the design. A cyan rule, one
 * bold sentence, supporting text below. Other templates use it for their opening and closing slides;
 * a slide with a section label shows the label instead of the rule.
 */
import { TYPE, type StatementSlide } from "../model";
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
