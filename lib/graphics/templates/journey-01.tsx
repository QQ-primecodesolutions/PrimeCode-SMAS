/**
 * JOURNEY-01 (PrimeCode Journey): a real photograph, a light text overlay on a gradient, and a
 * long caption doing the work. LOCAL-01 uses the same photo layout for its local imagery.
 * Photos come from assets/photos/; never stock images presented as our own.
 */
import { FONTS, PHOTO_COLORS } from "@/brand/tokens";
import type { PhotoSlide } from "../model";
import { TextBody, themeOf } from "../parts";
import { upper } from "../text";


/** The full-bleed photo (or a placeholder while it's missing) under the scrim. */
export function PhotoBackdrop({ model }: { model: PhotoSlide }) {
  const { photo, width, height } = model;
  const name = model.asset.split("/").pop() ?? model.asset;
  return (
    <div style={{ display: "flex", position: "relative", width, height, overflow: "hidden", background: PHOTO_COLORS.empty }}>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- Satori, not the DOM
        <img
          src={photo.src}
          alt=""
          width={photo.width}
          height={photo.height}
          style={{ position: "absolute", left: photo.left, top: photo.top }}
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "absolute",
            top: Math.round(height * 0.3),
            left: 0,
            width,
            fontFamily: FONTS.mono,
          }}
        >
          <div style={{ display: "flex", fontWeight: 600, fontSize: 30, color: PHOTO_COLORS.placeholder }}>{upper("Photo needed")}</div>
          <div style={{ display: "flex", marginTop: 12, fontSize: 24, color: PHOTO_COLORS.placeholderText }}>{name}</div>
        </div>
      )}
      <div style={{ display: "flex", position: "absolute", top: 0, left: 0, width, height, backgroundImage: PHOTO_COLORS.scrim }} />
    </div>
  );
}

export function PhotoBody({ model }: { model: PhotoSlide }) {
  // A soft shadow keeps the text readable where the photo is bright behind the scrim.
  return (
    <div style={{ display: "flex", textShadow: PHOTO_COLORS.textShadow }}>
      <TextBody text={model.text} t={themeOf(model)} />
    </div>
  );
}
