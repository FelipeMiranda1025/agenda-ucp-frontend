# Sistema de Interpretación de Lineamientos PDF

## Overview

El sistema permite al Vicerrector cargar documentos PDF con nuevos lineamientos y aplicar cambios dinámicamente sin necesidad de modificar código. Utiliza IA para extraer reglas y configuraciones del documento PDF.

## Arquitectura del Sistema

### 1. Frontend Components

#### LineamientosImportSection.tsx
- **Ubicación**: `src/components/LineamientosImportSection.tsx`
- **Función**: Interfaz principal para carga y gestión de lineamientos
- **Características**:
  - Carga de archivos PDF con validación
  - Vista previa de reglas extraídas
  - Selección individual de reglas a aplicar
  - Historial de versiones
  - Restauración de valores por defecto

#### Profile.tsx (Modificado)
- **Ubicación**: `src/pages/Profile.tsx`
- **Modificación**: Agregada pestaña "Ajustes" para Vicerrector (rolId === 4)
- **Función**: Acceso exclusivo para Vicerrector a la gestión de lineamientos

### 2. Hooks Personalizados

#### useLineamientosImport.ts
- **Ubicación**: `src/hooks/useLineamientosImport.ts`
- **Funciones**:
  - `useUploadLineamientos()`: Sube y procesa PDF
  - `useApplyExtractedRules()`: Aplica reglas extraídas
  - `useLineamientosHistory()`: Consulta historial de versiones

#### useFormBgColor.ts
- **Ubicación**: `src/hooks/useFormBgColor.ts`
- **Función**: Obtiene y aplica color de fondo del formulario desde system-settings

### 3. Backend Endpoints

#### Upload y Procesamiento (flujo activo en la UI)
- **Endpoint**: `POST /api/lineamientos-documents/upload`
- **IA**: Google **Gemini 1.5 Flash** (`agenda-ucp-backend/src/services/iaLineamientosParser.ts`)
- **Variable**: `GEMINI_API_KEY` en el backend
- **Función**: Recibe PDF, extrae texto (`pdfParser.ts`), Gemini devuelve JSON de lineamientos; si falla, regex (`fallbackExtract`)
- **Respuesta**: `{ success, id, rules_extracted, summary }`

#### Endpoint alternativo (legacy)
- **Endpoint**: `POST /api/upload/parse-document`
- **IA**: Google **Gemini 2.5 Flash** vía REST (`src/routes/upload.ts`)

#### Gestión de Documentos
- **POST /lineamientos-documents**: Persiste documento procesado
- **PUT /lineamientos-documents/:id**: Marca como aplicado
- **GET /lineamientos-documents**: Historial de versiones

#### Aplicación de Reglas
- **POST /recommendation-rules**: Crea nuevas reglas
- **PUT /recommendation-rules/:id`: Actualiza reglas existentes
- **PUT /system-settings/:key`: Guarda configuraciones visuales

## Flujo de Trabajo

### 1. Carga del Documento
1. Vicerrector accede a Perfil → Ajustes
2. Selecciona archivo PDF (validación de formato)
3. Sistema sube PDF al backend
4. Backend procesa PDF con **Gemini 1.5 Flash** y extrae reglas (o fallback regex)

### 2. Revisión y Selección
1. Sistema muestra vista previa con reglas extraídas
2. Reglas se agrupan por categoría:
   - Investigación
   - Administrativas
   - Formación
   - Visuales (cambios de diseño)
3. Vicerrector puede seleccionar/deseleccionar reglas individuales

### 3. Aplicación de Cambios
1. Al confirmar, sistema aplica reglas seleccionadas:
   - **Reglas numéricas**: Se guardan en `recommendation_rules`
   - **Reglas visuales**: Se guardan en `system-settings`
2. Documento se marca como "aplicado"
3. Sistema recarga para aplicar cambios visuales inmediatamente

## Tipos de Reglas Soportadas

