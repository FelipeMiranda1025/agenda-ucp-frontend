

## Plan: Agregar enlace "Olvidé mi contraseña" en el login

### Cambio unico en `src/components/LoginDialog.tsx`

Agregar un enlace `<a>` entre el campo de contraseña y el boton "Iniciar Sesion" que use un `mailto:` link con los parametros pre-llenados:

- **Destinatario**: soporte@ucp.edu.co
- **Asunto**: "Olvide mi contraseña para ingreso de agenda docente"
- **Cuerpo**: El texto formal con los campos Correo, Nombre, CC

El enlace se mostrara alineado a la derecha, con estilo de texto pequeno y color primario, similar a un link convencional de "forgot password".

