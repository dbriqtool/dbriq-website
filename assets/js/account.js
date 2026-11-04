/* account.html: sign in, create an account, forgotten password and choosing a new password. */
(function () {
  "use strict";
  var auth = window.dbriqAuth;
  var sb = auth.client;
  var params = new URLSearchParams(window.location.search);
  var NEXT = "/download.html";

  var forms = {
    signin: document.getElementById("form-signin"),
    signup: document.getElementById("form-signup"),
    forgot: document.getElementById("form-forgot"),
    reset: document.getElementById("form-reset")
  };
  var TEXT = {
    signin: ["Sign in", "Sign in to download the dbriq beta."],
    signup: ["Create your account", "Free during the beta. You'll confirm your email, then download."],
    forgot: ["Reset your password", "Enter the email you signed up with and we'll send you a link."],
    reset: ["Choose a new password", "Use at least 12 characters."]
  };
  var msgBox = document.querySelector("[data-msg]");
  var switcher = document.querySelector("[data-switch]");
  var title = document.querySelector("[data-title]");
  var subtitle = document.querySelector("[data-subtitle]");

  function say(kind, text, action) {
    msgBox.className = "msg " + kind;
    msgBox.textContent = text;
    if (action) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "linkish"; b.style.marginLeft = ".4rem";
      b.textContent = action.label;
      b.addEventListener("click", action.run);
      msgBox.appendChild(b);
    }
  }
  function clear() { msgBox.className = "msg"; msgBox.textContent = ""; }

  function setMode(mode, keepMessage) {
    Object.keys(forms).forEach(function (k) { forms[k].hidden = k !== mode; });
    var tabbed = mode === "signin" || mode === "signup";
    switcher.hidden = !tabbed;
    switcher.querySelectorAll("[role=tab]").forEach(function (t) {
      var on = t.getAttribute("data-mode") === mode;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
    });
    title.textContent = TEXT[mode][0];
    subtitle.textContent = TEXT[mode][1];
    document.title = TEXT[mode][0] + " | dbriq";
    if (!keepMessage) clear();
    var first = forms[mode].querySelector("input");
    if (first && document.activeElement && document.activeElement !== document.body) first.focus();
  }

  function busy(form, on) {
    var b = form.querySelector("button[type=submit]");
    b.disabled = on;
    if (on) { b.dataset.label = b.textContent; b.textContent = "Please wait…"; }
    else if (b.dataset.label) { b.textContent = b.dataset.label; }
  }

  function friendly(error) {
    var m = (error && error.message) || "";
    if (/invalid login credentials/i.test(m)) return "That email and password don't match an account. Check them, or reset your password.";
    if (/email not confirmed/i.test(m)) return "Confirm your email first: open the link we sent when you created the account.";
    if (/already registered|already exists/i.test(m)) return "An account with this email already exists. Sign in instead.";
    if (/rate limit|too many/i.test(m)) return "Too many attempts. Wait a few minutes, then try again.";
    if (/password/i.test(m) && /(short|least|weak)/i.test(m)) return "Choose a longer password: at least 12 characters.";
    if (/failed to fetch|network/i.test(m)) return "Couldn't reach the sign-in service. Check your connection and try again.";
    return m || "Something went wrong. Try again, or email support@dbriq.com.";
  }

  function emailOk(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  // ---- tabs ----
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-mode]");
    if (t && !t.closest("[data-msg]")) setMode(t.getAttribute("data-mode"));
  });
  switcher.addEventListener("keydown", function (e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    var other = switcher.querySelector('[aria-selected="false"]');
    setMode(other.getAttribute("data-mode"));
    other.focus();
  });

  if (!sb) {
    setMode(params.get("mode") === "signup" ? "signup" : "signin");
    say("error", auth.notConfigured);
    Object.keys(forms).forEach(function (k) { forms[k].querySelector("button[type=submit]").disabled = true; });
    return;
  }

  // ---- start: a password-reset link lands here with type=recovery ----
  var recovering = params.get("mode") === "reset" || /type=recovery/.test(window.location.hash);
  setMode(recovering ? "reset" : (params.get("mode") === "signup" ? "signup" : "signin"));

  if (params.get("link") === "expired") {
    say("error", "That confirmation link has expired or was already used. Sign in, and we'll offer to send a new one.");
  }

  sb.auth.onAuthStateChange(function (event) {
    if (event === "PASSWORD_RECOVERY") { recovering = true; setMode("reset"); }
  });
  sb.auth.getSession().then(function (r) {
    if (r.data.session && !recovering) window.location.replace(NEXT);
    if (!r.data.session && recovering && !/access_token/.test(window.location.hash)) {
      setMode("forgot");
      say("error", "That reset link has expired or was already used. Ask for a new one.");
    }
  });

  // ---- sign in ----
  forms.signin.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = forms.signin.email.value.trim(), password = forms.signin.password.value;
    if (!emailOk(email) || !password) { say("error", "Enter your email and password."); return; }
    busy(forms.signin, true); clear();
    sb.auth.signInWithPassword({ email: email, password: password }).then(function (r) {
      if (r.error) {
        var unconfirmed = /email not confirmed/i.test(r.error.message || "");
        say("error", friendly(r.error), unconfirmed ? { label: "Send the email again", run: function () { resend(email); } } : null);
        return;
      }
      window.location.replace(NEXT);
    }).finally(function () { busy(forms.signin, false); });
  });

  function resend(email) {
    sb.auth.resend({ type: "signup", email: email, options: { emailRedirectTo: auth.origin + NEXT } }).then(function (r) {
      if (r.error) say("error", friendly(r.error));
      else say("ok", "Sent. Check your inbox at " + email + ", and the spam folder if it isn't there in a minute.");
    });
  }

  // ---- create account ----
  forms.signup.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = forms.signup;
    var name = f.name.value.trim(), email = f.email.value.trim(), role = f.role.value, password = f.password.value;
    if (!name) { say("error", "Enter your name."); f.name.focus(); return; }
    if (!emailOk(email)) { say("error", "Enter a valid email address."); f.email.focus(); return; }
    if (!role) { say("error", "Choose your role."); f.role.focus(); return; }
    if (password.length < 12) { say("error", "Choose a password of at least 12 characters."); f.password.focus(); return; }
    if (!f.terms.checked) { say("error", "Tick the box to agree to the beta terms and privacy policy."); f.terms.focus(); return; }

    busy(f, true); clear();
    sb.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: auth.origin + NEXT,
        data: {
          full_name: name,
          company: f.company.value.trim(),
          role: role,
          beta_updates: f.updates.checked,
          terms_accepted_at: new Date().toISOString()
        }
      }
    }).then(function (r) {
      if (r.error) { say("error", friendly(r.error)); return; }
      // With email confirmation on, an existing address comes back as a user with no identities.
      if (r.data.user && r.data.user.identities && r.data.user.identities.length === 0) {
        say("error", "An account with this email already exists. Sign in instead.");
        setMode("signin", true); forms.signin.email.value = email; return;
      }
      if (r.data.session) { window.location.replace(NEXT); return; }
      setMode("signin", true);
      forms.signin.email.value = email;
      say("ok", "Almost done. We sent a confirmation link to " + email + ". Open it to confirm your account, then download dbriq.");
    }).finally(function () { busy(f, false); });
  });

  // ---- forgot password ----
  forms.forgot.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = forms.forgot.email.value.trim();
    if (!emailOk(email)) { say("error", "Enter a valid email address."); return; }
    busy(forms.forgot, true); clear();
    sb.auth.resetPasswordForEmail(email, { redirectTo: auth.origin + "/account.html?mode=reset" }).then(function (r) {
      if (r.error && /rate limit|too many/i.test(r.error.message || "")) { say("error", friendly(r.error)); return; }
      say("ok", "If there's an account for " + email + ", a link to reset the password is on its way. It works once and expires after an hour.");
    }).finally(function () { busy(forms.forgot, false); });
  });

  // ---- new password ----
  forms.reset.addEventListener("submit", function (e) {
    e.preventDefault();
    var password = forms.reset.password.value;
    if (password.length < 12) { say("error", "Choose a password of at least 12 characters."); return; }
    busy(forms.reset, true); clear();
    sb.auth.updateUser({ password: password }).then(function (r) {
      if (r.error) { say("error", friendly(r.error)); return; }
      say("ok", "Password saved. Taking you to the download…");
      setTimeout(function () { window.location.replace(NEXT); }, 1200);
    }).finally(function () { busy(forms.reset, false); });
  });
})();
