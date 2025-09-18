-- ===========================================
-- ESTRUCTURA COMPLETA DE BASE DE DATOS CMM
-- Sistema de Gestión de Modelos y Empleados
-- Versión: 3.0 - Con Sistema de Facturación Integrado
-- ===========================================

-- ===== TABLAS DEL SISTEMA Y AUTENTICACIÓN (LARAVEL) =====

CREATE TABLE `password_resets` (
  `email` varchar(255) PRIMARY KEY,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
);

CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
);

CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
);

CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `invitations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `status` enum('pending','accepted','expired') NOT NULL DEFAULT 'pending',
  `is_active` boolean NOT NULL DEFAULT true,
  `expires_at` timestamp NOT NULL,
  `invited_by` bigint unsigned DEFAULT NULL,
  `accepted_by` bigint unsigned DEFAULT NULL,
  `accepted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invitations_token_unique` (`token`),
  KEY `invitations_email_status_index` (`email`,`status`),
  KEY `invitations_token_status_index` (`token`,`status`),
  KEY `invitations_expires_at_index` (`expires_at`),
  KEY `invitations_invited_by_foreign` (`invited_by`),
  KEY `invitations_accepted_by_foreign` (`accepted_by`)
);

CREATE TABLE `permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `guard_name` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_guard_name_unique` (`name`,`guard_name`)
);

CREATE TABLE `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `guard_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_guard_name_unique` (`name`,`guard_name`)
);

CREATE TABLE `model_has_roles` (
  `role_id` bigint unsigned NOT NULL,
  `model_type` varchar(255) NOT NULL,
  `model_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`model_id`,`model_type`),
  KEY `model_has_roles_model_id_model_type_index` (`model_id`,`model_type`)
);

CREATE TABLE `model_has_permissions` (
  `permission_id` bigint unsigned NOT NULL,
  `model_type` varchar(255) NOT NULL,
  `model_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`model_id`,`model_type`),
  KEY `model_has_permissions_model_id_model_type_index` (`model_id`,`model_type`)
);

CREATE TABLE `role_has_permissions` (
  `permission_id` bigint unsigned NOT NULL,
  `role_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`role_id`),
  KEY `role_has_permissions_role_id_foreign` (`role_id`)
);

-- ===== TABLAS DE AUTENTICACIÓN Y PERMISOS =====

CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
);

-- ===== TABLAS DE CATÁLOGOS =====

CREATE TABLE `genders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `blood_types` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `identification_types` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text NULL,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `payment_methods` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text NULL,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

-- ===== TABLA PRINCIPAL DE PERSONAS =====

CREATE TABLE `people` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NULL,
  `identification_number` varchar(20) NOT NULL,
  `identification_type_id` bigint unsigned NULL,
  `identification_place` varchar(255) NULL,
  `birth_date` date NULL,
  `address` text NULL,
  `phone` varchar(20) NULL,
  `email` varchar(255) NULL,
  `gender_id` bigint unsigned NULL,
  `blood_type_id` bigint unsigned NULL,
  `photo` varchar(500) NULL,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `people_identification_number_unique` (`identification_number`),
  KEY `people_full_name_index` (`first_name`, `last_name`)
);

-- ===== TABLAS DE EMPLEADOS =====

CREATE TABLE `employees` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `person_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NULL,
  `role` varchar(100) NOT NULL,
  `hire_date` date NOT NULL,
  `end_date` date NULL,
  `salary` decimal(12,2) NULL,
  `job_description` text NULL,
  `role_id` bigint unsigned NULL,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `employee_branch_access` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint unsigned NOT NULL,
  `branch_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `employee_emergency_contacts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` bigint unsigned NOT NULL,
  `person_id` bigint unsigned NOT NULL,
  `relationship_id` bigint unsigned NOT NULL,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_emergency_contacts_employee_id_index` (`employee_id`),
  KEY `employee_emergency_contacts_person_id_index` (`person_id`)
);

-- ===== TABLAS DE MODELOS =====

CREATE TABLE `models` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `person_id` bigint unsigned NOT NULL,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `model_profiles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `model_id` bigint unsigned NOT NULL,
  `height` decimal(3,2) NOT NULL,
  `bust` int NOT NULL,
  `waist` int NOT NULL,
  `hips` int NOT NULL,
  `hair_color_id` bigint unsigned NULL,
  `eye_color_id` bigint unsigned NULL,
  `skin_color_id` bigint unsigned NULL,
  `pants_size` varchar(20) NULL,
  `shirt_size` varchar(20) NULL,
  `shoe_size` varchar(20) NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

