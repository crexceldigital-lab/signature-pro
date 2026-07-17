export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: string;
  email: string;
  phone?: string;
  mobile?: string;
  website?: string;
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  x?: string;
  whatsapp?: string;
  office?: string;
  photo?: string;
  pronouns?: string;
  status: "active" | "inactive";
}

export const departments = ["Executive", "Sales", "Marketing", "Engineering", "HR", "Finance", "Design", "Operations"];

export const mockEmployees: Employee[] = [
  { id: "e1", firstName: "Ava", lastName: "Kirsch", jobTitle: "Chief Executive Officer", department: "Executive", email: "ava@acmestudio.com", phone: "+1 (415) 555-0101", mobile: "+1 (415) 555-9101", website: "acmestudio.com", linkedin: "avakirsch", office: "San Francisco, CA", pronouns: "she/her", status: "active" },
  { id: "e2", firstName: "Marcus", lastName: "Alvarado", jobTitle: "Head of Sales", department: "Sales", email: "marcus@acmestudio.com", phone: "+1 (415) 555-0102", linkedin: "marcusalvarado", office: "New York, NY", status: "active" },
  { id: "e3", firstName: "Priya", lastName: "Nair", jobTitle: "Marketing Director", department: "Marketing", email: "priya@acmestudio.com", phone: "+44 20 7946 0958", linkedin: "priyanair", instagram: "priya.n", office: "London, UK", status: "active" },
  { id: "e4", firstName: "Jonas", lastName: "Weber", jobTitle: "Principal Engineer", department: "Engineering", email: "jonas@acmestudio.com", phone: "+49 30 12345678", linkedin: "jonasweber", office: "Berlin, DE", status: "active" },
  { id: "e5", firstName: "Sofia", lastName: "Bianchi", jobTitle: "People Operations Lead", department: "HR", email: "sofia@acmestudio.com", phone: "+39 02 1234567", office: "Milan, IT", status: "active" },
  { id: "e6", firstName: "Ryo", lastName: "Tanaka", jobTitle: "Design Lead", department: "Design", email: "ryo@acmestudio.com", phone: "+81 3 1234 5678", linkedin: "ryotanaka", office: "Tokyo, JP", status: "active" },
  { id: "e7", firstName: "Naomi", lastName: "Okafor", jobTitle: "Finance Manager", department: "Finance", email: "naomi@acmestudio.com", phone: "+1 (312) 555-0198", office: "Chicago, IL", status: "inactive" },
  { id: "e8", firstName: "Liam", lastName: "O'Connor", jobTitle: "Account Executive", department: "Sales", email: "liam@acmestudio.com", phone: "+353 1 234 5678", linkedin: "liamoc", office: "Dublin, IE", status: "active" },
];

export interface Template {
  id: string;
  name: string;
  category: string;
  accent: string;
  layout: "stacked" | "compact" | "split" | "banner" | "photo-left" | "photo-right" | "minimal" | "card";
  description: string;
}

export const templates: Template[] = [
  { id: "t1", name: "Corporate Classic", category: "Corporate", accent: "#0F172A", layout: "split", description: "Timeless, restrained, boardroom-ready." },
  { id: "t2", name: "Executive Onyx", category: "Executive", accent: "#111111", layout: "photo-left", description: "Monogram-driven layout for leadership." },
  { id: "t3", name: "Minimal Line", category: "Minimal", accent: "#333333", layout: "minimal", description: "Type-only, single-line divider." },
  { id: "t4", name: "Modern Grid", category: "Modern", accent: "#2563EB", layout: "stacked", description: "Confident modern grid with accents." },
  { id: "t5", name: "Creative Studio", category: "Creative", accent: "#DB2777", layout: "banner", description: "Big banner + expressive typography." },
  { id: "t6", name: "Sales Pro", category: "Sales", accent: "#059669", layout: "compact", description: "CTA-forward for prospecting." },
  { id: "t7", name: "Consultant Card", category: "Consultant", accent: "#7C3AED", layout: "card", description: "Rounded card with vCard vibes." },
  { id: "t8", name: "Luxury Serif", category: "Luxury", accent: "#8B6F3B", layout: "photo-right", description: "Editorial serif with warm gold." },
  { id: "t9", name: "Tech Stack", category: "Tech", accent: "#0EA5E9", layout: "stacked", description: "Mono accents and product tags." },
  { id: "t10", name: "Finance Ledger", category: "Finance", accent: "#0F766E", layout: "split", description: "Precise, regulatory-friendly layout." },
  { id: "t11", name: "Healthcare Trust", category: "Healthcare", accent: "#0891B2", layout: "compact", description: "Clear credentials, disclaimer-ready." },
  { id: "t12", name: "Legal Standard", category: "Legal", accent: "#374151", layout: "minimal", description: "Firm-grade signature with disclaimer." },
];

