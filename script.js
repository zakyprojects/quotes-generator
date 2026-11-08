(function () {
  'use strict';

  var root = document.documentElement;
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var box = document.getElementById('quote-box');
  var textEl = document.getElementById('quote-text');
  var authorEl = document.getElementById('quote-author');
  var labelEl = document.getElementById('label');
  var shareBtn = document.getElementById('share-btn');
  var toastEl = document.getElementById('toast');

  var quotes = [];
  var deck = [];      // shuffled indexes, so no quote repeats until all are seen
  var current = null;

  // ---------- Theme ----------
  function setThemeColor() { themeMeta.content = root.dataset.theme === 'dark' ? '#13110e' : '#f5f0e6'; }
  setThemeColor();
  document.getElementById('theme-btn').addEventListener('click', function () {
    if (root.dataset.theme === 'dark') delete root.dataset.theme; else root.dataset.theme = 'dark';
    try { localStorage.setItem('quotes_theme', root.dataset.theme === 'dark' ? 'dark' : 'light'); } catch (e) {}
    setThemeColor();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    var saved = null;
    try { saved = localStorage.getItem('quotes_theme'); } catch (err) {}
    if (saved === 'dark' || saved === 'light') return;
    if (e.matches) root.dataset.theme = 'dark'; else delete root.dataset.theme;
    setThemeColor();
  });

  // ---------- Quotes ----------
  // Same quote for everyone on the same day (local date).
  function todayIndex() {
    var d = new Date();
    var days = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
    return days % quotes.length;
  }

  function refillDeck() {
    deck = quotes.map(function (_, i) { return i; });
    for (var i = deck.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = deck[i]; deck[i] = deck[j]; deck[j] = t;
    }
  }

  function show(index, label) {
    current = quotes[index];
    box.classList.add('fade');
    setTimeout(function () {
      textEl.textContent = current[0];
      authorEl.textContent = current[1];
      labelEl.textContent = label;
      shareBtn.href = 'https://twitter.com/intent/tweet?text=' +
        encodeURIComponent('"' + current[0] + '" — ' + current[1]);
      box.classList.remove('fade');
    }, 160);
  }

  function next() {
    if (!quotes.length) return;
    if (!deck.length) refillDeck();
    var i = deck.pop();
    if (current && quotes[i] === current) { if (!deck.length) refillDeck(); i = deck.pop(); }
    show(i, 'Random quote');
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { toastEl.hidden = true; }, 1600);
  }

  document.getElementById('new-btn').addEventListener('click', next);

  document.getElementById('copy-btn').addEventListener('click', function () {
    if (!current) return;
    var text = '"' + current[0] + '" — ' + current[1];
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { toast('Copied'); }, function () { toast('Could not copy'); });
    } else {
      toast('Could not copy');
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.code !== 'Space' || e.repeat) return;
    var tag = e.target.tagName;
    if (tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'TEXTAREA') return;
    e.preventDefault();
    next();
  });

  fetch('quotes.json')
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (list) {
      quotes = list;
      show(todayIndex(), 'Quote of the day');
    })
    .catch(function () {
      textEl.textContent = 'Could not load quotes. Please refresh the page.';
      authorEl.textContent = '';
    });
})();
