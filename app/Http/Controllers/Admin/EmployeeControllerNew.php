<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class EmployeeController extends \App\Http\Controllers\Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $inicio = microtime(true);
        
        Log::info('Accediendo a la lista de empleados');
        Log::debug('Parámetros de la petición:', request()->all());
        
        $empleados = DB::table('employees as e')
            ->join('people as p', 'e.person_id', '=', 'p.id')
            ->leftJoin('users as u', 'e.user_id', '=', 'u.id')
            ->where('e.is_active', true)
            ->where('p.is_active', true)
            ->select([
                'e.id',
                DB::raw("CONCAT(p.first_name, ' ', p.last_name) as nombre"),
                'e.role as cargo',
                'p.identification_number as identificacion',
                'p.phone as telefono',
                'p.email',
                'e.hire_date as fecha_contratacion',
                'e.end_date as fecha_fin',
                'e.is_active',
                'u.email as email_usuario',
                'e.created_at as fecha_creacion'
            ])
            ->orderBy('e.created_at', 'desc')
            ->get()
            ->map(function($empleado) {
                $estado = 'Activo';
                if ($empleado->fecha_fin && $empleado->fecha_fin < date('Y-m-d')) {
                    $estado = 'Inactivo';
                }
                
                return [
                    'id' => $empleado->id,
                    'nombre' => $empleado->nombre,
                    'cargo' => $empleado->cargo,
                    'identificacion' => $empleado->identificacion,
                    'telefono' => $empleado->telefono,
                    'email' => $empleado->email,
                    'fecha_contratacion' => $empleado->fecha_contratacion ? date('Y-m-d', strtotime($empleado->fecha_contratacion)) : 'N/A',
                    'estado' => $estado,
                    'tiene_usuario' => !empty($empleado->email_usuario),
                    'email_usuario' => $empleado->email_usuario
                ];
            })
            ->toArray();
        
        $tiempoEjecucion = microtime(true) - $inicio;
        
        // Si es una petición AJAX para recargar datos, devolver JSON
        if (request()->ajax() && request()->header('X-Requested-With') === 'XMLHttpRequest' && request()->header('Content-Type') === 'application/json') {
            return response()->json([
                'empleados' => $empleados,
                'timestamp' => now()->toISOString()
            ]);
        }
        
        return Inertia::render('Admin/Employees/Index', [
            'empleados' => $empleados,
            'debug_info' => [
                'total_empleados' => count($empleados),
                'timestamp' => now()->toISOString(),
                'tiempo_ejecucion' => round($tiempoEjecucion * 1000, 2) . 'ms'
            ]
        ]);
    }

    /**
     * Get catalogs for employee creation/editing
     */
    public function catalogs(Request $request)
    {
        return response()->json([
            'identification_types' => DB::table('identification_types')->select('id', 'name')->where('is_active', true)->orderBy('name')->get(),
            'genders' => DB::table('genders')->select('id', 'name')->where('is_active', true)->orderBy('name')->get(),
            'blood_types' => DB::table('blood_types')->select('id', 'name')->where('is_active', true)->orderBy('name')->get(),
            'branches' => DB::table('branches')->select('id', 'name')->where('is_active', true)->orderBy('name')->get(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Admin/Employees/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->all();
        
        Log::info('=== DATOS DEL FORMULARIO DE EMPLEADO ===');
        Log::info('Objeto completo: ' . json_encode($data, JSON_PRETTY_PRINT));
        Log::info('=== FIN DATOS FORMULARIO ===');

        // Validación básica
        $request->validate([
            'nombres' => 'required|string|max:255',
            'apellidos' => 'required|string|max:255',
            'numero_identificacion' => 'required|string|unique:people,identification_number',
            'identification_type_id' => 'required|exists:identification_types,id',
            'telefono' => 'required|string|max:20',
            'email' => 'required|email|unique:people,email',
            'cargo' => 'required|string|max:100',
            'fecha_contratacion' => 'required|date',
            'branch_ids' => 'required|array|min:1',
            'branch_ids.*' => 'exists:branches,id',
        ]);

        DB::beginTransaction();
        try {
            // 1. Insertar en people
            $personId = DB::table('people')->insertGetId([
                'first_name' => $data['nombres'],
                'last_name' => $data['apellidos'],
                'identification_number' => $data['numero_identificacion'],
                'identification_type_id' => $data['identification_type_id'],
                'identification_place' => $data['lugar_expedicion'] ?? null,
                'birth_date' => $data['fecha_nacimiento'] ?? null,
                'address' => $data['direccion'] ?? null,
                'phone' => $data['telefono'],
                'email' => $data['email'],
                'gender_id' => $data['gender_id'] ?? null,
                'blood_type_id' => $data['blood_type_id'] ?? null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 2. Crear usuario si se especifica
            $userId = null;
            if (!empty($data['crear_usuario']) && $data['crear_usuario']) {
                $userId = DB::table('users')->insertGetId([
                    'name' => $data['nombres'] . ' ' . $data['apellidos'],
                    'email' => $data['email_usuario'] ?? $data['email'],
                    'password' => Hash::make($data['password'] ?? 'password123'),
                    'email_verified_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 3. Insertar en employees
            $employeeId = DB::table('employees')->insertGetId([
                'person_id' => $personId,
                'user_id' => $userId,
                'role' => $data['cargo'],
                'hire_date' => $data['fecha_contratacion'],
                'end_date' => $data['fecha_fin'] ?? null,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 4. Asignar acceso a sedes
            if (!empty($data['branch_ids'])) {
                foreach ($data['branch_ids'] as $branchId) {
                    DB::table('employee_branch_access')->insert([
                        'employee_id' => $employeeId,
                        'branch_id' => $branchId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Empleado registrado correctamente']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al registrar empleado: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['success' => false, 'message' => 'Error al registrar empleado: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $empleado = DB::table('employees as e')
            ->join('people as p', 'e.person_id', '=', 'p.id')
            ->leftJoin('users as u', 'e.user_id', '=', 'u.id')
            ->leftJoin('identification_types as it', 'p.identification_type_id', '=', 'it.id')
            ->leftJoin('genders as g', 'p.gender_id', '=', 'g.id')
            ->leftJoin('blood_types as bt', 'p.blood_type_id', '=', 'bt.id')
            ->where('e.id', $id)
            ->select([
                'e.*',
                'p.*',
                'u.email as email_usuario',
                'it.name as tipo_identificacion',
                'g.name as genero',
                'bt.name as tipo_sangre'
            ])
            ->first();

        if (!$empleado) {
            return response()->json(['success' => false, 'message' => 'Empleado no encontrado'], 404);
        }

        // Obtener sedes asignadas
        $sedes = DB::table('employee_branch_access as eba')
            ->join('branches as b', 'eba.branch_id', '=', 'b.id')
            ->where('eba.employee_id', $id)
            ->select('b.id', 'b.name')
            ->get();

        // Obtener historial de asistencias recientes
        $asistencias = DB::table('attendance_records')
            ->where('employee_id', $id)
            ->orderBy('check_in', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('Admin/Employees/Show', [
            'empleado' => $empleado,
            'sedes' => $sedes,
            'asistencias' => $asistencias
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        $empleado = DB::table('employees as e')
            ->join('people as p', 'e.person_id', '=', 'p.id')
            ->leftJoin('users as u', 'e.user_id', '=', 'u.id')
            ->where('e.id', $id)
            ->select([
                'e.*',
                'p.*',
                'u.email as email_usuario'
            ])
            ->first();

        if (!$empleado) {
            return response()->json(['success' => false, 'message' => 'Empleado no encontrado'], 404);
        }

        // Obtener sedes asignadas
        $sedesAsignadas = DB::table('employee_branch_access')
            ->where('employee_id', $id)
            ->pluck('branch_id')
            ->toArray();

        return Inertia::render('Admin/Employees/Edit', [
            'empleado' => $empleado,
            'sedes_asignadas' => $sedesAsignadas
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $data = $request->all();
        
        Log::info("=== ACTUALIZANDO EMPLEADO ID: $id ===");
        Log::info('Datos recibidos: ' . json_encode($data, JSON_PRETTY_PRINT));

        // Validación
        $request->validate([
            'nombres' => 'required|string|max:255',
            'apellidos' => 'required|string|max:255',
            'numero_identificacion' => [
                'required',
                'string',
                Rule::unique('people', 'identification_number')->ignore(
                    DB::table('employees')->where('id', $id)->value('person_id'),
                    'id'
                )
            ],
            'telefono' => 'required|string|max:20',
            'email' => [
                'required',
                'email',
                Rule::unique('people', 'email')->ignore(
                    DB::table('employees')->where('id', $id)->value('person_id'),
                    'id'
                )
            ],
            'cargo' => 'required|string|max:100',
            'fecha_contratacion' => 'required|date',
            'branch_ids' => 'required|array|min:1',
            'branch_ids.*' => 'exists:branches,id',
        ]);

        DB::beginTransaction();
        try {
            $employee = DB::table('employees')->where('id', $id)->first();
            if (!$employee) {
                throw new \Exception('Empleado no encontrado');
            }

            // 1. Actualizar people
            DB::table('people')->where('id', $employee->person_id)->update([
                'first_name' => $data['nombres'],
                'last_name' => $data['apellidos'],
                'identification_number' => $data['numero_identificacion'],
                'identification_type_id' => $data['identification_type_id'] ?? null,
                'identification_place' => $data['lugar_expedicion'] ?? null,
                'birth_date' => $data['fecha_nacimiento'] ?? null,
                'address' => $data['direccion'] ?? null,
                'phone' => $data['telefono'],
                'email' => $data['email'],
                'gender_id' => $data['gender_id'] ?? null,
                'blood_type_id' => $data['blood_type_id'] ?? null,
                'updated_at' => now(),
            ]);

            // 2. Actualizar employee
            DB::table('employees')->where('id', $id)->update([
                'role' => $data['cargo'],
                'hire_date' => $data['fecha_contratacion'],
                'end_date' => $data['fecha_fin'] ?? null,
                'updated_at' => now(),
            ]);

            // 3. Actualizar acceso a sedes
            DB::table('employee_branch_access')->where('employee_id', $id)->delete();
            if (!empty($data['branch_ids'])) {
                foreach ($data['branch_ids'] as $branchId) {
                    DB::table('employee_branch_access')->insert([
                        'employee_id' => $id,
                        'branch_id' => $branchId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Empleado actualizado correctamente']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al actualizar empleado: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['success' => false, 'message' => 'Error al actualizar empleado: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        // Si se envía un array de IDs en el body, hacer eliminación masiva
        if (request()->has('ids') && is_array(request()->input('ids'))) {
            $ids = request()->input('ids');
            
            // Validar que todos los IDs sean números
            foreach ($ids as $employeeId) {
                if (!is_numeric($employeeId)) {
                    return response()->json(['success' => false, 'message' => 'ID inválido: ' . $employeeId], 400);
                }
            }
            
            // Verificar que existan los empleados
            $existingEmployees = DB::table('employees')->whereIn('id', $ids)->count();
            if ($existingEmployees !== count($ids)) {
                return response()->json(['success' => false, 'message' => 'Algunos empleados no fueron encontrados'], 404);
            }
            
            // Desactivar todos los empleados
            DB::table('employees')->whereIn('id', $ids)->update(['is_active' => false, 'updated_at' => now()]);
            
            return response()->json([
                'success' => true, 
                'message' => count($ids) . ' empleado(s) desactivado(s) correctamente'
            ]);
        }
        
        // Eliminación individual (comportamiento original)
        $empleado = DB::table('employees')->where('id', $id)->first();
        if (!$empleado) {
            return response()->json(['success' => false, 'message' => 'Empleado no encontrado'], 404);
        }
        
        DB::table('employees')->where('id', $id)->update(['is_active' => false, 'updated_at' => now()]);
        return response()->json(['success' => true, 'message' => 'Empleado desactivado correctamente']);
    }

    /**
     * Assign branches to an employee
     */
    public function assignBranches(Request $request, $id)
    {
        $request->validate([
            'branch_ids' => 'required|array|min:1',
            'branch_ids.*' => 'exists:branches,id',
        ]);

        DB::beginTransaction();
        try {
            // Verificar que el empleado existe
            $employee = DB::table('employees')->where('id', $id)->first();
            if (!$employee) {
                throw new \Exception('Empleado no encontrado');
            }

            // Eliminar asignaciones actuales
            DB::table('employee_branch_access')->where('employee_id', $id)->delete();

            // Crear nuevas asignaciones
            foreach ($request->branch_ids as $branchId) {
                DB::table('employee_branch_access')->insert([
                    'employee_id' => $id,
                    'branch_id' => $branchId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Sedes asignadas correctamente']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al asignar sedes: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error al asignar sedes'], 500);
        }
    }

    /**
     * Toggle employee status (active/inactive)
     */
    public function toggleStatus($id)
    {
        $employee = DB::table('employees')->where('id', $id)->first();
        if (!$employee) {
            return response()->json(['success' => false, 'message' => 'Empleado no encontrado'], 404);
        }

        $newStatus = !$employee->is_active;
        DB::table('employees')->where('id', $id)->update([
            'is_active' => $newStatus,
            'updated_at' => now()
        ]);

        $message = $newStatus ? 'Empleado activado correctamente' : 'Empleado desactivado correctamente';
        return response()->json(['success' => true, 'message' => $message]);
    }
}
