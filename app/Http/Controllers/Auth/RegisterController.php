<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class RegisterController extends Controller
{
    /**
     * Mostrar el formulario de registro con token
     */
    public function showRegistrationForm(Request $request)
    {
        $token = $request->query('token');
        
        if (!$token) {
            return redirect('/')->with('error', 'Token de invitación requerido.');
        }

        // Buscar la invitación
        $invitation = Invitation::where('token', $token)->first();

        if (!$invitation) {
            return redirect('/')->with('error', 'Token de invitación inválido.');
        }

        if (!$invitation->isValid()) {
            return redirect('/')->with('error', 'La invitación ha expirada o ya fue utilizada.');
        }

        // Buscar los datos del empleado asociado al email de la invitación
        $employee = \DB::table('employees as e')
            ->join('people as p', 'e.person_id', '=', 'p.id')
            ->where('p.email', $invitation->email)
            ->where('e.is_active', true)
            ->select([
                'p.first_name',
                'p.last_name',
                'p.identification_number',
                'p.email',
                'e.role',
                'e.role_id'
            ])
            ->first();

        // Si no se encuentra empleado, usar datos básicos de la invitación
        $employeeName = $employee ? $employee->first_name . ' ' . $employee->last_name : null;

        return Inertia::render('Auth/Register', [
            'token' => $token,
            'email' => $invitation->email,
            'invitation' => $invitation,
            'employee' => $employee,
            'employee_name' => $employeeName
        ]);
    }

    /**
     * Procesar el registro
     */
    public function register(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'email' => 'required|email|max:255',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'email.required' => 'El correo electrónico es requerido.',
            'email.email' => 'El correo electrónico debe tener un formato válido.',
            'password.required' => 'La contraseña es requerida.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
        ]);

        // Verificar el token
        $invitation = Invitation::where('token', $request->token)->first();

        if (!$invitation) {
            return back()->withErrors(['token' => 'Token de invitación inválido.']);
        }

        if (!$invitation->isValid()) {
            return back()->withErrors(['token' => 'La invitación ha expirado o ya fue utilizada.']);
        }

        if ($invitation->email !== $request->email) {
            return back()->withErrors(['email' => 'El correo electrónico no coincide con la invitación.']);
        }

        // Verificar que el email no esté ya registrado
        if (User::where('email', $request->email)->exists()) {
            return back()->withErrors(['email' => 'Este correo electrónico ya está registrado.']);
        }

        // Obtener el nombre del empleado desde la base de datos
        $employee = \DB::table('employees as e')
            ->join('people as p', 'e.person_id', '=', 'p.id')
            ->where('p.email', $request->email)
            ->where('e.is_active', true)
            ->select([
                'p.first_name',
                'p.last_name',
                'p.identification_number',
                'e.id as employee_id',
                'e.role_id'
            ])
            ->first();

        if (!$employee) {
            return back()->withErrors(['email' => 'No se encontró información del empleado asociado a este correo.']);
        }

        $employeeName = $employee->first_name . ' ' . $employee->last_name;

        // Crear el usuario con el nombre del empleado
        $user = User::create([
            'name' => $employeeName,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'email_verified_at' => now(), // Marcar como verificado
        ]);

        // Actualizar el empleado para asociarlo con el usuario creado
        \DB::table('employees')->where('id', $employee->employee_id)->update([
            'user_id' => $user->id,
            'updated_at' => now()
        ]);

        // Marcar la invitación como aceptada
        $invitation->markAsAccepted($user->id);

        // Asignar el rol específico del empleado desde la columna role_id
        if (class_exists('Spatie\Permission\Models\Role') && $employee->role_id) {
            try {
                $employeeRole = \Spatie\Permission\Models\Role::find($employee->role_id);
                if ($employeeRole) {
                    $user->assignRole($employeeRole);
                    \Log::info("Rol '{$employeeRole->name}' asignado al usuario {$user->email}", [
                        'user_id' => $user->id,
                        'role_id' => $employee->role_id,
                        'employee_id' => $employee->employee_id
                    ]);
                } else {
                    \Log::warning("No se encontró el rol con ID {$employee->role_id} para el empleado {$employee->employee_id}");
                    // Asignar rol por defecto si no se encuentra el rol específico
                    $defaultRole = \Spatie\Permission\Models\Role::firstOrCreate([
                        'name' => 'empleado',
                        'guard_name' => 'web'
                    ]);
                    $user->assignRole($defaultRole);
                }
            } catch (\Exception $e) {
                \Log::error("Error al asignar rol al usuario {$user->email}: " . $e->getMessage());
                // Asignar rol por defecto en caso de error
                $defaultRole = \Spatie\Permission\Models\Role::firstOrCreate([
                    'name' => 'empleado',
                    'guard_name' => 'web'
                ]);
                $user->assignRole($defaultRole);
            }
        }

        // Autenticar al usuario
        Auth::login($user);

        // Redirigir al dashboard
        return redirect()->route('admin.dashboard')->with('success', '¡Bienvenido ' . $employeeName . '! Tu cuenta ha sido creada exitosamente.');
    }
}
