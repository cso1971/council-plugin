/**
 * Build-time validation for references/patterns and references/personas.
 * Run: npm run validate:references
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

const PATTERN_KEYS = ["id", "name", "native_support", "min_agents", "max_agents", "output_template"];
const PATTERN_HEADINGS = [
  "When to use",
  "Recommender signals",
  "Role shape",
  "Coordinator prompt template",
  "Teammate prompt template",
  "HITL checkpoints",
  "Output mapping",
];

const ARCH_KEYS = ["id", "name", "domains", "fits_patterns"];
const ARCH_HEADINGS = [
  "Role description",
  "Baseline skill (SKILL.md template)",
  "Typical questions answered",
  "Customization slots",
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
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  if (files.length < 10 || files.length > 15) {
    throw new Error(`Expected 10–12 archetype files (flex 10–15), found ${files.length}`);
  }
  for (const f of files) {
    const fp = path.join(dir, f);
    const { data, body } = readFrontmatter(fp);
    for (const k of ARCH_KEYS) {
      if (!(k in data)) throw new Error(`${fp}: frontmatter missing "${k}"`);
    }
    if (!Array.isArray(data.domains)) throw new Error(`${fp}: domains must be an array`);
    if (!Array.isArray(data.fits_patterns)) throw new Error(`${fp}: fits_patterns must be an array`);
    mustHaveHeading(fp, body, ARCH_HEADINGS);
    if (!body.includes("```markdown")) throw new Error(`${fp}: baseline skill must use markdown fenced block`);
  }
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

try {
  validatePatterns();
  validateArchetypes();
  validateOutputTemplates();
  validateRecommender();
  console.log("validate-references: OK");
} catch (e) {
  console.error(e.message || e);
  process.exit(1);
}
