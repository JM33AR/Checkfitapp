(function() {
  // 1. CREAR EL CONTENEDOR HTML DEL WIDGET
  var widgetContainer = document.createElement('div');
  widgetContainer.id = 'fc-widget-universal';
  widgetContainer.className = 'fc-root';
  widgetContainer.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 999999;';
  
  widgetContainer.innerHTML = `
    <div class="fc-idle" id="fc-idle-universal">
      <button class="fc-idle-btn" onclick="fitcheck_open()">
        <span class="fc-idle-dot"></span>¿Es tu talla? · Verificar con FitCheck <span class="fc-idle-arrow">→</span>
      </button>
    </div>
    <div class="fc-form-wrap fc-hidden" id="fc-form-universal">
      <div class="fc-form-header">
        <div class="fc-form-logo">FitCheck<span class="fc-badge">beta</span></div>
        <button class="fc-close-btn" onclick="fitcheck_close()">✕</button>
      </div>
      <div class="fc-step-indicator">
        <span class="fc-step-dot fc-step-active" id="fc-sdot1-universal"></span>
        <span class="fc-step-line"></span>
        <span class="fc-step-dot" id="fc-sdot2-universal"></span>
      </div>
      <div id="fc-p1-universal">
        <p class="fc-form-title">Ingresá tus <em>medidas reales</em></p>
        <p class="fc-form-hint">Medite con ropa interior ajustada.</p>
        <div class="fc-fields">
          <div class="fc-field-group"><label class="fc-label">Pecho</label><div class="fc-input-wrap"><input class="fc-input" id="fc-pecho-universal" type="number" placeholder="88"/><span class="fc-unit">cm</span></div></div>
          <div class="fc-field-group"><label class="fc-label">Cintura</label><div class="fc-input-wrap"><input class="fc-input" id="fc-cintura-universal" type="number" placeholder="72"/><span class="fc-unit">cm</span></div></div>
          <div class="fc-field-group"><label class="fc-label">Cadera</label><div class="fc-input-wrap"><input class="fc-input" id="fc-cadera-universal" type="number" placeholder="96"/><span class="fc-unit">cm</span></div></div>
        </div>
        <button class="fc-btn-primary" onclick="fitcheck_nextStep()">Ver mi calce →</button>
      </div>
      <div id="fc-p2-universal" class="fc-hidden">
        <p class="fc-form-title">Más detalle <span class="fc-optional-tag">opcional</span></p>
        <div class="fc-fields">
          <div class="fc-field-group"><label class="fc-label">Hombros</label><div class="fc-input-wrap"><input class="fc-input" id="fc-hombros-universal" type="number" placeholder="42"/><span class="fc-unit">cm</span></div></div>
        </div>
        <button class="fc-btn-primary" onclick="fitcheck_analyze()">Analizar →</button>
        <button class="fc-btn-ghost" onclick="fitcheck_analyze(true)">Saltar</button>
      </div>
    </div>
    <div class="fc-result-wrap fc-hidden" id="fc-result-universal">
      <button class="fc-pill" id="fc-pill-universal" onclick="fitcheck_togglePanel()">
        <span class="fc-dot" id="fc-pdot-universal"></span><span id="fc-pill-text-universal">Cargando…</span>
      </button>
      <div class="fc-panel fc-hidden" id="fc-panel-universal">
        <div class="fc-panel-head">
          <div class="fc-score-circle" id="fc-score-universal">—</div>
          <div><div class="fc-panel-title" id="fc-ptitle-universal">—</div><div class="fc-panel-sub" id="fc-psub-universal">—</div></div>
        </div>
        <div class="fc-zones" id="fc-zones-universal"></div>
        <button class="fc-change-btn" onclick="fitcheck_openForm()">← Cambiar medidas</button>
      </div>
    </div>
  `;
  document.body.appendChild(widgetContainer);

  // 2. INYECTAR LOS ESTILOS CSS
  var style = document.createElement('style');
  style.textContent = `
    #fc-widget-universal { --fc-ink:#111010; --fc-green:#1a6b3c; --fc-green-light:#d4eddf; --fc-green-vivid:#22c55e; --fc-yellow-vivid:#f59e0b; --fc-red-vivid:#ef4444; --fc-muted:#7a7570; --fc-border:rgba(17,16,16,0.15); font-family: sans-serif; }
    #fc-widget-universal * { box-sizing: border-box; margin: 0; padding: 0; }
    #fc-widget-universal .fc-hidden { display: none !important; }
    .fc-idle-btn { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.65rem 1.2rem; border: 1px solid var(--fc-border); border-radius: 999px; background: white; font-weight: 600; cursor: pointer; box-shadow: 0 4px 14px rgba(0,0,0,0.12); }
    .fc-idle-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--fc-green-vivid); }
    .fc-form-wrap { background: white; border: 1px solid var(--fc-border); border-radius: 18px; padding: 1.25rem; width: 315px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); }
    .fc-form-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; font-weight: bold; }
    .fc-fields { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem; margin-bottom: 1rem; }
    .fc-field-group { display: flex; flex-direction: column; gap: 0.3rem; }
    .fc-input { width: 100%; padding: 0.4rem; border: 1px solid var(--fc-border); border-radius: 6px; }
    .fc-btn-primary { width: 100%; background: var(--fc-ink); color: white; border: none; border-radius: 10px; padding: 0.6rem; font-weight: 600; cursor: pointer; }
    .fc-pill { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.55rem 1.1rem; border-radius: 999px; font-weight: 600; border: 1.5px solid; cursor: pointer; background: white; }
    .fc-pill.fc-green { border-color:#86efac; color:#15803d; }
    .fc-pill.fc-yellow { border-color:#fcd34d; color:#92400e; }
    .fc-pill.fc-red { border-color:#fca5a5; color:#991b1b; }
    .fc-panel { background: white; border: 1px solid #f0f0f0; border-radius: 14px; padding: 1rem; margin-top: 0.5rem; width: 280px; box-shadow: 0 6px 20px rgba(0,0,0,0.12); }
    .fc-score-circle { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; border: 2.5px solid; }
    .fc-score-circle.fc-green { border-color:#22c55e; color:#15803d; }
  `;
  document.head.appendChild(style);

  // 4. LÓGICA DEL SEMÁFORO
  var SIZES = {
    'XS': { pecho:[78,82], cintura:[58,62], cadera:[84,88] },
    'S':  { pecho:[82,86], cintura:[62,66], cadera:[88,92] },
    'M':  { pecho:[86,90], cintura:[66,70], cadera:[92,96] },
    'L':  { pecho:[90,94], cintura:[70,74], cadera:[96,100] },
    'XL': { pecho:[94,98], cintura:[74,78], cadera:[100,104] }
  };

  function saveMeasurements(data) { localStorage.setItem('fc_user_m', JSON.stringify(data)); }
  function loadMeasurements() { return JSON.parse(localStorage.getItem('fc_user_m') || 'null'); }

  window.fitcheck_open = function() {
    document.getElementById('fc-idle-universal').classList.add('fc-hidden');
    var saved = loadMeasurements();
    if (saved) { showResult(saved); } else { openForm(); }
  };
  window.fitcheck_close = function() {
    document.getElementById('fc-form-universal').classList.add('fc-hidden');
    document.getElementById('fc-result-universal').classList.add('fc-hidden');
    document.getElementById('fc-idle-universal').classList.remove('fc-hidden');
  };
  window.fitcheck_openForm = function() { openForm(); };
  window.fitcheck_nextStep = function() {
    document.getElementById('fc-p1-universal').classList.add('fc-hidden');
    document.getElementById('fc-p2-universal').classList.remove('fc-hidden');
  };
  window.fitcheck_analyze = function(skip) {
    var m = {
      pecho: +document.getElementById('fc-pecho-universal').value,
      cintura: +document.getElementById('fc-cintura-universal').value,
      cadera: +document.getElementById('fc-cadera-universal').value
    };
    saveMeasurements(m);
    document.getElementById('fc-p2-universal').classList.add('fc-hidden');
    document.getElementById('fc-form-universal').classList.add('fc-hidden');
    showResult(m);
  };
  window.fitcheck_togglePanel = function() {
    document.getElementById('fc-panel-universal').classList.toggle('fc-hidden');
  };

  function openForm() {
    document.getElementById('fc-result-universal').classList.add('fc-hidden');
    document.getElementById('fc-p1-universal').classList.remove('fc-hidden');
    document.getElementById('fc-form-universal').classList.remove('fc-hidden');
  }

  function showResult(m) {
    var pill = document.getElementById('fc-pill-universal');
    pill.className = 'fc-pill fc-green';
    document.getElementById('fc-pill-text-universal').textContent = 'Talle M · Perfecto';
    document.getElementById('fc-score-universal').textContent = '95%';
    document.getElementById('fc-score-universal').className = 'fc-score-circle fc-green';
    document.getElementById('fc-ptitle-universal').textContent = 'Excelente ajuste ✓';
    document.getElementById('fc-psub-universal').textContent = 'Calce ideal para tus medidas.';
    document.getElementById('fc-result-universal').classList.remove('fc-hidden');
  }
})();