-- Nueva tabla para múltiples imágenes de modelos
CREATE TABLE `model_files` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `model_id` bigint unsigned NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_type` varchar(50) NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `model_files_model_id_index` (`model_id`)
);

CREATE TABLE `social_media_platforms` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `model_social_media` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `model_id` bigint unsigned NOT NULL,
  `social_media_platform_id` bigint unsigned NOT NULL,
  `url` varchar(500) NULL,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `model_social_media_model_id_index` (`model_id`)
);

CREATE TABLE `guardians` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `model_id` bigint unsigned NOT NULL,
  `person_id` bigint unsigned NOT NULL,
  `relationship_id` bigint unsigned NOT NULL,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

-- ===== TABLAS DE CATÁLOGOS Y CONFIGURACIÓN =====

CREATE TABLE `item_types` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `invoice_types` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `invoice_statuses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  PRIMARY KEY (`id`)
);

-- ===== TABLAS DE PRODUCTOS Y SERVICIOS =====

CREATE TABLE `product_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text NULL,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `products` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NULL,
  `price` decimal(12,2) NOT NULL,
  `stock_quantity` int NOT NULL DEFAULT 0,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `products_category_id_index` (`category_id`)
);

CREATE TABLE `product_files` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_type` varchar(50) NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `product_files_product_id_index` (`product_id`)
);

-- ===== TABLAS DE PLANES Y SUSCRIPCIONES =====

CREATE TABLE `subscription_plans` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text NULL,
  `price` decimal(12,2) NOT NULL,
  `duration_months` int NOT NULL DEFAULT 1,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

-- Crear branch_subscription_plans antes de subscriptions
CREATE TABLE `branch_subscription_plans` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `branch_id` bigint unsigned NOT NULL,
  `subscription_plan_id` bigint unsigned NOT NULL,
  `custom_price` decimal(12,2) NULL,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `branch_subscription_plans_branch_id_index` (`branch_id`),
  KEY `branch_subscription_plans_subscription_plan_id_index` (`subscription_plan_id`)
);

-- Crear subscriptions después de branch_subscription_plans
CREATE TABLE `subscriptions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `model_id` bigint unsigned NOT NULL,
  `subscription_plan_id` bigint unsigned NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `subscriptions_model_id_status_index` (`model_id`,`is_active`),
  KEY `subscriptions_start_date_end_date_index` (`start_date`,`end_date`)
);

-- ===== TABLAS DE EVENTOS =====

CREATE TABLE `events` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text NULL,
  `event_date` date NOT NULL,
  `registration_deadline` date NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `max_participants` int NULL,
  `current_participants` int NOT NULL DEFAULT 0,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `events_event_date_index` (`event_date`),
  KEY `events_registration_deadline_index` (`registration_deadline`)
);

CREATE TABLE `event_registrations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `model_id` bigint unsigned NOT NULL,
  `event_id` bigint unsigned NOT NULL,
  `registration_date` timestamp NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'registered',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `event_registrations_model_id_event_id_index` (`model_id`,`event_id`),
  KEY `event_registrations_event_id_status_index` (`event_id`,`status`)
);

CREATE TABLE `event_branch_access` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `event_id` bigint unsigned NOT NULL,
  `branch_id` bigint unsigned NOT NULL,
  `max_participants` int NULL,
  `custom_price` decimal(12,2) NULL,
  `current_participants` int NOT NULL DEFAULT 0,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

