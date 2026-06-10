(function () {
  let loaded = false;

  function loadAds() {
    if (loaded) return;
    loaded = true;

    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9126900244627260';
    document.head.appendChild(script);
  }

  ['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach((eventName) => {
    window.addEventListener(eventName, loadAds, { once: true, passive: true });
  });

  window.addEventListener('load', () => {
    window.setTimeout(loadAds, 12000);
  }, { once: true });
})();
