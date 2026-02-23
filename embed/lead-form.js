/**
 * Benetic Lead Capture Widget
 *
 * Usage:
 *   <script src="https://your-domain.com/embed/lead-form.js"
 *           data-tenant="your-tenant-slug"
 *           data-api-key="your-webhook-key"
 *           data-api-url="https://your-api.com">
 *   </script>
 *   <div id="benetic-lead-form"></div>
 */
(function () {
  const script = document.currentScript;
  const tenant = script.getAttribute("data-tenant");
  const apiKey = script.getAttribute("data-api-key");
  const apiUrl = (script.getAttribute("data-api-url") || "").replace(/\/$/, "");

  if (!tenant || !apiKey || !apiUrl) {
    console.error("[Benetic] Missing data-tenant, data-api-key, or data-api-url.");
    return;
  }

  const container = document.getElementById("benetic-lead-form");
  if (!container) {
    console.error("[Benetic] No element with id='benetic-lead-form' found.");
    return;
  }

  // Read UTM params from URL
  const params = new URLSearchParams(window.location.search);
  const utms = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function (k) {
    if (params.get(k)) utms[k] = params.get(k);
  });

  // Build form
  container.innerHTML =
    '<form id="benetic-form" style="max-width:400px;font-family:sans-serif">' +
    '<input name="first_name" placeholder="First name" style="width:100%;padding:8px;margin:4px 0;box-sizing:border-box">' +
    '<input name="last_name" placeholder="Last name" style="width:100%;padding:8px;margin:4px 0;box-sizing:border-box">' +
    '<input name="email" type="email" placeholder="Email" required style="width:100%;padding:8px;margin:4px 0;box-sizing:border-box">' +
    '<input name="phone" type="tel" placeholder="Phone" style="width:100%;padding:8px;margin:4px 0;box-sizing:border-box">' +
    '<button type="submit" style="width:100%;padding:10px;margin:8px 0;background:#2563eb;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:16px">Get Started</button>' +
    '<p id="benetic-msg" style="text-align:center;margin:4px 0;font-size:14px"></p>' +
    "</form>";

  document.getElementById("benetic-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var msg = document.getElementById("benetic-msg");
    var fd = new FormData(e.target);
    var body = Object.assign(
      {
        first_name: fd.get("first_name") || undefined,
        last_name: fd.get("last_name") || undefined,
        email: fd.get("email") || undefined,
        phone: fd.get("phone") || undefined,
        source: "website",
      },
      utms
    );

    msg.textContent = "Submitting...";
    msg.style.color = "#666";

    fetch(apiUrl + "/api/v1/webhooks/ingest/" + tenant, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify(body),
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (data.status === "ok") {
          msg.textContent = "Thanks! We'll be in touch.";
          msg.style.color = "#16a34a";
          e.target.reset();
        } else {
          msg.textContent = data.detail || "Something went wrong.";
          msg.style.color = "#dc2626";
        }
      })
      .catch(function () {
        msg.textContent = "Network error. Please try again.";
        msg.style.color = "#dc2626";
      });
  });
})();
