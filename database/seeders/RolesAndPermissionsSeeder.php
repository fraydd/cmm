<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Crear permisos
        $permissions = [
            // Dashboard
            'view_dashboard',
            
            // Gestión de invitaciones (solo admin)
            'view_invitations',
            'create_invitations',
            'resend_invitations',
            'cancel_invitations',
            
            // Gestión de modelos (todos)
            'view_modelos',
            'create_modelos',
            'edit_modelos',
            'delete_modelos',
            
            // Gestión de usuarios (solo admin)
            'view_users',
            'create_users',
            'edit_users',
            'delete_users',
            
            // Gestión de roles (solo admin)
            'view_roles',
            'create_roles',
            'edit_roles',
            'delete_roles',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Crear rol de empleado
        $empleadoRole = Role::firstOrCreate(['name' => 'empleado', 'guard_name' => 'web']);
        
        // Asignar permisos al empleado
        $empleadoPermissions = [
            'view_dashboard',
            'view_modelos',
            'create_modelos',
            'edit_modelos',
            'delete_modelos',
        ];
        
        $empleadoRole->givePermissionTo($empleadoPermissions);

        // Crear rol de admin
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        
        // Asignar todos los permisos al admin
        $adminRole->givePermissionTo($permissions);

        // Asignar rol admin al usuario root (si existe)
        $rootUser = \App\Models\User::where('email', env('ROOT_EMAIL', 'admin@cmm.com'))->first();
        if ($rootUser) {
            $rootUser->assignRole('admin');
            $this->command->info('Rol admin asignado al usuario root: ' . $rootUser->email);
        }

        $this->command->info('Roles y permisos creados exitosamente!');
        $this->command->info('Roles: admin, empleado');
        $this->command->info('Permisos creados: ' . count($permissions));
    }
}
