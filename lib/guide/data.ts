import type {
  GuideTopicEntry,
  GymGuideEntry,
  PaceGuideEntry,
} from "@/types/training";

// Structured product data derived from the imported “Guía de ritmos” sheet.
// Keeping it typed here means production never needs to read the XLSX at runtime.
export const paceGuideEntries = [
  {
    id: "recovery",
    type: "Recuperación",
    pace: "6:30–7:00/km",
    rpe: "2–3",
    sensation: "Muy cómodo",
    purpose: "Recuperar",
    practicalRule: "Debe sentirse fácil, incluso demasiado fácil.",
    effortType: "recovery",
  },
  {
    id: "easy",
    type: "Suave",
    pace: "6:15–6:40/km",
    rpe: "3",
    sensation: "Conversación completa",
    purpose: "Base aeróbica",
    practicalRule: "Si 6:15 exige concentración, baja ritmo.",
    effortType: "easy",
  },
  {
    id: "long-run",
    type: "Larga",
    pace: "6:20–6:45/km",
    rpe: "3–4",
    sensation: "Cómodo durante horas",
    purpose: "Resistencia",
    practicalRule: "Empieza lento; nunca “compenses” tiempo.",
    effortType: "long_run",
  },
  {
    id: "marathon-pace",
    type: "Ritmo maratón",
    pace: "6:05–6:20/km",
    rpe: "4–5",
    sensation: "Controlado",
    purpose: "Especificidad",
    practicalRule: "No es una meta rígida de carrera.",
    effortType: "steady_moderate",
  },
  {
    id: "tempo",
    type: "Tempo",
    pace: "5:40–5:55/km",
    rpe: "6",
    sensation: "Fuerte controlado",
    purpose: "Umbral y resistencia",
    practicalRule: "No debe sentirse como una carrera de 5K.",
    effortType: "tempo_threshold",
  },
  {
    id: "strides",
    type: "Strides",
    pace: "15–20 s rápido",
    rpe: "7–8",
    sensation: "Rápido y relajado",
    purpose: "Técnica y economía",
    practicalRule: "No sprint; recuperación completa.",
    effortType: "intervals_speed",
  },
] as const satisfies readonly PaceGuideEntry[];

export const practicalGuideEntries = [
  {
    id: "natural-pace",
    topic: "Tu pace natural",
    description: "Que normalmente corras cerca de 6:00/km no significa que todos los días deban ir a 6:00. Los días fáciles protegen la calidad de la larga.",
  },
  {
    id: "heat-hills",
    topic: "Calor y cuestas",
    description: "Usa RPE y respiración. Un pace más lento puede ser exactamente el mismo entrenamiento fisiológico.",
  },
  {
    id: "strides",
    topic: "Cómo hacer strides",
    description: "Acelera progresivamente, mantén rápido unos segundos y desacelera; buena técnica, sin tensión.",
  },
  {
    id: "adjustment",
    topic: "Ajuste",
    description: "Si tras 1–2 semanas tus datos reales no coinciden con estos rangos, ajusta el pace; conserva el objetivo de esfuerzo.",
  },
  {
    id: "easy-finish",
    topic: "Una señal positiva",
    description: "Acabar una sesión fácil con ganas de correr más es una señal positiva, no de que entrenaste mal.",
  },
] as const satisfies readonly GuideTopicEntry[];

export const gymGuideEntries = [
  {
    id: "a",
    name: "Rutina A",
    description: "Fuerza base de pierna, pantorrilla y core. Mantén siempre 2–3 repeticiones en reserva.",
    exercises: [
      { exercise: "Sentadilla goblet o barra", sets: "3", reps: "6–8", rir: "2–3", rest: "90–120 s", notes: "Técnica limpia; no buscar PR." },
      { exercise: "Peso muerto rumano", sets: "3", reps: "8", rir: "2–3", rest: "90 s", notes: "Control de bajada." },
      { exercise: "Bulgarian split squat", sets: "2", reps: "8/pierna", rir: "2–3", rest: "60–90 s", notes: "Carga moderada." },
      { exercise: "Elevación de pantorrilla", sets: "3", reps: "12–15", rir: "2–3", rest: "60 s", notes: "Pausa arriba y abajo." },
      { exercise: "Plancha", sets: "3", reps: "30–45 s", rir: "—", rest: "45 s", notes: "Core firme." },
    ],
  },
  {
    id: "b",
    name: "Rutina B",
    description: "Trabajo unilateral, cadena posterior y estabilidad para complementar la carrera.",
    exercises: [
      { exercise: "Step-up o zancada", sets: "2", reps: "8/pierna", rir: "2–3", rest: "60–90 s", notes: "Control de rodilla y cadera." },
      { exercise: "Hip thrust", sets: "3", reps: "8–10", rir: "2–3", rest: "90 s", notes: "Sin llegar al fallo." },
      { exercise: "Peso muerto a una pierna", sets: "2", reps: "8/pierna", rir: "3", rest: "60–90 s", notes: "Ligero o moderado." },
      { exercise: "Pantorrilla sentado", sets: "3", reps: "12–15", rir: "2–3", rest: "60 s", notes: "Trabajo de sóleo." },
      { exercise: "Dead bug", sets: "3", reps: "8–10/lado", rir: "—", rest: "45 s", notes: "Lento y controlado." },
    ],
  },
  {
    id: "light",
    name: "Rutina Ligera",
    description: "Mantenimiento con 50–60% de la carga normal, pensado para salir fresco y sin agujetas.",
    exercises: [
      { exercise: "Sentadilla goblet", sets: "2", reps: "8", rir: "3–4", rest: "60–90 s", notes: "50–60% de carga normal." },
      { exercise: "Peso muerto rumano", sets: "2", reps: "8", rir: "3–4", rest: "60–90 s", notes: "Mantenimiento." },
      { exercise: "Split squat", sets: "2", reps: "6/pierna", rir: "3–4", rest: "60 s", notes: "Sin agujetas." },
      { exercise: "Pantorrilla", sets: "2", reps: "12", rir: "3", rest: "60 s", notes: "Controlado." },
      { exercise: "Plancha / dead bug", sets: "2", reps: "30 s / 8 lado", rir: "—", rest: "45 s", notes: "Core ligero." },
    ],
  },
] as const satisfies readonly GymGuideEntry[];

export const gymRules = [
  { id: "rir", topic: "Qué significa RIR", description: "RIR son las repeticiones que todavía podrías hacer. 2–3 RIR significa terminar claramente antes del fallo." },
  { id: "priority", topic: "Prioridad", description: "Estas 9 semanas no buscamos hipertrofia ni récords; buscamos tolerar mejor la carrera." },
  { id: "interference", topic: "No afectar la carrera", description: "Si el gimnasio afecta la siguiente carrera, baja peso o series." },
  { id: "joint-pain", topic: "Dolor articular", description: "No es lo mismo que esfuerzo muscular normal; modifica el ejercicio que moleste." },
  { id: "taper", topic: "Desde la semana 8", description: "Sin gimnasio de piernas; movilidad o core ligero opcional." },
  { id: "equivalents", topic: "Ejercicios equivalentes", description: "Si ya tienes una rutina bien tolerada, puedes usar equivalentes respetando RIR y volumen." },
] as const satisfies readonly GuideTopicEntry[];
