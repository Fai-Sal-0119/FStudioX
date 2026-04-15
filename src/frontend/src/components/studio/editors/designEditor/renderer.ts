// ─── Design Editor Canvas Renderer ───────────────────────────────────────────

import { type CanvasShape, GRID_SIZE } from "./types";

export function drawHexagon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3 - Math.PI / 6;
    const px = cx + rx * Math.cos(angle);
    const py = cy + ry * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

export function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  points = 5,
) {
  const inner = 0.4;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? 1 : inner;
    ctx.lineTo(cx + rx * r * Math.cos(angle), cy + ry * r * Math.sin(angle));
  }
  ctx.closePath();
}

export function drawTriangle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const hw = h * 0.4;
  const sw = h * 0.25;
  const headX = x + w;
  ctx.beginPath();
  ctx.moveTo(x, y + h / 2 - sw / 2);
  ctx.lineTo(headX - hw, y + h / 2 - sw / 2);
  ctx.lineTo(headX - hw, y);
  ctx.lineTo(headX, y + h / 2);
  ctx.lineTo(headX - hw, y + h);
  ctx.lineTo(headX - hw, y + h / 2 + sw / 2);
  ctx.lineTo(x, y + h / 2 + sw / 2);
  ctx.closePath();
}

function drawShapeBody(ctx: CanvasRenderingContext2D, shape: CanvasShape) {
  const { x, y, width: w, height: h } = shape;
  if (shape.type === "rect") {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
  } else if (shape.type === "circle") {
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  } else if (shape.type === "line") {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineWidth = Math.max(shape.strokeWidth, 1);
    ctx.strokeStyle = shape.stroke !== "transparent" ? shape.stroke : "#FFFFFF";
    ctx.stroke();
    return;
  } else if (shape.type === "text" && shape.text) {
    const weight = shape.bold ? "bold" : "normal";
    const style = shape.italic ? "italic" : "normal";
    ctx.font = `${style} ${weight} ${shape.fontSize ?? 20}px ${shape.fontFamily ?? "Inter"}, sans-serif`;
    ctx.fillStyle = shape.stroke !== "transparent" ? shape.stroke : "#FFFFFF";
    const lines = shape.text.split("\n");
    const lh = (shape.fontSize ?? 20) * 1.3;
    lines.forEach((line, li) => {
      ctx.fillText(line, x, y + (shape.fontSize ?? 20) + li * lh);
    });
    return;
  } else if (shape.type === "triangle") {
    drawTriangle(ctx, x, y, w, h);
  } else if (shape.type === "star") {
    drawStar(ctx, x + w / 2, y + h / 2, w / 2, h / 2);
  } else if (shape.type === "hexagon") {
    drawHexagon(ctx, x + w / 2, y + h / 2, w / 2, h / 2);
  } else if (shape.type === "arrow") {
    drawArrow(ctx, x, y, w, h);
  }
  if (shape.fill !== "transparent") ctx.fill();
  if (shape.strokeWidth > 0) ctx.stroke();
}

