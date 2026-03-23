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
  "sidebar.activities": { es: "Actividades Diferentes", en: "Different Activities" },
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
};

export function getTranslation(key: string, lang: Language): string {
  return translations[key]?.[lang] || key;
}
