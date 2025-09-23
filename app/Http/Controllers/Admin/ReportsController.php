<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ReportsController extends Controller
{
    // Solo sirve la vista de informes
    public function index(Request $request)
    {
        return Inertia::render('Admin/Reports/Index');
    }

    // Exporta la lista de modelos en Excel y la descarga
    public function exportModelsExcel(Request $request)
    {
    // Recibe sedes seleccionadas (por ahora solo las recibe, no filtra)
    $branches = $request->input('branches', []);
    // Consulta SQL cruda mejorada para obtener modelos activos, no softdelete, nombre completo y última suscripción
    $sql = <<<SQL
        SELECT m.id AS model_id,
               CONCAT(p.first_name, ' ', COALESCE(p.last_name, '')) AS nombre_completo,
               p.identification_number,
               p.phone,
               p.email,
               p.birth_date,
               p.address,
               g.name AS gender,
               bt.name AS blood_type,
               mp.height,
               mp.bust,
               mp.waist,
               mp.hips,
               mp.pants_size,
               mp.shirt_size,
               mp.shoe_size,
               (
                   SELECT MAX(s.start_date)
                   FROM subscriptions s
                   WHERE s.model_id = m.id AND s.is_active = 1
               ) AS ultima_suscripcion_inicio,
               (
                   SELECT MAX(s.end_date)
                   FROM subscriptions s
                   WHERE s.model_id = m.id AND s.is_active = 1
               ) AS ultima_suscripcion_fin
        FROM models m
        INNER JOIN people p ON m.person_id = p.id
        LEFT JOIN genders g ON p.gender_id = g.id
        LEFT JOIN blood_types bt ON p.blood_type_id = bt.id
        LEFT JOIN model_profiles mp ON mp.model_id = m.id
        WHERE m.is_active = 1 AND p.is_active = 1
        ORDER BY p.first_name, p.last_name
        SQL;

        $rows = DB::select($sql);
        $collection = Collection::make($rows)->map(function ($item) {
            return [
                'ID' => $item->model_id,
                'Nombre Completo' => $item->nombre_completo,
                'Identificación' => $item->identification_number,
                'Teléfono' => $item->phone,
                'Email' => $item->email,
                'Fecha Nacimiento' => $item->birth_date,
                'Dirección' => $item->address,
                'Género' => $item->gender,
                'Tipo Sangre' => $item->blood_type,
                'Estatura' => $item->height,
                'Busto' => $item->bust,
                'Cintura' => $item->waist,
                'Cadera' => $item->hips,
                'Talla Pantalón' => $item->pants_size,
                'Talla Camisa' => $item->shirt_size,
                'Talla Zapato' => $item->shoe_size,
                'Inicio Última Suscripción' => $item->ultima_suscripcion_inicio,
                'Fin Última Suscripción' => $item->ultima_suscripcion_fin,
            ];
        });

        // Clase anónima para exportar la colección con encabezados, estilos y filtros
    $export = new class($collection) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings, \Maatwebsite\Excel\Concerns\WithStyles, \Maatwebsite\Excel\Concerns\WithColumnWidths, \Maatwebsite\Excel\Concerns\WithEvents {
            protected $collection;
            public function __construct($collection) {
                $this->collection = $collection;
            }
            public function collection() {
                return $this->collection;
            }
            public function headings(): array {
                return [
                    'ID', 'Nombre Completo', 'Identificación', 'Teléfono', 'Email', 'Fecha Nacimiento', 'Dirección',
                    'Género', 'Tipo Sangre', 'Estatura', 'Busto', 'Cintura', 'Cadera', 'Talla Pantalón', 'Talla Camisa', 'Talla Zapato',
                    'Inicio Última Suscripción', 'Fin Última Suscripción'
                ];
            }
            // Estilos para el encabezado
            public function styles(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet)
            {
                $sheet->getStyle('A1:R1')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'color' => ['rgb' => 'FFFFFF'],
                    ],
                    'fill' => [
                        'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                        'startColor' => ['rgb' => '0073e6'],
                    ],
                ]);
                return [
                    1 => ['font' => ['bold' => true]],
                ];
            }
            // Ancho de columnas personalizado
            public function columnWidths(): array
            {
                return [
                    'A' => 7,   // ID
                    'B' => 22,  // Nombre Completo
                    'C' => 15,  // Identificación
                    'D' => 15,  // Teléfono
                    'E' => 25,  // Email
                    'F' => 15,  // Fecha Nacimiento
                    'G' => 22,  // Dirección
                    'H' => 12,  // Género
                    'I' => 12,  // Tipo Sangre
                    'J' => 10,  // Estatura
                    'K' => 10,  // Busto
                    'L' => 10,  // Cintura
                    'M' => 10,  // Cadera
                    'N' => 12,  // Talla Pantalón
                    'O' => 12,  // Talla Camisa
                    'P' => 12,  // Talla Zapato
                    'Q' => 20,  // Inicio Última Suscripción
                    'R' => 20,  // Fin Última Suscripción
                ];
            }
            // Evento para congelar la fila de encabezado y aplicar autofiltro
            public function registerEvents(): array
            {
                return [
                    \Maatwebsite\Excel\Events\AfterSheet::class => function(\Maatwebsite\Excel\Events\AfterSheet $event) {
                        $event->sheet->freezePane('A2');
                        $event->sheet->getDelegate()->setAutoFilter('A1:R1');
                    },
                ];
            }
        };

        $filename = 'modelos_' . date('Ymd_His') . '.xlsx';
        return Excel::download($export, $filename);
    }
       // Exporta la lista de empleados en Excel y la descarga
    public function exportEmployeesExcel(Request $request)
    {
        $branches = $request->input('branches', []);
        $branchesList = implode(',', array_map('intval', $branches));
        $sql = <<<SQL
                SELECT e.id AS empleado_id,
                             CONCAT(p.first_name, ' ', COALESCE(p.last_name, '')) AS nombre_completo,
                             p.identification_number,
                             p.phone,
                             p.email,
                             p.birth_date,
                             p.address,
                             g.name AS genero,
                             bt.name AS tipo_sangre,
                             e.role,
                             e.hire_date,
                             e.salary,
                             e.job_description,
                             (
                                     SELECT GROUP_CONCAT(DISTINCT b.name SEPARATOR ', ')
                                     FROM employee_branch_access eba
                                     INNER JOIN branches b ON b.id = eba.branch_id
                                     WHERE eba.employee_id = e.id
                             ) AS sedes_acceso
                FROM employees e
                INNER JOIN people p ON e.person_id = p.id
                LEFT JOIN genders g ON p.gender_id = g.id
                LEFT JOIN blood_types bt ON p.blood_type_id = bt.id
                WHERE e.is_active = 1 AND p.is_active = 1
                    AND EXISTS (
                            SELECT 1 FROM employee_branch_access eba
                            WHERE eba.employee_id = e.id
                                AND eba.branch_id IN ($branchesList)
                    )
                ORDER BY p.first_name, p.last_name
                SQL;

        $rows = DB::select($sql);
        $collection = Collection::make($rows)->map(function ($item) {
            return [
                'ID' => $item->empleado_id,
                'Nombre Completo' => $item->nombre_completo,
                'Identificación' => $item->identification_number,
                'Teléfono' => $item->phone,
                'Email' => $item->email,
                'Fecha Nacimiento' => $item->birth_date,
                'Dirección' => $item->address,
                'Género' => $item->genero,
                'Tipo Sangre' => $item->tipo_sangre,
                'Rol' => $item->role,
                'Contratación' => $item->hire_date,
                'Salario' => $item->salary,
                'Descripción Cargo' => $item->job_description,
                'Sedes Acceso' => $item->sedes_acceso,
            ];
        });

        $export = new class($collection) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings, \Maatwebsite\Excel\Concerns\WithStyles, \Maatwebsite\Excel\Concerns\WithColumnWidths, \Maatwebsite\Excel\Concerns\WithEvents {
            protected $collection;
            public function __construct($collection) {
                $this->collection = $collection;
            }
            public function collection() {
                return $this->collection;
            }
            public function headings(): array {
                return [
                    'ID', 'Nombre Completo', 'Identificación', 'Teléfono', 'Email', 'Fecha Nacimiento', 'Dirección',
                    'Género', 'Tipo Sangre', 'Rol', 'Contratación', 'Salario', 'Descripción Cargo', 'Sedes Acceso'
                ];
            }
            public function styles(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet)
            {
                $sheet->getStyle('A1:N1')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'color' => ['rgb' => 'FFFFFF'],
                    ],
                    'fill' => [
                        'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                        'startColor' => ['rgb' => '0073e6'],
                    ],
                ]);
                return [
                    1 => ['font' => ['bold' => true]],
                ];
            }
            public function columnWidths(): array
            {
                return [
                    'A' => 7,   // ID
                    'B' => 22,  // Nombre Completo
                    'C' => 15,  // Identificación
                    'D' => 15,  // Teléfono
                    'E' => 25,  // Email
                    'F' => 15,  // Fecha Nacimiento
                    'G' => 22,  // Dirección
                    'H' => 12,  // Género
                    'I' => 12,  // Tipo Sangre
                    'J' => 18,  // Rol
                    'K' => 15,  // Contratación
                    'L' => 12,  // Salario
                    'M' => 30,  // Descripción Cargo
                    'N' => 30,  // Sedes Acceso
                ];
            }
            public function registerEvents(): array
            {
                return [
                    \Maatwebsite\Excel\Events\AfterSheet::class => function(\Maatwebsite\Excel\Events\AfterSheet $event) {
                        $event->sheet->freezePane('A2');
                        $event->sheet->getDelegate()->setAutoFilter('A1:N1');
                    },
                ];
            }
        };

        $filename = 'empleados_' . date('Ymd_His') . '.xlsx';
        return Excel::download($export, $filename);
    }
       public function exportCashRegisterExcel(Request $request)
    {
        $branches = $request->input('branches', []);
        $startDateUtc = $request->input('start_date');
        $endDateUtc = $request->input('end_date');
        if (!is_array($branches) || empty($branches) || !$startDateUtc || !$endDateUtc) {
            return response()->json(['message' => 'branches, start_date y end_date son requeridos'], 400);
        }
        $branchesList = implode(',', array_map('intval', $branches));
        // Consulta SQL: filtra por sede y rango de fechas UTC, convierte fechas a hora local de Colombia
        $sql = <<<SQL
            SELECT cr.id,
                   b.name AS sede,
                   CONVERT_TZ(cr.opening_date, 'UTC', 'America/Bogota') AS apertura_local,
                   CONVERT_TZ(cr.closing_date, 'UTC', 'America/Bogota') AS cierre_local,
                   cr.initial_amount,
                   cr.final_amount,
                   cr.total_income,
                   cr.total_expenses,
                   cr.status,
                   u.name AS responsable,
                   cr.observations
            FROM cash_register cr
            INNER JOIN branches b ON cr.branch_id = b.id
            INNER JOIN users u ON cr.responsible_user_id = u.id
            WHERE cr.branch_id IN ($branchesList)
              AND cr.created_at BETWEEN ? AND ?
            ORDER BY cr.opening_date DESC
        SQL;
        $rows = DB::select($sql, [$startDateUtc, $endDateUtc]);
        $collection = collect($rows)->map(function ($item) {
            return [
                'ID' => $item->id,
                'Sede' => $item->sede,
                'Apertura (Colombia)' => $item->apertura_local,
                'Cierre (Colombia)' => $item->cierre_local,
                'Monto Inicial' => $item->initial_amount,
                'Monto Final' => $item->final_amount,
                'Ingresos' => $item->total_income,
                'Egresos' => $item->total_expenses,
                'Estado' => $item->status,
                'Responsable' => $item->responsable,
                'Observaciones' => $item->observations,
            ];
        });
        $export = new class($collection) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings, \Maatwebsite\Excel\Concerns\WithStyles, \Maatwebsite\Excel\Concerns\WithColumnWidths, \Maatwebsite\Excel\Concerns\WithEvents {
            protected $collection;
            public function __construct($collection) {
                $this->collection = $collection;
            }
            public function collection() {
                return $this->collection;
            }
            public function headings(): array {
                return [
                    'ID', 'Sede', 'Apertura (Colombia)', 'Cierre (Colombia)', 'Monto Inicial', 'Monto Final', 'Ingresos', 'Egresos', 'Estado', 'Responsable', 'Observaciones'
                ];
            }
            public function styles(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet)
            {
                $sheet->getStyle('A1:K1')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'color' => ['rgb' => 'FFFFFF'],
                    ],
                    'fill' => [
                        'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                        'startColor' => ['rgb' => '0073e6'],
                    ],
                ]);
                return [
                    1 => ['font' => ['bold' => true]],
                ];
            }
            public function columnWidths(): array
            {
                return [
                    'A' => 7,   // ID
                    'B' => 18,  // Sede
                    'C' => 22,  // Apertura
                    'D' => 22,  // Cierre
                    'E' => 15,  // Monto Inicial
                    'F' => 15,  // Monto Final
                    'G' => 15,  // Ingresos
                    'H' => 15,  // Egresos
                    'I' => 12,  // Estado
                    'J' => 18,  // Responsable
                    'K' => 30,  // Observaciones
                ];
            }
            public function registerEvents(): array
            {
                return [
                    \Maatwebsite\Excel\Events\AfterSheet::class => function(\Maatwebsite\Excel\Events\AfterSheet $event) {
                        $event->sheet->freezePane('A2');
                        $event->sheet->getDelegate()->setAutoFilter('A1:K1');
                    },
                ];
            }
        };
        $filename = 'cierres_caja_' . date('Ymd_His') . '.xlsx';
        return \Maatwebsite\Excel\Facades\Excel::download($export, $filename);
    }

    public function exportInvoicesExcel(Request $request)
    {
        $branches = $request->input('branches', []);
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        if (!is_array($branches) || empty($branches) || !$startDate || !$endDate) {
            return response()->json(['message' => 'branches, start_date y end_date son requeridos'], 400);
        }
        $branchesList = implode(',', array_map('intval', $branches));
        // Consulta SQL: filtra por sede y rango de fechas
        $sql = <<<SQL
            SELECT i.id AS factura_id,
                   b.name AS sede,
                   i.invoice_date,
                   i.total_amount,
                   i.paid_amount,
                   i.remaining_amount,
                   ist.name AS estado,
                   it.name AS tipo,
                   p.first_name AS cliente_nombre,
                   p.last_name AS cliente_apellido,
                   i.observations
            FROM invoices i
            INNER JOIN branches b ON i.branch_id = b.id
            LEFT JOIN people p ON i.person_id = p.id
            INNER JOIN invoice_statuses ist ON i.status_id = ist.id
            INNER JOIN invoice_types it ON i.invoice_type_id = it.id
            WHERE i.branch_id IN ($branchesList)
              AND i.invoice_date BETWEEN ? AND ?
            ORDER BY i.invoice_date DESC
        SQL;
        $rows = DB::select($sql, [$startDate, $endDate]);
        $collection = collect($rows)->map(function ($item) {
            return [
                'ID' => $item->factura_id,
                'Sede' => $item->sede,
                'Fecha' => $item->invoice_date,
                'Cliente' => trim($item->cliente_nombre . ' ' . $item->cliente_apellido),
                'Monto Total' => $item->total_amount,
                'Pagado' => $item->paid_amount,
                'Saldo' => $item->remaining_amount,
                'Estado' => $item->estado,
                'Tipo' => $item->tipo,
                'Observaciones' => $item->observations,
            ];
        });
        $export = new class($collection) implements \Maatwebsite\Excel\Concerns\FromCollection, \Maatwebsite\Excel\Concerns\WithHeadings, \Maatwebsite\Excel\Concerns\WithStyles, \Maatwebsite\Excel\Concerns\WithColumnWidths, \Maatwebsite\Excel\Concerns\WithEvents {
            protected $collection;
            public function __construct($collection) {
                $this->collection = $collection;
            }
            public function collection() {
                return $this->collection;
            }
            public function headings(): array {
                return [
                    'ID', 'Sede', 'Fecha', 'Cliente', 'Monto Total', 'Pagado', 'Saldo', 'Estado', 'Tipo', 'Observaciones'
                ];
            }
            public function styles(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet)
            {
                $sheet->getStyle('A1:J1')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'color' => ['rgb' => 'FFFFFF'],
                    ],
                    'fill' => [
                        'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                        'startColor' => ['rgb' => '0073e6'],
                    ],
                ]);
                return [
                    1 => ['font' => ['bold' => true]],
                ];
            }
            public function columnWidths(): array
            {
                return [
                    'A' => 7,   // ID
                    'B' => 18,  // Sede
                    'C' => 15,  // Fecha
                    'D' => 22,  // Cliente
                    'E' => 15,  // Monto Total
                    'F' => 15,  // Pagado
                    'G' => 15,  // Saldo
                    'H' => 12,  // Estado
                    'I' => 12,  // Tipo
                    'J' => 30,  // Observaciones
                ];
            }
            public function registerEvents(): array
            {
                return [
                    \Maatwebsite\Excel\Events\AfterSheet::class => function(\Maatwebsite\Excel\Events\AfterSheet $event) {
                        $event->sheet->freezePane('A2');
                        $event->sheet->getDelegate()->setAutoFilter('A1:J1');
                    },
                ];
            }
        };
        $filename = 'facturas_' . date('Ymd_His') . '.xlsx';
        return Excel::download($export, $filename);
    }
}
