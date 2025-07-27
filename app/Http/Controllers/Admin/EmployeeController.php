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
                'e.is_active',
                'u.email as email_usuario',
                'e.created_at as fecha_creacion'
            ])
            ->orderBy('e.created_at', 'desc')
            ->get()
            ->map(function($empleado) {
                return [
                    'id' => $empleado->id,
                    'nombre' => $empleado->nombre,
                    'cargo' => $empleado->cargo,
                    'identificacion' => $empleado->identificacion,
                    'telefono' => $empleado->telefono,
                    'email' => $empleado->email,
                    'fecha_contratacion' => $empleado->fecha_contratacion ? date('Y-m-d', strtotime($empleado->fecha_contratacion)) : 'N/A',
                    'tiene_usuario' => !empty($empleado->email_usuario),
                    'email_usuario' => $empleado->email_usuario
                ];
            })
            ->toArray();
        
        // Si es una petición AJAX para recargar datos, devolver JSON
        if (request()->ajax() && request()->header('X-Requested-With') === 'XMLHttpRequest' && request()->header('Content-Type') === 'application/json') {
            return response()->json([
                'empleados' => $empleados,
                'timestamp' => now()->toISOString()
            ]);
        }
        
        return Inertia::render('Admin/Employees/Index', [
            'empleados' => $empleados
        ]);
    }

    /**
     * Get catalogs for employee form
     */
    public function catalogs(Request $request)
    {
        $branchId = $request->query('branch_id');
        
        try {
            $catalogs = [
                'identification_types' => DB::table('identification_types')
                    ->where('is_active', true)
                    ->select('id', 'name as nombre')
                    ->get(),
                    
                'genders' => DB::table('genders')
                    ->where('is_active', true)
                    ->select('id', 'name as nombre')
                    ->get(),
                    
                'relationships' => DB::table('relationships')
                    ->where('is_active', true)
                    ->select('id', 'name as nombre')
                    ->get(),
                    
                'branches' => DB::table('branches')
                    ->where('is_active', true)
                    ->select('id', 'name as nombre')
                    ->get()
            ];
            
            return response()->json($catalogs);
            
        } catch (\Exception $e) {
            Log::error('Error obteniendo catálogos de empleados: ' . $e->getMessage());
            return response()->json(['error' => 'Error interno del servidor'], 500);
        }
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
        
        // Procesar branch_access si viene como string JSON
        if (isset($data['branch_access']) && is_string($data['branch_access'])) {
            $data['branch_access'] = json_decode($data['branch_access'], true);
        }

        // Procesar campos booleanos que pueden venir como string
        $booleanFields = ['is_active', 'has_emergency_contact'];
        foreach ($booleanFields as $field) {
            if (isset($data[$field]) && is_string($data[$field])) {
                // Convertir string a booleano
                $data[$field] = filter_var($data[$field], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                // Si no es un booleano válido, usar true por defecto
                if ($data[$field] === null) {
                    $data[$field] = true;
                }
            }
        }

        // Validación básica
        $request->merge($data); // Actualizar la request con los datos procesados
        $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'identification_number' => 'required|string|max:20',
            'identification_type_id' => 'required|exists:identification_types,id',
            'phone' => 'required|string|max:20',
            'email' => 'required|email|max:255',
            'role' => 'required|string|max:100',
            'hire_date' => 'required|date',
            'branch_access' => 'required|array|min:1',
            'branch_access.*' => 'exists:branches,id',
        ]);

        DB::beginTransaction();
        try {
            // 1. Verificar si ya existe una persona con esos datos únicos
            $existingPerson = DB::table('people')
                ->where('identification_number', $data['identification_number'])
                ->orWhere('email', $data['email'])
                ->first();

            $personId = null;

            if ($existingPerson) {
                // Verificar si esta persona ya es empleado
                $existingEmployee = DB::table('employees')
                    ->where('person_id', $existingPerson->id)
                    ->where('is_active', true)
                    ->first();

                if ($existingEmployee) {
                    throw new \Exception('Ya existe un empleado registrado con ese número de identificación o email.');
                }

                // La persona existe pero no es empleado, usar esa persona
                $personId = $existingPerson->id;
                DB::table('people')->where('id', $personId)->update([
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'identification_type_id' => $data['identification_type_id'],
                    'identification_place' => $data['identification_place'] ?? null,
                    'birth_date' => $data['birth_date'] ?? null,
                    'address' => $data['address'] ?? null,
                    'phone' => $data['phone'],
                    'email' => $data['email'],
                    'gender_id' => $data['gender_id'] ?? null,
                    'is_active' => true,
                    'updated_at' => now(),
                ]);
            } else {
                // No existe la persona, crear una nueva
                $personId = DB::table('people')->insertGetId([
                    'first_name' => $data['first_name'],
                    'last_name' => $data['last_name'],
                    'identification_number' => $data['identification_number'],
                    'identification_type_id' => $data['identification_type_id'],
                    'identification_place' => $data['identification_place'] ?? null,
                    'birth_date' => $data['birth_date'] ?? null,
                    'address' => $data['address'] ?? null,
                    'phone' => $data['phone'],
                    'email' => $data['email'],
                    'gender_id' => $data['gender_id'] ?? null,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 2. Insertar en employees (sin crear usuario del sistema - se maneja con invitaciones)
            $employeeId = DB::table('employees')->insertGetId([
                'person_id' => $personId,
                'user_id' => null, // Los usuarios se crean mediante invitaciones
                'role' => $data['role'],
                'hire_date' => $data['hire_date'],
                'salary' => $data['salary'] ?? null,
                'job_description' => $data['job_description'] ?? null,
                'end_date' => $data['end_date'] ?? null,
                'is_active' => $data['is_active'] ?? true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 3. Asignar acceso a sedes
            if (!empty($data['branch_access'])) {
                foreach ($data['branch_access'] as $branchId) {
                    DB::table('employee_branch_access')->insert([
                        'employee_id' => $employeeId,
                        'branch_id' => $branchId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            // 4. Manejar contacto de emergencia si existe y está habilitado
            if (!empty($data['has_emergency_contact']) && $data['has_emergency_contact'] && !empty($data['emergency_contact_name'])) {
                $emergencyContactId = null;
                
                // Verificar si ya existe una persona con esa identificación o email
                $existingEmergencyContact = null;
                
                // Buscar por identificación si se proporciona
                if (!empty($data['emergency_contact_identification'])) {
                    $existingEmergencyContact = DB::table('people')
                        ->where('identification_number', $data['emergency_contact_identification'])
                        ->first();
                }
                
                // Si no se encontró por identificación, buscar por email
                if (!$existingEmergencyContact && !empty($data['emergency_contact_email'])) {
                    $existingEmergencyContact = DB::table('people')
                        ->where('email', $data['emergency_contact_email'])
                        ->first();
                }

                if ($existingEmergencyContact) {
                    // Usar la persona existente
                    $emergencyContactId = $existingEmergencyContact->id;
                } else {
                    // Crear nueva persona para el contacto de emergencia
                    $emergencyContactId = DB::table('people')->insertGetId([
                        'first_name' => $data['emergency_contact_name'],
                        'last_name' => $data['emergency_contact_last_name'] ?? '',
                        'identification_number' => $data['emergency_contact_identification'] ?? 'TEMP_' . $personId . '_' . time(),
                        'identification_type_id' => $data['emergency_contact_identification_type_id'] ?? 1, // Por defecto CC
                        'phone' => $data['emergency_contact_phone'] ?? null,
                        'email' => $data['emergency_contact_email'] ?? null,
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                // Crear relación de contacto de emergencia
                DB::table('employee_emergency_contacts')->insert([
                    'employee_id' => $employeeId,
                    'person_id' => $emergencyContactId,
                    'relationship_id' => $data['emergency_contact_relationship_id'] ?? null,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                
            } else {
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
            ->where('e.id', $id)
            ->select([
                'e.*',
                'p.*',
                'u.email as email_usuario',
                'it.name as tipo_identificacion',
                'g.name as genero'
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
     * Maneja tanto eliminación individual como masiva usando soft delete (desactivación)
     */
    public function destroy($id)
    {
        try {
            // Si se envía un array de IDs en el body, hacer eliminación masiva
            if (request()->has('ids') && is_array(request()->input('ids'))) {
                $ids = request()->input('ids');
                
                // Validar que todos los IDs sean números válidos
                foreach ($ids as $employeeId) {
                    if (!is_numeric($employeeId) || $employeeId <= 0) {
                        return response()->json([
                            'success' => false, 
                            'message' => 'ID inválido: ' . $employeeId
                        ], 400);
                    }
                }
                
                // Verificar que todos los empleados existan y estén activos
                $existingEmployees = DB::table('employees')
                    ->whereIn('id', $ids)
                    ->where('is_active', true)
                    ->count();
                    
                if ($existingEmployees === 0) {
                    return response()->json([
                        'success' => false, 
                        'message' => 'No se encontraron empleados activos para eliminar'
                    ], 404);
                }
                
                // Desactivar todos los empleados (soft delete)
                $updatedCount = DB::table('employees')
                    ->whereIn('id', $ids)
                    ->where('is_active', true)
                    ->update([
                        'is_active' => false, 
                        'updated_at' => now()
                    ]);
                
                return response()->json([
                    'success' => true,
                    'message' => $updatedCount . ' empleado(s) eliminado(s) correctamente'
                ]);
            }
            
            // Eliminación individual - usar el ID de la URL
            $empleado = DB::table('employees')
                ->where('id', $id)
                ->where('is_active', true)
                ->first();
                
            if (!$empleado) {
                return response()->json([
                    'success' => false,
                    'message' => 'Empleado no encontrado o ya está inactivo'
                ], 404);
            }
            
            // Desactivar el empleado (soft delete)
            DB::table('employees')
                ->where('id', $id)
                ->update([
                    'is_active' => false,
                    'updated_at' => now()
                ]);
                
            return response()->json([
                'success' => true,
                'message' => 'Empleado eliminado correctamente'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error al eliminar empleado(s): ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error interno del servidor'
            ], 500);
        }
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