# Configuración del Usuario Root

## Variables de Entorno Requeridas

Agrega estas variables a tu archivo `.env`:

```env
# Email del usuario administrador root
ROOT_USER_EMAIL=admin@cmm.com

# Nombre del usuario administrador root
ROOT_USER_NAME=Administrador

# Contraseña del usuario administrador root (debe ser segura)
ROOT_USER_PASSWORD=tu_contraseña_segura

# Habilitar creación automática del usuario root al iniciar la app
# true = se crea automáticamente, false = solo manualmente
AUTO_CREATE_ROOT_USER=true
```

## Funcionalidades Implementadas

### 1. Comando Artisan Manual
```bash
# Crear usuario root manualmente
php artisan app:create-root-user

# Forzar recreación del usuario (actualiza datos)
php artisan app:create-root-user --force
```

### 2. Creación Automática
- Se ejecuta automáticamente al iniciar la aplicación
- Solo si `AUTO_CREATE_ROOT_USER=true` en el `.env`
- Verifica si el usuario existe antes de crearlo
- Asigna automáticamente el rol de administrador

### 3. Características de Seguridad
- ✅ Validación de formato de email
- ✅ Contraseña hasheada con bcrypt
- ✅ Email marcado como verificado
- ✅ Logs de auditoría
- ✅ Manejo de errores robusto

## Flujo de Funcionamiento

1. **App inicia** → Lee variables del `.env`
2. **Verifica usuario** → Busca en base de datos
3. **Si no existe** → Lo crea automáticamente
4. **Asigna rol** → Rol de administrador
5. **Usuario listo** → Puede hacer login

## Ejemplo de Uso

1. Configura las variables en tu `.env`:
```env
ROOT_USER_EMAIL=admin@cmm.com
ROOT_USER_NAME=Administrador
ROOT_USER_PASSWORD=MiContraseñaSegura123
AUTO_CREATE_ROOT_USER=true
```

2. Inicia la aplicación:
```bash
php artisan serve
```

3. El usuario se crea automáticamente y puedes hacer login con:
   - Email: `admin@cmm.com`
   - Contraseña: `MiContraseñaSegura123`

## Logs

Los eventos se registran en `storage/logs/laravel.log`:
- ✅ Usuario creado exitosamente
- ⚠️ Variables no configuradas
- ❌ Errores durante la creación

## Comandos Disponibles

```bash
# Verificar estado del usuario root
php artisan app:create-root-user

# Recrear usuario root (actualizar datos)
php artisan app:create-root-user --force

# Ver logs de la aplicación
tail -f storage/logs/laravel.log
``` 