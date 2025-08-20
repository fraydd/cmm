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
('Cédula de Ciudadanía', 'Documento de identidad para mayores de 18 años', true, NOW(), NOW()),
('Tarjeta de Identidad', 'Documento de identidad para menores de 18 años', true, NOW(), NOW()),
('Cédula de Extranjería', 'Documento para extranjeros residentes en Colombia', true, NOW(), NOW()),
('Pasaporte', 'Documento de viaje internacional', true, NOW(), NOW()),
('Permiso Especial de Permanencia', 'Permiso para venezolanos en Colombia', true, NOW(), NOW()),
('Número Único de Identificación Personal', 'Número único para identificación', true, NOW(), NOW()),
('Número de Identificación Tributaria', 'Número para personas jurídicas', true, NOW(), NOW());

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
('Sede Principal', 'Calle 123 # 45-67, Bogotá D.C.', '3001234567', 'sede.principal@cmm.com', NULL, true, NOW(), NOW()),
('Sede Norte', 'Avenida 45 # 100-20, Bogotá D.C.', '3009876543', 'sede.norte@cmm.com', NULL, true, NOW(), NOW());


-- ===== CATEGORÍAS DE PRODUCTOS =====
INSERT INTO `product_categories` (`name`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
('Ropa', 'Vestimenta y accesorios de moda', true, NOW(), NOW()),
('Calzado', 'Zapatos, tenis y calzado deportivo', true, NOW(), NOW()),
('Accesorios', 'Bolsos, joyas, relojes y otros accesorios', true, NOW(), NOW()),
('Cosméticos', 'Productos de belleza y cuidado personal', true, NOW(), NOW()),
('Fotografía', 'Servicios y productos fotográficos', true, NOW(), NOW()),
('Capacitación', 'Cursos y talleres de modelaje', true, NOW(), NOW()),
('Eventos', 'Entradas y servicios para eventos', true, NOW(), NOW()),
('Material Promocional', 'Fotos, videos y material publicitario', true, NOW(), NOW());

-- ===== PLANES DE SUSCRIPCIÓN =====
INSERT INTO `subscription_plans` (`name`, `description`, `price`, `duration_months`, `is_active`, `created_at`, `updated_at`) VALUES
('Plan Básico', 'Acceso básico a clases y eventos', 150000.00, 1, true, NOW(), NOW()),
('Plan Estándar', 'Acceso completo a clases, eventos y material', 250000.00, 1, true, NOW(), NOW()),
('Plan Premium', 'Acceso completo + sesiones fotográficas incluidas', 350000.00, 1, true, NOW(), NOW()),
('Plan Anual Básico', 'Plan básico con descuento anual', 1500000.00, 12, true, NOW(), NOW()),
('Plan Anual Estándar', 'Plan estándar con descuento anual', 2500000.00, 12, true, NOW(), NOW()),
('Plan Anual Premium', 'Plan premium con descuento anual', 3500000.00, 12, true, NOW(), NOW());

-- ===== PLANES POR SEDE (branch_subscription_plans) =====
-- Asocia todos los planes a la sede 1 (Sede Principal) con el mismo precio por defecto
INSERT INTO `branch_subscription_plans` (`branch_id`, `subscription_plan_id`, `custom_price`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 150000.00, true, NOW(), NOW()),
(1, 2, 250000.00, true, NOW(), NOW()),
(1, 3, 350000.00, true, NOW(), NOW()),
(1, 4, 1500000.00, true, NOW(), NOW()),
(1, 5, 2500000.00, true, NOW(), NOW()),
(1, 6, 3500000.00, true, NOW(), NOW());

-- ===== ROLES DEL SISTEMA (Compatibles con RolesAndPermissionsSeeder) =====
INSERT INTO `roles` (`name`, `guard_name`, `created_at`, `updated_at`) VALUES
('admin', 'web', NOW(), NOW()),
('empleado', 'web', NOW(), NOW());

-- ===== PERMISOS DEL SISTEMA (Compatibles con RolesAndPermissionsSeeder) =====
INSERT INTO `permissions` (`name`, `guard_name`, `created_at`, `updated_at`) VALUES
-- Dashboard
('view_dashboard', 'web', NOW(), NOW()),

-- Gestión de invitaciones (solo admin)
('view_invitations', 'web', NOW(), NOW()),
('create_invitations', 'web', NOW(), NOW()),
('resend_invitations', 'web', NOW(), NOW()),
('cancel_invitations', 'web', NOW(), NOW()),
('delete_invitations', 'web', NOW(), NOW()),

-- Gestión de modelos (todos)
('view_modelos', 'web', NOW(), NOW()),
('create_modelos', 'web', NOW(), NOW()),
('edit_modelos', 'web', NOW(), NOW()),
('delete_modelos', 'web', NOW(), NOW()),

-- Gestión de usuarios (solo admin)
('view_users', 'web', NOW(), NOW()),
('create_users', 'web', NOW(), NOW()),
('edit_users', 'web', NOW(), NOW()),
('delete_users', 'web', NOW(), NOW()),

-- Gestión de roles (solo admin)
('view_roles', 'web', NOW(), NOW()),
('create_roles', 'web', NOW(), NOW()),
('edit_roles', 'web', NOW(), NOW()),
('delete_roles', 'web', NOW(), NOW()),

-- Gestión de asistencias
('view_attendance', 'web', NOW(), NOW()),
('create_attendance', 'web', NOW(), NOW()),
('edit_attendance', 'web', NOW(), NOW()),
('delete_attendance', 'web', NOW(), NOW()),

-- Gestión de empleados
('view_employees', 'web', NOW(), NOW()),
('create_employees', 'web', NOW(), NOW()),
('edit_employees', 'web', NOW(), NOW()),
('delete_employees', 'web', NOW(), NOW()),
('assign_employee_branches', 'web', NOW(), NOW()),

-- tienda
('view_store', 'web', NOW(), NOW()),
('edit_store', 'web', NOW(), NOW()),
('vender', 'web', NOW(), NOW()),
('ver_tienda', 'web', NOW(), NOW()),

-- ventas
('view_sales', 'web', NOW(), NOW()),
('edit_sales', 'web', NOW(), NOW()),

-- 

-- permisos 
('view_permissions', 'web', NOW(), NOW());

-- ===== ASIGNACIÓN DE PERMISOS A ROLES =====

-- Empleado: Permisos básicos
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`)
SELECT p.id, r.id 
FROM `permissions` p, `roles` r 
WHERE r.name = 'empleado' 
AND p.name IN (
    'view_dashboard',
    'view_modelos',
    'create_modelos',
    'edit_modelos',
    'delete_modelos',
    'view_attendance',
    'create_attendance',
    'edit_attendance',
    'view_employees',
    'ver_tienda',
    'vender'
);

-- Admin: Todos los permisos
INSERT INTO `role_has_permissions` (`permission_id`, `role_id`)
SELECT p.id, r.id 
FROM `permissions` p, `roles` r 
WHERE r.name = 'admin';

-- ===== USUARIO ROOT (ADMIN) =====
-- NOTA: El usuario admin se crea automáticamente por RootUserServiceProvider
-- cuando Laravel se inicia, usando las variables de entorno:
-- ROOT_USER_EMAIL, ROOT_USER_NAME, ROOT_USER_PASSWORD



-- ===== PRODUCTOS DE EJEMPLO =====
INSERT INTO `products` (`category_id`, `name`, `description`, `price`, `stock_quantity`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Camiseta Básica', 'Camiseta de algodón 100% para modelaje', 45000.00, 50, true, NOW(), NOW()),
(1, 'Jeans Clásicos', 'Jeans de alta calidad para sesiones fotográficas', 120000.00, 30, true, NOW(), NOW()),
(2, 'Tacones Profesionales', 'Tacones de 10cm para desfiles', 180000.00, 25, true, NOW(), NOW()),
(3, 'Bolso de Modelaje', 'Bolso profesional para modelos', 95000.00, 20, true, NOW(), NOW()),
(4, 'Kit de Maquillaje Profesional', 'Kit completo de maquillaje para sesiones', 250000.00, 15, true, NOW(), NOW()),
(5, 'Sesión Fotográfica Básica', 'Sesión de fotos de 1 hora con 10 fotos editadas', 150000.00, 999, true, NOW(), NOW()),
(5, 'Sesión Fotográfica Premium', 'Sesión de fotos de 2 horas con 20 fotos editadas y video', 300000.00, 999, true, NOW(), NOW()),
(6, 'Curso de Pasarela', 'Curso intensivo de pasarela de 8 horas', 200000.00, 999, true, NOW(), NOW()),
(6, 'Taller de Poses', 'Taller de poses fotográficas de 4 horas', 120000.00, 999, true, NOW(), NOW());

INSERT INTO `product_files` (`product_id`, `file_path`, `file_name`,`file_type`, `created_at`, `updated_at`) VALUES
(1, '/storage/products/camisa.jpeg', 'camisa', 'producto', NOW(), NOW()),
(1, '/storage/products/jeans.jpeg', 'jeans', 'producto', NOW(), NOW());

-- ===== EVENTOS DE EJEMPLO =====
INSERT INTO `events` (`name`, `description`, `event_date`, `registration_deadline`, `price`, `max_participants`, `current_participants`, `is_active`, `created_at`, `updated_at`) VALUES
('Desfile Primavera-Verano 2024', 'Desfile de moda con las últimas tendencias', '2024-03-15', '2024-03-10', 50000.00, 50, 0, true, NOW(), NOW()),
('Workshop de Fotografía', 'Taller práctico de fotografía de moda', '2024-03-20', '2024-03-18', 80000.00, 30, 0, true, NOW(), NOW()),
('Casting Nacional', 'Casting para agencias de modelaje', '2024-04-05', '2024-04-01', 25000.00, 100, 0, true, NOW(), NOW()),
('Fashion Week Bogotá', 'Semana de la moda en Bogotá', '2024-05-10', '2024-05-05', 150000.00, 200, 0, true, NOW(), NOW());

-- ===== ACCESO DE EVENTOS A SEDE =====
INSERT INTO `event_branch_access` (`event_id`, `branch_id`, `max_participants`, `custom_price`, `current_participants`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 50, 50000.00, 0, true, NOW(), NOW()),
(2, 1, 30, 70000.00, 0, true, NOW(), NOW()),
(3, 1, 100, 26000.00, 0, true, NOW(), NOW()),
(4, 1, 200, NULL, 0, true, NOW(), NOW());

-- ===== ACCESO DE PRODUCTOS A SEDE =====
INSERT INTO `product_branch_access` (`product_id`, `branch_id`, `stock_quantity`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, 50, true, NOW(), NOW()),
(2, 1, 30, true, NOW(), NOW()),
(3, 1, 25, true, NOW(), NOW()),
(4, 1, 20, true, NOW(), NOW()),
(5, 1, 15, true, NOW(), NOW()),
(6, 1, 999, true, NOW(), NOW()),
(7, 1, 999, true, NOW(), NOW()),
(8, 1, 999, true, NOW(), NOW()),
(9, 1, 999, true, NOW(), NOW());

-- ===== COLORES DE CABELLO =====
INSERT INTO `hair_colors` (`name`, `is_active`, `created_at`, `updated_at`) VALUES
('Negro', true, NOW(), NOW()),
('Castaño oscuro', true, NOW(), NOW()),
('Castaño claro', true, NOW(), NOW()),
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


-- ===== PRODUCTOS DE EJEMPLO PARA SEDE SECUNDARIA =====
INSERT INTO `product_branch_access` (`product_id`, `branch_id`, `stock_quantity`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 2, 20, true, NOW(), NOW()), -- Camiseta Básica
(3, 2, 10, true, NOW(), NOW()); -- Tacones Profesionales

-- ===== EVENTO DE EJEMPLO PARA SEDE SECUNDARIA =====
INSERT INTO `event_branch_access` (`event_id`, `branch_id`, `max_participants`, `current_participants`, `is_active`, `created_at`, `updated_at`) VALUES
(2, 2, 15, 0, true, NOW(), NOW()); -- Workshop de Fotografía

-- ===== PLANES POR SEDE SECUNDARIA (branch_subscription_plans) =====
INSERT INTO `branch_subscription_plans` (`branch_id`, `subscription_plan_id`, `custom_price`, `is_active`, `created_at`, `updated_at`) VALUES
(2, 1, 160000.00, true, NOW(), NOW()), -- Plan Básico con precio diferente
(2, 2, 260000.00, true, NOW(), NOW()); -- Plan Estándar
