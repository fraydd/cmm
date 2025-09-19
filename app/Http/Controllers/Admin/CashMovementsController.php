<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use App\Http\Controllers\Admin\CashRegisterController;

use function PHPSTORM_META\sql_injection_subst;

class CashMovementsController extends Controller
{
    // Mostrar movimientos de caja
        public function index(Request $request)
    {
        try {
            return Inertia::render('Admin/cashMovements/Index');
        } catch (\Exception $e) {
            Log::error('Error al cargar la vista de histórico de cajas: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Error al cargar la vista de histórico de cajas');
        }
    }

    public function getCashMovements(Request $request)
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
                SELECT 
                cm.id,
                cm.cash_register_id as IDCaja,
                cm.invoice_id as IDFactura,
                CONCAT('$ ',FORMAT(cm.amount, 0, 'de_DE')) as monto,
                CONCAT(p.first_name,' ',p.last_name) as nombre,
                COALESCE(CONCAT(p2.first_name,' ',p2.last_name), u.name) as responsable,
                b.name as sede,
                cm.movement_type,
                cm.movement_date as fecha,
                cm.observations,
                cm.payment_id
            FROM cash_movements cm
            INNER JOIN people p ON cm.person_id = p.id
            INNER JOIN users u ON cm.responsible_user_id = u.id
            LEFT JOIN employees e ON u.id = e.user_id
            LEFT JOIN people p2 ON e.person_id = p2.id
            INNER JOIN branches b ON cm.branch_id = b.id
            WHERE cm.branch_id IN ($placeholders)
            AND cm.movement_date BETWEEN ? AND ?
            ORDER BY cm.movement_date DESC
            SQL;

            $params = array_merge($branchIds, [$startDate, $endDate]);
            $movements = DB::select($sql, $params);
            return response()->json(['movements' => $movements]);
        } catch (\Exception $e) {
            Log::error('Error al obtener los movimientos de caja: ' . $e->getMessage());
            return response()->json(['message' => 'Error al obtener los movimientos de caja: ' . $e->getMessage()], 500);
        }
    }

    public function edit(Request $request) {
        try {
            $id = $request->input('id');
            $amount = $request->input('amount');
            $observations = $request->input('observations');
            $movement_date = $request->input('movement_date');
            $payment_id = $request->input('payment_id');
            $movement_type = $request->input('movement_type');

            if (!$id) {
                return response()->json(['message' => 'Campos son obligatorios'], 400);
            }


            // consulta para saber si el monto cambio 
            $oldAmount = DB::select(<<<SQL
                            SELECT amount
                            FROM cash_movements
                            WHERE id = ?
                        SQL, [$id]);
            $oldAmount = $oldAmount[0]->amount ?? 0;

            // si el monto cambio se actualiza tambien en payments
            if ($amount != $oldAmount && $payment_id) {
                 $sqlPayment = <<<SQL
                    UPDATE payments
                    SET amount = ?
                    WHERE id = ?
                SQL;
                DB::update($sqlPayment, [
                    $amount,
                    $payment_id
                ]);
            }

            $sql = <<<SQL
                UPDATE cash_movements
                SET
                    amount = ?,
                    observations = ?,
                    movement_date = ?,
                    updated_at = NOW()
                WHERE id = ?
            SQL;

            DB::update($sql, [
                $amount,
                $observations,
                $movement_date,
                $id
            ]);

            return response()->json(['message' => 'Caja actualizada correctamente'], 200);

        } catch (\Throwable $th) {
            Log::error('Error al editar la caja: ' . $th->getMessage());
            return response()->json(['message' => 'Error al editar la caja: ' . $th->getMessage()], 500);
        }
    }


    public function createEgreso(Request $request) {
        try {
            $amount = $request->input('amount');
            $observations = $request->input('observations');
            $branch_id = $request->input('branch_id');
            $identificacion_beneficiario = $request->input('beneficiary_identification');
            $movement_date = now();
            $movement_type = 'egreso';

            if (!$amount || !$movement_type || !$branch_id) {
                return response()->json(['message' => 'Campos son obligatorios'], 400);
            }

            // se obtiene la caja abierta para la sede que se esta consultando
            $activo = CashRegisterController::getActive($branch_id);

            // Verificar si la respuesta es un error
            if ($activo->getStatusCode() !== 200) {
                return $activo; // Retornar el error directamente
            }

            // se registra el egreso


            // Deserializar el contenido de la respuesta
            $data = json_decode($activo->getContent());

            // Acceder al ID de la caja activa
            $cash_register_id = $data->caja->id ?? null;

            if (!$cash_register_id) {
                return response()->json(['message' => 'No se pudo obtener el ID de la caja activa'], 400);
            }

            // se consulta si la persona esta registrada en la base de datos 

            $sqlBeneficiary = <<<SQL
                SELECT p.id from people p 
                WHERE p.identification_number = ?
            SQL;

            $beneficiary_id = DB::select($sqlBeneficiary, [$identificacion_beneficiario]);
            $beneficiary_id = $beneficiary_id[0]->id ?? null;

            if (!$beneficiary_id) {
                return response()->json(['message' => 'Beneficiario no registrado'], 400);
            }

            $sql = <<<SQL
                INSERT INTO cash_movements (cash_register_id,amount, observations, movement_date, movement_type,concept,person_id, branch_id,responsible_user_id, created_at, updated_at)
                VALUES (?,?, ?, ?, ?,'Egreso', ?, ?, ?, NOW(), NOW())
            SQL;

            DB::insert($sql, [
                $cash_register_id,
                $amount,
                $observations,
                $movement_date,
                $movement_type,
                $beneficiary_id,
                $branch_id,
                auth()->id()
            ]);

            return response()->json(['message' => 'Egreso creado correctamente'], 201);
        } catch (\Throwable $th) {
            Log::error('Error al crear el egreso: ' . $th->getMessage());
            return response()->json(['message' => 'Error al crear el egreso: ' . $th->getMessage()], 500);
        }
    }
}
