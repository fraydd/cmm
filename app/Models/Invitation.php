<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Carbon\Carbon;

class Invitation extends Model
{
    use HasFactory;

    protected $fillable = [
        'email',
        'token',
        'status',
        'expires_at',
        'invited_by',
        'accepted_by',
        'accepted_at'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'accepted_at' => 'datetime'
    ];

    /**
     * Relación con el usuario que envió la invitación
     */
    public function inviter()
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    /**
     * Relación con el usuario que aceptó la invitación
     */
    public function accepter()
    {
        return $this->belongsTo(User::class, 'accepted_by');
    }

    /**
     * Generar un token único para la invitación
     */
    public static function generateToken()
    {
        do {
            $token = Str::random(64);
        } while (static::where('token', $token)->exists());

        return $token;
    }

    /**
     * Verificar si la invitación ha expirado
     */
    public function isExpired()
    {
        return $this->expires_at->isPast();
    }

    /**
     * Verificar si la invitación está pendiente y no ha expirado
     */
    public function isValid()
    {
        return $this->status === 'pending' && !$this->isExpired();
    }

    /**
     * Marcar la invitación como aceptada
     */
    public function markAsAccepted($userId)
    {
        $this->update([
            'status' => 'accepted',
            'accepted_by' => $userId,
            'accepted_at' => now()
        ]);
    }

    /**
     * Marcar la invitación como expirada
     */
    public function markAsExpired()
    {
        $this->update(['status' => 'expired']);
    }

    /**
     * Scope para invitaciones pendientes
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending')
                    ->where('expires_at', '>', now());
    }

    /**
     * Scope para invitaciones expiradas
     */
    public function scopeExpired($query)
    {
        return $query->where(function($q) {
            $q->where('status', 'pending')
              ->where('expires_at', '<=', now());
        })->orWhere('status', 'expired');
    }
}