-- ===== TABLAS DE CARRITO DE COMPRAS =====

CREATE TABLE `cart` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `person_id` bigint unsigned NOT NULL,
  `item_type_id` bigint unsigned NOT NULL,
  `subscription_id` bigint unsigned NULL,
  `event_id` bigint unsigned NULL,
  `product_id` bigint unsigned NULL,
  `quantity` int NOT NULL DEFAULT 1,
  `branch_id` bigint unsigned NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `total_price` decimal(12,2) NOT NULL,
  `start_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cart_person_id_index` (`person_id`),
  KEY `cart_item_type_id_index` (`item_type_id`),
  KEY `cart_person_id_created_at_index` (`person_id`,`created_at`)
);

-- ===== TABLAS DE SEDES =====

CREATE TABLE `branches` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `phone` varchar(20) NOT NULL,
  `email` varchar(255) NULL,
  `manager_id` bigint unsigned NULL,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `branches_manager_id_index` (`manager_id`)
);

CREATE TABLE `subscription_branch_access` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `subscription_id` bigint unsigned NOT NULL,
  `branch_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `product_branch_access` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint unsigned NOT NULL,
  `branch_id` bigint unsigned NOT NULL,
  `stock_quantity` int NOT NULL DEFAULT 0,
  `price` decimal(12,2) NOT NULL DEFAULT 0,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

-- ===== TABLAS DE FACTURACIÓN =====

CREATE TABLE `invoices` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `branch_id` bigint unsigned NOT NULL,
  `person_id` bigint unsigned NULL,
  `invoice_date` timestamp NULL DEFAULT NULL,
  `total_amount` decimal(12,2) NOT NULL DEFAULT 0,
  `paid_amount` decimal(12,2) NOT NULL DEFAULT 0,
  `remaining_amount` decimal(12,2) NOT NULL DEFAULT 0,
  `status_id` bigint unsigned NULL,
  `invoice_type_id` bigint unsigned NOT NULL DEFAULT 1,
  `observations` text NULL,
  `created_by` bigint unsigned NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `invoices_branch_id_index` (`branch_id`),
  KEY `invoices_person_id_index` (`person_id`),
  KEY `invoices_invoice_date_index` (`invoice_date`)
);

CREATE TABLE `invoice_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `invoice_id` bigint unsigned NOT NULL,
  `item_type_id` bigint unsigned NOT NULL,
  `subscription_id` bigint unsigned NULL,
  `event_id` bigint unsigned NULL,
  `product_id` bigint unsigned NULL,
  `quantity` int NOT NULL DEFAULT 1,
  `unit_price` decimal(12,2) NOT NULL,
  `total_price` decimal(12,2) NOT NULL,
  `branch_id` bigint unsigned NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

-- ===== TABLAS DE PAGOS =====

CREATE TABLE `payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `branch_id` bigint unsigned NOT NULL,
  `cash_register_id` bigint unsigned NOT NULL,
  `invoice_id` bigint unsigned NOT NULL,
  `payment_method_id` bigint unsigned NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_date` timestamp NOT NULL,
  `observations` text NULL,
  `created_by` bigint unsigned NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payments_branch_id_index` (`branch_id`),
  KEY `payments_invoice_id_index` (`invoice_id`),
  KEY `payments_payment_date_index` (`payment_date`)
);

-- ===== TABLAS DE CONTROL DE CAJA =====

CREATE TABLE `cash_register` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `branch_id` bigint unsigned NOT NULL,
  `opening_date` timestamp NOT NULL,
  `closing_date` timestamp NULL,
  `initial_amount` decimal(12,2) NOT NULL,
  `final_amount` decimal(12,2) NULL,
  `total_income` decimal(12,2) NOT NULL DEFAULT 0,
  `total_expenses` decimal(12,2) NOT NULL DEFAULT 0,
  `status` varchar(20) NOT NULL DEFAULT 'open',
  `responsible_user_id` bigint unsigned NOT NULL,
  `observations` text NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cash_register_branch_id_index` (`branch_id`),
  KEY `cash_register_opening_date_index` (`opening_date`),
  KEY `cash_register_status_index` (`status`)
);

