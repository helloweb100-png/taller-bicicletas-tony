/* =====================================================================
   TALLER DE BICICLETAS TONY · script.js
   Sin dependencias externas: todo es JavaScript nativo, así la página
   se ve y funciona completa aunque falle cualquier CDN.
   Módulos: configuración · utilidades · WhatsApp · cargador · encabezado
   · revelado · motor de scroll · escena del hero · chispas · visuales de
   servicios · pintura · refacciones · horario en vivo · formulario · UX
   ===================================================================== */
(() => {
  'use strict';

  /* ---------- CONFIGURACIÓN (único lugar con el número) ---------- */
  // Número de WhatsApp del taller en formato internacional, sin "+" ni espacios.
  // Si queda vacío, el botón flotante y el envío del formulario se ocultan solos.
  const WHATSAPP_NUMBER = '525614897472';
  const NEGOCIO = 'Taller de Bicicletas Tony';
  const ZONA_HORARIA = 'America/Mexico_City';

  /* ---------- UTILIDADES ---------- */
  const root = document.documentElement;
  root.classList.add('js'); // los estados "ocultos" de las animaciones solo existen con JS

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINO = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const ESCRITORIO = window.matchMedia('(min-width: 960px)');
  const modulo = (nombre, fn) => {
    try { fn(); } catch (err) { console.warn(`[${NEGOCIO}] módulo "${nombre}" no se pudo iniciar`, err); }
  };

  /* ---------- WHATSAPP ---------- */
  const urlWhatsApp = (texto) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;

  function armarEnlaceWa(el) {
    el.href = urlWhatsApp(el.dataset.wa || `Hola, quiero información de ${NEGOCIO}.`);
    el.target = '_blank';
    el.rel = 'noopener';
  }

  function iniciarWhatsApp() {
    const enlaces = $$('[data-wa]');
    if (!WHATSAPP_NUMBER) {
      enlaces.forEach((el) => { el.hidden = true; });
      const tel = $('[data-contacto-tel]');
      if (tel) tel.hidden = true;
      const envio = $('[data-enviar]');
      if (envio) envio.hidden = true;
      const estado = $('#formEstado');
      if (estado) estado.textContent = 'Muy pronto podrás escribirnos por WhatsApp desde aquí.';
      return;
    }
    enlaces.forEach(armarEnlaceWa);
    const telTexto = $('[data-telefono]');
    if (telTexto) {
      const d = WHATSAPP_NUMBER.replace(/\D/g, '');
      const local = d.startsWith('52') ? d.slice(2) : d;
      telTexto.href = `tel:+${d}`;
      telTexto.textContent = `+${d.startsWith('52') ? '52 ' : ''}${local.slice(0, 2)} ${local.slice(2, 6)} ${local.slice(6)}`;
    }
  }

  /* ---------- CARGADOR ---------- */
  function iniciarCargador() {
    const cargador = $('#cargador');
    if (!cargador) return;
    const pct = $('#cargadorPct');
    const DURACION = 1250;
    let cerrado = false;
    const inicio = performance.now();

    const cerrar = () => {
      if (cerrado) return;
      cerrado = true;
      cargador.classList.add('is-salida');
      document.body.classList.add('is-listo');
      setTimeout(() => cargador.classList.add('is-fuera'), 720);
    };

    const paso = (t) => {
      const p = clamp((t - inicio) / DURACION);
      if (pct) pct.textContent = String(Math.round(easeInOut(p) * 100));
      if (p < 1) { requestAnimationFrame(paso); return; }
      if (document.readyState === 'complete') setTimeout(cerrar, 100);
      else window.addEventListener('load', () => setTimeout(cerrar, 100), { once: true });
    };
    requestAnimationFrame(paso);
    setTimeout(cerrar, 1600); // tope duro: nunca pasa de ~2.3 s en total
  }

  /* ---------- ENCABEZADO Y MENÚ ---------- */
  const estadoScroll = { y: 0, ultimo: 0, direccion: 1 };

  function iniciarMenu() {
    const enc = $('#encabezado');
    const btn = $('#menuBtn');
    const menu = $('#menu');
    if (!enc || !btn || !menu) return;
    const textoBtn = $('.menu-btn__texto', btn);

    const alternar = (abrir) => {
      enc.classList.toggle('menu-abierto', abrir);
      btn.setAttribute('aria-expanded', String(abrir));
      document.body.classList.toggle('menu-bloqueado', abrir);
      if (textoBtn) textoBtn.textContent = abrir ? 'Cerrar' : 'Menú';
    };
    btn.addEventListener('click', () => alternar(!enc.classList.contains('menu-abierto')));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) alternar(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') alternar(false); });
    ESCRITORIO.addEventListener('change', () => alternar(false));

    // Enlace activo según la sección visible
    const enlaces = $$('.menu__lista a[data-seccion]');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entradas) => {
        entradas.forEach((en) => {
          if (!en.isIntersecting) return;
          enlaces.forEach((a) => a.classList.toggle('is-actual', a.dataset.seccion === en.target.id));
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      enlaces.forEach((a) => { const s = document.getElementById(a.dataset.seccion); if (s) io.observe(s); });
    }
  }

  /* ---------- REVELADO AL HACER SCROLL ---------- */
  function iniciarRevelado() {
    const items = $$('[data-reveal]');
    if (!('IntersectionObserver' in window) || REDUCE) {
      items.forEach((el) => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach((el) => io.observe(el));
  }

  /* ---------- HORARIO EN VIVO ---------- */
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const INICIO_EJE = 9 * 60;
  const FIN_EJE = 21 * 60;

  function ahoraMexico() {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: ZONA_HORARIA, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' });
    const p = Object.fromEntries(f.formatToParts(new Date()).map((x) => [x.type, x.value]));
    const mapa = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { dia: mapa[p.weekday], min: Number(p.hour) * 60 + Number(p.minute) };
  }
  const aMinutos = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
  function formatoHora(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    const suf = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${suf}`;
  }

  function iniciarHorario() {
    const filas = $$('.horario__fila');
    if (!filas.length) return;
    const semana = {};
    filas.forEach((fila) => {
      const dias = (fila.dataset.dias || '').split(',').filter(Boolean).map(Number);
      dias.forEach((d) => { semana[d] = { abre: aMinutos(fila.dataset.abre), cierra: aMinutos(fila.dataset.cierra), fila }; });
    });

    const chip = $('[data-estado-chip]');
    const chipTexto = $('[data-estado-texto]');
    const card = $('.estado-card');
    const titulo = $('[data-estado-titulo]');
    const detalle = $('[data-estado-detalle]');

    function pintar() {
      const { dia, min } = ahoraMexico();
      const hoy = semana[dia];
      let abierto = false;
      let corto = '';
      let largo = '';
      if (hoy && min >= hoy.abre && min < hoy.cierra) {
        abierto = true;
        corto = `Abierto ahora · cierra a las ${formatoHora(hoy.cierra)}`;
        largo = `Cerramos hoy a las ${formatoHora(hoy.cierra)}. Pásate con tu bici.`;
      } else {
        let cuando = '';
        let prox = null;
        if (hoy && min < hoy.abre) { prox = hoy; cuando = 'hoy'; }
        else {
          for (let i = 1; i <= 7; i += 1) {
            const d = (dia + i) % 7;
            if (semana[d]) { prox = semana[d]; cuando = i === 1 ? 'mañana' : `el ${DIAS[d]}`; break; }
          }
        }
        if (prox) {
          corto = `Cerrado ahora · abrimos ${cuando} a las ${formatoHora(prox.abre)}`;
          largo = `Abrimos ${cuando} a las ${formatoHora(prox.abre)}. Escríbenos y te respondemos en cuanto abramos.`;
        }
      }
      [chip, card].forEach((el) => { if (!el) return; el.classList.toggle('is-abierto', abierto); el.classList.toggle('is-cerrado', !abierto && Boolean(corto)); });
      if (chipTexto && corto) chipTexto.textContent = corto;
      if (titulo && corto) titulo.textContent = abierto ? 'Abierto ahora' : 'Cerrado por ahora';
      if (detalle && largo) detalle.textContent = largo;

      filas.forEach((fila) => {
        const esHoy = hoy && hoy.fila === fila;
        fila.classList.toggle('is-hoy', Boolean(esHoy));
        if (esHoy) {
          const pos = clamp((min - INICIO_EJE) / (FIN_EJE - INICIO_EJE)) * 100;
          fila.style.setProperty('--ahora', `${pos}%`);
        }
      });
    }
    pintar();
    setInterval(pintar, 30000);
  }

  /* ---------- MOTOR DE SCROLL ---------- */
  const motor = { tareas: [], rate: 1, rateAplicado: 1, animaciones: [], vel: 0, y: -1, t: 0 };

  function iniciarMotor() {
    const encabezado = $('#encabezado');
    const barra = $('#progresoBarra');
    const heroContenido = $('.hero__contenido');
    const heroEscena = $('.hero__escena');
    const hero = $('#inicio');
    const manifiesto = $('[data-palabras]');
    const tarjetas = $$('[data-tarjeta]');
    const adentro = $('[data-expandir]');
    const riel = $('[data-ruta]');

    /* Palabras del manifiesto */
    let palabras = [];
    if (manifiesto && !REDUCE) palabras = dividirPalabras(manifiesto);
    let maxManifiesto = 0;
    let encendidas = 0;

    /* Pasos de la ruta */
    const pasos = $$('[data-paso]', riel || document);

    /* Tilt/ride del hero con el puntero */
    const puntero = { x: 0.5, y: 0.5, px: -100, py: -100, sx: 0.5, sy: 0.5 };
    if (FINO) {
      window.addEventListener('pointermove', (e) => {
        puntero.x = e.clientX / window.innerWidth;
        puntero.y = e.clientY / window.innerHeight;
        puntero.px = e.clientX;
        puntero.py = e.clientY;
      }, { passive: true });
    }

    /* Animaciones CSS del paisaje que aceleran con el scroll */
    setTimeout(() => {
      const nodos = $$('[data-ride]');
      motor.animaciones = nodos.flatMap((n) => (n.getAnimations ? n.getAnimations({ subtree: true }) : []));
    }, 600);

    /* Cursor personalizado (solo escritorio con ratón) */
    const cursor = $('#cursor');
    const cur = { x: -100, y: -100 };
    if (cursor && FINO && !REDUCE) {
      document.addEventListener('pointerover', (e) => {
        cursor.classList.toggle('is-hover', Boolean(e.target.closest('a, button, summary, label, input, select, textarea')));
      });
      document.addEventListener('pointerleave', () => cursor.classList.remove('is-activo'));
    }

    const medidas = { vh: window.innerHeight, topes: [] };
    const forzar = { v: true, t: 0 }; // fuerza un recálculo (resize, imágenes que cargan, etc.)
    const medir = () => {
      medidas.vh = window.innerHeight;
      medidas.topes = tarjetas.map((t) => parseFloat(getComputedStyle(t).top) || 0);
      forzar.v = true;
    };
    medir();
    window.addEventListener('resize', medir, { passive: true });
    window.addEventListener('load', medir, { once: true });

    let ultimoY = window.scrollY;
    let ultimoT = performance.now();

    function bucle(t) {
      const y = window.scrollY;
      const dt = Math.max(1, t - ultimoT);
      const velInst = ((y - ultimoY) / dt) * 1000;
      motor.vel = lerp(motor.vel, velInst, 0.15);
      ultimoY = y;
      ultimoT = t;
      motor.t = t;
      const vh = medidas.vh;
      // Solo se recalcula lo ligado al scroll si hubo scroll, resize o pasaron 400 ms (por si cargan imágenes)
      const actualizar = y !== motor.y || forzar.v || t - forzar.t > 400;
      motor.y = y;
      if (actualizar) { forzar.v = false; forzar.t = t; }

      /* --- LECTURAS --- */
      const docH = actualizar ? Math.max(document.body.scrollHeight, root.scrollHeight) : 1;
      const rTarj = actualizar ? tarjetas.map((c) => c.getBoundingClientRect()) : [];
      const rAdentro = actualizar && adentro ? adentro.getBoundingClientRect() : null;
      const rRiel = actualizar && riel ? riel.getBoundingClientRect() : null;
      const rMani = actualizar && manifiesto ? manifiesto.getBoundingClientRect() : null;

      /* --- ESCRITURAS --- */
      if (barra && actualizar) barra.style.setProperty('--p', String(clamp(y / Math.max(1, docH - vh))));

      if (encabezado && actualizar) {
        encabezado.classList.toggle('is-scroll', y > 24);
        const dir = y - estadoScroll.ultimo;
        if (Math.abs(dir) > 6) {
          encabezado.classList.toggle('is-oculto', dir > 0 && y > 260);
          estadoScroll.ultimo = y;
        }
      }

      // Hero: el contenido se aleja y la escena respira con el puntero
      if (hero) {
        const hp = clamp(y / (vh * 0.95));
        if (heroContenido && !REDUCE && ESCRITORIO.matches) {
          heroContenido.style.transform = `translate3d(0, ${(hp * 70).toFixed(1)}px, 0)`;
          heroContenido.style.opacity = String(1 - hp * 1.15);
        }
        if (heroEscena && !REDUCE) {
          puntero.sx = lerp(puntero.sx, puntero.x, 0.06);
          puntero.sy = lerp(puntero.sy, puntero.y, 0.06);
          const ry = (puntero.sx - 0.5) * 9;
          const rx = (0.5 - puntero.sy) * 6;
          heroEscena.style.transform = `perspective(1400px) translate3d(0, ${(hp * 50).toFixed(1)}px, 0) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${(1 - hp * 0.08).toFixed(3)})`;
        }
      }

      // Velocidad del paisaje según la velocidad del scroll
      if (motor.animaciones.length && !REDUCE) {
        const objetivo = 1 + clamp(Math.abs(motor.vel) / 3200, 0, 1) * 1.1;
        motor.rate = lerp(motor.rate, objetivo, 0.07);
        if (Math.abs(motor.rate - motor.rateAplicado) > 0.04) {
          motor.rateAplicado = motor.rate;
          motor.animaciones.forEach((a) => {
            try { a.updatePlaybackRate(motor.rate); } catch (e) { a.playbackRate = motor.rate; }
          });
        }
      }

      // Manifiesto: las palabras se encienden con el scroll (solo avanzan)
      if (palabras.length && rMani) {
        const p = clamp((vh * 0.88 - rMani.top) / (vh * 0.42 + rMani.height));
        maxManifiesto = Math.max(maxManifiesto, p);
        const n = Math.ceil(clamp(maxManifiesto * 1.12) * palabras.length);
        if (n !== encendidas) {
          for (let i = Math.min(n, encendidas); i < Math.max(n, encendidas); i += 1) palabras[i].classList.toggle('on', i < n);
          encendidas = n;
        }
      }

      // Tarjetas apiladas: la anterior se encoge y se oscurece cuando llega la siguiente
      if (actualizar) tarjetas.forEach((tarjeta, i) => {
        const siguiente = rTarj[i + 1];
        let t2 = 0;
        if (siguiente && !REDUCE) {
          const tope = medidas.topes[i + 1] || 0;
          t2 = clamp(1 - (siguiente.top - tope) / (vh * 0.85));
        }
        tarjeta.style.setProperty('--esc', (1 - t2 * 0.055).toFixed(4));
        tarjeta.style.setProperty('--dim', (t2 * 0.5).toFixed(3));

        const visual = $('.tarjeta__visual', tarjeta);
        const r = rTarj[i];
        const p = clamp((vh * 0.92 - r.top) / (vh * 0.55));
        if (visual) visual.style.setProperty('--p', p.toFixed(3));
        tarjeta.__p = p;
      });

      // Imagen que se abre en pantalla completa
      if (adentro && rAdentro) {
        const total = Math.max(1, rAdentro.height - vh);
        const p = clamp(-rAdentro.top / total);
        const e = easeOut(clamp(p / 0.58));
        const base = ESCRITORIO.matches ? { ix: 24, iy: 18 } : { ix: 7, iy: 22 };
        const marco = $('.adentro__marco', adentro);
        const texto = $('.adentro__texto', adentro);
        if (marco && !REDUCE) {
          marco.style.setProperty('--ix', `${(base.ix * (1 - e)).toFixed(2)}%`);
          marco.style.setProperty('--iy', `${(base.iy * (1 - e)).toFixed(2)}%`);
          marco.style.setProperty('--rr', `${(28 * (1 - e)).toFixed(1)}px`);
          marco.style.setProperty('--zoom', (1.28 - 0.28 * e).toFixed(3));
          marco.style.setProperty('--velo', (0.25 + e * 0.75).toFixed(3));
        }
        if (texto && !REDUCE) texto.style.setProperty('--t', clamp((p - 0.5) / 0.28).toFixed(3));
        adentro.style.setProperty('--p', p.toFixed(3));
      }

      // Ruta: la bici recorre el riel y activa cada parada
      if (riel && rRiel) {
        const p = clamp((vh * 0.62 - rRiel.top) / Math.max(1, rRiel.height));
        riel.style.setProperty('--prog', p.toFixed(3));
        const horizontal = ESCRITORIO.matches;
        pasos.forEach((paso) => {
          const frac = horizontal
            ? (paso.offsetLeft + paso.offsetWidth / 2) / riel.offsetWidth
            : (paso.offsetTop + paso.offsetHeight * 0.35) / riel.offsetHeight;
          paso.classList.toggle('is-activo', p >= (horizontal ? Math.min(frac, 0.95) - 0.16 : frac - 0.02));
        });
      }

      // Cursor personalizado
      if (cursor && FINO && !REDUCE && puntero.px > 0) {
        cur.x = lerp(cur.x, puntero.px, 0.2);
        cur.y = lerp(cur.y, puntero.py, 0.2);
        cursor.style.transform = `translate3d(${cur.x.toFixed(1)}px, ${cur.y.toFixed(1)}px, 0)`;
        cursor.classList.add('is-activo');
      }

      // Visuales que dibujan cada cuadro
      motor.tareas.forEach((fn) => fn(t));

      requestAnimationFrame(bucle);
    }
    requestAnimationFrame(bucle);
  }

  function dividirPalabras(el) {
    const caminante = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodos = [];
    while (caminante.nextNode()) nodos.push(caminante.currentNode);
    const spans = [];
    nodos.forEach((nodo) => {
      const frag = document.createDocumentFragment();
      nodo.nodeValue.split(/(\s+)/).forEach((trozo) => {
        if (!trozo) return;
        if (/^\s+$/.test(trozo)) { frag.appendChild(document.createTextNode(trozo)); return; }
        const s = document.createElement('span');
        s.className = 'w';
        s.textContent = trozo;
        frag.appendChild(s);
        spans.push(s);
      });
      nodo.parentNode.replaceChild(frag, nodo);
    });
    return spans;
  }

  /* ---------- VISUALES DE SERVICIOS ---------- */
  function iniciarVisuales() {
    // Marca cuándo cada visual está en pantalla (pausa sus animaciones si no)
    const visuales = $$('.tarjeta__visual');
    const vistos = new Map();
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entradas) => {
        entradas.forEach((en) => { en.target.classList.toggle('is-vista', en.isIntersecting); vistos.set(en.target, en.isIntersecting); });
      }, { threshold: 0.05 });
      visuales.forEach((v) => io.observe(v));
    } else {
      visuales.forEach((v) => { v.classList.add('is-vista'); vistos.set(v, true); });
    }

    /* 01 · Rin que se endereza al avanzar */
    const vizRin = $('[data-viz="rin"]');
    const aro = $('[data-rin-aro]');
    const grupoRayos = $('[data-rin-rayos]');
    if (vizRin && aro && grupoRayos) {
      const NS = 'http://www.w3.org/2000/svg';
      const cx = 150, cy = 150, R = 118, PUNTOS = 110, RAYOS = 24, BUJE = 14;
      const lineas = [];
      for (let i = 0; i < RAYOS; i += 1) {
        const l = document.createElementNS(NS, 'line');
        grupoRayos.appendChild(l);
        lineas.push(l);
      }
      const calibre = $('.rin-calibre', vizRin);
      const texto = $('[data-rin-texto]', vizRin);
      const estado = $('.viz__estado', vizRin);
      const tarjeta = vizRin.closest('[data-tarjeta]');
      let amp = 14;
      let rot = 0;
      const deformar = (th, a) => R + a * (0.68 * Math.sin(2 * th + 0.7) + 0.32 * Math.sin(3 * th + 1.9));

      const dibujar = () => {
        const objetivo = REDUCE ? 0 : (1 - clamp(tarjeta && tarjeta.__p !== undefined ? tarjeta.__p : 0)) * 14;
        amp = lerp(amp, objetivo, 0.09);
        rot += REDUCE ? 0 : 0.006;
        let d = '';
        for (let i = 0; i <= PUNTOS; i += 1) {
          const th = (i / PUNTOS) * Math.PI * 2;
          const r = deformar(th, amp);
          const x = cx + r * Math.cos(th + rot);
          const y = cy + r * Math.sin(th + rot);
          d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
        }
        aro.setAttribute('d', `${d}Z`);
        lineas.forEach((l, i) => {
          const th = (i / RAYOS) * Math.PI * 2;
          const r = deformar(th, amp) - 3;
          const a = th + rot;
          l.setAttribute('x1', (cx + BUJE * Math.cos(a + 0.35)).toFixed(2));
          l.setAttribute('y1', (cy + BUJE * Math.sin(a + 0.35)).toFixed(2));
          l.setAttribute('x2', (cx + r * Math.cos(a)).toFixed(2));
          l.setAttribute('y2', (cy + r * Math.sin(a)).toFixed(2));
        });
        if (calibre) {
          const thTop = -Math.PI / 2 - rot;
          const dev = deformar(thTop, amp) - R;
          calibre.style.transform = `translateY(${(-dev).toFixed(2)}px)`;
        }
        if (texto && estado) {
          const derecho = amp < 1.1;
          texto.textContent = derecho ? 'Rueda derecha' : amp < 6 ? 'Nivelando…' : 'Rueda chueca';
          estado.classList.toggle('is-ok', derecho);
        }
      };
      dibujar();
      motor.tareas.push(() => { if (vistos.get(vizRin) !== false) dibujar(); });
    }

    /* 02 · Cadena que se engrasa */
    const vizGrasa = $('[data-viz="grasa"]');
    if (vizGrasa) {
      const texto = $('[data-grasa-texto]', vizGrasa);
      const estado = $('.viz__estado', vizGrasa);
      const tarjeta = vizGrasa.closest('[data-tarjeta]');
      let anterior = '';
      motor.tareas.push(() => {
        const p = tarjeta && tarjeta.__p !== undefined ? tarjeta.__p : 0;
        const nuevo = p > 0.85 ? 'Cadena brillante' : p > 0.3 ? 'Engrasando…' : 'Cadena seca';
        if (nuevo !== anterior && texto && estado) {
          anterior = nuevo;
          texto.textContent = nuevo;
          estado.classList.toggle('is-ok', p > 0.85);
        }
      });
    }
  }

  /* ---------- SIMULADOR DE PINTURA ---------- */
  function iniciarPintura() {
    const viz = $('[data-viz="pintura"]');
    const tarjeta = viz ? viz.closest('[data-tarjeta]') : null;
    if (!viz || !tarjeta) return;
    const muestras = $$('.muestra', tarjeta);
    const nombre = $('[data-color-nombre]', tarjeta);
    const cta = $('[data-pintura-cta]', tarjeta);
    const texto = $('[data-horno-texto]', viz);
    const estado = $('.viz__estado', viz);
    let temporizador = 0;

    muestras.forEach((m) => {
      m.addEventListener('click', () => {
        muestras.forEach((o) => { o.classList.toggle('is-activa', o === m); o.setAttribute('aria-pressed', String(o === m)); });
        viz.style.setProperty('--pintura', m.dataset.color);
        if (nombre) nombre.textContent = m.dataset.nombre;
        if (cta && WHATSAPP_NUMBER) {
          cta.dataset.wa = `Hola, quiero una pintada al horno para mi bici en color ${m.dataset.nombre}. ¿Tienen ese color disponible?`;
          armarEnlaceWa(cta);
        }
        viz.classList.add('is-horneando');
        if (texto) texto.textContent = 'Horneando…';
        if (estado) estado.classList.remove('is-ok');
        clearTimeout(temporizador);
        temporizador = setTimeout(() => {
          viz.classList.remove('is-horneando');
          if (texto) texto.textContent = `Acabado ${m.dataset.nombre.toLowerCase()} listo`;
          if (estado) estado.classList.add('is-ok');
        }, 1500);
      });
    });
  }

  /* ---------- REFACCIONES: PUNTOS DE LA FOTO Y BUSCADOR ---------- */
  function iniciarRefacciones() {
    const pared = $('[data-pared]');
    if (pared) {
      const puntos = $$('.punto', pared);
      const leyenda = $('[data-leyenda]', pared);
      let actual = -1;
      let manual = false;
      const activar = (i) => {
        actual = i;
        puntos.forEach((p, j) => p.classList.toggle('is-activo', j === i));
        if (leyenda && puntos[i]) leyenda.textContent = puntos[i].dataset.punto;
      };
      puntos.forEach((p, i) => p.addEventListener('click', () => { manual = true; activar(i); }));
      let visible = false;
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0.3 }).observe(pared);
      }
      if (!REDUCE) {
        setInterval(() => { if (visible && !manual) activar((actual + 1) % puntos.length); }, 2600);
      } else if (leyenda) leyenda.textContent = 'Llantas, rines, puños, pedales, frenos y manubrios';
    }

    const buscador = $('[data-buscador]');
    if (buscador) {
      const piezas = $$('.pieza', buscador);
      const cta = $('[data-piezas-cta]', buscador);
      const texto = $('[data-piezas-texto]', buscador);
      const base = 'Pregunta por tu refacción';
      piezas.forEach((b) => {
        b.addEventListener('click', () => {
          b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
          const sel = piezas.filter((x) => x.getAttribute('aria-pressed') === 'true').map((x) => x.dataset.pieza);
          if (texto) texto.textContent = sel.length ? `Preguntar por ${sel.length} pieza${sel.length > 1 ? 's' : ''}` : base;
          if (cta && WHATSAPP_NUMBER) {
            cta.dataset.wa = sel.length
              ? `Hola, ¿tienen disponibles estas refacciones?: ${sel.join(', ')}. Gracias.`
              : 'Hola, busco una refacción para mi bici. ¿La tienen disponible?';
            armarEnlaceWa(cta);
          }
        });
      });
    }
  }

  /* ---------- FORMULARIO → WHATSAPP ---------- */
  function iniciarFormulario() {
    const form = $('#formContacto');
    if (!form) return;
    const estado = $('#formEstado');
    const aviso = (txt, ok) => { if (!estado) return; estado.textContent = txt; estado.classList.toggle('is-ok', Boolean(ok)); };
    const error = (campo, msg) => {
      const cont = form.querySelector(`[data-error="${campo}"]`);
      if (cont) { cont.textContent = msg; const padre = cont.closest('.campo'); if (padre) padre.classList.toggle('is-error', Boolean(msg)); }
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!WHATSAPP_NUMBER) { aviso('Por ahora no podemos abrir WhatsApp desde aquí.', false); return; }
      const datos = new FormData(form);
      const nombre = String(datos.get('nombre') || '').trim();
      const servicio = String(datos.get('servicio') || '');
      const tipo = String(datos.get('tipo') || '');
      const cuando = String(datos.get('cuando') || '');
      const mensaje = String(datos.get('mensaje') || '').trim();

      error('nombre', nombre.length < 2 ? 'Dinos tu nombre para saludarte.' : '');
      error('servicio', servicio ? '' : 'Elige qué necesita tu bici.');
      if (nombre.length < 2 || !servicio) {
        aviso('Revisa los campos marcados y vuelve a intentarlo.', false);
        const primero = form.querySelector('.is-error input, .is-error select');
        if (primero) primero.focus();
        return;
      }

      const lineas = [`Hola, soy ${nombre}. Vi la página de ${NEGOCIO}.`, `Necesito: ${servicio}.`];
      if (tipo) lineas.push(`Tipo de bici: ${tipo}.`);
      if (cuando) lineas.push(`Pienso pasar: ${cuando.toLowerCase()}.`);
      if (mensaje) lineas.push(`Detalles: ${mensaje}`);
      lineas.push('¿Me ayudan, por favor?');

      const enlace = document.createElement('a');
      enlace.href = urlWhatsApp(lineas.join('\n'));
      enlace.target = '_blank';
      enlace.rel = 'noopener';
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      aviso('¡Listo! Abrimos WhatsApp con tu mensaje. Solo falta enviarlo.', true);
    });

    form.addEventListener('input', (e) => {
      const nombre = e.target.name;
      if (nombre) error(nombre, '');
    });
  }

  /* ---------- INTERACCIONES (tilt 3D y botones magnéticos) ---------- */
  function iniciarInteracciones() {
    if (!FINO || REDUCE) return;
    $$('[data-tilt]').forEach((el) => {
      const zona = el.parentElement || el;
      zona.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', `${(x * 12).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${(-y * 12).toFixed(2)}deg`);
      });
      zona.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });

    $$('[data-magnetico]').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.translate = `${(x * 0.16).toFixed(1)}px ${(y * 0.22).toFixed(1)}px`;
      });
      el.addEventListener('pointerleave', () => { el.style.translate = '0 0'; });
    });
  }

  /* ---------- CHISPAS DEL HERO (canvas) ---------- */
  function iniciarChispas() {
    const canvas = $('#chispas');
    if (!canvas || REDUCE) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const hero = canvas.closest('.hero');
    const COLORES = ['255,226,26', '255,160,40', '229,52,45', '255,255,255'];
    let w = 0, h = 0, dpr = 1;
    let corriendo = false;
    let visible = true;
    const particulas = [];
    const puntero = { x: -999, y: -999 };

    const ajustar = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const nueva = (inicial) => ({
      x: Math.random() * w,
      y: inicial ? Math.random() * h : h + Math.random() * 30,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(0.25 + Math.random() * 1.1),
      r: 0.7 + Math.random() * 2.1,
      vida: Math.random(),
      color: COLORES[Math.floor(Math.random() * COLORES.length)],
      fase: Math.random() * Math.PI * 2,
    });

    const crear = () => {
      particulas.length = 0;
      const total = w < 700 ? 34 : 78;
      for (let i = 0; i < total; i += 1) particulas.push(nueva(true));
    };

    const dibujar = (t) => {
      if (!corriendo) return;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      particulas.forEach((p, i) => {
        p.fase += 0.02;
        p.x += p.vx + Math.sin(p.fase + t * 0.0004) * 0.35;
        p.y += p.vy;
        const dx = p.x - puntero.x;
        const dy = p.y - puntero.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 14000) {
          const f = (1 - d2 / 14000) * 2.2;
          p.x += (dx / (Math.sqrt(d2) + 1)) * f;
          p.y += (dy / (Math.sqrt(d2) + 1)) * f;
        }
        const alto = p.y / h;
        const alfa = clamp(alto * 1.6) * (0.35 + 0.65 * Math.abs(Math.sin(p.fase)));
        if (p.y < -10 || p.x < -20 || p.x > w + 20) { particulas[i] = nueva(false); return; }
        ctx.fillStyle = `rgba(${p.color},${(alfa * 0.18).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(${p.color},${alfa.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      });
      requestAnimationFrame(dibujar);
    };

    const arrancar = () => {
      const debe = visible && !document.hidden;
      if (debe && !corriendo) { corriendo = true; requestAnimationFrame(dibujar); }
      if (!debe) corriendo = false;
    };

    ajustar();
    crear();
    window.addEventListener('resize', () => { ajustar(); crear(); }, { passive: true });
    document.addEventListener('visibilitychange', arrancar);
    if (hero) {
      hero.addEventListener('pointermove', (e) => {
        const r = canvas.getBoundingClientRect();
        puntero.x = e.clientX - r.left;
        puntero.y = e.clientY - r.top;
      }, { passive: true });
      hero.addEventListener('pointerleave', () => { puntero.x = -999; puntero.y = -999; });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((en) => { visible = en[0].isIntersecting; arrancar(); }, { threshold: 0 }).observe(hero);
      }
    }
    arrancar();
  }

  /* ---------- ARRANQUE ---------- */
  iniciarCargador();
  const arranque = () => {
    modulo('whatsapp', iniciarWhatsApp);
    modulo('menu', iniciarMenu);
    modulo('revelado', iniciarRevelado);
    modulo('horario', iniciarHorario);
    modulo('visuales', iniciarVisuales);
    modulo('pintura', iniciarPintura);
    modulo('refacciones', iniciarRefacciones);
    modulo('formulario', iniciarFormulario);
    modulo('interacciones', iniciarInteracciones);
    modulo('chispas', iniciarChispas);
    modulo('motor', iniciarMotor);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arranque, { once: true });
  else arranque();
})();
