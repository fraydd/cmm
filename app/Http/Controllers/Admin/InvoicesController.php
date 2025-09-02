<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use App\Http\Controllers\Admin\CashRegisterController;
use Barryvdh\DomPDF\Facade\Pdf;


class InvoicesController extends Controller
{
    // Mostrar movimientos de caja
    public function index(Request $request)
    {
        try {
            return Inertia::render('Admin/invoices/Index');
        } catch (\Exception $e) {
            Log::error('Error al cargar la vista de histórico de facturas: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Error al cargar la vista de histórico de facturas');
        }
    }

    public function getInvoices(Request $request)
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
                i.id,
                i.branch_id as idSede,
                b.name as sede,
                CONCAT(p.first_name , ' ' , p.last_name) as nombre,
                i.total_amount,
                i.paid_amount,
                is2.name as invoice_status,
                it.name as invoice_type,
                i.observations,
                COALESCE(CONCAT(p2.first_name,' ',p2.last_name), u.name) as responsable,
                i.invoice_date
                FROM invoices i 
                INNER JOIN people p on i.person_id = p.id
                INNER JOIN invoice_statuses is2 on i.status_id = is2.id
                INNER JOIN invoice_types it on i.invoice_type_id = it.id
                INNER JOIN users u on i.created_by = u.id
                INNER JOIN branches b ON i.branch_id = b.id
                LEFT JOIN employees e ON u.id = e.user_id
                LEFT JOIN people p2 ON e.person_id = p2.id
                WHERE i.branch_id IN ($placeholders)
                and i.invoice_date BETWEEN ? AND ?
                ORDER BY i.invoice_date DESC
            SQL;

