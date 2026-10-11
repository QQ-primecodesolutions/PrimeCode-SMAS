/**
 * One slide: the dark frame, the body for the slide's kind (centred), then the CTA on the final
 * slide and whatever the template keeps along the bottom (BIZ-01 checklist, BRAND-01 grid).
 */
import { contentBox, type SlideModel } from "../model";
import { Badge, Cta, DarkFrame } from "../parts";
import { Checklist, SignBody } from "./biz-01";
import { ServiceBody, ServiceGrid } from "./brand-01";
import { StatementBody } from "./insight-01";
import { CodeBody } from "./code-01";
import { PhotoBackdrop, PhotoBody } from "./journey-01";
import { DeviceBody } from "./project-01";
import { DiagramBody } from "./tech-01";

export function SlideCanvas({ model, logo }: { model: SlideModel; logo: string }) {
  return (
    <DarkFrame frame={model} logo={logo} backdrop={model.kind === "photo" ? <PhotoBackdrop model={model} /> : undefined}>
      {model.badge ? <Badge text={model.badge} /> : null}
      {/* Photo slides keep their text low so the photo shows; the rest are centred. */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          justifyContent: model.kind === "photo" ? "flex-end" : "center",
        }}
      >
        {model.kind === "sign" ? (
          <SignBody model={model} />
        ) : model.kind === "service" ? (
          <ServiceBody model={model} />
        ) : model.kind === "device" ? (
          <DeviceBody model={model} />
        ) : model.kind === "diagram" ? (
          <DiagramBody model={model} />
        ) : model.kind === "code" ? (
          <CodeBody model={model} />
        ) : model.kind === "photo" ? (
          <PhotoBody model={model} />
        ) : (
          <StatementBody model={model} />
        )}
      </div>
      {model.cta ? <Cta block={model.cta} /> : null}
      {model.kind === "sign" ? <Checklist model={model} /> : null}
      {model.grid ? <ServiceGrid active={model.grid.active} width={contentBox(model.size).width} /> : null}
    </DarkFrame>
  );
}
