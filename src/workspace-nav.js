/** Hash-addressable, accessible top-level workspace navigation. */
export function initWorkspaceNav(doc = document, win = window) {
  const tabs = [...doc.querySelectorAll(".workspace-tab[data-page]")];
  const known = new Set(tabs.map(tab => tab.dataset.page));
  if (!tabs.length) return;
  const select = (name, syncHash = true) => {
    const id = known.has(name) ? name : "portrait-lab";
    for (const tab of tabs) {
      const selected = tab.dataset.page === id;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      const page = doc.getElementById(tab.dataset.page);
      if (page) page.hidden = !selected;
    }
    if (syncHash && win.location.hash !== "#"+id) {
      win.history.replaceState(null, "", "#"+id);
    }
  };
  tabs.forEach((tab,index) => {
    tab.addEventListener("click", () => select(tab.dataset.page));
    tab.addEventListener("keydown", event => {
      const direction = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
      if (!direction && !["Home","End"].includes(event.key)) return;
      event.preventDefault();
      const target = event.key === "Home" ? 0 : event.key === "End" ? tabs.length-1 : (index+direction+tabs.length)%tabs.length;
      tabs[target].focus();
      select(tabs[target].dataset.page);
    });
  });
  win.addEventListener("hashchange", () => select(win.location.hash.slice(1),false));
  select(win.location.hash.slice(1),false);
}
