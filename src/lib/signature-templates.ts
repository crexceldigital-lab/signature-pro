import {
  buildSignatureHTML,
  esc,
  qrImageUrl,
  type SignatureData,
  type SignatureStyle,
} from "./signature";

/* ------------------------------------------------------------------ */
/*  SignatureFlow template engine                                      */
/*  Every renderer outputs table-based HTML with inline CSS only —     */
/*  safe for Outlook, Gmail, Apple Mail, Yahoo, Thunderbird.           */
/* ------------------------------------------------------------------ */

export interface TemplateDef {
  id: string;
  name: string;
  category: string;
  description: string;
  defaultAccent: string;
  premium?: boolean;
  render: (d: SignatureData, s: SignatureStyle) => string;
}

const MUTED = "#6b7280";
const TEXT = "#111827";

/* ---------- shared partials ---------- */

const SOCIAL_URLS: Record<string, (h: string) => string> = {
  linkedin: (h) => `https://linkedin.com/in/${h}`,
  x: (h) => `https://x.com/${h}`,
  instagram: (h) => `https://instagram.com/${h}`,
  facebook: (h) => `https://facebook.com/${h}`,
  youtube: (h) => `https://youtube.com/@${h}`,
  tiktok: (h) => `https://tiktok.com/@${h}`,
  threads: (h) => `https://threads.net/@${h}`,
  whatsapp: (h) => `https://wa.me/${h.replace(/\D/g, "")}`,
};
const SOCIAL_LABEL: Record<string, string> = {
  linkedin: "in", x: "X", instagram: "IG", facebook: "f",
  youtube: "YT", tiktok: "TT", threads: "@", whatsapp: "WA",
};

function socialPills(d: SignatureData, s: SignatureStyle, color: string, bg?: string): string {
  if (!s.showSocials) return "";
  const links = Object.entries(d.socials)
    .filter(([, h]) => h)
    .map(([k, h]) => {
      const style = bg
        ? `display:inline-block;width:22px;height:22px;line-height:22px;text-align:center;margin-right:5px;background:${bg};color:${color};border-radius:11px;text-decoration:none;font-weight:700;font-size:10px;font-family:Arial,sans-serif;`
        : `display:inline-block;margin-right:8px;color:${color};text-decoration:none;font-weight:700;font-size:${s.fontSize - 1}px;`;
      return `<a href="${esc(SOCIAL_URLS[k]?.(h!) ?? "#")}" style="${style}">${SOCIAL_LABEL[k] ?? k}</a>`;
    })
    .join("");
  return links ? `<div style="margin-top:8px;">${links}</div>` : "";
}

function logoImg(d: SignatureData, s: SignatureStyle, w = 96): string {
  if (!s.showLogo || !d.logoUrl) return "";
  return `<img src="${esc(d.logoUrl)}" width="${w}" alt="${esc(d.company)}" style="display:block;border:0;max-width:${w}px;height:auto;" />`;
}

function photoImg(d: SignatureData, s: SignatureStyle, size = 84, ring?: string): string {
  if (!s.showPhoto || !d.photoUrl) return "";
  const radius = s.photoShape === "round" ? `${size}px` : "10px";
  const border = ring ? `border:3px solid ${ring};` : "border:0;";
  return `<img src="${esc(d.photoUrl)}" width="${size}" height="${size}" alt="${esc(d.firstName)} ${esc(d.lastName)}" style="display:block;${border}width:${size}px;height:${size}px;border-radius:${radius};" />`;
}

function ctaBtn(d: SignatureData, s: SignatureStyle, accent: string, textColor = "#ffffff"): string {
  if (!s.showCTA || !d.ctaText || !d.ctaLink) return "";
  return `<a href="${esc(d.ctaLink)}" style="display:inline-block;margin-top:10px;padding:8px 16px;background:${accent};color:${textColor};text-decoration:none;border-radius:6px;font-weight:700;font-size:${s.fontSize - 1}px;">${esc(d.ctaText)} →</a>`;
}