### 1. Reglas de Configuración
```typescript
interface ExtractedRule {
  category: "investigacion" | "administrativas" | "formacion";
  rule_key: string;
  label: string;
  hours?: number;        // Horas semanales
  subjects?: number;     // Número de asignaturas
  source_article: string; // Referencia al artículo
}
```

### 2. Reglas Visuales
```typescript
interface ExtractedRule {
  category: "visual";
  rule_key: string;      // Ej: "form_bg_color"
  label: string;         // Descripción del cambio
  value: string;         // Valor hexadecimal del color
  source_article: string;
}
```

## Ejemplos de Uso

### Cambio de Color de Fondo
**PDF Content**:
```
ARTÍCULO 1º. CAMBIOS VISUALES
El color de fondo del formulario "Seleccionar formulario" 
debe cambiar a azul claro.

Configuración visual:
- form_bg_color: #E3F2FD
```

**Resultado**:
- Sistema extrae regla visual
- Guarda en `system-settings` con key `form_bg_color`
- Hook `useFormBgColor` obtiene el color
- Aplica estilo dinámico en Index.tsx

### Actualización de Horas de Investigación
**PDF Content**:
```
ARTÍCULO 6º. INVESTIGACIÓN
Los investigadores principales tendrán 11 horas semanales 
de investigación.

Configuración:
- investigacion_principal: 11 horas/semana
```

**Resultado**:
- Sistema extrae regla de categoría "investigacion"
- Actualiza/crea registro en `recommendation_rules`
- Sistema de validación usa nuevas horas

## Características de Seguridad

### 1. Validaciones
- Solo usuarios con rolId === 4 (Vicerrector) pueden acceder
- Validación de formato PDF obligatoria
- Confirmación explícita antes de aplicar cambios

### 2. Trazabilidad
- Cada documento queda registrado con:
  - Fecha de carga
  - Usuario que cargó
  - Reglas extraídas
  - Estado (aplicado/pendiente)
  - Fecha de aplicación

### 3. Reversión
- Botón "Restaurar Valores por Defecto"
- Elimina configuraciones personalizadas
- Restablece valores originales del sistema

## Integración con Sistema Existente

### 1. Formularios de Agenda
- Los cambios en reglas afectan inmediatamente las validaciones
- Sistema de recomendaciones usa nuevas configuraciones
- No se requiere reinicio manual

### 2. Interfaz de Usuario
- Cambios visuales se aplican con transición suave
- Diseño responsivo se mantiene
- Accesibilidad no se ve afectada

### 3. Base de Datos
- Estructura existente no se modifica
- Nuevas tablas: `lineamientos_documents`
- Configuraciones visuales usan `system_settings`

## Pruebas y Validación

### 1. Prueba Automatizada
```typescript
// Test de cambio de color
const { color } = renderHook(() => useFormBgColor());
expect(color).toBe('#E3F2FD');
```

### 2. Prueba Manual
1. Cargar PDF con cambio visual
2. Verificar vista previa
3. Aplicar cambios
4. Confirmar color actualizado en formulario
5. Verificar historial de versiones

## Consideraciones Técnicas

### 1. Performance
- Cache de configuraciones visuales (60 segundos)
- Lazy loading de componentes pesados
- Optimización de queries React Query

### 2. Error Handling
- Manejo robusto de errores de carga
- Mensajes claros al usuario
- Rollback automático en caso de error

### 3. Mantenimiento
- Logs detallados de todas las operaciones
- Monitoreo de uso del sistema
- Actualización automática de caché

## Futuras Mejoras

1. **Soporte para más tipos de cambios**: Fuentes, tamaños, layouts
2. **Vista previa en tiempo real**: Mientras se escribe el PDF
3. **Plantillas predefinidas**: Para cambios comunes
4. **Validación avanzada**: Reglas complejas con condiciones
5. **Exportación de configuración**: Para backup y migración

## Conclusión

El sistema de interpretación de lineamientos proporciona una solución robusta y flexible para mantener la agenda docente actualizada según las políticas institucionales, sin necesidad de intervención técnica directa en el código fuente.
