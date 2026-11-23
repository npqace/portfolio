const deck = document.querySelector(".portrait-deck");
const field = deck.closest(".portrait-field");
const pointer = field.querySelector(".selection-pointer");
const description = document.querySelector("#portrait-description");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
let front = deck.querySelector('[data-position="front"]');
let back = deck.querySelector('[data-position="back"]');
let drag = null;
let suppressClick = false;

// Keep the first portrait readable while the other image decodes.
const pictures = [...deck.querySelectorAll("img")];
Promise.allSettled(pictures.map(image => image.decode())).then(results => {
  deck.disabled = results.some(result => result.status === "rejected");
});

function stopCardAnimations() {
  for (const card of [front, back]) {
    card.getAnimations().forEach(animation => animation.cancel());
  }
}

function pose(x, y, angle) {
  return `translate(${x}px, ${y}px) rotate(${angle}deg)`;
}

function turnPhoto(x = 0, y = 0, direction = 1) {
  const previous = front;
  const lifted = getComputedStyle(previous).transform;
  const underneath = getComputedStyle(back).transform;
  stopCardAnimations();
  front = back;
  back = previous;
  front.dataset.position = "front";
  front.removeAttribute("aria-hidden");
  back.dataset.position = "back";
  back.setAttribute("aria-hidden", "true");
  back.style.removeProperty("transform");
  description.textContent = front.querySelector("img").alt;
  if (reduceMotion.matches) return;

  const reach = Math.min(deck.clientWidth * .28, 115);
  const outward = pose(x + direction * reach, y - 12, direction * 10);
  const resting = getComputedStyle(back).transform;
  const timing = { duration: 390, easing: "cubic-bezier(.22,.68,.22,1)" };
  back.animate([
    { transform: lifted, zIndex: 3 },
    { transform: outward, zIndex: 3, offset: .43 },
    { transform: outward, zIndex: 0, offset: .44 },
    { transform: resting, zIndex: 0 }
  ], timing);
  front.animate([{ transform: underneath }, { transform: "none" }], timing);
}

function endDrag() {
  const id = drag.id;
  drag = null;
  deck.classList.remove("is-dragging");
  if (deck.hasPointerCapture(id)) deck.releasePointerCapture(id);
}

function settlePhoto() {
  const start = getComputedStyle(front).transform;
  front.style.removeProperty("transform");
  if (!reduceMotion.matches && start !== "none") {
    front.animate([{ transform: start }, { transform: "none" }], { duration: 230, easing: "ease-out" });
  }
}

deck.addEventListener("pointerdown", event => {
  if (deck.disabled || !event.isPrimary || event.button !== 0 || drag) return;
  stopCardAnimations();
  suppressClick = false;
  drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x: 0, y: 0, moved: false };
  deck.setPointerCapture(event.pointerId);
});

deck.addEventListener("pointermove", event => {
  if (!drag || event.pointerId !== drag.id) return;
  const x = event.clientX - drag.startX;
  const y = event.clientY - drag.startY;
  if (!drag.moved && Math.hypot(x, y) < 6) return;
  drag.moved = true;
  deck.classList.add("is-dragging");
  // Limit the reach while keeping the card directly under the pointer for short pulls.
  const reach = deck.clientWidth * .65;
  drag.x = Math.max(-reach, Math.min(reach, x));
  drag.y = Math.max(-reach, Math.min(reach, y));
  const tilt = reduceMotion.matches ? 0 : drag.x / reach * 10;
  front.style.transform = pose(drag.x, drag.y, tilt);
});

deck.addEventListener("pointerup", event => {
  if (!drag || drag.id !== event.pointerId) return;
  const { x, y, moved } = drag;
  endDrag();
  if (!moved) return; // A tap or click activates the button normally.
  suppressClick = true;
  if (Math.hypot(x, y) >= Math.min(55, deck.clientWidth * .15)) {
    turnPhoto(x, y, Math.sign(x) || 1);
  } else {
    settlePhoto();
  }
});

function cancelDrag(event) {
  if (!drag || drag.id !== event.pointerId) return;
  endDrag();
  suppressClick = true;
  settlePhoto();
}
deck.addEventListener("pointercancel", cancelDrag);
deck.addEventListener("lostpointercapture", cancelDrag);
deck.addEventListener("click", event => {
  if (!drag && (!suppressClick || event.detail === 0)) turnPhoto();
  suppressClick = false;
});
deck.addEventListener("keydown", event => {
  if (drag || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  if (!event.repeat) turnPhoto(0, 0, event.key === "ArrowLeft" ? -1 : 1);
});

function resetPointer() {
  pointer.style.removeProperty("--cursor-x");
  pointer.style.removeProperty("--cursor-y");
}
field.addEventListener("pointermove", event => {
  if (drag || reduceMotion.matches || !finePointer.matches || event.pointerType === "touch") return;
  const bounds = field.getBoundingClientRect();
  pointer.style.setProperty("--cursor-x", ((event.clientX - bounds.left) / bounds.width - .5) * 22 + "px");
  pointer.style.setProperty("--cursor-y", ((event.clientY - bounds.top) / bounds.height - .5) * 16 + "px");
});
field.addEventListener("pointerleave", resetPointer);
reduceMotion.addEventListener("change", () => {
  resetPointer();
  stopCardAnimations();
});
