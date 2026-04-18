
## Investigación

El dropdown solo muestra "Yo" porque `docentesList` se construye desde `useSubordinatesWithNames(user?.id)` en `AgendaContext.tsx`. Necesito revisar ese hook para entender por qué no devuelve subordinados.
