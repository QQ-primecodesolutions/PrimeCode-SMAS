/**
 * PROJECT-01 (Build With PrimeCode): problem → what we built → why it mattered. Slides with a
 * screenshot show it in a drawn phone or laptop above the text; section titles ("THE PROBLEM")
 * become mono labels. Never show a client's site without written permission (clientPermission).
 */
import { DEVICE, TYPE, type DeviceSlide } from "../model";
import { DeviceFrame, TextBody } from "../parts";

export function DeviceBody({ model }: { model: DeviceSlide }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* The stage: a soft brand-blue panel the device sits centred on. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: DEVICE.height[model.size] + 2 * DEVICE.stagePad,
          marginBottom: model.text.title.fontSize * TYPE.gap,
          borderRadius: 32,
          backgroundImage: "linear-gradient(160deg, rgba(37, 99, 235, 0.22) 0%, rgba(6, 182, 212, 0.08) 100%)",
        }}
      >
        <DeviceFrame device={model.device} />
      </div>
      <TextBody text={model.text} />
    </div>
  );
}
