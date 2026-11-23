(function () {
  var cfg = window.SATISH_BRIEF_CONFIG || {};
  var fallbackTo = cfg.fallbackSubscriptionEmail || "";

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
    var subject = "Subscribe: Satish Paul Brief";
    var body = [
      "Please subscribe/update my preferences for Satish Paul Brief.",
      "Email: " + payload.email,
      "Industries: " + (payload.industries.join(", ") || "(none selected)"),
      "Source: " + payload.source
    ].join("\n");
    location.href = "mailto:" + encodeURIComponent(fallbackTo) + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    return true;
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
            if (formType === "subscribe" && openFallbackMailto(payload)) {
              setMessage(form, "No flow URL configured yet. Opened email fallback.", false);
            } else {
              setMessage(form, "No flow URL configured yet. Saved your request locally in this browser.", false);
            }
            return;
          }
          await postToFlow(endpoint, payload);
          setMessage(form, "Done. Your request was saved.", false);
          form.reset();
        } catch (err) {
          console.error(err);
          if (formType === "subscribe" && openFallbackMailto(payload)) {
            setMessage(form, "Flow call failed; opened email fallback.", true);
          } else {
            setMessage(form, "Could not complete request. Please try again.", true);
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
        var page = "brief/#subscribe";
        if (window.location.pathname.indexOf("/brief/") >= 0) page = "#";
        alert("Use the subscribe form to join " + industry + ".");
        window.location.href = page;
      });
    });
  }

  wireForms();
  wireQuickSubscribeLinks();
})();
