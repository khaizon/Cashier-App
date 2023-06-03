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

  // Return the HSL string
  const hslOutput = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  return hslOutput;
};
