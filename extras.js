// extras.js - barra de progresso do scroll + voltar ao topo (traduzido)
(function () {
  'use strict';
  var bar = document.createElement('div'); bar.id = 'xt-progress';
  var top = document.createElement('button');
  top.id = 'xt-top'; top.type = 'button'; top.textContent = '\u2191';
  top.onclick = function () { window.scrollTo({ top: 0, behavior: 'smooth' }); };
  document.body.appendChild(bar); document.body.appendChild(top);

  // texto do botao na lingua atual
  function label() {
    var I = window.GRIM_I18N, l = document.documentElement.lang;
    var d = I && (I.dict[l] || I.dict.en);
    top.setAttribute('aria-label', (d && d.backTop) || 'Back to top');
  }
  label();
  document.addEventListener('grim:lang', label);

  var fab = document.getElementById('fab'), tm;
  var busy = false;
  window.addEventListener('scroll', function () {
    if (busy) return; busy = true;
    requestAnimationFrame(function () {
      var h = document.documentElement.scrollHeight - innerHeight, y = scrollY;
      bar.style.width = (h > 0 ? Math.min(100, y / h * 100) : 0) + '%';
      top.classList.toggle('show', y > 600);
      // botao DM encolhe enquanto fazes scroll (nao tapa o texto)
      if (fab && y > 150) {
        fab.classList.add('mini'); clearTimeout(tm);
        tm = setTimeout(function () { fab.classList.remove('mini'); }, 900);
      }
      busy = false;
    });
  }, { passive: true });
})();
