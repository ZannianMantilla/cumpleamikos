'use strict';

/* ============================================================
   CONFIG — ajustes fáciles de tocar
   ============================================================ */

const CONFIG = {
  // Cambia esto a false para saltarte el primer conteo regresivo y probar
  // directamente la escena final mientras la desarrollas.
  countdownEnabled: true,
  // Fecha/hora objetivo del primer conteo (hora local del navegador).
  countdownTarget: '2026-10-21T00:00:00',

  // Igual que arriba, pero para el segundo conteo (después de la nave).
  countdown2Enabled: true,
  countdown2Target: '2026-10-23T00:00:00',
};

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

  armAnilloTrigger();
}

function armAnilloTrigger() {
  const card = document.querySelector('.element-card[data-element="anillo"]');
  if (!card) return;

  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');

  const trigger = () => {
    card.removeEventListener('click', trigger);
    card.removeEventListener('keydown', onKey);
    runApodo();
  };
  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      trigger();
    }
  };

  card.addEventListener('click', trigger);
  card.addEventListener('keydown', onKey);
}

async function runElementsAgain() {
  Ambient.setMood('elements');
  await Scenes.show('scene-elements');
  armAnilloTrigger();
}

/**
 * Escena de pregunta con validación: escribe la pregunta, muestra un input
 * y un botón "Volver". Se resuelve con 'correct' o 'back'. Reutilizable
 * para cualquier pregunta con una única respuesta correcta.
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

async function runApodo() {
  const outcome = await runQuestionScene({
    sceneId: 'scene-apodo',
    questionElId: 'text-apodo',
    inputElId: 'input-apodo',
    backBtnId: 'btn-apodo-back',
    question: '¿Cuál es tu apodo?',
    correctAnswer: 'cabezona',
    mood: 'apodo',
  });

  if (outcome === 'back') {
    await runElementsAgain();
    return;
  }

  await wait(2000);

  if (CONFIG.countdownEnabled) {
    await runCountdown();
  } else {
    await runFinal();
  }
}

async function runNaveQuestion() {
  const outcome = await runQuestionScene({
    sceneId: 'scene-nave',
    questionElId: 'text-nave',
    inputElId: 'input-nave',
    backBtnId: 'btn-nave-back',
    question: 'Si yo me llamo "jose" y tú "mon", ¿cómo se llamaría nuestra nave?',
    correctAnswer: 'olvido',
    mood: 'nave',
  });

  if (outcome === 'back') {
    await runElementsAgain();
    return;
  }

  // Al acertar "olvido", la música de adventure se corta de inmediato.
  // Nocturne no arranca aquí: lo hace runZaninas() justo cuando aparece
  // el texto "Me gusta mucho esta melodía".
  AudioController.stop();

  await wait(2000);

  if (CONFIG.countdown2Enabled) {
    await runCountdown2();
  } else {
    await runZaninas();
  }
}

/**
 * Escena de conteo regresivo hacia una fecha objetivo. Reutilizable para
 * cualquier par de ids de escena/dígitos.
 */
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

async function runCountdown() {
  await runCountdownScene({
    sceneId: 'scene-countdown',
    labelElId: 'text-countdown-label',
    daysId: 'cd-days',
    hoursId: 'cd-hours',
    minutesId: 'cd-minutes',
    secondsId: 'cd-seconds',
    target: CONFIG.countdownTarget,
    mood: 'countdown',
    labelText: 'Falta poco para lo siguiente',
  });
  await runFinal();
}

async function runCountdown2() {
  await runCountdownScene({
    sceneId: 'scene-countdown-2',
    labelElId: 'text-countdown-label-2',
    daysId: 'cd2-days',
    hoursId: 'cd2-hours',
    minutesId: 'cd2-minutes',
    secondsId: 'cd2-seconds',
    target: CONFIG.countdown2Target,
    mood: 'countdown2',
    labelText: 'Un poco más de paciencia',
  });
  await runZaninas();
}

/* ============================================================
   Texto "inicial": la carta de cumpleaños que aparece debajo de
   la imagen final (rostro.jpeg → editada.png) y también se reutiliza
   en la escena de zaninas.
   ============================================================ */
