'use strict';

/* ============================================================
   Motor de la experiencia. Los textos, respuestas, fechas e
   imágenes de cada persona viven en content.js (ROUTES).
   ============================================================ */

/* ============================================================
   TypeSound — clics de escritura sintetizados (sin archivos externos)
   ============================================================ */

const TypeSound = {
  ctx: null,
  master: null,
  noiseBuffer: null,
  ready: false,

  init() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.noiseBuffer = this._createNoiseBuffer();
      this.ready = true;
      this._armResume();
    } catch (err) {
      console.warn('Web Audio no disponible: se omite el sonido de escritura.');
    }
  },

  _createNoiseBuffer() {
    const duration = 0.14;
    const rate = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, Math.floor(rate * duration), rate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  },

  _armResume() {
    const resume = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    };
    window.addEventListener('pointerdown', resume, { passive: true });
    window.addEventListener('keydown', resume);
    window.addEventListener('touchstart', resume, { passive: true });
  },

  /**
   * Un "thock" suave y apagado, como escribir despacio en un teclado silencioso.
   * Ruido filtrado en vez de tonos, para que se sienta orgánico y relajante.
   */
  tick(char) {
    if (!this.ready || !this.ctx || this.ctx.state !== 'running') return;
    if (!char || /\s/.test(char)) return;

    try {
      const now = this.ctx.currentTime;
      const isPunctuation = /[.,;:!?]/.test(char);

      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;

      const body = this.ctx.createBiquadFilter();
      body.type = 'bandpass';
      body.frequency.value = (isPunctuation ? 320 : 420) + Math.random() * 220;
      body.Q.value = 0.7;

      const soften = this.ctx.createBiquadFilter();
      soften.type = 'lowpass';
      soften.frequency.value = 1400;

      const gain = this.ctx.createGain();
      const peak = isPunctuation ? 0.22 : 0.14;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.13);

      src.connect(body);
      body.connect(soften);
      soften.connect(gain);
      gain.connect(this.master);

      src.start(now);
      src.stop(now + 0.15);
    } catch (err) {
      /* fallo silencioso: el sonido nunca debe romper la experiencia */
    }
  },
};

/* ============================================================
   Typewriter — sistema reutilizable de escritura procedural
   ============================================================ */

