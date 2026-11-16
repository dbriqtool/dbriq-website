/* Home page: screen tour tabs, scroll-in reveals and counting numbers. */
(function () {
  "use strict";
  // ---- tour tabs (click, or arrow keys once a tab has focus) ----
  var list = document.querySelector(".tabs[role=tablist]");
  if (list) {
    var tabs = Array.prototype.slice.call(list.querySelectorAll("[role=tab]"));
    var select = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) tab.focus();
    };
    list.addEventListener("click", function (e) { var t = e.target.closest("[role=tab]"); if (t) select(t, false); });
    list.addEventListener("keydown", function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      select(tabs[(next + tabs.length) % tabs.length], true);
    });
  }

  var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var items = document.querySelectorAll(".reveal");
  var counters = document.querySelectorAll("[data-count]");
  if (still || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("in"); });
    return;
  }
  // ---- reveal sections as they scroll into view ----
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      io.unobserve(en.target);
    });
  }, { rootMargin: "0px 0px -8% 0px" });
  items.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 80 + "ms"; io.observe(el); });

  // ---- count numbers up once they are visible ----
  var co = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      co.unobserve(en.target);
      var el = en.target, end = Number(el.getAttribute("data-count")), t0 = null;
      if (!end) return;
      var step = function (t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / 1200, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  });
  counters.forEach(function (el) { co.observe(el); });
})();