const INICIAL_NICOL = [
  'Buen día, cabezona. Te habla Zannián, pero no el churco que apodaste como «rulos», no... Te hablo de este Zannián: el que no tiene un género, el que carece de un lunar cerca de su ojo derecho y que perdió su piel. ¿Te diste cuenta de lo curioso que es? Detenerse a pensar que asociamos con mayor facilidad a las personas que queremos con su ente superficial, su carne y sus huesos, pero no por las razones que las hacen ser ellas.',
  'Pasando de página, quería desearte un cumpleaños espectacular. Aunque nuestra amistad parece no ser la más cercana, de lo que me has podido dar a conocer de ti, lo que más resalta es tu gran fuerza de voluntad. Sé que no es fácil seguir adelante con situaciones tan complejas, y más con un pasado tan problemático, pero resulta esperanzador verte querer un futuro brillante para ti. Considero que eso dice mucho sobre quién eres.',
  'Como amigo tuyo, lo que me hace ilusión es saber que te encuentras bien, por lo que espero que la relación con Daniel prospere y sea lo que siempre estuviste esperando para impulsarte. Ojalá se enamore de tus defectos, como tu linda habla incesante; que se preocupe el día que ya no salga una palabra de tu boca; que se ría cuando te vea pensar en voz alta cada pensamiento que se te ocurra en el momento y sonría al ver tu lenguaje corporal cuando expresas alguna situación de tu entorno; que vea los sutiles, pero bellos, detalles que tiene tu ruidosa alma.',
  'Espero que este proceso te ayude a aliviar tus malos hábitos o pensamientos; que, aparte de tener una cara bonita, también tengas una vida bonita. Ya con eso no tendrás esa sensación de que el tiempo se te pasa volando.',
  'Sigue esforzándote como lo haces, maestra en filosofía, Nicol, y no olvides que se te quiere.',
];

/* ============================================================
   AQUÍ ESCRIBES TÚ EL TEXTO "INTERMEDIO"
   (el que aparece debajo de la imagen de zaninas)
   ============================================================ */
const INTERMEDIO_NICOL = [
  'Este párrafo será generalizado para hacerlo más fácil, no es una carta de suicidio porqué el cadáver ya está y lleva unos cuantos meses, esto es un tema serio para mí, no busco hacer drama pero si esto suena así para ustedes pueden cerrar está página e ir a comer mierda, puede que esto ya lo allá intentado con alguno antes pero por sentirme atado al cariño que les tenía me quedaba,',
  'considero que todos están locos pero cada uno tiene una demencia diferente, por ejemplo ustedes mismos, uno es violento, otro es obsesivo, otro fetiches retorcidos, etc.. yo por mi parte desde que era niño tuve el problema de ser demasiado consiente de mi entorno, me decepcioné de la vida e intenta nadar contra corriente todos estos años porque quería ser esa diferencia, que genuinamente las personas pudieran tener a alguien que sea su hogar sin prejuicios,',
  'evidentemente tuve errores pero con sinceridad simplemente intentaba ser una linda persona entré tanta mierda pero ya me quiero dejar llevar, por esta misma acción es que tomo la decisión de alejarme de ustedes, no me siento identificado ni con el nombre de "Zannián", estoy desechando toda esa vida, puede que técnicamente esto es decir que me raye pero como ya le comenté a alguno,',
  'no creo que un psicólogo sea la solución cuando el paciente sabe que es lo que le ocurre y no busca cooperar para "sanar" si no manejarlo a su manera, como les comenté a algunos estuve estudiando respecto a la psicología e hice un cuento sobre lo que encontré, de entre lo qué aprendí fueron mecanismos de ecpatia pero los lleve más al extremo y ya me incómodo lo suficiente seguir fingiendo ser lo que se supone que es "Zannián" ',
  'con el tiempo eliminaré mis redes y si alguno llega a contactarme por las nuevas estaré dispuesto a hablar si la intención es formar una nueva amistad, de lo contrario los trataré como si fueran mis exs, con esto no les prometo bienestar para mí vida, si me alejo es para que sé queden con la linda visión que tienen de el, la vida es demasiado corta como para detenerse a preocuparse por la ajena, tirense una chillada si lo necesitan y pasen página',
]; // <-- Escribe aquí tu texto, entre las comillas.

/* ============================================================
   AQUÍ ESCRIBES TÚ EL TEXTO "FINAL_NICOL"
   (aparece solo, sin imagen, justo después del mensaje
   "Ahora uno más personal"). Cada elemento del array es un
   párrafo/página; se navegan con las flechas prev/next, igual
   que el texto de INICIAL_NICOL.
   ============================================================ */
