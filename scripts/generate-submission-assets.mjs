import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(new URL("..", import.meta.url).pathname);
const outDir = join(root, "base-submission");
const W = 1284;
const H = 2778;

const c = {
  bg: "#edf7ff",
  paper: "#fffaf2",
  ink: "#122033",
  blue: "#1c6fd1",
  cyan: "#89f0ff",
  yellow: "#ffd166",
  pink: "#ff6f91",
  pale: "#dff8ff",
};

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function wrap(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function frame(content) {
  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${c.bg}"/>
    <path d="M0 360H1284M0 720H1284M0 1080H1284M0 1440H1284M0 1800H1284M0 2160H1284M0 2520H1284" stroke="rgba(18,32,51,0.08)" stroke-width="4"/>
    <path d="M108 0V2778M468 0V2778M828 0V2778M1188 0V2778" stroke="rgba(18,32,51,0.08)" stroke-width="4"/>
    ${content}
  </svg>`;
}

function heading(title, subtitle) {
  return `
    <text x="76" y="126" font-family="Courier New, monospace" font-size="31" font-weight="900" letter-spacing="7" fill="${c.blue}">TRAIL PIN</text>
    <text x="76" y="240" font-family="Arial, sans-serif" font-size="82" font-weight="900" fill="${c.ink}">${esc(title)}</text>
    <text x="80" y="305" font-family="Arial, sans-serif" font-size="33" font-weight="800" fill="${c.blue}">${esc(subtitle)}</text>
  `;
}

function pinCard(x, y, spot, region, mood, note) {
  const lines = wrap(note, 34).slice(0, 5);
  return `
    <rect x="${x}" y="${y}" width="1080" height="1120" fill="${c.paper}" stroke="${c.ink}" stroke-width="7"/>
    <rect x="${x + 70}" y="${y + 340}" width="940" height="210" fill="${c.pale}" stroke="${c.ink}" stroke-width="5"/>
    <path d="M${x + 110} ${y + 478}C${x + 300} ${y + 350} ${x + 470} ${y + 560} ${x + 650} ${y + 430}S${x + 890} ${y + 390} ${x + 980} ${y + 500}" fill="none" stroke="${c.ink}" stroke-width="8" stroke-dasharray="22 20"/>
    <circle cx="${x + 165}" cy="${y + 458}" r="20" fill="${c.yellow}" stroke="${c.ink}" stroke-width="5"/>
    <circle cx="${x + 620}" cy="${y + 440}" r="20" fill="${c.yellow}" stroke="${c.ink}" stroke-width="5"/>
    <circle cx="${x + 940}" cy="${y + 492}" r="20" fill="${c.yellow}" stroke="${c.ink}" stroke-width="5"/>
    <rect x="${x + 862}" y="${y + 70}" width="140" height="140" fill="${c.pink}" stroke="${c.ink}" stroke-width="6"/>
    <path d="M${x + 932} ${y + 104}c-39 0-66 29-66 66 0 50 66 103 66 103s66-53 66-103c0-37-27-66-66-66z" fill="white" stroke="${c.ink}" stroke-width="8"/>
    <circle cx="${x + 932}" cy="${y + 169}" r="18" fill="${c.cyan}" stroke="${c.ink}" stroke-width="7"/>
    <text x="${x + 70}" y="${y + 115}" font-family="Courier New, monospace" font-size="24" font-weight="900" letter-spacing="6" fill="${c.blue}">PLACE MEMORY</text>
    <text x="${x + 70}" y="${y + 268}" font-family="Arial, sans-serif" font-size="76" font-weight="900" fill="${c.ink}">${esc(spot)}</text>
    <rect x="${x + 70}" y="${y + 610}" width="292" height="150" fill="${c.paper}" stroke="${c.ink}" stroke-width="5"/>
    <text x="${x + 98}" y="${y + 668}" font-family="Courier New, monospace" font-size="21" font-weight="900" fill="${c.blue}">REGION</text>
    <text x="${x + 98}" y="${y + 724}" font-family="Arial, sans-serif" font-size="33" font-weight="900" fill="${c.ink}">${esc(region)}</text>
    <rect x="${x + 394}" y="${y + 610}" width="292" height="150" fill="${c.yellow}" stroke="${c.ink}" stroke-width="5"/>
    <text x="${x + 422}" y="${y + 668}" font-family="Courier New, monospace" font-size="21" font-weight="900" fill="${c.blue}">MOOD</text>
    <text x="${x + 422}" y="${y + 724}" font-family="Arial, sans-serif" font-size="33" font-weight="900" fill="${c.ink}">${esc(mood)}</text>
    <rect x="${x + 718}" y="${y + 610}" width="292" height="150" fill="${c.paper}" stroke="${c.ink}" stroke-width="5"/>
    <text x="${x + 746}" y="${y + 668}" font-family="Courier New, monospace" font-size="21" font-weight="900" fill="${c.blue}">CHAIN</text>
    <text x="${x + 746}" y="${y + 724}" font-family="Arial, sans-serif" font-size="33" font-weight="900" fill="${c.ink}">Base</text>
    <rect x="${x + 70}" y="${y + 820}" width="940" height="210" fill="${c.paper}" stroke="${c.ink}" stroke-width="5"/>
    <text x="${x + 104}" y="${y + 880}" font-family="Courier New, monospace" font-size="23" font-weight="900" fill="${c.blue}">NOTE</text>
    ${lines.map((line, i) => `<text x="${x + 104}" y="${y + 940 + i * 38}" font-family="Arial, sans-serif" font-size="30" font-weight="800" fill="${c.ink}">${esc(line)}</text>`).join("")}
  `;
}

function feature(x, y, title, body, fill) {
  return `
    <rect x="${x}" y="${y}" width="540" height="230" fill="${fill}" stroke="${c.ink}" stroke-width="6"/>
    <text x="${x + 34}" y="${y + 82}" font-family="Arial, sans-serif" font-size="39" font-weight="900" fill="${c.ink}">${esc(title)}</text>
    ${wrap(body, 30).slice(0, 3).map((line, i) => `<text x="${x + 34}" y="${y + 138 + i * 34}" font-family="Arial, sans-serif" font-size="27" font-weight="800" fill="${c.blue}">${esc(line)}</text>`).join("")}
  `;
}

function screenshot1() {
  return frame(`
    ${heading("Pin a place memory.", "Save spot, region, mood, wallet, and timestamp on Base.")}
    ${pinCard(102, 440, "Morning Ferry Bench", "Victoria Harbour", "quiet gold", "Sat with coffee before the city woke up. The water looked like folded metal and the skyline felt almost soft.")}
    ${feature(82, 1710, "Place card", "Make a small memory easy to reload.", c.paper)}
    ${feature(662, 1710, "Onchain trail", "Traveler wallet and timestamp saved.", c.cyan)}
  `);
}

function screenshot2() {
  return frame(`
    ${heading("Load any pin.", "Open a saved place memory by ID.")}
    ${feature(82, 394, "Pin ID", "Reload public trail entries.", c.yellow)}
    ${feature(662, 394, "BaseScan", "Open the transaction after dropping.", c.paper)}
    ${pinCard(102, 760, "Blue Door Bookshop", "Old Town Lane", "found", "Tiny shop behind a bakery. Bought a used map, left with rain on my jacket and a better route home.")}
  `);
}

function screenshot3() {
  return frame(`
    ${heading("Build your route.", "Small public markers for trips, walks, and favorite corners.")}
    ${pinCard(102, 430, "Hilltop Night Market", "South Ridge", "bright air", "Lanterns, grilled corn, and a long view over the road. Dropped this pin to remember the turnoff.")}
    ${feature(82, 1710, "Travel notes", "Use it for places worth remembering.", c.paper)}
    ${feature(662, 1710, "Mobile first", "Readable inside Base App.", c.cyan)}
  `);
}

function iconSvg() {
  return `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="${c.bg}"/>
    <rect x="138" y="150" width="748" height="724" fill="${c.paper}" stroke="${c.ink}" stroke-width="30"/>
    <path d="M240 690C360 470 520 720 650 500S760 420 812 494" fill="none" stroke="${c.ink}" stroke-width="34" stroke-dasharray="60 42" stroke-linecap="round"/>
    <path d="M512 230c-94 0-158 69-158 158 0 120 158 246 158 246s158-126 158-246c0-89-64-158-158-158z" fill="${c.pink}" stroke="${c.ink}" stroke-width="26"/>
    <circle cx="512" cy="388" r="48" fill="${c.cyan}" stroke="${c.ink}" stroke-width="22"/>
  </svg>`;
}

function thumbnailSvg() {
  return `
  <svg width="1910" height="1000" viewBox="0 0 1910 1000" xmlns="http://www.w3.org/2000/svg">
    <rect width="1910" height="1000" fill="${c.bg}"/>
    <text x="92" y="150" font-family="Arial, sans-serif" font-size="116" font-weight="900" fill="${c.ink}">Trail Pin</text>
    <text x="100" y="252" font-family="Arial, sans-serif" font-size="43" font-weight="800" fill="${c.blue}">Pin place memories on Base.</text>
    ${feature(96, 380, "Spot", "Name the place worth saving.", c.paper)}
    ${feature(96, 650, "Mood", "Keep the feeling with the pin.", c.cyan)}
    ${pinCard(770, 90, "Morning Ferry Bench", "Victoria Harbour", "quiet gold", "Sat with coffee before the city woke up. The water looked like folded metal and the skyline felt almost soft.")}
  </svg>`;
}

async function writePng(name, svg, width = W, height = H) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg)).resize(width, height).png({ compressionLevel: 9 }).toFile(file);
  return file;
}

async function writeJpg(name, svg, width, height) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg)).resize(width, height).jpeg({ quality: 88, mozjpeg: true }).toFile(file);
  return file;
}

await mkdir(outDir, { recursive: true });

const files = [
  await writeJpg("app-icon.jpg", iconSvg(), 1024, 1024),
  await writeJpg("app-thumbnail.jpg", thumbnailSvg(), 1910, 1000),
  await writePng("screenshot-1.png", screenshot1()),
  await writePng("screenshot-2.png", screenshot2()),
  await writePng("screenshot-3.png", screenshot3()),
];

await writeFile(join(outDir, "asset-manifest.json"), JSON.stringify({ generatedAt: new Date().toISOString(), files }, null, 2), "utf8");
await writeFile(
  join(outDir, "submission-copy.md"),
  [
    "# Trail Pin",
    "",
    "App Name: Trail Pin",
    "Tagline: Pin place memories",
    "Description: Pin a place memory with spot, region, mood, note, wallet, and timestamp on Base.",
    "",
    "Domain: https://trail-pin.vercel.app",
    "",
    "Assets:",
    "- app-icon.jpg",
    "- app-thumbnail.jpg",
    "- screenshot-1.png",
    "- screenshot-2.png",
    "- screenshot-3.png",
  ].join("\n"),
  "utf8",
);

for (const file of files) console.log(file);
