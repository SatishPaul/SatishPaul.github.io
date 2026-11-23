(function () {
  var MAX_ITEMS = 8;

  function $(id) {
    return document.getElementById(id);
  }

  function flatten(payload) {
    var rows = [];
    (payload.dates || []).forEach(function (snapshot) {
      (snapshot.articles || []).forEach(function (article) {
        rows.push({
          title: article.title || "Untitled update",
          link: article.link || "#",
          source: article.source || "Microsoft",
          publishedDate: article.publishedDate || snapshot.date,
          industries: (article.industries || []).map(function (x) { return x.name; }).filter(Boolean)
        });
      });
    });
    return rows;
  }

  function unique(rows) {
    var seen = Object.create(null);
    return rows.filter(function (row) {
      var key = row.link || row.title;
      if (seen[key]) return false;
      seen[key] = true;
      return true;
    });
  }

  function sortByDate(rows) {
    rows.sort(function (a, b) {
      if (a.publishedDate !== b.publishedDate) {
        return b.publishedDate.localeCompare(a.publishedDate);
      }
      return a.title.localeCompare(b.title);
    });
    return rows;
  }

  function render(rows, generatedAt) {
    var status = $("events-news-status");
    var list = $("events-news-list");
    if (!status || !list) return;

    list.innerHTML = "";
    if (!rows.length) {
      status.textContent = "No headlines are available yet. The daily job will populate this section.";
      return;
    }

    status.textContent = "Updated " + new Date(generatedAt).toLocaleString();
    rows.slice(0, MAX_ITEMS).forEach(function (row) {
      var article = document.createElement("article");
      article.className = "news";

      var heading = document.createElement("h4");
      var link = document.createElement("a");
      link.href = row.link;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = row.title;
      heading.appendChild(link);

      var meta = document.createElement("p");
      meta.textContent = row.source + " · Published " + row.publishedDate;

      var tags = document.createElement("div");
      tags.className = "news-tags";
      (row.industries.length ? row.industries : ["General"]).forEach(function (name) {
        var tag = document.createElement("span");
        tag.className = "chip";
        tag.textContent = name;
        tags.appendChild(tag);
      });

      article.appendChild(heading);
      article.appendChild(meta);
      article.appendChild(tags);
      list.appendChild(article);
    });
  }

  async function init() {
    var status = $("events-news-status");
    try {
      var res = await fetch("../data/daily-articles.json", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      var payload = await res.json();
      render(sortByDate(unique(flatten(payload))), payload.generatedAt);
    } catch (err) {
      if (status) status.textContent = "Could not load latest news right now.";
      console.error(err);
    }
  }

  init();
})();
