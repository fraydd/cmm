<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CashController extends Controller
{
    // Mostrar movimientos de caja
    public function index(Request $request)
    {
        // Consulta SQL literal para obtener los movimientos de caja
        $sql = <<<SQL
SELECT cm.id, cm.movement_date, cm.movement_type, cm.amount, cm.concept, cm.observations, 
       cm.invoice_id, cm.payment_id, cr.responsible_user_id, cr.branch_id
FROM cash_movements cm
JOIN cash_register cr ON cm.cash_register_id = cr.id
ORDER BY cm.movement_date DESC
SQL;

        $movements = DB::select($sql);
        return response()->json(['movements' => $movements]);
    }
}
