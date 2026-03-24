

## Plan: Vista de Auditoría en el dropdown del perfil

### Resumen
Crear una nueva página `/audit` que muestre el historial de cambios registrados por el sistema de auditoría, accesible desde el dropdown de perfil del usuario. Se diseñará con una flag para controlar visibilidad por rol en el futuro.

### Cambios

#### 1. Nueva página `src/pages/AuditLog.tsx`
- Tabla con columnas: Fecha, Tabla, Acción (INSERT/UPDATE/DELETE con badges de color), ID del registro, Campos modificados
- Filtros por: tabla (select), acción (select), rango de fechas
- Expandir fila para ver `old_data` / `new_data` en formato JSON legible
- Usa el hook `useAuditLog` ya existente en `useDatabase.ts`
- Incluye header con botón de regreso al inicio

#### 2. Ruta en `src/App.tsx`
- Agregar `<Route path="/audit" element={<AuditLog />} />`

#### 3. Dropdown de perfil en `src/pages/Index.tsx`
- Agregar item "Registro de auditoría" entre "Ver perfil" y "Cerrar sesión"
- Icono: `ClipboardList` o `History`
- Controlado por una constante/flag `AUDIT_VISIBLE_ROLES` para facilitar restricción futura por rol

#### 4. Traducciones en `src/i18n/translations.ts`
- `audit.title`, `audit.table`, `audit.action`, `audit.recordId`, `audit.changedFields`, `audit.date`, `audit.oldData`, `audit.newData`, `audit.noRecords`, `audit.filterTable`, `audit.filterAction`, `audit.viewAudit`

### Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| `src/pages/AuditLog.tsx` | Nueva página con tabla filtrable |
| `src/App.tsx` | Agregar ruta `/audit` |
| `src/pages/Index.tsx` | Agregar item en dropdown de perfil |
| `src/i18n/translations.ts` | Traducciones para auditoría |

### Nota sobre roles
Se usará una constante `AUDIT_VISIBLE_ROLES` (ej: `['docentePlanta']` — todos por ahora) que se puede restringir fácilmente en el futuro sin refactorizar la lógica.

