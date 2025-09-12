<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use Carbon\CarbonTimeZone;
use Inertia\Inertia;
use PhpParser\Node\Stmt\TryCatch;

class AttendanceController extends Controller
{
    // Listar asistencias - Solo sirve la vista
    public function index(Request $request)
    {
        return Inertia::render('Admin/Attendance/Index');
    }

    // Obtener registros de asistencia con filtros
    public function getAttendanceRecords(Request $request)
    {
        // Validar parámetros requeridos
        $validator = Validator::make($request->all(), [
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'branch_ids' => 'required|array|min:1',
            'branch_ids.*' => 'integer|exists:branches,id',
            'type' => 'required|in:models,employees'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }


        $branchIds = $request->input('branch_ids');
        $type = $request->input('type');

        // Obtener zona horaria del cliente (por defecto UTC)
        $clientTz = $request->input('time_zone', 'UTC');
        $startDateLocal = $request->input('start_date');
        $endDateLocal = $request->input('end_date');
        // Convertir fechas locales a UTC para la consulta
        $startDate = Carbon::parse($startDateLocal, new CarbonTimeZone($clientTz))->setTimezone('UTC')->format('Y-m-d H:i:s');
        $endDate = Carbon::parse($endDateLocal, new CarbonTimeZone($clientTz))->setTimezone('UTC')->format('Y-m-d H:i:s');


        try {
            if ($type === 'models') {
                // Consulta para modelos
                $records = DB::select('
                    SELECT 
                        CONCAT(p.first_name, " ", p.last_name) as nombres,
                        p.identification_number as identificacion,
                        b.name as sede,
                        ar.check_in as ingreso,
                        ar.created_at,
                        ar.id
                    FROM attendance_records ar
                    INNER JOIN models m ON ar.model_id = m.id
                    INNER JOIN people p ON m.person_id = p.id
                    INNER JOIN branches b ON ar.branch_id = b.id
                    WHERE ar.created_at BETWEEN ? AND ?
                    AND ar.branch_id IN (' . implode(',', array_fill(0, count($branchIds), '?')) . ')
                    ORDER BY ar.check_in DESC
                ', array_merge([$startDate, $endDate], $branchIds));
                // Convertir fechas a la zona horaria del cliente
                foreach ($records as $rec) {
                    if ($rec->ingreso) {
                        $rec->ingreso = Carbon::parse($rec->ingreso, 'UTC')->setTimezone($clientTz)->format('Y-m-d H:i:s');
                    }
                    if ($rec->created_at) {
                        $rec->created_at = Carbon::parse($rec->created_at, 'UTC')->setTimezone($clientTz)->format('Y-m-d H:i:s');
                    }
                }
            } else {
                // Consulta para empleados
                $records = DB::select('
                    SELECT 
                        CONCAT(p.first_name, " ", p.last_name) as nombres,
                        p.identification_number as identificacion,
                        b.name as sede,
                        ar.check_in as ingreso,
                        ar.check_out as salida,
                        ar.created_at,
                        ar.id
                    FROM attendance_records ar
                    INNER JOIN employees e ON ar.employee_id = e.id
                    INNER JOIN people p ON e.person_id = p.id
                    INNER JOIN branches b ON ar.branch_id = b.id
                    WHERE ar.created_at BETWEEN ? AND ?
                    AND ar.branch_id IN (' . implode(',', array_fill(0, count($branchIds), '?')) . ')
                    ORDER BY ar.check_in DESC
                ', array_merge([$startDate, $endDate], $branchIds));
                // Convertir fechas a la zona horaria del cliente
                foreach ($records as $rec) {
                    if ($rec->ingreso) {
                        $rec->ingreso = Carbon::parse($rec->ingreso, 'UTC')->setTimezone($clientTz)->format('Y-m-d H:i:s');
                    }
                    if ($rec->salida) {
                        $rec->salida = Carbon::parse($rec->salida, 'UTC')->setTimezone($clientTz)->format('Y-m-d H:i:s');
                    }
                    if ($rec->created_at) {
                        $rec->created_at = Carbon::parse($rec->created_at, 'UTC')->setTimezone($clientTz)->format('Y-m-d H:i:s');
                    }
                }
            }

            return response()->json([
                'success' => true,
                'data' => $records,
                'type' => $type,
                'filters' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'branch_ids' => $branchIds,
                    'type' => $type
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error al consultar registros de asistencia: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error interno del servidor al consultar los registros'
            ], 500);
        }
    }

    // Mostrar un registro de asistencia
    public function show($id)
    {
        $attendance = DB::selectOne('SELECT * FROM attendance_records WHERE id = ?', [$id]);
        if (!$attendance) {
            abort(404);
        }
        return response()->json($attendance);
    }

    // Crear un nuevo registro de asistencia
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'branch_id' => 'required|integer',
            'employee_id' => 'nullable|integer',
            'model_id' => 'nullable|integer',
            'check_in' => 'required|date',
            'check_out' => 'nullable|date',
            'observations' => 'nullable|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $data = $validator->validated();
        $id = DB::table('attendance_records')->insertGetId($data);
        return response()->json(['id' => $id], 201);
    }

    /**
     * Actualiza un registro de asistencia (empleado o modelo) usando consulta directa.
     */
    public function update(Request $request, $id)
    {
        try{
            Log::info('Actualizando registro de asistencia: ' . $id);

            $request->validate([
                'type' => 'required|in:models,employees',
                'ingreso' => 'required|date',
                'salida' => 'nullable|date',
                'time_zone' => 'required|string',
            ]);

            // Convertir ingreso a UTC
            $checkInUtc = \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', $request->ingreso, $request->time_zone)
                ->setTimezone('UTC')
                ->format('Y-m-d H:i:s');

            $data = [
                'check_in' => $checkInUtc,
                'updated_at' => now('UTC'),
            ];

            if ($request->type === 'employees') {
                $checkOutUtc = $request->salida
                    ? \Carbon\Carbon::createFromFormat('Y-m-d H:i:s', $request->salida, $request->time_zone)
                        ->setTimezone('UTC')
                        ->format('Y-m-d H:i:s')
                    : null;
                $data['check_out'] = $checkOutUtc;
            } else {
                $data['check_out'] = null;
            }

            // Actualizar el registro directamente en la base de datos
            DB::table('attendance_records')->where('id', $id)->update($data);

            return response()->json([
                'message' => 'Asistencia actualizada correctamente',
                'attendance' => array_merge(['id' => $id], $data)
            ]);
        }
        catch (\Exception $e) {
            Log::error('Error al actualizar registro de asistencia: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Error interno del servidor al actualizar el registro'
            ], 500);
        }
    }

    // Eliminar un registro de asistencia
    public function destroy($id)
    {
        DB::table('attendance_records')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }

    /**
     * Devuelve el catálogo de sedes a las que tiene acceso el empleado autenticado.
     */
    public function getAccessibleBranches()
    {
        $userId = Auth::id();
        if ($userId == 1) {
            // Admin: devolver todas las sedes activas
            $branches = DB::select('SELECT id, name FROM branches WHERE is_active = 1');
        } else {
            // Empleado: devolver solo las sedes activas a las que tiene acceso
            $branches = DB::select('
                SELECT 
                b.id, b.name FROM users u 
                INNER JOIN employees e ON u.id = e.user_id 
                INNER JOIN employee_branch_access eba ON e.id = eba.employee_id 
                INNER JOIN branches b ON eba.branch_id = b.id
                WHERE u.id = ? AND b.is_active = 1'
            , [$userId]);
        }
        return response()->json($branches);
    }
}