            $params = array_merge($branchIds, [$startDate, $endDate]);
            $invoices = DB::select($sql, $params);
            return response()->json(['invoices' => $invoices]);
        } catch (\Exception $e) {
            Log::error('Error al obtener los movimientos de caja: ' . $e->getMessage());
            return response()->json(['message' => 'Error al obtener los movimientos de caja: ' . $e->getMessage()], 500);
        }
    }

    public function Edit(Request $request, $id) {
        try {
            // Obtener los datos de la factura
            $data = $this->getInvoiceData($id);

            // Validar que se encontraron los datos
            if (!$data) {
                return response()->json(['message' => 'Factura no encontrada'], 404);
            }
            
            // Si es una petición AJAX (como la que hace tu componente React)
            // if ($request->ajax() || $request->wantsJson()) {
            if ($request->ajax() && !$request->header('X-Inertia')) {
                return response()->json($data);
            }
            
            // Si es una petición normal, renderizar la vista con Inertia
            return Inertia::render('Admin/invoices/Edit', [
                'invoice' => $data, // Corregido: era 'data' sin $
                'idFactura' => $id  // Agregado: pasar el ID también
            ]);

        } catch (\Throwable $th) {
            Log::error('Error al editar factura: ' . $th->getMessage());
            
            // Si es AJAX, devolver JSON
            if ($request->ajax() || $request->wantsJson()) {
                return response()->json(['message' => 'Error al editar la factura: ' . $th->getMessage()], 500);
            }
            
            // Si es petición normal, redirigir con error
            return redirect()->back()->withErrors(['message' => 'Error al editar la factura: ' . $th->getMessage()]);
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

        // Descargar factura en PDF
    public function downloadPdf($id)
    {
        try {

            // se obtiene le tipo de factura 

            $invoiceType = DB::table('invoices')->where('id', $id)->first();

            if (!$invoiceType->invoice_type_id) {
                return response()->json(['error' => 'Tipo de factura no encontrado'], 404);
            }
                $invoiceData = $this->getInvoiceData($id);
        
                // Agregar logo como base64
                $logoPath = storage_path('img/logo.png');
                $logoBase64 = '';
                if (file_exists($logoPath)) {
                    $logoData = base64_encode(file_get_contents($logoPath));
                    $logoBase64 = 'data:image/png;base64,' . $logoData;
                } else {
                    Log::warning("Logo no encontrado en: " . $logoPath);
                }
                $invoiceData['logoBase64'] = $logoBase64;


            if ($invoiceType->invoice_type_id == 1) {
                $pdf = Pdf::loadView('invoices.ingreso', $invoiceData);
                return $pdf->stream('factura-' . $id . '.pdf');
            } else {
                $pdf = Pdf::loadView('invoices.egreso', $invoiceData);
                return $pdf->stream('comprobante-egreso-' . $id . '.pdf');
            }

            
        } catch (\Throwable $th) {
            Log::error("Error al generar el PDF: " . $th->getMessage());
            return response()->json(['error' => 'Error al generar el PDF'], 500);
        }
        
    }

    public function createPayment(Request $request){
        try {

            $data = $request->validate([
                'branch_id' => 'required|integer',
                'amount' => 'required|numeric',
                'observations' => 'nullable|string',
                'payment_method_id' => 'nullable|integer',
                'invoice_id' => 'required|integer',
            ]);
            Log::info('Datos recibidos para crear pago: ' . json_encode($data));

            // se obtiene la caja abierta :
            // se obtiene la caja abierta para la sede que se esta consultando
            $activo = CashRegisterController::getActive($data['branch_id']);

            // Verificar si la respuesta es un error
            if ($activo->getStatusCode() !== 200) {
                return $activo; // Retornar el error directamente
            }

            // se registra el egreso


            // Deserializar el contenido de la respuesta
            $datacaja = json_decode($activo->getContent());

            // Acceder al ID de la caja activa
            $cash_register_id = $datacaja->caja->id ?? null;

            if (!$cash_register_id) {
                return response()->json(['message' => 'No se pudo obtener el ID de la caja activa'], 400);
            }

            // Crear el pago
            DB::table('payments')->insert([
                'branch_id' => $data['branch_id'],
                'amount' => $data['amount'],
                'observations' => $data['observations'],
                'payment_method_id' => $data['payment_method_id'],
                'cash_register_id' => $cash_register_id,
                'invoice_id' => $data['invoice_id'],
                'payment_date' => now(),
                'created_at' => now(),
                'updated_at' => now(),
                'created_by' => auth()->id(),
            ]);

            return response()->json(['message' => 'Pago creado correctamente'], 201);
        } catch (\Throwable $th) {
            Log::error("Error al crear el pago: " . $th->getMessage());
            return response()->json(['error' => 'Error al crear el pago'], 500);
        }
    }
    public function updatePayment(Request $request, $id){
        try {

            $data = $request->validate([
                'branch_id' => 'required|integer',
                'amount' => 'required|numeric',
                'observations' => 'nullable|string',
                'payment_method_id' => 'nullable|integer',
                'invoice_id' => 'required|integer',
                'payment_date' => 'required|date'
            ]);
            Log::info('Datos recibidos para crear pago: ' . json_encode($data));

         // se valida que la caja aun se encuentre abierta para dejarlo editar

            // Crear el pago
            DB::table('payments')->where('id', $id)->update([
                'amount' => $data['amount'],
                'observations' => $data['observations'],
                'payment_method_id' => $data['payment_method_id'],
                'payment_date' => $data['payment_date'],
                'updated_at' => now(),
            ]);

            return response()->json(['message' => 'Pago actualizado correctamente'], 200);
        } catch (\Throwable $th) {
            Log::error("Error al actualizar el pago: " . $th->getMessage());
            return response()->json(['error' => 'Error al crear el pago'], 500);
        }
    }

    public function deletePayment($id)
    {
        try {
            DB::table('payments')->where('id', $id)->delete();
            return response()->json(['message' => 'Pago eliminado correctamente'], 200);
        } catch (\Throwable $th) {
            Log::error("Error al eliminar el pago: " . $th->getMessage());
            return response()->json(['error' => 'Error al eliminar el pago'], 500);
        }
    }

    function updateInvoice (Request $request, $id ){
        try {
            $data = $request->validate([
                'invoice_date' => 'required|date',
                'observations' => 'nullable|string',
            ]);
            Log::info('Datos recibidos para actualizar factura: ' . json_encode($data));

            // Actualizar la factura
            DB::table('invoices')->where('id', $id)->update([
                'observations' => $data['observations'],
                'invoice_date' => $data['invoice_date'],
                'updated_at' => now(),
            ]);

            return response()->json(['message' => 'Factura actualizada correctamente'], 200);
        } catch (\Throwable $th) {
            Log::error("Error al actualizar la factura: " . $th->getMessage());
            return response()->json(['error' => 'Error al actualizar la factura'], 500);
        }
    }

    // Método reutilizable para obtener todos los datos de una factura
    public function getInvoiceData($id)
    {   
        // Consulta principal de la factura
        $invoice = DB::select("
            SELECT 
                invoices.*,
                CONCAT(people.first_name, ' ', people.last_name) as person_name,
                people.first_name,
                people.last_name,
                people.identification_number,
                people.email as person_email,
                people.phone as person_phone,
                people.address as person_address,
                branches.name as branch_name,
                branches.address as branch_address,
                branches.phone as branch_phone,
                branches.email as branch_email,
                invoice_statuses.name as status,
                invoice_types.name as invoice_type,
                users.name as created_by_name,
                users.email as created_by_email
            FROM invoices
            LEFT JOIN people ON invoices.person_id = people.id
            LEFT JOIN branches ON invoices.branch_id = branches.id
            LEFT JOIN invoice_statuses ON invoices.status_id = invoice_statuses.id
            LEFT JOIN invoice_types ON invoices.invoice_type_id = invoice_types.id
            LEFT JOIN users ON invoices.created_by = users.id
            WHERE invoices.id = ?
            LIMIT 1
        ", [$id]);

        if (empty($invoice)) {
            return null;
        }

        // Items de la factura
        $items = DB::select("
            SELECT 
                invoice_items.*,
                item_types.name as item_type,
                products.name as product_name,
                subscriptions.id as subscription_id,
                events.name as event_name
            FROM invoice_items
            LEFT JOIN item_types ON invoice_items.item_type_id = item_types.id
            LEFT JOIN products ON invoice_items.product_id = products.id
            LEFT JOIN subscriptions ON invoice_items.subscription_id = subscriptions.id
            LEFT JOIN events ON invoice_items.event_id = events.id
            WHERE invoice_items.invoice_id = ?
        ", [$id]);

        // Pagos de la factura
        $payments = DB::select("
            SELECT 
                payments.*,
                payment_methods.name as payment_method,
                payment_users.name as payment_created_by_name
            FROM payments
            LEFT JOIN payment_methods ON payments.payment_method_id = payment_methods.id
            LEFT JOIN users as payment_users ON payments.created_by = payment_users.id
            WHERE payments.invoice_id = ?
        ", [$id]);

        return [
            'invoice' => $invoice[0] ?? null,
            'items' => $items,
            'payments' => $payments
        ];
    }
}
