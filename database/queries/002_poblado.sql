-- ===========================================
-- DATOS MAESTROS PARA COLOMBIA
-- Sistema de Gestión de Modelos y Empleados
-- ===========================================

-- ===== GÉNEROS =====
INSERT INTO `genders` (`name`, `is_active`, `created_at`, `updated_at`) VALUES
('Masculino', true, NOW(), NOW()),
('Femenino', true, NOW(), NOW()),
('No binario', true, NOW(), NOW()),
('Prefiero no decir', true, NOW(), NOW());

-- ===== TIPOS DE SANGRE =====
INSERT INTO `blood_types` (`name`, `is_active`, `created_at`, `updated_at`) VALUES
('A+', true, NOW(), NOW()),
('A-', true, NOW(), NOW()),
('B+', true, NOW(), NOW()),
('B-', true, NOW(), NOW()),
('AB+', true, NOW(), NOW()),
('AB-', true, NOW(), NOW()),
('O+', true, NOW(), NOW()),
('O-', true, NOW(), NOW());

-- ===== TIPOS DE IDENTIFICACIÓN (COLOMBIA) =====
INSERT INTO `identification_types` (`name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
('Pasaporte', 'Documento de viaje internacional (Colombia)', true, NOW(), NOW()),
('Cédula de ciudadania', 'Documento principal de identificación para ciudadanos colombianos', true, NOW(), NOW()),
('Tarjeta de identidad', 'Identificación para menores de edad en Colombia', true, NOW(), NOW()),
('Cédula extranjera', 'Identificación para extranjeros residentes en Colombia', true, NOW(), NOW()),
('Número de identificación personal', 'NIP asignado en Colombia', true, NOW(), NOW()),
('Número de identificación tributaria', 'NIT para personas o empresas en Colombia', true, NOW(), NOW()),
('Indocumentado', 'Persona sin documento de identificación en Colombia', true, NOW(), NOW());

-- ===== MÉTODOS DE PAGO =====
INSERT INTO `payment_methods` (`name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
('Efectivo', 'Pago en efectivo', true, NOW(), NOW()),
('Tarjeta de Crédito', 'Pago con tarjeta de crédito', true, NOW(), NOW()),
('Tarjeta de Débito', 'Pago con tarjeta de débito', true, NOW(), NOW()),
('Transferencia Bancaria', 'Transferencia electrónica entre cuentas', true, NOW(), NOW()),
('PSE (Pagos Seguros en Línea)', 'Pago electrónico seguro en línea', true, NOW(), NOW()),
('Daviplata', 'Billetera digital de Davivienda', true, NOW(), NOW()),
('Nequi', 'Billetera digital de Bancolombia', true, NOW(), NOW()),
('Cheque', 'Pago mediante cheque bancario', true, NOW(), NOW()),
('Consignación', 'Consignación bancaria', true, NOW(), NOW());

-- ===== PLATAFORMAS DE REDES SOCIALES =====
INSERT INTO `social_media_platforms` (`name`, `created_at`, `updated_at`) VALUES
('Facebook', NOW(), NOW()),
('Instagram', NOW(), NOW()),
('Twitter', NOW(), NOW()),
('TikTok', NOW(), NOW()),
('Other', NOW(), NOW());

-- ===== TIPOS DE ITEMS =====
INSERT INTO `item_types` (`name`, `created_at`, `updated_at`) VALUES
('Producto', NOW(), NOW()),
('Suscripción', NOW(), NOW()),
('Evento', NOW(), NOW()),
('Servicio', NOW(), NOW());

-- ===== TIPOS DE FACTURA =====
INSERT INTO `invoice_types` (`name`) VALUES
('Ingreso'),
('Egreso');

-- ===== ESTADOS DE FACTURA =====
INSERT INTO `invoice_statuses` (`name`) VALUES
('Pendiente'),
('Pagada'),
('Parcialmente Pagada'),
('Anulada'),
('Vencida');

-- ===== SEDE PRINCIPAL =====
INSERT INTO `branches` (`name`, `address`, `phone`, `email`, `manager_id`, `is_active`, `created_at`, `updated_at`) VALUES
('Sede Principal', 'ejemplo', '3000', 'sede.principal@cmm.com', NULL, true, NOW(), NOW());


-- ===== CATEGORÍAS DE PRODUCTOS =====
INSERT INTO `product_categories` (`name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
('Ropa', 'Vestimenta y accesorios de moda', true, NOW(), NOW()),
('Calzado', 'Zapatos, tenis y calzado deportivo', true, NOW(), NOW()),
('Accesorios', 'Bolsos, joyas, relojes y otros accesorios', true, NOW(), NOW()),
('Cosméticos', 'Productos de belleza y cuidado personal', true, NOW(), NOW()),
('Fotografía', 'Servicios y productos fotográficos', true, NOW(), NOW()),
('Material Promocional', 'Fotos, videos y material publicitario', true, NOW(), NOW());


-- ===== ROLES DEL SISTEMA (Compatibles con RolesAndPermissionsSeeder) =====
INSERT INTO `roles` (`name`, `guard_name`, `created_at`, `updated_at`) VALUES
('admin', 'web', NOW(), NOW()),
('empleado', 'web', NOW(), NOW());

-- ===== PERMISOS DEL SISTEMA (Compatibles con RolesAndPermissionsSeeder) =====
INSERT INTO `permissions` (`name`, `guard_name`, `description`, `created_at`, `updated_at`) VALUES
-- Dashboard
('ver_dashboard', 'web', 'Acceso al panel principal del sistema', NOW(), NOW()),

-- Gestión de invitaciones (solo admin)
('ver_invitaciones', 'web', 'Ver lista de invitaciones enviadas', NOW(), NOW()),
('editar_invitaciones', 'web', 'Crear y gestionar invitaciones de usuario', NOW(), NOW()),

-- Gestión de modelos (todos)
('ver_modelos', 'web', 'Ver lista y perfiles de modelos', NOW(), NOW()),
('editar_modelos', 'web', 'Crear y editar información de modelos', NOW(), NOW()),

-- Gestión de roles (solo admin)
('ver_roles', 'web', 'Ver roles y permisos del sistema', NOW(), NOW()),
('editar_roles', 'web', 'Gestionar roles y asignar permisos', NOW(), NOW()),

-- Gestión de asistencias
('ver_asistencias', 'web', 'Ver registros de asistencia', NOW(), NOW()),
('editar_asistencias', 'web', 'Modificar registros de asistencia', NOW(), NOW()),
('crear_asistencias', 'web', 'Registrar nueva asistencia', NOW(), NOW()),


-- Gestión de empleados
('ver_empleados', 'web', 'Ver lista de empleados', NOW(), NOW()),
('editar_empleados', 'web', 'Crear y editar información de empleados', NOW(), NOW()),

-- Tienda
('ver_tienda', 'web', 'Acceso al sistema de ventas', NOW(), NOW()),
('editar_tienda', 'web', 'Realizar ventas y gestionar carrito', NOW(), NOW()),
('ver_admin_tienda', 'web', 'Ver administración de productos/planes', NOW(), NOW()),
('editar_admin_tienda', 'web', 'Gestionar productos, planes y eventos', NOW(), NOW()),

-- Cierres de caja
('ver_cajas', 'web', 'Ver cierres y movimientos de caja', NOW(), NOW()),
('editar_cajas', 'web', 'Abrir/cerrar caja y registrar movimientos', NOW(), NOW()),

-- Facturas
('ver_facturas', 'web', 'Ver facturas y reportes de ventas', NOW(), NOW()),
('editar_facturas', 'web', 'Generar y modificar facturas', NOW(), NOW()),

-- Sedes
('ver_sedes', 'web', 'Ver información de sedes', NOW(), NOW()),
('editar_sedes', 'web', 'Crear y gestionar sedes', NOW(), NOW()),

('ver_reportes', 'web', 'Ver y descargar reportes', NOW(), NOW());

-- ===== ASIGNACIÓN DE PERMISOS A ROLES =====

-- Empleado: Permisos básicos
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`)
SELECT p.id, r.id 
FROM `permissions` p, `roles` r 
WHERE r.name = 'empleado' 
AND p.name IN (
    'ver_dashboard',
    'ver_modelos',
    'editar_modelos',
    'ver_asistencias',
    'crear_asistencias',
    'ver_empleados',
    'ver_tienda',
    'editar_tienda',
    'ver_cajas'
);

-- Admin: Todos los permisos
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`)
SELECT p.id, r.id 
FROM `permissions` p, `roles` r 
WHERE r.name = 'admin';


-- ===== COLORES DE CABELLO =====
INSERT INTO `hair_colors` (`name`, `is_active`, `created_at`, `updated_at`) VALUES
('Negro', true, NOW(), NOW()),
('Castaño oscuro', true, NOW(), NOW()),
('Castaño claro', true, NOW(), NOW()),
('Castaño medio', true, NOW(), NOW()),
('Rubio', true, NOW(), NOW()),
('Pelirrojo', true, NOW(), NOW()),
('Gris', true, NOW(), NOW()),
('Blanco', true, NOW(), NOW()),
('Canoso', true, NOW(), NOW()),
('Teñido fantasía', true, NOW(), NOW()),
('Calvo', true, NOW(), NOW());

-- ===== COLORES DE OJOS =====
INSERT INTO `eye_colors` (`name`, `is_active`, `created_at`, `updated_at`) VALUES
('Café oscuro', true, NOW(), NOW()),
('Café claro', true, NOW(), NOW()),
('Negro', true, NOW(), NOW()),
('Azul', true, NOW(), NOW()),
('Verde', true, NOW(), NOW()),
('Gris', true, NOW(), NOW()),
('Ámbar', true, NOW(), NOW()),
('Avellana', true, NOW(), NOW()),
('Violeta', true, NOW(), NOW()),
('Heterocromía', true, NOW(), NOW());

-- ===== COLORES DE PIEL =====
INSERT INTO `skin_colors` (`name`, `is_active`, `created_at`, `updated_at`) VALUES
('Muy clara', true, NOW(), NOW()),
('Clara', true, NOW(), NOW()),
('Trigueña', true, NOW(), NOW()),
('Morena clara', true, NOW(), NOW()),
('Morena oscura', true, NOW(), NOW()),
('Negra', true, NOW(), NOW()),
('Albina', true, NOW(), NOW()),
('Asiática', true, NOW(), NOW()),
('Indígena', true, NOW(), NOW()),
('Mixta', true, NOW(), NOW());

-- ===== PARENTESCOS =====
INSERT INTO `relationships` (`name`, `is_active`, `created_at`, `updated_at`) VALUES
('Padre', true, NOW(), NOW()),
('Madre', true, NOW(), NOW()),
('Hermano/a', true, NOW(), NOW()),
('Tío/a', true, NOW(), NOW()),
('Abuelo/a', true, NOW(), NOW()),
('Tutor legal', true, NOW(), NOW()),
('Pareja', true, NOW(), NOW()),
('Otro', true, NOW(), NOW());

-- ===== POBLADO INICIAL DE ESTADOS DE SUSCRIPCIÓN =====
INSERT INTO subscription_statuses (name, created_at, updated_at) VALUES
  ('active', NOW(), NOW()),
  ('cancelled', NOW(), NOW()),
  ('expired', NOW(), NOW());