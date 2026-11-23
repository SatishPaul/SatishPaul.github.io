(function () {
  function $(id) {
    return document.getElementById(id);
  }

  function flattenArticles(payload) {
    var rows = [];
    (payload.dates || []).forEach(function (snapshot) {
      (snapshot.articles || []).forEach(function (article) {
        rows.push({
          title: article.title || "Untitled update",
          link: article.link || "#",
          source: article.source || "Microsoft",
          publishedDate: article.publishedDate || snapshot.date,
          industries: (article.industries || []).map(function (x) { return x.name; }).filter(Boolean),
          snapshotDate: snapshot.date
        });
      });
    });
    return rows;
  }

  function uniqueByLink(rows) {
    var seen = Object.create(null);
    return rows.filter(function (row) {
      var key = row.link || row.title;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function render(rows, generatedAt) {
    var status = $("latest-news-status");
    var list = $("latest-news-list");
    if (!status || !list) return;

    list.innerHTML = "";
    if (!rows.length) {
      status.textContent = "No headlines are available yet. The daily job will populate this section.";
      return;
    }

    status.textContent = "Updated " + new Date(generatedAt).toLocaleString();
    rows.slice(0, 6).forEach(function (row) {
      var card = document.createElement("article");
      card.className = "latest-card";

      var title = document.createElement("h3");
      var link = document.createElement("a");
      link.href = row.link;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = row.title;
      title.appendChild(link);

      var meta = document.createElement("p");
      meta.className = "latest-meta";
      meta.textContent = row.source + " \u00b7 Published " + row.publishedDate;

      var tags = document.createElement("div");
      tags.className = "latest-tags";
      (row.industries.length ? row.industries : ["General"]).forEach(function (name) {
        var tag = document.createElement("span");
        tag.className = "latest-tag";
        tag.textContent = name;
        tags.appendChild(tag);
      });

      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(tags);
      list.appendChild(card);
    });
  }

  async function init() {
    var status = $("latest-news-status");
    try {
      var res = await fetch("data/daily-articles.json", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      var payload = await res.json();
      var rows = uniqueByLink(flattenArticles(payload));
      rows.sort(function (a, b) {
        if (a.publishedDate !== b.publishedDate) return b.publishedDate.localeCompare(a.publishedDate);
        return b.snapshotDate.localeCompare(a.snapshotDate);
      });
      render(rows, payload.generatedAt);
    } catch (err) {
      if (status) status.textContent = "Could not load latest news right now.";
      console.error(err);
    }
  }

  init();
})();
