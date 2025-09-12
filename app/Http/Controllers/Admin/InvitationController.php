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
            ->where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        // Mapear para agregar status_calculado
        $invitations->getCollection()->transform(function ($inv) {
            $now = now();
            $status = $inv->status;
            if ($status === 'pending' && $inv->expires_at && $now->gt($inv->expires_at)) {
                $status = 'expired';
            }
            $inv->status_calculado = $status;
            return $inv;
        });

        // Si es una petición AJAX/fetch específica para recargar datos, devolver JSON
        if (request()->ajax() && request()->header('X-Requested-With') === 'XMLHttpRequest' && request()->header('Content-Type') === 'application/json') {
            return response()->json([
                'invitations' => $invitations,
                'timestamp' => now()->toISOString()
            ]);
        }

        return Inertia::render('Admin/Invitations/Index', [
            'invitations' => $invitations
        ]);
    }

    /**
     * Enviar una nueva invitación
     */
    public function store(Request $request)
    {
        Log::info('InvitationController@store ejecutándose', [
            'user' => auth()->user(),
            'request' => $request->all()
        ]);

        $request->validate([
            'email' => 'required|email|unique:users,email'
        ], [
            'email.required' => 'El correo electrónico es requerido.',
            'email.email' => 'El correo electrónico debe tener un formato válido.',
            'email.unique' => 'Este correo electrónico ya existe como usuario.'
        ]);

        // Usar el método reutilizable para procesar la invitación
        $result = self::createOrUpdateInvitation($request->email, 'invitation_store');

        return response()->json([
            'success' => $result['success'],
            'message' => $result['message'],
            'invitation' => $result['invitation']
        ], $result['success'] ? 200 : 422);
    }

    /**
     * Reenviar una invitación
     */
    public function resend(Invitation $invitation)
    {
        // Reenvío masivo
        if (request()->has('ids') && is_array(request()->input('ids'))) {
            $ids = request()->input('ids');
            // Validar que todos los IDs sean números
            foreach ($ids as $id) {
                if (!is_numeric($id)) {
                    return response()->json(['success' => false, 'message' => 'ID inválido: ' . $id], 400);
                }
            }
            // Obtener invitaciones reenviables
            $reenviables = Invitation::whereIn('id', $ids)
                ->where('is_active', true)
                ->whereIn('status', ['pending', 'expired', 'cancelled'])
                ->get();
            if ($reenviables->isEmpty()) {
                return response()->json(['success' => false, 'message' => 'No hay invitaciones reenviables seleccionadas'], 400);
            }
            foreach ($reenviables as $inv) {
                $inv->status = 'pending';
                $inv->token = Invitation::generateToken();
                $inv->expires_at = Carbon::now()->addDays(7);
                $inv->invited_by = auth()->id();
                $inv->save();
                $this->sendInvitationEmail($inv);
            }
            return response()->json([
                'success' => true,
                'message' => count($reenviables) . ' invitación(es) reenviada(s) exitosamente'
            ]);
        }
        // Reenvío individual (como antes)
        if (!in_array($invitation->status, ['pending', 'expired', 'cancelled'])) {
            if (request()->expectsJson() || request()->ajax()) {
                return response()->json(['success' => false, 'message' => 'Solo se pueden reenviar invitaciones pendientes, expiradas o canceladas.'], 400);
            }
            return back()->with('error', 'Solo se pueden reenviar invitaciones pendientes, expiradas o canceladas.');
        }
        // Renovar invitación individual
        $invitation->status = 'pending';
        $invitation->token = Invitation::generateToken();
        $invitation->expires_at = Carbon::now()->addDays(7);
        $invitation->invited_by = auth()->id();
        $invitation->save();
        $this->sendInvitationEmail($invitation);
        if (request()->expectsJson() || request()->ajax()) {
            return response()->json(['success' => true, 'message' => 'Invitación reenviada exitosamente.']);
        }
        return redirect()->route('admin.invitaciones.index')->with('success', 'Invitación reenviada exitosamente.');
    }

    /**
     * Cancelar una invitación
     */
    public function cancel(Invitation $invitation)
    {
        // Si se envía un array de IDs en el body, hacer cancelación masiva
        if (request()->has('ids') && is_array(request()->input('ids'))) {
            $ids = request()->input('ids');
            
            // Validar que todos los IDs sean números
            foreach ($ids as $id) {
                if (!is_numeric($id)) {
                    return response()->json(['success' => false, 'message' => 'ID inválido: ' . $id], 400);
                }
            }
            
            // Obtener invitaciones pendientes
            $pendingInvitations = Invitation::whereIn('id', $ids)
                ->where('status', 'pending')
                ->get();
            
            if ($pendingInvitations->isEmpty()) {
                return response()->json(['success' => false, 'message' => 'No hay invitaciones pendientes para cancelar'], 400);
            }
            
            // Cancelar cada invitación
            Invitation::whereIn('id', $pendingInvitations->pluck('id'))->update(['status' => 'expired']);
            
            return response()->json([
                'success' => true, 
                'message' => count($pendingInvitations) . ' invitación(es) cancelada(s) exitosamente'
            ]);
        }
        
        // Cancelación individual (comportamiento original)
        if ($invitation->status !== 'pending') {
            if (request()->expectsJson() || request()->ajax()) {
                return response()->json(['success' => false, 'message' => 'Solo se pueden cancelar invitaciones pendientes.'], 400);
            }
            return back()->with('error', 'Solo se pueden cancelar invitaciones pendientes.');
        }

        $invitation->update(['status' => 'expired']);

        if (request()->expectsJson() || request()->ajax()) {
            return response()->json(['success' => true, 'message' => 'Invitación cancelada exitosamente.']);
        }
        return redirect()->route('admin.invitaciones.index')->with('success', 'Invitación cancelada exitosamente.');
    }

    /**
     * Eliminar invitaciones (soft delete, masivo o individual)
     */
    public function destroy(Request $request)
    {
        $ids = $request->input('ids', []);
        if (!is_array($ids) || empty($ids)) {
            return response()->json(['success' => false, 'message' => 'No se proporcionaron invitaciones a eliminar'], 400);
        }
        // Validar que todos los IDs sean números
        foreach ($ids as $id) {
            if (!is_numeric($id)) {
                return response()->json(['success' => false, 'message' => 'ID inválido: ' . $id], 400);
            }
        }
        // Solo eliminar las que no sean 'accepted'
        $toDelete = \App\Models\Invitation::whereIn('id', $ids)
            ->where('is_active', true)
            ->where('status', '!=', 'accepted')
            ->get();
        if ($toDelete->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No hay invitaciones eliminables seleccionadas (todas aceptadas o inactivas)'
            ], 400);
        }
        $deleted = \App\Models\Invitation::whereIn('id', $toDelete->pluck('id'))
            ->update(['is_active' => false, 'status' => 'expired']);
        return response()->json([
            'success' => true,
            'message' => "$deleted invitación(es) eliminada(s) exitosamente. Invitaciones aceptadas no fueron eliminadas."
        ]);
    }

    /**
     * Lógica reutilizable para crear o manejar invitaciones
     * Este método puede ser llamado desde cualquier controlador
     */
    public static function createOrUpdateInvitation($email, $context = 'general')
    {
        try {
            // Verificar si ya existe una invitación activa para este correo
            $activeInvitation = Invitation::where('email', $email)->where('is_active', true)->first();
            
            if ($activeInvitation) {
                if ($activeInvitation->status === 'pending') {
                    Log::info("Ya existe una invitación pendiente para {$email}, se omite el envío", ['context' => $context]);
                    return [
                        'success' => true,
                        'message' => 'Ya existe una invitación pendiente para este correo.',
                        'action' => 'skipped',
                        'invitation' => $activeInvitation
                    ];
                } elseif ($activeInvitation->status === 'accepted') {
                    Log::info("El correo {$email} ya fue aceptado en una invitación previa, se omite el envío", ['context' => $context]);
                    return [
                        'success' => true,
                        'message' => 'Este correo ya fue aceptado en una invitación previa.',
                        'action' => 'skipped',
                        'invitation' => $activeInvitation
                    ];
                } else {
                    // Renovar invitación expirada/cancelada
                    $activeInvitation->status = 'pending';
                    $activeInvitation->token = Invitation::generateToken();
                    $activeInvitation->expires_at = Carbon::now()->addDays(7);
                    $activeInvitation->invited_by = auth()->id();
                    $activeInvitation->save();
                    
                    self::sendInvitationEmailStatic($activeInvitation);
                    Log::info("Invitación renovada para {$email}", ['context' => $context]);
                    
                    return [
                        'success' => true,
                        'message' => 'Invitación renovada exitosamente a ' . $email,
                        'action' => 'renewed',
                        'invitation' => $activeInvitation
                    ];
                }
            } else {
                // Crear nueva invitación
                $invitation = Invitation::create([
                    'email' => $email,
                    'token' => Invitation::generateToken(),
                    'status' => 'pending',
                    'expires_at' => Carbon::now()->addDays(7),
                    'invited_by' => auth()->id()
                ]);
                
                self::sendInvitationEmailStatic($invitation);
                Log::info("Nueva invitación enviada para {$email}", ['context' => $context]);
                
                return [
                    'success' => true,
                    'message' => 'Invitación enviada exitosamente a ' . $email,
                    'action' => 'created',
                    'invitation' => $invitation
                ];
            }
        } catch (\Exception $e) {
            Log::error("Error al procesar invitación para {$email}: " . $e->getMessage(), [
                'context' => $context,
                'trace' => $e->getTraceAsString()
            ]);
            
            return [
                'success' => false,
                'message' => 'Error al procesar la invitación: ' . $e->getMessage(),
                'action' => 'error',
                'invitation' => null
            ];
        }
    }

    /**
     * Versión estática del método para enviar emails
     */
    private static function sendInvitationEmailStatic(Invitation $invitation)
    {
        $invitationUrl = url('/register?token=' . $invitation->token);
    Mail::to($invitation->email)->send(new \App\Mail\InvitationMail($invitation, $invitationUrl));
        Log::info("Invitación enviada a {$invitation->email}: {$invitationUrl}");
    }

    /**
     * Enviar email de invitación (método de instancia para compatibilidad)
     */
    private function sendInvitationEmail(Invitation $invitation)
    {
        self::sendInvitationEmailStatic($invitation);
    }
}
