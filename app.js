// (c) 2026 GRIM - todos os direitos reservados - ID GS-A2C12364D562
// =====================================================
// app.js  -  cards, mensagem Telegram, PREVIEW e LINGUAS
// Depende de: videos.js, prices.js e i18n.js (carregados antes)
// A mensagem do Telegram esta em i18n.js (chave "message")
// =====================================================
var CONFIG = {
  telegram: 'seiier_xx',
  channelUrl: 'https://t.me/MEGAFOLDER_1',   // <- link do teu canal
  menuMessage: 'Can I have MENU PLEASE!',          // mensagem dos botoes DM ACCESS (topo, menu e flutuante)
  addFolderName: true,                             // false = so a frase
  defaultLang: 'en',                               // lingua principal (sempre ingles)
  feedback: [],                                    // prints de clientes: ['img/fb1.jpg','img/fb2.jpg'] (vazio = esconde a secao)
  autoDetect: false,                               // true = usa a lingua do telemovel na 1a visita
  useCovers: false                                 // false = estilo antigo: a LETRA inicial e a imagem animada | true = usa capas (image / img/01.jpg)
};

// ---- GUARD embutido (assinatura digital) - parte essencial do app.js ----
// Se este bloco for removido, o site deixa de funcionar (GRIM_SEC nao existe).
var GRIM_SEC = (function () {
  'use strict';
  var PUB = /*PUB*/'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEJgTG/FrHaZAlAAqyMK3n1j5+elSqbl8R9bTVp9u9z6FmXqX7qO0aNDW0ga7inHM6UPk9sJTnW/J4YN+TMXWKqA=='/*END*/;                 // chave publica (escrita pelo sign.js)
  var DEV = ['localhost', '127.0.0.1', ''];   // so para testares em casa
  var host = String(location.hostname).toLowerCase();
  var M = null, dead = false;

  function dev() { return DEV.indexOf(host) > -1; }

  function corrupt() {                          // apaga a pagina
    if (dead) return; dead = true;
    try { window.GRIM_DATA = null; } catch (e) {}
    try { document.documentElement.innerHTML = ''; } catch (e) {}
    if (M && M.dm) location.replace('https://t.me/' + M.dm);
  }
  function soft() {                             // 1a vez recarrega (cache velha), 2a apaga
    try {
      if (!sessionStorage.getItem('grim_r')) { sessionStorage.setItem('grim_r', '1'); location.reload(); return; }
    } catch (e) {}
    corrupt();
  }

  function b64(s) {
    var b = atob(s), u = new Uint8Array(b.length);
    for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    return u;
  }
  function sha(t) {
    t = t.replace(/^\uFEFF/, '').replace(/\r/g, '');
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)).then(function (d) {
      return Array.prototype.map.call(new Uint8Array(d), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    });
  }

  function good(h) {
    return ['https://t.me/' + M.dm, M.channelUrl].some(function (p) {
      return h === p || h.indexOf(p + '?') === 0 || h.indexOf(p + '/') === 0;
    });
  }
  function linksOk() {
    var a = document.querySelectorAll('a[href*="t.me"]');
    for (var i = 0; i < a.length; i++) if (!good(a[i].getAttribute('href') || '')) return false;
    var h = document.querySelector('.handle');
    return !h || h.textContent.trim() === '@' + M.dm;
  }
  function run() { if (M && (M.hosts.indexOf(host) < 0 || !linksOk())) corrupt(); }

  function verify() {
    if (!PUB || !window.fetch || !window.crypto || !crypto.subtle) return corrupt();
    fetch('site.sig.json', { cache: 'no-store' }).then(function (r) {
      if (r.status === 404) throw 'gone';
      if (!r.ok) throw 'net';
      return r.json();
    }).then(function (j) {
      return crypto.subtle.importKey('spki', b64(PUB), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
        .then(function (k) {
          return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, k, b64(j.sig), new TextEncoder().encode(j.payload));
        })
        .then(function (ok) { if (!ok) throw 'bad'; return JSON.parse(j.payload); });
    }).then(function (m) {
      M = m;
      var c = window.CONFIG || {};
      if (m.hosts.indexOf(host) < 0) return corrupt();
      if (c.telegram !== m.dm || c.channelUrl !== m.channelUrl) return soft();
      run();
      return Promise.all(Object.keys(m.files).map(function (f) {
        return fetch(f, { cache: 'no-store' })
          .then(function (r) { return r.ok ? r.text() : null; })
          .then(function (t) { return t === null ? false : sha(t).then(function (h) { return h !== m.files[f]; }); })
          .catch(function () { return false; });
      })).then(function (bad) {
        if (bad.some(Boolean)) soft();
        else { try { sessionStorage.removeItem('grim_r'); } catch (e) {} }
      });
    }).catch(function (e) {
      if (e === 'gone' || e === 'bad' || e instanceof SyntaxError) corrupt();
    });
  }

  function guard() {
    if (dev()) return true;
    verify();
    return !!PUB;
  }
  function watch() {
    if (dev()) return;
    setInterval(run, 2000);
    if (window.MutationObserver && document.body) {
      new MutationObserver(run).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['href'] });
    }
  }
  return { guard: guard, watch: watch };
})();

