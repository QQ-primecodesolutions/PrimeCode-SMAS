/**
 * One slide: the dark frame, the body for the slide's kind (centred), then the CTA on the final
 * slide and whatever the template keeps along the bottom (BIZ-01 checklist, BRAND-01 grid).
 */
import { contentBox, type SlideModel } from "../model";
import { Cta, DarkFrame } from "../parts";
import { Checklist, SignBody } from "./biz-01";
import { ServiceBody, ServiceGrid } from "./brand-01";
import { StatementBody } from "./insight-01";
import { CodeBody } from "./code-01";
import { DeviceBody } from "./project-01";
import { DiagramBody } from "./tech-01";

export function SlideCanvas({ model, logo }: { model: SlideModel; logo: string }) {
  return (
    <DarkFrame frame={model} logo={logo}>
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center" }}>
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
