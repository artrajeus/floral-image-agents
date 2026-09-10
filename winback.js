/* Floral Image Canberra — Win-back landing page (welcome-back.html)
   One page, many audiences. The URL says who's looking:
     ?i=<industry slug>   e.g. dental, legal, real-estate   (see winback-data.js → industries)
     &s=<suburb>          e.g. braddon, deakin, "canberra-city" (any spelling; matched loosely)
     &b=<business name>   prefills the form + personalises the headline
     &n=<first name>      personalises the greeting + prefills the form
     &e=<email>           prefills the form
     &src=<tag>           recorded against the submission (default: "winback-email")
   The page then shows current clients in the same industry + suburb (falling back to
   region, then all of Canberra) and current clients in the same suburb, from
   winback-data.js, and posts trial requests to the Apps Script backend as type
   "winback_trial". */
(function () {
  "use strict";
  const D = window.FI_WINBACK || { clients: [], industries: {}, regions: {} };
  const P = window.FIPortal || {};
  const $ = (id) => document.getElementById(id);
  const q = new URLSearchParams(location.search);

  const slug = (s) => String(s || "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const esc = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clean = (s, max) => String(s || "").replace(/[<>]/g, "").trim().slice(0, max || 80);

  // ---------- suburb + region index ----------
  const SUBURBS = {}; // slug → { name, region }
  Object.keys(D.regions).forEach((rk) => (D.regions[rk].suburbs || []).forEach((name) => { SUBURBS[slug(name)] = { name, region: rk }; }));
  const ALIASES = { city: "canberra-city", civic: "canberra-city", cbd: "canberra-city", "canberra-cbd": "canberra-city", tuggeranong: "greenway", woden: "phillip", erindale: "wanniassa" };
  // Woden/Tuggeranong/City are also real "suburbs" in the CRM; keep them if the data has them.
  function findSuburb(raw) {
    const s = slug(raw);
    if (!s) return null;
    if (SUBURBS[s]) return SUBURBS[s];
    if (ALIASES[s] && SUBURBS[ALIASES[s]]) return SUBURBS[ALIASES[s]];
    const hit = Object.keys(SUBURBS).find((k) => k.startsWith(s) || s.startsWith(k));
    return hit ? SUBURBS[hit] : null;
  }

  const ind = D.industries[q.get("i")] ? q.get("i") : "";
  const indMeta = ind ? D.industries[ind] : null;
  const isHome = ind === "home";
  const sub = findSuburb(q.get("s"));
  const regionKey = sub ? sub.region : (D.regions[q.get("r")] ? q.get("r") : "");
  const region = regionKey ? D.regions[regionKey] : null;
  const first = clean(q.get("n"), 40);
  const biz = clean(q.get("b"), 80);
  const email = clean(q.get("e"), 120);

  const clients = (D.clients || []).map((c) => ({ ...c, _s: slug(c.s), _r: (SUBURBS[slug(c.s)] || {}).region || "" }));
  const inSub = (c) => sub && c._s === slug(sub.name);
  const inRegion = (c) => regionKey && c._r === regionKey;
  const byName = (a, b) => a.n.localeCompare(b.n);
  const uniq = (list) => { const seen = new Set(); return list.filter((c) => { const k = c.n.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; }); };

  const indLabel = (m, f) => (m ? m[f] : "workplaces");
  const poss = (name) => (/s$/i.test(name) ? name + "'" : name + "'s");
  const n2w = (n) => ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"][n] || String(n);

  // ---------- cards ----------
  function card(c, showSuburb) {
    const meta = D.industries[c.i] || {};
    const tag = showSuburb && c.s ? c.s : (meta.short || "");
    return `<div class="client-card"><span class="client-name">${esc(c.n)}</span>${tag ? `<span class="client-tag">${esc(tag)}</span>` : ""}</div>`;
  }
  function fill(gridId, moreId, list, limit, showSuburb, moreText) {
    const grid = $(gridId), more = $(moreId);
    if (!grid) return;
    const shown = list.slice(0, limit);
    grid.innerHTML = shown.map((c) => card(c, showSuburb)).join("");
    if (more) {
      const rest = list.length - shown.length;
      more.hidden = rest <= 0;
      if (rest > 0) more.textContent = moreText(rest);
    }
  }

  // ---------- industry section ----------
  function renderIndustry() {
    const sec = $("near-you");
    if (isHome || !ind) {
      // No industry: show the suburb/region (or a Canberra sampler) in this slot instead.
      let list = uniq(clients.filter(inSub));
      let where = sub ? sub.name : "";
      if (list.length < 3 && region) { list = uniq(clients.filter(inRegion)); where = region.label; }
      if (list.length < 3) { list = uniq(clients); where = "Canberra"; }
      $("wb-ind-eyebrow").textContent = isHome ? "Flowers near you" : "Workplaces near you";
      $("wb-ind-h2").textContent = `${where === "Canberra" ? "Canberra workplaces" : "Workplaces in " + where} who use Floral Image`;
      $("wb-ind-lede").textContent = isHome
        ? `You might recognise a few of these. Our van is already in ${sub ? sub.name : "your area"} every month, so home deliveries are easy.`
        : "A few of the workplaces our team walks into every month.";
      fill("wb-ind-grid", "wb-ind-more", list.sort(byName), 18, where === "Canberra" || (region && where === region.label), (n) => `…and ${n} more across ${where}.`);
      $("neighbours").hidden = true; // avoid showing the same list twice
      return { shown: list };
    }

    const exact = uniq(clients.filter((c) => c.i === ind && inSub(c))).sort(byName);
    const regional = uniq(clients.filter((c) => c.i === ind && inRegion(c) && !inSub(c))).sort(byName);
    const canberra = uniq(clients.filter((c) => c.i === ind && !inRegion(c) && !inSub(c))).sort(byName);
    const total = exact.length + regional.length + canberra.length;
    const label = indLabel(indMeta, "label");
    const people = indLabel(indMeta, "people");
    const short = indLabel(indMeta, "short");

    $("wb-ind-eyebrow").textContent = `${label} like yours`;
    let primary, wider, widerWhere;
    if (sub && exact.length) {
      $("wb-ind-h2").textContent = `${label} in ${sub.name} who use Floral Image`;
      $("wb-ind-lede").textContent = exact.length === 1
        ? `One of your ${sub.name} neighbours already has our flowers on the front desk. Here's who, plus more ${short} nearby.`
        : `${exact.length} ${short} in ${sub.name} already have our flowers on the front desk. Here's who.`;
      primary = exact; wider = regional.concat(canberra); widerWhere = regional.length ? (region ? region.label : "Canberra") : "Canberra";
    } else if (region && regional.length) {
      $("wb-ind-h2").textContent = `${label} across ${region.label} who use Floral Image`;
      $("wb-ind-lede").textContent = regional.length === 1
        ? `One of the ${short} around ${region.label} already has our flowers. Here's who, plus more across Canberra:`
        : `${regional.length} ${short} around ${region.label} already have our flowers. A few you may know:`;
      primary = regional; wider = canberra; widerWhere = "Canberra";
    } else if (total) {
      $("wb-ind-h2").textContent = `${label} across Canberra who use Floral Image`;
      $("wb-ind-lede").textContent = `${total} ${people} across Canberra have our flowers on the desk every month. A few you may know:`;
      primary = exact.concat(regional, canberra); wider = []; widerWhere = "";
    } else {
      // Nothing in this industry yet: fall back to neighbours in the same slot.
      $("wb-ind-eyebrow").textContent = "Workplaces near you";
      const list = uniq(clients.filter(inSub)).sort(byName);
      const rlist = uniq(clients.filter(inRegion)).sort(byName);
      const use = list.length >= 3 ? list : rlist.length >= 3 ? rlist : uniq(clients).sort(byName);
      const where = use === list ? sub.name : use === rlist ? region.label : "Canberra";
      $("wb-ind-h2").textContent = `Workplaces ${where === "Canberra" ? "across" : "in"} ${where} who use Floral Image`;
      $("wb-ind-lede").textContent = "A few of the workplaces our team walks into every month.";
      fill("wb-ind-grid", "wb-ind-more", use, 18, where !== sub?.name, (n) => `…and ${n} more across ${where}.`);
      $("neighbours").hidden = true;
      return { shown: use };
    }

    fill("wb-ind-grid", "wb-ind-more", primary, 24, !(sub && primary === exact), (n) => `…and ${n} more.`);
    if (wider.length) {
      $("wb-ind-wider").hidden = false;
      $("wb-ind-wider-h3").textContent = `More ${short} across ${widerWhere}`;
      fill("wb-ind-wider-grid", "wb-ind-wider-more", wider, 12, true, (n) => `…and ${n} more ${short} across Canberra.`);
    }
    return { shown: primary.concat(wider.slice(0, 12)), counts: { exact: exact.length, regional: regional.length, total } };
  }

  // ---------- neighbours section ----------
  function renderNeighbours(alreadyShown) {
    const sec = $("neighbours");
    if (!sec || sec.hidden) return;
    const shownSet = new Set((alreadyShown || []).map((c) => c.n.toLowerCase()));
    if (!sub && !region) { sec.hidden = true; return; }
    let list = uniq(clients.filter(inSub)).filter((c) => !shownSet.has(c.n.toLowerCase())).sort(byName);
    let where = sub ? sub.name : "";
    let regional = false;
    if (list.length < 3 && region) {
      list = uniq(clients.filter(inRegion)).filter((c) => !shownSet.has(c.n.toLowerCase())).sort(byName);
      where = region.label; regional = true;
    }
    if (!list.length) { sec.hidden = true; return; }
    $("wb-nb-h2").textContent = regional ? `Around ${where}` : `Your neighbours in ${where}`;
    $("wb-nb-lede").textContent = regional
      ? `Our van is already around ${where} every month. A few of the workplaces it stops at:`
      : `Workplaces in ${where} that our van already visits every month, so adding yours is easy.`;
    fill("wb-nb-grid", "wb-nb-more", list, 18, regional, (n) => `…and ${n} more around ${where}.`);
  }

  // ---------- hero copy ----------
  function renderHero(counts) {
    const people = indLabel(indMeta, "people");
    const short = indLabel(indMeta, "short");
    const who = biz || (indMeta && sub ? `${people} in ${sub.name}` : indMeta ? `${people} in Canberra` : sub ? `workplaces in ${sub.name}` : "");
    if (who) $("wb-eyebrow").textContent = `A welcome-back offer for ${who}`;
    if (isHome) {
      $("wb-h1").innerHTML = "It's been a while.<br>Six weeks of flowers, on us.";
      $("wb-lede").textContent = `${first ? "Hi " + first + ", y" : "Y"}ou've had Floral Image at home before, and we'd love another go. Six weeks of designer flowers, delivered${sub ? " to " + sub.name : ""} and swapped for something new along the way, completely free. Keep them after that, or we collect them.`;
      $("wb-hero-secondary").textContent = "See who nearby has flowers";
      $("wb-form-lede").textContent = "Tell us where to send the flowers. We'll confirm by email and phone before we deliver.";
      return;
    }
    const bits = [];
    bits.push(`${first ? "Hi " + first + ", y" : "Y"}ou've had Floral Image before, and we'd love another go at earning ${biz ? poss(biz) : "your"} front desk.`);
    if (counts && counts.total) {
      if (sub && counts.exact) bits.push(`Today ${counts.total} ${people} across Canberra have our flowers, including ${n2w(counts.exact)} right here in ${sub.name}.`);
      else if (region && counts.regional) bits.push(`Today ${counts.total} ${people} across Canberra have our flowers, ${n2w(counts.regional)} of them around ${region.label}.`);
      else bits.push(`Today ${counts.total} ${people} across Canberra have our flowers on the desk every month.`);
    } else {
      bits.push("Today our team styles 600+ Canberra workplaces every month.");
    }
    bits.push("Come and see what's changed: six weeks of designer flowers, delivered and styled, completely free. If it's not for you, we simply collect them.");
    $("wb-lede").textContent = bits.join(" ");
    if (sub) $("wb-hero-secondary").textContent = `See who in ${sub.name} has flowers`;
    if (biz) $("wb-form-h2").textContent = `Start ${poss(biz)} free six weeks`;
    document.title = (indMeta && sub ? `${indLabel(indMeta, "label")} in ${sub.name}: ` : "") + "Six Weeks of Designer Flowers, On Us — Floral Image Canberra";
  }

  // ---------- form ----------
  function initForm() {
    if (first && !$("w-name").value) $("w-name").value = first;
    if (biz && !$("w-business").value) $("w-business").value = biz;
    if (email && !$("w-email").value) $("w-email").value = email;
    if (sub && !$("w-address").value) $("w-address").placeholder = `Street, ${sub.name}`;
    if (!(window.FI_CONFIG && window.FI_CONFIG.ENDPOINT)) $("wb-offline").hidden = false;
    if (!P.wireForm) return;
    const val = (id) => ($(id) ? $(id).value.trim() : "");
    P.wireForm($("wb-form"), document.querySelector("#wb-form .btn"), document.querySelector("#wb-form .sending"), {
      validate() {
        let ok = true;
        ok = P.fieldOk("w-name", !!val("w-name")) && ok;
        ok = P.fieldOk("w-business", !!val("w-business")) && ok;
        ok = P.fieldOk("w-email", P.validEmail(val("w-email"))) && ok;
        ok = P.fieldOk("w-phone", val("w-phone").replace(/\D/g, "").length >= 8) && ok;
        ok = P.fieldOk("w-address", val("w-address").length >= 5) && ok;
        return ok;
      },
      payload() {
        return {
          type: "winback_trial",
          name: val("w-name"),
          business: val("w-business"),
          email: val("w-email"),
          phone: val("w-phone"),
          address: val("w-address"),
          placement: val("w-placement"),
          note: val("w-note"),
          industry: ind || q.get("i") || "",
          suburb: sub ? sub.name : q.get("s") || "",
          region: region ? region.label : "",
          source: q.get("src") || (q.get("i") || q.get("s") || q.get("b") ? "winback-email" : "direct"),
          prefilled_business: biz,
        };
      },
      onSuccess() {
        const f = val("w-name").split(/\s+/)[0] || "there";
        $("wb-success-detail").textContent = `Thanks ${f}. We'll email ${val("w-email")} and give you a quick call to lock in a delivery day, and ${poss(val("w-business"))} flowers will be on the desk within the week.`;
        $("wb-success").style.display = "block";
        window.scrollTo({ top: $("trial").offsetTop - 20 });
      },
    });
  }

  function init() {
    const r = renderIndustry();
    renderNeighbours(r.shown);
    renderHero(r.counts);
    initForm();
  }

  window.FIWinback = { init, _debug: { findSuburb, SUBURBS } };
})();
