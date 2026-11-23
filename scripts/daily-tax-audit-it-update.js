#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const DAILY_FILE = path.join(DATA_DIR, "daily-articles.json");

const SOURCES = [
  { name: "Azure Updates", url: "https://azure.microsoft.com/en-us/updates/feed/" },
  { name: "Microsoft 365 Blog", url: "https://www.microsoft.com/en-us/microsoft-365/blog/feed/" },
  { name: "Azure Blog", url: "https://azure.microsoft.com/en-us/blog/feed/" },
  { name: "Dynamics 365 Blog", url: "https://cloudblogs.microsoft.com/dynamics365/feed/" },
  { name: "Microsoft Security Blog", url: "https://www.microsoft.com/en-us/security/blog/feed/" }
];

const SERVICE_LINE_RULES = {
  "Tax": {
    keywords: [
      "tax", "compliance", "regulation", "reporting", "finance", "financial", "excel", "ledger",
      "governance", "risk", "copilot", "power bi", "erp", "sap", "oracle"
    ],
    offerings: [
      { name: "Tax Compliance & Provision", keywords: ["compliance", "reporting", "ledger", "finance"] },
      { name: "Tax Technology Transformation", keywords: ["copilot", "automation", "power platform", "integration"] },
      { name: "Transfer Pricing & Cross-border", keywords: ["global", "cross-border", "regulation", "policy"] }
    ]
  },
  "Audit": {
    keywords: [
      "audit", "controls", "governance", "risk", "compliance", "security", "identity", "purview",
      "defender", "policy", "assurance", "evidence", "monitoring", "sox", "internal control"
    ],
    offerings: [
      { name: "External Audit Enablement", keywords: ["assurance", "evidence", "audit", "quality"] },
      { name: "Internal Audit & Controls", keywords: ["controls", "sox", "policy", "monitoring"] },
      { name: "Audit Data & Analytics", keywords: ["analytics", "power bi", "data", "insight"] }
    ]
  },
  "Advisory": {
    keywords: [
      "advisory", "strategy", "performance", "deals", "risk", "transformation", "value creation",
      "operations", "cost", "planning", "modernization", "workflow", "insights"
    ],
    offerings: [
      { name: "Risk Advisory", keywords: ["risk", "governance", "compliance", "policy"] },
      { name: "Deals & Transaction Advisory", keywords: ["deals", "valuation", "integration", "merger"] },
      { name: "Performance Improvement", keywords: ["performance", "operations", "cost", "efficiency"] }
    ]
  },
  "IT Consulting": {
    keywords: [
      "consulting", "architecture", "migration", "deployment", "automation", "azure", "devops",
      "ai", "copilot", "dynamics", "power platform", "integration", "managed service", "platform",
      "infrastructure", "application modernization"
    ],
    offerings: [
      { name: "Cloud & Platform Engineering", keywords: ["azure", "infrastructure", "platform", "deployment"] },
      { name: "Data & AI Transformation", keywords: ["ai", "copilot", "analytics", "data"] },
      { name: "Managed Services Modernization", keywords: ["managed service", "operations", "automation", "monitoring"] }
    ]
  }
};

