/* download.html: only for signed-in users. The installer sits in a private Supabase Storage bucket;
   each click creates a link that works for two minutes, and the download is recorded. */
(function () {
  "use strict";
  var auth = window.dbriqAuth;
  var sb = auth.client;
  var beta = (window.DBRIQ || {}).beta || {};
  var loading = document.querySelector("[data-loading]");
  var ready = document.querySelector("[data-ready]");
  var msgBox = document.querySelector("[data-msg]");
  var button = document.querySelector("[data-download]");

  function say(kind, text, link) {
    msgBox.className = "msg " + kind;
    msgBox.textContent = text;
    if (link) {
      var a = document.createElement("a");
      a.href = link.href; a.textContent = link.label; a.style.color = "inherit"; a.style.marginLeft = ".3rem";
      msgBox.appendChild(a);
    }
  }

  if (!sb) {
    loading.innerHTML = "";
    var p = document.createElement("p");
    p.className = "msg error"; p.textContent = auth.notConfigured;
    loading.appendChild(p);
    return;
  }

  var linkError = /error_code=|error=/.test(window.location.hash);

  sb.auth.getSession().then(function (r) {
    var session = r.data.session;
    if (!session) {
      window.location.replace("/account.html" + (linkError ? "?link=expired" : ""));
      return;
    }
    if (window.location.hash) history.replaceState(null, "", window.location.pathname);

    document.querySelector("[data-version]").textContent = beta.version || "Beta";
    document.querySelector("[data-released]").textContent = beta.released || "";
    document.querySelector("[data-size]").textContent = "Windows installer" + (beta.size ? ", " + beta.size : "");
    if (beta.sha256) {
      document.querySelector("[data-checksum]").textContent = beta.sha256;
      document.querySelector("[data-checksum-row]").hidden = false;
    }
        document.querySelectorAll("[data-exe-name]").forEach(function (el) {
      el.textContent = (beta.file || "dbriqSetup.exe").replace(/\.zip$/i, ".exe");
    });
     var name = session.user.user_metadata && session.user.user_metadata.full_name;
    if (name) document.querySelector("h1").textContent = "Welcome, " + name.split(" ")[0] + ". Here's the beta.";
    loading.hidden = true;
    ready.hidden = false;
  });

  button.addEventListener("click", function () {
    button.disabled = true;
    var label = button.textContent;
    button.textContent = "Preparing your download…";
    sb.storage.from(beta.bucket || "beta")
      .createSignedUrl(beta.file, 120, { download: beta.downloadName || "dbriqSetup.exe" })
      .then(function (r) {
        if (r.error || !r.data) {
          console.error("dbriq download:", r.error);
          say("error", "The download isn't available right now. Try again in a minute, or email support@dbriq.com.");
          return;
        }
        // Record the download; never let a logging problem block it.
        return sb.from("downloads").insert({ version: beta.version || "" })
          .then(function () {}, function () {})
          .then(function () {
            window.location.href = r.data.signedUrl;
            say("ok", "Your download has started. If it hasn't,", { href: r.data.signedUrl, label: "download it here." });
          });
      })
      .finally(function () { button.disabled = false; button.textContent = label; });
  });
})();
