(function () {
  const INDUSTRY_META = {
    Tax: {
      accent: "#0f6cbd",
      accentSoft: "#dbeeff",
      chips: ["Compliance", "Provision", "Transfer Pricing", "Tax Tech"],
      image: "../assets/img/ed-finserv.jpg?v=b18e7c91"
    },
    Audit: {
      accent: "#006d77",
      accentSoft: "#d9f4f4",
      chips: ["Controls", "Evidence", "SOX", "Assurance Analytics"],
      image: "../assets/img/ed-profserv.jpg?v=2bcd5fc1"
    },
    Advisory: {
      accent: "#7c3aed",
      accentSoft: "#efe6ff",
      chips: ["Risk", "Deals", "Performance", "Transformation"],
      image: "../assets/img/ed-retail.jpg?v=af29d324"
    },
    "IT Consulting": {
      accent: "#d97706",
      accentSoft: "#ffefdc",
      chips: ["Cloud", "AI", "Integration", "Managed Services"],
      image: "../assets/img/ed-hightech.jpg?v=60916a57"
    }
  };

  const root = document.body;
  const industry = root && root.dataset ? root.dataset.industry : "";
  const meta = INDUSTRY_META[industry];
  if (!meta) return;

  const state = {
    all: [],
    filtered: [],
    activeIndex: 0
  };

  const $ = (id) => document.getElementById(id);

  function safe(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function setTheme() {
    document.documentElement.style.setProperty("--sl-accent", meta.accent);
    document.documentElement.style.setProperty("--sl-accent-soft", meta.accentSoft);
    const heroImage = $("sl-hero-image");
    const chips = $("sl-chip-row");
    if (heroImage) heroImage.src = meta.image;
    if (chips) {
      chips.innerHTML = "";
      meta.chips.forEach((chip) => {
        const node = document.createElement("span");
        node.className = "sl-chip";
        node.textContent = chip;
        chips.appendChild(node);
      });
    }
  }

  function industryViewForArticle(article) {
    return (article.industries || []).find((entry) => normalize(entry.name) === normalize(industry)) || null;
  }

  function deriveApplicationBullets(serviceLines, title) {
    const byServiceLine = {
      "Tax Compliance & Provision": "Use this in provision and close workflows to tighten evidence traceability and reduce manual reconciliations.",
      "Tax Technology Transformation": "Bundle this into tax-technology roadmaps to improve return throughput, quality checks, and automation coverage.",
      "Transfer Pricing & Cross-border": "Use this for cross-border readiness plans where auditability and policy alignment are key decision points.",
      "External Audit Enablement": "Map this into external-audit procedures so teams can improve support requests and workpaper defensibility.",
      "Internal Audit & Controls": "Use this in control testing cycles to increase monitoring cadence and issue response discipline.",
      "Audit Data & Analytics": "Translate this into analytics-driven audit testing with clearer risk scoring and sampling confidence.",
      "Risk Advisory": "Use this update to shape risk assessments and maturity diagnostics for executive steering discussions.",
      "Deals & Transaction Advisory": "Apply this to diligence and integration plays where data confidence and change velocity affect deal value.",
      "Performance Improvement": "Use this to identify process bottlenecks and define measurable transformation KPIs.",
      "Cloud & Platform Engineering": "Position this in platform roadmaps to improve architecture choices, resiliency, and scale outcomes.",
      "Data & AI Transformation": "Turn this into AI/data use cases with explicit governance, operating model, and value tracking.",
      "Managed Services Modernization": "Apply this in managed-service redesign to improve run-cost, automation, and SLA outcomes."
    };

    const lines = (serviceLines || []).filter(Boolean);
    if (!lines.length) {
      return [
        "Use the announcement as a trigger to reassess your current service delivery assumptions and risks.",
        "Identify where this capability fits your highest-friction engagements first for quick client impact.",
        `Frame "${title}" as a near-term pilot with clear measurable outcomes before broad rollout.`
      ];
    }

    const bullets = lines.map((line) => byServiceLine[line] || `Map this announcement to ${line} and define one concrete, client-facing pilot use case.`);
    bullets.push(`Anchor the client conversation on business outcomes, not features, when discussing "${title}".`);
    return bullets.slice(0, 4);
  }

  function buildDetailedWriteUp(item) {
    const view = item.industryView;
    if (view && view.detailedWriteUp) return view.detailedWriteUp;
    const lines = (view && view.serviceLines ? view.serviceLines : []).join(", ");
    const serviceContext = lines ? ` The strongest fit is across ${lines}.` : "";
    return `${item.summary || "This announcement introduces a relevant Microsoft capability."} For ${industry} teams, this directly influences delivery choices, risk posture, and engagement design.${serviceContext}`;
  }

  function renderImpactVisual(item) {
    const view = item.industryView || {};
    const serviceLine = (view.serviceLines && view.serviceLines[0]) || industry;
    const title = item.title.length > 38 ? `${item.title.slice(0, 35)}...` : item.title;
    return `
      <svg viewBox="0 0 900 210" width="100%" height="140" role="img" aria-label="How this announcement applies to ${safe(industry)}">
        <defs>
          <linearGradient id="lineGrad" x1="0%" x2="100%">
            <stop offset="0%" stop-color="${safe(meta.accent)}" stop-opacity="0.8"></stop>
            <stop offset="100%" stop-color="${safe(meta.accent)}" stop-opacity="0.3"></stop>
          </linearGradient>
        </defs>
        <rect x="10" y="52" width="200" height="92" rx="14" fill="#ffffff" stroke="#bfd6ef"></rect>
        <rect x="240" y="52" width="200" height="92" rx="14" fill="#ffffff" stroke="#bfd6ef"></rect>
        <rect x="470" y="52" width="200" height="92" rx="14" fill="#ffffff" stroke="#bfd6ef"></rect>
        <rect x="700" y="52" width="190" height="92" rx="14" fill="#ffffff" stroke="#bfd6ef"></rect>
        <line x1="210" y1="98" x2="240" y2="98" stroke="url(#lineGrad)" stroke-width="4"></line>
        <line x1="440" y1="98" x2="470" y2="98" stroke="url(#lineGrad)" stroke-width="4"></line>
        <line x1="670" y1="98" x2="700" y2="98" stroke="url(#lineGrad)" stroke-width="4"></line>
        <text x="22" y="80" font-size="14" fill="#27466c" font-weight="700">Announcement</text>
        <text x="22" y="102" font-size="12" fill="#36597f">${safe(title)}</text>
        <text x="252" y="80" font-size="14" fill="#27466c" font-weight="700">Microsoft capability</text>
        <text x="252" y="102" font-size="12" fill="#36597f">Platform feature and release motion</text>
        <text x="482" y="80" font-size="14" fill="#27466c" font-weight="700">Service-line application</text>
        <text x="482" y="102" font-size="12" fill="#36597f">${safe(serviceLine)}</text>
        <text x="712" y="80" font-size="14" fill="#27466c" font-weight="700">Client outcome</text>
        <text x="712" y="102" font-size="12" fill="#36597f">Faster value, lower risk, clearer evidence</text>
      </svg>
    `;
  }

  function updateNavigator() {
    const prev = $("sl-prev");
    const next = $("sl-next");
    if (!prev || !next) return;
    prev.disabled = state.activeIndex <= 0;
    next.disabled = state.activeIndex >= state.filtered.length - 1;
  }

  function renderList() {
    const list = $("sl-list-items");
    const count = $("sl-count");
    const empty = $("sl-empty");
    if (!list || !count || !empty) return;

    list.innerHTML = "";
    count.textContent = `${state.filtered.length} announcement(s) shown for ${industry}.`;
    empty.style.display = state.filtered.length ? "none" : "block";

    state.filtered.forEach((item, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `sl-list-item${index === state.activeIndex ? " active" : ""}`;

      const title = document.createElement("strong");
      title.textContent = item.title;

      const small = document.createElement("div");
      small.className = "sl-list-small";
      small.textContent = `${item.source} · Published ${item.publishedDate}`;

      const score = document.createElement("div");
      score.className = "sl-score";
      score.textContent = `Relevance score: ${item.industryView && item.industryView.score ? item.industryView.score : 1}`;

      btn.appendChild(title);
      btn.appendChild(small);
      btn.appendChild(score);
      btn.addEventListener("click", function () {
        state.activeIndex = index;
        renderList();
        renderDetail();
      });
      list.appendChild(btn);
    });
  }

  function renderDetail() {
    const detail = $("sl-detail");
    if (!detail) return;
    const item = state.filtered[state.activeIndex];
    updateNavigator();
    if (!item) {
      detail.innerHTML = '<p class="sl-empty">No announcements match this filter yet.</p>';
      return;
    }

    const view = item.industryView || {};
    const serviceLines = (view.serviceLines || []).filter(Boolean);
    const bullets = (view.applicationAngles && view.applicationAngles.length)
      ? view.applicationAngles
      : deriveApplicationBullets(serviceLines, item.title);
    const nextActions = (view.recommendedActions && view.recommendedActions.length)
      ? view.recommendedActions
      : [
        `Update your ${industry} playbook with a short applicability note for this release.`,
        "Pick one in-flight engagement and test where this improves speed, quality, or control coverage.",
        "Prepare a client-facing talking point that ties this announcement to measurable business outcomes."
      ];
    const serviceLineChips = serviceLines.length
      ? serviceLines.map((line) => `<span class="sl-chip">${safe(line)}</span>`).join("")
      : `<span class="sl-chip">${safe(industry)} Core Service</span>`;
    const why = view.whyItMatters || `This update materially affects ${industry} delivery planning.`;

    detail.innerHTML = `
      <h2><a href="${safe(item.link)}" target="_blank" rel="noopener">${safe(item.title)}</a></h2>
      <p class="sl-muted">${safe(item.source)} · Published ${safe(item.publishedDate)} · Captured ${safe(item.snapshotDate)}</p>
      <div class="sl-chip-row">${serviceLineChips}</div>
      <p>${safe(buildDetailedWriteUp(item))}</p>
      <h3 class="sl-section-title">Why this matters to ${safe(industry)}</h3>
      <p>${safe(why)}</p>
      <h3 class="sl-section-title">How to apply this in client work</h3>
      <ul>${bullets.map((b) => `<li>${safe(b)}</li>`).join("")}</ul>
      <h3 class="sl-section-title">Recommended immediate actions</h3>
      <ul>
        ${nextActions.map((x) => `<li>${safe(x)}</li>`).join("")}
      </ul>
      <div class="sl-visual">${renderImpactVisual(item)}</div>
    `;
  }

  function applyFilters() {
    const selectedDate = ($("sl-date") && $("sl-date").value) || "all";
    const query = normalize(($("sl-search") && $("sl-search").value) || "");
    state.filtered = state.all.filter((item) => {
      const dateMatch = selectedDate === "all" || item.publishedDate === selectedDate;
      if (!dateMatch) return false;
      if (!query) return true;
      const text = normalize(`${item.title} ${item.summary} ${(item.industryView && item.industryView.whyItMatters) || ""}`);
      return text.includes(query);
    });
    state.activeIndex = 0;
    renderList();
    renderDetail();
  }

  function hydrateDateFilter() {
    const select = $("sl-date");
    if (!select) return;
    const dates = Array.from(new Set(state.all.map((item) => item.publishedDate))).sort().reverse();
    select.innerHTML = '<option value="all">All publish dates</option>';
    dates.forEach((date) => {
      const option = document.createElement("option");
      option.value = date;
      option.textContent = date;
      select.appendChild(option);
    });
  }

  function wireButtons() {
    const prev = $("sl-prev");
    const next = $("sl-next");
    const date = $("sl-date");
    const search = $("sl-search");

    if (prev) {
      prev.addEventListener("click", function () {
        if (state.activeIndex > 0) {
          state.activeIndex -= 1;
          renderList();
          renderDetail();
        }
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        if (state.activeIndex < state.filtered.length - 1) {
          state.activeIndex += 1;
          renderList();
          renderDetail();
        }
      });
    }
    if (date) date.addEventListener("change", applyFilters);
    if (search) search.addEventListener("input", applyFilters);
  }

  async function loadData() {
    const status = $("sl-status");
    const response = await fetch("../data/daily-articles.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Could not load daily articles feed.");
    const payload = await response.json();
    const rows = [];
    (payload.dates || []).forEach((snapshot) => {
      (snapshot.articles || []).forEach((article) => {
        const industryView = industryViewForArticle(article);
        if (!industryView) return;
        rows.push({
          snapshotDate: snapshot.date,
          title: article.title,
          link: article.link,
          source: article.source,
          summary: article.summary || "",
          publishedDate: article.publishedDate || snapshot.date,
          industryView
        });
      });
    });

    rows.sort((a, b) => {
      if (a.publishedDate !== b.publishedDate) return b.publishedDate.localeCompare(a.publishedDate);
      return (b.industryView.score || 0) - (a.industryView.score || 0);
    });

    state.all = rows;
    if (status) {
      status.textContent = rows.length
        ? `Feed updated ${new Date(payload.generatedAt).toLocaleString()} · ${rows.length} ${industry} announcements available.`
        : `Feed loaded, but no ${industry} announcements were detected yet.`;
    }
  }

  async function init() {
    setTheme();
    wireButtons();
    try {
      await loadData();
      hydrateDateFilter();
      applyFilters();
    } catch (error) {
      const detail = $("sl-detail");
      const status = $("sl-status");
      if (status) status.textContent = "Could not load announcements right now.";
      if (detail) detail.innerHTML = '<p class="sl-empty">We could not load the data feed. Please try again shortly.</p>';
      console.error(error);
    }
  }

  init();
})();
