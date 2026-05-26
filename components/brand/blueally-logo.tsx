"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// White-on-dark and blue-on-light variants. Picks the right one from resolvedTheme,
// renders a neutral placeholder pre-mount to avoid hydration flash.
export default function BlueAllyLogo({
  height = 36,
}: {
  height?: number;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Source aspect ratios from blueally.com:
  //   header-logo.png (white)      225 x 70
  //   blue-header-logo.png (blue)  197 x 62
  // Render width tracks aspect so height stays consistent.
  const isLight = resolvedTheme === "light";
  const src = isLight ? "/brand/blueally-blue.png" : "/brand/blueally-white.png";
  const ratio = isLight ? 197 / 62 : 225 / 70;
  const width = Math.round(height * ratio);

  if (!mounted) {
    return (
      <div
        aria-hidden
        style={{ width, height, opacity: 0 }}
      />
    );
  }

  return (
    <Image
      src={src}
      alt="BlueAlly"
      width={width}
      height={height}
      priority
      style={{ height, width: "auto" }}
    />
  );
}
