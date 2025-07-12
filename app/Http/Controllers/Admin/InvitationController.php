<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invitation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;

class InvitationController extends Controller
{
    /**
     * Mostrar el formulario de invitaciones
     */
    public function index()
    {
        $invitations = Invitation::with(['inviter', 'accepter'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('Admin/Invitations/Index', [
            'invitations' => $invitations
        ]);
    }

    /**
     * Enviar una nueva invitación
     */
    public function store(Request $request)
    {
        // Debug temporal
        Log::info('InvitationController@store ejecutándose', [
            'user' => auth()->user(),
            'request' => $request->all()
        ]);

        $request->validate([
            'email' => 'required|email|unique:users,email|unique:invitations,email'
        ], [
            'email.required' => 'El correo electrónico es requerido.',
            'email.email' => 'El correo electrónico debe tener un formato válido.',
            'email.unique' => 'Este correo electrónico ya ha sido invitado o ya existe un usuario con este email.'
        ]);

        // Crear la invitación
        $invitation = Invitation::create([
            'email' => $request->email,
            'token' => Invitation::generateToken(),
            'status' => 'pending',
            'expires_at' => Carbon::now()->addDays(7), // Expira en 7 días
            'invited_by' => auth()->id()
        ]);

        // Enviar email de invitación
        $this->sendInvitationEmail($invitation);

        return redirect()->route('admin.invitaciones.index')->with('success', 'Invitación enviada exitosamente a ' . $request->email);
    }

    /**
     * Reenviar una invitación
     */
    public function resend(Invitation $invitation)
    {
        if ($invitation->status !== 'pending') {
            return back()->with('error', 'Solo se pueden reenviar invitaciones pendientes.');
        }

        // Actualizar expiración
        $invitation->update([
            'expires_at' => Carbon::now()->addDays(7)
        ]);

        // Reenviar email
        $this->sendInvitationEmail($invitation);

        return redirect()->route('admin.invitaciones.index')->with('success', 'Invitación reenviada exitosamente.');
    }

    /**
     * Cancelar una invitación
     */
    public function cancel(Invitation $invitation)
    {
        if ($invitation->status !== 'pending') {
            return back()->with('error', 'Solo se pueden cancelar invitaciones pendientes.');
        }

        $invitation->update(['status' => 'expired']);

        return redirect()->route('admin.invitaciones.index')->with('success', 'Invitación cancelada exitosamente.');
    }

    /**
     * Enviar email de invitación
     */
    private function sendInvitationEmail(Invitation $invitation)
    {
        $invitationUrl = url('/register?token=' . $invitation->token);
        
        // Por ahora solo logueamos el email (implementar Mail::send después)
        Log::info("Invitación enviada a {$invitation->email}: {$invitationUrl}");
        
        // TODO: Implementar envío real de email
        // Mail::to($invitation->email)->send(new InvitationMail($invitation));
    }
}
