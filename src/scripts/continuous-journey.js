import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const journey = document.querySelector("#continuous-journey");
const overlay = journey.querySelector(".journey-line-overlay");
const progress = overlay.querySelector(".journey-path-progress");
const tip = overlay.querySelector(".journey-path-tip");
const singleColumn = matchMedia("(width < 768px)");
const steps = [...journey.querySelectorAll("[data-journey-step]")].map(card => ({
  card,
  frame: card.querySelector(".journey-phone"),
  shell: card.parentElement,
  row: card.closest(".journey-row"),
}));
let pathStartY = 0;
let pathEndY = 0;
let totalLength = 0;
let drawFrame = 0;
let layoutFrame = 0;

function point(x, y) {
  return `${Math.round(x * 100) / 100} ${Math.round(y * 100) / 100}`;
}

function measureStep(step, bounds) {
  // The shell supplies the layout coordinates while its child animates.
  const rect = step.shell.getBoundingClientRect();
  const height = step.frame.offsetHeight;
  const top = rect.top - bounds.top;
  step.triggerY = top + height * .25;

  return {
    center: rect.left + rect.width / 2 - bounds.left,
    top,
    middle: top + height * .5,
    bottom: top + height,
    row: step.row,
    rowTop: step.shell.offsetTop,
  };
}

function layoutPath() {
  const bounds = journey.getBoundingClientRect();
  const phones = steps.map(step => measureStep(step, bounds));
  const first = phones[0];
  const last = phones.at(-1);
  let from = { x: first.center, y: first.top - 22 };
  const commands = [`M ${point(from.x, from.y)}`];
  pathStartY = from.y;

  function append(x, y, firstControl, secondControl) {
    commands.push(`C ${firstControl}, ${secondControl}, ${point(x, y)}`);
    from = { x, y };
  }

  function descend(x, y, tension = .5) {
    const bend = (y - from.y) * tension;
    append(x, y, point(from.x, from.y + bend), point(x, y - bend));
  }

  phones.forEach((phone, index) => {
    const previous = phones[index - 1];
    if (!previous || singleColumn.matches) {
      descend(phone.center, phone.middle);
    } else if (previous.row === phone.row && previous.rowTop === phone.rowTop) {
      const halfway = (from.x + phone.center) * .5;
      append(phone.center, phone.middle, point(halfway, from.y), point(halfway, phone.middle));
    } else {
      descend(previous.center, previous.bottom);
      const spineY = (previous.bottom + phone.middle) * .5;
      descend(bounds.width * .52, spineY, .55);
      descend(phone.center, phone.middle, .55);
    }
  });

  descend(last.center, last.bottom + 44);
  pathEndY = from.y;
  const path = commands.join(" ");
  const viewBox = `0 0 ${bounds.width} ${bounds.height}`;
  if (progress.getAttribute("d") === path && overlay.getAttribute("viewBox") === viewBox) return false;

  overlay.setAttribute("viewBox", viewBox);
  progress.setAttribute("d", path);
  totalLength = progress.getTotalLength();
  return true;
}

function lengthAtY(y) {
  if (y <= pathStartY) return 0;
  if (y >= pathEndY) return totalLength;

  let lower = 0;
  let upper = totalLength;
  for (let iteration = 0; iteration < 16; iteration++) {
    const midpoint = (lower + upper) / 2;
    if (progress.getPointAtLength(midpoint).y < y) lower = midpoint;
    else upper = midpoint;
  }
  return (lower + upper) / 2;
}

function drawJourney() {
  if (!journey.classList.contains("has-journey-motion") || totalLength <= 0) return;

  const bounds = journey.getBoundingClientRect();
  const targetY = Math.min(bounds.height, Math.max(0, window.innerHeight * .64 - bounds.top));
  const drawnLength = lengthAtY(targetY);
  progress.toggleAttribute("data-empty", drawnLength <= 0);
  progress.style.strokeDasharray = String(totalLength);
  progress.style.strokeDashoffset = String(totalLength - drawnLength);

  const showTip = drawnLength > 0 && drawnLength < totalLength;
  tip.toggleAttribute("data-visible", showTip);
  if (showTip) {
    const leadingPoint = progress.getPointAtLength(drawnLength);
    tip.setAttribute("cx", leadingPoint.x);
    tip.setAttribute("cy", leadingPoint.y);
  }

  steps.forEach(({ card, triggerY }) => card.classList.toggle("is-revealed", targetY >= triggerY));
}

function scheduleDraw() {
  if (drawFrame) return;
  drawFrame = requestAnimationFrame(() => {
    drawFrame = 0;
    drawJourney();
  });
}

layoutPath();

gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
  journey.classList.add("has-journey-motion");
  ScrollTrigger.create({
    trigger: journey,
    start: "top bottom",
    end: "bottom top",
    onUpdate: scheduleDraw,
    onToggle: scheduleDraw,
    onRefresh: scheduleDraw,
  });

  drawJourney();
  return () => {
    journey.classList.remove("has-journey-motion");
    progress.removeAttribute("data-empty");
    progress.style.removeProperty("stroke-dasharray");
    progress.style.removeProperty("stroke-dashoffset");
    tip.removeAttribute("data-visible");
    steps.forEach(({ card }) => card.classList.remove("is-revealed"));
  };
});

const resize = new ResizeObserver(() => {
  if (layoutFrame) return;
  layoutFrame = requestAnimationFrame(() => {
    layoutFrame = 0;
    if (layoutPath()) ScrollTrigger.refresh();
    drawJourney();
  });
});
resize.observe(journey);
steps.forEach(({ frame }) => resize.observe(frame));
