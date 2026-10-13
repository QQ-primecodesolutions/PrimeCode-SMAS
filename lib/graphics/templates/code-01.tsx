/**
 * CODE-01 (Behind the Code): code set as text in an editor panel (JetBrains Mono, syntax colours),
 * never a screenshot; flow diagrams come from the TECH-01 primitives. Minimal copy.
 */
import { TYPE, type CodeSlide } from "../model";
import { CodePanel, Lines, themeOf } from "../parts";

/** Headline, the code panel, then the supporting line as a caption under it. */
export function CodeBody({ model }: { model: CodeSlide }) {
  const { text } = model;
  const t = themeOf(model);
  const gap = text.title.fontSize * TYPE.gap;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Lines block={text.title} style={{ fontWeight: 800, letterSpacing: `${TYPE.titleTracking}em`, color: t.headline }} />
      <div style={{ display: "flex", marginTop: gap }}>
        <CodePanel code={model.code} />
      </div>
      {text.subtitle ? <Lines block={text.subtitle} style={{ marginTop: gap, color: t.body }} /> : null}
    </div>
  );
}
