export type Language = "es" | "en";

const translations: Record<string, Record<Language, string>> = {
  // Header
  "header.title": { es: "Sistema de Gestión de Agenda Docente", en: "Teaching Agenda Management System" },
  "header.production": { es: "Producción", en: "Production" },
  "header.activities": { es: "Actividades diferentes a la docencia", en: "Non-teaching Activities" },
  "header.schedule": { es: "Horario de permanencia", en: "Permanence Schedule" },

  // Notifications & Messages
  "notifications.title": { es: "Notificaciones", en: "Notifications" },
  "notifications.empty": { es: "No hay notificaciones nuevas", en: "No new notifications" },
  "notifications.pendingReview": { es: "Agenda pendiente por revisar", en: "Agenda pending review" },
  "messages.title": { es: "Mensajes", en: "Messages" },
  "messages.empty": { es: "No hay mensajes", en: "No messages" },

  // Profile dropdown
  "profile.view": { es: "Ver perfil", en: "View profile" },
  "profile.logout": { es: "Cerrar sesión", en: "Log out" },

  // Language
  "lang.es": { es: "Español (Colombia)", en: "Spanish (Colombia)" },
  "lang.en": { es: "English", en: "English" },

  // Menu
  "menu.open": { es: "Abrir menú", en: "Open menu" },

  // Sidebar
  "sidebar.search": { es: "Buscar...", en: "Search..." },
  "sidebar.production": { es: "Producción", en: "Production" },
  "sidebar.activities": { es: "Actividades Diferentes", en: "Non-teaching Activities" },
  "sidebar.schedule": { es: "Horario Permanencia", en: "Permanence Schedule" },
  "sidebar.docente": { es: "Docente de planta", en: "Full-time Teacher" },
  "sidebar.selectDocente": { es: "Seleccionar docente...", en: "Select teacher..." },
  "sidebar.agendaDocente": { es: "Agenda Docente", en: "Teaching Agenda" },

  // Summary Panel
  "summary.title": { es: "Resumen de Datos", en: "Data Summary" },
  "summary.empty": { es: "No hay registros aún. Complete los campos del formulario.", en: "No records yet. Fill in the form fields." },
  "summary.subtotal": { es: "Subtotal", en: "Subtotal" },
  "summary.totalSemestral": { es: "Total semestral", en: "Semester total" },
  "summary.avgWeek": { es: "Promedio/semana", en: "Average/week" },
  "summary.missing": { es: "Horas faltantes", en: "Missing hours" },
  "summary.defaultHours": { es: "Horas semestre/defecto", en: "Default semester hours" },
  "summary.weekly": { es: "sem", en: "wk" },
  "summary.snal": { es: "Snal", en: "Wkly" },
  "summary.stral": { es: "Stral", en: "Smtr" },
  "summary.confirm": { es: "Confirmar datos", en: "Confirm data" },
  "summary.deleteRecord": { es: "Eliminar registro", en: "Delete record" },

  // SubfunctionForm
  "form.editing": { es: "Editando registro", en: "Editing record" },
  "form.record": { es: "Registro", en: "Record" },
  "form.clear": { es: "Limpiar", en: "Clear" },
  "form.clearFields": { es: "Limpiar campos", en: "Clear fields" },
  "form.select": { es: "Seleccionar...", en: "Select..." },
  "form.searchSubject": { es: "Buscar asignatura...", en: "Search subject..." },
  "form.filterType": { es: "Escriba para filtrar...", en: "Type to filter..." },
  "form.noSubjects": { es: "No se encontraron asignaturas.", en: "No subjects found." },
  "form.addOption": { es: "Agregar opción", en: "Add option" },
  "form.newOption": { es: "Nueva opción...", en: "New option..." },
  "form.add": { es: "Agregar", en: "Add" },
  "form.docente": { es: "Docente", en: "Teacher" },
  "form.totalWeeklyHours": { es: "Total de horas semanales por todas las actividades", en: "Total weekly hours for all activities" },
  "form.required": { es: "requeridas", en: "required" },
  "form.savedRecord": { es: "Registro guardado", en: "Record saved" },
  "form.updatedRecord": { es: "Registro actualizado", en: "Record updated" },
  "form.optionAdded": { es: "Opción agregada", en: "Option added" },

  // Schedule
  "schedule.title": { es: "3.1 Distribución horaria", en: "3.1 Schedule Distribution" },
  "schedule.noSchedule": { es: "Aún no se ha creado horario. Confirma las asignaturas en el resumen de registros.", en: "No schedule created yet. Confirm subjects in the records summary." },
  "schedule.lastModified": { es: "Última modificación", en: "Last modified" },
  "schedule.hour": { es: "Hora", en: "Hour" },

  // Profile page
  "profilePage.title": { es: "Mi Perfil", en: "My Profile" },
  "profilePage.userInfo": { es: "Información del usuario", en: "User Information" },
  "profilePage.edit": { es: "Editar perfil", en: "Edit profile" },
  "profilePage.save": { es: "Guardar", en: "Save" },
  "profilePage.updated": { es: "Perfil actualizado (solo en sesión actual)", en: "Profile updated (current session only)" },
  "profilePage.cedula": { es: "Cédula (ID)", en: "ID Number" },
  "profilePage.email": { es: "Correo institucional", en: "Institutional email" },
  "profilePage.firstName": { es: "Primer nombre", en: "First name" },
  "profilePage.secondName": { es: "Segundo nombre", en: "Middle name" },
  "profilePage.firstLastName": { es: "Primer apellido", en: "First last name" },
  "profilePage.secondLastName": { es: "Segundo apellido", en: "Second last name" },
  "profilePage.role": { es: "Rol", en: "Role" },
  "profilePage.status": { es: "Estado", en: "Status" },

  // Validation toasts
  "validation.16hours": { es: "El docente debe cumplir exactamente 16 horas semanales de Docencia Directa. Actualmente tiene {hours} horas.", en: "The teacher must complete exactly 16 weekly hours of Direct Teaching. Currently has {hours} hours." },
  "validation.exceeds": { es: "Excede las {max}h semestrales por {excess}h. Considere reducir horas en: {suggestions}.", en: "Exceeds {max}h semester limit by {excess}h. Consider reducing hours in: {suggestions}." },
  "validation.missing": { es: "Faltan {missing}h para completar las {max}h semestrales requeridas.", en: "Missing {missing}h to complete the required {max}h semester hours." },

  // Subfunction titles
  "sub.docencia-directa.title": { es: "1.1 Docencia Directa", en: "1.1 Direct Teaching" },
  "sub.docencia-directa.short": { es: "Docencia Directa", en: "Direct Teaching" },
  "sub.docencia-indirecta.title": { es: "1.2 Docencia Indirecta", en: "1.2 Indirect Teaching" },
  "sub.docencia-indirecta.short": { es: "Docencia Indirecta", en: "Indirect Teaching" },
  "sub.trabajos-grado.title": { es: "1.3 Dirección y asesorías en trabajos de grado", en: "1.3 Direction and advisory for degree works" },
  "sub.trabajos-grado.short": { es: "Trabajos de Grado", en: "Degree Works" },
  "sub.practicas-academicas.title": { es: "1.4 Asesorías de prácticas académicas", en: "1.4 Academic practices advisory" },
  "sub.practicas-academicas.short": { es: "Prácticas Académicas", en: "Academic Practices" },
  "sub.investigacion.title": { es: "2.1 Investigación y desarrollo tecnológico", en: "2.1 Research and technological development" },
  "sub.investigacion.short": { es: "Investigación", en: "Research" },
  "sub.proyeccion-social.title": { es: "2.2 Actividades de proyección social", en: "2.2 Social outreach activities" },
  "sub.proyeccion-social.short": { es: "Proyección Social", en: "Social Outreach" },
  "sub.complementarias.title": { es: "2.3 Actividades complementarias", en: "2.3 Complementary activities" },
  "sub.complementarias.short": { es: "Complementarias", en: "Complementary" },
  "sub.formacion-docentes.title": { es: "2.4 Formación de docentes", en: "2.4 Teacher training" },
  "sub.formacion-docentes.short": { es: "Formación Docentes", en: "Teacher Training" },
  "sub.administrativas.title": { es: "2.5 Actividades académico-administrativas", en: "2.5 Academic-administrative activities" },
  "sub.administrativas.short": { es: "Administrativas", en: "Administrative" },
  "sub.distribucion-horaria.title": { es: "3.1 Distribución horaria", en: "3.1 Schedule Distribution" },
  "sub.distribucion-horaria.short": { es: "Distribución Horaria", en: "Schedule Distribution" },

  // Field labels
  "field.asignatura": { es: "Asignatura", en: "Subject" },
  "field.semestre": { es: "Semestre", en: "Semester" },
  "field.facultad": { es: "Facultad", en: "Faculty" },
  "field.programa": { es: "Programa", en: "Program" },
  "field.jornada": { es: "Jornada", en: "Schedule shift" },
  "field.nivel": { es: "Nivel de formación", en: "Education level" },
  "field.horasSemana": { es: "Horas a la semana", en: "Hours per week" },
  "field.cantidadSemanas": { es: "Cantidad de semanas", en: "Number of weeks" },
  "field.totalHoras": { es: "Total de horas", en: "Total hours" },
  "field.actividad": { es: "Actividad", en: "Activity" },
  "field.tipoTrabajo": { es: "Tipo de trabajo", en: "Type of work" },
  "field.cantidadProyectos": { es: "Cantidad de proyectos", en: "Number of projects" },
  "field.cantidadHoras": { es: "Cantidad de horas", en: "Number of hours" },
  "field.cantidadEstudiantes": { es: "Cantidad de estudiantes", en: "Number of students" },

  // Subject management
  "subject.manage": { es: "Gestionar asignaturas", en: "Manage subjects" },
  "subject.add": { es: "Agregar asignatura", en: "Add subject" },
  "subject.edit": { es: "Editar asignatura", en: "Edit subject" },
  "subject.delete": { es: "Eliminar asignatura", en: "Delete subject" },
  "subject.confirmDelete": { es: "¿Confirmar eliminación?", en: "Confirm deletion?" },
  "subject.cancel": { es: "Cancelar", en: "Cancel" },
  "subject.save": { es: "Guardar cambios", en: "Save changes" },
  "subject.name": { es: "Nombre de la asignatura", en: "Subject name" },
  "subject.nameRequired": { es: "El nombre es obligatorio", en: "Name is required" },
  "subject.nameMax": { es: "Máximo 200 caracteres", en: "Maximum 200 characters" },
  "subject.hoursInvalid": { es: "Debe ser un entero positivo", en: "Must be a positive integer" },
  "subject.weeksInvalid": { es: "Debe ser un entero positivo", en: "Must be a positive integer" },
  "subject.added": { es: "Asignatura agregada", en: "Subject added" },
  "subject.updated": { es: "Asignatura actualizada", en: "Subject updated" },
  "subject.deleted": { es: "Asignatura eliminada", en: "Subject deleted" },
  "subject.alreadyExists": { es: "Ya existe una asignatura con ese nombre para esa facultad y programa", en: "A subject with that name already exists for that faculty and program" },

  // Activity management (generic)
  "activity.manage": { es: "Gestionar actividades", en: "Manage activities" },
  "activity.add": { es: "Agregar actividad", en: "Add activity" },
  "activity.edit": { es: "Editar actividad", en: "Edit activity" },
  "activity.delete": { es: "Eliminar actividad", en: "Delete activity" },
  "activity.name": { es: "Nombre de la actividad", en: "Activity name" },
  "activity.nameRequired": { es: "El nombre es obligatorio", en: "Name is required" },
  "activity.fieldInvalid": { es: "Debe ser un número válido", en: "Must be a valid number" },
  "activity.added": { es: "Actividad agregada", en: "Activity added" },
  "activity.updated": { es: "Actividad actualizada", en: "Activity updated" },
  "activity.deleted": { es: "Actividad eliminada", en: "Activity deleted" },
  "activity.noItems": { es: "No se encontraron actividades.", en: "No activities found." },
  "activity.manage.indirect_teaching": { es: "Gestionar docencia indirecta", en: "Manage indirect teaching" },
  "activity.manage.degree_works": { es: "Gestionar trabajos de grado", en: "Manage degree works" },
  "activity.manage.academic_practices": { es: "Gestionar prácticas académicas", en: "Manage academic practices" },
  "activity.manage.investigations": { es: "Gestionar investigación", en: "Manage research" },
  "activity.manage.social_projects": { es: "Gestionar proyección social", en: "Manage social projects" },
  "activity.manage.complementary_activities": { es: "Gestionar actividades complementarias", en: "Manage complementary activities" },
  "activity.manage.teacher_training": { es: "Gestionar formación de docentes", en: "Manage teacher training" },
  "activity.manage.administrative_activities": { es: "Gestionar actividades administrativas", en: "Manage administrative activities" },

  // Days
  "day.monday": { es: "Lunes", en: "Monday" },
  "day.tuesday": { es: "Martes", en: "Tuesday" },
  "day.wednesday": { es: "Miércoles", en: "Wednesday" },
  "day.thursday": { es: "Jueves", en: "Thursday" },
  "day.friday": { es: "Viernes", en: "Friday" },
  "day.saturday": { es: "Sábado", en: "Saturday" },

  // Audit log
  "audit.title": { es: "Registro de auditoría", en: "Audit Log" },
  "audit.viewAudit": { es: "Registro de auditoría", en: "Audit Log" },
  "audit.table": { es: "Tabla", en: "Table" },
  "audit.action": { es: "Acción", en: "Action" },
  "audit.recordId": { es: "ID Registro", en: "Record ID" },
  "audit.changedFields": { es: "Campos modificados", en: "Changed Fields" },
  "audit.date": { es: "Fecha", en: "Date" },
  "audit.oldData": { es: "Datos anteriores", en: "Previous Data" },
  "audit.newData": { es: "Datos nuevos", en: "New Data" },
  "audit.noRecords": { es: "No hay registros de auditoría", en: "No audit records" },
  "audit.filterTable": { es: "Filtrar por tabla", en: "Filter by table" },
  "audit.filterAction": { es: "Filtrar por acción", en: "Filter by action" },
  "audit.allTables": { es: "Todas las tablas", en: "All tables" },
  "audit.allActions": { es: "Todas las acciones", en: "All actions" },

  // Comments
  "comments.title": { es: "Observaciones", en: "Comments" },
  "comments.placeholder": { es: "Escribe una observación o comentario...", en: "Write a comment or observation..." },
  "comments.add": { es: "Agregar comentario", en: "Add comment" },
  "comments.empty": { es: "Sin observaciones aún", en: "No comments yet" },
  "comments.by": { es: "por", en: "by" },
};

export function getTranslation(key: string, lang: Language): string {
  return translations[key]?.[lang] || key;
}
