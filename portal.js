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

  // ---------- growth dashboard ----------
  const PHASE_ORDER = ["Backend live", "RE gifting portal", "Referral engine", "Email foundation", "Home market", "Win-back & expansion", "Decisions", "General"];

  async function api(payload) {
    if (!CFG.ENDPOINT) throw new Error("no-endpoint");
    const res = await fetch(CFG.ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });
    return res.json();
  }

  async function initDashboard() {
    if (!CFG.ENDPOINT) { $("dash-offline").hidden = false; return; }
    const saved = { pin: localStorage.getItem("fi_pin") || "", who: localStorage.getItem("fi_who") || "Aaron" };
    let tasks = [];
    let sheetUrl = "";
    let META = {};
    try { META = await (await fetch("task-meta.json", { cache: "no-store" })).json(); } catch (_) {}

    const pct = (d, t) => (t ? Math.round((d / t) * 100) : 0);
    const chipClass = (o) => ({ aaron: "aaron", sam: "sam", claude: "claude" }[String(o).toLowerCase()] || "team");

    function render() {
      const doneN = tasks.filter((t) => t.done).length;
      $("total-pct").textContent = pct(doneN, tasks.length) + "%";
      $("total-count").textContent = doneN + " of " + tasks.length + " done";
      $("total-bar").style.width = pct(doneN, tasks.length) + "%";
      $("whoami").textContent = "Ticking as " + saved.who + " · ";

      const phases = [...new Set([...PHASE_ORDER.filter((p) => tasks.some((t) => t.phase === p)), ...tasks.map((t) => t.phase)])];
      $("phases").innerHTML = "";
      $("add-phase").innerHTML = phases.map((p) => `<option>${p}</option>`).join("");
      phases.forEach((phase) => {
        const list = tasks.filter((t) => t.phase === phase);
        if (!list.length) return;
        const d = list.filter((t) => t.done).length;
        const sec = document.createElement("div");
        sec.className = "phase";
        sec.innerHTML = `
          <div class="phase-head"><h2>${phase}</h2><span class="count">${d}/${list.length}</span></div>
          <div class="bar"><span style="width:${pct(d, list.length)}%"></span></div>
          <ul class="tasks"></ul>`;
        const ul = sec.querySelector("ul");
        list.forEach((t) => {
          const li = document.createElement("li");
          li.className = t.done ? "done" : "";
          const doneMeta = t.done && t.done_by ? `<div class="task-meta">done by ${t.done_by}${t.done_at ? " · " + new Date(t.done_at).toLocaleDateString("en-AU", { day: "numeric", month: "short" }) : ""}</div>` : "";
          const m = META[t.id] || {};
          const brief = m.brief || (META._default && META._default.brief) || "";
          const promptTpl = m.prompt || (META._default && META._default.prompt) || "";
          const prompt = promptTpl.replace("{TASK}", t.task);
          const link = m.sheet ? sheetUrl : m.link || "";
          const linkLabel = m.linkLabel || "Open resource";
          li.innerHTML = `
            <button class="tick" role="checkbox" aria-checked="${t.done}" aria-label="Mark '${t.task.replace(/'/g, "&#39;")}' ${t.done ? "not done" : "done"}">
              <svg width="14" height="11" viewBox="0 0 14 11" aria-hidden="true"><path d="M1 5.5 5 9.5 13 1.5" stroke="#fbf8f3" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <div class="task-body">
              <button class="task-open" aria-expanded="false"><span class="task-txt">${t.task}</span><svg class="chev" width="12" height="8" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5 6 6.5 11 1.5" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
              ${doneMeta}
              <div class="task-detail" hidden>
                ${brief ? `<p class="brief">${brief}</p>` : ""}
                <div class="detail-actions">
                  ${link ? `<a class="btn mini" href="${link}" target="_blank" rel="noopener">${linkLabel} ↗</a>` : ""}
                  ${prompt ? `<button class="btn mini ghost copy-prompt" type="button">Copy prompt for Claude</button>` : ""}
                </div>
              </div>
            </div>
            <span class="chip ${chipClass(t.owner)}">${t.owner}</span>`;
          li.querySelector(".tick").addEventListener("click", () => toggle(t));
          li.querySelector(".task-open").addEventListener("click", (e) => {
            const d = li.querySelector(".task-detail");
            d.hidden = !d.hidden;
            e.currentTarget.setAttribute("aria-expanded", String(!d.hidden));
            li.classList.toggle("expanded", !d.hidden);
          });
          const cp = li.querySelector(".copy-prompt");
          if (cp) cp.addEventListener("click", async () => {
            try {
              await navigator.clipboard.writeText(prompt);
              cp.textContent = "Copied — paste into Claude Code";
              setTimeout(() => { cp.textContent = "Copy prompt for Claude"; }, 2500);
            } catch (_) { window.prompt("Copy this prompt:", prompt); }
          });
          ul.appendChild(li);
        });
        $("phases").appendChild(sec);
      });
    }

    async function toggle(t) {
      t.done = !t.done;
      t.done_by = t.done ? saved.who : "";
      t.done_at = t.done ? new Date().toISOString() : "";
      render(); // optimistic
      try {
        const r = await api({ type: "task_toggle", id: t.id, done: t.done, who: saved.who, pin: saved.pin });
        if (!r.ok) throw new Error(r.error);
      } catch (e) {
        t.done = !t.done; render();
        alert("Couldn't save that tick — check your connection and try again.");
      }
    }

    async function load(pin, who) {
      const r = await api({ type: "task_list", pin });
      if (!r.ok) throw new Error(r.error || "load-failed");
      tasks = r.tasks;
      sheetUrl = r.sheet_url || sheetUrl;
      saved.pin = pin; saved.who = who;
      localStorage.setItem("fi_pin", pin); localStorage.setItem("fi_who", who);
      $("gate").hidden = true; $("dash").hidden = false;
      render();
    }

    $("gate-go").addEventListener("click", async () => {
      const err = $("dash-error");
      err.style.display = "none";
      try {
        await load($("gate-pin").value.trim(), $("gate-who").value);
      } catch (e) {
        err.textContent = e.message === "bad-pin" ? "That's not the team PIN — check with Aaron." : "Couldn't reach the dashboard backend. Try again in a moment.";
        err.style.display = "block";
      }
    });
    $("gate-pin").addEventListener("keydown", (e) => { if (e.key === "Enter") $("gate-go").click(); });

    $("refresh-btn").addEventListener("click", () => load(saved.pin, saved.who).catch(() => alert("Refresh failed — try again.")));

    $("add-btn").addEventListener("click", async () => {
      const txt = $("add-task").value.trim();
      if (!txt) return;
      $("add-btn").disabled = true;
      try {
        const r = await api({ type: "task_add", task: txt, phase: $("add-phase").value, owner: $("add-owner").value, pin: saved.pin });
        if (!r.ok) throw new Error(r.error);
        tasks.push({ id: r.id, phase: $("add-phase").value, task: txt, owner: $("add-owner").value, done: false, done_by: "", done_at: "" });
        $("add-task").value = "";
        render();
      } catch (e) {
        alert("Couldn't add that task — try again.");
      } finally { $("add-btn").disabled = false; }
    });

    // auto-open if PIN already saved on this device
    if (saved.pin) {
      load(saved.pin, saved.who).catch(() => { $("gate").hidden = false; });
    } else {
      $("gate").hidden = false;
    }
  }

  window.FIPortal = { initGift, initSignup, initReferral, initDashboard };
})();
