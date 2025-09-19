<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class Controller extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;

    /**
     * Devuelve la lista de sedes (branches) activas a las que tiene acceso el usuario logueado.
     * @param int|null $userId
     * @return array
     */
    public static function getBranches($userId = null)
    {
        if ($userId) {
            // Si es el usuario administrador (id 1), mostrar todas las sedes activas
            if ($userId == 1) {
                return DB::select('SELECT id, name FROM branches WHERE is_active = 1 ORDER BY name');
            }
            // Buscar el employee_id asociado al usuario
            $employee = DB::table('employees')->where('user_id', $userId)->first();
            if ($employee) {
                return DB::select('
                    SELECT b.id, b.name
                    FROM branches b
                    INNER JOIN employee_branch_access eba ON eba.branch_id = b.id
                    WHERE b.is_active = 1 AND eba.employee_id = ?
                    ORDER BY b.name
                ', [$employee->id]);
            }
            // Si no tiene empleado asociado, retornar vacío
            return [];
        }
        // Si no se pasa userId, retornar todas las activas (comportamiento anterior)
        return DB::select('SELECT id, name FROM branches WHERE is_active = 1 ORDER BY name');
    }
}
