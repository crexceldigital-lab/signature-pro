import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listEmployees from "./tools/list-employees";
import listTemplates from "./tools/list-templates";
import listSignatures from "./tools/list-signatures";
import listCampaigns from "./tools/list-campaigns";
import generateSignatureHtml from "./tools/generate-signature-html";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "signatureflow-mcp",
  title: "SignatureFlow",
  version: "0.1.0",
  instructions:
    "Tools for SignatureFlow. Read your organization's employees, templates, signatures, and campaigns, and generate email-safe signature HTML. All access is scoped to the signed-in user's organization via RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listEmployees,
    listTemplates,
    listSignatures,
    listCampaigns,
    generateSignatureHtml,
  ],
});