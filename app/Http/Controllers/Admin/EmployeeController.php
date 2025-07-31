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
        try {
            Log::info("Registrando nuevo empleado");

            $data = $request->all();
            
            // Procesar branch_access si viene como string JSON
            if (isset($data['branch_access']) && is_string($data['branch_access'])) {
                $data['branch_access'] = json_decode($data['branch_access'], true);
            }

            // Procesar campos booleanos que pueden venir como string
            $booleanFields = ['has_emergency_contact'];
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
                'identification_number' => [
                    'required',
                    'string',
                    'max:20',
                    Rule::unique('people', 'identification_number')
                ],
                'identification_type_id' => 'required|exists:identification_types,id',
                'phone' => 'required|string|max:20',
                'email' => 'required|email|max:255', // El email NO es único
                'role' => 'required|string|max:100',
                'hire_date' => 'required|date',
                'branch_access' => 'required|array|min:1',
                'branch_access.*' => 'exists:branches,id',
            ]);

            // VALIDACIÓN ESPECÍFICA: El empleado y el contacto de emergencia no pueden tener la misma identificación
            if (!empty($data['has_emergency_contact']) && $data['has_emergency_contact'] && 
                !empty($data['emergency_contact_identification']) && 
                $data['identification_number'] === $data['emergency_contact_identification']) {
                
                return response()->json([
                    'success' => false, 
                    'message' => 'El empleado y el contacto de emergencia no pueden tener el mismo número de identificación. Por favor, verifique los datos ingresados.'
                ], 422);
            }


            DB::beginTransaction();
            // 1. Verificar si ya existe una persona con ese número de identificación
            $existingPerson = DB::table('people')
                ->where('identification_number', $data['identification_number'])
                ->first();

            $personId = null;
            $employeeId = null;

            if ($existingPerson) {
                // Verificar si esta persona ya es empleado activo
                $existingEmployee = DB::table('employees')
                    ->where('person_id', $existingPerson->id)
                    ->where('is_active', true)
                    ->first();

                if ($existingEmployee) {
                    throw new \Exception('Ya existe un empleado registrado con ese número de identificación.');
                }

                // Verificar si existe un empleado inactivo (soft deleted)
                $inactiveEmployee = DB::table('employees')
                    ->where('person_id', $existingPerson->id)
                    ->where('is_active', false)
                    ->first();

                $personId = $existingPerson->id;
                // Actualizar datos de la persona
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
                    'updated_at' => now(),
                ]);

                if ($inactiveEmployee) {
                    // Reactivar el empleado inactivo y actualizar sus datos
                    DB::table('employees')->where('id', $inactiveEmployee->id)->update([
                        'role' => $data['role'],
                        'hire_date' => $data['hire_date'],
                        'salary' => $data['salary'] ?? null,
                        'job_description' => $data['job_description'] ?? null,
                        'end_date' => $data['end_date'] ?? null,
                        'is_active' => true,
                        'updated_at' => now(),
                    ]);
                    $employeeId = $inactiveEmployee->id;
                } else {
                    // La persona existe pero no es empleado, crear nuevo registro de empleado
                    $employeeId = DB::table('employees')->insertGetId([
                        'person_id' => $personId,
                        'user_id' => null, // Los usuarios se crean mediante invitaciones
                        'role' => $data['role'],
                        'hire_date' => $data['hire_date'],
                        'salary' => $data['salary'] ?? null,
                        'job_description' => $data['job_description'] ?? null,
                        'end_date' => $data['end_date'] ?? null,
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
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
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $employeeId = DB::table('employees')->insertGetId([
                    'person_id' => $personId,
                    'user_id' => null, // Los usuarios se crean mediante invitaciones
                    'role' => $data['role'],
                    'hire_date' => $data['hire_date'],
                    'salary' => $data['salary'] ?? null,
                    'job_description' => $data['job_description'] ?? null,
                    'end_date' => $data['end_date'] ?? null,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

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
                
                // Verificar si ya existe una persona con esa identificación
                $existingEmergencyContact = null;
                
                // Buscar SOLO por identificación (único confiable)
                if (!empty($data['emergency_contact_identification'])) {
                    $existingEmergencyContact = DB::table('people')
                        ->where('identification_number', $data['emergency_contact_identification'])
                        ->first();
                }

                if ($existingEmergencyContact) {
                    // VALIDACIÓN CRÍTICA: El contacto de emergencia NO puede ser la misma persona que el empleado
                    if ($existingEmergencyContact->id === $personId) {
                        Log::warning('Intento de asignar al empleado como su propio contacto de emergencia', [
                            'employee_person_id' => $personId,
                            'emergency_contact_person_id' => $existingEmergencyContact->id,
                            'employee_identification' => $data['identification_number'],
                            'emergency_contact_identification' => $data['emergency_contact_identification'],
                        ]);
                        throw new \Exception('El empleado no puede ser su propio contacto de emergencia. Verifique el número de identificación.');
                    }
                    
                    // Usar la persona existente como contacto de emergencia y actualizar sus datos
                    $emergencyContactId = $existingEmergencyContact->id;
                    
                    // Actualizar TODOS los datos de la persona existente con la información del formulario
                    DB::table('people')->where('id', $emergencyContactId)->update([
                        'first_name' => $data['emergency_contact_name'],
                        'last_name' => $data['emergency_contact_last_name'] ?? '',
                        'identification_type_id' => $data['emergency_contact_identification_type_id'] ?? 1,
                        'phone' => $data['emergency_contact_phone'] ?? DB::raw('phone'),
                        'email' => $data['emergency_contact_email'] ?? DB::raw('email'),
                        'updated_at' => now(),
                    ]);
                } else {
                    // Crear nueva persona para el contacto de emergencia
                    $emergencyContactId = DB::table('people')->insertGetId([
                        'first_name' => $data['emergency_contact_name'],
                        'last_name' => $data['emergency_contact_last_name'] ?? '',
                        'identification_number' => $data['emergency_contact_identification'] ?? 'TEMP_' . $personId . '_' . time(),
                        'identification_type_id' => $data['emergency_contact_identification_type_id'] ?? 1, // Por defecto CC
                        'phone' => $data['emergency_contact_phone'] ?? null,
                        'email' => $data['emergency_contact_email'] ?? null,
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
        // Consulta principal del empleado con todos sus datos relacionados
        $empleado = DB::table('employees as e')
            ->join('people as p', 'e.person_id', '=', 'p.id')
            ->leftJoin('users as u', 'e.user_id', '=', 'u.id')
            ->leftJoin('identification_types as it', 'p.identification_type_id', '=', 'it.id')
            ->leftJoin('genders as g', 'p.gender_id', '=', 'g.id')
            ->leftJoin('blood_types as bt', 'p.blood_type_id', '=', 'bt.id')
            ->where('e.id', $id)
            ->where('e.is_active', true)
            ->select([
                // Datos del empleado
                'e.id',
                'e.role as position',
                'e.hire_date',
                'e.end_date',
                'e.salary',
                'e.job_description',
                'e.is_active',
                'e.created_at as employee_created_at',
                'e.updated_at as employee_updated_at',
                
                // Datos de la persona
                'p.first_name',
                'p.last_name',
                'p.identification_number as identification',
                'p.identification_place',
                'p.birth_date',
                'p.address',
                'p.phone',
                'p.email',
                'p.photo',
                'p.created_at as person_created_at',
                
                // Datos relacionados
                'u.email as email_usuario',
                'it.name as tipo_identificacion',
                'g.name as genero',
                'bt.name as tipo_sangre'
            ])
            ->first();

        if (!$empleado) {
            return response()->json(['success' => false, 'message' => 'Empleado no encontrado'], 404);
        }

        // Obtener sedes asignadas al empleado
        $sedes = DB::table('employee_branch_access as eba')
            ->join('branches as b', 'eba.branch_id', '=', 'b.id')
            ->where('eba.employee_id', $id)
            ->select('b.id', 'b.name', 'b.address', 'b.phone', 'b.email')
            ->get();

        // Obtener contactos de emergencia del empleado
        $contactosEmergencia = DB::table('employee_emergency_contacts as eec')
            ->join('people as p_contact', 'eec.person_id', '=', 'p_contact.id')
            ->leftJoin('relationships as r', 'eec.relationship_id', '=', 'r.id')
            ->leftJoin('identification_types as it_contact', 'p_contact.identification_type_id', '=', 'it_contact.id')
            ->where('eec.employee_id', $id)
            ->where('eec.is_active', true)
            ->select([
                'eec.id as emergency_contact_id',
                'p_contact.first_name as emergency_contact_name',
                'p_contact.last_name as emergency_contact_last_name',
                'p_contact.identification_number as emergency_contact_identification',
                'p_contact.phone as emergency_contact_phone',
                'p_contact.email as emergency_contact_email',
                'r.name as emergency_contact_relationship',
                'it_contact.name as emergency_contact_id_type'
            ])
            ->get();

        // Determinar si tiene contacto de emergencia configurado
        $empleado->has_emergency_contact = $contactosEmergencia->count() > 0;
        
        // Si tiene contacto de emergencia, agregar los datos del primero (principal)
        if ($empleado->has_emergency_contact) {
            $contactoPrincipal = $contactosEmergencia->first();
            $empleado->emergency_contact_name = $contactoPrincipal->emergency_contact_name;
            $empleado->emergency_contact_last_name = $contactoPrincipal->emergency_contact_last_name;
            $empleado->emergency_contact_phone = $contactoPrincipal->emergency_contact_phone;
            $empleado->emergency_contact_email = $contactoPrincipal->emergency_contact_email;
            $empleado->emergency_contact_relationship = $contactoPrincipal->emergency_contact_relationship;
            $empleado->emergency_contact_identification = $contactoPrincipal->emergency_contact_identification;
            $empleado->emergency_contact_id_type = $contactoPrincipal->emergency_contact_id_type;
        }

        // Obtener historial de asistencias recientes (si existe la tabla)
        $asistencias = collect();
        try {
            $asistencias = DB::table('attendance_records')
                ->where('employee_id', $id)
                ->orderBy('check_in', 'desc')
                ->limit(10)
                ->get();
        } catch (\Exception $e) {
            // Si la tabla no existe, usar colección vacía
            Log::info("Tabla attendance_records no encontrada o error al consultar: " . $e->getMessage());
        }

        return Inertia::render('Admin/Employees/Show', [
            'empleado' => $empleado,
            'sedes' => $sedes,
            'contactos_emergencia' => $contactosEmergencia,
            'asistencias' => $asistencias
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        Log::info("Accediendo a la edición del empleado", ['employee_id' => $id]);
        try {
            // 1. Datos principales del empleado y persona
            $empleado = DB::table('employees as e')
                ->join('people as p', 'e.person_id', '=', 'p.id')
                ->where('e.id', $id)
                ->select([
                    'e.id as employee_id',
                    'e.role',
                    'e.hire_date',
                    'e.salary',
                    'e.job_description',
                    'e.end_date',
                    'e.is_active as employee_active',
                    'p.id as person_id',
                    'p.first_name',
                    'p.last_name',
                    'p.identification_number',
                    'p.identification_type_id',
                    'p.identification_place',
                    'p.birth_date',
                    'p.address',
                    'p.phone',
                    'p.email',
                    'p.gender_id',
                    'p.is_active as person_active',
                    'p.email as user_email'
                ])
                ->first();

            if (!$empleado) {
                return response()->json(['success' => false, 'message' => 'Empleado no encontrado'], 404);
            }

            // 2. Sedes asignadas
            $sedesAsignadas = DB::table('employee_branch_access')
                ->where('employee_id', $id)
                ->pluck('branch_id')
                ->toArray();

            // 3. Contacto de emergencia (opcional, solo el principal)
            $contactoEmergencia = DB::table('employee_emergency_contacts as eec')
                ->join('people as p', 'eec.person_id', '=', 'p.id')
                ->leftJoin('relationships as r', 'eec.relationship_id', '=', 'r.id')
                ->where('eec.employee_id', $id)
                ->where('eec.is_active', true)
                ->select([
                    'p.first_name as emergency_contact_name',
                    'p.last_name as emergency_contact_last_name',
                    'p.identification_number as emergency_contact_identification',
                    'p.identification_type_id as emergency_contact_identification_type_id',
                    'p.phone as emergency_contact_phone',
                    'p.email as emergency_contact_email',
                    'r.id as emergency_contact_relationship_id'
                ])
                ->first();

            // 4. Preparar estructura para el front (EmployeeForm)
            $data = [
                'employee_id' => $empleado->employee_id,
                'first_name' => $empleado->first_name,
                'last_name' => $empleado->last_name,
                'identification_number' => $empleado->identification_number,
                'identification_type_id' => $empleado->identification_type_id,
                'identification_place' => $empleado->identification_place,
                'birth_date' => $empleado->birth_date,
                'address' => $empleado->address,
                'phone' => $empleado->phone,
                'email' => $empleado->email,
                'gender_id' => $empleado->gender_id,
                'role' => $empleado->role,
                'hire_date' => $empleado->hire_date,
                'salary' => $empleado->salary,
                'job_description' => $empleado->job_description,
                'end_date' => $empleado->end_date,
                'is_active' => $empleado->employee_active,
                'branch_access' => $sedesAsignadas,
                'has_emergency_contact' => $contactoEmergencia ? true : false,
            ];
            if ($contactoEmergencia) {
                $data = array_merge($data, [
                    'emergency_contact_name' => $contactoEmergencia->emergency_contact_name,
                    'emergency_contact_last_name' => $contactoEmergencia->emergency_contact_last_name,
                    'emergency_contact_identification' => $contactoEmergencia->emergency_contact_identification,
                    'emergency_contact_identification_type_id' => $contactoEmergencia->emergency_contact_identification_type_id,
                    'emergency_contact_phone' => $contactoEmergencia->emergency_contact_phone,
                    'emergency_contact_email' => $contactoEmergencia->emergency_contact_email,
                    'emergency_contact_relationship_id' => $contactoEmergencia->emergency_contact_relationship_id,
                ]);
            }

            return response()->json([
                'empleado' => $data
            ]);
        } catch (\Throwable $th) {
            Log::error('Error en EmployeeController@edit: ' . $th->getMessage(), [
                'exception' => $th,
                'employee_id' => $id
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error inesperado al consultar los datos para editar el empleado.'
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        try {
            Log::info('Actualizando empleado', ['employee_id' => $id]);
            $data = $request->all();

            // Procesar branch_access si viene como string JSON
            if (isset($data['branch_access']) && is_string($data['branch_access'])) {
                $data['branch_access'] = json_decode($data['branch_access'], true);
            }

            // Procesar campos booleanos que pueden venir como string
            $booleanFields = ['has_emergency_contact'];
            foreach ($booleanFields as $field) {
                if (isset($data[$field]) && is_string($data[$field])) {
                    $data[$field] = filter_var($data[$field], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                    if ($data[$field] === null) {
                        $data[$field] = true;
                    }
                }
            }

            // Validación básica con unique rules apropiadas para update
            $request->merge($data);
            
            // Obtener el person_id del empleado para las validaciones unique
            $employee = DB::table('employees')->where('id', $id)->first();
            if (!$employee) {
                throw new \Exception('Empleado no encontrado');
            }
            
            $request->validate([
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'identification_number' => [
                    'required',
                    'string',
                    'max:20',
                    Rule::unique('people', 'identification_number')->ignore($employee->person_id)
                ],
                'identification_type_id' => 'required|exists:identification_types,id',
                'phone' => 'required|string|max:20',
                'email' => 'required|email|max:255', // El email NO es único
                'role' => 'required|string|max:100',
                'hire_date' => 'required|date',
                'branch_access' => 'required|array|min:1',
                'branch_access.*' => 'exists:branches,id',
            ]);

            // VALIDACIÓN ESPECÍFICA: El empleado y el contacto de emergencia no pueden tener la misma identificación
            if (!empty($data['has_emergency_contact']) && $data['has_emergency_contact'] && 
                !empty($data['emergency_contact_identification']) && 
                $data['identification_number'] === $data['emergency_contact_identification']) {
                
                return response()->json([
                    'success' => false, 
                    'message' => 'El empleado y el contacto de emergencia no pueden tener el mismo número de identificación. Por favor, verifique los datos ingresados.'
                ], 422);
            }

            DB::beginTransaction();

            // 1. Actualizar datos de la persona
            $affectedPeople = DB::table('people')->where('id', $employee->person_id)->update([
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
                'updated_at' => now(),
            ]);

            // 2. Actualizar datos del empleado
            $affectedEmployee = DB::table('employees')->where('id', $id)->update([
                'role' => $data['role'],
                'hire_date' => $data['hire_date'],
                'salary' => $data['salary'] ?? null,
                'job_description' => $data['job_description'] ?? null,
                'end_date' => $data['end_date'] ?? null,
                'is_active' => true,
                'updated_at' => now(),
            ]);

            // 3. Actualizar acceso a sedes
            DB::table('employee_branch_access')->where('employee_id', $id)->delete();
            if (!empty($data['branch_access'])) {
                foreach ($data['branch_access'] as $branchId) {
                    DB::table('employee_branch_access')->insert([
                        'employee_id' => $id,
                        'branch_id' => $branchId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            // 4. Actualizar contacto de emergencia
            if (!empty($data['has_emergency_contact']) && $data['has_emergency_contact'] && !empty($data['emergency_contact_name'])) {
                // Obtener el contacto de emergencia actual usando la relación
                $currentEmergencyContact = DB::table('employee_emergency_contacts')
                    ->where('employee_id', $id)
                    ->where('is_active', true)
                    ->first();
                
                $emergencyContactId = null;
                
                if ($currentEmergencyContact) {
                    // VALIDACIÓN CRÍTICA: El contacto de emergencia NO puede ser la misma persona que el empleado
                    if ($currentEmergencyContact->person_id === $employee->person_id) {
                        Log::error('DATOS CORRUPTOS: Contacto de emergencia tiene el mismo person_id que el empleado', [
                            'employee_id' => $id,
                            'employee_person_id' => $employee->person_id,
                            'emergency_contact_person_id' => $currentEmergencyContact->person_id
                        ]);
                        throw new \Exception('Error crítico: datos corruptos detectados. El contacto de emergencia no puede ser la misma persona que el empleado.');
                    }
                    
                    // Verificar si se quiere cambiar a una persona diferente usando la identificación
                    $targetPersonId = null;
                    if (!empty($data['emergency_contact_identification'])) {
                        $personWithTargetId = DB::table('people')
                            ->where('identification_number', $data['emergency_contact_identification'])
                            ->first();
                        
                        if ($personWithTargetId) {
                            // VALIDACIÓN: No puede ser el mismo empleado
                            if ($personWithTargetId->id === $employee->person_id) {
                                throw new \Exception('El empleado no puede ser su propio contacto de emergencia. Verifique el número de identificación.');
                            }
                            $targetPersonId = $personWithTargetId->id;
                        }
                    }
                    
                    if ($targetPersonId && $targetPersonId !== $currentEmergencyContact->person_id) {
                        // Cambiar a una persona existente diferente
                        DB::table('employee_emergency_contacts')->where('id', $currentEmergencyContact->id)->update([
                            'person_id' => $targetPersonId,
                            'relationship_id' => $data['emergency_contact_relationship_id'] ?? null,
                            'updated_at' => now(),
                        ]);
                        
                        // Actualizar TODOS los datos de la persona existente con la información del formulario
                        DB::table('people')->where('id', $targetPersonId)->update([
                            'first_name' => $data['emergency_contact_name'],
                            'last_name' => $data['emergency_contact_last_name'] ?? '',
                            'identification_type_id' => $data['emergency_contact_identification_type_id'] ?? 1,
                            'phone' => $data['emergency_contact_phone'] ?? DB::raw('phone'),
                            'email' => $data['emergency_contact_email'] ?? DB::raw('email'),
                            'updated_at' => now(),
                        ]);
                    } elseif (!$targetPersonId) {
                        // No se encontró persona con esa identificación, crear nueva
                        $newPersonId = DB::table('people')->insertGetId([
                            'first_name' => $data['emergency_contact_name'],
                            'last_name' => $data['emergency_contact_last_name'] ?? '',
                            'identification_number' => $data['emergency_contact_identification'] ?? ('EC_NEW_' . $employee->person_id . '_' . time()),
                            'identification_type_id' => $data['emergency_contact_identification_type_id'] ?? 1,
                            'phone' => $data['emergency_contact_phone'] ?? null,
                            'email' => $data['emergency_contact_email'] ?? null,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        
                        // Actualizar la relación para usar la nueva persona
                        DB::table('employee_emergency_contacts')->where('id', $currentEmergencyContact->id)->update([
                            'person_id' => $newPersonId,
                            'relationship_id' => $data['emergency_contact_relationship_id'] ?? null,
                            'updated_at' => now(),
                        ]);
                    } else {
                        // Mantener la misma persona, solo actualizar sus datos
                        DB::table('people')->where('id', $currentEmergencyContact->person_id)->update([
                            'first_name' => $data['emergency_contact_name'],
                            'last_name' => $data['emergency_contact_last_name'] ?? '',
                            'identification_type_id' => $data['emergency_contact_identification_type_id'] ?? 1,
                            'phone' => $data['emergency_contact_phone'] ?? null,
                            'email' => $data['emergency_contact_email'] ?? null,
                            'updated_at' => now(),
                        ]);
                        
                        // Actualizar la relación
                        DB::table('employee_emergency_contacts')->where('id', $currentEmergencyContact->id)->update([
                            'relationship_id' => $data['emergency_contact_relationship_id'] ?? null,
                            'updated_at' => now(),
                        ]);
                    }
                } else {
                    // No existe contacto de emergencia actual, verificar si quiere usar una persona existente
                    $existingEmergencyContact = null;
                    
                    // Buscar SOLO por identificación (único confiable)
                    if (!empty($data['emergency_contact_identification'])) {
                        $existingEmergencyContact = DB::table('people')
                            ->where('identification_number', $data['emergency_contact_identification'])
                            ->first();
                    }
                    
                    if ($existingEmergencyContact) {
                        // VALIDACIÓN CRÍTICA: El contacto de emergencia NO puede ser la misma persona que el empleado
                        if ($existingEmergencyContact->id === $employee->person_id) {
                            Log::warning('Intento de asignar al empleado como su propio contacto de emergencia en update', [
                                'employee_id' => $id,
                                'employee_person_id' => $employee->person_id,
                                'emergency_contact_person_id' => $existingEmergencyContact->id,
                                'employee_identification' => $data['identification_number'],
                                'emergency_contact_identification' => $data['emergency_contact_identification']
                            ]);
                            throw new \Exception('El empleado no puede ser su propio contacto de emergencia. Verifique el número de identificación.');
                        }
                        
                        // Usar la persona existente como contacto de emergencia y actualizar sus datos
                        $emergencyContactId = $existingEmergencyContact->id;
                        
                        // Actualizar TODOS los datos de la persona existente con la información del formulario
                        DB::table('people')->where('id', $emergencyContactId)->update([
                            'first_name' => $data['emergency_contact_name'],
                            'last_name' => $data['emergency_contact_last_name'] ?? '',
                            'identification_type_id' => $data['emergency_contact_identification_type_id'] ?? 1,
                            'phone' => $data['emergency_contact_phone'] ?? DB::raw('phone'),
                            'email' => $data['emergency_contact_email'] ?? DB::raw('email'),
                            'updated_at' => now(),
                        ]);
                    } else {
                        // Crear nueva persona para el contacto de emergencia
                        $emergencyContactId = DB::table('people')->insertGetId([
                            'first_name' => $data['emergency_contact_name'],
                            'last_name' => $data['emergency_contact_last_name'] ?? '',
                            'identification_number' => $data['emergency_contact_identification'] ?? ('EC_NEW_' . $employee->person_id . '_' . time()),
                            'identification_type_id' => $data['emergency_contact_identification_type_id'] ?? 1,
                            'phone' => $data['emergency_contact_phone'] ?? null,
                            'email' => $data['emergency_contact_email'] ?? null,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                    
                    // Crear nueva relación
                    DB::table('employee_emergency_contacts')->insert([
                        'employee_id' => $id,
                        'person_id' => $emergencyContactId,
                        'relationship_id' => $data['emergency_contact_relationship_id'] ?? null,
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            } else {
                // No hay contacto de emergencia, eliminar relaciones existentes
                DB::table('employee_emergency_contacts')->where('employee_id', $id)->delete();
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Empleado actualizado correctamente']);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Error en update empleado: ' . $e->getMessage(), [
                'exception' => $e,
                'id' => $id,
            ]);
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