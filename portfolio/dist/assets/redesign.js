const screenIndex = document.querySelector(".screen-index");
const tabs = [...screenIndex.querySelectorAll("a")];
const groups = tabs.map(tab => document.querySelector(tab.hash));
screenIndex.setAttribute("role", "tablist");
tabs.forEach((tab, index) => {
  tab.id = "tab-" + groups[index].id;
  tab.setAttribute("role", "tab");
  tab.setAttribute("aria-controls", groups[index].id);
  groups[index].setAttribute("role", "tabpanel");
  groups[index].setAttribute("aria-labelledby", tab.id);
});

function selectTab(index) {
  tabs.forEach((tab, i) => {
    tab.setAttribute("aria-selected", String(index === i));
    tab.tabIndex = index === i ? 0 : -1;
    groups[i].hidden = index !== i;
  });
}

function syncLocation(event) {
  const index = tabs.findIndex(tab => tab.hash === location.hash);
  if (index < 0) return;
  const wasHidden = groups[index].hidden;
  selectTab(index);
  // The browser cannot scroll to a hidden gallery chapter during fragment navigation.
  if (event && wasHidden) groups[index].scrollIntoView();
}

function activateTab(index) {
  selectTab(index);
  history.replaceState(null, "", tabs[index].hash);
}

selectTab(0);
syncLocation();
window.addEventListener("hashchange", syncLocation);
tabs.forEach((tab, index) => {
  tab.addEventListener("click", event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    activateTab(index);
  });
  tab.addEventListener("keydown", event => {
    const destinations = { ArrowLeft: (index + tabs.length - 1) % tabs.length,
      ArrowRight: (index + 1) % tabs.length, Home: 0, End: tabs.length - 1 };
    if (!(event.key in destinations)) return;
    event.preventDefault();
    const next = destinations[event.key];
    tabs[next].focus();
    activateTab(next);
  });
});

const viewer = document.querySelector(".art-viewer");
if (typeof viewer.showModal === "function") {
  const image = viewer.querySelector("img");
  const vector = viewer.querySelector("object");
  const title = viewer.querySelector("#viewer-title");
  const original = viewer.querySelector(".viewer-original");
  document.querySelectorAll("[data-enlarge]").forEach(link => {
    link.addEventListener("click", event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const caption = link.closest("figure")?.querySelector("figcaption");
      const label = caption?.querySelector("h3")?.textContent || caption?.textContent
        || link.getAttribute("aria-label").replace(/^Enlarge (the )?/i, "");
      title.textContent = label.charAt(0).toUpperCase() + label.slice(1);
      const isVector = link.pathname.endsWith(".svg");
      original.href = link.href;
      original.textContent = isVector ? "Open full-size SVG" : "Open image at full size";
      image.hidden = isVector;
      vector.hidden = !isVector;
      if (isVector) {
        vector.setAttribute("aria-label", title.textContent);
        vector.data = link.href;
      } else {
        image.alt = link.querySelector("img").alt;
        image.src = link.href;
      }
      viewer.showModal();
    });
  });
  viewer.querySelector("button").addEventListener("click", () => viewer.close());
  viewer.addEventListener("close", () => vector.removeAttribute("data"));
  viewer.addEventListener("click", event => {
    if (event.target !== viewer) return;
    const r = viewer.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) viewer.close();
  });
}
