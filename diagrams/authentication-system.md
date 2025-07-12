# Sistema de Autenticación, Permisos y Roles


## Flujo Detallado de Autenticación

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend (React)
    participant R as Rutas Laravel
    participant A as AuthController
    participant M as Middleware
    participant DB as Base de Datos
    participant S as Sesión

    U->>F: Accede a /login
    F->>R: GET /login
    R->>A: showLoginForm()
    A->>F: Render Login.jsx
    F->>U: Muestra formulario de login

    U->>F: Ingresa credenciales
    F->>R: POST /auth/login
    R->>A: login()
    A->>DB: Auth::attempt()
    DB->>A: Validación de credenciales
    
    alt Credenciales válidas
        A->>S: session()->regenerate()
        A->>F: redirect('/admin/dashboard')
        F->>R: GET /admin/dashboard
        R->>M: auth middleware
        M->>DB: Verificar usuario autenticado
        DB->>M: Usuario válido
        M->>R: Continuar
        R->>F: Render Dashboard
        F->>U: Dashboard del usuario
    else Credenciales inválidas
        A->>F: withErrors()
        F->>U: Muestra errores
    end
```

## Flujo de Registro con Invitación

```mermaid
sequenceDiagram
    participant Admin as Administrador
    participant F as Frontend
    participant R as Rutas
    participant IC as InvitationController
    participant RC as RegisterController
    participant DB as Base de Datos
    participant Email as Sistema de Email
    participant NewUser as Nuevo Usuario

    Admin->>F: Crea invitación
    F->>R: POST /admin/invitaciones
    R->>IC: store()
    IC->>DB: Crear invitación
    IC->>Email: Enviar email con token

    Note over Email,NewUser: Usuario recibe email con link de registro
    Email->>NewUser: Email con link de registro
    NewUser->>F: Click en link de registro
    F->>R: GET /register?token=xxx
    R->>RC: showRegistrationForm()
    RC->>DB: Validar token
    DB->>RC: Token válido
    RC->>F: Render Register.jsx
    F->>NewUser: Formulario de registro

    NewUser->>F: Completa formulario de registro
    F->>R: POST /auth/register
    R->>RC: register()
    RC->>DB: Validar token nuevamente
    RC->>DB: Crear usuario
    RC->>DB: Asignar rol 'empleado'
    RC->>DB: Marcar invitación como aceptada
    RC->>F: redirect('/admin/dashboard')
    F->>NewUser: Dashboard del nuevo usuario
```

## Middleware de Verificación de Permisos

```mermaid
flowchart TD
    Request[Request llega] --> AuthCheck{Usuario autenticado?}
    
    AuthCheck -->|No| RedirectLogin[Redirect a /login]
    AuthCheck -->|Sí| PermissionCheck{¿Tiene permiso?}
    
    PermissionCheck -->|No| RedirectDashboard[Redirect a dashboard con error]
    PermissionCheck -->|Sí| Continue[Continuar con request]
    
    RedirectLogin --> End[Fin]
    RedirectDashboard --> End
    Continue --> End
```

## Tecnologías Utilizadas

- **Backend**: Laravel 9 con PHP 8
- **Frontend**: React + Inertia.js
- **Autenticación**: Laravel Sanctum + Session
- **Permisos**: Spatie Laravel Permission
- **Base de Datos**: MySQL/PostgreSQL
- **Middleware**: Custom CheckPermission
- **Hashing**: Bcrypt para contraseñas
- **Tokens**: UUID para invitaciones 