class Typewriter {
  constructor(el, options = {}) {
    this.el = el;
    this.baseSpeed = options.speed ?? 34; // ms por caracter
    this.variance = options.variance ?? 16; // +/- ms aleatorio
    this.punctuationPause = options.punctuationPause ?? 170;
    this.showCaret = options.showCaret ?? true;
    this.sound = options.sound ?? true;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  _delay(ch) {
    if (this.reducedMotion) return 0;
    const jitter = (Math.random() * 2 - 1) * this.variance;
    let d = Math.max(12, this.baseSpeed + jitter);
    if (/[,;:]/.test(ch)) d += this.punctuationPause * 0.45;
    if (/[.!?]/.test(ch)) d += this.punctuationPause;
    return d;
  }

  /**
   * Escribe HTML de forma procedural respetando etiquetas (para permitir <em>, <strong>, etc).
   * Cada caracter se envuelve en un span que se desvanece suavemente al aparecer.
   * Devuelve una Promise que se resuelve al terminar.
   */
  type(html) {
    return new Promise((resolve) => {
      if (!this.el) return resolve();
      this.el.innerHTML = '';
      this._cancelled = false;

      const tokens = this._tokenize(html);
      let i = 0;
      let caret = null;

      if (this.showCaret && !this.reducedMotion) {
        caret = document.createElement('span');
        caret.className = 'caret';
        caret.textContent = '\u00A0';
        this.el.appendChild(caret);
      }

      const step = () => {
        if (this._cancelled) return resolve();

        if (i >= tokens.length) {
          if (caret) caret.remove();
          return resolve();
        }

        const token = tokens[i++];

        if (token.type === 'tag') {
          if (caret) {
            caret.insertAdjacentHTML('beforebegin', token.value);
          } else {
            this.el.insertAdjacentHTML('beforeend', token.value);
          }
          step();
          return;
        }

        const isSpace = /\s/.test(token.value);
        // Insertar el nodo directamente (sin pasar por parseo de HTML) es
        // más barato para el navegador que insertAdjacentHTML por carácter,
        // ya que evita crear y parsear una cadena nueva en cada paso.
        let node;
        if (this.reducedMotion || isSpace) {
          node = document.createTextNode(token.value);
        } else {
          node = document.createElement('span');
          node.className = 'ch';
          node.textContent = token.value;
        }

        if (caret) {
          this.el.insertBefore(node, caret);
        } else {
          this.el.appendChild(node);
        }

        if (this.sound && !isSpace) TypeSound.tick(token.value);

        if (this.reducedMotion) {
          step();
        } else {
          setTimeout(step, this._delay(token.value));
        }
      };

      step();
    });
  }

  cancel() {
    this._cancelled = true;
  }

  clear() {
    if (this.el) this.el.innerHTML = '';
  }

  /**
   * Divide un string HTML en tokens de caracter individual o etiquetas completas,
   * para poder animar el texto sin romper el marcado.
   */
  _tokenize(html) {
    const tokens = [];
    let i = 0;
    while (i < html.length) {
      if (html[i] === '<') {
        const end = html.indexOf('>', i);
        if (end === -1) {
          tokens.push({ type: 'char', value: html[i] });
          i++;
        } else {
          tokens.push({ type: 'tag', value: html.slice(i, end + 1) });
          i = end + 1;
        }
      } else {
        tokens.push({ type: 'char', value: html[i] });
        i++;
      }
    }
    return tokens;
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ============================================================
   Audio — autoplay con fallback de interacción
   ============================================================ */

const AudioController = {
  el: null,
  targetVolume: 0.35,
  unlocked: false,

  init() {
    this.el = document.getElementById('bg-audio');
    if (!this.el) return;

    this.el.volume = this.targetVolume;

    this.el.addEventListener('error', () => {
      console.warn('No se pudo cargar el audio de fondo.');
    });
  },

  /**
   * Intenta reproducir la canción con sonido y no se resuelve hasta que el
   * audio REALMENTE empieza a sonar (evento 'playing'). Si el navegador
   * bloquea el autoplay con sonido, muestra el prompt del Loader y reintenta
   * en cuanto el usuario toca. Si el archivo de audio falla por completo,
   * se resuelve de todos modos para no dejar al usuario atascado.
   */
  waitUntilPlaying() {
    if (!this.el) return Promise.resolve();

    return new Promise((resolve) => {
      let done = false;

      const finish = () => {
        if (done) return;
        done = true;
        this.el.removeEventListener('playing', onPlaying);
        this.el.removeEventListener('error', onError);
        this.unlocked = true;
        resolve();
      };

      const onPlaying = () => finish();
      const onError = () => finish();

      this.el.addEventListener('playing', onPlaying);
      this.el.addEventListener('error', onError);

      const attempt = () => {
        this.el.play().catch(() => {
          // El navegador bloqueó el autoplay con sonido: pedimos un toque.
          Loader.showPrompt(() => attempt());
        });
      };

      attempt();
    });
  },

  /**
   * Cambia la pista actual por otra, con un breve fade out/in.
   */
  async switchTrack(src) {
    if (!this.el) return;
    const wasPlaying = !this.el.paused;

    await new Promise((resolve) => {
      const start = this.el.volume;
      const step = () => {
        this.el.volume = Math.max(0, this.el.volume - 0.05);
        if (this.el.volume <= 0.001) {
          this.el.volume = 0;
          resolve();
        } else {
          requestAnimationFrame(step);
        }
      };
      if (start <= 0) resolve();
      else step();
    });

    this.el.src = src;
    this.el.load();

    if (wasPlaying || this.unlocked) {
      try {
        await this.el.play();
        this.unlocked = true;
      } catch (err) {
        console.warn('No se pudo reproducir la nueva pista de audio.');
      }
    }

    const fadeIn = () => {
      this.el.volume = Math.min(this.targetVolume, this.el.volume + 0.05);
      if (this.el.volume < this.targetVolume) requestAnimationFrame(fadeIn);
    };
    fadeIn();
  },

  /**
   * Detiene la pista actual de inmediato (sin fade), para el corte seco
   * al acertar "olvido": silencio hasta que arranque nocturne más adelante.
   */
  stop() {
    if (!this.el) return;
    this.el.pause();
  },

  /**
   * Arranca una pista nueva desde cero (con fade-in), asumiendo que no hay
   * nada sonando ya (por eso no necesita el fade-out de switchTrack).
   */
  async playNew(src) {
    if (!this.el) return;

    this.el.pause();
    this.el.src = src;
    this.el.load();
    this.el.volume = 0;

    try {
      await this.el.play();
      this.unlocked = true;
    } catch (err) {
      console.warn('No se pudo reproducir la nueva pista de audio.');
    }

    const fadeIn = () => {
      this.el.volume = Math.min(this.targetVolume, this.el.volume + 0.05);
      if (this.el.volume < this.targetVolume) requestAnimationFrame(fadeIn);
    };
    fadeIn();
  },
};

/* ============================================================
   Loader — pantalla de carga que espera a que suene la canción
   ============================================================ */

const Loader = {
  el: null,
  textEl: null,
  promptBtn: null,

  init() {
    this.el = document.getElementById('loader');
    this.textEl = document.getElementById('loader-text');
    this.promptBtn = document.getElementById('loader-prompt');
  },

  /**
   * Muestra el botón "Toca para comenzar" (solo aparece si el navegador
   * bloqueó el autoplay con sonido) y ejecuta onTap en el próximo clic,
   * que sí cuenta como interacción del usuario para poder reproducir audio.
   */
  showPrompt(onTap) {
    if (!this.promptBtn) return;
    if (this.textEl) this.textEl.textContent = 'Toca para comenzar';

    this.promptBtn.hidden = false;
    void this.promptBtn.offsetWidth;
    this.promptBtn.classList.add('is-shown');

    const handler = () => {
      this.promptBtn.removeEventListener('click', handler);
      this.promptBtn.classList.remove('is-shown');
      if (this.textEl) this.textEl.textContent = 'Cargando…';
      onTap();
    };
    this.promptBtn.addEventListener('click', handler);
  },

  hide() {
    if (!this.el) return;
    this.el.classList.add('is-hidden');
    const cleanup = () => {
      this.el.hidden = true;
      this.el.removeEventListener('transitionend', cleanup);
    };
    this.el.addEventListener('transitionend', cleanup);
  },
};

/* ============================================================
   Ambient — spotlight que sigue el cursor y tono por escena
   ============================================================ */

const Ambient = {
  layer: null,

  init() {
    this.layer = document.createElement('div');
    this.layer.className = 'ambient-spotlight';
    document.body.appendChild(this.layer);

    document.documentElement.style.setProperty('--mx', '50%');
    document.documentElement.style.setProperty('--my', '40%');

    // Agrupamos las actualizaciones en requestAnimationFrame: un pointermove
    // puede dispararse decenas o cientos de veces por segundo, pero solo
    // necesitamos actualizar el estilo una vez por frame renderizado.
    let pendingX = null;
    let pendingY = null;
    let rafScheduled = false;

    const flush = () => {
      rafScheduled = false;
      const vx = (pendingX / window.innerWidth) * 100;
      const vy = (pendingY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--mx', `${vx}%`);
      document.documentElement.style.setProperty('--my', `${vy}%`);
    };

    const move = (x, y) => {
      pendingX = x;
      pendingY = y;
      if (!rafScheduled) {
        rafScheduled = true;
        requestAnimationFrame(flush);
      }
    };

    window.addEventListener(
      'pointermove',
      (e) => move(e.clientX, e.clientY),
      { passive: true }
    );

    window.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches && e.touches[0]) {
          move(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: true }
    );
  },

  setMood(mood) {
    document.body.setAttribute('data-mood', mood);
  },
};

/* ============================================================
   Scene Manager
   ============================================================ */

const Scenes = {
  stage: null,
  current: null,

  init() {
    this.stage = document.getElementById('stage');
  },

  get(id) {
    return document.getElementById(id);
  },

  async show(id) {
    const next = this.get(id);
    if (!next) {
      console.error(`Escena no encontrada: ${id}`);
      return;
    }

    if (this.current && this.current !== next) {
      const prev = this.current;
      prev.classList.add('is-leaving');
      prev.classList.remove('is-visible');
      await wait(600);
      prev.hidden = true;
      prev.classList.remove('is-leaving');
    }

    next.hidden = false;
    // forzar reflow para permitir la transición
    void next.offsetWidth;
    next.classList.add('is-visible');
    this.current = next;
  },
};

/* ============================================================
   Secuencia narrativa
   ============================================================ */

async function runIntro() {
  Ambient.setMood('intro');
  await Scenes.show('scene-intro');
  const tw = new Typewriter(document.getElementById('text-intro'), { speed: 38 });
  await tw.type('Escuchen este temazo');
  await wait(2000);
}

async function runHorrocrux() {
  Ambient.setMood('horrocrux');
  await Scenes.show('scene-horrocrux');

  const twTitle = new Typewriter(document.getElementById('text-horrocrux-title'), {
    speed: 78,
    showCaret: false,
  });
  await twTitle.type('HORROCRUX');
  await wait(280);

  const twBody = new Typewriter(document.getElementById('text-horrocrux-body'), { speed: 18 });
  await twBody.type(
    'Un horrocrux es un objeto o ser vivo en el que un <em>mago</em> o <em>bruja oscuro</em> oculta un fragmento de su alma con el fin de alcanzar la <em>inmortalidad</em>. Este concepto pertenece al universo de la saga Harry Potter.'
  );
  await wait(2000);

  const btn = document.getElementById('btn-continue');
  btn.hidden = false;
  void btn.offsetWidth;
  btn.classList.add('is-shown');

  await new Promise((resolve) => {
    const onClick = () => {
      btn.removeEventListener('click', onClick);
      resolve();
    };
    btn.addEventListener('click', onClick);
  });
}

async function runElements() {
  Ambient.setMood('elements');
  await Scenes.show('scene-elements');

  const cards = Array.from(document.querySelectorAll('.element-card'));
  cards.forEach((card) => {
    const img = card.querySelector('.element-card__image');
    if (img) {
      img.addEventListener(
        'error',
        () => {
          const frame = card.querySelector('.element-card__frame');
          if (!frame) return;
          img.remove();
          const fallback = document.createElement('div');
          fallback.className = 'element-card__image--fallback';
          fallback.textContent = img.alt || '';
          frame.appendChild(fallback);
        },
        { once: true }
      );
    }
  });

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  for (let i = 0; i < cards.length; i++) {
    cards[i].classList.add('is-in');
    if (!reduced) await wait(140);
  }

  armRouteTriggers();
}

/**
 * Escena de pregunta con validación: escribe la pregunta, muestra un input
 * y un botón "Volver". Se resuelve con "correct" o "back".
 */
async function runQuestionScene({ sceneId, questionElId, inputElId, backBtnId, question, correctAnswer, mood }) {
  Ambient.setMood(mood);
  await Scenes.show(sceneId);

  const tw = new Typewriter(document.getElementById(questionElId), { speed: 34 });
  await tw.type(question);

  const input = document.getElementById(inputElId);
  const backBtn = document.getElementById(backBtnId);

  input.value = '';
  input.disabled = false;
  input.classList.remove('is-correct', 'is-wrong');
  void input.offsetWidth;
  input.focus();

  backBtn.hidden = false;
  void backBtn.offsetWidth;
  backBtn.classList.add('is-shown');

  const outcome = await new Promise((resolve) => {
    const onAnimEnd = () => {
      if (input.classList.contains('is-wrong')) input.classList.remove('is-wrong');
    };
    const onInput = () => {
      if (input.classList.contains('is-wrong')) input.classList.remove('is-wrong');
    };

    const cleanup = () => {
      input.removeEventListener('keydown', onKeydown);
      input.removeEventListener('input', onInput);
      input.removeEventListener('animationend', onAnimEnd);
      backBtn.removeEventListener('click', onBack);
    };

    const attempt = () => {
      const value = input.value.trim().toLowerCase();
      if (value === correctAnswer) {
        input.disabled = true;
        input.classList.remove('is-wrong');
        void input.offsetWidth;
        input.classList.add('is-correct');
        cleanup();
        resolve('correct');
      } else {
        input.classList.remove('is-wrong');
        void input.offsetWidth;
        input.classList.add('is-wrong');
      }
    };

    const onKeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        attempt();
      }
    };

    const onBack = () => {
      cleanup();
      resolve('back');
    };

    input.addEventListener('keydown', onKeydown);
    input.addEventListener('input', onInput);
    input.addEventListener('animationend', onAnimEnd);
    backBtn.addEventListener('click', onBack);
  });

  backBtn.classList.remove('is-shown');
  backBtn.hidden = true;

  return outcome;
}

/** Escena de conteo regresivo hacia una fecha objetivo. */
async function runCountdownScene({ sceneId, labelElId, daysId, hoursId, minutesId, secondsId, target, mood, labelText }) {
  Ambient.setMood(mood);
  await Scenes.show(sceneId);

  const tw = new Typewriter(document.getElementById(labelElId), { speed: 30 });
  await tw.type(labelText);

  await new Promise((resolve) => {
    const targetTime = new Date(target).getTime();
    const elDays = document.getElementById(daysId);
    const elHours = document.getElementById(hoursId);
    const elMinutes = document.getElementById(minutesId);
    const elSeconds = document.getElementById(secondsId);
    const pad = (n) => String(Math.max(0, n)).padStart(2, '0');

    let timer = null;

    const tick = () => {
      const diff = targetTime - Date.now();

      if (diff <= 0) {
        elDays.textContent = '00';
        elHours.textContent = '00';
        elMinutes.textContent = '00';
        elSeconds.textContent = '00';
        if (timer) clearInterval(timer);
        resolve();
        return;
      }

      elDays.textContent = pad(Math.floor(diff / 86400000));
      elHours.textContent = pad(Math.floor((diff % 86400000) / 3600000));
      elMinutes.textContent = pad(Math.floor((diff % 3600000) / 60000));
      elSeconds.textContent = pad(Math.floor((diff % 60000) / 1000));
    };

    tick();
    timer = setInterval(tick, 1000);
  });
}

/** Texto paginado con Typewriter y flechas prev/next (o teclas ←/→). */
async function runPaginatedText({ paragraphs, textElId, dotsWrapId, prevBtnId, nextBtnId, typeSpeed = 16, typeVariance = 10 }) {
  paragraphs = normalizeParagraphs(paragraphs);
  if (paragraphs.length === 0) return;

  const textEl = document.getElementById(textElId);
  const dotsWrap = document.getElementById(dotsWrapId);
  const prevBtn = document.getElementById(prevBtnId);
  const nextPageBtn = document.getElementById(nextBtnId);

  dotsWrap.innerHTML = '';
  paragraphs.forEach(() => {
    const dot = document.createElement('span');
    dot.className = 'page-dot';
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  prevBtn.hidden = false;
  nextPageBtn.hidden = false;
  prevBtn.disabled = false;

  let canAdvance = false;
  let advanceResolver = null;

  const onPrevClick = () => {
    if (!canAdvance || prevBtn.disabled) return;
    if (advanceResolver) advanceResolver('prev');
  };
  const onNextClick = () => {
    if (!canAdvance) return;
    if (advanceResolver) advanceResolver('next');
  };
  const onKeydown = (e) => {
    if (!canAdvance) return;
    if (e.key === 'ArrowLeft') onPrevClick();
    if (e.key === 'ArrowRight') onNextClick();
  };

  prevBtn.addEventListener('click', onPrevClick);
  nextPageBtn.addEventListener('click', onNextClick);
  window.addEventListener('keydown', onKeydown);

  let i = 0;
  while (i < paragraphs.length) {
    dots.forEach((dot, idx) => dot.classList.toggle('is-active', idx === i));

    const isFirst = i === 0;
    const isLast = i === paragraphs.length - 1;
    prevBtn.disabled = isFirst;
    nextPageBtn.hidden = isLast;

    const tw = new Typewriter(textEl, { speed: typeSpeed, variance: typeVariance });
    await tw.type(paragraphs[i]);

    if (isLast) {
      await wait(900);
      break;
    }

    // A partir de aquí, la flecha derecha (o →) avanza y la izquierda (o ←) retrocede.
    canAdvance = true;
    const dir = await new Promise((resolve) => {
      advanceResolver = resolve;
    });
    canAdvance = false;
    advanceResolver = null;

    textEl.classList.add('is-page-out');
    await wait(420);
    textEl.innerHTML = '';
    textEl.classList.remove('is-page-out');

    i += dir === 'prev' ? -1 : 1;
  }

  prevBtn.removeEventListener('click', onPrevClick);
  nextPageBtn.removeEventListener('click', onNextClick);
  window.removeEventListener('keydown', onKeydown);
  prevBtn.hidden = true;
  nextPageBtn.hidden = true;
}

/* ============================================================
   Rutas: cada tarjeta (data-element) dispara su propia ruta
   ============================================================ */

/**
 * Activa las tarjetas que tienen una ruta definida en ROUTES. Al tocar
 * una, se desactivan todas (para no lanzar dos rutas a la vez) y arranca.
 */
function armRouteTriggers() {
  const disarmers = [];

  Object.keys(ROUTES).forEach((key) => {
    const card = document.querySelector(`.element-card[data-element="${key}"]`);
    if (!card) return;

    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');

    const trigger = () => {
      disarmers.forEach((disarm) => disarm());
      runRoute(key);
    };
    const onKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        trigger();
      }
    };
    const disarm = () => {
      card.removeEventListener('click', trigger);
      card.removeEventListener('keydown', onKey);
    };

    card.addEventListener('click', trigger);
    card.addEventListener('keydown', onKey);
    disarmers.push(disarm);
  });
}

async function runElementsAgain() {
  Ambient.setMood('elements');
  await Scenes.show('scene-elements');
  armRouteTriggers();
}

/* Ids del DOM de los dos conteos (compartidos por todas las rutas). */
const COUNTDOWN_SCENES = {
  first: {
    sceneId: 'scene-countdown',
    labelElId: 'text-countdown-label',
    daysId: 'cd-days',
    hoursId: 'cd-hours',
    minutesId: 'cd-minutes',
    secondsId: 'cd-seconds',
    mood: 'countdown',
  },
  second: {
    sceneId: 'scene-countdown-2',
    labelElId: 'text-countdown-label-2',
    daysId: 'cd2-days',
    hoursId: 'cd2-hours',
    minutesId: 'cd2-minutes',
    secondsId: 'cd2-seconds',
    mood: 'countdown2',
  },
};

function normalizeParagraphs(value) {
  if (typeof value === 'string') value = [value];
  if (!Array.isArray(value)) return [];
  return value.filter((p) => typeof p === 'string' && p.trim() !== '');
}

/**
 * Recorre una ruta completa:
 * apodo → [conteo 1] → carta → nave → [conteo 2] → zaninas → "más personal" → texto final.
 * Si en alguna pregunta o en la carta se elige volver, regresa a los elementos.
 */
async function runRoute(key) {
  const route = ROUTES[key];
  if (!route) {
    console.error(`Ruta no encontrada: ${key}`);
    return;
  }

  try {
    // 1. Apodo
    const apodo = await runQuestionScene({
      sceneId: 'scene-apodo',
      questionElId: 'text-apodo',
      inputElId: 'input-apodo',
      backBtnId: 'btn-apodo-back',
      question: route.apodo.question,
      correctAnswer: route.apodo.answer.trim().toLowerCase(),
      mood: 'apodo',
    });
    if (apodo === 'back') return runElementsAgain();

    await wait(2000);
    if (route.countdown1.enabled) {
      await runCountdownScene({
        ...COUNTDOWN_SCENES.first,
        target: route.countdown1.target,
        labelText: route.countdown1.label,
      });
    }

    // 2. Carta (imagen + texto paginado)
    const final = await runFinalScene(route);
    if (final === 'back') return runElementsAgain();

    // 3. Nave
    const nave = await runQuestionScene({
      sceneId: 'scene-nave',
      questionElId: 'text-nave',
      inputElId: 'input-nave',
      backBtnId: 'btn-nave-back',
      question: route.nave.question,
      correctAnswer: route.nave.answer.trim().toLowerCase(),
      mood: 'nave',
    });
    if (nave === 'back') return runElementsAgain();

    // Al acertar, la música de adventure se corta de inmediato; la nueva
    // pista arranca en runZaninas() cuando aparece su texto.
    AudioController.stop();
    await wait(2000);

    if (route.countdown2.enabled) {
      await runCountdownScene({
        ...COUNTDOWN_SCENES.second,
        target: route.countdown2.target,
        labelText: route.countdown2.label,
      });
    }

    // 4. Zaninas → "más personal" → texto final
    await runZaninas(route);
    await runPreFinal(route);
    await runFinalText(route);
  } catch (err) {
    console.error(`Error en la ruta "${key}":`, err);
  }
}

/* ============================================================
   Escenas de la ruta
   ============================================================ */

/** Imagen (antes → después) + carta paginada. Devuelve 'back' o 'continue'. */
async function runFinalScene(route) {
  Ambient.setMood('final');

  const img = document.getElementById('final-image');
  const timers = [];
  if (img) {
    img.classList.remove('is-fading');
    img.src = route.final.imageBefore;
    img.addEventListener(
      'error',
      () => console.warn('No se pudo cargar una de las imágenes de la escena final.'),
      { once: true }
    );
  }

  await Scenes.show('scene-final');

  if (img) {
    timers.push(
      setTimeout(() => {
        img.classList.add('is-fading');
        timers.push(
          setTimeout(() => {
            img.src = route.final.imageAfter;
            img.classList.remove('is-fading');
          }, 520)
        );
      }, route.final.imageSwapDelay)
    );
  }

  const actions = document.getElementById('final-actions');
  const backBtn = document.getElementById('btn-final-back');
  const nextBtn = document.getElementById('btn-final-continue');

  await runPaginatedText({
    paragraphs: route.final.paragraphs,
    textElId: 'text-final',
    dotsWrapId: 'final-dots',
    prevBtnId: 'btn-final-prev',
    nextBtnId: 'btn-final-next-page',
  });

  actions.hidden = false;
  void actions.offsetWidth;
  backBtn.classList.add('is-shown');
  nextBtn.classList.add('is-shown');

  const outcome = await new Promise((resolve) => {
    const cleanup = () => {
      backBtn.removeEventListener('click', onBack);
      nextBtn.removeEventListener('click', onNext);
    };
    const onBack = () => {
      cleanup();
      resolve('back');
    };
    const onNext = () => {
      cleanup();
      resolve('continue');
    };
    backBtn.addEventListener('click', onBack);
    nextBtn.addEventListener('click', onNext);
  });

  timers.forEach(clearTimeout);
  backBtn.classList.remove('is-shown');
  nextBtn.classList.remove('is-shown');
  actions.hidden = true;

  return outcome;
}

async function runZaninas(route) {
  const cfg = route.zaninas;
  Ambient.setMood('zaninas');

  const img = document.getElementById('zaninas-image');
  if (img) img.src = cfg.image;

  await Scenes.show('scene-pre-zaninas');

  // La pista nueva arranca justo cuando aparece el texto.
  AudioController.playNew(cfg.audio);

  const tw = new Typewriter(document.getElementById('text-pre-zaninas'), { speed: 38 });
  await tw.type(cfg.preText);
  await wait(2000);

  await Scenes.show('scene-zaninas');
  await wait(1500);

  const intermedio = normalizeParagraphs(cfg.paragraphs);
  if (intermedio.length > 0) {
    await runPaginatedText({
      paragraphs: intermedio,
      textElId: 'text-intermedio',
      dotsWrapId: 'intermedio-dots',
      prevBtnId: 'btn-intermedio-prev',
      nextBtnId: 'btn-intermedio-next-page',
      typeSpeed: 20,
    });
    await wait(2000);
  }
}

async function runPreFinal(route) {
  Ambient.setMood('final-nicol');
  await Scenes.show('scene-pre-final-nicol');

  const tw = new Typewriter(document.getElementById('text-pre-final-nicol'), { speed: 38 });
  await tw.type(route.preFinal.text);
  await wait(2000);
}

async function runFinalText(route) {
  await Scenes.show('scene-final-nicol');

  await runPaginatedText({
    paragraphs: route.finalText,
    textElId: 'text-final-nicol',
    dotsWrapId: 'final-nicol-dots',
    prevBtnId: 'btn-final-nicol-prev',
    nextBtnId: 'btn-final-nicol-next-page',
  });
}

async function startExperience() {
  try {
    await runIntro();
    await runHorrocrux();
    await runElements();
  } catch (err) {
    console.error('Error en la secuencia de la experiencia:', err);
  }
}

/* ============================================================
   Bootstrap
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  try {
    Scenes.init();
    Ambient.init();
    TypeSound.init();
    AudioController.init();
    Loader.init();

    AudioController.waitUntilPlaying().then(() => {
      Loader.hide();
      startExperience();
    });
  } catch (err) {
    console.error('Fallo crítico al iniciar la experiencia:', err);
  }
});