-- CREATE TABLE `cash_movements` (
--   `id` bigint unsigned NOT NULL AUTO_INCREMENT,
--   `cash_register_id` bigint unsigned NOT NULL,
--   `movement_type` varchar(20) NOT NULL,
--   `person_id` bigint unsigned NULL,
--   `invoice_id` bigint unsigned NULL,
--   `payment_id` bigint unsigned NULL,
--   `responsible_user_id` bigint unsigned NOT NULL,
--   `branch_id` bigint unsigned NOT NULL,
--   `amount` decimal(12,2) NOT NULL,
--   `concept` varchar(255) NOT NULL,
--   `observations` text NULL,
--   `movement_date` timestamp NOT NULL,
--   `created_at` timestamp NULL DEFAULT NULL,
--   `updated_at` timestamp NULL DEFAULT NULL,
--   PRIMARY KEY (`id`),
--   KEY `cash_movements_cash_register_id_movement_date_index` (`cash_register_id`,`movement_date`),
--   KEY `cash_movements_movement_type_index` (`movement_type`)
-- );

-- ===== TABLAS DE ASISTENCIA =====

CREATE TABLE `attendance_records` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `branch_id` bigint unsigned NOT NULL,
  `employee_id` bigint unsigned NULL,
  `model_id` bigint unsigned NULL,
  `check_in` timestamp NOT NULL,
  `check_out` timestamp NULL,
  `observations` text NULL,
   `is_closed` boolean NOT NULL DEFAULT false,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `attendance_records_branch_id_index` (`branch_id`),
  KEY `attendance_records_employee_id_index` (`employee_id`),
  KEY `attendance_records_model_id_index` (`model_id`),
  KEY `attendance_records_check_in_index` (`check_in`)
);

-- ===== RELACIONES FORÁNEAS =====

-- Relaciones del Sistema y Autenticación (Laravel)
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_invited_by_foreign` FOREIGN KEY (`invited_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_accepted_by_foreign` FOREIGN KEY (`accepted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;
ALTER TABLE `model_has_permissions` ADD CONSTRAINT `model_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE;
ALTER TABLE `role_has_permissions` ADD CONSTRAINT `role_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE;
ALTER TABLE `model_has_roles` ADD CONSTRAINT `model_has_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;
ALTER TABLE `model_has_roles` ADD CONSTRAINT `model_has_roles_user_id_foreign` FOREIGN KEY (`model_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
ALTER TABLE `role_has_permissions` ADD CONSTRAINT `role_has_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

-- Relaciones de Personas y Catálogos
ALTER TABLE `people` ADD CONSTRAINT `people_identification_type_id_foreign` FOREIGN KEY (`identification_type_id`) REFERENCES `identification_types` (`id`);
ALTER TABLE `people` ADD CONSTRAINT `people_gender_id_foreign` FOREIGN KEY (`gender_id`) REFERENCES `genders` (`id`);
ALTER TABLE `people` ADD CONSTRAINT `people_blood_type_id_foreign` FOREIGN KEY (`blood_type_id`) REFERENCES `blood_types` (`id`);

-- Relaciones de Personas y Empleados
ALTER TABLE `employees` ADD CONSTRAINT `employees_person_id_foreign` FOREIGN KEY (`person_id`) REFERENCES `people` (`id`);
ALTER TABLE `employees` ADD CONSTRAINT `employees_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
ALTER TABLE `employees` ADD CONSTRAINT `employees_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL;

-- Relaciones de Personas y Modelos
ALTER TABLE `models` ADD CONSTRAINT `models_person_id_foreign` FOREIGN KEY (`person_id`) REFERENCES `people` (`id`);
ALTER TABLE `model_profiles` ADD CONSTRAINT `model_profiles_model_id_foreign` FOREIGN KEY (`model_id`) REFERENCES `models` (`id`);
ALTER TABLE `model_social_media` ADD CONSTRAINT `model_social_media_model_id_foreign` FOREIGN KEY (`model_id`) REFERENCES `models` (`id`);
ALTER TABLE `guardians` ADD CONSTRAINT `guardians_model_id_foreign` FOREIGN KEY (`model_id`) REFERENCES `models` (`id`);
ALTER TABLE `guardians` ADD CONSTRAINT `guardians_person_id_foreign` FOREIGN KEY (`person_id`) REFERENCES `people` (`id`);

-- Relaciones de Personas y Usuarios
ALTER TABLE `cart` ADD CONSTRAINT `cart_person_id_foreign` FOREIGN KEY (`person_id`) REFERENCES `people` (`id`);
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_person_id_foreign` FOREIGN KEY (`person_id`) REFERENCES `people` (`id`);
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);
ALTER TABLE `payments` ADD CONSTRAINT `payments_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);
ALTER TABLE `payments` ADD CONSTRAINT `payments_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);
ALTER TABLE `cash_register` ADD CONSTRAINT `cash_register_responsible_user_id_foreign` FOREIGN KEY (`responsible_user_id`) REFERENCES `users` (`id`);