export function renderCanvas(
  canvas: HTMLCanvasElement,
  shapes: CanvasShape[],
  selectedId: string | null,
  bgColor: string,
  canvasW: number,
  canvasH: number,
  showGrid: boolean,
  zoom: number,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dw = canvasW * zoom;
  const dh = canvasH * zoom;
  canvas.width = dw;
  canvas.height = dh;
  ctx.scale(zoom, zoom);

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Grid
  if (showGrid) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 0.5;
    for (let gx = 0; gx <= canvasW; gx += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, canvasH);
      ctx.stroke();
    }
    for (let gy = 0; gy <= canvasH; gy += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(canvasW, gy);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Shapes
  for (const shape of shapes) {
    if (!shape.visible) continue;
    ctx.save();
    ctx.globalAlpha = shape.opacity;
    ctx.fillStyle = shape.fill === "transparent" ? "rgba(0,0,0,0)" : shape.fill;
    ctx.strokeStyle =
      shape.stroke === "transparent" ? "rgba(0,0,0,0)" : shape.stroke;
    ctx.lineWidth = shape.strokeWidth;

    if (shape.rotation !== 0) {
      const cx = shape.x + shape.width / 2;
      const cy = shape.y + shape.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate((shape.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }

    drawShapeBody(ctx, shape);

    if (shape.id === selectedId) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#E11D2E";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(
        shape.x - 5,
        shape.y - 5,
        shape.width + 10,
        shape.height + 10,
      );
      ctx.setLineDash([]);
      // Resize handles (8 corners + edges)
      const hx = [
        shape.x - 5,
        shape.x + shape.width / 2 - 4,
        shape.x + shape.width + 1,
      ];
      const hy = [
        shape.y - 5,
        shape.y + shape.height / 2 - 4,
        shape.y + shape.height + 1,
      ];
      ctx.fillStyle = "#E11D2E";
      for (const hxx of hx) for (const hyy of hy) ctx.fillRect(hxx, hyy, 7, 7);
      // Rotation handle (circle above top-center)
      const rotX = shape.x + shape.width / 2;
      const rotY = shape.y - 22;
      ctx.beginPath();
      ctx.arc(rotX, rotY, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#E11D2E";
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1;
      ctx.stroke();
      // Line from shape to rotation handle
      ctx.beginPath();
      ctx.strokeStyle = "rgba(225,29,46,0.5)";
      ctx.moveTo(rotX, shape.y - 5);
      ctx.lineTo(rotX, rotY);
      ctx.stroke();
    }
    ctx.restore();
  }
}

export function exportSVG(
  shapes: CanvasShape[],
  bgColor: string,
  w: number,
  h: number,
): string {
  const lines: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
  ];
  lines.push(`<rect width="${w}" height="${h}" fill="${bgColor}"/>`);
  for (const s of shapes) {
    if (!s.visible) continue;
    const transform =
      s.rotation !== 0
        ? ` transform="rotate(${s.rotation},${s.x + s.width / 2},${s.y + s.height / 2})"`
        : "";
    const fill = s.fill === "transparent" ? "none" : s.fill;
    const stroke = s.stroke === "transparent" ? "none" : s.stroke;
    const base = `fill="${fill}" stroke="${stroke}" stroke-width="${s.strokeWidth}" opacity="${s.opacity}"`;
    if (s.type === "rect") {
      lines.push(
        `<rect x="${s.x}" y="${s.y}" width="${s.width}" height="${s.height}" ${base}${transform}/>`,
      );
    } else if (s.type === "circle") {
      lines.push(
        `<ellipse cx="${s.x + s.width / 2}" cy="${s.y + s.height / 2}" rx="${s.width / 2}" ry="${s.height / 2}" ${base}${transform}/>`,
      );
    } else if (s.type === "line") {
      lines.push(
        `<line x1="${s.x}" y1="${s.y}" x2="${s.x + s.width}" y2="${s.y + s.height}" stroke="${stroke}" stroke-width="${Math.max(s.strokeWidth, 1)}"${transform}/>`,
      );
    } else if (s.type === "text" && s.text) {
      const fw = s.bold ? "bold" : "normal";
      const fs = s.italic ? "italic" : "normal";
      lines.push(
        `<text x="${s.x}" y="${s.y + (s.fontSize ?? 20)}" font-family="${s.fontFamily ?? "Inter"}" font-size="${s.fontSize ?? 20}" font-weight="${fw}" font-style="${fs}" fill="${stroke !== "none" ? stroke : "#fff"}"${transform}>${s.text}</text>`,
      );
    } else if (s.type === "triangle") {
      const pts = `${s.x + s.width / 2},${s.y} ${s.x + s.width},${s.y + s.height} ${s.x},${s.y + s.height}`;
      lines.push(`<polygon points="${pts}" ${base}${transform}/>`);
    } else if (s.type === "star") {
      const starCx = s.x + s.width / 2;
      const starCy = s.y + s.height / 2;
      const starRx = s.width / 2;
      const starRy = s.height / 2;
      const starPts: string[] = [];
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? 1 : 0.4;
        starPts.push(
          `${starCx + starRx * r * Math.cos(angle)},${starCy + starRy * r * Math.sin(angle)}`,
        );
      }
      lines.push(
        `<polygon points="${starPts.join(" ")}" ${base}${transform}/>`,
      );
    } else if (s.type === "hexagon") {
      const hexCx = s.x + s.width / 2;
      const hexCy = s.y + s.height / 2;
      const hexRx = s.width / 2;
      const hexRy = s.height / 2;
      const hexPts = Array.from({ length: 6 }, (_, i) => {
        const angle = (i * Math.PI) / 3 - Math.PI / 6;
        return `${hexCx + hexRx * Math.cos(angle)},${hexCy + hexRy * Math.sin(angle)}`;
      });
      lines.push(`<polygon points="${hexPts.join(" ")}" ${base}${transform}/>`);
    } else if (s.type === "arrow") {
      const arrowH = s.height;
      const arrowW = s.width;
      const arrowHw = arrowH * 0.4;
      const arrowSw = arrowH * 0.25;
      const arrowHeadX = s.x + arrowW;
      const d = `M${s.x} ${s.y + arrowH / 2 - arrowSw / 2} L${arrowHeadX - arrowHw} ${s.y + arrowH / 2 - arrowSw / 2} L${arrowHeadX - arrowHw} ${s.y} L${arrowHeadX} ${s.y + arrowH / 2} L${arrowHeadX - arrowHw} ${s.y + arrowH} L${arrowHeadX - arrowHw} ${s.y + arrowH / 2 + arrowSw / 2} L${s.x} ${s.y + arrowH / 2 + arrowSw / 2} Z`;
      lines.push(`<path d="${d}" ${base}${transform}/>`);
    }
  }
  lines.push("</svg>");
  return lines.join("\n");
}
