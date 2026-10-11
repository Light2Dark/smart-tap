import { create } from "qrcode";

/** Dark modules of a QR symbol, without the quiet zone. */
export function qrModules(text: string) {
  const qr = create(text, { errorCorrectionLevel: "M" });
  const size = qr.modules.size;
  const modules: boolean[][] = [];
  for (let row = 0; row < size; row += 1) {
    const line: boolean[] = [];
    for (let col = 0; col < size; col += 1) {
      line.push(qr.modules.get(row, col) === 1);
    }
    modules.push(line);
  }
  return modules;
}