-- Relaciones de Sedes
ALTER TABLE `employee_branch_access` ADD CONSTRAINT `employee_branch_access_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);
ALTER TABLE `subscription_branch_access` ADD CONSTRAINT `subscription_branch_access_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);
ALTER TABLE `product_branch_access` ADD CONSTRAINT `product_branch_access_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);
ALTER TABLE `event_branch_access` ADD CONSTRAINT `event_branch_access_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);
ALTER TABLE `branches` ADD CONSTRAINT `branches_manager_id_foreign` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`);

-- Relaciones de Catálogos
ALTER TABLE `product_branch_access` ADD CONSTRAINT `product_branch_access_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_item_type_id_foreign` FOREIGN KEY (`item_type_id`) REFERENCES `item_types` (`id`);
ALTER TABLE `cart` ADD CONSTRAINT `cart_item_type_id_foreign` FOREIGN KEY (`item_type_id`) REFERENCES `item_types` (`id`);
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_invoice_type_id_foreign` FOREIGN KEY (`invoice_type_id`) REFERENCES `invoice_types` (`id`);
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_status_id_foreign` FOREIGN KEY (`status_id`) REFERENCES `invoice_statuses` (`id`);
ALTER TABLE `payments` ADD CONSTRAINT `payments_payment_method_id_foreign` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`);

-- Relaciones de Productos
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `product_categories` (`id`);
ALTER TABLE `cart` ADD CONSTRAINT `cart_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

-- Relaciones de Suscripciones
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_model_id_foreign` FOREIGN KEY (`model_id`) REFERENCES `models` (`id`);
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_subscription_plan_id_foreign` FOREIGN KEY (`subscription_plan_id`) REFERENCES `subscription_plans` (`id`);
ALTER TABLE `cart` ADD CONSTRAINT `cart_subscription_id_foreign` FOREIGN KEY (`subscription_id`) REFERENCES `subscription_plans` (`id`);
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_subscription_id_foreign` FOREIGN KEY (`subscription_id`) REFERENCES `subscription_plans` (`id`);

-- Relaciones de Eventos
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`);
ALTER TABLE `event_registrations` ADD CONSTRAINT `event_registrations_model_id_foreign` FOREIGN KEY (`model_id`) REFERENCES `models` (`id`);
ALTER TABLE `cart` ADD CONSTRAINT `cart_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`);
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`);

