// Botanical illustrations used until real project photography is available.
// Colors are read from tokens.css at build time, so the art follows the brand palette.
// Each scene returns a complete SVG string.

function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n) => Math.round(n * 10) / 10;

/** Extra illustration-only hues, mixed from the brand palette. */
function palette(t) {
  return {
    paper: t["color-ivory"],
    sand: t["color-sand"],
    stone: t["color-stone"],
    white: t["color-white"],
    sage1: t["color-sage-100"],
    sage3: t["color-sage-300"],
    sage5: t["color-sage-500"],
    leaf7: t["color-leaf-700"],
    leaf8: t["color-leaf-800"],
    leaf9: t["color-leaf-900"],
    terra: t["color-terracotta"],
    wood: t["color-wood"],
    gold: "#D2A54E",
    blush: "#E3B7A6",
    plum: "#8C4B3E",
    stucco: "#F3ECE0",
  };
}

// ---------- primitives ----------
const leaf = (x, y, len, w, deg, fill, opacity = 1) =>
  `<path d="M0 0 Q${f(w)} ${f(-len * 0.45)} 0 ${f(-len)} Q${f(-w)} ${f(-len * 0.45)} 0 0Z" transform="translate(${f(x)} ${f(y)}) rotate(${f(deg)})" fill="${fill}"${opacity < 1 ? ` opacity="${opacity}"` : ""}/>`;

const veinedLeaf = (x, y, len, w, deg, fill, vein) =>
  `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(deg)})"><path d="M0 0 Q${f(w)} ${f(-len * 0.45)} 0 ${f(-len)} Q${f(-w)} ${f(-len * 0.45)} 0 0Z" fill="${fill}"/><path d="M0 0 L0 ${f(-len * 0.92)}" stroke="${vein}" stroke-width="${f(Math.max(1, w / 9))}" fill="none" opacity=".55"/></g>`;

const strap = (x, y, len, deg, width, fill, bend = 0.18) =>
  `<path d="M${f(-width / 2)} 0 Q${f(len * bend)} ${f(-len * 0.55)} 0 ${f(-len)} Q${f(len * bend + width * 0.2)} ${f(-len * 0.5)} ${f(width / 2)} 0Z" transform="translate(${f(x)} ${f(y)}) rotate(${f(deg)})" fill="${fill}"/>`;

const fan = (x, y, r, fill, n = 13, spread = 200, start = -190) => {
  let out = "";
  for (let i = 0; i < n; i++) {
    const a = start + (spread / (n - 1)) * i + 90;
    out += leaf(x, y, r, r * 0.09, a, fill);
  }
  return out;
};

const roundLeaf = (x, y, r, fill, vein) =>
  `<g transform="translate(${f(x)} ${f(y)})"><path d="M0 ${f(-r)} C${f(r * 1.1)} ${f(-r)} ${f(r)} ${f(r * 0.9)} 0 ${f(r)} C${f(-r)} ${f(r * 0.9)} ${f(-r * 1.1)} ${f(-r)} 0 ${f(-r)}Z" fill="${fill}"/><path d="M0 ${f(r)} L0 ${f(-r * 0.6)} M0 ${f(r * 0.3)} L${f(r * 0.5)} ${f(-r * 0.1)} M0 ${f(r * 0.3)} L${f(-r * 0.5)} ${f(-r * 0.1)}" stroke="${vein}" stroke-width="${f(r / 9)}" fill="none" stroke-linecap="round"/></g>`;

const mound = (x, baseY, w, h, fill) =>
  `<path d="M${f(x - w / 2)} ${f(baseY)} C${f(x - w / 2)} ${f(baseY - h * 1.25)} ${f(x + w / 2)} ${f(baseY - h * 1.25)} ${f(x + w / 2)} ${f(baseY)}Z" fill="${fill}"/>`;

const blades = (x, baseY, n, h, fill, rand, spread = 40) => {
  let out = "";
  for (let i = 0; i < n; i++) {
    const dx = (i / (n - 1) - 0.5) * spread;
    out += strap(x + dx * 0.3, baseY, h * (0.7 + rand() * 0.4), dx * 0.9, 5, fill, 0.1);
  }
  return out;
};

