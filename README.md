## Flujo de funcionamiento de autenticación
App inicia → Verifica admin en .env → Lo crea si no existe

Admin accede → Panel de administración

Admin envía invitación → Email con token único

Usuario recibe email → Hace clic en enlace

Usuario se registra → Con token válido

Usuario accede → Con rol asignado