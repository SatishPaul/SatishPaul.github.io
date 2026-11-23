(function () {
  var cfg = window.SATISH_BRIEF_CONFIG || {};
  var fallbackTo = cfg.fallbackSubscriptionEmail || "";
  var enableEmailFallback = cfg.enableEmailFallback === true;

  function endpointFor(formType) {
    if (formType === "subscribe") return cfg.subscribeFlowUrl || "";
    if (formType === "preferences") return cfg.preferencesFlowUrl || "";
    if (formType === "unsubscribe") return cfg.unsubscribeFlowUrl || "";
    return "";
  }

  function pickIndustries(form) {
    return Array.from(form.querySelectorAll('input[name="industries"]:checked')).map(function (x) {
      return x.value;
    });
  }

  function getFormPayload(form, formType) {
    var fd = new FormData(form);
    var payload = {
      formType: formType,
      email: String(fd.get("email") || "").trim(),
      industries: pickIndustries(form),
      token: String(fd.get("token") || "").trim(),
      source: String(fd.get("source") || "website").trim(),
      timestampUtc: new Date().toISOString()
    };
    return payload;
  }

  function setMessage(form, text, isError) {
    var msg = form.querySelector("[data-msg]");
    if (!msg) return;
    msg.textContent = text || "";
    msg.classList.toggle("err", !!isError);
  }

  async function postToFlow(url, payload) {
    var res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("Request failed with status " + res.status);
    return res;
  }

  function openFallbackMailto(payload) {
    if (!fallbackTo) return false;
    var subjectMap = {
      subscribe: "Subscribe: Satish Paul Brief",
      preferences: "Preferences update: Satish Paul Brief",
      unsubscribe: "Unsubscribe: Satish Paul Brief"
    };
    var subject = subjectMap[payload.formType] || "Satish Paul Brief request";
    var body = [
      "Please process this Satish Paul Brief request.",
      "Form type: " + payload.formType,
      "Email: " + payload.email,
      "Industries: " + (payload.industries.join(", ") || "(none selected)"),
      "Token: " + (payload.token || "(none)"),
      "Source: " + payload.source
    ].join("\n");
    location.href = "mailto:" + encodeURIComponent(fallbackTo) + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    return true;
  }

  function normalizeIndustry(value) {
    return String(value || "").trim().toLowerCase();
  }

  function prefillSubscribeFromUrl() {
    var form = document.querySelector('form[data-pp-form="subscribe"]');
    if (!form) return;
    var params = new URLSearchParams(window.location.search || "");
    var requestedIndustry = String(params.get("industry") || "").trim();
    if (!requestedIndustry) return;

    var matched = false;
    Array.from(form.querySelectorAll('input[name="industries"]')).forEach(function (box) {
      var shouldSelect = normalizeIndustry(box.value) === normalizeIndustry(requestedIndustry);
      box.checked = shouldSelect;
      matched = matched || shouldSelect;
    });

    if (!matched) return;

    var source = form.querySelector('input[name="source"]');
    if (source) source.value = "quick-subscribe-link";
    setMessage(form, requestedIndustry + " is preselected. Enter your email to subscribe.", false);
    var emailField = form.querySelector('input[name="email"]');
    if (emailField) emailField.focus();
  }

  function wireForms() {
    Array.from(document.querySelectorAll("form[data-pp-form]")).forEach(function (form) {
      form.addEventListener("submit", async function (e) {
        e.preventDefault();
        var formType = form.getAttribute("data-pp-form");
        var payload = getFormPayload(form, formType);
        if (!payload.email) {
          setMessage(form, "Please enter a valid work email.", true);
          return;
        }
        if ((formType === "subscribe" || formType === "preferences") && payload.industries.length === 0) {
          setMessage(form, "Select at least one edition.", true);
          return;
        }

        var endpoint = endpointFor(formType);
        try {
          if (!endpoint) {
            localStorage.setItem("satishBrief:lastPayload", JSON.stringify(payload));
            if (enableEmailFallback && openFallbackMailto(payload)) {
              setMessage(form, "No flow URL configured yet. Opened email fallback.", false);
            } else {
              setMessage(form, "Online subscription is not configured yet. Please add the Power Automate flow URL in site-config.js.", true);
            }
            return;
          }
          await postToFlow(endpoint, payload);
          setMessage(form, "Done. Your request was saved.", false);
          form.reset();
        } catch (err) {
          console.error(err);
          if (enableEmailFallback && openFallbackMailto(payload)) {
            setMessage(form, "Could not reach the flow endpoint; opened email fallback.", false);
          } else {
            setMessage(form, "Could not complete online request. Please check the flow URL and try again.", true);
          }
        }
      });
    });
  }

  function wireQuickSubscribeLinks() {
    Array.from(document.querySelectorAll(".subscribe-link[data-industry]")).forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var industry = a.getAttribute("data-industry");
        var inBrief = window.location.pathname.indexOf("/brief/") >= 0;
        if (inBrief) {
          var form = document.querySelector('form[data-pp-form="subscribe"]');
          if (form) {
            Array.from(form.querySelectorAll('input[name="industries"]')).forEach(function (box) {
              box.checked = normalizeIndustry(box.value) === normalizeIndustry(industry);
            });
            var source = form.querySelector('input[name="source"]');
            if (source) source.value = "quick-subscribe-link";
            setMessage(form, industry + " is preselected. Enter your email to subscribe.", false);
            var emailField = form.querySelector('input[name="email"]');
            if (emailField) emailField.focus();
            var anchor = document.getElementById("subscribe");
            if (anchor) anchor.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          return;
        }
        window.location.href = "../brief/?industry=" + encodeURIComponent(industry) + "#subscribe";
      });
    });
  }

  prefillSubscribeFromUrl();
  wireForms();
  wireQuickSubscribeLinks();
})();
