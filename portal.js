/* Floral Image Canberra — Agent Gifting Portal (shared front-end logic) */
(function () {
  "use strict";
  const CFG = window.FI_CONFIG || { ENDPOINT: "" };

  // ---------- submission ----------
  async function submit(payload) {
    if (!CFG.ENDPOINT) throw new Error("no-endpoint");
    payload.submitted_at = new Date().toISOString();
    payload.page = location.href;
    const body = JSON.stringify(payload);
    try {
      // Apps Script-friendly: text/plain avoids a CORS preflight and the
      // response (after Google's redirect) is readable cross-origin.
      const res = await fetch(CFG.ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body,
        redirect: "follow",
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "server-rejected");
      return data;
    } catch (err) {
      if (err.message === "server-rejected") throw err;
      // Network/CORS quirk fallback: fire-and-forget form post. The backend
      // still records + emails; we just can't read the response.
      const fd = new FormData();
      fd.append("payload", body);
      await fetch(CFG.ENDPOINT, { method: "POST", body: fd, mode: "no-cors" });
      return { ok: true, blind: true };
    }
  }

  // ---------- helpers ----------
  const $ = (id) => document.getElementById(id);
  const val = (id) => ($(id) ? $(id).value.trim() : "");

  function fieldOk(id, ok) {
    const box = $(id) && $(id).closest(".field");
    if (box) box.classList.toggle("bad", !ok);
    return ok;
  }
  function validEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s); }

  function wireForm(form, btn, sendingEl, doSubmit) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (form.querySelector('[name="company_website"]').value) return; // honeypot
      if (!doSubmit.validate()) {
        const bad = form.querySelector(".field.bad input, .field.bad textarea");
        if (bad) bad.focus();
        return;
      }
      btn.disabled = true;
      sendingEl.style.display = "inline";
      try {
        await submit(doSubmit.payload());
        form.hidden = true;
        doSubmit.onSuccess();
      } catch (err) {
        btn.disabled = false;
        sendingEl.style.display = "none";
        alert("That didn't go through — please try again, or email canberra@floralimage.com and we'll log it for you.");
      }
    });
  }

  // ---------- agent registry ----------
  async function loadAgent() {
    const slug = new URLSearchParams(location.search).get("a") || "";
    try {
      const res = await fetch("agents.json", { cache: "no-store" });
      const registry = await res.json();
      return { slug, info: registry[slug] || null };
    } catch (_) {
      return { slug, info: null };
    }
  }

  function renderAgentHead(slug, info) {
    const head = $("agent-head");
    if (!head) return;
    if (info) {
      const logo = info.logo
        ? `<img class="agent-logo" src="${info.logo}" alt="${info.agency} logo">`
        : `<div class="agent-logo-fallback" aria-hidden="true">${(info.agency || "?").charAt(0)}</div>`;
      head.innerHTML = `${logo}<div><div class="partner">Gifting partner</div><div class="aname">${info.agency}</div></div>`;
    } else {
      head.innerHTML = `<div><div class="partner">Floral Image Canberra</div><div class="aname">Agent gifting</div></div>`;
    }
  }

  // ---------- default copy ----------
  const CARD_DEFAULTS = {
    home: "Welcome to your new home! Wishing you many wonderful years here.",
    office: "Congratulations on the new office! Wishing you every success in the space.",
  };
  function introDefault(occasion, agent, agency) {
    const what = occasion === "office" ? "your new office" : "your new home";
    const who = agent ? agent + (agency ? " from " + agency : "") : "Your agent";
    return `Hi, it's the team from Floral Image Canberra. ${who} has arranged a welcome gift of designer flowers for ${what} — no cost, nothing to sign up for. We're just calling to find the best time to drop them off.`;
  }

  // ---------- gift page ----------
  async function initGift() {
    const { slug, info } = await loadAgent();
    renderAgentHead(slug, info);
    if (info) {
      if (info.agent && !val("g-agent")) $("g-agent").value = info.agent;
      if (info.agency && !val("g-agency")) $("g-agency").value = info.agency;
      if (info.email && !val("g-email")) $("g-email").value = info.email;
    }
    if (!CFG.ENDPOINT) { $("gift-offline").hidden = false; $("gift-submit").disabled = true; }

    const occ = () => document.querySelector('input[name="occasion"]:checked').value;
    let cardTouched = false, introTouched = false;

    function refreshDefaults() {
      if (!cardTouched) $("card-msg").value = CARD_DEFAULTS[occ()];
      if (!introTouched) $("intro-script").value = introDefault(occ(), val("g-agent"), val("g-agency"));
      refreshCard();
    }
    function refreshCard() {
      $("card-preview").textContent = val("card-msg") || "…";
      const from = [val("g-agent"), val("g-agency")].filter(Boolean).join(", ");
      $("card-from").textContent = from ? "— " + from : "— your name here";
      $("card-count").textContent = String(val("card-msg").length);
    }

    document.querySelectorAll('#occasion input').forEach((r) =>
      r.addEventListener("change", () => {
        document.querySelectorAll("#occasion label").forEach((l) => l.classList.remove("on"));
        r.closest("label").classList.add("on");
        refreshDefaults();
      })
    );
    $("card-msg").addEventListener("input", () => { cardTouched = true; refreshCard(); });
    $("intro-script").addEventListener("input", () => { introTouched = true; });
    ["g-agent", "g-agency"].forEach((id) =>
      $(id).addEventListener("input", () => {
        if (!introTouched) $("intro-script").value = introDefault(occ(), val("g-agent"), val("g-agency"));
        refreshCard();
      })
    );
    refreshDefaults();

    wireForm($("gift-form"), $("gift-submit"), document.querySelector("#gift-form .sending"), {
      validate() {
        let ok = true;
        ok = fieldOk("g-agent", !!val("g-agent")) && ok;
        ok = fieldOk("g-agency", !!val("g-agency")) && ok;
        ok = fieldOk("g-email", validEmail(val("g-email"))) && ok;
        ok = fieldOk("c-name", !!val("c-name")) && ok;
        ok = fieldOk("c-phone", val("c-phone").replace(/\D/g, "").length >= 8) && ok;
        ok = fieldOk("c-address", val("c-address").length >= 8) && ok;
        ok = fieldOk("card-msg", !!val("card-msg")) && ok;
        return ok;
      },
      payload() {
        return {
          type: "gift",
          agent_slug: slug || "(direct)",
          occasion: occ(),
          agent_name: val("g-agent"),
          agency: val("g-agency"),
          agent_email: val("g-email"),
          agent_mobile: val("g-mobile"),
          client_name: val("c-name"),
          client_phone: val("c-phone"),
          client_address: val("c-address"),
          move_in: val("c-movein"),
          card_message: val("card-msg"),
          intro_script: val("intro-script"),
        };
      },
      onSuccess() {
        const first = val("c-name").split(/\s+/)[0] || "your client";
        $("success-detail").textContent =
          `We'll call ${first} to arrange the delivery, and you'll get a confirmation at ${val("g-email")} — plus another note the moment the flowers are in their hands.`;
        $("gift-success").style.display = "block";
        window.scrollTo({ top: 0 });
      },
    });
  }

  // ---------- signup form (index) ----------
  function initSignup() {
    if (!CFG.ENDPOINT) $("signup-offline").hidden = false;
    wireForm($("signup-form"), document.querySelector("#signup-form .btn"), document.querySelector("#signup-form .sending"), {
      validate() {
        let ok = true;
        ok = fieldOk("s-name", !!val("s-name")) && ok;
        ok = fieldOk("s-agency", !!val("s-agency")) && ok;
        ok = fieldOk("s-email", validEmail(val("s-email"))) && ok;
        return ok;
      },
      payload() {
        return {
          type: "agent_signup",
          agent_name: val("s-name"),
          agency: val("s-agency"),
          agent_email: val("s-email"),
          agent_mobile: val("s-mobile"),
        };
      },
      onSuccess() { $("signup-success").style.display = "block"; },
    });
  }

  // ---------- referral page ----------
  function initReferral() {
    // Prefill referrer from link params (Klaviyo/QR links): ?n=Name&b=Business&e=email
    const q = new URLSearchParams(location.search);
    if (q.get("n") && !val("r-name")) $("r-name").value = q.get("n");
    if (q.get("b") && !val("r-company")) $("r-company").value = q.get("b");
    if (q.get("e") && !val("r-email")) $("r-email").value = q.get("e");
    if (!CFG.ENDPOINT) $("refer-offline").hidden = false;

    wireForm($("refer-form"), document.querySelector("#refer-form .btn"), document.querySelector("#refer-form .sending"), {
      validate() {
        let ok = true;
        ok = fieldOk("r-name", !!val("r-name")) && ok;
        ok = fieldOk("r-company", !!val("r-company")) && ok;
        ok = fieldOk("r-email", validEmail(val("r-email"))) && ok;
        ok = fieldOk("f-company", !!val("f-company")) && ok;
        return ok;
      },
      payload() {
        return {
          type: "referral",
          referrer_name: val("r-name"),
          referrer_company: val("r-company"),
          referrer_email: val("r-email"),
          referred_company: val("f-company"),
          referred_contact: val("f-contact"),
          referred_phone: val("f-phone"),
          referred_email: val("f-email"),
          note: val("f-note"),
          source: q.get("src") || (q.get("e") || q.get("n") ? "email-link" : "direct"),
        };
      },
      onSuccess() {
        $("refer-success-detail").textContent =
          `We'll reach out to ${val("f-company")} this week with a friendly free trial, mention you sent us, and email ${val("r-email")} the moment your free month is locked in.`;
        $("refer-success").style.display = "block";
        window.scrollTo({ top: document.getElementById("refer").offsetTop - 20 });
      },
    });
  }

  window.FIPortal = { initGift, initSignup, initReferral };
})();