-- Relaciones de Facturación
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_invoice_id_foreign` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`);
ALTER TABLE `invoice_items` ADD CONSTRAINT `invoice_items_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);
ALTER TABLE `cart` ADD CONSTRAINT `cart_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);
ALTER TABLE `payments` ADD CONSTRAINT `payments_invoice_id_foreign` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`);



-- Relaciones de Caja
ALTER TABLE `cash_register` ADD CONSTRAINT `cash_register_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);
ALTER TABLE `payments` ADD CONSTRAINT `payments_cash_register_id_foreign` FOREIGN KEY (`cash_register_id`) REFERENCES `cash_register` (`id`);
-- ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_invoice_id_foreign` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`);
-- ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_payment_id_foreign` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`);
-- ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_person_id_foreign` FOREIGN KEY (`person_id`) REFERENCES `people` (`id`);
-- ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_responsible_user_id_foreign` FOREIGN KEY (`responsible_user_id`) REFERENCES `users` (`id`);
-- ALTER TABLE `cash_movements` ADD CONSTRAINT `cash_movements_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);

-- Relaciones de Asistencia
ALTER TABLE `employee_branch_access` ADD CONSTRAINT `employee_branch_access_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`);
ALTER TABLE `employee_emergency_contacts` ADD CONSTRAINT `employee_emergency_contacts_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`);
ALTER TABLE `employee_emergency_contacts` ADD CONSTRAINT `employee_emergency_contacts_person_id_foreign` FOREIGN KEY (`person_id`) REFERENCES `people` (`id`);
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_employee_id_foreign` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`);
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_model_id_foreign` FOREIGN KEY (`model_id`) REFERENCES `models` (`id`);
ALTER TABLE `attendance_records` ADD CONSTRAINT `attendance_records_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);

-- Relaciones de Acceso por Sede
ALTER TABLE `subscription_branch_access` ADD CONSTRAINT `subscription_branch_access_subscription_id_foreign` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`);
ALTER TABLE `event_branch_access` ADD CONSTRAINT `event_branch_access_event_id_foreign` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`);

-- ===== NUEVOS CATÁLOGOS PARA MODELOS =====

CREATE TABLE `hair_colors` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL UNIQUE,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `eye_colors` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL UNIQUE,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `skin_colors` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL UNIQUE,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `relationships` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL UNIQUE,
  `is_active` boolean NOT NULL DEFAULT true,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
);

-- Relaciones de Catálogos de Modelos
ALTER TABLE `model_profiles` ADD CONSTRAINT `model_profiles_hair_color_id_foreign` FOREIGN KEY (`hair_color_id`) REFERENCES `hair_colors` (`id`);
ALTER TABLE `model_profiles` ADD CONSTRAINT `model_profiles_eye_color_id_foreign` FOREIGN KEY (`eye_color_id`) REFERENCES `eye_colors` (`id`);
ALTER TABLE `model_profiles` ADD CONSTRAINT `model_profiles_skin_color_id_foreign` FOREIGN KEY (`skin_color_id`) REFERENCES `skin_colors` (`id`);
ALTER TABLE `guardians` ADD CONSTRAINT `guardians_relationship_id_foreign` FOREIGN KEY (`relationship_id`) REFERENCES `relationships` (`id`);
ALTER TABLE `employee_emergency_contacts` ADD CONSTRAINT `employee_emergency_contacts_relationship_id_foreign` FOREIGN KEY (`relationship_id`) REFERENCES `relationships` (`id`);
ALTER TABLE `model_files` ADD CONSTRAINT `model_files_model_id_foreign` FOREIGN KEY (`model_id`) REFERENCES `models` (`id`);
ALTER TABLE `model_social_media` ADD CONSTRAINT `model_social_media_social_media_platform_id_foreign` FOREIGN KEY (`social_media_platform_id`) REFERENCES `social_media_platforms` (`id`);

-- Relaciones de Suscripciones y Planes por Sede
ALTER TABLE `branch_subscription_plans` ADD CONSTRAINT `branch_subscription_plans_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);
ALTER TABLE `branch_subscription_plans` ADD CONSTRAINT `branch_subscription_plans_subscription_plan_id_foreign` FOREIGN KEY (`subscription_plan_id`) REFERENCES `subscription_plans` (`id`);
ALTER TABLE `product_files` ADD CONSTRAINT `product_files_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);