const FINAL_NICOL = [
  'Bueno Nicol ya es su parte explicativa, de mi parte diría que lo tienes re jodido, claramente no tienes una buena vida y ahora el que según bajo tus palabras era tu único amigo se va pa la mierda,',
  'parece una apuñalada del universo a tus ovarios, de verdad que te tratan como si fueras una oveja negra pero quién sabe si lo que le decías era cierto o parte de tu juegos de manipulación, ya ni porque seas mujer si no porque así de mierda creciste,',
  'evidentemente tuve errores pero con sinceridad simplemente intentaba ser una linda persona entré tanta mierda pero ya me quiero dejar llevar, por esta misma acción es que tomo la decisión de alejarme de ustedes, no me siento identificado ni con el nombre de "Zannián", estoy desechando toda esa vida, puede que técnicamente esto es decir que me raye pero como ya le comenté a alguno,',
  'créeme que eres indefendible, por parte de Zannián ojalá que su visión de ti se cumpla porqué la que te gusta mostrar al público parece ser que es la de ser el juguete de bonita cara de los niños y de esos hay en exageración en el mundo,',
  'suerte con la "soledad afectiva" que esto te ayude a pasar de página más fácil y que Zannián no sea una excusa para comprarte cuchillas',
];

/**
 * Muestra una lista de párrafos, uno a la vez, con Typewriter, y deja que el
 * usuario navegue entre ellos con las flechas prev/next (o ←/→). Devuelve una
 * promesa que se resuelve cuando se llega al último párrafo.
 */
async function runPaginatedText({ paragraphs, textElId, dotsWrapId, prevBtnId, nextBtnId, typeSpeed = 16, typeVariance = 10 }) {
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

async function runFinal() {
  Ambient.setMood('final');
  await Scenes.show('scene-final');

  const img = document.getElementById('final-image');
  if (img) {
    setTimeout(() => {
      img.classList.add('is-fading');
      setTimeout(() => {
        img.src = 'media/editada.png';
        img.classList.remove('is-fading');
      }, 520);
    }, 5000);

    img.addEventListener('error', () => {
      console.warn('No se pudo cargar una de las imágenes de la escena final.');
    });
  }

  const actions = document.getElementById('final-actions');
  const backBtn = document.getElementById('btn-final-back');
  const nextBtn = document.getElementById('btn-final-continue');

  await runPaginatedText({
    paragraphs: INICIAL_NICOL,
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
    const onBack = () => {
      cleanup();
      resolve('back');
    };
    const onNext = () => {
      cleanup();
      resolve('continue');
    };
    const cleanup = () => {
      backBtn.removeEventListener('click', onBack);
      nextBtn.removeEventListener('click', onNext);
    };
    backBtn.addEventListener('click', onBack);
    nextBtn.addEventListener('click', onNext);
  });

  backBtn.classList.remove('is-shown');
  nextBtn.classList.remove('is-shown');
  actions.hidden = true;

  if (outcome === 'back') {
    await runElementsAgain();
  } else {
    await runNaveQuestion();
  }
}

async function runZaninas() {
  Ambient.setMood('zaninas');
  await Scenes.show('scene-pre-zaninas');

  // Nocturne arranca justo cuando aparece el texto "Me gusta mucho esta
  // melodía" (la música de adventure ya se detuvo al acertar "olvido").
  AudioController.playNew('media/nocturne.mp3');

  const tw = new Typewriter(document.getElementById('text-pre-zaninas'), { speed: 38 });
  await tw.type('Me gusta mucho esta melodía');
  await wait(2000);

  await Scenes.show('scene-zaninas');

  await wait(1500);

  // Escribe el texto "intermedio" (definido arriba en INTERMEDIO_NICOL)
  // debajo de la imagen de zaninas.
  if (INTERMEDIO_NICOL.trim() !== '') {
    const twIntermedio = new Typewriter(document.getElementById('text-intermedio'), { speed: 20 });
    await twIntermedio.type(INTERMEDIO_NICOL);
    await wait(2000);
  }

  // Al terminar el texto intermedio, Scenes.show ya se encarga de que
  // todo (imagen incluida) desaparezca con un fundido antes de mostrar
  // la siguiente escena.
  await runPreFinalNicol();
}

async function runPreFinalNicol() {
  Ambient.setMood('final-nicol');
  await Scenes.show('scene-pre-final-nicol');

  const tw = new Typewriter(document.getElementById('text-pre-final-nicol'), { speed: 38 });
  await tw.type('Ahora uno más personal');
  await wait(2000);

  await runFinalNicol();
}

async function runFinalNicol() {
  await Scenes.show('scene-final-nicol');

  await runPaginatedText({
    paragraphs: FINAL_NICOL,
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