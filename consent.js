/* ---------------------------------------------------------------------------
   Cookie consent + GA4 bootstrap.

   Loaded synchronously in <head> on every page, BEFORE anything measures
   anything. It owns the whole analytics lifecycle:

     - defines gtag()/dataLayer so site.js can always call track() safely
     - sets Consent Mode v2 defaults to denied
     - loads Google Analytics only after an explicit accept

   Nothing is requested from Google until consent is granted — not a cookieless
   ping, not the tag script itself. That is stricter than Consent Mode alone
   requires, and it is the easiest position to defend.
--------------------------------------------------------------------------- */
const GA_ID = "G-HYR12B0NWT";
const CONSENT_KEY = "on-consent";       // "granted" | "denied"

window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }

/* Deny everything until told otherwise. */
gtag("consent", "default", {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
  wait_for_update: 500
});

function readConsent() {
  try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
}

function writeConsent(value) {
  try { localStorage.setItem(CONSENT_KEY, value); } catch (e) { /* private mode */ }
}

/* Inject the GA tag. Only ever called once, and only after a grant. */
let gaLoaded = false;
function loadAnalytics() {
  if (gaLoaded) return;
  gaLoaded = true;

  gtag("consent", "update", { analytics_storage: "granted" });

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);

  gtag("js", new Date());
  gtag("config", GA_ID);
}

/* A returning visitor who already accepted shouldn't be asked again. */
if (readConsent() === "granted") loadAnalytics();

/* ---------------------------------------------------------------------------
   Banner

   A bottom bar rather than a full-screen modal: this is a B2B site whose whole
   purpose is getting someone to a booking CTA, and a blocking overlay is a
   conversion tax paid on every single visit.
--------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  if (readConsent()) return;   // already decided, either way

  const banner = document.createElement("div");
  banner.className = "consent";
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-label", "Cookie consent");
  banner.innerHTML = `
    <p class="consent__text">
      We'd like to use Google Analytics to see which parts of this site are
      actually useful. No advertising, and no tracking you across other sites.
      <a href="/privacy.html">How we handle data</a>.
    </p>
    <div class="consent__actions">
      <button type="button" class="btn btn--ghost btn--sm" data-consent="denied">Decline</button>
      <button type="button" class="btn btn--primary btn--sm" data-consent="granted">Accept</button>
    </div>
  `;

  banner.addEventListener("click", (e) => {
    const choice = e.target.dataset && e.target.dataset.consent;
    if (!choice) return;

    writeConsent(choice);
    if (choice === "granted") loadAnalytics();
    banner.remove();
  });

  document.body.appendChild(banner);
});
