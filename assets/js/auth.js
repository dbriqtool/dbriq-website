/* Shared by every page: the Supabase client, the header's signed-in state, and Sign out. */
(function () {
  "use strict";
  var cfg = window.DBRIQ || {};
  var configured = !!(cfg.supabaseUrl && cfg.supabaseAnonKey &&
    cfg.supabaseUrl.indexOf("YOUR-PROJECT") === -1 && cfg.supabaseAnonKey.indexOf("YOUR-ANON-KEY") === -1);

  var client = null;
  if (configured && window.supabase) {
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" }
    });
  }

  function setNav(session) {
    document.querySelectorAll("[data-auth-nav] [data-when]").forEach(function (el) {
      el.hidden = (el.getAttribute("data-when") === "in") !== !!session;
    });
    document.querySelectorAll("[data-user-email]").forEach(function (el) {
      el.textContent = session ? session.user.email : "";
    });
  }

  window.dbriqAuth = {
    client: client,
    configured: configured,
    origin: window.location.origin,
    notConfigured: "Accounts aren't connected yet. Add your Supabase project URL and anon key in assets/js/config.js."
  };

  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  if (client) {
    client.auth.getSession().then(function (r) { setNav(r.data.session); });
    client.auth.onAuthStateChange(function (_event, session) { setNav(session); });
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-sign-out]");
    if (!btn || !client) return;
    btn.disabled = true;
    client.auth.signOut().finally(function () { window.location.href = "/"; });
  });
})();
