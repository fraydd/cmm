<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

class PurchaseController extends Controller
{
    // Listar facturas (compras)
    public function index(Request $request)
    {
        $invoices = DB::table('invoices')
            ->leftJoin('people', 'invoices.person_id', '=', 'people.id')
            ->leftJoin('branches', 'invoices.branch_id', '=', 'branches.id')
            ->leftJoin('invoice_statuses', 'invoices.status_id', '=', 'invoice_statuses.id')
            ->leftJoin('invoice_types', 'invoices.invoice_type_id', '=', 'invoice_types.id')
            ->leftJoin('users', 'invoices.created_by', '=', 'users.id')
            ->select(
                'invoices.id',
                'invoices.invoice_date',
                DB::raw("CONCAT(people.first_name, ' ', people.last_name) as person_name"),
                'branches.name as branch_name',
                'invoices.total_amount',
                'invoices.paid_amount',
                'invoices.remaining_amount',
                'invoice_statuses.name as status',
                'invoice_types.name as invoice_type',
                'invoices.observations',
                'users.name as created_by'
            )
            ->orderByDesc('invoices.invoice_date')
            ->get();
        return response()->json(['invoices' => $invoices]);
    }

    // Mostrar una factura específica
    public function show($id)
    {
        $data = $this->getInvoiceData($id);
        if (!$data || !$data['invoice']) {
            return response()->json(['error' => 'Factura no encontrada'], 404);
        }
        return response()->json($data);
    }

    // Registrar una nueva compra (factura)
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'branch_id' => 'required|integer',
            'person_id' => 'nullable|integer',
            'invoice_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.item_type_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.total_price' => 'required|numeric|min:0',
            'status_id' => 'required|integer',
            'invoice_type_id' => 'required|integer',
            'observations' => 'nullable|string',
            'payments' => 'nullable|array',
            'payments.*.payment_method_id' => 'required_with:payments|integer',
            'payments.*.amount' => 'required_with:payments|numeric|min:0',
            'payments.*.payment_date' => 'required_with:payments|date',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $data = $validator->validated();
        DB::beginTransaction();
        try {
            $invoiceId = DB::table('invoices')->insertGetId([
                'branch_id' => $data['branch_id'],
                'person_id' => $data['person_id'] ?? null,
                'invoice_date' => $data['invoice_date'],
                'total_amount' => collect($data['items'])->sum('total_price'),
                'paid_amount' => isset($data['payments']) ? collect($data['payments'])->sum('amount') : 0,
                'remaining_amount' => collect($data['items'])->sum('total_price') - (isset($data['payments']) ? collect($data['payments'])->sum('amount') : 0),
                'status_id' => $data['status_id'],
                'invoice_type_id' => $data['invoice_type_id'],
                'observations' => $data['observations'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            foreach ($data['items'] as $item) {
                DB::table('invoice_items')->insert([
                    'invoice_id' => $invoiceId,
                    'item_type_id' => $item['item_type_id'],
                    'subscription_id' => $item['subscription_id'] ?? null,
                    'event_id' => $item['event_id'] ?? null,
                    'product_id' => $item['product_id'] ?? null,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['total_price'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
            if (isset($data['payments'])) {
                foreach ($data['payments'] as $payment) {
                    DB::table('payments')->insert([
                        'branch_id' => $data['branch_id'],
                        'invoice_id' => $invoiceId,
                        'payment_method_id' => $payment['payment_method_id'],
                        'amount' => $payment['amount'],
                        'payment_date' => $payment['payment_date'],
                        'observations' => $payment['observations'] ?? null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
            DB::commit();
            return response()->json(['id' => $invoiceId], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al registrar compra: ' . $e->getMessage());
            return response()->json(['error' => 'Error al registrar la compra'], 500);
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