export interface Campaign {
  id: string;
  name: string;
  status: "active" | "scheduled" | "paused" | "ended";
  banner: string;
  audience: string;
  starts: string;
  ends: string;
  views: number;
  clicks: number;
}

export const campaigns: Campaign[] = [
  { id: "c1", name: "Summer Product Launch", status: "active", banner: "Meet Atlas 2.0", audience: "All employees", starts: "2026-07-01", ends: "2026-08-15", views: 24810, clicks: 1892 },
  { id: "c2", name: "Q3 Webinar Series", status: "active", banner: "Register now", audience: "Sales + Marketing", starts: "2026-07-10", ends: "2026-09-30", views: 12403, clicks: 987 },
  { id: "c3", name: "Hiring Push — Engineering", status: "scheduled", banner: "We're hiring engineers", audience: "Engineering", starts: "2026-08-01", ends: "2026-10-01", views: 0, clicks: 0 },
  { id: "c4", name: "Spring Sale", status: "ended", banner: "Save 20% this spring", audience: "All employees", starts: "2026-03-01", ends: "2026-05-31", views: 88210, clicks: 6109 },
  { id: "c5", name: "GDPR Awareness", status: "paused", banner: "Read our privacy update", audience: "All employees", starts: "2026-06-01", ends: "2026-12-31", views: 3402, clicks: 121 },
];

export const notifications = [
  { id: "n1", type: "success" as const, title: "Signature deployed", body: "Rolled out to 42 employees.", time: "2m ago", read: false },
  { id: "n2", type: "info" as const, title: "New teammate joined", body: "Priya Nair joined Marketing.", time: "1h ago", read: false },
  { id: "n3", type: "warning" as const, title: "Campaign ending soon", body: "Summer Product Launch ends Aug 15.", time: "6h ago", read: true },
  { id: "n4", type: "error" as const, title: "Sync failed", body: "Google Workspace token expired.", time: "1d ago", read: true },
];

export const monthlyTrends = [
  { month: "Jan", views: 12400, clicks: 820, scans: 210 },
  { month: "Feb", views: 15800, clicks: 1104, scans: 289 },
  { month: "Mar", views: 18220, clicks: 1441, scans: 402 },
  { month: "Apr", views: 22110, clicks: 1889, scans: 512 },
  { month: "May", views: 26890, clicks: 2311, scans: 640 },
  { month: "Jun", views: 31220, clicks: 2792, scans: 781 },
  { month: "Jul", views: 34801, clicks: 3121, scans: 892 },
];

export const topCountries = [
  { country: "United States", views: 42010 },
  { country: "United Kingdom", views: 18220 },
  { country: "Germany", views: 12080 },
  { country: "Japan", views: 9420 },
  { country: "France", views: 7810 },
];

export const orgDefaults = {
  companyName: "Acme Studio",
  website: "acmestudio.com",
  phone: "+1 (415) 555-0100",
  address: "500 Market Street, San Francisco, CA",
  email: "hello@acmestudio.com",
  primaryColor: "#0F172A",
  secondaryColor: "#84CC16",
  legal: "This email and any attachments are confidential and may be privileged. If you are not the intended recipient, please notify the sender and delete this email.",
  defaultFont: "Inter",
  timezone: "America/Los_Angeles",
};