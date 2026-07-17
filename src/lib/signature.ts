export interface SignatureData {
  firstName: string;
  lastName: string;
  jobTitle: string;
  department?: string;
  company: string;
  email: string;
  phone?: string;
  mobile?: string;
  website?: string;
  address?: string;
  logoUrl?: string;
  photoUrl?: string;
  bannerUrl?: string;
  bannerLink?: string;
  ctaText?: string;
  ctaLink?: string;
  legal?: string;
  pronouns?: string;
  qrUrl?: string;
  socials: {
    linkedin?: string;
    x?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
    threads?: string;
    whatsapp?: string;
  };
}

export interface SignatureStyle {
  layout: "photo-left" | "photo-right" | "stacked" | "minimal";
  accent: string;
  font: string;
  fontSize: number;
  photoShape: "round" | "square";
  divider: "solid" | "dashed" | "double" | "none";
  showPhoto: boolean;
  showBanner: boolean;
  showSocials: boolean;
  showQR: boolean;
  showLegal: boolean;
  showCTA: boolean;
}

export const defaultSignature: SignatureData = {
  firstName: "Ava",
  lastName: "Kirsch",
  jobTitle: "Chief Executive Officer",
  department: "Executive",
  company: "Acme Studio",
  email: "ava@acmestudio.com",
  phone: "+1 (415) 555-0101",
  mobile: "+1 (415) 555-9101",
  website: "acmestudio.com",
  address: "500 Market Street, San Francisco, CA",
  logoUrl: "",
  photoUrl: "https://api.dicebear.com/9.x/notionists/svg?seed=Ava&backgroundColor=b6e3f4",
  bannerUrl: "",
  bannerLink: "https://acmestudio.com/launch",
  ctaText: "Book a meeting",
  ctaLink: "https://cal.com/acmestudio/intro",
  legal: "This email and any attachments are confidential and may be privileged.",
  pronouns: "she/her",
  qrUrl: "https://acmestudio.com",
  socials: {
    linkedin: "avakirsch",
    x: "avakirsch",
    instagram: "acmestudio",
  },
};

export const defaultStyle: SignatureStyle = {
  layout: "photo-left",
  accent: "#84CC16",
  font: "Arial, Helvetica, sans-serif",
  fontSize: 13,
  photoShape: "round",
  divider: "solid",
  showPhoto: true,
  showBanner: true,
  showSocials: true,
  showQR: false,
  showLegal: true,
  showCTA: true,
};

const SOCIAL_URLS: Record<string, (handle: string) => string> = {
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
  linkedin: "in",
  x: "X",
  instagram: "IG",
  facebook: "f",
  youtube: "YT",
  tiktok: "TT",
  threads: "@",
  whatsapp: "WA",
};

function esc(s: string | undefined): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function qrImageUrl(url: string, size = 120): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
}

