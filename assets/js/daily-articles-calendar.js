(function () {
  function $(id) { return document.getElementById(id); }

  function renderArticle(article) {
    const container = document.createElement("article");
    container.className = "a-card";

    const title = document.createElement("h3");
    const link = document.createElement("a");
    link.href = article.link;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = article.title;
    title.appendChild(link);

    const meta = document.createElement("p");
    meta.className = "a-meta";
    meta.textContent = `${article.source} · Published ${article.publishedDate}`;

    const summary = document.createElement("p");
    summary.textContent = article.summary || "No summary available.";

    const tags = document.createElement("div");
    tags.className = "a-tags";
    (article.industries || []).forEach(function (x) {
      const tag = document.createElement("span");
      tag.className = "a-tag";
      tag.textContent = x.name;
      tags.appendChild(tag);
    });

    const why = document.createElement("ul");
    why.className = "a-why";
    (article.industries || []).forEach(function (x) {
      const li = document.createElement("li");
      var lineText = x.whyItMatters;
      if (x.serviceLines && x.serviceLines.length) {
        lineText += " Service offerings: " + x.serviceLines.join(", ") + ".";
      }
      li.innerHTML = "<strong>" + x.name + ":</strong> " + lineText;
      why.appendChild(li);
    });

    container.appendChild(title);
    container.appendChild(meta);
    container.appendChild(summary);
    container.appendChild(tags);
    container.appendChild(why);
    return container;
  }

  function renderDate(data, selectedDate) {
    const target = $("daily-results");
    if (!target) return;
    target.innerHTML = "";

    const entry = (data.dates || []).find(function (d) { return d.date === selectedDate; });
    if (!entry) {
      target.innerHTML = '<p class="empty">No articles captured for this date yet.</p>';
      return;
    }

    const hdr = document.createElement("p");
    hdr.className = "count";
    hdr.textContent = `${entry.articles.length} article(s) captured on ${entry.date}.`;
    target.appendChild(hdr);

    entry.articles.forEach(function (article) {
      target.appendChild(renderArticle(article));
    });
  }

  async function main() {
    const picker = $("article-date");
    const source = $("source-status");
    if (!picker || !source) return;

    const res = await fetch("../data/daily-articles.json", { cache: "no-store" });
    if (!res.ok) {
      source.textContent = "Could not load daily article data yet.";
      source.classList.add("err");
      return;
    }

    const data = await res.json();
    const dates = (data.dates || []).map(function (d) { return d.date; }).sort().reverse();
    if (!dates.length) {
      source.textContent = "No daily snapshots yet. First scheduled scan will populate this view.";
      return;
    }

    picker.min = dates[dates.length - 1];
    picker.max = dates[0];
    picker.value = dates[0];
    source.textContent = `Daily feed updated: ${new Date(data.generatedAt).toLocaleString()}`;
    renderDate(data, picker.value);

    picker.addEventListener("change", function () {
      renderDate(data, picker.value);
    });
  }

  main().catch(function (err) {
    const source = $("source-status");
    if (source) {
      source.textContent = "Error loading article calendar.";
      source.classList.add("err");
    }
    console.error(err);
  });
})();
