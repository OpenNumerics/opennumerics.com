/* ---------------------------------------------------------------------------
   Booking + engagement analytics.

   CAL_LINK is the slug from the public Cal.com share link, NOT the whole URL:

       https://cal.com/hannes-vandecasteele-ttuhej/30min
                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^  <- this part

   Every element with a `data-book` attribute becomes a booking trigger, so the
   navbar, hero, services, contact and case-study CTAs all follow from this one
   constant. Change it here and it changes everywhere.

   Events sent to GA4 are listed in README.md. `booking_completed` is the one
   that matters — mark it as a key event in the GA4 admin.
--------------------------------------------------------------------------- */
const CAL_LINK = "hannes-vandecasteele-ttuhej/30min";

/* Coarse page classification so every event can be split home vs case study
   without relying on URL parsing in the GA4 UI. */
const PAGE_TYPE = document.body.dataset.page
  || (location.pathname.startsWith("/solutions/") ? "case_study" : "home");

/* Safe wrapper: gtag may be blocked by an ad blocker or still loading. */
function track(name, params) {
  if (typeof gtag !== "function") return;
  gtag("event", name, Object.assign({ page_type: PAGE_TYPE }, params || {}));
}

/* ---------------------------------------------------------------------------
   Cal.com embed loader (official snippet, unmodified)
--------------------------------------------------------------------------- */
(function (C, A, L) {
  let p = function (a, ar) { a.q.push(ar); };
  let d = C.document;
  C.Cal = C.Cal || function () {
    let cal = C.Cal;
    let ar = arguments;
    if (!cal.loaded) {
      cal.ns = {};
      cal.q = cal.q || [];
      d.head.appendChild(d.createElement("script")).src = A;
      cal.loaded = true;
    }
    if (ar[0] === L) {
      const api = function () { p(api, arguments); };
      const namespace = ar[1];
      api.q = api.q || [];
      if (typeof namespace === "string") {
        cal.ns[namespace] = cal.ns[namespace] || api;
        p(cal.ns[namespace], ar);
        p(cal, ["initNamespace", namespace]);
      } else {
        p(cal, ar);
      }
      return;
    }
    p(cal, ar);
  };
})(window, "https://app.cal.com/embed/embed.js", "init");

Cal("init", { origin: "https://cal.com" });

Cal("ui", {
  hideEventTypeDetails: false,
  layout: "month_view",
  cssVarsPerTheme: { light: { "cal-brand": "#3f928a" } }
});

/* The booking funnel, in three steps:
     book_click        someone pressed a CTA
     booking_started   the calendar actually rendered
     booking_completed a slot was taken            <- the real conversion

   Tracking only the click would tell you how persuasive the button is, not how
   many calls you got. The gap between the three is where you debug. */
Cal("on", {
  action: "linkReady",
  callback: function () { track("booking_started", { method: "cal.com" }); }
});

Cal("on", {
  action: "linkFailed",
  callback: function () { track("booking_error", { method: "cal.com" }); }
});

Cal("on", {
  action: "bookingSuccessful",
  callback: function () { track("booking_completed", { method: "cal.com" }); }
});

/* ---------------------------------------------------------------------------
   Engagement wiring
--------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initBookingCtas();
  initLinkTracking();
  initSectionViews();
  initScrollDepth();
  initEngagedTime();
});

/* Booking CTAs -------------------------------------------------------------- */
function initBookingCtas() {
  document.querySelectorAll("[data-book]").forEach((el) => {
    /* A real href so the CTA still works if the embed script is blocked, and
       so the link stays crawlable and right-clickable. */
    el.setAttribute("href", `https://cal.com/${CAL_LINK}`);
    el.setAttribute("data-cal-link", CAL_LINK);
    el.setAttribute("data-cal-config", '{"layout":"month_view"}');

    el.addEventListener("click", () => {
      track("book_click", { location: el.dataset.cta || "unknown" });
    });
  });
}

/* Every other click worth knowing about ------------------------------------- */
function initLinkTracking() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a || a.hasAttribute("data-book")) return;

    const href = a.getAttribute("href") || "";

    /* Email — the secondary conversion path. */
    if (href.startsWith("mailto:")) {
      track("email_click", { address: href.replace("mailto:", "") });
      return;
    }

    /* Case-study cards (rendered by experience.js) and the results tiles. */
    if (a.closest("#projects-grid") || a.classList.contains("metric")) {
      track("case_study_click", {
        link: href,
        source: a.classList.contains("metric") ? "results_tile" : "project_grid"
      });
      return;
    }

    /* Navbar. */
    if (a.closest(".nav__links")) {
      track("nav_click", { label: a.textContent.trim() });
      return;
    }

    /* Anything leaving the site. */
    if (/^https?:\/\//i.test(href) && !href.includes(location.host)) {
      let domain = href;
      try { domain = new URL(href).hostname; } catch (err) { /* keep raw href */ }
      track("outbound_click", { domain: domain, link: href });
      return;
    }

    /* Explicitly tagged CTAs that aren't covered above (e.g. "Explore our
       work", "Back to our Solutions"). */
    if (a.dataset.cta) {
      track("cta_click", { location: a.dataset.cta });
    }
  });
}

/* Which sections visitors actually reach ------------------------------------
   More useful than raw scroll depth on a restructured page: it tells you
   whether the services block is being seen at all, and where people stop. */
function initSectionViews() {
  const sections = document.querySelectorAll("section[id]");
  if (!sections.length || !("IntersectionObserver" in window)) return;

  const seen = new Set();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      if (seen.has(id)) return;
      seen.add(id);
      track("section_view", { section: id });
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.4 });

  sections.forEach((s) => observer.observe(s));
}

/* Scroll depth --------------------------------------------------------------
   GA4 enhanced measurement only reports a single 90% event. These thresholds
   show where visitors actually stop. */
function initScrollDepth() {
  const thresholds = [25, 50, 75, 100];
  const fired = new Set();

  const onScroll = () => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;

    const pct = (window.scrollY / scrollable) * 100;
    thresholds.forEach((t) => {
      if (pct >= t && !fired.has(t)) {
        fired.add(t);
        track("scroll_depth", { percent: t });
      }
    });

    if (fired.size === thresholds.length) {
      window.removeEventListener("scroll", onScroll);
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* Engaged time --------------------------------------------------------------
   Milestones only, and paused when the tab is hidden — so a page left open in
   a background tab doesn't read as a fascinated visitor. */
function initEngagedTime() {
  const milestones = [15, 30, 60, 120, 300];
  let elapsed = 0;
  let index = 0;
  let timer = null;

  const tick = () => {
    elapsed += 5;
    while (index < milestones.length && elapsed >= milestones[index]) {
      track("engaged_time", { seconds: milestones[index] });
      index++;
    }
    if (index >= milestones.length) stop();
  };

  const start = () => { if (!timer) timer = setInterval(tick, 5000); };
  const stop = () => { clearInterval(timer); timer = null; };

  document.addEventListener("visibilitychange", () => {
    document.hidden ? stop() : start();
  });

  if (!document.hidden) start();
}
