// Site-wide behavior: mobile menu and header border. No scroll animations (docs/DESIGN_AUDIT.md).
(function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  var header = document.querySelector(".site-header");

  if (toggle && nav) {
    var label = toggle.querySelector(".nav-toggle-label");
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      if (label) label.textContent = open ? "Close" : "Menu";
    };
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    window.matchMedia("(min-width: 56em)").addEventListener("change", function (mq) {
      if (mq.matches) setOpen(false);
    });
  }

  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

})();
