<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class RootUserServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Solo ejecutar en producción o cuando se solicite explícitamente
        if (app()->environment('production') || env('AUTO_CREATE_ROOT_USER', false)) {
            $this->ensureRootUserExists();
        }
    }

    /**
     * Asegurar que el usuario root existe
     */
    private function ensureRootUserExists(): void
    {
        try {
            // Obtener variables de entorno
            $rootEmail = env('ROOT_USER_EMAIL');
            $rootName = env('ROOT_USER_NAME', 'Administrador');
            $rootPassword = env('ROOT_USER_PASSWORD');

            // Si no están configuradas, no hacer nada
            if (!$rootEmail || !$rootPassword) {
                Log::info('Variables de entorno para usuario root no configuradas');
                return;
            }

            // Verificar si el usuario ya existe
            $existingUser = User::where('email', $rootEmail)->first();

            if (!$existingUser) {
                // Crear el usuario root
                $user = User::create([
                    'name' => $rootName,
                    'email' => $rootEmail,
                    'password' => Hash::make($rootPassword),
                    'email_verified_at' => now(),
                ]);

                Log::info("Usuario root creado automáticamente: {$user->email}");

                // Asignar rol de administrador si Spatie Permission está disponible
                if (class_exists('Spatie\Permission\Models\Role')) {
                    $this->assignAdminRole($user);
                }
            }

        } catch (\Exception $e) {
            Log::error('Error al crear usuario root automáticamente: ' . $e->getMessage());
        }
    }

    /**
     * Asignar rol de administrador
     */
    private function assignAdminRole(User $user): void
    {
        try {
            // Crear rol admin si no existe
            $adminRole = \Spatie\Permission\Models\Role::firstOrCreate([
                'name' => 'admin',
                'guard_name' => 'web'
            ]);

            // Asignar rol al usuario si no lo tiene
            if (!$user->hasRole('admin')) {
                $user->assignRole($adminRole);
                Log::info("Rol de administrador asignado a: {$user->email}");
            }

        } catch (\Exception $e) {
            Log::warning('No se pudo asignar rol de administrador: ' . $e->getMessage());
        }
    }
} 