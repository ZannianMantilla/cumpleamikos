'use strict';

/* ============================================================
   CONTENIDO — aquí editas TODO lo que cambia entre personas.
   script.js es el "motor": recorre la ruta que se le pase y no
   tiene textos, fechas ni respuestas escritas dentro.

   Cada ruta se activa al tocar la tarjeta con el mismo nombre
   (data-element en index.html). Para agregar otra persona:
   copia un bloque de ROUTES, cámbiale la clave (p. ej. "cadena")
   y edita los valores.
   ============================================================ */

/* ---------- Textos de Nicol (ruta "anillo") ---------- */

const INICIAL_NICOL = [
  'Buen día, cabezona. Te habla Zannián, pero no el churco que apodaste como «rulos», no... Te hablo de este Zannián: el que no tiene un género, el que carece de un lunar cerca de su ojo derecho y que perdió su piel. ¿Te diste cuenta de lo curioso que es? Detenerse a pensar que asociamos con mayor facilidad a las personas que queremos con su ente superficial, su carne y sus huesos, pero no por las razones que las hacen ser ellas.',
  'Pasando de página, quería desearte un cumpleaños espectacular. Aunque nuestra amistad parece no ser la más cercana, de lo que me has podido dar a conocer de ti, lo que más resalta es tu gran fuerza de voluntad. Sé que no es fácil seguir adelante con situaciones tan complejas, y más con un pasado tan problemático, pero resulta esperanzador verte querer un futuro brillante para ti. Considero que eso dice mucho sobre quién eres.',
  'Como amigo tuyo, lo que me hace ilusión es saber que te encuentras bien, por lo que espero que la relación con Daniel prospere y sea lo que siempre estuviste esperando para impulsarte. Ojalá se enamore de tus defectos, como tu linda habla incesante; que se preocupe el día que ya no salga una palabra de tu boca; que se ría cuando te vea pensar en voz alta cada pensamiento que se te ocurra en el momento y sonría al ver tu lenguaje corporal cuando expresas alguna situación de tu entorno; que vea los sutiles, pero bellos, detalles que tiene tu ruidosa alma.',
  'Espero que este proceso te ayude a aliviar tus malos hábitos o pensamientos; que, aparte de tener una cara bonita, también tengas una vida bonita. Ya con eso no tendrás esa sensación de que el tiempo se te pasa volando.',
  'Sigue esforzándote como lo haces, maestra en filosofía, Nicol, y no olvides que se te quiere.',
];

const INTERMEDIO_NICOL = [
  'hola',
  'adios',
  // 'Primer párrafo del texto intermedio.',
]; // Cada elemento es una página. También sirve un solo string.

const FINAL_NICOL = [
  'hola',
  'adios',
  // 'Primer párrafo del texto final.',
]; // Cada elemento es una página. También sirve un solo string.

/* ---------- Textos de Nicolas (ruta "placas") ---------- */
/* TODO: escribe aquí los textos de Nicolas (cada elemento = una página). */

const INICIAL_NICOLAS = [
  'TODO: carta de Nicolas (página 1).',
];

const INTERMEDIO_NICOLAS = [
  'hola',
  'adios',
];

const FINAL_NICOLAS = [
  'hola',
  'adios',
];

/* ============================================================
   RUTAS
   ============================================================ */

const ROUTES = {
  /* ------------------ ANILLO → Nicol ------------------ */
  anillo: {
    apodo: {
      question: '¿Cuál es tu apodo?',
      answer: 'cabezona',
    },
    countdown1: {
      enabled: true, // false = se salta el conteo (útil para probar)
      target: '2026-10-21T00:00:00', // hora local del navegador
      label: 'Falta poco para lo siguiente',
    },
    final: {
      imageBefore: 'media/rostro.jpeg',
      imageAfter: 'media/editada.png',
      imageSwapDelay: 5000, // ms hasta cambiar de imagen
      paragraphs: INICIAL_NICOL,
    },
    nave: {
      question: 'Si yo me llamo "jose" y tú "mon", ¿cómo se llamaría nuestra nave?',
      answer: 'olvido',
    },
    countdown2: {
      enabled: true,
      target: '2026-10-23T00:00:00',
      label: 'Un poco más de paciencia',
    },
    zaninas: {
      preText: 'Me gusta mucho esta melodía',
      audio: 'media/nocturne.mp3',
      image: 'media/zaninas.png',
      paragraphs: INTERMEDIO_NICOL,
    },
    preFinal: {
      text: 'Ahora uno más personal',
    },
    finalText: FINAL_NICOL,
  },

  /* ------------------ PLACAS → Nicolas ------------------ */
  placas: {
    apodo: {
      question: '¿Un jugito de que?',
      answer: 'rokas', // TODO: apodo real (en minúsculas)
    },
    countdown1: {
      enabled: true,
      target: '2026-10-27T00:00:00', // 27 de octubre
      label: 'Falta poco para lo siguiente',
    },
    final: {
      imageBefore: 'media/rostro.jpeg', // TODO: foto de Nicolas
      imageAfter: 'media/editada.png', // TODO: versión editada de Nicolas
      imageSwapDelay: 5000,
      paragraphs: INICIAL_NICOLAS,
    },
    nave: {
      question: 'Aún si no cambiamos por fuera', // TODO: revisar pregunta
      answer: 'nuestro interior cambia continuamente', // TODO: revisar respuesta
    },
    countdown2: {
      enabled: true,
      target: '2026-10-29T00:00:00', // 29 de octubre
      label: 'Un poco más de paciencia',
    },
    zaninas: {
      preText: 'Me gusta mucho esta melodía',
      audio: 'media/nocturne.mp3',
      image: 'media/zaninas.png', // TODO: imagen de Nicolas
      paragraphs: INTERMEDIO_NICOLAS,
    },
    preFinal: {
      text: 'Ahora uno más personal',
    },
    finalText: FINAL_NICOLAS,
  },
};