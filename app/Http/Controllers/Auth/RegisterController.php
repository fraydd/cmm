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
            return redirect('/')->with('error', 'La invitación ha expirado o ya fue utilizada.');
        }

        return Inertia::render('Auth/Register', [
            'token' => $token,
            'email' => $invitation->email,
            'invitation' => $invitation
        ]);
    }

    /**
     * Procesar el registro
     */
    public function register(Request $request)
    {
        $request->validate([
            'token' => 'required|string',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'name.required' => 'El nombre es requerido.',
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

        // Crear el usuario
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'email_verified_at' => now(), // Marcar como verificado
        ]);

        // Marcar la invitación como aceptada
        $invitation->markAsAccepted($user->id);

        // Asignar rol de empleado a los usuarios registrados por invitación
        if (class_exists('Spatie\Permission\Models\Role')) {
            $empleadoRole = \Spatie\Permission\Models\Role::firstOrCreate([
                'name' => 'empleado',
                'guard_name' => 'web'
            ]);
            $user->assignRole($empleadoRole);
        }

        // Autenticar al usuario
        Auth::login($user);

        // Redirigir al dashboard
        return redirect()->route('admin.dashboard')->with('success', '¡Bienvenido! Tu cuenta ha sido creada exitosamente.');
    }
}