function contactLines(d: SignatureData, s: SignatureStyle, opts?: { color?: string; iconColor?: string; sep?: boolean }): string {
  const color = opts?.color ?? TEXT;
  const icon = opts?.iconColor ?? MUTED;
  const size = `${s.fontSize}px`;
  const line = (label: string, value: string, href?: string) =>
    `<div style="font-size:${size};color:${color};line-height:1.7;"><span style="color:${icon};font-weight:700;">${label}</span>&nbsp;&nbsp;${href ? `<a href="${href}" style="color:${color};text-decoration:none;">${value}</a>` : value}</div>`;
  const rows = [
    d.phone && line("P", esc(d.phone), `tel:${esc(d.phone)}`),
    d.mobile && line("M", esc(d.mobile), `tel:${esc(d.mobile)}`),
    d.email && line("E", esc(d.email), `mailto:${esc(d.email)}`),
    d.website && line("W", esc(d.website), `https://${esc(d.website.replace(/^https?:\/\//, ""))}`),
    d.address && `<div style="font-size:${size};color:${icon};line-height:1.7;">${esc(d.address)}</div>`,
  ].filter(Boolean);
  return rows.join("");
}

function contactInline(d: SignatureData, s: SignatureStyle, color = TEXT, sep = "&nbsp;&nbsp;|&nbsp;&nbsp;"): string {
  return [
    d.phone && `<a href="tel:${esc(d.phone)}" style="color:${color};text-decoration:none;">${esc(d.phone)}</a>`,
    d.email && `<a href="mailto:${esc(d.email)}" style="color:${color};text-decoration:none;">${esc(d.email)}</a>`,
    d.website && `<a href="https://${esc(d.website.replace(/^https?:\/\//, ""))}" style="color:${color};text-decoration:none;">${esc(d.website)}</a>`,
  ].filter(Boolean).join(sep);
}

function legalRow(d: SignatureData, s: SignatureStyle, span = 1): string {
  if (!s.showLegal || !d.legal) return "";
  return `<tr><td colspan="${span}" style="padding-top:12px;color:#9ca3af;font-size:10px;line-height:1.5;font-family:${esc(s.font)};">${esc(d.legal)}</td></tr>`;
}

function bannerRow(d: SignatureData, s: SignatureStyle, span = 1): string {
  if (!s.showBanner || !d.bannerUrl) return "";
  return `<tr><td colspan="${span}" style="padding-top:14px;"><a href="${esc(d.bannerLink ?? "#")}"><img src="${esc(d.bannerUrl)}" width="480" alt="banner" style="display:block;border:0;max-width:100%;border-radius:8px;" /></a></td></tr>`;
}

function qrCell(d: SignatureData, s: SignatureStyle): string {
  if (!s.showQR || !d.qrUrl) return "";
  return `<td valign="top" style="padding-left:16px;"><img src="${esc(qrImageUrl(d.qrUrl))}" width="76" height="76" alt="QR" style="display:block;border:0;border-radius:6px;" /></td>`;
}

function fullName(d: SignatureData): string {
  return `${esc(d.firstName)} ${esc(d.lastName)}`;
}

const wrap = (inner: string, s: SignatureStyle, extra = "") =>
  `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="font-family:${esc(s.font)};color:${TEXT};max-width:560px;${extra}">${inner}</table>`;

/* ---------- templates ---------- */

