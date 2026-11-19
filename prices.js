// =====================================================
// prices.js  -  precos (fixos por produto, nao mudam ao recarregar)
// Para mudar os valores, edita a lista STEPS.
// =====================================================
(function () {
  var STEPS = [35, 40, 45, 50];
  window.GRIM_PRICE = function (n) {
    return STEPS[(n * 7 + 3) % STEPS.length];
  };
})();
