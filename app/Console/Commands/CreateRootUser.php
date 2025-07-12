<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateRootUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:create-root-user {--force : Forzar la creación incluso si ya existe}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Crear usuario root desde variables de entorno';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Verificando configuración de usuario root...');

        // Obtener variables de entorno
        $rootEmail = env('ROOT_USER_EMAIL', 'admin@cmm.com');
        $rootName = env('ROOT_USER_NAME', 'Administrador');
        $rootPassword = env('ROOT_USER_PASSWORD', 'password123');

        // Validar que las variables estén configuradas
        if (!$rootEmail || !$rootName || !$rootPassword) {
            $this->error('❌ Variables de entorno no configuradas correctamente.');
            $this->line('Por favor, configura en tu archivo .env:');
            $this->line('ROOT_USER_EMAIL=admin@cmm.com');
            $this->line('ROOT_USER_NAME=Administrador');
            $this->line('ROOT_USER_PASSWORD=tu_contraseña_segura');
            return 1;
        }

        // Validar formato de email
        $validator = Validator::make(['email' => $rootEmail], [
            'email' => 'required|email'
        ]);

        if ($validator->fails()) {
            $this->error('❌ Email inválido en ROOT_USER_EMAIL');
            return 1;
        }

        // Verificar si el usuario ya existe
        $existingUser = User::where('email', $rootEmail)->first();

        if ($existingUser && !$this->option('force')) {
            $this->warn('⚠️  El usuario root ya existe:');
            $this->line("   Email: {$existingUser->email}");
            $this->line("   Nombre: {$existingUser->name}");
            $this->line("   Creado: {$existingUser->created_at}");
            
            if ($this->confirm('¿Deseas actualizar el usuario existente?')) {
                $this->updateExistingUser($existingUser, $rootName, $rootPassword);
            }
            return 0;
        }

        // Crear o actualizar usuario
        if ($existingUser && $this->option('force')) {
            $this->updateExistingUser($existingUser, $rootName, $rootPassword);
        } else {
            $this->createNewUser($rootEmail, $rootName, $rootPassword);
        }

        return 0;
    }

    /**
     * Crear nuevo usuario root
     */
    private function createNewUser($email, $name, $password)
    {
        try {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'email_verified_at' => now(), // Marcar como verificado
            ]);

            $this->info('✅ Usuario root creado exitosamente:');
            $this->line("   Email: {$user->email}");
            $this->line("   Nombre: {$user->name}");
            $this->line("   ID: {$user->id}");

            // Aquí podrías asignar roles si tienes Spatie Permission configurado
            if (class_exists('Spatie\Permission\Models\Role')) {
                $this->assignAdminRole($user);
            }

        } catch (\Exception $e) {
            $this->error('❌ Error al crear usuario root: ' . $e->getMessage());
            return 1;
        }
    }

    /**
     * Actualizar usuario existente
     */
    private function updateExistingUser($user, $name, $password)
    {
        try {
            $user->update([
                'name' => $name,
                'password' => Hash::make($password),
            ]);

            $this->info('✅ Usuario root actualizado exitosamente:');
            $this->line("   Email: {$user->email}");
            $this->line("   Nombre: {$user->name}");
            $this->line("   ID: {$user->id}");

        } catch (\Exception $e) {
            $this->error('❌ Error al actualizar usuario root: ' . $e->getMessage());
            return 1;
        }
    }

    /**
     * Asignar rol de administrador
     */
    private function assignAdminRole($user)
    {
        try {
            // Crear rol admin si no existe
            $adminRole = \Spatie\Permission\Models\Role::firstOrCreate([
                'name' => 'admin',
                'guard_name' => 'web'
            ]);

            // Asignar rol al usuario
            $user->assignRole($adminRole);

            $this->info('👑 Rol de administrador asignado correctamente');

        } catch (\Exception $e) {
            $this->warn('⚠️  No se pudo asignar rol de administrador: ' . $e->getMessage());
        }
    }
} 