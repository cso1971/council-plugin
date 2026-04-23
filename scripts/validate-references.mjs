/**
 * Build-time schema validation for all `references/` subdirectories.
 *
 * This is the canonical verification script for the council-plugin project.
 * Run it after any structural change to `references/` to confirm integrity.
 *
 * Usage:
 *   npm run validate:references
 *
 * Exits 0 on success. Exits 1 and prints an error message on the first
 * violation found.
 *
 * What is validated
 * -----------------
 * references/patterns/ (exactly 7 files)
 *   - YAML frontmatter keys: id, name, native_support (must be true),
 *     min_agents, max_agents, output_template, default_protocol
 *   - Required headings: When to use, Recommender signals, Role shape,
 *     Coordinator prompt template, Teammate prompt template,
 *     HITL checkpoints, Output mapping
 *   - Required template placeholders: {{TOPIC}}, {{TEAMMATES}},
 *     {{MAX_ROUNDS}}, {{OUTPUT_FILE}}, {{ROLE_NAME}}, {{ROLE_DESCRIPTION}},
 *     {{DOMAIN_SKILL}}, {{RELEVANT_DOCS}}
 *   - output_template value must match a known output-template filename
 *   - default_protocol value must match a known protocol id in references/protocols/
 *
 * references/personas/ (18 files: 12 business + 6 tech; flex 15–25)
 *   - Files starting with "_" (e.g. _custom-template.md) are skipped
 *   - YAML frontmatter keys: id, name, category, domains (array),
 *     fits_patterns (array), domain-context-sections (array)
 *   - category must be one of: business, tech, cross-functional
 *   - Required headings (all 10): Role description, Identity, Core Competencies,
 *     Behavior in the Council, What You Care About, What You Defer to Others,
 *     Vote Guidelines, Quality Checklist, Baseline skill (SKILL.md template),
 *     Customization slots
 *   - Body must contain a markdown fenced code block for the baseline skill
 *
 * references/protocols/ (exactly 3 files; files starting with "_" are skipped)
 *   - Required headings: Configuration, Vote Semantics, Response Format,
 *     Consensus Rules, Escalation Rules, Deliberative Cycle,
 *     Output Formats, Behavioral Rules
 *
 * references/templates/ (exactly 3 .tmpl files)
 *   - coordinator.md.tmpl: required generation-time and runtime variables
 *   - teammate.md.tmpl: required role-layer, protocol-layer, and domain-layer variables
 *   - domain-context.md.tmpl: file must exist
 *
 * references/output-templates/ (6 full + 6 brief variants)
 *   - Full templates: headings Executive summary, Context, Deliberation trail
 *     plus placeholders {{TOPIC}}, {{DATE}}, {{PATTERN}}, {{SESSION_SLUG}}
 *   - Brief variants (*-brief.md): same 4 placeholders, no heading check
 *
 * references/recommender/questions.md
 *   - File must exist and contain a ## Q1 section
 *
 * plugin.json sync
 *   - plugin.json (repo root) and .claude-plugin/plugin.json must have identical content
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function readFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n");
  if (!raw.startsWith("---")) throw new Error(`${filePath}: missing frontmatter`);
  const end = raw.indexOf("\n---\n", 4);
  if (end === -1) throw new Error(`${filePath}: unclosed frontmatter`);
  const yamlText = raw.slice(4, end);
  const body = raw.slice(end + 5);
  const data = YAML.parse(yamlText);
  if (!data || typeof data !== "object") throw new Error(`${filePath}: invalid YAML`);
  return { data, body, raw };
}

function mustContain(filePath, body, substrings) {
  for (const s of substrings) {
    if (!body.includes(s)) throw new Error(`${filePath}: missing required substring ${JSON.stringify(s)}`);
  }
}

function mustHaveHeading(filePath, body, headings) {
  for (const h of headings) {
    const re = new RegExp(`^##\\s+${h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "m");
    if (!re.test(body)) throw new Error(`${filePath}: missing heading ## ${h}`);
  }
}

// Like mustHaveHeading but matches any heading that starts with the given prefix.
// Useful when headings have trailing qualifiers (e.g. "Response Format (mandatory ...)").
function mustHaveHeadingPrefix(filePath, body, prefixes) {
  for (const p of prefixes) {
    const re = new RegExp(`^##\\s+${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "m");
    if (!re.test(body)) throw new Error(`${filePath}: missing heading starting with ## ${p}`);
  }
}

const PATTERN_KEYS = ["id", "name", "native_support", "min_agents", "max_agents", "output_template", "default_protocol"];
const PATTERN_HEADINGS = [
  "When to use",
  "Recommender signals",
  "Role shape",
  "Coordinator prompt template",
  "Teammate prompt template",
  "HITL checkpoints",
  "Output mapping",
];

const ARCH_KEYS = ["id", "name", "category", "domains", "fits_patterns", "domain-context-sections"];
const ARCH_CATEGORIES = ["business", "tech", "cross-functional"];
const ARCH_HEADINGS = [
  "Role description",
  "Identity",
  "Core Competencies",
  "Behavior in the Council",
  "What You Care About",
  "What You Defer to Others",
  "Vote Guidelines",
  "Quality Checklist",
  "Baseline skill (SKILL.md template)",
  "Customization slots",
];

const PROTOCOL_HEADINGS = [
  "Configuration",
  "Vote Semantics",
  "Response Format",
  "Consensus Rules",
  "Escalation Rules",
  "Deliberative Cycle",
  "Output Formats",
  "Behavioral Rules",
];

const COORDINATOR_TEMPLATE_VARS = [
  "{{TEAMMATES_TABLE}}",
  "{{MAX_ROUNDS}}",
  "{{VOTE_OPTIONS}}",
  "{{CONSENSUS_RULE}}",
  "{{REJECTION_RULE}}",
  "{{OUTPUT_FORMATS}}",
  "{{BEHAVIORAL_RULES}}",
  "{{CONTEXT_REFERENCES}}",
  "{{TOPIC}}",
  "{{TOPIC_SLUG}}",
];

const TEAMMATE_TEMPLATE_VARS = [
  "{{ROLE_NAME}}",
  "{{ROLE_DESCRIPTION_SHORT}}",
  "{{IDENTITY_BLOCK}}",
  "{{COMPETENCIES}}",
  "{{BEHAVIOR_RULES}}",
  "{{CARE_ABOUT}}",
  "{{DEFER_TO}}",
  "{{VOTE_OPTIONS}}",
  "{{RESPONSE_FORMAT_EXAMPLE}}",
  "{{VOTE_GUIDELINES_TABLE}}",
  "{{DOMAIN_SKILL_REF}}",
  "{{DOMAIN_CONTEXT_BLOCK}}",
  "{{QUALITY_CHECKLIST}}",
  "{{CONSOLE_REPORTING}}",
];

const OUTPUT_TEMPLATE_FILES = [
  "decision.md",
  "findings.md",
  "recommendation.md",
  "analysis-report.md",
  "plan-and-verification.md",
  "draft-and-review.md",
];

const OUTPUT_TEMPLATE_BRIEF_FILES = OUTPUT_TEMPLATE_FILES.map((f) => f.replace(/\.md$/, "-brief.md"));

const TEMPLATE_PLACEHOLDERS = ["{{TOPIC}}", "{{DATE}}", "{{PATTERN}}", "{{SESSION_SLUG}}"];

function validatePatterns() {
  const protocolsDir = path.join(root, "references", "protocols");
  const knownProtocols = fs
    .readdirSync(protocolsDir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("_"))
    .map((f) => f.replace(/\.md$/, ""));

  const dir = path.join(root, "references", "patterns");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  if (files.length !== 7) throw new Error(`Expected 7 pattern files, found ${files.length}`);
  for (const f of files) {
    const fp = path.join(dir, f);
    const { data, body } = readFrontmatter(fp);
    for (const k of PATTERN_KEYS) {
      if (!(k in data)) throw new Error(`${fp}: frontmatter missing "${k}"`);
    }
    if (data.native_support !== true) throw new Error(`${fp}: native_support must be true`);
    const proto = String(data.default_protocol);
    if (!knownProtocols.includes(proto)) {
      throw new Error(`${fp}: unknown default_protocol "${proto}" (known: ${knownProtocols.join(", ")})`);
    }
    mustHaveHeading(fp, body, PATTERN_HEADINGS);
    mustContain(fp, body, [
      "{{TOPIC}}",
      "{{TEAMMATES}}",
      "{{MAX_ROUNDS}}",
      "{{OUTPUT_FILE}}",
      "{{ROLE_NAME}}",
      "{{ROLE_DESCRIPTION}}",
      "{{DOMAIN_SKILL}}",
      "{{RELEVANT_DOCS}}",
    ]);
    const tpl = String(data.output_template);
    const mapOk = OUTPUT_TEMPLATE_FILES.includes(`${tpl}.md`);
    if (!mapOk) throw new Error(`${fp}: unknown output_template "${tpl}"`);
  }
}

function validateArchetypes() {
  const dir = path.join(root, "references", "personas");
  // Files starting with "_" are templates/meta files (e.g. _custom-template.md) -- skip them.
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md") && !f.startsWith("_"));
  if (files.length < 15 || files.length > 25) {
    throw new Error(`Expected 18 persona files (12 business + 6 tech, flex 15–25), found ${files.length}`);
  }
  for (const f of files) {
    const fp = path.join(dir, f);
    const { data, body } = readFrontmatter(fp);
    for (const k of ARCH_KEYS) {
      if (!(k in data)) throw new Error(`${fp}: frontmatter missing "${k}"`);
    }
    if (!ARCH_CATEGORIES.includes(data.category)) {
      throw new Error(`${fp}: category must be one of ${ARCH_CATEGORIES.join(", ")} (got "${data.category}")`);
    }
    if (!Array.isArray(data.domains)) throw new Error(`${fp}: domains must be an array`);
    if (!Array.isArray(data.fits_patterns)) throw new Error(`${fp}: fits_patterns must be an array`);
    if (!Array.isArray(data["domain-context-sections"])) {
      throw new Error(`${fp}: domain-context-sections must be an array`);
    }
    mustHaveHeading(fp, body, ARCH_HEADINGS);
    if (!body.includes("```markdown")) throw new Error(`${fp}: baseline skill must use markdown fenced block`);
  }
}

function validateProtocols() {
  const dir = path.join(root, "references", "protocols");
  // Files starting with "_" are templates/meta files (e.g. _custom-template.md) -- skip them.
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md") && !f.startsWith("_"));
  if (files.length !== 3) throw new Error(`Expected 3 protocol files, found ${files.length}`);
  for (const f of files) {
    const fp = path.join(dir, f);
    const body = fs.readFileSync(fp, "utf8").replace(/\r\n/g, "\n");
    // Use prefix matching because some headings have trailing qualifiers
    // (e.g. "Response Format (mandatory for ALL participants)", "Behavioral Rules (Coordinator)").
    mustHaveHeadingPrefix(fp, body, PROTOCOL_HEADINGS);
  }
}

function validateTemplates() {
  const dir = path.join(root, "references", "templates");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".tmpl"));
  if (files.length !== 3) throw new Error(`Expected 3 template files, found ${files.length}`);

  const coordinatorPath = path.join(dir, "coordinator.md.tmpl");
  if (!fs.existsSync(coordinatorPath)) throw new Error(`Missing ${coordinatorPath}`);
  const coordinatorBody = fs.readFileSync(coordinatorPath, "utf8").replace(/\r\n/g, "\n");
  mustContain(coordinatorPath, coordinatorBody, COORDINATOR_TEMPLATE_VARS);

  const teammatePath = path.join(dir, "teammate.md.tmpl");
  if (!fs.existsSync(teammatePath)) throw new Error(`Missing ${teammatePath}`);
  const teammateBody = fs.readFileSync(teammatePath, "utf8").replace(/\r\n/g, "\n");
  mustContain(teammatePath, teammateBody, TEAMMATE_TEMPLATE_VARS);

  const domainContextPath = path.join(dir, "domain-context.md.tmpl");
  if (!fs.existsSync(domainContextPath)) throw new Error(`Missing ${domainContextPath}`);
}

function validateOutputTemplates() {
  const dir = path.join(root, "references", "output-templates");
  for (const f of OUTPUT_TEMPLATE_FILES) {
    const fp = path.join(dir, f);
    if (!fs.existsSync(fp)) throw new Error(`Missing output template ${fp}`);
    const body = fs.readFileSync(fp, "utf8").replace(/\r\n/g, "\n");
    mustHaveHeading(fp, body, ["Executive summary", "Context", "Deliberation trail"]);
    for (const ph of TEMPLATE_PLACEHOLDERS) {
      if (!body.includes(ph)) throw new Error(`${fp}: missing placeholder ${ph}`);
    }
  }
  for (const f of OUTPUT_TEMPLATE_BRIEF_FILES) {
    const fp = path.join(dir, f);
    if (!fs.existsSync(fp)) throw new Error(`Missing brief output template ${fp}`);
    const body = fs.readFileSync(fp, "utf8").replace(/\r\n/g, "\n");
    for (const ph of TEMPLATE_PLACEHOLDERS) {
      if (!body.includes(ph)) throw new Error(`${fp}: missing placeholder ${ph}`);
    }
  }
}

function validateRecommender() {
  const fp = path.join(root, "references", "recommender", "questions.md");
  if (!fs.existsSync(fp)) throw new Error("Missing references/recommender/questions.md");
  const body = fs.readFileSync(fp, "utf8");
  if (!body.includes("## Q1")) throw new Error("Recommender must include Q1 section");
}

function validatePluginJsonSync() {
  const root1 = path.join(root, "plugin.json");
  const root2 = path.join(root, ".claude-plugin", "plugin.json");
  if (!fs.existsSync(root1)) throw new Error("Missing plugin.json at repo root");
  if (!fs.existsSync(root2)) throw new Error("Missing .claude-plugin/plugin.json");
  const a = JSON.stringify(JSON.parse(fs.readFileSync(root1, "utf8")));
  const b = JSON.stringify(JSON.parse(fs.readFileSync(root2, "utf8")));
  if (a !== b) throw new Error("plugin.json and .claude-plugin/plugin.json are out of sync — update both files together");
}

try {
  validatePatterns();
  validateArchetypes();
  validateProtocols();
  validateTemplates();
  validateOutputTemplates();
  validateRecommender();
  validatePluginJsonSync();
  console.log("validate-references: OK");
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