const plumes = (x, baseY, w, h, fill, rand) => {
  let out = "";
  for (let i = 0; i < 9; i++) {
    out += `<ellipse cx="${f(x + (rand() - 0.5) * w)}" cy="${f(baseY - h * 0.55 - rand() * h * 0.4)}" rx="${f(w * 0.28)}" ry="${f(h * 0.22)}" fill="${fill}" opacity=".45"/>`;
  }
  return out;
};

const palm = (x, baseY, h, trunk, frond, lean = 6) => {
  const topX = x + lean, topY = baseY - h;
  let out = `<path d="M${f(x - 6)} ${f(baseY)} Q${f(x + lean * 0.3)} ${f(baseY - h * 0.5)} ${f(topX - 3)} ${f(topY)} L${f(topX + 3)} ${f(topY)} Q${f(x + lean * 0.3 + 8)} ${f(baseY - h * 0.5)} ${f(x + 6)} ${f(baseY)}Z" fill="${trunk}"/>`;
  for (let i = 0; i < 9; i++) {
    const a = -170 + i * 22 + 90;
    out += strap(topX, topY, h * 0.36, a, 9, frond, 0.25);
  }
  return out;
};

const pot = (x, baseY, w, h, fill) =>
  `<path d="M${f(x - w / 2)} ${f(baseY - h)} L${f(x + w / 2)} ${f(baseY - h)} L${f(x + w * 0.38)} ${f(baseY)} L${f(x - w * 0.38)} ${f(baseY)}Z" fill="${fill}"/><rect x="${f(x - w / 2 - 4)}" y="${f(baseY - h - 8)}" width="${f(w + 8)}" height="10" rx="2" fill="${fill}"/>`;

const croton = (x, baseY, size, colors, rand) => {
  let out = "";
  for (let i = 0; i < 11; i++) {
    const a = -75 + i * 15 + (rand() - 0.5) * 8;
    out += veinedLeaf(x, baseY, size * (0.7 + rand() * 0.35), size * 0.2, a, colors[i % colors.length], "#FFF6E0");
  }
  return out;
};

const shrubDots = (x, y, r, n, fill, rand) => {
  let out = "";
  for (let i = 0; i < n; i++) {
    out += `<circle cx="${f(x + (rand() - 0.5) * r * 2)}" cy="${f(y + (rand() - 0.5) * r)}" r="${f(3 + rand() * 3)}" fill="${fill}"/>`;
  }
  return out;
};

