/* Home page: the screen tour tabs (click, or arrow keys once a tab has focus). */
(function () {
  "use strict";
  var list = document.querySelector(".tabs[role=tablist]");
  if (!list) return;
  var tabs = Array.prototype.slice.call(list.querySelectorAll("[role=tab]"));

  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
  }

  list.addEventListener("click", function (e) {
    var tab = e.target.closest("[role=tab]");
    if (tab) select(tab, false);
  });
  list.addEventListener("keydown", function (e) {
    var i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    var next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    select(tabs[(next + tabs.length) % tabs.length], true);
  });
})();
