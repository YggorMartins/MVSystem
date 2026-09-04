export function createBarcodeAccumulator(onScan: (barcode: string) => void, maxGapMs = 60) {
  let buffer = "";
  let lastKeyAt = 0;
  return (key: string, now = Date.now()) => {
    if (key === "Enter") {
      if (buffer.length >= 6) onScan(buffer);
      buffer = "";
      lastKeyAt = 0;
      return;
    }
    if (!/^\d$/.test(key)) return;
    if (lastKeyAt && now - lastKeyAt > maxGapMs) buffer = "";
    buffer += key;
    lastKeyAt = now;
  };
}
