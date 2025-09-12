<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Admin\CashRegisterController;
use Barryvdh\DomPDF\Facade\Pdf;
use \App\Mail\PaymentConfirmationMail;

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
        DB::beginTransaction();
        try {
            $amount = $request->input('amount');
            $details = $request->input('details', null); // detalles opcional
            $branch_id = $request->input('branch_id');
            $person_id = $request->input('person_id');
            $paymentMethodId = $request->input('payment_method_id');
            $payAll = $request->boolean('pay_all', true);
            $partialPayment = $request->input('partial_payment');
            $user_id = auth()->id();
            $now = now();

            if (!$amount || !$branch_id || !$person_id || !$paymentMethodId) {
                DB::rollBack();
                return response()->json(['message' => 'Campos obligatorios faltantes'], 400);
            }

            // Validar que la persona existe
            $beneficiary = DB::select('SELECT id FROM people WHERE id = ?', [$person_id]);
            if (empty($beneficiary)) {
                DB::rollBack();
                return response()->json(['message' => 'Beneficiario no registrado'], 400);
            }

            // Obtener caja activa
            $activo = CashRegisterController::getActive($branch_id);
            if ($activo->getStatusCode() !== 200) {
                DB::rollBack();
                return $activo;
            }
            $data = json_decode($activo->getContent());
            $cash_register_id = $data->caja->id ?? null;
            if (!$cash_register_id) {
                DB::rollBack();
                return response()->json(['message' => 'No se pudo obtener la caja activa'], 400);
            }

            $invoiceType = 2;

            // Validar lógica de pago
            if (!$payAll) {
                if (!$partialPayment || !is_numeric($partialPayment) || $partialPayment <= 0) {
                    DB::rollBack();
                    return response()->json(['message' => 'Debe ingresar un monto parcial válido'], 400);
                }
                if ($partialPayment > $amount) {
                    DB::rollBack();
                    return response()->json(['message' => 'El monto parcial no puede ser mayor al monto total'], 400);
                }
            }

            // Insertar en invoices y obtener el ID
            $invoice_id = DB::table('invoices')->insertGetId([
                'branch_id' => $branch_id,
                'person_id' => $person_id,
                'invoice_date' => $now,
                'invoice_type_id' => $invoiceType,
                'observations' => $details,
                'created_by' => $user_id,
                'created_at' => $now,
                'updated_at' => $now,
                'total_amount' => $amount
            ]);

            // Registrar el pago del egreso en payments
            $pago = $payAll ? $amount : $partialPayment;
            DB::table('payments')->insert([
                'branch_id' => $branch_id,
                'amount' => $pago,
                'observations' => $details,
                'payment_method_id' => $paymentMethodId,
                'cash_register_id' => $cash_register_id,
                'invoice_id' => $invoice_id,
                'payment_date' => $now,
                'created_at' => $now,
                'updated_at' => $now,
                'created_by' => $user_id,
            ]);

            DB::commit();
            return response()->json(['message' => 'Egreso creado correctamente'], 201);
        } catch (\Throwable $th) {
            DB::rollBack();
            Log::error('Error al crear el egreso: ' . $th->getMessage());
            return response()->json(['message' => 'Error al crear el egreso: ' . $th->getMessage()], 500);
        }
    }

        // Descargar factura en PDF
    public function downloadPdf($id, $returnPdf = false)
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
                if ($returnPdf) {
                    return $pdf;
                }
                return $pdf->stream('factura-' . $id . '.pdf');
            } else {
                $pdf = Pdf::loadView('invoices.egreso', $invoiceData);
                if ($returnPdf) {
                    return $pdf;
                }
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
                return $activo;
            }

            // se registra el egreso


            // Deserializar el contenido de la respuesta
            $datacaja = json_decode($activo->getContent());

            // Acceder al ID de la caja activa
            $cash_register_id = $datacaja->caja->id ?? null;

            if (!$cash_register_id) {
                return response()->json(['message' => 'No se pudo obtener el ID de la caja activa'], 400);
            }

            // Crear el pago y obtener el ID
            $paymentId = DB::table('payments')->insertGetId([
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

            // Enviar correo de confirmación de pago
            try {
                $invoiceData = $this->getInvoiceData($data['invoice_id']);
                $payment = collect($invoiceData['payments'])->where('id', $paymentId)->first();
                $pdf = $this->downloadPdf($data['invoice_id'], true);
                $recipientEmail = $invoiceData['invoice']->person_email ?? null;
                if ($recipientEmail) {
                    Mail::to($recipientEmail)->send(new PaymentConfirmationMail($invoiceData, $payment, $pdf));
                    Log::info('Correo de confirmación de pago enviado.', ['invoice_id' => $data['invoice_id'], 'payment_id' => $paymentId, 'recipient' => $recipientEmail]);
                } else {
                    Log::warning('No se pudo enviar el correo de confirmación de pago: email no encontrado.', ['invoice_id' => $data['invoice_id']]);
                }
            } catch (\Exception $e) {
                Log::error('Error al enviar correo de confirmación de pago: ' . $e->getMessage(), ['invoice_id' => $data['invoice_id']]);
            }

            return response()->json(['message' => 'Pago creado correctamente'], 201);
        } catch (\Throwable $th) {
            Log::error("Error al crear el pago: " . $th->getMessage());
            return response()->json(['error' => 'Error al crear el pago'], 500);
        }
    }

        /**
     * Verifica si la caja asociada a un payment está cerrada
     * @param int $paymentId
     * @return bool true si la caja está cerrada, false si está abierta o no existe
     */
    private function isPaymentCashRegisterClosed($paymentId)
    {
        $result = DB::selectOne('
            SELECT cr.status
            FROM payments p
            LEFT JOIN cash_register cr ON p.cash_register_id = cr.id
            WHERE p.id = ?
        ', [$paymentId]);
        if (!$result) return false;
        return ($result->status === 'closed');
    }
    
    public function updatePayment(Request $request, $id){
        try {
            // Validar si la caja está cerrada
            if ($this->isPaymentCashRegisterClosed($id)) {
                return response()->json(['error' => 'No se puede editar un pago de una caja cerrada'], 403);
            }
            $data = $request->validate([
                'branch_id' => 'required|integer',
                'amount' => 'required|numeric',
                'observations' => 'nullable|string',
                'payment_method_id' => 'nullable|integer',
                'invoice_id' => 'required|integer',
                'payment_date' => 'required|date'
            ]);
            Log::info('Datos recibidos para crear pago: ' . json_encode($data));
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
            // Validar si la caja está cerrada
            if ($this->isPaymentCashRegisterClosed($id)) {
                return response()->json(['error' => 'No se puede eliminar un pago de una caja cerrada'], 403);
            }
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
                payment_users.name as payment_created_by_name,
                cr.status as cash_register_status,
                (CASE WHEN cr.status = 'closed' THEN 1 ELSE 0 END) as is_cash_register_closed
            FROM payments
            LEFT JOIN payment_methods ON payments.payment_method_id = payment_methods.id
            LEFT JOIN users as payment_users ON payments.created_by = payment_users.id
            LEFT JOIN cash_register cr ON payments.cash_register_id = cr.id
            WHERE payments.invoice_id = ?
        ", [$id]);

        return [
            'invoice' => $invoice[0] ?? null,
            'items' => $items,
            'payments' => $payments
        ];
    }

    public function searchPeople(Request $request)
    {
        try {
            $query = $request->input('query', '');
            if (strlen($query) < 2) {
                return response()->json(['message' => 'El término de búsqueda debe tener al menos 2 caracteres'], 400);
            }
            $likeQuery = '%' . $query . '%';
            $people = DB::select('
                SELECT 
                    id,
                    CONCAT(first_name, " ", last_name, ": ", identification_number) as name
                FROM people
                WHERE 
                    first_name LIKE ?
                    OR last_name LIKE ?
                    OR identification_number LIKE ?
                    OR CONCAT(first_name, " ", last_name) LIKE ?
                ORDER BY 
                    CASE 
                        WHEN first_name LIKE ? THEN 1
                        WHEN last_name LIKE ? THEN 2
                        WHEN identification_number LIKE ? THEN 3
                        WHEN CONCAT(first_name, " ", last_name) LIKE ? THEN 4
                        ELSE 5 
                    END,
                    first_name ASC,
                    last_name ASC
                LIMIT 15
            ', [
                $likeQuery,
                $likeQuery,
                $likeQuery,
                $likeQuery,
                $query . '%',
                $query . '%',
                $query . '%',
                $query . '%'
            ]);
            return response()->json(['people' => $people]);
        } catch (\Exception $e) {
            Log::error('Error al buscar personas: ' . $e->getMessage());
            return response()->json(['message' => 'Error al buscar personas'], 500);
        }
    }
}
