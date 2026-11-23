const motion = matchMedia("(prefers-reduced-motion: no-preference)");

if (motion.matches && "IntersectionObserver" in window) {
  const targets = [...document.querySelectorAll("[data-reveal]")];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting, intersectionRatio }) => {
      if (!isIntersecting || intersectionRatio < 0.2) return;
      target.dataset.motion = "revealed";
      observer.unobserve(target);
    });
  }, { threshold: 0.2 });

  targets.forEach(target => {
    observer.observe(target);
    target.dataset.motion = "pending";
    target.addEventListener("focusin", () => {
      observer.unobserve(target);
      delete target.dataset.motion;
    }, { once: true });
  });

  motion.addEventListener("change", ({ matches }) => {
    if (matches) return;
    observer.disconnect();
    targets.forEach(target => delete target.dataset.motion);
  });
}