(function () {
  'use strict';
  if (typeof GRIM_SEC === 'undefined' || !GRIM_SEC.guard()) return;   // protecao embutida
  var D = window.GRIM_DATA;
  var I = window.GRIM_I18N;
  var current = CONFIG.defaultLang;
  var view = { q: '', price: 0, sort: '' };   // pesquisa / filtro de preco / ordem
  var openN = 0;   // preview aberto (0 = nenhum)

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // texto traduzido da interface
  function T(key) {
    return (I.dict[current] && I.dict[current][key]) || I.dict.en[key] || '';
  }

  // aceita texto simples OU objeto { en:'..', es:'..', ... } (title / desc)
  function pick(v, lang, fallback) {
    if (v && typeof v === 'object') {
      return v[lang] || v.en || v[Object.keys(v)[0]] || fallback || '';
    }
    return v || fallback || '';
  }

  // link do Telegram na lingua escolhida
  function dmUrl(extra) {
    var t = T('message') + (extra ? '\n\n\uD83D\uDCC2 ' + T('folderLabel') + extra : '');
    return 'https://t.me/' + CONFIG.telegram + '?text=' + encodeURIComponent(t);
  }

  // converte link normal do Mega (/file/ ou /folder/) para embed
  function toEmbed(u) {
    u = (u || '').trim();
    if (!u) return '';
    return u.replace('mega.nz/file/', 'mega.nz/embed/').replace('mega.nz/folder/', 'mega.nz/embed/');
  }

  // dados fixos de cada produto (nao dependem da lingua)
  var base = D.items.map(function (it, idx) {
    var n = idx + 1;
    return {
      n: n, it: it, tag: String(it.tag || '').toLowerCase(),   // tag opcional: 'hot' | 'new' | 'best'
      price: window.GRIM_PRICE(n),
      img: (it.image || '').trim() || 'img/' + pad(n) + '.jpg',
      preview: toEmbed(it.video),
      // nome usado na mensagem para ti (sempre o mesmo, em ingles)
      refTitle: pick(it.title, 'en', 'Folder ' + pad(n))
    };
  });

  // dados que mudam com a lingua
  var products = [];
  function buildProducts() {
    products = base.map(function (b) {
      var title = pick(b.it.title, current, T('folder') + ' ' + pad(b.n));
      return {
        n: b.n, price: b.price, img: b.img, preview: b.preview, title: title, tag: b.tag,
        letter: b.it.title ? String(title).trim().charAt(0).toUpperCase() : pad(b.n),
        desc: pick(b.it.desc, current, '') || pick(D.defaultDescription, current, ''),
        buy: dmUrl(CONFIG.addFolderName ? b.refTitle + ' ($' + b.price + ')' : '')
      };
    });
  }

  var grid = document.getElementById('grid');

  var TAGS = { hot: 'tagHot', 'new': 'tagNew', best: 'tagBest' };
  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  // animacao de entrada ao fazer scroll
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.08 }) : null;
  function reveal() {
    document.querySelectorAll('.reveal:not(.in)').forEach(function (el) {
      if (io) io.observe(el); else el.classList.add('in');
    });
  }

  // pesquisa + filtro de preco + ordenar
  function visible() {
    var q = view.q.trim().toLowerCase();
    var list = products.filter(function (p) {
      if (view.price && p.price !== view.price) return false;
      return !q || (p.title + ' ' + p.desc).toLowerCase().indexOf(q) > -1;
    });
    if (view.sort) list.sort(function (a, b) {
      return (view.sort === 'low' ? a.price - b.price : b.price - a.price) || a.n - b.n;
    });
    return list;
  }

  function buildTools() {
    var prices = [];
    base.forEach(function (b) { if (prices.indexOf(b.price) < 0) prices.push(b.price); });
    prices.sort(function (a, b) { return a - b; });
    document.getElementById('pf').innerHTML = [0].concat(prices).map(function (v) {
      return '<button type="button" class="chip" data-price="' + v + '" aria-pressed="' + (view.price === v) + '">' + (v ? '$' + v : esc(T('all'))) + '</button>';
    }).join('');
    var so = document.getElementById('sort');
    so.innerHTML = [['', 'sortDef'], ['low', 'sortLow'], ['high', 'sortHigh']].map(function (o) {
      return '<option value="' + o[0] + '">' + esc(T(o[1])) + '</option>';
    }).join('');
    so.value = view.sort;
  }

  function renderProof() {
    var f = CONFIG.feedback || [];
    if (!f.length) return;
    document.getElementById('proofGrid').innerHTML = f.map(function (u) {
      return '<img class="reveal" loading="lazy" src="' + esc(u) + '" alt="' + esc(T('proofH')) + '">';
    }).join('');
    document.getElementById('proof').hidden = false;
    reveal();
  }

  function renderCards(anim) {
    var list = visible();
    grid.innerHTML = list.map(function (p, i) {
      return '<article class="card' + (anim ? ' reveal' : '') + '" style="--d:' + Math.min(i, 8) * 60 + 'ms">' +
        '<div class="thumb"><div class="num"><span>' + esc(p.letter) + '</span></div>' +
        (CONFIG.useCovers ? '<img src="' + esc(p.img) + '" alt="' + esc(p.title) + '" loading="lazy" onload="this.parentNode.classList.add(\'has-img\')" onerror="this.remove()">' : '') +
        '<div class="shade"></div>' +
        (TAGS[p.tag] ? '<span class="ctag t-' + p.tag + '">' + esc(T(TAGS[p.tag])) + '</span>' : '') +
        '<div class="price">$' + p.price + '</div>' +
        (p.desc ? '<div class="cap">' + esc(p.desc) + '</div>' : '') +
        (p.preview ? '<button type="button" class="play" data-prev="' + p.n + '" aria-label="' + esc(T('preview') + ': ' + p.title) + '">' + PLAY + '</button>' : '') +
        '</div>' +
        '<div class="body"><h3>' + esc(p.title) + '</h3>' +
        '<div class="actions">' +
        '<button class="btn btn-ghost" data-prev="' + p.n + '"' + (p.preview ? '' : ' disabled title="' + esc(T('previewSoon')) + '"') + '>' + esc(T('preview')) + '</button>' +
        '<a class="btn btn-hot" target="_blank" rel="noopener" href="' + p.buy + '">' + esc(T('buyNow')) + '</a>' +
        '</div></div></article>';
    }).join('');
    document.getElementById('empty').hidden = list.length > 0;

    // imagens ja em cache: esconde a letra sem esperar o evento onload
    grid.querySelectorAll('.thumb img').forEach(function (im) {
      if (im.complete && im.naturalWidth > 0) im.parentNode.classList.add('has-img');
    });
    reveal();
  }

  // ---------- LINGUA ----------
  // ordem: 1) link com ?lang=pt  2) lingua que a pessoa escolheu antes  3) ingles
  function detectLang() {
    var m = /[?&]lang=([a-z]{2})/i.exec(location.search);
    if (m && I.dict[m[1].toLowerCase()]) return m[1].toLowerCase();
    var saved = null;
    try { saved = localStorage.getItem('grim_lang'); } catch (e) {}
    if (saved && I.dict[saved]) return saved;
    if (CONFIG.autoDetect) {
      var nav = ((navigator.languages && navigator.languages[0]) || navigator.language || '').toLowerCase().slice(0, 2);
      if (I.dict[nav]) return nav;
    }
    return CONFIG.defaultLang;
  }

  function setLang(lang) {
    if (!I.dict[lang]) lang = CONFIG.defaultLang;
    current = lang;
    try { localStorage.setItem('grim_lang', lang); } catch (e) {}

    var html = document.documentElement;
    html.lang = lang;
    html.dir = I.rtl.indexOf(lang) > -1 ? 'rtl' : 'ltr';
    document.title = T('title');

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = T(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', T(el.getAttribute('data-i18n-aria')));
    });

    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var t = T(el.getAttribute('data-i18n-ph'));
      el.setAttribute('placeholder', t); el.setAttribute('aria-label', t);
    });

    var sel = document.getElementById('lang');
    if (sel) sel.value = lang;

    buildProducts();
    buildTools();
    renderCards(true);
    renderProof();

    document.getElementById('statN').textContent = products.length;
    var menuUrl = 'https://t.me/' + CONFIG.telegram + '?text=' + encodeURIComponent(CONFIG.menuMessage);
    ['dmTop', 'dmBar', 'fab'].forEach(function (id) { document.getElementById(id).href = menuUrl; });
    ['chanBtn', 'chanTop'].forEach(function (id) { document.getElementById(id).href = CONFIG.channelUrl; });

    // se o preview estiver aberto, atualiza titulo e botao
    if (openN && products[openN - 1]) {
      document.getElementById('mTitle').textContent = products[openN - 1].title;
      document.getElementById('mBuy').href = products[openN - 1].buy;
    }
    document.dispatchEvent(new CustomEvent('grim:lang', { detail: lang }));
  }

  // monta o seletor de lingua
  var sel = document.getElementById('lang');
  sel.innerHTML = I.order.map(function (l) {
    return '<option value="' + l + '">' + esc(I.names[l]) + '</option>';
  }).join('');
  sel.addEventListener('change', function () { setLang(sel.value); });

  // ---------- pesquisa, filtro de preco e ordenar ----------
  document.getElementById('q').addEventListener('input', function () { view.q = this.value; renderCards(); });
  document.getElementById('sort').addEventListener('change', function () { view.sort = this.value; renderCards(); });
  document.getElementById('pf').addEventListener('click', function (e) {
    var b = e.target.closest('[data-price]');
    if (!b) return;
    view.price = +b.getAttribute('data-price');
    Array.prototype.forEach.call(this.children, function (c) { c.setAttribute('aria-pressed', c === b); });
    renderCards();
  });

  // ---------- PREVIEW: iframe so carrega ao abrir ----------
  var modal = document.getElementById('modal'), frame = document.getElementById('frame');
  function openPrev(n) {
    var p = products[n - 1];
    if (!p || !p.preview) return;
    openN = n;
    document.getElementById('mTitle').textContent = p.title;
    document.getElementById('mBuy').href = p.buy;
    frame.innerHTML = '<iframe src="' + esc(p.preview) + '" allowfullscreen allow="autoplay; fullscreen" title="' + esc(p.title) + '"></iframe>';
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closePrev() {
    openN = 0;
    modal.classList.remove('open');
    frame.innerHTML = '';
    document.body.style.overflow = '';
  }
  grid.addEventListener('click', function (e) {
    var b = e.target.closest('[data-prev]');
    if (b) openPrev(+b.getAttribute('data-prev'));
  });
  document.getElementById('mClose').onclick = closePrev;
  modal.addEventListener('click', function (e) { if (e.target === modal) closePrev(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePrev(); });

  // arranque
  setLang(detectLang());
  GRIM_SEC.watch();   // vigia alteracoes (embutido)
})();
