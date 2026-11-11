(function () {
  const D = window.SITE_DATA;
  const $ = (s, r) => (r || document).querySelector(s);
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- content ---------- */
  $("#hero-title").textContent = D.title;
  $("#hero-tagline").textContent = D.tagline;
  ["#hero-cv", "#nav-cv"].forEach((s) => { $(s).href = D.cv; });
  $("#hero-github").href = D.links.github;
  $("#year").textContent = new Date().getFullYear();
  $("#updated").textContent = D.updated;

  const mg = $("#metrics-grid");
  D.metrics.forEach((m) => {
    const n = el("div", "metric");
    n.innerHTML = `<b data-count="${m.value}" data-prefix="${m.prefix || ""}" data-suffix="${m.suffix || ""}">${m.prefix || ""}0${m.suffix || ""}</b><span>${esc(m.label)}</span>`;
    mg.appendChild(n);
  });

  const tl = $("#timeline");
  D.experience.forEach((j) => {
    const n = el("article", "job reveal");
    n.innerHTML = `<div class="job-head"><h3>${esc(j.company)}</h3><span class="dates">${esc(j.dates)}</span></div>
      <p class="role">${esc(j.role)}</p>
      <ul>${j.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
      <div class="tags">${j.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>`;
    tl.appendChild(n);
  });

  const kinds = ["All", ...Array.from(new Set(D.projects.map((p) => p.kind.split(" · ")[0])))];
  const filters = $("#filters");
  const grid = $("#project-grid");
  kinds.forEach((k, i) => {
    const b = el("button", "chip" + (i === 0 ? " active" : ""), esc(k));
    b.type = "button";
    b.addEventListener("click", () => {
      filters.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      b.classList.add("active");
      grid.querySelectorAll(".card").forEach((c) => c.classList.toggle("hidden", k !== "All" && c.dataset.kind !== k));
    });
    filters.appendChild(b);
  });
  D.projects.forEach((p) => {
    const n = el("article", "card reveal");
    n.dataset.kind = p.kind.split(" · ")[0];
    const title = p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.name)}</a>` : esc(p.name);
    n.innerHTML = `<div class="card-top"><span class="kind">${esc(p.kind)}</span><span class="status ${esc(p.status.toLowerCase().replace(/\s+/g, "-"))}">${esc(p.status)}</span></div>
      <h3>${title}</h3><p>${esc(p.desc)}</p>
      <div class="tags">${p.stack.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>`;
    grid.appendChild(n);
  });

  const wl = $("#writing-list");
  D.writing.forEach((w) => {
    const a = el("a", "post reveal");
    a.href = w.url; a.target = "_blank"; a.rel = "noopener";
    a.innerHTML = `<h3>${esc(w.title)}</h3><span class="date">${esc(w.date)}</span>`;
    wl.appendChild(a);
  });

  const edu = $("#edu");
  D.education.forEach((e) => {
    const n = el("div", "edu-item");
    n.innerHTML = `<b>${esc(e.school)}</b> <span class="dates">${esc(e.dates)}</span><span class="deg">${esc(e.degree)}</span>${e.note ? `<span class="note">${esc(e.note)}</span>` : ""}`;
    edu.appendChild(n);
  });
  const certs = $("#certs");
  D.certifications.forEach((c) => certs.appendChild(el("span", "cert", esc(c))));

  const sk = $("#skills");
  Object.entries(D.skills).forEach(([g, items]) => {
    const n = el("div", "skill-group");
    n.innerHTML = `<h4>${esc(g)}</h4><div class="tags">${items.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>`;
    sk.appendChild(n);
  });

  const cl = $("#contact-links");
  [["Email me", "mailto:" + D.email, "btn-primary"], ["LinkedIn", D.links.linkedin, ""], ["GitHub", D.links.github, ""], ["Medium", D.links.medium, ""], ["Download CV", D.cv, "btn-ghost"]]
    .forEach(([t, h, c]) => { const a = el("a", "btn " + c, esc(t)); a.href = h; if (h.startsWith("http")) { a.target = "_blank"; a.rel = "noopener"; } if (h === D.cv) a.setAttribute("download", ""); cl.appendChild(a); });

  /* ---------- reveal + count-up (scroll check: anchor jumps never miss) ---------- */
  const pending = Array.from(document.querySelectorAll(".reveal, .metric"));
  function show(n) {
    n.classList.add("in");
    n.querySelectorAll("[data-count]").forEach(countUp);
    if (n.hasAttribute("data-count")) countUp(n);
  }
  let ticking = false;
  function check() {
    ticking = false;
    const limit = innerHeight * 0.92;
    for (let i = pending.length - 1; i >= 0; i--) {
      const r = pending[i].getBoundingClientRect();
      if (r.top < limit) { show(pending[i]); pending.splice(i, 1); }
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(check); } }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  addEventListener("load", check);
  check();

  function countUp(b) {
    if (b.dataset.done) return; b.dataset.done = "1";
    const target = +b.dataset.count, pre = b.dataset.prefix, suf = b.dataset.suffix;
    if (reduced) { b.textContent = pre + target.toLocaleString() + suf; return; }
    const t0 = performance.now(), dur = 1400, final = pre + target.toLocaleString() + suf;
    const guard = setTimeout(() => { b.textContent = final; }, dur + 400); // background tabs pause rAF
    (function step(t) {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      b.textContent = pre + Math.round(target * e).toLocaleString() + suf;
      if (k < 1) requestAnimationFrame(step); else { clearTimeout(guard); b.textContent = final; }
    })(t0);
  }

  /* ---------- 3D tilt on cards ---------- */
  if (!reduced && matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".card, .job").forEach((c) => {
      c.addEventListener("pointermove", (ev) => {
        const r = c.getBoundingClientRect();
        const x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
        c.style.setProperty("--mx", (x * 100) + "%"); c.style.setProperty("--my", (y * 100) + "%");
        const lim = c.classList.contains("job") ? 3 : 8;
        c.style.transform = `rotateX(${(0.5 - y) * lim}deg) rotateY(${(x - 0.5) * lim}deg) translateY(-4px)`;
      });
      c.addEventListener("pointerleave", () => { c.style.transform = ""; });
    });
  }

  /* ---------- Three.js background: aurora lattice ---------- */
  const canvas = $("#bg");
  if (!window.THREE || reduced) { canvas.style.background = "radial-gradient(1200px 600px at 70% -10%, rgba(139,92,246,.25), transparent), radial-gradient(900px 500px at 10% 30%, rgba(94,234,212,.18), transparent)"; return; }
  const T = window.THREE;
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new T.Scene();
  scene.fog = new T.FogExp2(0x070b14, 0.06);
  const camera = new T.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0, 11);

  const group = new T.Group(); scene.add(group);

  // outer lattice
  const ico = new T.IcosahedronGeometry(4.2, 1);
  const lattice = new T.LineSegments(new T.WireframeGeometry(ico), new T.LineBasicMaterial({ color: 0x5eead4, transparent: true, opacity: 0.18 }));
  group.add(lattice);
  // inner faceted core
  const core = new T.Mesh(new T.IcosahedronGeometry(1.6, 0), new T.MeshStandardMaterial({ color: 0x8b5cf6, emissive: 0x3b1f8a, emissiveIntensity: 0.6, metalness: 0.5, roughness: 0.3, flatShading: true, transparent: true, opacity: 0.9 }));
  group.add(core);
  const halo = new T.Mesh(new T.IcosahedronGeometry(2.1, 1), new T.MeshBasicMaterial({ color: 0x5eead4, wireframe: true, transparent: true, opacity: 0.12 }));
  group.add(halo);

  // particle shell with per-point color
  const N = 1800, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), seed = new Float32Array(N);
  const c1 = new T.Color(0x5eead4), c2 = new T.Color(0x8b5cf6), c3 = new T.Color(0x60a5fa);
  for (let i = 0; i < N; i++) {
    const r = 5.2 + Math.random() * 6, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th); pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.7; pos[i * 3 + 2] = r * Math.cos(ph);
    const c = Math.random() < 0.5 ? c1 : (Math.random() < 0.5 ? c2 : c3);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; seed[i] = Math.random() * Math.PI * 2;
  }
  const pg = new T.BufferGeometry();
  pg.setAttribute("position", new T.BufferAttribute(pos, 3)); pg.setAttribute("color", new T.BufferAttribute(col, 3));
  const points = new T.Points(pg, new T.PointsMaterial({ size: 0.045, vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, blending: T.AdditiveBlending }));
  scene.add(points);

  // orbit rings
  const rings = [];
  [[5.6, 0x5eead4, 0.35], [6.4, 0x8b5cf6, -0.2], [7.3, 0x60a5fa, 0.6]].forEach(([r, c, tilt]) => {
    const ring = new T.Mesh(new T.TorusGeometry(r, 0.012, 8, 160), new T.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.35 }));
    ring.rotation.x = Math.PI / 2 + tilt; ring.rotation.y = tilt * 0.6; scene.add(ring); rings.push(ring);
  });

  scene.add(new T.AmbientLight(0xffffff, 0.35));
  const l1 = new T.PointLight(0x5eead4, 14, 40); l1.position.set(6, 5, 6); scene.add(l1);
  const l2 = new T.PointLight(0x8b5cf6, 14, 40); l2.position.set(-6, -4, 5); scene.add(l2);

  let mx = 0, my = 0, tx = 0, ty = 0, scrollY = 0;
  addEventListener("pointermove", (e) => { tx = (e.clientX / innerWidth - 0.5) * 2; ty = (e.clientY / innerHeight - 0.5) * 2; }, { passive: true });
  addEventListener("scroll", () => { scrollY = window.scrollY; }, { passive: true });
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    group.position.x = w > 900 ? 2.6 : 0; group.position.y = w > 900 ? 0 : 2.2;
  }
  addEventListener("resize", resize); resize();

  const clock = new T.Clock();
  let hidden = false;
  document.addEventListener("visibilitychange", () => { hidden = document.hidden; });
  (function animate() {
    requestAnimationFrame(animate);
    if (hidden) return;
    const t = clock.getElapsedTime();
    mx += (tx - mx) * 0.04; my += (ty - my) * 0.04;
    group.rotation.y = t * 0.12 + mx * 0.35; group.rotation.x = Math.sin(t * 0.2) * 0.15 + my * 0.25;
    core.rotation.x = t * 0.5; core.rotation.y = -t * 0.35; core.scale.setScalar(1 + Math.sin(t * 1.4) * 0.05);
    halo.rotation.y = -t * 0.3; halo.rotation.z = t * 0.1;
    lattice.rotation.z = t * 0.05;
    points.rotation.y = t * 0.03 + mx * 0.1; points.rotation.x = my * 0.08;
    rings.forEach((r, i) => { r.rotation.z = t * (0.08 + i * 0.03); });
    const s = Math.min(1, scrollY / (innerHeight * 1.2));
    camera.position.z = 11 + s * 6; camera.position.y = -s * 2.5;
    scene.fog.density = 0.06 + s * 0.05;
    renderer.render(scene, camera);
  })();
})();