function isoDate(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function daysAgoIso(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function stripTags(text) {
  return String(text || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function decodeXml(text) {
  const decoded = String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
  return decoded
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function parseRssItems(xml) {
  const out = [];
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const itemXml of items) {
    const title = decodeXml(stripTags((itemXml.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || ""));
    const link = decodeXml(stripTags((itemXml.match(/<link>([\s\S]*?)<\/link>/i) || [])[1] || ""));
    const pubDate = decodeXml(stripTags((itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || [])[1] || ""));
    const description = decodeXml(stripTags((itemXml.match(/<description>([\s\S]*?)<\/description>/i) || [])[1] || ""));
    if (!title || !link) continue;
    out.push({ title, link, pubDate, description });
  }
  return out;
}

function scoreIndustries(text) {
  const hay = text.toLowerCase();
  const scored = [];
  for (const [industry, rules] of Object.entries(SERVICE_LINE_RULES)) {
    let score = 0;
    const matched = [];
    for (const keyword of rules.keywords) {
      if (hay.includes(keyword)) {
        score += 1;
        matched.push(keyword);
      }
    }
    if (score > 0) scored.push({ industry, score, matched });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

function matchServiceLines(industry, text) {
  const hay = text.toLowerCase();
  const rules = SERVICE_LINE_RULES[industry];
  if (!rules) return [];
  const matched = [];
  for (const offering of rules.offerings) {
    const hit = offering.keywords.some(k => hay.includes(k));
    if (hit) matched.push(offering.name);
  }
  return matched.slice(0, 3);
}

function whyItMatters(industry, matched, serviceLines) {
  const top = matched.slice(0, 3).join(", ");
  const sl = serviceLines.length ? ` Service lines: ${serviceLines.join(", ")}.` : "";
  if (industry === "Tax") return `Useful for tax teams because it impacts compliance, provision quality, or tax technology workflows (${top}).${sl}`;
  if (industry === "Audit") return `Useful for audit teams because it strengthens controls, evidence quality, and assurance readiness (${top}).${sl}`;
  if (industry === "Advisory") return `Useful for advisory teams because it can improve risk, deals, and performance-transformation outcomes (${top}).${sl}`;
  return `Useful for IT consulting because it can accelerate cloud, data/AI, and managed service transformations (${top}).${sl}`;
}

function detailedWriteUp(industry, title, summary, serviceLines, matched) {
  const signal = matched.slice(0, 2).join(" and ");
  const lines = serviceLines.length ? `Primary fit: ${serviceLines.join(", ")}.` : "Primary fit: core service delivery workstreams.";
  if (industry === "Tax") {
    return `${summary} For Tax teams, this announcement can be translated into better compliance execution, stronger evidence continuity, and more scalable tax-technology operating models. ${lines} Key signal: ${signal}.`;
  }
  if (industry === "Audit") {
    return `${summary} For Audit teams, this improves how controls are monitored, how evidence is gathered, and how assurance quality can be sustained across engagements. ${lines} Key signal: ${signal}.`;
  }
  if (industry === "Advisory") {
    return `${summary} For Advisory teams, this can influence risk posture, transformation sequencing, and value-realization choices in client programs. ${lines} Key signal: ${signal}.`;
  }
  return `${summary} For IT Consulting teams, this announcement informs architecture, implementation priorities, and managed-service modernization decisions. ${lines} Key signal: ${signal}.`;
}

function applicationAngles(industry, serviceLines) {
  const line = serviceLines[0] || industry;
  if (industry === "Tax") {
    return [
      `Map ${line} opportunities where workflow automation or control evidence is still manual.`,
      "Use this as a trigger to refine your tax-data governance and close-calendar playbook.",
      "Package a pilot use case with measurable cycle-time and quality outcomes."
    ];
  }
  if (industry === "Audit") {
    return [
      `Map ${line} use cases to strengthen control testing and evidence traceability.`,
      "Prioritize engagements with recurring documentation bottlenecks.",
      "Design an assurance-ready operating cadence with explicit quality checkpoints."
    ];
  }
  if (industry === "Advisory") {
    return [
      `Position ${line} in transformation roadmaps tied to executive KPIs.`,
      "Use this update in value-creation discussions for risk and performance outcomes.",
      "Create a near-term pilot and define success metrics before scale-out."
    ];
  }
  return [
    `Apply ${line} to cloud, data, and AI delivery accelerators for current clients.`,
    "Prioritize architecture and operating-model changes with clear ROI hypotheses.",
    "Embed this capability in managed-service offers and modernization sprints."
  ];
}

function recommendedActions(industry) {
  return [
    `Add this announcement to your ${industry} weekly client update narrative.`,
    "Identify one active engagement where this capability can be piloted immediately.",
    "Prepare a client conversation starter focused on measurable business outcomes."
  ];
}

async function fetchSource(source) {
  const res = await fetch(source.url, { headers: { "User-Agent": "SatishPaulBriefBot/1.0" } });
  if (!res.ok) throw new Error(`Fetch failed ${source.url}: ${res.status}`);
  const xml = await res.text();
  const items = parseRssItems(xml);
  return items.map(item => ({ ...item, source: source.name }));
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadExisting() {
  if (!fs.existsSync(DAILY_FILE)) {
    return { generatedAt: null, dates: [] };
  }
  return JSON.parse(fs.readFileSync(DAILY_FILE, "utf8"));
}

function dedupeByLink(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    if (seen.has(item.link)) continue;
    seen.add(item.link);
    out.push(item);
  }
  return out;
}

async function main() {
  ensureDataDir();
  const existing = loadExisting();
  const today = isoDate(new Date());

  const fetched = await Promise.allSettled(SOURCES.map(fetchSource));
  const sourceItems = [];
  for (const r of fetched) {
    if (r.status === "fulfilled") sourceItems.push(...r.value);
  }

  const filtered = [];
  for (const item of sourceItems) {
    const text = `${item.title} ${item.description}`;
    const scored = scoreIndustries(text);
    if (!scored.length) continue;
    const industries = scored.map(s => {
      const serviceLines = matchServiceLines(s.industry, text);
      return {
        name: s.industry,
        score: s.score,
        serviceLines,
        whyItMatters: whyItMatters(s.industry, s.matched, serviceLines),
        detailedWriteUp: detailedWriteUp(s.industry, item.title, item.description, serviceLines, s.matched),
        applicationAngles: applicationAngles(s.industry, serviceLines),
        recommendedActions: recommendedActions(s.industry)
      };
    });
    filtered.push({
      title: item.title,
      link: item.link,
      source: item.source,
      publishedDate: isoDate(item.pubDate),
      summary: item.description,
      industries
    });
  }

  const cutoff = daysAgoIso(60);
  const recent = filtered.filter(item => item.publishedDate >= cutoff);
  const ranked = recent.sort((a, b) => {
    const ad = a.publishedDate || "";
    const bd = b.publishedDate || "";
    if (ad !== bd) return bd.localeCompare(ad);
    const as = (a.industries || []).reduce((sum, i) => sum + (i.score || 0), 0);
    const bs = (b.industries || []).reduce((sum, i) => sum + (i.score || 0), 0);
    return bs - as;
  });
  const top = dedupeByLink(ranked).slice(0, 60);
  const dateEntry = { date: today, scannedAtUtc: new Date().toISOString(), articles: top };

  const keep = (existing.dates || []).filter(d => d.date !== today);
  keep.push(dateEntry);
  keep.sort((a, b) => b.date.localeCompare(a.date));

  const out = {
    generatedAt: new Date().toISOString(),
    dates: keep.slice(0, 120)
  };

  fs.writeFileSync(DAILY_FILE, JSON.stringify(out, null, 2));
  console.log(`Wrote ${DAILY_FILE} with ${top.length} articles for ${today}.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
