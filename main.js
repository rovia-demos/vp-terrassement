(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  // Hauteur d'écran mesurée une seule fois ; mise à jour seulement si la largeur change (rotation)
  let lastW = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === lastW) return;
    lastW = innerWidth;
    root.style.setProperty('--vh', innerHeight / 100 + 'px');
    layoutGrid();
  });

  $('#year').textContent = new Date().getFullYear();

  /* ---------- en-tête ---------- */
  const top = $('#top');
  const onScroll = () => top.classList.toggle('is-solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = $('#burger'), nav = $('#nav');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    nav.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- apparitions au défilement ---------- */
  $$('.sec-head, .trust__list li, .why__list li, .rv li, .stats, .zone__card, .quote__side, .form, .ba__view, .more')
    .forEach(el => el.classList.add('rv-in'));
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  $$('.rv-in, .stratum').forEach(el => io.observe(el));

  /* ---------- services : la pancarte change pendant le défilement ---------- */
  const frameImgs = $$('.svc__frame img'), items = $$('.svc__item');
  const sign = $('.sign'), signN = $('#sign-n'), signT = $('#sign-t');
  let cur = 0;
  const setSvc = i => {
    if (i === cur) return;
    cur = i;
    frameImgs.forEach(img => img.classList.toggle('is-on', +img.dataset.svc === i));
    items.forEach(it => it.classList.toggle('is-on', +it.dataset.i === i));
    signN.textContent = String(i + 1).padStart(2, '0');
    signT.textContent = $('h3', items[i]).textContent;
    if (!reduce) { sign.classList.remove('flip'); void sign.offsetWidth; sign.classList.add('flip'); }
  };
  items[0].classList.add('is-on');
  const svcIo = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) setSvc(+e.target.dataset.i);
  }), { rootMargin: '-45% 0px -45% 0px' });
  items.forEach(it => svcIo.observe(it));
  // images de la pancarte chargées dès que la section approche
  new IntersectionObserver((en, o) => { if (en[0].isIntersecting) { frameImgs.forEach(i => i.loading = 'eager'); o.disconnect(); } },
    { rootMargin: '600px 0px' }).observe($('#services'));

  /* ---------- avant / après ---------- */
  const PAIRS = {
    1: ['Débroussaillage, dessouchage et mise à niveau d\'un terrain en friche.', 'terrain en friche couvert de broussailles et de rochers', 'terrain débroussaillé, nivelé et propre'],
    2: ['Fouille de piscine aux parois nettes, terre évacuée, jardin préservé.', 'pelouse avant les travaux', 'fouille de piscine rectangulaire terminée'],
    3: ['Talus qui s\'effondre remplacé par un mur d\'enrochement.', 'talus de terre qui s\'effondre', 'mur de soutènement en enrochement'],
    4: ['Vieille annexe démolie, gravats évacués, terrain propre.', 'vieille annexe en ruine', 'terrain propre après démolition et évacuation']
  };
  const view = $('#ba-view'), range = $('#ba-range'), bef = $('#ba-before'), aft = $('#ba-after'), cap = $('#ba-cap');
  const setPos = v => view.style.setProperty('--pos', v + '%');
  range.addEventListener('input', () => setPos(range.value));
  // glisser directement sur l'image (souris et doigt)
  let drag = false;
  const fromX = x => { const r = view.getBoundingClientRect(); const v = Math.max(0, Math.min(100, (x - r.left) / r.width * 100)); range.value = v; setPos(v); };
  view.addEventListener('pointerdown', e => { drag = true; view.classList.add('is-drag'); fromX(e.clientX); });
  addEventListener('pointermove', e => { if (drag) fromX(e.clientX); });
  addEventListener('pointerup', () => { drag = false; view.classList.remove('is-drag'); });
  $$('.ba__tabs button').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.pair, [txt, altB, altA] = PAIRS[k];
    $$('.ba__tabs button').forEach(x => x.setAttribute('aria-selected', x === b));
    bef.src = `img/av${k}-1600.webp`; bef.srcset = `img/av${k}-800.webp 800w, img/av${k}-1600.webp 1600w`; bef.alt = 'Avant : ' + altB;
    aft.src = `img/ap${k}-1600.webp`; aft.srcset = `img/ap${k}-800.webp 800w, img/ap${k}-1600.webp 1600w`; aft.alt = 'Après : ' + altA;
    cap.textContent = txt;
    [bef, aft].forEach(i => { i.classList.remove('swap'); void i.offsetWidth; i.classList.add('swap'); });
    range.value = 50; setPos(50);
  }));
  // petite démonstration du curseur à la première apparition
  if (!reduce) new IntersectionObserver((en, o) => {
    if (!en[0].isIntersecting) return; o.disconnect();
    const t0 = performance.now();
    const step = t => { const p = Math.min(1, (t - t0) / 1600); const v = 50 + Math.sin(p * Math.PI * 2) * 18 * (1 - p); setPos(v); range.value = v; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }, { threshold: .6 }).observe(view);

  /* ---------- réalisations : grille « Tetris » filtrable ---------- */
  const grid = $('#grid'), cells = $$('li', grid), more = $('#more');
  let filter = 'all', expanded = false;
  function layoutGrid() {
    const cols = innerWidth <= 640 ? 2 : 4;
    const limit = innerWidth <= 640 ? 6 : 8;
    const match = cells.filter(c => filter === 'all' || c.dataset.c === filter);
    const shown = (filter === 'all' && !expanded) ? match.slice(0, limit) : match;
    cells.forEach(c => { c.hidden = !shown.includes(c); c.style.gridColumn = ''; });
    const rest = shown.length % cols;
    // la dernière photo s'élargit pour combler la ligne incomplète
    if (rest) shown[shown.length - 1].style.gridColumn = `span ${cols - rest + 1}`;
    more.parentElement.hidden = !(filter === 'all' && !expanded && match.length > limit);
  }
  $$('.filters button').forEach(b => b.addEventListener('click', () => {
    filter = b.dataset.f;
    $$('.filters button').forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b); });
    layoutGrid();
  }));
  more.addEventListener('click', () => { expanded = true; layoutGrid(); });
  layoutGrid();

  /* ---------- visionneuse ---------- */
  const lb = $('#lb'), lbImg = $('#lb-img'), lbCap = $('#lb-cap');
  let lbList = [], lbI = 0;
  const showLb = i => { lbI = (i + lbList.length) % lbList.length; const b = $('button', lbList[lbI]); lbImg.src = b.dataset.full; lbImg.alt = $('img', b).alt; lbCap.textContent = $('span', b).textContent; };
  grid.addEventListener('click', e => {
    const li = e.target.closest('li'); if (!li) return;
    lbList = cells.filter(c => !c.hidden); showLb(lbList.indexOf(li)); lb.showModal();
  });
  $('#lb-x').onclick = () => lb.close();
  $('#lb-p').onclick = () => showLb(lbI - 1);
  $('#lb-n').onclick = () => showLb(lbI + 1);
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', e => { if (e.key === 'ArrowLeft') showLb(lbI - 1); if (e.key === 'ArrowRight') showLb(lbI + 1); });

  /* ---------- compteurs (chiffres réels uniquement) ---------- */
  const fmt = (v, d) => v.toFixed(d).replace('.', ',');
  new IntersectionObserver((en, o) => {
    if (!en[0].isIntersecting) return; o.disconnect();
    $$('.count').forEach(el => {
      const to = +el.dataset.to, d = +(el.dataset.dec || 0);
      if (reduce) return;
      const t0 = performance.now();
      const step = t => { const p = Math.min(1, (t - t0) / 1400); el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)), d); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }, { threshold: .5 }).observe($('.stats'));

  /* ---------- barre de contact mobile : apparaît une fois les boutons du hero dépassés ---------- */
  const bar = $('#callbar');
  new IntersectionObserver(([e]) => {
    bar.classList.toggle('is-on', !e.isIntersecting && e.boundingClientRect.top < 0);
  }).observe($('#hero-ctas'));

  /* ---------- formulaire de devis (démo : aucun envoi) ---------- */
  const form = $('#form'), thumbs = $('#thumbs'), errP = $('#err-projet');
  $('#photos').addEventListener('change', e => {
    thumbs.innerHTML = '';
    [...e.target.files].slice(0, 8).forEach(f => {
      const img = new Image(); img.src = URL.createObjectURL(f); img.alt = f.name; thumbs.append(img);
    });
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    const projet = form.querySelector('input[name="projet"]:checked');
    errP.hidden = !!projet; if (!projet) ok = false;
    $$('input[required]:not([type="radio"])', form).forEach(i => { const bad = !i.checkValidity(); i.classList.toggle('bad', bad); if (bad) ok = false; });
    if (!ok) { (projet ? form.querySelector('.bad') : form.querySelector('.chips input'))?.focus(); return; }
    const done = $('#ok'); done.hidden = false; done.focus({ preventScroll: true }); form.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  });
  $$('input[required]', form).forEach(i => i.addEventListener('input', () => i.classList.remove('bad')));
  form.addEventListener('change', e => { if (e.target.name === 'projet') errP.hidden = true; });
})();
