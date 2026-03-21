

## Plan: Actualizar usuario con id 1

### Cambio único en la base de datos

Ejecutar un `UPDATE` en la tabla `users` para el registro con `id = 1`:

- Cambiar `cc` a `'12345678'`
- Cambiar `password` al hash SHA-256 de `"12345678"`

El hash SHA-256 de "12345678" es: `ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f`

### SQL a ejecutar

```sql
UPDATE users SET cc = '12345678', password = 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f' WHERE id = 1;
```

### Nota
No se requieren cambios en el código frontend. El login seguirá funcionando igual ya que el sistema hashea la contraseña ingresada con SHA-256 antes de compararla.

