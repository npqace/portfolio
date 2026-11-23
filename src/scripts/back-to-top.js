const button = document.querySelector("#back-to-top");
const topTarget = document.querySelector(".skip, .mast, main");
const footerLinks = [...document.querySelectorAll("footer a[href]")];
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let frame = 0;
let returningToTop = false;

function overlapsFooterLink() {
  const { bottom, right } = getComputedStyle(button);
  const buttonBottom = document.documentElement.clientHeight - parseFloat(bottom);
  const buttonRight = document.documentElement.clientWidth - parseFloat(right);
  const buttonTop = buttonBottom - button.offsetHeight;
  const buttonLeft = buttonRight - button.offsetWidth;
  const clearance = 5;

  return footerLinks.some(link => {
    const rect = link.getBoundingClientRect();
    return rect.right > buttonLeft - clearance && rect.left < buttonRight + clearance &&
      rect.bottom > buttonTop - clearance && rect.top < buttonBottom + clearance;
  });
}

function update() {
  const pastThreshold = window.scrollY > 500;
  const blocked = pastThreshold && overlapsFooterLink();
  const visible = pastThreshold && !blocked;
  button.toggleAttribute("data-footer-overlap", blocked);
  button.classList.toggle("is-visible", visible);
  button.tabIndex = visible ? 0 : -1;

  if (!returningToTop || window.scrollY > 0) return;
  returningToTop = false;
  if (!topTarget.matches("a[href], [tabindex]")) topTarget.tabIndex = -1;
  topTarget.focus({ preventScroll: true });
}

function scheduleUpdate() {
  if (frame) return;
  frame = window.requestAnimationFrame(() => {
    frame = 0;
    update();
  });
}

window.addEventListener("scroll", scheduleUpdate, { passive: true });
window.addEventListener("resize", scheduleUpdate);
window.addEventListener("pageshow", scheduleUpdate);
document.addEventListener("scrollend", () => {
  update();
  returningToTop = false;
});

button.addEventListener("click", () => {
  returningToTop = true;
  window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
  scheduleUpdate();
});

update();
