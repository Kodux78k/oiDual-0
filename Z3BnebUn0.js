<script>
(function(){
  // Guard: impede instalação duplicada
  if (window.__nebula_zebkit_installed) {
    console.warn('ZebKit já está operando nesta página.');
    return;
  }
  window.__nebula_zebkit_installed = true;

  const ZebKit = {
    // 1. Escaneamento Robusto de Elementos Interativos
    getButtons(root = document.body) {
      const selector = [
        'button',
        '[role="button"]',
        'input[type="button"]',
        'input[type="submit"]',
        'a[role="button"]',
        'a[href][data-button]',
        '.btn',
        '.button',
        '[class*="button"]',
        '[data-nebula-button]'
      ].join(',');
      
      const nodes = Array.from((root || document.body).querySelectorAll(selector));

      return nodes.map((el, i) => {
        // Garante ID único para comunicação precisa
        if(!el.id) {
          el.id = 'neb-auto-' + Math.random().toString(36).substr(2, 5) + '-' + i;
        }
        const rect = el.getBoundingClientRect();
        return {
          id: el.id,
          tag: el.tagName.toLowerCase(),
          text: (el.innerText || el.value || el.getAttribute('aria-label') || '').trim(),
          classes: el.className || '',
          dataset: {...el.dataset},
          bounding: {
            x: Math.round(rect.x), y: Math.round(rect.y),
            width: Math.round(rect.width), height: Math.round(rect.height)
          },
          visible: !!(rect.width || rect.height),
          tabIndex: el.tabIndex
        };
      });
    },

    // 2. Agrupamento por Classe (Útil para edições em massa no Iframe)
    groupByClass(list = []) {
      const groups = {};
      list.forEach(item => {
        const clsArr = (item.classes || '').split(/\s+/).filter(Boolean);
        if(clsArr.length === 0) {
          groups.__ungrouped = groups.__ungrouped || [];
          groups.__ungrouped.push(item);
        } else {
          clsArr.forEach(c => {
            groups[c] = groups[c] || [];
            groups[c].push(item);
          });
        }
      });
      return groups;
    },

    // 3. Aplicação de Estilos (Individual ou por Classe)
    applyStyles(id, className, styles = {}) {
      let targets = [];
      if (className) {
        // Se houver classe, aplica em todos os elementos daquela classe (Edição em Massa)
        const firstClass = className.split(' ')[0];
        targets = Array.from(document.querySelectorAll('.' + firstClass));
      } else {
        // Caso contrário, aplica apenas no ID específico
        const el = document.getElementById(id);
        if(el) targets = [el];
      }

      targets.forEach(el => {
        Object.assign(el.style, styles);
      });
      return targets.length > 0;
    },

    // 4. Efeito Visual de Destaque (Highlight)
    highlightElement(id) {
      const el = document.getElementById(id);
      if(!el) return false;
      
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const prevOutline = el.style.outline;
      const prevOffset = el.style.outlineOffset;
      
      el.style.outline = '4px solid #00f2ff';
      el.style.outlineOffset = '2px';
      
      setTimeout(() => {
        el.style.outline = prevOutline || '';
        el.style.outlineOffset = prevOffset || '';
      }, 1600);
      return true;
    },

    // 5. Injeção de CSS Global
    injectCss(content, fileId) {
      const tagId = 'zebkit-css-' + (fileId || 'global');
      let styleTag = document.getElementById(tagId);
      if(!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = tagId;
        document.head.appendChild(styleTag);
      }
      styleTag.textContent = content || '';
      return tagId;
    }
  };

  // --- Listener de Mensagens (Comunicação com o Iframe NEBULA) ---
  window.addEventListener('message', (ev) => {
    const d = ev.data;
    if(!d || !d.type) return;

    const source = ev.source || window;
    const origin = ev.origin || '*';

    switch(d.type) {
      case 'NEBULA_SCAN_REQ':
        const tree = ZebKit.getButtons();
        const groups = ZebKit.groupByClass(tree);
        source.postMessage({ 
          type: 'NEBULA_SCAN_RES', 
          tree, 
          groups, 
          domain: window.location.hostname 
        }, origin);
        break;

      case 'NEBULA_HIGHLIGHT':
        const hOk = ZebKit.highlightElement(d.id);
        source.postMessage({ type: 'NEBULA_HIGHLIGHT_ACK', id: d.id, ok: hOk }, origin);
        break;

      case 'NEBULA_UPDATE_STYLE':
        const sOk = ZebKit.applyStyles(d.id, d.className, d.styles);
        source.postMessage({ type: 'NEBULA_UPDATE_ACK', id: d.id, ok: sOk }, origin);
        break;

      case 'NEBULA_CSS_FILE':
        const tagId = ZebKit.injectCss(d.content, d.fileId);
        source.postMessage({ type: 'NEBULA_CSS_ACK', fileId: d.fileId, tagId }, origin);
        break;
    }
  });

  // Exposição Global e Log de Sucesso
  window.ZebKit = ZebKit;
  console.log('%c🌌 NEBULA ZebKit Unificado | Ativo em: ' + window.location.hostname, 'color: #00f2ff; font-weight: bold; background: #00151a; padding: 4px 8px; border-radius: 4px;');
})();
</script>
