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
      const label = caption?.querySelector("h4")?.textContent || caption?.textContent
        || (link.getAttribute("aria-label") || link.textContent).trim().replace(/^Enlarge[: ]+(the )?/i, "");
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
