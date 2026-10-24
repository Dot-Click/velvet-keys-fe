/** One line or paragraph of a generated PDF; long text wraps to the page width. */
export interface PdfLine {
  text: string;
  size?: number;
  bold?: boolean;
  /** Extra space above the line, in points */
  gap?: number;
  /** Draws a gold rule under the line */
  rule?: boolean;
}

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 56;

/** Characters outside Latin-1 that WinAnsiEncoding (cp1252) still has a slot for. */
const WIN_ANSI: Record<string, number> = {
  "€": 0x80,
  "…": 0x85,
  "‘": 0x91,
  "’": 0x92,
  "“": 0x93,
  "”": 0x94,
  "•": 0x95,
  "–": 0x96,
  "—": 0x97,
};

/** Escapes text for a PDF string literal, writing non-ASCII bytes as octal escapes. */
function encode(text: string) {
  let out = "";
  for (const char of text.normalize("NFC")) {
    const code = char.codePointAt(0) ?? 63;
    if (char === "(" || char === ")" || char === "\\") out += `\\${char}`;
    else if (code >= 32 && code < 127) out += char;
    else if (code === 0x202f || code === 0xa0) out += " ";
    else if (WIN_ANSI[char] !== undefined) out += `\\${WIN_ANSI[char].toString(8)}`;
    else if (code >= 0xa1 && code <= 0xff) out += `\\${code.toString(8)}`;
    else out += "?";
  }
  return out;
}

/** Splits text into lines that fit the page at the given size (Helvetica averages ~0.5 em). */
function wrap(text: string, size: number) {
  const maxChars = Math.floor((PAGE_WIDTH - MARGIN * 2) / (size * 0.5));
  const lines: string[] = [];
  let current = "";
  for (const word of text.split(" ")) {
    if (current && `${current} ${word}`.length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Builds a single-page A4 PDF of plain text in Helvetica. Enough for sample documents in the
 * demo; text that does not fit on one page is cut off.
 */
export function createTextPdf(lines: PdfLine[]): Blob {
  let y = PAGE_HEIGHT - MARGIN;
  let stream = "";
  for (const line of lines) {
    const size = line.size ?? 11;
    y -= line.gap ?? 0;
    for (const part of wrap(line.text, size)) {
      y -= size * 1.45;
      if (y < MARGIN) break;
      stream += `BT /${line.bold ? "F2" : "F1"} ${size} Tf ${MARGIN} ${y.toFixed(1)} Td (${encode(part)}) Tj ET\n`;
    }
    if (line.rule && y >= MARGIN) {
      y -= 8;
      stream += `0.831 0.686 0.216 RG 0.8 w ${MARGIN} ${y.toFixed(1)} m ${PAGE_WIDTH - MARGIN} ${y.toFixed(1)} l S\n`;
    }
  }

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}endstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Blob([pdf], { type: "application/pdf" });
}
