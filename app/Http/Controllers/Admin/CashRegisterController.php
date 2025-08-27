<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use PhpParser\Node\Stmt\TryCatch;

class CashRegisterController extends Controller
{
    // Muestra el histórico de aperturas/cierres de caja
    public function index(Request $request)
    {
        try {
            return Inertia::render('Admin/cashRegister/Index');
        } catch (\Exception $e) {
            Log::error('Error al cargar la vista de histórico de cajas: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Error al cargar la vista de histórico de cajas');
        }
    }

    public function getCashRegisters(Request $request)
    {
        try {
         
            $branchIds = $request->input('branch_ids');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            if (!is_array($branchIds) || empty($branchIds)) {
                return response()->json(['message' => 'branch_ids is required and must be a non-empty array'], 400);
            }
            if (!$startDate || !$endDate) {
                return response()->json(['message' => 'start_date and end_date are required'], 400);
            }

            $userId = Auth::id();
            if ($userId != 1) {
                // Validar acceso
                $placeholders = implode(',', array_fill(0, count($branchIds), '?'));
                $sqlAccess = <<<SQL
                    SELECT eba.branch_id
                    FROM users u
                    INNER JOIN employees e ON u.id = e.user_id
                    INNER JOIN employee_branch_access eba ON e.id = eba.employee_id
                    WHERE u.id = ? AND eba.branch_id IN ($placeholders)
                SQL;

                $params = array_merge([$userId], $branchIds);
                $result = DB::select($sqlAccess, $params);
                $accessibleIds = array_map(fn($row) => $row->branch_id, $result);
                $diff = array_diff($branchIds, $accessibleIds);
                if (count($diff) > 0) {
                    return response()->json(['message' => 'No tienes acceso a una o más sedes solicitadas'], 403);
                }
            }

            // Construir placeholders para la consulta IN
            $placeholders = implode(',', array_fill(0, count($branchIds), '?'));
            $sql = <<<SQL
                SELECT cr.id,
                    b.name as branch_name,
                    cr.opening_date,
                    cr.closing_date,
                    cr.initial_amount,
                    cr.final_amount,
                    cr.total_income,
                    cr.total_expenses,
                    cr.status,
                    u.name as responsible_name,
                    cr.observations from cash_register cr
                INNER JOIN branches b ON cr.branch_id = b.id
                INNER JOIN users u ON cr.responsible_user_id = u.id
                where cr.branch_id in ($placeholders)
                and cr.created_at BETWEEN ? AND ?
                ORDER BY cr.opening_date DESC
            SQL;

            $params = array_merge($branchIds, [$startDate, $endDate]);
            $cajas = DB::select($sql, $params);
            return response()->json(['cajas' => $cajas]);
        } catch (\Exception $e) {
            Log::error('Error al obtener las cajas: ' . $e->getMessage());
            return response()->json(['message' => 'Error al obtener las cajas: ' . $e->getMessage()], 500);
        }
    }

    public function open(Request $request){
        try{
            $branchId = $request->input('branch_id');
            $initial_amount = $request->input('initial_amount');
            $observations = $request->input('observations');

            if ($branchId === null || $initial_amount === null) {
                return response()->json(['message' => 'branch_id and initial_amount are required'], 400);
            }


            $userId = Auth::id();
            $now = now();

            // Validar que no haya otra caja abierta en la misma sede
            $sqlCheck = <<<SQL
                SELECT COUNT(cr.status) as abiertos
                FROM cash_register cr
                WHERE cr.branch_id = ?
                  AND cr.status = 'open'
                GROUP BY cr.status
            SQL;

            $abiertos = DB::select($sqlCheck, [$branchId]);
            if (!empty($abiertos) && isset($abiertos[0]->abiertos) && $abiertos[0]->abiertos > 0) {
                return response()->json(['message' => 'Ya existe una caja abierta en esta sede. Debe cerrarla antes de abrir una nueva.'], 409);
            }

            $sql = <<<SQL
                INSERT INTO cash_register (
                    branch_id,
                    opening_date,
                    initial_amount,
                    status,
                    responsible_user_id,
                    observations,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            SQL;

            $params = [
                $branchId,
                $now,
                $initial_amount,
                'open',
                $userId,
                $observations,
                $now,
                $now
            ];

            DB::insert($sql, $params);

            return response()->json(['message' => 'Caja abierta correctamente'], 201);

        }catch(\Exception $e){
            Log::error('Error al registrar la caja: ' . $e->getMessage());
            return response()->json(['message' => 'Error al registrar la caja: ' . $e->getMessage()], 500);
        }
    }

    public function  edit(Request $request) {
        try {
            $id = $request->input('id');
            $final_amount = $request->input('final_amount');
            $status = $request->input('status');
            $observations = $request->input('observations');
            $closing_date = $request->input('closing_date');

            if (!$id) {
                return response()->json(['message' => 'Campos son obligatorios'], 400);
            }

            $sql = <<<SQL
                UPDATE cash_register
                SET
                    final_amount = ?,
                    status = ?,
                    observations = ?,
                    closing_date = ?,
                    updated_at = NOW()
                WHERE id = ?
            SQL;

            DB::update($sql, [
                $final_amount,
                $status,
                $observations,
                $closing_date,
                $id
            ]);

            return response()->json(['message' => 'Caja actualizada correctamente'], 200);

        } catch (\Throwable $th) {
            Log::error('Error al editar la caja: ' . $th->getMessage());
            return response()->json(['message' => 'Error al editar la caja: ' . $th->getMessage()], 500);
        }
    }

    public function getActive($branch_id){
        try {
            if (!$branch_id) {
                return response()->json(['message' => 'branch_id is required'], 400);
            }

            $sql = <<<SQL
                SELECT cr.id, cr.status
                FROM cash_register cr
                WHERE cr.branch_id = ?
                  AND cr.status = 'open'
                ORDER BY cr.opening_date ASC
                LIMIT 1
            SQL;

            $result = DB::select($sql, [$branch_id]);
            if (empty($result)) {
                return response()->json(['message' => 'No hay caja abierta en esta sede'], 404);
            }

            return response()->json(['caja' => $result[0]], 200);

        } catch (\Throwable $th) {
            Log::error('Error al obtener la caja activa: ' . $th->getMessage());
            return response()->json(['message' => 'Error al obtener la caja activa: ' . $th->getMessage()], 500);
        }
    }
}