const svg = (w, h, title, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img"><title>${title}</title>${body}</svg>`;

// ---------- scenes (800 x 600 unless noted) ----------
const scenes = {
  hero(p) {
    const r = rng(7);
    return svg(800, 1000, "Illustrated South Florida entry garden with a sabal palm, stucco wall and layered tropical plants", `
      <rect width="800" height="1000" fill="${p.paper}"/>
      <circle cx="560" cy="250" r="120" fill="${p.blush}" opacity=".55"/>
      <rect x="0" y="430" width="800" height="570" fill="${p.stucco}"/>
      <path d="M470 430 V250 a110 110 0 0 1 220 0 V430Z" fill="${p.sand}"/>
      <path d="M500 430 V262 a80 80 0 0 1 160 0 V430Z" fill="${p.sage1}"/>
      <rect x="0" y="425" width="800" height="8" fill="${p.stone}"/>
      ${palm(230, 760, 560, p.wood, p.leaf7, 18)}
      ${palm(330, 760, 420, p.wood, p.leaf8, -10)}
      <rect x="0" y="740" width="800" height="260" fill="${p.sand}"/>
      <path d="M380 1000 L470 740 L560 740 L700 1000Z" fill="${p.stucco}"/>
      ${mound(120, 790, 260, 120, p.leaf8)}
      ${fan(110, 800, 150, p.leaf7, 15)}
      ${blades(300, 800, 9, 150, p.sage5, r)}
      ${plumes(300, 790, 110, 180, p.blush, r)}
      ${pot(640, 780, 120, 130, p.terra)}
      ${fan(640, 640, 120, p.leaf8, 11)}
      ${croton(760, 820, 150, [p.terra, p.gold, p.plum, p.leaf7], r)}
      ${roundLeaf(60, 900, 60, p.leaf7, p.terra)}${roundLeaf(160, 930, 70, p.leaf8, p.terra)}${roundLeaf(260, 950, 55, p.sage5, p.terra)}
      ${roundLeaf(740, 940, 64, p.leaf8, p.terra)}${roundLeaf(820, 900, 60, p.leaf7, p.terra)}
    `);
  },
  // Stand-in for the owner's portrait: foliage framing an empty, softly lit garden. No figure, so it's never mistaken for a photo of Robert.
  "portrait-placeholder"(p) {
    const r = rng(19);
    return svg(800, 1000, "Illustrated garden backdrop, a placeholder for Robert's portrait", `
      <rect width="800" height="1000" fill="${p.sage1}"/>
      <circle cx="400" cy="360" r="210" fill="${p.paper}"/>
      <circle cx="400" cy="360" r="210" fill="${p.blush}" opacity=".25"/>
      <path d="M0 640 C220 600 580 610 800 640 V1000 H0Z" fill="${p.sage3}" opacity=".7"/>
      ${palm(110, 760, 640, p.wood, p.leaf7, 26)}
      ${palm(690, 780, 560, p.wood, p.leaf8, -22)}
      ${[0, 1, 2, 3, 4, 5].map((i) => strap(40 + i * 18, 1000, 330 + i * 22, -6 + i * 7, 26, i % 2 ? p.leaf7 : p.leaf8, 0.12)).join("")}
      ${[0, 1, 2, 3, 4].map((i) => leaf(780, 1000, 280 + r() * 60, 52, -48 + i * 11, i % 2 ? p.leaf8 : p.leaf7)).join("")}
      <path d="M0 860 C200 820 600 830 800 860 V1000 H0Z" fill="${p.sand}"/>
      ${fan(250, 880, 150, p.sage5, 15)}
      ${blades(560, 880, 11, 150, p.sage5, r)}${plumes(560, 870, 120, 180, p.blush, r)}
      ${roundLeaf(120, 930, 66, p.leaf7, p.terra)}${roundLeaf(380, 960, 58, p.leaf8, p.terra)}${roundLeaf(690, 940, 70, p.leaf7, p.terra)}
      <g transform="translate(372 330) scale(.56)" opacity=".85"><path d="M50 8C76 8 94 28 94 52C94 76 74 94 50 94C28 94 8 78 8 54C8 40 14 28 24 20C32 13 40 8 50 8Z" fill="${p.leaf7}"/><g stroke="${p.blush}" stroke-linecap="round" fill="none"><path d="M50 90V30" stroke-width="4"/><path d="M50 70L30 53M50 70L70 53M50 51L34 38M50 51L66 38" stroke-width="3.2"/></g></g>
    `);
  },
  plan(p) {
    const r = rng(11);
    let circles = "";
    const spots = [[160, 160, 70, p.leaf7], [290, 120, 44, p.sage5], [620, 150, 80, p.leaf8], [690, 300, 40, p.terra], [140, 440, 56, p.sage5], [250, 470, 38, p.leaf7], [620, 470, 62, p.leaf7], [520, 420, 30, p.gold]];
    for (const [x, y, rad, c] of spots) {
      circles += `<circle cx="${x}" cy="${y}" r="${rad}" fill="${c}" opacity=".9"/><circle cx="${x}" cy="${y}" r="${rad}" fill="none" stroke="${p.leaf9}" stroke-width="1.5" stroke-dasharray="4 5" opacity=".5"/>`;
      for (let i = 0; i < 8; i++) circles += `<line x1="${x}" y1="${y}" x2="${f(x + Math.cos(i * 0.785) * rad * 0.8)}" y2="${f(y + Math.sin(i * 0.785) * rad * 0.8)}" stroke="${p.paper}" stroke-width="1.5" opacity=".6"/>`;
    }
    return svg(800, 600, "Illustrated top-down landscape plan with plant circles, a curving path and a patio", `
      <rect width="800" height="600" fill="${p.sage1}"/>
      <g stroke="${p.sage3}" stroke-width="1">${Array.from({ length: 16 }, (_, i) => `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="600"/>`).join("")}${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="${i * 50}" x2="800" y2="${i * 50}"/>`).join("")}</g>
      <rect x="330" y="250" width="200" height="140" rx="6" fill="${p.stucco}" stroke="${p.stone}" stroke-width="3"/>
      <path d="M430 390 C420 470 330 500 300 600" stroke="${p.sand}" stroke-width="46" fill="none" stroke-linecap="round"/>
      ${[0, 1, 2, 3].map((i) => `<rect x="${380 - i * 22}" y="${420 + i * 45}" width="40" height="26" rx="5" fill="${p.stone}"/>`).join("")}
      ${circles}
      ${shrubDots(160, 300, 60, 14, p.leaf8, r)}
      <rect x="40" y="40" width="720" height="520" fill="none" stroke="${p.leaf9}" stroke-width="2" opacity=".35"/>
      <g fill="${p.leaf9}" opacity=".55" font-family="Georgia,serif" font-size="16" font-style="italic"><text x="350" y="325">patio</text></g>
      <path d="M720 520 l0 -36 m0 0 l-8 14 m8 -14 l8 14" stroke="${p.leaf9}" stroke-width="2" fill="none" opacity=".6"/>
    `);
  },
  refresh(p) {
    const r = rng(23);
    return svg(800, 600, "Illustrated refreshed garden bed with fresh mulch, rounded shrubs and new plantings", `
      <rect width="800" height="600" fill="${p.paper}"/>
      <rect x="0" y="0" width="800" height="330" fill="${p.stucco}"/>
      <rect x="0" y="322" width="800" height="10" fill="${p.stone}"/>
      ${[120, 300, 480, 660].map((x) => `<rect x="${x}" y="90" width="90" height="140" rx="4" fill="${p.sand}"/><line x1="${x + 45}" y1="90" x2="${x + 45}" y2="230" stroke="${p.stone}" stroke-width="3"/>`).join("")}
      <path d="M0 600 V420 C200 380 600 380 800 420 V600Z" fill="${p.wood}" opacity=".55"/>
      <path d="M0 600 V470 C220 440 580 440 800 470 V600Z" fill="${p.sage3}"/>
      <path d="M0 422 C200 382 600 382 800 422" stroke="${p.leaf9}" stroke-width="3" fill="none" opacity=".4"/>
      ${mound(110, 440, 200, 130, p.leaf8)}${mound(700, 440, 220, 140, p.leaf7)}
      ${mound(300, 430, 120, 70, p.sage5)}${mound(500, 430, 120, 70, p.sage5)}
      ${shrubDots(110, 360, 70, 12, p.terra, r)}${shrubDots(700, 350, 80, 12, p.terra, r)}
      ${blades(400, 440, 11, 120, p.leaf7, r)}
      ${plumes(400, 430, 90, 140, p.blush, r)}
    `);
  },
  planting(p) {
    const r = rng(31);
    return svg(800, 600, "Illustrated nursery pots ready for planting, with a shovel and young tropical plants", `
      <rect width="800" height="600" fill="${p.sage1}"/>
      <circle cx="640" cy="150" r="80" fill="${p.blush}" opacity=".5"/>
      <rect x="0" y="420" width="800" height="180" fill="${p.sand}"/>
      <ellipse cx="420" cy="470" rx="120" ry="26" fill="${p.wood}" opacity=".5"/>
      <rect x="560" y="170" width="10" height="290" rx="4" fill="${p.wood}" transform="rotate(12 565 460)"/>
      <path d="M540 440 L600 440 L590 500 Q570 520 550 500Z" fill="${p.leaf9}" opacity=".75" transform="rotate(12 565 460)"/>
      ${pot(150, 470, 110, 100, p.leaf9)}${croton(150, 370, 130, [p.terra, p.gold, p.leaf7], r)}
      ${pot(300, 480, 90, 80, p.leaf9)}${fan(300, 400, 120, p.leaf7, 12)}
      ${pot(690, 490, 100, 90, p.leaf9)}${blades(690, 400, 10, 130, p.sage5, r)}${plumes(690, 400, 80, 150, p.blush, r)}
      ${leaf(420, 470, 90, 22, -20, p.leaf7)}${leaf(420, 470, 110, 26, 10, p.leaf8)}${leaf(420, 470, 80, 20, 35, p.sage5)}
    `);
  },
  enhance(p) {
    const r = rng(41);
    return svg(800, 600, "Illustrated backyard with stepping stones, gravel, a bench and framed planting", `
      <rect width="800" height="600" fill="${p.paper}"/>
      <rect x="0" y="0" width="800" height="300" fill="${p.sage1}"/>
      ${Array.from({ length: 16 }, (_, i) => `<rect x="${i * 52}" y="120" width="46" height="190" fill="${p.wood}" opacity="${0.55 + (i % 3) * 0.12}"/>`).join("")}
      <rect x="0" y="300" width="800" height="300" fill="${p.stucco}"/>
      <path d="M0 600 L0 420 L800 380 L800 600Z" fill="${p.sand}"/>
      ${[[180, 560], [270, 500], [370, 455], [470, 420], [570, 395]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="${54 - i * 6}" ry="${22 - i * 2}" fill="${p.stone}"/>`).join("")}
      <rect x="560" y="300" width="190" height="20" rx="4" fill="${p.leaf9}"/><rect x="575" y="320" width="12" height="50" fill="${p.leaf9}"/><rect x="723" y="320" width="12" height="50" fill="${p.leaf9}"/>
      ${palm(90, 330, 260, p.wood, p.leaf7, 8)}
      ${mound(90, 340, 200, 90, p.leaf8)}${fan(70, 350, 110, p.leaf7, 13)}
      ${pot(510, 360, 70, 70, p.terra)}${blades(510, 290, 9, 90, p.leaf7, r)}
      ${roundLeaf(760, 520, 50, p.leaf7, p.terra)}${roundLeaf(700, 560, 46, p.leaf8, p.terra)}
    `);
  },
  "modern-tropical"(p) {
    const r = rng(53);
    return svg(800, 600, "Illustrated modern tropical garden with strappy foliage against a smooth wall and wood slats", `
      <rect width="800" height="600" fill="${p.stucco}"/>
      <rect x="430" y="80" width="370" height="380" fill="${p.wood}" opacity=".85"/>
      ${Array.from({ length: 12 }, (_, i) => `<rect x="430" y="${92 + i * 31}" width="370" height="6" fill="${p.paper}" opacity=".35"/>`).join("")}
      <rect x="0" y="455" width="800" height="145" fill="${p.stone}"/>
      ${Array.from({ length: 60 }, () => `<circle cx="${f(r() * 800)}" cy="${f(470 + r() * 120)}" r="${f(1.5 + r() * 2.5)}" fill="${p.paper}" opacity=".7"/>`).join("")}
      <rect x="0" y="455" width="800" height="6" fill="${p.sand}"/>
      ${[0, 1, 2, 3, 4, 5, 6].map((i) => strap(170, 470, 260 + i * 18, -40 + i * 12, 30, i % 2 ? p.leaf7 : p.leaf8, 0.12)).join("")}
      ${[0, 1, 2, 3, 4].map((i) => leaf(600, 470, 210 + r() * 40, 46, -36 + i * 18, i % 2 ? p.leaf8 : p.leaf7)).join("")}
      <path d="M592 330 l30 -14 l-6 20Z" fill="${p.terra}"/><path d="M590 334 l22 -26 l2 18Z" fill="${p.gold}"/>
      ${fan(350, 480, 80, p.sage5, 13)}
      ${fan(760, 480, 70, p.sage5, 11)}
    `);
  },




  "small-space"(p) {
    const r = rng(97);
    return svg(800, 600, "Illustrated small entryway garden with an arched door, potted plants and a compact planting bed", `
      <rect width="800" height="600" fill="${p.stucco}"/>
      <path d="M320 470 V210 a80 80 0 0 1 160 0 V470Z" fill="${p.leaf9}"/>
      <path d="M335 470 V215 a65 65 0 0 1 130 0 V470Z" fill="${p.leaf8}"/>
      <circle cx="450" cy="350" r="5" fill="${p.gold}"/>
      <rect x="0" y="465" width="800" height="135" fill="${p.sand}"/>
      <rect x="280" y="470" width="240" height="20" fill="${p.stone}"/><rect x="300" y="490" width="200" height="20" fill="${p.stone}" opacity=".7"/>
      ${pot(230, 480, 90, 110, p.terra)}${fan(230, 370, 120, p.leaf7, 13)}
      ${pot(570, 480, 90, 110, p.terra)}${fan(570, 370, 120, p.leaf7, 13)}
      ${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => leaf(260 + i * 4, 170 - i * 12, 28, 10, -60 + i * 25, p.sage5)).join("")}
      ${mound(100, 470, 200, 110, p.leaf7)}${shrubDots(100, 420, 70, 10, p.terra, r)}
      ${mound(710, 470, 200, 120, p.leaf8)}
      ${roundLeaf(60, 560, 40, p.leaf7, p.terra)}${roundLeaf(150, 570, 36, p.sage5, p.terra)}${roundLeaf(680, 565, 40, p.leaf7, p.terra)}${roundLeaf(760, 555, 44, p.leaf8, p.terra)}
    `);
  },
};

// ---------- plant studies (600 x 400) ----------
const plantBg = (p, body, title) =>
  svg(600, 400, title, `<rect width="600" height="400" fill="${p.sage1}"/><circle cx="300" cy="215" r="150" fill="${p.paper}"/>${body}<rect x="0" y="360" width="600" height="40" fill="${p.sand}"/>`);

const plants = {
  "plant-firebush": (p) => {
    let b = "";
    for (let i = 0; i < 14; i++) b += veinedLeaf(300, 360, 120 + (i % 3) * 30, 26, -80 + i * 12, i % 2 ? p.leaf7 : p.leaf8, p.sage3);
    for (let i = 0; i < 7; i++) {
      const x = 220 + i * 26, y = 150 + (i % 3) * 22;
      b += `<g transform="translate(${x} ${y}) rotate(${-20 + i * 7})">${[0, 1, 2, 3].map((k) => `<rect x="${k * 6 - 9}" y="${-k * 3}" width="5" height="22" rx="2.5" fill="${k % 2 ? p.terra : "#C9573A"}"/>`).join("")}</g>`;
    }
    return plantBg(p, b, "Illustration of firebush with tubular red-orange flowers");
  },
  "plant-coontie": (p) => {
    let b = "";
    for (let i = 0; i < 9; i++) {
      const a = -70 + i * 17.5, len = 170;
      b += `<g transform="translate(300 360) rotate(${a})"><path d="M0 0 L0 ${-len}" stroke="${p.leaf9}" stroke-width="3"/>${Array.from({ length: 10 }, (_, k) => leaf(0, -20 - k * 15, 34 - k * 1.5, 6, -55, p.leaf7) + leaf(0, -20 - k * 15, 34 - k * 1.5, 6, 55, p.leaf8)).join("")}</g>`;
    }
    b += `<ellipse cx="300" cy="350" rx="18" ry="26" fill="${p.wood}"/><ellipse cx="300" cy="346" rx="10" ry="16" fill="${p.terra}"/>`;
    return plantBg(p, b, "Illustration of coontie with stiff, fern-like fronds");
  },
  "plant-cocoplum": (p) => {
    const r = rng(5);
    let b = mound(300, 360, 360, 230, p.leaf8);
    for (let i = 0; i < 40; i++) b += `<ellipse cx="${f(150 + r() * 300)}" cy="${f(170 + r() * 180)}" rx="12" ry="9" fill="${r() > 0.75 ? p.terra : p.leaf7}" opacity=".95"/>`;
    for (let i = 0; i < 6; i++) b += `<circle cx="${f(190 + r() * 220)}" cy="${f(230 + r() * 100)}" r="7" fill="${p.plum}"/>`;
    return plantBg(p, b, "Illustration of a cocoplum hedge with rounded leaves and red new growth");
  },
  "plant-seagrape": (p) => {
    let b = `<path d="M300 360 C296 300 300 240 300 200" stroke="${p.wood}" stroke-width="10" fill="none"/>`;
    const spots = [[300, 140, 62, p.leaf7], [215, 200, 56, p.leaf8], [385, 200, 58, p.leaf8], [250, 280, 50, p.sage5], [355, 285, 52, p.leaf7], [170, 300, 40, p.terra], [430, 300, 44, p.leaf8]];
    for (const [x, y, rad, c] of spots) b += roundLeaf(x, y, rad, c, c === p.terra ? p.paper : p.terra);
    b += `<g fill="${p.plum}">${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${290 + (i % 2) * 10}" cy="${215 + i * 9}" r="5"/>`).join("")}</g>`;
    return plantBg(p, b, "Illustration of seagrape with large round leaves, red veins and grape-like fruit");
  },
  "plant-muhly": (p) => {
    const r = rng(9);
    return plantBg(p, blades(300, 360, 21, 180, p.sage5, r, 160) + plumes(300, 330, 260, 300, p.blush, r) + plumes(300, 330, 200, 260, "#D79A8A", r), "Illustration of muhly grass with airy pink plumes");
  },
  "plant-wildcoffee": (p) => {
    let b = "";
    for (let i = 0; i < 12; i++) b += veinedLeaf(300, 360, 130 + (i % 3) * 25, 40, -75 + i * 13.5, i % 2 ? p.leaf8 : p.leaf7, p.sage3);
    b += `<g fill="#B5402C">${[[250, 200], [262, 192], [256, 210], [350, 190], [362, 200], [340, 205]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7"/>`).join("")}</g>`;
    return plantBg(p, b, "Illustration of wild coffee with glossy, deeply veined leaves and red berries");
  },
  "plant-stopper": (p) => {
    const r = rng(13);
    let b = `<path d="M296 360 C292 300 300 260 296 220 M300 300 C320 270 340 250 360 240 M298 280 C280 260 260 245 240 240" stroke="#A0614A" stroke-width="9" fill="none" stroke-linecap="round"/>`;
    b += `<circle cx="300" cy="170" r="110" fill="${p.leaf8}"/>`;
    for (let i = 0; i < 50; i++) b += leaf(200 + r() * 200, 100 + r() * 140, 22, 7, r() * 360, p.leaf7);
    for (let i = 0; i < 14; i++) b += `<circle cx="${f(210 + r() * 180)}" cy="${f(110 + r() * 120)}" r="4" fill="${i % 3 ? p.white : p.terra}"/>`;
    return plantBg(p, b, "Illustration of Simpson's stopper with small leaves, white flowers and peeling bark");
  },
  "plant-sabal": (p) => {
    let b = palm(300, 380, 300, p.wood, p.leaf7, 4);
    b += `<g stroke="${p.leaf9}" stroke-width="2" opacity=".35">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${294 + (i % 2) * 6} ${360 - i * 34} l12 -10"/>`).join("")}</g>`;
    return plantBg(p, b, "Illustration of a sabal palm with a slender trunk and fan-shaped fronds");
  },
  "plant-croton": (p) => {
    const r = rng(17);
    return plantBg(p, croton(300, 365, 220, [p.terra, p.gold, p.leaf7, p.plum, "#C9573A"], r), "Illustration of croton with bold red, gold and green leaves");
  },
};

export function renderIllustrations(tokens) {
  const p = palette(tokens);
  const out = {};
  for (const [name, fn] of Object.entries({ ...scenes, ...plants })) out[name] = fn(p).replace(/\s{2,}/g, " ");
  return out;
}

export const ILLUSTRATION_SIZES = Object.fromEntries([
  ["hero", [800, 1000]],
  ["portrait-placeholder", [800, 1000]],
  ...Object.keys(scenes).filter((k) => k !== "hero" && k !== "portrait-placeholder").map((k) => [k, [800, 600]]),
  ...Object.keys(plants).map((k) => [k, [600, 400]]),
]);