export function buildSignatureHTML(d: SignatureData, s: SignatureStyle): string {
  const accent = esc(s.accent);
  const font = esc(s.font);
  const size = `${s.fontSize}px`;
  const muted = "#6b7280";
  const text = "#111827";
  const borderStyle = s.divider === "none" ? "0" : `1px ${s.divider === "double" ? "solid" : s.divider} #e5e7eb`;

  const socials = s.showSocials
    ? Object.entries(d.socials)
        .filter(([, h]) => h)
        .map(
          ([k, h]) =>
            `<a href="${esc(SOCIAL_URLS[k]?.(h!) ?? "#")}" style="display:inline-block;margin-right:6px;text-decoration:none;color:${accent};font-weight:600;font-size:${s.fontSize - 1}px;">${SOCIAL_LABEL[k] ?? k}</a>`,
        )
        .join("")
    : "";

  const photoImg = s.showPhoto && d.photoUrl
    ? `<img src="${esc(d.photoUrl)}" width="84" height="84" alt="${esc(d.firstName + " " + d.lastName)}" style="display:block;border:0;width:84px;height:84px;${s.photoShape === "round" ? "border-radius:84px;" : "border-radius:8px;"}" />`
    : "";

  const cta = s.showCTA && d.ctaText && d.ctaLink
    ? `<a href="${esc(d.ctaLink)}" style="display:inline-block;padding:8px 14px;background:${accent};color:#0b0b0b;text-decoration:none;border-radius:6px;font-weight:600;font-size:${s.fontSize - 1}px;margin-top:8px;">${esc(d.ctaText)}</a>`
    : "";

  const banner = s.showBanner && d.bannerUrl
    ? `<tr><td style="padding-top:14px;"><a href="${esc(d.bannerLink ?? "#")}"><img src="${esc(d.bannerUrl)}" width="480" alt="banner" style="display:block;border:0;max-width:100%;border-radius:6px;" /></a></td></tr>`
    : "";

  const qr = s.showQR && d.qrUrl
    ? `<td valign="top" style="padding-left:14px;"><img src="${esc(qrImageUrl(d.qrUrl))}" width="80" height="80" alt="QR" style="display:block;border:0;" /></td>`
    : "";

  const legal = s.showLegal && d.legal
    ? `<tr><td style="padding-top:10px;color:${muted};font-size:11px;line-height:1.4;">${esc(d.legal)}</td></tr>`
    : "";

  const nameLine = `<div style="font-size:${s.fontSize + 3}px;font-weight:700;color:${text};line-height:1.2;">${esc(d.firstName)} ${esc(d.lastName)}${d.pronouns ? ` <span style="font-weight:400;color:${muted};font-size:${s.fontSize - 2}px;">(${esc(d.pronouns)})</span>` : ""}</div>`;
  const titleLine = `<div style="font-size:${size};color:${muted};line-height:1.4;">${esc(d.jobTitle)}${d.department ? " · " + esc(d.department) : ""}</div>`;
  const companyLine = `<div style="font-size:${size};font-weight:600;color:${accent};line-height:1.4;">${esc(d.company)}</div>`;

  const contactRows = [
    d.email && `<div style="font-size:${size};color:${text};line-height:1.6;"><span style="color:${muted};">E</span>&nbsp;<a href="mailto:${esc(d.email)}" style="color:${text};text-decoration:none;">${esc(d.email)}</a></div>`,
    d.phone && `<div style="font-size:${size};color:${text};line-height:1.6;"><span style="color:${muted};">P</span>&nbsp;<a href="tel:${esc(d.phone)}" style="color:${text};text-decoration:none;">${esc(d.phone)}</a></div>`,
    d.mobile && `<div style="font-size:${size};color:${text};line-height:1.6;"><span style="color:${muted};">M</span>&nbsp;<a href="tel:${esc(d.mobile)}" style="color:${text};text-decoration:none;">${esc(d.mobile)}</a></div>`,
    d.website && `<div style="font-size:${size};color:${text};line-height:1.6;"><span style="color:${muted};">W</span>&nbsp;<a href="https://${esc(d.website.replace(/^https?:\/\//, ""))}" style="color:${text};text-decoration:none;">${esc(d.website)}</a></div>`,
    d.address && `<div style="font-size:${size};color:${muted};line-height:1.6;">${esc(d.address)}</div>`,
  ]
    .filter(Boolean)
    .join("");

  const infoCell = `
    <div style="font-family:${font};">
      ${nameLine}
      ${titleLine}
      ${companyLine}
      <div style="height:8px;line-height:8px;font-size:0;">&nbsp;</div>
      ${contactRows}
      ${socials ? `<div style="margin-top:8px;">${socials}</div>` : ""}
      ${cta}
    </div>`;

  const dividerRow = s.divider === "none"
    ? ""
    : `<tr><td colspan="3" style="padding:12px 0 0 0;border-top:${borderStyle};font-size:0;line-height:0;">&nbsp;</td></tr>`;

  let mainRow = "";
  if (s.layout === "photo-left") {
    mainRow = `<tr>
      ${photoImg ? `<td valign="top" style="padding-right:16px;">${photoImg}</td>` : ""}
      <td valign="top">${infoCell}</td>
      ${qr}
    </tr>`;
  } else if (s.layout === "photo-right") {
    mainRow = `<tr>
      <td valign="top">${infoCell}</td>
      ${photoImg ? `<td valign="top" style="padding-left:16px;">${photoImg}</td>` : ""}
      ${qr}
    </tr>`;
  } else if (s.layout === "stacked") {
    mainRow = `<tr><td valign="top">
      ${photoImg ? `<div style="margin-bottom:10px;">${photoImg}</div>` : ""}
      ${infoCell}
    </td>${qr}</tr>`;
  } else {
    // minimal
    mainRow = `<tr><td valign="top">
      <div style="font-family:${font};font-size:${size};color:${text};">
        <strong>${esc(d.firstName)} ${esc(d.lastName)}</strong> — ${esc(d.jobTitle)}, <span style="color:${accent};">${esc(d.company)}</span><br/>
        ${d.email ? `<a href="mailto:${esc(d.email)}" style="color:${text};text-decoration:none;">${esc(d.email)}</a>` : ""}${d.phone ? ` · ${esc(d.phone)}` : ""}${d.website ? ` · ${esc(d.website)}` : ""}
      </div>
    </td></tr>`;
  }

  return `<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="font-family:${font};color:${text};max-width:640px;">
  ${mainRow}
  ${dividerRow}
  ${banner}
  ${legal}
</table>`;
}

export function downloadFile(name: string, content: string, mime = "text/html") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}