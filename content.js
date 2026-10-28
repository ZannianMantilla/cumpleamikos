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
  'Tuve que reescribir este texto en varios días porque sentía que, al principio, sonaba con rabia. Muchachos, esta sección es general para que el desarrollo sea más fácil. Quiero contarles que tengo pensado tomar distancia de ustedes.',
  'Es una decisión mía y no lo hago por “traicionar” a nadie ni nada parecido. Mi estado mental es deplorable y hay mucha rabia que no exteriorizo, justamente por mi forma tan calmada de ser.',
  'No es responsabilidad de ustedes; fue algo más de egoísmo propio. Pero sentí que para ustedes estaba olvidado: yo estaba ahí para atender sus problemas, pero cuando yo estaba mal no pensaron en meterme los dedos hasta la garganta para que les dijera qué pasaba conmigo, así como yo hacía con ustedes.',
  'Por eso también me siento fatigado a nivel empático; ni siquiera me reconozco a mí mismo como “Zannián” o como lo que se supone que él es.',
  'Alguno de ustedes ya lo sabe, porque fue el único que se interesó por mi bienestar. Gracias por dejarme ser un pilar emocional en sus vidas y por confiar en mí para desahogarse.',
  'Son personas maravillosas; con algunos defectos, como todos, pero me permitieron conocer una parte muy linda de cada uno.',
  'Cuiden también su salud mental, y espero que les vaya bien en todo lo que se les atraviese en la vida.',
  'No hagan show ni nada parecido, porque no quiero preocupar a nadie.',
  'Solo quiero muuucho espacio. Los quiero mucho.',
]; 

/* ---------- Textos de Nicolas (ruta "placas") ---------- */
/* TODO: escribe aquí los textos de Nicolas (cada elemento = una página). */

const INICIAL_NICOLAS = [
  '¿Qué pasa, superñaiñe? Feliz cumpleaños, care loco, espero que se encuentre muy bien. Le habla Zannián, pero no el churco prófugo de Playboy, alias Rokas,',
  'no... Le habla este Zannián. La verdad, es una chimba poder decir que llevo siendo amigo del mismo man desde los 11 años, en sexto de secundaria, cuando nos volvimos amigos',
  'porque estaba lloviendo en el colegio y me preguntó en las escaleras de la cancha si yo sabía qué era Naruto. Con el tiempo nos distanciamos y ambos sufrimos cambios,',
  'aunque usted fue quien pasó por los más abruptos. Aun así, cuando parchamos vuelve a ser el mismo pendejo al que le toca enseñar a instalar un mod en Minecraft.',
  'Espero que lo de su carrera, como lo de las cruces, deje de ser tanto blah blah blah, porque usted de verdad tiene mucho potencial. Ya sabe que no apoyo su género, pero su capacidad lírica es bastante buena.',
  'Ya es un gran artista; lo único que le falta es un foco que lo dé a conocer. Sabe que siempre lo consideraré mi hermano, aunque seamos muy distintos en nuestra forma de pensar, y que pasar tiempo con usted es una chimba.',
  'Espero que para su próximo pumpeaños se consiga a una mujer que lo ame realmente por ser Nicolás.',
  'Ojalá pueda verlo, aunque sea de lejos, cumplir sus metas, rodeado de éxito y sin que nunca le falte amor. Lo amo con mi alma, hermanito mío.',
];

const INTERMEDIO_NICOLAS = INTERMEDIO_NICOL; // mismo texto intermedio para todos

/* ---------- Textos de Wast (ruta "oso") ---------- */

const INICIAL_WAST = [
  'Jelou, pandebona divina, feliz cumpleaños, nihilista fastidiosa. Espero que hoy sea un día maravilloso para ti.',
  'En esta ocasión te habla Zannián, pero no el churco prófugo de Playboy, alias Rokas, no... Te habla este Zannián.',
 'Quiero decirte que conocerte fue algo increíble. Me encanta la persona que eres, con una personalidad amarga que esconde que eres un pan de Dios. Es admirable lo inteligente que eres y lo talentosa que eres para el dibujo;',
 'siempre me maravilló tu arte, aunque ciertas obras no tuvieran una temática agradable. El chiste de ser gemelos se difumina mucho, sobre todo porque cuando algo malo le pasa a uno, al otro le ocurre algo similar.',
 'Sería muy lindo ver en un futuro que solo necesites de tu arte para vivir, que te realices como persona y, sobre todo, que te sientas feliz con el hombre que tanto amas actualmente.',
 'Mucho bienestar para ambos, y para ti, espero que disfrutes de la vida, mi gemela hermosa.',
 'Me siento orgulloso de ser tan cercano a ti. Te quiero mucho, wasesina.',
];

/* ---------- Textos de Ñoño (ruta "cadena") ---------- */

const INICIAL_CADENA = [
  'Socio, usted es el único de mis amigos que no cumple años ahorita, entonces pailas, me tocó adelantarme, JASKJA.',
'En esta ocasión le habla Zannián, pero no el churco prófugo de Playboy, alias Rokas, no... Le habla este Zannián. Manito, espero que se encuentre bien, que Till Lindemann me lo bendiga, socio.',
'Que le vaya muy bien en su carrera de filmmaker, porque usted tiene una mente sumamente dinámica, no creativa, pero sí dinámica, JASKJ.',
'No sé nada sobre su situación actual, pero me alegraría saber que encontró a una mujer que lo quiera tal cual como es y que toda su familia se encuentre estable.',
'Qué chimba decir que llevamos tanto tiempo siendo amigos, que tengo un parcerito que copea para todo y que toma chimba de fotos.',
'Cuide mucho a su motico y cuídese mucho usted.',
];

