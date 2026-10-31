// Artifact — small progressive enhancements: build filters + photo/video lightbox.
(() => {
  // ---------- home page filters ----------
  const filters = document.querySelector('.filters');
  if (filters) {
    const cards = [...document.querySelectorAll('#work .card')];
    const empty = document.querySelector('#work .empty');
    filters.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      filters.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      const [kind, value] = btn.dataset.filter.split(':');
      let shown = 0;
      cards.forEach((c) => {
        const ok = kind === '*' ||
          (kind === 'tag' && c.dataset.tags.split(' ').includes(value)) ||
          (kind === 'status' && c.dataset.status === value);
        c.hidden = !ok;
        if (ok) shown++;
      });
      if (empty) empty.hidden = shown > 0;
    });
  }

  // ---------- lightbox ----------
  const lb = document.getElementById('lb');
  const links = [...document.querySelectorAll('a[data-lb]')];
  if (!lb || !links.length || typeof lb.showModal !== 'function') return;
  const stage = lb.querySelector('.lb-stage');
  const caption = lb.querySelector('.lb-caption');
  let index = 0;

  function show(i) {
    index = (i + links.length) % links.length;
    const a = links[index];
    stage.replaceChildren();
    if (a.dataset.lb === 'youtube') {
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${a.dataset.yt}?autoplay=1&rel=0`;
      f.title = a.dataset.title || 'Video';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      stage.append(f);
    } else {
      const img = new Image();
      img.src = a.href;
      img.alt = a.dataset.title || '';
      stage.append(img);
    }
    caption.textContent = `${a.dataset.title || ''}  ·  ${index + 1} / ${links.length}`;
  }

  links.forEach((a, i) => a.addEventListener('click', (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return; // let people open in a new tab
    e.preventDefault();
    lb.classList.toggle('single', links.length < 2);
    show(i);
    lb.showModal();
  }));
  lb.querySelector('.lb-close').addEventListener('click', () => lb.close());
  lb.querySelector('.lb-prev').addEventListener('click', () => show(index - 1));
  lb.querySelector('.lb-next').addEventListener('click', () => show(index + 1));
  lb.addEventListener('close', () => stage.replaceChildren());
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target === stage) lb.close(); });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') show(index + 1);
    if (e.key === 'ArrowLeft') show(index - 1);
  });
  // swipe on phones
  let x0 = null;
  lb.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
    x0 = null;
  });
})();
