/**
 * TECH-01 (PrimeCode Explains): a large question headline on the dark background, then simple
 * diagrams (boxes, arrows, labels, comparison columns), with the logo bottom-right.
 * CODE-01 reuses the diagram body for its flow diagrams.
 */
import { TYPE, type DiagramSlide } from "../model";
import { DiagramView, Lines, themeOf } from "../parts";

/** Headline, the diagram, then the supporting line as a caption under it. */
export function DiagramBody({ model }: { model: DiagramSlide }) {
  const { text } = model;
  const t = themeOf(model);
  const gap = text.title.fontSize * TYPE.gap;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Lines block={text.title} style={{ fontWeight: 800, letterSpacing: `${TYPE.titleTracking}em`, color: t.headline }} />
      <div style={{ display: "flex", marginTop: gap }}>
        <DiagramView diagram={model.diagram} t={t} />
      </div>
      {text.subtitle ? <Lines block={text.subtitle} style={{ marginTop: gap, color: t.body }} /> : null}
    </div>
  );
}