export const TEMPLATES: TemplateDef[] = [
  {
    id: "accent-bar",
    name: "Accent Bar",
    category: "Corporate",
    description: "Vertical brand bar with logo — the modern corporate standard.",
    defaultAccent: "#F97316",
    render(d, s) {
      const a = esc(s.accent);
      return wrap(`
<tr>
  <td width="5" bgcolor="${a}" style="width:5px;border-radius:3px;font-size:0;line-height:0;">&nbsp;</td>
  <td width="18" style="width:18px;font-size:0;">&nbsp;</td>
  ${photoImg(d, s) ? `<td valign="top" style="padding-right:16px;">${photoImg(d, s)}</td>` : ""}
  <td valign="top">
    <div style="font-size:${s.fontSize + 5}px;font-weight:800;color:${TEXT};line-height:1.2;">${fullName(d)}</div>
    <div style="font-size:${s.fontSize}px;color:${a};font-weight:700;line-height:1.5;">${esc(d.jobTitle)}</div>
    <div style="font-size:${s.fontSize - 1}px;color:${MUTED};line-height:1.5;padding-bottom:8px;">${esc(d.company)}${d.department ? " · " + esc(d.department) : ""}</div>
    ${contactLines(d, s)}
    ${socialPills(d, s, "#ffffff", a)}
    ${ctaBtn(d, s, a)}
  </td>
  ${logoImg(d, s) ? `<td valign="top" style="padding-left:20px;">${logoImg(d, s, 88)}</td>` : ""}
  ${qrCell(d, s)}
</tr>
${bannerRow(d, s, 6)}
${legalRow(d, s, 6)}`, s);
    },
  },
  {
    id: "header-band",
    name: "Bold Header",
    category: "Modern",
    description: "Full-width brand band with reversed name — high-impact and confident.",
    defaultAccent: "#EA580C",
    render(d, s) {
      const a = esc(s.accent);
      return wrap(`
<tr>
  <td bgcolor="${a}" style="background:${a};padding:14px 18px;border-radius:10px 10px 0 0;">
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100%"><tr>
      <td>
        <div style="font-family:${esc(s.font)};font-size:${s.fontSize + 6}px;font-weight:800;color:#ffffff;line-height:1.2;">${fullName(d)}</div>
        <div style="font-family:${esc(s.font)};font-size:${s.fontSize}px;color:#ffffff;opacity:.92;line-height:1.5;">${esc(d.jobTitle)}${d.company ? " — " + esc(d.company) : ""}</div>
      </td>
      ${logoImg(d, s) ? `<td align="right" valign="middle" style="padding-left:14px;">${logoImg(d, s, 72)}</td>` : ""}
    </tr></table>
  </td>
</tr>
<tr>
  <td style="border:1px solid #e5e7eb;border-top:0;border-radius:0 0 10px 10px;padding:14px 18px;">
    <table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr>
      ${photoImg(d, s, 72) ? `<td valign="top" style="padding-right:14px;">${photoImg(d, s, 72)}</td>` : ""}
      <td valign="top">${contactLines(d, s)}${socialPills(d, s, a)}${ctaBtn(d, s, a)}</td>
      ${qrCell(d, s)}
    </tr>
    ${bannerRow(d, s, 3)}
    ${legalRow(d, s, 3)}
    </table>
  </td>
</tr>`, s);
    },
  },
  {
    id: "corner-frame",
    name: "Framed Elegance",
    category: "Luxury",
    description: "Thin editorial frame with serif name — refined, boutique feel.",
    defaultAccent: "#B45309",
    render(d, s) {
      const a = esc(s.accent);
      return wrap(`
<tr><td style="border:1.5px solid ${a};border-radius:2px;padding:18px 22px;">
  <table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100%"><tr>
    <td valign="middle">
      <div style="font-size:${s.fontSize - 3}px;letter-spacing:3px;text-transform:uppercase;color:${a};font-weight:700;">${esc(d.jobTitle)}</div>
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:${s.fontSize + 9}px;color:${TEXT};line-height:1.25;padding:2px 0 6px 0;">${fullName(d)}</div>
      <div style="font-size:${s.fontSize - 1}px;color:${MUTED};">${contactInline(d, s, MUTED, "&nbsp;&nbsp;·&nbsp;&nbsp;")}</div>
      ${socialPills(d, s, a)}
    </td>
    ${logoImg(d, s) ? `<td align="right" valign="middle" style="padding-left:16px;">${logoImg(d, s, 80)}</td>` : ""}
  </tr></table>
</td></tr>
${bannerRow(d, s)}
${legalRow(d, s)}`, s);
    },
  },
  {
    id: "split-vertical",
    name: "Classic Split",
    category: "Corporate",
    description: "Logo left of a vertical rule — the timeless boardroom layout.",
    defaultAccent: "#0F172A",
    render(d, s) {
      const a = esc(s.accent);
      const left = logoImg(d, s, 110) || photoImg(d, s, 90);
      return wrap(`
<tr>
  ${left ? `<td valign="middle" align="center" style="padding-right:20px;">${left}${d.company && s.showLogo ? `<div style="padding-top:6px;font-size:${s.fontSize - 2}px;font-weight:700;letter-spacing:1px;color:${TEXT};text-transform:uppercase;">${esc(d.company)}</div>` : ""}</td>` : ""}
  <td width="1" bgcolor="${a}" style="width:2px;font-size:0;line-height:0;">&nbsp;</td>
  <td width="20" style="width:20px;font-size:0;">&nbsp;</td>
  <td valign="middle">
    <div style="font-size:${s.fontSize + 4}px;font-weight:700;color:${TEXT};line-height:1.25;">${fullName(d)}</div>
    <div style="font-size:${s.fontSize}px;color:${MUTED};padding-bottom:8px;">${esc(d.jobTitle)}${d.department ? ", " + esc(d.department) : ""}</div>
    ${contactLines(d, s)}
    ${socialPills(d, s, a)}
  </td>
  ${qrCell(d, s)}
</tr>
${bannerRow(d, s, 5)}
${legalRow(d, s, 5)}`, s);
    },
  },
  {
    id: "stacked-center",
    name: "Centered Minimal",
    category: "Minimal",
    description: "Logo-first centered stack with hairline dividers — calm and premium.",
    defaultAccent: "#171717",
    render(d, s) {
      const a = esc(s.accent);
      return wrap(`
<tr><td align="center" style="padding-bottom:10px;">${logoImg(d, s, 92) || photoImg(d, s, 76)}</td></tr>
<tr><td align="center">
  <div style="font-size:${s.fontSize + 4}px;font-weight:700;color:${TEXT};letter-spacing:.5px;">${fullName(d)}</div>
  <div style="font-size:${s.fontSize - 1}px;color:${a};font-weight:600;letter-spacing:2px;text-transform:uppercase;padding:3px 0 10px 0;">${esc(d.jobTitle)}</div>
</td></tr>
<tr><td align="center" style="border-top:1px solid #e5e7eb;padding-top:10px;font-size:${s.fontSize - 1}px;color:${MUTED};">${contactInline(d, s, MUTED)}</td></tr>
<tr><td align="center">${socialPills(d, s, a)}${ctaBtn(d, s, a)}</td></tr>
${bannerRow(d, s)}
${legalRow(d, s)}`, s, "margin:0 auto;text-align:center;");
    },
  },
  {
    id: "minimal-line",
    name: "One-Liner",
    category: "Minimal",
    description: "Two clean lines. Nothing else. For people who hate signatures.",
    defaultAccent: "#404040",
    render(d, s) {
      const a = esc(s.accent);
      return wrap(`
<tr><td>
  <div style="font-size:${s.fontSize + 1}px;color:${TEXT};line-height:1.6;">
    <strong>${fullName(d)}</strong>&nbsp;&nbsp;<span style="color:${a};">/</span>&nbsp;&nbsp;${esc(d.jobTitle)}, ${esc(d.company)}
  </div>
  <div style="font-size:${s.fontSize - 1}px;color:${MUTED};line-height:1.6;">${contactInline(d, s, MUTED, "&nbsp;&nbsp;·&nbsp;&nbsp;")}</div>
</td></tr>
${legalRow(d, s)}`, s);
    },
  },
  {
    id: "sales-cta",
    name: "Sales Pro",
    category: "Sales",
    description: "CTA-forward with accent underline — built to book meetings.",
    defaultAccent: "#16A34A",
    render(d, s) {
      const a = esc(s.accent);
      return wrap(`
<tr>
  ${photoImg(d, s, 88, a) ? `<td valign="top" style="padding-right:16px;">${photoImg(d, s, 88, a)}</td>` : ""}
  <td valign="top">
    <div style="font-size:${s.fontSize + 5}px;font-weight:800;color:${TEXT};line-height:1.2;">${fullName(d)}</div>
    <table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td style="border-bottom:3px solid ${a};padding:1px 0 5px 0;font-size:${s.fontSize}px;color:${MUTED};font-weight:600;">${esc(d.jobTitle)} · ${esc(d.company)}</td></tr></table>
    <div style="padding-top:8px;">${contactLines(d, s)}</div>
    ${ctaBtn(d, s, a)}
    ${socialPills(d, s, a)}
  </td>
  ${qrCell(d, s)}
</tr>
${bannerRow(d, s, 3)}
${legalRow(d, s, 3)}`, s);
    },
  },
  {
    id: "photo-card",
    name: "Creative Card",
    category: "Creative",
    description: "Tinted card with ringed portrait — expressive studio energy.",
    defaultAccent: "#DB2777",
    render(d, s) {
      const a = esc(s.accent);
      return wrap(`
<tr><td bgcolor="#faf9f7" style="background:#faf9f7;border-radius:14px;padding:16px 20px;border:1px solid #f0eeea;">
  <table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr>
    ${photoImg(d, s, 80, a) ? `<td valign="middle" style="padding-right:16px;">${photoImg(d, s, 80, a)}</td>` : ""}
    <td valign="middle">
      <div style="font-size:${s.fontSize + 4}px;font-weight:800;color:${TEXT};">${fullName(d)}</div>
      <div style="font-size:${s.fontSize - 1}px;color:${a};font-weight:700;padding-bottom:6px;">${esc(d.jobTitle)} @ ${esc(d.company)}</div>
      <div style="font-size:${s.fontSize - 1}px;color:${MUTED};">${contactInline(d, s, MUTED, "&nbsp;·&nbsp;")}</div>
      ${socialPills(d, s, "#ffffff", a)}
      ${ctaBtn(d, s, a)}
    </td>
    ${logoImg(d, s) ? `<td valign="top" align="right" style="padding-left:16px;">${logoImg(d, s, 64)}</td>` : ""}
  </tr></table>
</td></tr>
${bannerRow(d, s)}
${legalRow(d, s)}`, s);
    },
  },
  {
    id: "banner-hero",
    name: "Campaign Hero",
    category: "Marketing",
    description: "Compact identity above a hero banner slot — made for campaigns.",
    defaultAccent: "#7C3AED",
    render(d, s) {
      const a = esc(s.accent);
      return wrap(`
<tr>
  ${photoImg(d, s, 64) ? `<td valign="middle" style="padding-right:12px;">${photoImg(d, s, 64)}</td>` : ""}
  <td valign="middle">
    <span style="font-size:${s.fontSize + 2}px;font-weight:800;color:${TEXT};">${fullName(d)}</span>
    <span style="font-size:${s.fontSize - 1}px;color:${MUTED};">&nbsp;·&nbsp;${esc(d.jobTitle)}, ${esc(d.company)}</span>
    <div style="font-size:${s.fontSize - 1}px;color:${MUTED};padding-top:2px;">${contactInline(d, s, MUTED, "&nbsp;·&nbsp;")}</div>
  </td>
  ${logoImg(d, s) ? `<td valign="middle" align="right" style="padding-left:12px;">${logoImg(d, s, 60)}</td>` : ""}
</tr>
<tr><td colspan="3" style="padding-top:12px;">
  ${s.showBanner && d.bannerUrl
    ? `<a href="${esc(d.bannerLink ?? "#")}"><img src="${esc(d.bannerUrl)}" width="520" alt="banner" style="display:block;border:0;max-width:100%;border-radius:10px;" /></a>`
    : `<table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100%"><tr><td bgcolor="${a}" style="background:${a};border-radius:10px;padding:12px 18px;"><a href="${esc(d.ctaLink || "#")}" style="color:#ffffff;text-decoration:none;font-weight:800;font-size:${s.fontSize}px;">${esc(d.ctaText || "See what’s new")} →</a></td></tr></table>`}
</td></tr>
${legalRow(d, s, 3)}`, s);
    },
  },
  {
    id: "right-rail",
    name: "Tech Rail",
    category: "Tech",
    description: "Details left, tinted brand rail right — product-company crisp.",
    defaultAccent: "#0EA5E9",
    render(d, s) {
      const a = esc(s.accent);
      return wrap(`
<tr>
  <td valign="top" style="padding-right:18px;">
    <div style="font-size:${s.fontSize + 4}px;font-weight:800;color:${TEXT};line-height:1.25;">${fullName(d)}</div>
    <div style="font-size:${s.fontSize}px;color:${MUTED};padding-bottom:8px;">${esc(d.jobTitle)}${d.department ? " · " + esc(d.department) : ""}</div>
    ${contactLines(d, s)}
    ${ctaBtn(d, s, a)}
  </td>
  <td width="150" valign="top" bgcolor="#f0f9ff" style="width:150px;background:${a}14;border-left:3px solid ${a};padding:14px;border-radius:0 10px 10px 0;">
    ${logoImg(d, s, 100) || `<div style="font-size:${s.fontSize + 1}px;font-weight:800;color:${a};">${esc(d.company)}</div>`}
    <div style="font-size:${s.fontSize - 2}px;color:${MUTED};padding-top:6px;">${esc(d.company)}</div>
    ${socialPills(d, s, "#ffffff", a)}
  </td>
</tr>
${bannerRow(d, s, 2)}
${legalRow(d, s, 2)}`, s);
    },
  },
  {
    id: "underline-executive",
    name: "Executive Underline",
    category: "Executive",
    description: "Name with a heavyweight accent rule — quiet authority.",
    defaultAccent: "#111111",
    render(d, s) {
      const a = esc(s.accent);
      return wrap(`
<tr><td>
  <div style="font-size:${s.fontSize + 7}px;font-weight:800;color:${TEXT};letter-spacing:.3px;line-height:1.2;">${fullName(d)}</div>
  <table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr><td width="56" height="4" bgcolor="${a}" style="width:56px;height:4px;background:${a};font-size:0;line-height:0;border-radius:2px;">&nbsp;</td></tr></table>
  <div style="font-size:${s.fontSize}px;color:${MUTED};padding:8px 0 10px 0;">${esc(d.jobTitle)} — <strong style="color:${TEXT};">${esc(d.company)}</strong></div>
  <table cellpadding="0" cellspacing="0" border="0" role="presentation"><tr>
    <td valign="top">${contactLines(d, s)}${socialPills(d, s, a)}</td>
    ${logoImg(d, s) ? `<td valign="top" style="padding-left:24px;">${logoImg(d, s, 84)}</td>` : ""}
    ${qrCell(d, s)}
  </tr></table>
</td></tr>
${bannerRow(d, s)}
${legalRow(d, s)}`, s);
    },
  },
  {
    id: "duotone",
    name: "Duotone Block",
    category: "Modern",
    description: "Solid identity block beside airy details — striking two-tone grid.",
    defaultAccent: "#2563EB",
    render(d, s) {
      const a = esc(s.accent);
      return wrap(`
<tr>
  <td width="170" valign="middle" align="center" bgcolor="${a}" style="width:170px;background:${a};border-radius:12px;padding:18px 14px;">
    ${photoImg(d, s, 68, "#ffffff") || logoImg(d, s, 90)}
    <div style="font-size:${s.fontSize + 2}px;font-weight:800;color:#ffffff;padding-top:8px;line-height:1.3;">${fullName(d)}</div>
    <div style="font-size:${s.fontSize - 2}px;color:#ffffff;opacity:.9;">${esc(d.jobTitle)}</div>
  </td>
  <td width="18" style="width:18px;font-size:0;">&nbsp;</td>
  <td valign="middle">
    <div style="font-size:${s.fontSize}px;font-weight:800;color:${TEXT};text-transform:uppercase;letter-spacing:1.5px;padding-bottom:6px;">${esc(d.company)}</div>
    ${contactLines(d, s)}
    ${socialPills(d, s, a)}
    ${ctaBtn(d, s, a)}
  </td>
</tr>
${bannerRow(d, s, 3)}
${legalRow(d, s, 3)}`, s);
    },
  },
  {
    id: "legal-standard",
    name: "Counsel",
    category: "Legal",
    description: "Restrained serif with prominent confidentiality block.",
    defaultAccent: "#374151",
    render(d, s) {
      const a = esc(s.accent);
      return wrap(`
<tr><td>
  <div style="font-family:Georgia,'Times New Roman',serif;font-size:${s.fontSize + 4}px;color:${TEXT};font-weight:700;">${fullName(d)}${d.pronouns ? ` <span style="font-weight:400;color:${MUTED};font-size:${s.fontSize - 2}px;">(${esc(d.pronouns)})</span>` : ""}</div>
  <div style="font-family:Georgia,serif;font-size:${s.fontSize}px;color:${MUTED};font-style:italic;padding-bottom:8px;">${esc(d.jobTitle)}, ${esc(d.company)}</div>
  ${contactLines(d, s, { iconColor: a })}
</td>
${logoImg(d, s) ? `<td valign="top" align="right" style="padding-left:20px;">${logoImg(d, s, 76)}</td>` : ""}
</tr>
${s.showLegal && d.legal ? `<tr><td colspan="2" style="margin-top:10px;border-left:3px solid ${a};padding:8px 0 8px 12px;color:#6b7280;font-size:10.5px;line-height:1.55;font-family:${esc(s.font)};">${esc(d.legal)}</td></tr>` : ""}
${bannerRow(d, s, 2)}`, s);
    },
  },
  {
    id: "gradient-edge",
    name: "Gradient Edge",
    category: "Creative",
    description: "Angled brand edge on the right — the design.com signature look.",
    defaultAccent: "#F97316",
    premium: true,
    render(d, s) {
      const a = esc(s.accent);
      return wrap(`
<tr><td style="border:1px solid #eceae6;border-radius:12px;overflow:hidden;">
  <table cellpadding="0" cellspacing="0" border="0" role="presentation" width="100%"><tr>
    <td valign="middle" style="padding:16px 18px;">
      <div style="font-size:${s.fontSize + 5}px;font-weight:800;color:${a};line-height:1.2;">${fullName(d)}</div>
      <div style="font-size:${s.fontSize}px;color:${TEXT};font-weight:600;padding-bottom:8px;">${esc(d.jobTitle)}</div>
      <div style="font-size:${s.fontSize - 1}px;color:${MUTED};line-height:1.7;">${contactInline(d, s, MUTED, "&nbsp;/&nbsp;")}</div>
      ${socialPills(d, s, "#ffffff", a)}
    </td>
    <td width="10" bgcolor="${a}" style="width:10px;background:${a};opacity:.35;font-size:0;">&nbsp;</td>
    <td width="26" bgcolor="${a}" style="width:26px;background:${a};font-size:0;">&nbsp;</td>
    ${logoImg(d, s) ? `<td valign="middle" bgcolor="${a}1a" style="background:${a}1a;padding:14px;">${logoImg(d, s, 80)}</td>` : ""}
  </tr></table>
</td></tr>
${bannerRow(d, s)}
${legalRow(d, s)}`, s);
    },
  },
];

/* ---------- engine ---------- */

const byId = new Map(TEMPLATES.map((t) => [t.id, t]));

export function getTemplate(id?: string): TemplateDef | undefined {
  return id ? byId.get(id) : undefined;
}

/** Single entry point used by the Builder, Templates gallery, and AI designer. */
export function renderSignature(d: SignatureData, s: SignatureStyle): string {
  const t = getTemplate(s.templateId);
  if (t) return t.render(d, s);
  return buildSignatureHTML(d, s); // legacy custom layouts
}

/** Sample persona for gallery previews. */
export const SAMPLE_DATA: SignatureData = {
  firstName: "Amina",
  lastName: "Mrisho",
  jobTitle: "Head of Partnerships",
  department: "Growth",
  company: "Revoltek Limited",
  email: "amina@revoltek.co.tz",
  phone: "+255 754 000 111",
  website: "revoltek.co.tz",
  address: "Masaki, Dar es Salaam",
  logoUrl: "https://api.dicebear.com/9.x/shapes/svg?seed=Revoltek&backgroundColor=transparent",
  photoUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=Amina&backgroundColor=ffdfbf",
  ctaText: "Book a meeting",
  ctaLink: "#",
  legal: "This email and any attachments are confidential.",
  qrUrl: "https://revoltek.co.tz",
  socials: { linkedin: "revoltek", instagram: "revoltek", x: "revoltek" },
};

export function sampleStyleFor(t: TemplateDef, base?: Partial<SignatureStyle>): SignatureStyle {
  return {
    layout: "photo-left",
    accent: t.defaultAccent,
    font: "Arial, Helvetica, sans-serif",
    fontSize: 13,
    photoShape: "round",
    divider: "solid",
    showPhoto: true,
    showBanner: false,
    showSocials: true,
    showQR: false,
    showLegal: false,
    showCTA: false,
    showLogo: true,
    templateId: t.id,
    ...base,
  };
}
