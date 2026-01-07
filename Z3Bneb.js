<!-- ZebKit - Cole isso antes do </body> -->
<script>
(function(){
  if (window.__nebula_zebkit_installed) return;
  window.__nebula_zebkit_installed = true;

  const ZebKit = {
    getButtons() {
      // Pega botões e links que parecem botões
      const selector = 'button, [role="button"], input[type="button"], a[role="button"], .btn, .button, [class*="button"]';
      const nodes = Array.from(document.querySelectorAll(selector));
      return nodes.map((el, i) => {
        if(!el.id) el.id = 'nebula-autoid-' + i;
        const rect = el.getBoundingClientRect();
        return {
          id: el.id,
          tag: el.tagName.toLowerCase(),
          text: (el.innerText || el.value || el.getAttribute('aria-label') || '').trim(),
          classes: el.className || '',
          visible: rect.width > 0
        };
      });
    },

    applyStyles(id, className, styles) {
      // Se tiver className, aplica no grupo. Senão, só no ID.
      let targets = [];
      if (className) {
        // Sanitiza a classe para o seletor (pega apenas a primeira se for lista)
        const firstClass = className.split(' ')[0];
        targets = Array.from(document.querySelectorAll('.' + firstClass));
      } else {
        const el = document.getElementById(id);
        if(el) targets = [el];
      }

      targets.forEach(el => {
        if(!el) return;
        Object.assign(el.style, styles);
      });
    }
  };

  // Escuta comandos do Iframe (Nebula Pro)
  window.addEventListener('message', (e) => {
    const d = e.data;
    if(!d || !d.type) return;

    if(d.type === 'NEBULA_SCAN_REQ') {
      const tree = ZebKit.getButtons();
      e.source.postMessage({ 
        type: 'NEBULA_SCAN_RES', 
        tree, 
        domain: window.location.hostname 
      }, '*');
    }

    if(d.type === 'NEBULA_HIGHLIGHT') {
      const el = document.getElementById(d.id);
      if(el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const originalOutline = el.style.outline;
        el.style.outline = '4px solid #00f2ff';
        el.style.outlineOffset = '2px';
        setTimeout(() => el.style.outline = originalOutline, 1500);
      }
    }

    if(d.type === 'NEBULA_UPDATE_STYLE') {
      ZebKit.applyStyles(d.id, d.className, d.styles);
    }
  });

  console.log('%c🌌 NEBULA ZebKit instalado em ' + window.location.hostname, 'color: #00f2ff; font-weight: bold;');
})();
</script>

