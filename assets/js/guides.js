/* Guide pages: reading progress, contents list that follows your place, copy buttons on scripts,
   and scroll-in reveals on the Guides page. */
(function () {
  "use strict";
  var bar = document.querySelector(".read-progress span");
  if (bar) {
    var onScroll = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? Math.min(100, (h.scrollTop / max) * 100) : 0) + "%";
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // contents list: mark the section currently being read
  var links = Array.prototype.slice.call(document.querySelectorAll(".toc a[href^='#']"));
  if (links.length && "IntersectionObserver" in window) {
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var heads = Array.prototype.slice.call(document.querySelectorAll(".guide-body h2[id]"));
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove("active"); });
        var a = byId[en.target.id];
        if (a) a.classList.add("active");
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    heads.forEach(function (h) { spy.observe(h); });
  }

  // copy buttons on every script
  document.querySelectorAll(".guide-body pre").forEach(function (pre) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "copy-btn"; b.textContent = "Copy";
    b.addEventListener("click", function () {
      var text = pre.querySelector("code") ? pre.querySelector("code").innerText : pre.innerText.replace(/^Copy\n?/, "");
      var done = function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () { b.textContent = "Select and copy"; });
    });
    pre.appendChild(b);
  });

  // reveals on the Guides page
  var items = document.querySelectorAll(".reveal");
  var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (still || !("IntersectionObserver" in window)) { items.forEach(function (el) { el.classList.add("in"); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { rootMargin: "0px 0px -8% 0px" });
  items.forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 90 + "ms"; io.observe(el); });
})();
