(function () {
  var MAX_ITEMS = 8;
  var state = { payload: null };

  function $(id) {
    return document.getElementById(id);
  }

  function flatten(entry) {
    var rows = [];
    (entry.articles || []).forEach(function (article) {
      rows.push({
        title: article.title || "Untitled update",
        link: article.link || "#",
        source: article.source || "Microsoft",
        publishedDate: article.publishedDate || entry.date,
        industries: (article.industries || []).map(function (x) { return x.name; }).filter(Boolean)
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

  function render(rows, generatedAt, selectedDate) {
    var status = $("events-news-status");
    var list = $("events-news-list");
    var count = $("events-news-count");
    if (!status || !list) return;

    list.innerHTML = "";
    if (count) count.textContent = "";
    if (!rows.length) {
      status.textContent = "No headlines were captured for " + selectedDate + ".";
      return;
    }

    status.textContent = "Feed updated " + new Date(generatedAt).toLocaleString();
    if (count) count.textContent = rows.length + " article(s) captured on " + selectedDate + ".";
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

  function renderDate(selectedDate) {
    if (!state.payload) return;
    var entry = (state.payload.dates || []).find(function (x) { return x.date === selectedDate; });
    var rows = entry ? sortByDate(unique(flatten(entry))) : [];
    render(rows, state.payload.generatedAt, selectedDate);
  }

  function setupDatePicker(payload) {
    var picker = $("events-news-date");
    if (!picker) return;
    var dates = (payload.dates || []).map(function (x) { return x.date; }).sort().reverse();
    if (!dates.length) {
      var status = $("events-news-status");
      if (status) status.textContent = "No daily snapshots yet. The next scheduled run will populate this calendar.";
      return;
    }
    picker.min = dates[dates.length - 1];
    picker.max = dates[0];
    picker.value = dates[0];
    picker.addEventListener("change", function () {
      renderDate(picker.value);
    });
    renderDate(picker.value);
  }

  async function init() {
    var status = $("events-news-status");
    try {
      var res = await fetch("../data/daily-articles.json", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      var payload = await res.json();
      state.payload = payload;
      setupDatePicker(payload);
    } catch (err) {
      if (status) status.textContent = "Could not load latest news right now.";
      console.error(err);
    }
  }

  init();
})();
