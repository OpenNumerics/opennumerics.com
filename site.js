/* ---------------------------------------------------------------------------
   Booking + engagement analytics.

   CAL_LINK is the slug from the public Cal.com share link, NOT the whole URL:

       https://cal.com/hannes-vandecasteele-ttuhej/30min
                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^  <- this part

   Every element with a `data-book` attribute becomes a booking trigger, so the
   navbar, hero, services, contact and case-study CTAs all follow from this one
   constant. Change it here and it changes everywhere.

   Events sent to GA4, all via track() so they carry a page_type of
   home / case_study / about / privacy:

     book_click        a booking CTA was pressed        (location)
     booking_completed A SLOT WAS ACTUALLY BOOKED       (method, event_type)
     email_click       a mailto: link                   (address)
     case_study_click  a results tile or project card   (link, source)
     nav_click         a navbar link                    (label)
     outbound_click    any link leaving the site        (domain, link)
     cta_click         other tagged CTAs                (location)
     section_view      a section scrolled into view     (section)
     scroll_depth      25 / 50 / 75 / 100%              (percent)
     engaged_time      15/30/60/120/300s, tab-aware     (seconds)

   How bookings are measured. The CTAs open cal.com in a new tab, so the booking
   is confirmed on a different origin and cannot report back to the page the
   visitor came from. Instead, the Cal.com event type is configured to redirect
   to /booked.html once a slot is confirmed, and that page fires
   `booking_completed`. So:

     book_click        counts calendar opens, i.e. intent. Overcounts.
     booking_completed counts actual bookings. THIS is the conversion.

   Required Cal.com setup, or booking_completed never fires:
     Event type -> Advanced -> "Redirect on booking" ->
       https://opennumerics.com/booked.html

   Mark ONLY booking_completed as a GA4 key event: Admin -> Data display ->
   Events -> Recent events tab -> find it -> star it. It only appears there
   after firing once, so make a test booking first and then cancel it.

   Note: analytics only runs after a visitor accepts the consent banner (see
   consent.js), so these numbers undercount real traffic. Fine for comparing
   periods and funnel steps to each other; not a true visitor count.
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
   Engagement wiring
--------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  trackBookingCompleted();
  initBookingCtas();
  initLinkTracking();
  initSectionViews();
  initScrollDepth();
  initEngagedTime();
});

/* The conversion ------------------------------------------------------------
   Cal.com redirects here after a slot is confirmed. The booking uid (when
   Cal.com is set to forward parameters) is lifted out of the query string by an
   inline script in booked.html before analytics loads, and is used here only to
   keep a refresh or a back-button from counting the same booking twice. */
function trackBookingCompleted() {
  if (document.body.dataset.page !== "booked") return;

  const booking = window.__booking || {};
  const key = "booked:" + (booking.uid || "nouid");

  try {
    if (sessionStorage.getItem(key)) return;   /* already counted this one */
    sessionStorage.setItem(key, "1");
  } catch (e) {
    /* Private mode: fire anyway. Better a possible duplicate than a lost
       conversion, since this is the only booking signal we get. */
  }

  track("booking_completed", {
    method: "cal.com",
    event_type: booking.slug || "unknown"
  });
}

/* Booking CTAs -------------------------------------------------------------- */
function initBookingCtas() {
  document.querySelectorAll("[data-book]").forEach((el) => {
    /* New tab, so the visitor keeps this page open behind the booking flow.
       rel="noopener" stops the opened tab from touching window.opener. */
    el.setAttribute("href", `https://cal.com/${CAL_LINK}`);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener");

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
