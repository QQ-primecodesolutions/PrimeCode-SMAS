/**
 * TECH-01 (PrimeCode Explains): a large question headline on the dark background, then simple
 * diagrams (boxes, arrows, labels, comparison columns), with the logo bottom-right.
 * CODE-01 reuses the diagram body for its flow diagrams.
 */
import { COLORS } from "@/brand/tokens";
import { TYPE, type DiagramSlide } from "../model";
import { DiagramView, Lines } from "../parts";

/** Headline, the diagram, then the supporting line as a caption under it. */
export function DiagramBody({ model }: { model: DiagramSlide }) {
  const { text } = model;
  const gap = text.title.fontSize * TYPE.gap;
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Lines block={text.title} style={{ fontWeight: 800, letterSpacing: `${TYPE.titleTracking}em` }} />
      <div style={{ display: "flex", marginTop: gap }}>
        <DiagramView diagram={model.diagram} />
      </div>
      {text.subtitle ? <Lines block={text.subtitle} style={{ marginTop: gap, color: COLORS.lightMuted }} /> : null}
    </div>
  );
}