/* ---------- Textos de Viridiana (ruta "libro") ---------- */

const INICIAL_LIBRO = [
  'Señorita Viridiana, tu madre te colocó unos nombres tan hermosos. ¿Cómo revocarte el placer de estar aquí si, aun después de tanto, te sigo queriendo y amando? No te confundas: amo que la vida pueda experimentar lo que es tenerte en ella. Y aunque tal vez romantice mucho quién eres, supongo que solo expreso el agradecimiento que siente el que late en mi pecho.',
  'Vi lo de Komanche. Obvio, lo reconocía, pero nunca lo consumí; aun así, siento que, sin querer, él me ayudó a recapacitar. Que descanse en paz.',
  'Sé que sueno a lamebotas, pero de verdad eres la única persona en la que siento que podía apoyarme, en lugar de ser yo quien tiene que apoyar. Perdón por aquellas veces que fui grosero contigo, por las veces que te hice llorar o enojar. Hablar contigo me salvó muchas veces.',
  'Voy a agarrar mi bolita de esperanza actual para ser un buen hombre; que a Kenai le falte el ADN de papá, pero nunca su corazón. Gracias por prestar atención a mis problemas, Keni.',
  'Espero que la vida recompense con éxitos al corazón del cual me enamoré de más joven; que pronto te traiga a ese chico que tanto anhelas y, si no es él, entonces que te dé un príncipe azul que esté a tu talla.',
  'Mucha suerte, mi loquita, mitad imaginaria que vive en mi cabeza. Te quiero mucho. 💜',
];

/* Texto intermedio de oso, cadena y libro: el mismo que ya usan anillo y placas. */
const INTERMEDIO_WAST = INTERMEDIO_NICOL;
const INTERMEDIO_CADENA = INTERMEDIO_NICOL;
const INTERMEDIO_LIBRO = INTERMEDIO_NICOL;


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
  },

  /* ------------------ OSO → Wast ------------------ */
  oso: {
    apodo: {
      question: 'Hablando en femenino, ¿qué pasabocas serías tú?',
      answer: 'pandebona',
    },
    countdown1: {
      enabled: true,
      target: '2026-11-17T00:00:00', // 17 de noviembre de 2026
      label: 'Falta poco para lo siguiente',
    },
    final: {
      imageBefore: 'media/rostro.jpeg', // TODO: foto de Wast
      imageAfter: 'media/editada.png', // TODO: versión editada de Wast
      imageSwapDelay: 5000,
      paragraphs: INICIAL_WAST,
    },
    nave: {
      question: 'Tan blanca como una...?',
      answer: 'cuajada',
    },
    countdown2: {
      enabled: true,
      target: '2026-11-19T00:00:00', // 19 de noviembre de 2026
      label: 'Un poco más de paciencia',
    },
    zaninas: {
      preText: 'Me gusta mucho esta melodía',
      audio: 'media/nocturne.mp3',
      image: 'media/zaninas.png', // TODO: imagen de Wast
      paragraphs: INTERMEDIO_WAST,
    },
  },

  /* ------------------ CADENA → Ñoño ------------------ */
  cadena: {
    apodo: {
      question: 'Socio, Pana, Parcero y el M...',
      answer: 'manito',
    },
    countdown1: {
      enabled: true,
      target: '2026-11-02T00:00:00', // 2 de noviembre de 2026
      label: 'Falta poco para lo siguiente',
    },
    final: {
      imageBefore: 'media/rostro.jpeg', // TODO: foto de Ñoño
      imageAfter: 'media/editada.png', // TODO: versión editada de Ñoño
      imageSwapDelay: 5000,
      paragraphs: INICIAL_CADENA,
    },
    nave: {
      question: 'Algo que no reventaba el coco pero sí los dedos',
      answer: 'guitar flash',
    },
    countdown2: {
      enabled: true,
      target: '2026-11-04T00:00:00', // 4 de noviembre de 2026
      label: 'Un poco más de paciencia',
    },
    zaninas: {
      preText: 'Los OG saben que esta es mi song',
      audio: 'media/nocturne.mp3',
      image: 'media/zaninas.png', // TODO: imagen de Ñoño
      paragraphs: INTERMEDIO_CADENA,
    },
  },

  /* ------------------ LIBRO → Viridiana ------------------ */
  libro: {
    apodo: {
      question: 'Tienes ojos de n-',
      answer: 'novia',
    },
    countdown1: {
      enabled: false, // sin conteo: pasa directo a la carta
      target: '2026-01-01T00:00:00',
      label: '',
    },
    final: {
      imageBefore: 'media/rostro.jpeg', // TODO: foto de Viridiana
      imageAfter: 'media/editada.png', // TODO: versión editada de Viridiana
      imageSwapDelay: 5000,
      paragraphs: INICIAL_LIBRO,
    },
    nave: {
      question: 'Una nube inusual, ¿qué color tiene?',
      answer: 'rosa',
    },
    countdown2: {
      enabled: false, // sin conteo: pasa directo al último mensaje
      target: '2026-01-01T00:00:00',
      label: '',
    },
    zaninas: {
      preText: 'Me gusta mucho esta melodía',
      audio: 'media/nocturne.mp3',
      image: 'media/zaninas.png', // TODO: imagen de Viridiana
      paragraphs: INTERMEDIO_LIBRO,
    },
  },
};