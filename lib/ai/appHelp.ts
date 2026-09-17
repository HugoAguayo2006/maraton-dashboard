export interface BoltAppFeatureHelp {
  section: string;
  path: string;
  purpose: string;
  steps: string[];
}

export interface BoltAppHelp {
  navigation: string;
  features: BoltAppFeatureHelp[];
  importantConcepts: string[];
  boltCapabilities: string[];
}

export const boltAppHelp: BoltAppHelp = {
  navigation: "En computadora usa el menú lateral. En móvil usa la barra inferior; Registrar abre el alta de entrenamiento y las demás secciones también están disponibles desde sus accesos internos.",
  features: [
    {
      section: "Dashboard",
      path: "/dashboard",
      purpose: "Resume la sesión de hoy, avance semanal, volumen reciente, recuperación, próxima tirada larga, fuerza y entrenamientos recientes.",
      steps: [
        "Abre Dashboard desde Inicio.",
        "Usa los botones de la sesión de hoy para registrar una carrera, fuerza o una actividad libre.",
        "Usa las acciones rápidas para abrir Plan, Progreso, Guía o los formularios de registro.",
      ],
    },
    {
      section: "Plan",
      path: "/plan",
      purpose: "Muestra lo prescrito por semana, el objetivo semanal, el avance y todos los detalles de cada sesión.",
      steps: [
        "Abre Plan y despliega el día que quieras consultar.",
        "Revisa calentamiento, trabajo principal, enfriamiento, fuerza, nutrición y recuperación cuando estén disponibles.",
        "Desde cada día puedes registrar la carrera o la sesión de fuerza vinculada; el registro real se conserva separado del plan.",
      ],
    },
    {
      section: "Crear o regenerar plan con Bolt AI",
      path: "/plan/generate",
      purpose: "Genera una propuesta completa basada en experiencia, disponibilidad, carga reciente, restricciones y carrera objetivo.",
      steps: [
        "En Plan pulsa Crear con Bolt AI o Regenerar con Bolt AI; también está en Configuración, Preferencias de Bolt AI.",
        "Completa los días para correr y fuerza, tirada larga, kilometraje, restricciones y motivo.",
        "Pulsa Generar vista previa, revisa todas las semanas y después Guardar plan. Bolt nunca reemplaza el plan sin confirmación.",
      ],
    },
    {
      section: "Entrenamientos",
      path: "/workouts",
      purpose: "Contiene el historial de carreras realmente realizadas y sus métricas, separado de las sesiones prescritas.",
      steps: [
        "Pulsa Registrar entrenamiento o el botón +.",
        "Elige Registro manual o Importar de Strava.",
        "Abre cualquier actividad del historial para consultar ritmo, sensaciones, parciales, ruta y otros detalles disponibles.",
      ],
    },
    {
      section: "Registro manual de carrera",
      path: "/workouts/new/manual",
      purpose: "Guarda una carrera con fecha, tipo, distancia, duración, pace calculado, sensaciones y datos opcionales.",
      steps: [
        "Selecciona la fecha y, si corresponde, vincula una sesión pendiente del plan.",
        "Captura distancia y duración; Marathon calcula el pace.",
        "Registra RPE, dolor, fatiga, sensación, sueño, nutrición, hidratación, ubicación, desnivel, frecuencia cardiaca, notas o parciales disponibles y guarda.",
      ],
    },
    {
      section: "Strava",
      path: "/settings/integrations",
      purpose: "Conecta una cuenta mediante OAuth e importa actividades sin duplicarlas.",
      steps: [
        "Ve a Configuración, Integraciones y pulsa Conectar con Strava.",
        "Autoriza el acceso en Strava y vuelve a Marathon.",
        "Ve a Registrar entrenamiento, Importar de Strava, selecciona una actividad y confirma la importación.",
      ],
    },
    {
      section: "Fuerza",
      path: "/strength",
      purpose: "Administra rutinas, registra series y consulta historial y progresión de gimnasio.",
      steps: [
        "Usa Iniciar sesión para una sesión libre o vinculada al plan.",
        "Selecciona una rutina o agrega ejercicios; captura peso, repeticiones, RIR y marca cada serie completada antes de guardar.",
        "En Nueva rutina puedes buscar, ordenar y guardar ejercicios. Historial muestra sesiones anteriores y Progresión resume evolución y volumen.",
      ],
    },
    {
      section: "Progreso",
      path: "/progress",
      purpose: "Resume distancia, tiempo, desnivel, pace, tirada más larga, RPE, dolor y cumplimiento del plan.",
      steps: [
        "Abre Progreso desde el menú.",
        "Cambia el periodo para comparar 4 semanas, 12 semanas o todo el historial.",
        "Los cálculos usan entrenamientos reales; el cumplimiento compara registros con sesiones elegibles del plan.",
      ],
    },
    {
      section: "Guía",
      path: "/guide",
      purpose: "Explica ritmos y esfuerzo, gimnasio y reglas prácticas para interpretar el plan.",
      steps: [
        "Abre Guía y elige Ritmos y esfuerzo, Gimnasio o Reglas prácticas.",
        "Consulta referencias de pace, RPE, RIR, dolor, taper, equivalencias y criterios de ajuste.",
        "Puedes abrir Bolt desde la guía y preguntarle por cualquiera de esos conceptos.",
      ],
    },
    {
      section: "Configuración",
      path: "/settings",
      purpose: "Permite editar perfil, foto, datos físicos, carrera objetivo, pace natural, integraciones y preferencias de Bolt AI.",
      steps: [
        "Abre Configuración desde el menú o el avatar.",
        "Edita los datos necesarios y guarda el perfil.",
        "Usa Integraciones para Strava y Preferencias de Bolt AI para disponibilidad y regeneración del plan.",
      ],
    },
    {
      section: "Bolt AI",
      path: "Botón flotante con rayo",
      purpose: "Responde sobre entrenamiento y sobre el uso de Marathon usando el contexto privado de la cuenta iniciada.",
      steps: [
        "Pulsa el botón flotante con el rayo desde cualquier sección protegida.",
        "Pregunta por tus datos, tu plan o cómo usar una funcionalidad.",
        "Reiniciar chat crea una conversación nueva sin borrar el historial. Las propuestas de cambio siempre requieren confirmación.",
      ],
    },
  ],
  importantConcepts: [
    "El plan es lo prescrito; Entrenamientos y Fuerza guardan lo que realmente se realizó. Vincular un registro actualiza el cumplimiento, pero no sustituye la fuente original del plan.",
    "Cada cuenta solo puede consultar su propia información y mantiene su propio chat, plan, registros e integraciones.",
    "Una vista previa de Bolt AI no modifica nada hasta que el atleta pulsa Guardar plan o confirma explícitamente un cambio.",
    "Strava no requiere suscripción de pago del atleta para la conexión básica usada por Marathon.",
  ],
  boltCapabilities: [
    "Puede explicar cualquier sección incluida en este manual y dar instrucciones paso a paso.",
    "Puede analizar el plan y los registros disponibles, explicar una sesión y proponer ajustes para revisión.",
    "No puede pulsar botones, cambiar configuraciones, conectar Strava ni modificar el plan sin la acción y confirmación del usuario.",
    "Si una función no aparece en el manual o no está disponible, debe decirlo con claridad y no inventar pasos.",
  ],
};
