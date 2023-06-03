export const hexToBrighterHSL = (hexString: string, increaseLightness: number): string => {
  // Remove the '#' character from the hex string
  hexString = hexString.replace('#', '');

  // Convert the hex string to RGB values
  const r = parseInt(hexString.substr(0, 2), 16);
  const g = parseInt(hexString.substr(2, 2), 16);
  const b = parseInt(hexString.substr(4, 2), 16);

  // Convert RGB to HSL
  let h = 0,
    s = 0,
    l = 0;
  const rNormalized = r / 255;
  const gNormalized = g / 255;
  const bNormalized = b / 255;
  const max = Math.max(rNormalized, gNormalized, bNormalized);
  const min = Math.min(rNormalized, gNormalized, bNormalized);
  l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case rNormalized:
        h = ((gNormalized - bNormalized) / d + (gNormalized < bNormalized ? 6 : 0)) / 6;
        break;
      case gNormalized:
        h = ((bNormalized - rNormalized) / d + 2) / 6;
        break;
      case bNormalized:
        h = ((rNormalized - gNormalized) / d + 4) / 6;
        break;
    }
  }

  // Increase the lightness value
  l = Math.min(1, l + increaseLightness);

  // Convert HSL back to RGB
  let rOutput, gOutput, bOutput;
  if (s === 0) {
    rOutput = gOutput = bOutput = l;
  } else {
    const hueToRgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    rOutput = hueToRgb(p, q, h + 1 / 3);
    gOutput = hueToRgb(p, q, h);
    bOutput = hueToRgb(p, q, h - 1 / 3);
  }

  // Convert RGB to hex
  const rHex = Math.round(rOutput * 255)
    .toString(16)
    .padStart(2, '0');
  const gHex = Math.round(gOutput * 255)
    .toString(16)
    .padStart(2, '0');
  const bHex = Math.round(bOutput * 255)
    .toString(16)
    .padStart(2, '0');
  const hexOutput = `#${rHex}${gHex}${bHex}`;

  // Return the HSL string
  const hslOutput = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  return hslOutput;
};
