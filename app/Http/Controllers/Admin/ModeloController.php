<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ModeloController extends \App\Http\Controllers\Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $inicio = microtime(true);
        
        Log::info('Accediendo a la lista de modelos');
        Log::debug('Parámetros de la petición:', request()->all());
        
        // Obtener branch_id del request o usar null si no se proporciona
        $branchId = $request->query('branch_id');
        
        $modelos = DB::table('models as m')
            ->join('people as p', 'm.person_id', '=', 'p.id')
            ->leftJoin('model_profiles as mp', 'm.id', '=', 'mp.model_id')
            ->leftJoin('subscriptions as s', function($join) use ($branchId) {
                $join->on('m.id', '=', 's.model_id');
                
                if ($branchId) {
                    // Si hay branch_id, filtrar suscripciones por sede específica
                    $join->join('branch_subscription_plans as bsp', 's.branch_subscription_plan_id', '=', 'bsp.id')
                         ->where('bsp.branch_id', '=', $branchId);
                }
                
                // Obtener la suscripción más reciente de la sede (si se especifica) o general
                $join->whereRaw('s.id = (
                    SELECT MAX(s2.id) 
                    FROM subscriptions s2 
                    ' . ($branchId ? 
                        'JOIN branch_subscription_plans bsp2 ON s2.branch_subscription_plan_id = bsp2.id 
                         WHERE s2.model_id = m.id AND bsp2.branch_id = ' . $branchId :
                        'WHERE s2.model_id = m.id'
                    ) . '
                )');
            })
            ->where('m.is_active', true)
            ->where('p.is_active', true)
            ->select([
                'm.id',
                // Nombre completo
                DB::raw("CONCAT(p.first_name, ' ', p.last_name) as nombre_completo"),
                // Número de identificación
                'p.identification_number as numero_identificacion',
                // Medidas corporales concatenadas (pecho/cintura/cadera)
                DB::raw("CASE 
                    WHEN mp.bust IS NOT NULL AND mp.waist IS NOT NULL AND mp.hips IS NOT NULL 
                    THEN CONCAT(mp.bust, '/', mp.waist, '/', mp.hips)
                    ELSE 'No registradas'
                END as medidas_corporales"),
                // Fecha del último registro de suscripción
                's.created_at as fecha_ultima_suscripcion',
                // Estado de la suscripción para la sede seleccionada
                DB::raw("CASE 
                    WHEN s.status IS NULL THEN 'Sin suscripción'
                    WHEN s.status = 'active' AND s.end_date >= CURDATE() THEN 'Activo'
                    WHEN s.status = 'active' AND s.end_date < CURDATE() THEN 'Vencido'
                    WHEN s.status = 'inactive' THEN 'Inactivo'
                    ELSE s.status
                END as estado_suscripcion"),
                // Campos adicionales para compatibilidad
                'm.created_at as fecha_creacion'
            ])
            ->orderBy('m.created_at', 'desc')
            ->get()
            ->map(function($modelo) {
                return [
                    'id' => $modelo->id,
                    'nombre_completo' => $modelo->nombre_completo,
                    'numero_identificacion' => $modelo->numero_identificacion,
                    'medidas_corporales' => $modelo->medidas_corporales,
                    'fecha_ultima_suscripcion' => $modelo->fecha_ultima_suscripcion ? date('Y-m-d', strtotime($modelo->fecha_ultima_suscripcion)) : 'N/A',
                    'estado_suscripcion' => $modelo->estado_suscripcion,
                    'fecha_creacion' => $modelo->fecha_creacion ? date('Y-m-d', strtotime($modelo->fecha_creacion)) : 'N/A',
                ];
            })
            ->toArray();
        
        $totalModelos = count($modelos);
        
        // Cálculo de tiempo de ejecución
        $tiempoEjecucion = microtime(true) - $inicio;
        
        // Si es una petición AJAX/fetch específica para recargar datos, devolver JSON
        if (request()->ajax() && request()->header('X-Requested-With') === 'XMLHttpRequest' && request()->header('Content-Type') === 'application/json') {
            return response()->json([
                'modelos' => $modelos,
                'timestamp' => now()->toISOString()
            ]);
        }
        
        // Si no, devolver la vista Inertia normal
        return Inertia::render('Modelos/Index', [
            'modelos' => $modelos,
            'debug_info' => [
                'total_modelos' => $totalModelos,
                'branch_id' => $branchId,
                'timestamp' => now()->toISOString(),
                'tiempo_ejecucion' => round($tiempoEjecucion * 1000, 2) . 'ms'
            ]
        ]);
    }

    public function catalogs(Request $request)
    {
        $branchId = $request->query('branch_id');
        $plans = [];
        if ($branchId) {
            $plansRaw = DB::table('branch_subscription_plans as bsp')
                ->join('subscription_plans as sp', 'bsp.subscription_plan_id', '=', 'sp.id')
                ->where('bsp.branch_id', $branchId)
                ->where('bsp.is_active', true)
                ->where('sp.is_active', true)
                ->orderBy('sp.name')
                ->select('bsp.id', 'sp.name', 'sp.description', DB::raw('COALESCE(bsp.custom_price, sp.price) as price'), 'sp.duration_months')
                ->get();
            
            // Formatear los planes con precio en pesos colombianos
            $plans = $plansRaw->map(function($plan) {
                $precioFormateado = '$' . number_format($plan->price, 0, ',', '.') . ' COP';
                return [
                    'id' => $plan->id,
                    'name' => $plan->name . ' - ' . $precioFormateado,
                    'description' => $plan->description,
                    'price' => $plan->price,
                    'duration_months' => $plan->duration_months
                ];
            });
        }
        return response()->json([
            'identification_types' => DB::table('identification_types')->select('id', 'name')->where('is_active', true)->orderBy('name')->get(),
            'genders' => DB::table('genders')->select('id', 'name')->where('is_active', true)->orderBy('name')->get(),
            'blood_types' => DB::table('blood_types')->select('id', 'name')->where('is_active', true)->orderBy('name')->get(),
            'payment_methods' => DB::table('payment_methods')->select('id', 'name')->where('is_active', true)->orderBy('name')->get(),
            'hair_colors' => DB::table('hair_colors')->select('id', 'name')->where('is_active', true)->orderBy('name')->get(),
            'eye_colors' => DB::table('eye_colors')->select('id', 'name')->where('is_active', true)->orderBy('name')->get(),
            'skin_colors' => DB::table('skin_colors')->select('id', 'name')->where('is_active', true)->orderBy('name')->get(),
            'relationships' => DB::table('relationships')->select('id', 'name')->where('is_active', true)->orderBy('name')->get(),
            'subscription_plans' => $plans,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $data = $request->all();
        // Log del objeto completo en JSON
        Log::info('=== DATOS DEL FORMULARIO DE MODELO ===');
        Log::info('Objeto completo: ' . json_encode($data, JSON_PRETTY_PRINT));
        Log::info('=== FIN DATOS FORMULARIO ===');

        Log::info('=== INICIANDO VALIDACIONES ===');
        
        // PRIMERA VALIDACIÓN: Verificar si la persona ya existe
        $existingPerson = DB::table('people')->where('identification_number', $data['numero_identificacion'])->first();
        
        if ($existingPerson) {
            // Verificar si esta persona ya es modelo activo
            $existingActiveModel = DB::table('models')
                ->where('person_id', $existingPerson->id)
                ->where('is_active', true)
                ->first();

            if ($existingActiveModel) {
                return response()->json([
                    'success' => false,
                    'message' => "Ya existe un modelo registrado con el número de identificación: {$data['numero_identificacion']}. Por favor verifique los datos."
                ], 422);
            }

            // Verificar si existe un modelo inactivo (soft deleted)
            $inactiveModel = DB::table('models')
                ->where('person_id', $existingPerson->id)
                ->where('is_active', false)
                ->first();
        }
        
        $validationRules = [
            'nombres' => 'required|string|max:255',
            'apellidos' => 'required|string|max:255',
            'identification_type_id' => 'required|exists:identification_types,id',
            'lugar_expedicion' => 'nullable|string|max:255',
            'fecha_nacimiento' => 'nullable|date|before:today',
            'direccion' => 'nullable|string|max:500',
            'telefono' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'gender_id' => 'nullable|exists:genders,id',
            'blood_type_id' => 'nullable|exists:blood_types,id',
            
            // Validaciones de perfil físico
            'estatura' => 'nullable|numeric|min:0.5|max:3.0',
            'busto' => 'nullable|integer|min:50|max:200',
            'cintura' => 'nullable|integer|min:40|max:150',
            'cadera' => 'nullable|integer|min:60|max:200',
            'cabello' => 'nullable|exists:hair_colors,id',
            'ojos' => 'nullable|exists:eye_colors,id',
            'piel' => 'nullable|exists:skin_colors,id',
            'pantalon' => 'nullable|string|max:20',
            'camisa' => 'nullable|string|max:20',
            'calzado' => 'nullable|string|max:20',
            
            // Validaciones de acudiente
            'acudiente_nombres' => 'required|string|max:255',
            'acudiente_apellidos' => 'required|string|max:255',
            'acudiente_identificacion' => 'required|string|max:20',
            'acudiente_tipo_identificacion' => 'required|exists:identification_types,id',
            'acudiente_lugar_expedicion' => 'required|string|max:255',
            'acudiente_parentesco' => 'required|exists:relationships,id',
            'acudiente_telefono' => 'required|string|max:20',
            'acudiente_email' => 'nullable|email|max:255',
            'acudiente_direccion' => 'required|string|max:500',
        ];

        // Solo agregar la validación unique si la persona NO existe
        if (!$existingPerson) {
            // Si la persona no existe, necesitamos crearla, por lo que aplicamos unique
            $validationRules['numero_identificacion'] = [
                'required',
                'string',
                'max:20',
                Rule::unique('people', 'identification_number')
            ];
        } else {
            // Si la persona existe, simplemente la actualizaremos, NO aplicamos unique
            $validationRules['numero_identificacion'] = 'required|string|max:20';
        }

        // VALIDACIONES BÁSICAS
        $request->validate($validationRules);

        Log::info('=== VALIDACIONES BÁSICAS PASADAS ===');

        // VERIFICACIÓN MANUAL PARA DEBUG
        $peopleWithSameId = DB::table('people')->where('identification_number', $data['numero_identificacion'])->get();
        Log::info('=== PERSONAS CON ESTA IDENTIFICACIÓN ===');
        Log::info('Cantidad: ' . $peopleWithSameId->count());
        Log::info('Datos: ' . json_encode($peopleWithSameId, JSON_PRETTY_PRINT));
        Log::info('=== FIN VERIFICACIÓN MANUAL ===');

        // VALIDACIÓN ESPECÍFICA: El modelo y el acudiente no pueden tener la misma identificación
        if ($data['numero_identificacion'] === $data['acudiente_identificacion']) {
            return response()->json([
                'success' => false, 
                'message' => 'El modelo y el acudiente no pueden tener el mismo número de identificación. Por favor, verifique los datos ingresados.'
            ], 422);
        }

        // VALIDACIÓN ADICIONAL: Verificar que el acudiente no es el mismo modelo (validación de autoreferencia)
        // NOTA: Removemos la validación que impedía que un acudiente fuera modelo, 
        // ya que una persona SÍ puede ser modelo y acudiente de otros modelos
        // Solo impedimos que un modelo sea su propio acudiente (lo cual ya validamos arriba)

        $imagesMeta = json_decode($request->input('model_images_meta'), true) ?? [];

        DB::beginTransaction();
        try {
            // 1. MANEJO DE LA PERSONA DEL MODELO (Aplicando lógica de soft delete como en empleados)
            if ($existingPerson) {
                // La persona ya existe, actualizar sus datos y usar su ID
                $personId = $existingPerson->id;
                DB::table('people')->where('id', $personId)->update([
                    'first_name' => $data['nombres'],
                    'last_name' => $data['apellidos'],
                    'identification_type_id' => $data['identification_type_id'],
                    'identification_place' => $data['lugar_expedicion'],
                    'birth_date' => $data['fecha_nacimiento'],
                    'address' => $data['direccion'],
                    'phone' => $data['telefono'],
                    'email' => $data['email'],
                    'gender_id' => $data['gender_id'],
                    'blood_type_id' => $data['blood_type_id'],
                    'is_active' => true,
                    'updated_at' => now(),
                ]);
                Log::info('Persona existente actualizada para convertir en modelo', ['person_id' => $personId]);

                if ($inactiveModel) {
                    // Reactivar el modelo inactivo y actualizar sus datos en el perfil
                    DB::table('models')->where('id', $inactiveModel->id)->update([
                        'is_active' => true,
                        'updated_at' => now(),
                    ]);
                    $modelId = $inactiveModel->id;
                    Log::info('Modelo inactivo reactivado', ['model_id' => $modelId]);
                    
                    // NO reactivar suscripciones anteriores - deben permanecer inactivas
                    // Las suscripciones desactivadas permanecen así por decisión de negocio
                    Log::info('Las suscripciones anteriores permanecen inactivas por política de negocio', [
                        'model_id' => $modelId
                    ]);
                } else {
                    // La persona existe pero no es modelo, crear nuevo registro de modelo
                    $modelId = DB::table('models')->insertGetId([
                        'person_id' => $personId,
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    Log::info('Nuevo modelo creado para persona existente', ['model_id' => $modelId]);
                }
            } else {
                // Crear nueva persona
                $personId = DB::table('people')->insertGetId([
                    'first_name' => $data['nombres'],
                    'last_name' => $data['apellidos'],
                    'identification_number' => $data['numero_identificacion'],
                    'identification_type_id' => $data['identification_type_id'],
                    'identification_place' => $data['lugar_expedicion'],
                    'birth_date' => $data['fecha_nacimiento'],
                    'address' => $data['direccion'],
                    'phone' => $data['telefono'],
                    'email' => $data['email'],
                    'gender_id' => $data['gender_id'],
                    'blood_type_id' => $data['blood_type_id'],
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                Log::info('Nueva persona creada para modelo', ['person_id' => $personId]);

                // Crear nuevo modelo
                $modelId = DB::table('models')->insertGetId([
                    'person_id' => $personId,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                Log::info('Nuevo modelo creado para nueva persona', ['model_id' => $modelId]);
            }

            // 2. Actualizar o crear perfil del modelo
            DB::table('model_profiles')->updateOrInsert(
                ['model_id' => $modelId],
                [
                    'height' => $data['estatura'],
                    'bust' => $data['busto'],
                    'waist' => $data['cintura'],
                    'hips' => $data['cadera'],
                    'hair_color_id' => $data['cabello'],
                    'eye_color_id' => $data['ojos'],
                    'skin_color_id' => $data['piel'],
                    'pants_size' => $data['pantalon'],
                    'shirt_size' => $data['camisa'],
                    'shoe_size' => $data['calzado'],
                    'updated_at' => now(),
                ]
            );

            // 3. Mover imágenes de temporal a definitivo y registrar en base de datos
            if (!empty($imagesMeta)) {
                // Crear directorio definitivo para las imágenes del modelo
                $definitiveImagePath = 'storage/modelos/' . $modelId;
                $fullDefinitivePath = public_path($definitiveImagePath);
                
                if (!file_exists($fullDefinitivePath)) {
                    mkdir($fullDefinitivePath, 0755, true);
                }

                foreach ($imagesMeta as $img) {
                    // Construir rutas - CORREGIDO: usar public/storage/temp/modelos
                    $tempFilePath = public_path('storage/temp/modelos/' . $img['temp_id']);
                    $definitiveFileName = $img['temp_id']; // Mantener el nombre temporal único
                    $definitiveFilePath = $fullDefinitivePath . '/' . $definitiveFileName;
                    $relativeDefinitivePath = $definitiveImagePath . '/' . $definitiveFileName;

                    // Mover archivo de temporal a definitivo
                    if (file_exists($tempFilePath)) {
                        if (rename($tempFilePath, $definitiveFilePath)) {
                            // Si se movió exitosamente, registrar en base de datos
                            DB::table('model_files')->insert([
                                'model_id' => $modelId,
                                'file_path' => $relativeDefinitivePath, // Ruta definitiva
                                'file_name' => $definitiveFileName,
                                'file_type' => 'imagen', // Tipo por defecto
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        } else {
                            Log::warning("No se pudo mover la imagen temporal: {$tempFilePath}");
                        }
                    } else {
                        Log::warning("Archivo temporal no encontrado: {$tempFilePath}");
                    }
                }
            }

            // 4. Insertar redes sociales
            $socialMediaData = [
                'facebook' => $data['facebook'] ?? null,
                'instagram' => $data['instagram'] ?? null,
                'twitter' => $data['twitter'] ?? null,
                'tiktok' => $data['tiktok'] ?? null,
                'other' => $data['otra_red_social'] ?? null,
            ];

            // Mapeo de nombres de plataformas a IDs
            $platformMapping = [
                'facebook' => 1, // Facebook
                'instagram' => 2, // Instagram
                'twitter' => 3, // Twitter
                'tiktok' => 4, // TikTok
                'other' => 5, // Other
            ];

            foreach ($socialMediaData as $platform => $url) {
                if (!empty($url)) {
                    DB::table('model_social_media')->insert([
                        'model_id' => $modelId,
                        'social_media_platform_id' => $platformMapping[$platform],
                        'url' => $url,
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            // 5. MANEJO DEL ACUDIENTE (Aplicando lógica de soft delete similar)
            $existingGuardianPerson = DB::table('people')->where('identification_number', $data['acudiente_identificacion'])->first();
            
            if ($existingGuardianPerson) {
                // La persona del acudiente ya existe, actualizar sus datos y usar su ID
                $guardianPersonId = $existingGuardianPerson->id;
                DB::table('people')->where('id', $guardianPersonId)->update([
                    'first_name' => $data['acudiente_nombres'],
                    'last_name' => $data['acudiente_apellidos'],
                    'identification_type_id' => $data['acudiente_tipo_identificacion'],
                    'identification_place' => $data['acudiente_lugar_expedicion'],
                    'address' => $data['acudiente_direccion'],
                    'phone' => $data['acudiente_telefono'],
                    'email' => $data['acudiente_email'],
                    'is_active' => true,
                    'updated_at' => now(),
                ]);
                Log::info('Persona del acudiente existente actualizada', ['guardian_person_id' => $guardianPersonId]);
            } else {
                // Crear nueva persona para el acudiente
                $guardianPersonId = DB::table('people')->insertGetId([
                    'first_name' => $data['acudiente_nombres'],
                    'last_name' => $data['acudiente_apellidos'],
                    'identification_number' => $data['acudiente_identificacion'],
                    'identification_type_id' => $data['acudiente_tipo_identificacion'],
                    'identification_place' => $data['acudiente_lugar_expedicion'],
                    'address' => $data['acudiente_direccion'],
                    'phone' => $data['acudiente_telefono'],
                    'email' => $data['acudiente_email'],
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                Log::info('Nueva persona del acudiente creada', ['guardian_person_id' => $guardianPersonId]);
            }

            // Verificar si ya existe una relación de guardian para este modelo con esta persona
            $existingGuardian = DB::table('guardians')
                ->where('model_id', $modelId)
                ->where('person_id', $guardianPersonId)
                ->first();

            if ($existingGuardian) {
                // Actualizar la relación existente (activándola si estaba inactiva)
                DB::table('guardians')->where('id', $existingGuardian->id)->update([
                    'relationship_id' => $data['acudiente_parentesco'],
                    'is_active' => true,
                    'updated_at' => now(),
                ]);
                Log::info('Relación de guardian existente actualizada', ['guardian_id' => $existingGuardian->id]);
            } else {
                // Crear nueva relación de acudiente con el modelo
                DB::table('guardians')->insert([
                    'model_id' => $modelId,
                    'person_id' => $guardianPersonId,
                    'relationship_id' => $data['acudiente_parentesco'],
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                Log::info('Nueva relación de guardian creada', ['model_id' => $modelId, 'guardian_person_id' => $guardianPersonId]);
            }

            // 6. Insertar suscripción
            // Obtener branch_subscription_plan y duración del plan
            $branchPlan = DB::table('branch_subscription_plans')
                ->where('id', $data['subscription_plan_id'])
                ->first();
            if (!$branchPlan) {
                throw new \Exception('Plan de suscripción no encontrado');
            }
            $plan = DB::table('subscription_plans')->where('id', $branchPlan->subscription_plan_id)->first();
            if (!$plan) {
                throw new \Exception('Datos del plan no encontrados');
            }
            $quantity = isset($data['subscription_quantity']) ? (int)$data['subscription_quantity'] : 1;
            $durationMonths = $plan->duration_months * $quantity;
            $startDate = \Carbon\Carbon::parse($data['fecha_vigencia']);
            $endDate = (clone $startDate)->addMonths($durationMonths);

            $subscriptionId = DB::table('subscriptions')->insertGetId([
                'model_id' => $modelId,
                'branch_subscription_plan_id' => $branchPlan->id,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $total = ($branchPlan->custom_price ?? $plan->price) * $quantity;
            $pagado = 0;
            $estado = null;
            if ($data['abonar_parte']) {
                $pagado = $data['valor_abonar'];
            } else {
                $pagado = $total;
            }

            if ($pagado >= $total) {
                $estado = 2;
            }

            if ($estado === null && $pagado > 0) {
                $estado = 3;
            } else {
                $estado = 1;
            }

            // Registrar la factura
            $invoiceId = DB::table('invoices')->insertGetId([
                'branch_id' => $data['branch_id'],
                'person_id' => $personId,
                'invoice_date' => now(),
                'total_amount' => $total,
                'paid_amount' => $pagado,
                'remaining_amount' => max(0, $total - $pagado),
                'status_id' => $estado,
                'invoice_type_id' => 1,
                'observations' => $data['observaciones'] ?? null,
                'created_by' => auth()->id(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // registrar invoice_items
            DB::table('invoice_items')->insert([
                'invoice_id' => $invoiceId,
                'item_type_id' => 2,
                'subscription_id' => $subscriptionId,
                'quantity' => $quantity,
                'unit_price' => $branchPlan->custom_price ?? $plan->price,
                'total_price' => $total,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // se registra el pago
            if ($pagado > 0) {
                DB::table('payments')->insert([
                    'branch_id' => $data['branch_id'],
                    'invoice_id' => $invoiceId,
                    'payment_method_id' => $data['medio_pago'],
                    'amount' => $pagado,
                    'created_by' => auth()->id(),
                    'payment_date' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Limpiar archivos temporales que no se usaron
            $this->cleanUpUnusedTempFiles($imagesMeta);

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Modelo registrado correctamente']);
        } catch (ValidationException $e) {
            DB::rollBack();
            // Re-lanzar la excepción de validación para que Laravel la maneje correctamente
            throw $e;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al registrar modelo: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['success' => false, 'message' => 'Error al registrar modelo'], 500);
        }
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        try {
            $resultado = $this->getModelData($id);
            
            if (isset($resultado['error'])) {
                if (request()->ajax() || request()->wantsJson()) {
                    return response()->json(['error' => $resultado['error']], $resultado['status']);
                }
                return redirect()->route('admin.modelos.index')->with('error', $resultado['error']);
            }

            // Si es petición AJAX, devolver JSON
            if (request()->ajax() || request()->wantsJson()) {
                return response()->json($resultado);
            }

            // Si no, renderizar la vista de modelo completa (fuera del dashboard)
            return Inertia::render('Modelos/Show', $resultado);

        } catch (\Exception $e) {
            Log::error('Error al obtener información del modelo: ' . $e->getMessage(), [
                'model_id' => $id,
                'trace' => $e->getTraceAsString()
            ]);
            
            if (request()->ajax() || request()->wantsJson()) {
                return response()->json(['error' => 'Error al cargar la información del modelo'], 500);
            }
            
            return redirect()->route('admin.modelos.index')->with('error', 'Error al cargar la información del modelo');
        }
    }

    /**
     * Display the specified resource as JSON (for API/Postman testing).
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function showJson($id)
    {
        try {
            $resultado = $this->getModelData($id);
            
            if (isset($resultado['error'])) {
                return response()->json([
                    'success' => false,
                    'error' => $resultado['error']
                ], $resultado['status']);
            }

            return response()->json([
                'success' => true,
                'data' => $resultado
            ]);

        } catch (\Exception $e) {
            Log::error('Error al obtener información del modelo (JSON): ' . $e->getMessage(), [
                'model_id' => $id,
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Error al cargar la información del modelo',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener todos los datos de un modelo (método privado reutilizable)
     *
     * @param  int  $id
     * @return array
     */
    private function getModelData($id)
    {
        // Query principal para obtener información del modelo
        $modelo = DB::table('models as m')
            ->join('people as p', 'm.person_id', '=', 'p.id')
            ->leftJoin('model_profiles as mp', 'm.id', '=', 'mp.model_id')
            ->leftJoin('identification_types as it', 'p.identification_type_id', '=', 'it.id')
            ->leftJoin('genders as g', 'p.gender_id', '=', 'g.id')
            ->leftJoin('blood_types as bt', 'p.blood_type_id', '=', 'bt.id')
            ->leftJoin('hair_colors as hc', 'mp.hair_color_id', '=', 'hc.id')
            ->leftJoin('eye_colors as ec', 'mp.eye_color_id', '=', 'ec.id')
            ->leftJoin('skin_colors as sc', 'mp.skin_color_id', '=', 'sc.id')
            ->where('m.id', $id)
            ->where('m.is_active', true)
            ->select([
                // Información básica del modelo
                'm.id',
                'm.person_id',
                'm.created_at as fecha_registro',
                
                // Información personal
                'p.first_name as nombres',
                'p.last_name as apellidos',
                DB::raw("CONCAT(p.first_name, ' ', p.last_name) as nombre_completo"),
                'p.identification_number as numero_identificacion',
                'it.name as tipo_identificacion',
                'p.identification_place as lugar_expedicion',
                'p.birth_date as fecha_nacimiento',
                'p.address as direccion',
                'p.phone as telefono',
                'p.email',
                'g.name as genero',
                'bt.name as tipo_sangre',
                
                // Perfil físico
                'mp.height as estatura',
                'mp.bust as busto',
                'mp.waist as cintura',
                'mp.hips as cadera',
                'hc.name as color_cabello',
                'ec.name as color_ojos',
                'sc.name as color_piel',
                'mp.pants_size as talla_pantalon',
                'mp.shirt_size as talla_camisa',
                'mp.shoe_size as talla_calzado',
            ])
            ->first();

        if (!$modelo) {
            return ['error' => 'Modelo no encontrado', 'status' => 404];
        }

        // Obtener imágenes del modelo
        $imagenes = DB::table('model_files')
            ->where('model_id', $id)
            ->where('file_type', 'imagen')
            ->select('id', 'file_path', 'file_name', 'file_type', 'created_at')
            ->orderBy('created_at', 'asc')
            ->get();

        // Obtener redes sociales
        $redesSociales = DB::table('model_social_media as msm')
            ->join('social_media_platforms as smp', 'msm.social_media_platform_id', '=', 'smp.id')
            ->where('msm.model_id', $id)
            ->where('msm.is_active', true)
            ->select('smp.name as plataforma', 'msm.url')
            ->get();

        // Obtener información del acudiente/tutor
        $acudiente = DB::table('guardians as g')
            ->join('people as p', 'g.person_id', '=', 'p.id')
            ->join('relationships as r', 'g.relationship_id', '=', 'r.id')
            ->leftJoin('identification_types as it_acudiente', 'p.identification_type_id', '=', 'it_acudiente.id')
            ->where('g.model_id', $id)
            ->where('g.is_active', true)
            ->select([
                DB::raw("CONCAT(p.first_name, ' ', p.last_name) as nombre_completo"),
                'p.identification_number as numero_identificacion',
                'it_acudiente.name as tipo_identificacion',
                'p.identification_place as lugar_expedicion',
                'p.phone as telefono',
                'p.email',
                'p.address as direccion',
                'r.name as parentesco'
            ])
            ->first();

        // Obtener suscripciones activas y historial
        $suscripciones = DB::table('subscriptions as s')
            ->join('branch_subscription_plans as bsp', 's.branch_subscription_plan_id', '=', 'bsp.id')
            ->join('subscription_plans as sp', 'bsp.subscription_plan_id', '=', 'sp.id')
            ->join('branches as b', 'bsp.branch_id', '=', 'b.id')
            ->where('s.model_id', $id)
            ->select([
                's.id',
                'sp.name as plan_nombre',
                'sp.description as plan_descripcion',
                DB::raw('COALESCE(bsp.custom_price, sp.price) as precio'),
                'sp.duration_months as duracion_meses',
                's.start_date as fecha_inicio',
                's.end_date as fecha_fin',
                's.status as estado',
                'b.name as sucursal'
            ])
            ->orderBy('s.created_at', 'desc')
            ->get();

        // Obtener facturas relacionadas
        $facturas = DB::table('invoices as i')
            ->join('invoice_statuses as ist', 'i.status_id', '=', 'ist.id')
            ->join('branches as b', 'i.branch_id', '=', 'b.id')
            ->where('i.person_id', $modelo->person_id)
            ->select([
                'i.id',
                'i.invoice_date as fecha_factura',
                'i.total_amount as total',
                'i.paid_amount as pagado',
                'i.remaining_amount as pendiente',
                'ist.name as estado',
                'b.name as sucursal',
                'i.observations as observaciones'
            ])
            ->orderBy('i.invoice_date', 'desc')
            ->get();

        // Obtener pagos realizados
        $pagos = DB::table('payments as p')
            ->join('invoices as i', 'p.invoice_id', '=', 'i.id')
            ->join('payment_methods as pm', 'p.payment_method_id', '=', 'pm.id')
            ->join('branches as b', 'p.branch_id', '=', 'b.id')
            ->where('i.person_id', $modelo->person_id)
            ->select([
                'p.id',
                'p.payment_date as fecha_pago',
                'p.amount as monto',
                'pm.name as metodo_pago',
                'b.name as sucursal',
                'i.id as factura_id'
            ])
            ->orderBy('p.payment_date', 'desc')
            ->get();

        // Calcular estadísticas
        $totalFacturado = $facturas->sum('total');
        $totalPagado = $facturas->sum('pagado');
        $totalPendiente = $facturas->sum('pendiente');
        
        $estadisticas = [
            'total_facturado' => $totalFacturado,
            'total_pagado' => $totalPagado,
            'total_pendiente' => $totalPendiente,
            'total_imagenes' => $imagenes->count(),
            'total_suscripciones' => $suscripciones->count(),
            'suscripcion_activa' => $suscripciones->where('estado', 'active')->isNotEmpty(),
        ];

        // Organizar datos para el frontend de manera más estructurada
        return [
            'modelo' => [
                // Información básica
                'id' => $modelo->id,
                'nombre_completo' => $modelo->nombre_completo,
                'nombres' => $modelo->nombres,
                'apellidos' => $modelo->apellidos,
                'fecha_registro' => $modelo->fecha_registro,
                
                // Campos directos para compatibilidad con el frontend actual
                'altura' => $modelo->estatura ? $modelo->estatura * 100 : null, // Convertir metros a centímetros para altura
                'medida_busto' => $modelo->busto,
                'medida_cintura' => $modelo->cintura,
                'medida_cadera' => $modelo->cadera,
                'color_cabello' => $modelo->color_cabello,
                'color_ojos' => $modelo->color_ojos,
                'color_piel' => $modelo->color_piel,
                
                // Datos personales
                'datos_personales' => [
                    'numero_identificacion' => $modelo->numero_identificacion,
                    'tipo_identificacion' => $modelo->tipo_identificacion,
                    'lugar_expedicion' => $modelo->lugar_expedicion,
                    'fecha_nacimiento' => $modelo->fecha_nacimiento,
                    'edad' => $modelo->fecha_nacimiento ? now()->diffInYears($modelo->fecha_nacimiento) : null,
                    'genero' => $modelo->genero,
                    'tipo_sangre' => $modelo->tipo_sangre,
                ],
                
                // Información de contacto
                'contacto' => [
                    'telefono' => $modelo->telefono,
                    'email' => $modelo->email,
                    'direccion' => $modelo->direccion,
                ],
                
                // Perfil físico/medidas (estructura completa)
                'medidas_fisicas' => [
                    'estatura' => $modelo->estatura,
                    'busto' => $modelo->busto,
                    'cintura' => $modelo->cintura,
                    'cadera' => $modelo->cadera,
                    'medidas_completas' => ($modelo->busto && $modelo->cintura && $modelo->cadera) ? $modelo->busto . '-' . $modelo->cintura . '-' . $modelo->cadera : 'No registradas',
                    'color_cabello' => $modelo->color_cabello,
                    'color_ojos' => $modelo->color_ojos,
                    'color_piel' => $modelo->color_piel,
                    'talla_pantalon' => $modelo->talla_pantalon,
                    'talla_camisa' => $modelo->talla_camisa,
                    'talla_calzado' => $modelo->talla_calzado,
                ],
                
                // Características adicionales para compatibilidad
                'caracteristicas' => [
                    'color_cabello' => $modelo->color_cabello,
                    'color_ojos' => $modelo->color_ojos,
                    'color_piel' => $modelo->color_piel,
                ],
            ],
            'imagenes' => $imagenes,
            'redes_sociales' => $redesSociales->map(function($red) {
                return [
                    'plataforma' => $red->plataforma,
                    'url' => $red->url,
                    'nombre_usuario' => $this->extractUsernameFromUrl($red->url, $red->plataforma)
                ];
            }),
            'acudiente' => $acudiente,
            'suscripciones' => $suscripciones->map(function($suscripcion) {
                $hoy = now();
                $fechaFin = \Carbon\Carbon::parse($suscripcion->fecha_fin);
                $diasRestantes = $hoy->diffInDays($fechaFin, false);
                
                return [
                    'id' => $suscripcion->id,
                    'plan_nombre' => $suscripcion->plan_nombre,
                    'plan_descripcion' => $suscripcion->plan_descripcion,
                    'precio' => $suscripcion->precio,
                    'duracion_meses' => $suscripcion->duracion_meses,
                    'fecha_inicio' => $suscripcion->fecha_inicio,
                    'fecha_fin' => $suscripcion->fecha_fin,
                    'estado' => $suscripcion->estado,
                    'sucursal' => $suscripcion->sucursal,
                    'dias_restantes' => $diasRestantes,
                    'esta_activa' => $suscripcion->estado === 'active' && $diasRestantes > 0,
                    'esta_por_vencer' => $suscripcion->estado === 'active' && $diasRestantes <= 30 && $diasRestantes > 0,
                ];
            }),
            'facturas' => $facturas,
            'pagos' => $pagos,
            'estadisticas' => $estadisticas
        ];
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        try {
            Log::info("Accediendo a la edición del modelo", ['model_id' => $id]);
            
            // 1. Obtener datos principales del modelo
            $modelo = DB::table('models as m')
                ->join('people as p', 'm.person_id', '=', 'p.id')
                ->leftJoin('model_profiles as mp', 'm.id', '=', 'mp.model_id')
                ->where('m.id', $id)
                ->where('m.is_active', true)
                ->select([
                    'm.id as model_id',
                    'm.person_id',
                    'm.is_active as model_active',
                    // Datos personales
                    'p.first_name as nombres',
                    'p.last_name as apellidos',
                    'p.identification_number as numero_identificacion',
                    'p.identification_type_id',
                    'p.identification_place as lugar_expedicion',
                    'p.birth_date as fecha_nacimiento',
                    'p.address as direccion',
                    'p.phone as telefono',
                    'p.email',
                    'p.gender_id',
                    'p.blood_type_id',
                    // Datos del perfil físico
                    'mp.height as estatura',
                    'mp.bust as busto',
                    'mp.waist as cintura',
                    'mp.hips as cadera',
                    'mp.hair_color_id as cabello',
                    'mp.eye_color_id as ojos',
                    'mp.skin_color_id as piel',
                    'mp.pants_size as pantalon',
                    'mp.shirt_size as camisa',
                    'mp.shoe_size as calzado'
                ])
                ->first();

            if (!$modelo) {
                return response()->json(['success' => false, 'message' => 'Modelo no encontrado'], 404);
            }

            // 2. Obtener redes sociales
            $redesSociales = DB::table('model_social_media as msm')
                ->join('social_media_platforms as smp', 'msm.social_media_platform_id', '=', 'smp.id')
                ->where('msm.model_id', $id)
                ->where('msm.is_active', true)
                ->select('smp.name as plataforma', 'msm.url')
                ->get();

            // 3. Obtener información del acudiente/tutor
            $acudiente = DB::table('guardians as g')
                ->join('people as p', 'g.person_id', '=', 'p.id')
                ->where('g.model_id', $id)
                ->where('g.is_active', true)
                ->select([
                    'p.first_name as acudiente_nombres',
                    'p.last_name as acudiente_apellidos',
                    'p.identification_number as acudiente_identificacion',
                    'p.identification_type_id as acudiente_tipo_identificacion',
                    'p.identification_place as acudiente_lugar_expedicion',
                    'p.phone as acudiente_telefono',
                    'p.email as acudiente_email',
                    'p.address as acudiente_direccion',
                    'g.relationship_id as acudiente_parentesco'
                ])
                ->first();

            // 4. Obtener suscripción activa más reciente (solo para referencia, no para edición)
            $suscripcion = DB::table('subscriptions as s')
                ->join('branch_subscription_plans as bsp', 's.branch_subscription_plan_id', '=', 'bsp.id')
                ->join('subscription_plans as sp', 'bsp.subscription_plan_id', '=', 'sp.id')
                ->join('branches as b', 'bsp.branch_id', '=', 'b.id')
                ->where('s.model_id', $id)
                ->where('s.status', 'active')
                ->orderBy('s.created_at', 'desc')
                ->select([
                    's.id as subscription_id',
                    'bsp.id as subscription_plan_id',
                    'b.id as branch_id',
                    's.start_date as fecha_vigencia',
                    'sp.duration_months'
                ])
                ->first();

            // 5. Obtener imágenes del modelo
            $imagenes = DB::table('model_files')
                ->where('model_id', $id)
                ->where('file_type', 'imagen')
                ->select('id', 'file_path', 'file_name', 'created_at')
                ->orderBy('created_at', 'asc')
                ->get();

            // 6. Preparar estructura para el frontend (similar a EmployeeForm)
            $data = [
                'model_id' => $modelo->model_id,
                'person_id' => $modelo->person_id,
                // Datos personales
                'nombres' => $modelo->nombres,
                'apellidos' => $modelo->apellidos,
                'numero_identificacion' => $modelo->numero_identificacion,
                'identification_type_id' => $modelo->identification_type_id,
                'lugar_expedicion' => $modelo->lugar_expedicion,
                'fecha_nacimiento' => $modelo->fecha_nacimiento,
                'direccion' => $modelo->direccion,
                'telefono' => $modelo->telefono,
                'email' => $modelo->email,
                'gender_id' => $modelo->gender_id,
                'blood_type_id' => $modelo->blood_type_id,
                // Datos físicos
                'estatura' => $modelo->estatura,
                'busto' => $modelo->busto,
                'cintura' => $modelo->cintura,
                'cadera' => $modelo->cadera,
                'cabello' => $modelo->cabello,
                'ojos' => $modelo->ojos,
                'piel' => $modelo->piel,
                'pantalon' => $modelo->pantalon,
                'camisa' => $modelo->camisa,
                'calzado' => $modelo->calzado,
                // Redes sociales
                'facebook' => '',
                'instagram' => '',
                'twitter' => '',
                'tiktok' => '',
                'otra_red_social' => ''
            ];

            // Mapear redes sociales
            foreach ($redesSociales as $red) {
                switch (strtolower($red->plataforma)) {
                    case 'facebook':
                        $data['facebook'] = $red->url;
                        break;
                    case 'instagram':
                        $data['instagram'] = $red->url;
                        break;
                    case 'twitter':
                        $data['twitter'] = $red->url;
                        break;
                    case 'tiktok':
                        $data['tiktok'] = $red->url;
                        break;
                    case 'other':
                        $data['otra_red_social'] = $red->url;
                        break;
                }
            }

            // Agregar datos del acudiente si existe
            if ($acudiente) {
                $data = array_merge($data, [
                    'acudiente_nombres' => $acudiente->acudiente_nombres,
                    'acudiente_apellidos' => $acudiente->acudiente_apellidos,
                    'acudiente_identificacion' => $acudiente->acudiente_identificacion,
                    'acudiente_tipo_identificacion' => $acudiente->acudiente_tipo_identificacion,
                    'acudiente_lugar_expedicion' => $acudiente->acudiente_lugar_expedicion,
                    'acudiente_telefono' => $acudiente->acudiente_telefono,
                    'acudiente_email' => $acudiente->acudiente_email,
                    'acudiente_direccion' => $acudiente->acudiente_direccion,
                    'acudiente_parentesco' => $acudiente->acudiente_parentesco,
                ]);
            }

            // Nota: No incluimos datos de suscripción en la edición ya que no es relevante para editar un modelo existente

            // Preparar URLs de imágenes para el frontend
            $imagenesFormatted = $imagenes->map(function($img) {
                return [
                    'id' => $img->id,
                    'url' => asset($img->file_path),
                    'name' => $img->file_name,
                    // NO enviar temp_id para imágenes existentes - esto causa confusión
                    // 'temp_id' => $img->file_name // ❌ INCORRECTO
                ];
            });

            return response()->json([
                'modelo' => $data,
                'imagenes' => $imagenesFormatted
            ]);

        } catch (\Throwable $th) {
            Log::error('Error en ModeloController@edit: ' . $th->getMessage(), [
                'exception' => $th,
                'model_id' => $id
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error inesperado al consultar los datos para editar el modelo.'
            ], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        try {
            Log::info('Actualizando modelo', ['model_id' => $id]);
            $data = $request->all();
            Log::info('=== DATOS DEL FORMULARIO DE MODELO (UPDATE) ===');
            Log::info('Objeto completo: ' . json_encode($data, JSON_PRETTY_PRINT));
            Log::info('=== FIN DATOS FORMULARIO UPDATE ===');

            // VALIDACIONES PARA UPDATE
            Log::info('=== INICIANDO VALIDACIONES UPDATE ===');
            
            // PRIMERA VALIDACIÓN: Verificar si ya existe otro modelo (diferente al actual) con esa identificación
            $existingModel = DB::table('models as m')
                ->join('people as p', 'm.person_id', '=', 'p.id')
                ->where('p.identification_number', $data['numero_identificacion'])
                ->where('m.is_active', true)
                ->where('m.id', '!=', $id) // Excluir el modelo actual
                ->first();

            if ($existingModel) {
                return response()->json([
                    'success' => false,
                    'message' => "Ya existe otro modelo registrado con el número de identificación: {$data['numero_identificacion']}. Por favor verifique los datos."
                ], 422);
            }

            // SEGUNDA VALIDACIÓN: Verificar si otra persona (diferente a la del modelo actual) tiene esa identificación
            $currentModel = DB::table('models')->where('id', $id)->where('is_active', true)->first();
            if (!$currentModel) {
                return response()->json([
                    'success' => false,
                    'message' => 'Modelo no encontrado.'
                ], 404);
            }

            $anotherPersonWithSameId = DB::table('people')
                ->where('identification_number', $data['numero_identificacion'])
                ->where('id', '!=', $currentModel->person_id) // Excluir la persona actual del modelo
                ->first();

            $validationRules = [
                'nombres' => 'required|string|max:255',
                'apellidos' => 'required|string|max:255',
                'identification_type_id' => 'required|exists:identification_types,id',
                'lugar_expedicion' => 'nullable|string|max:255',
                'fecha_nacimiento' => 'nullable|date|before:today',
                'direccion' => 'nullable|string|max:500',
                'telefono' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'gender_id' => 'nullable|exists:genders,id',
                'blood_type_id' => 'nullable|exists:blood_types,id',
                
                // Validaciones de perfil físico
                'estatura' => 'nullable|numeric|min:0.5|max:3.0',
                'busto' => 'nullable|integer|min:50|max:200',
                'cintura' => 'nullable|integer|min:40|max:150',
                'cadera' => 'nullable|integer|min:60|max:200',
                'cabello' => 'nullable|exists:hair_colors,id',
                'ojos' => 'nullable|exists:eye_colors,id',
                'piel' => 'nullable|exists:skin_colors,id',
                'pantalon' => 'nullable|string|max:20',
                'camisa' => 'nullable|string|max:20',
                'calzado' => 'nullable|string|max:20',
                
                // Validaciones de acudiente
                'acudiente_nombres' => 'required|string|max:255',
                'acudiente_apellidos' => 'required|string|max:255',
                'acudiente_identificacion' => 'required|string|max:20',
                'acudiente_tipo_identificacion' => 'required|exists:identification_types,id',
                'acudiente_lugar_expedicion' => 'required|string|max:255',
                'acudiente_parentesco' => 'required|exists:relationships,id',
                'acudiente_telefono' => 'required|string|max:20',
                'acudiente_email' => 'nullable|email|max:255',
                'acudiente_direccion' => 'required|string|max:500',
            ];

            // Solo agregar la validación unique si encontramos otra persona con la misma identificación
            if ($anotherPersonWithSameId) {
                // IMPORTANTE: Solo aplicar unique si estamos intentando usar la identificación de otra persona
                // Pero permitir que una persona que ya es acudiente se convierta en modelo
                $validationRules['numero_identificacion'] = [
                    'required',
                    'string',
                    'max:20',
                    Rule::unique('people', 'identification_number')->ignore($currentModel->person_id)
                ];
            } else {
                // Si no hay conflicto con otra persona, permitir el cambio
                $validationRules['numero_identificacion'] = 'required|string|max:20';
            }

            // Ejecutar validaciones
            $request->validate($validationRules);

            // VALIDACIÓN ESPECÍFICA: El modelo y el acudiente no pueden tener la misma identificación
            if ($data['numero_identificacion'] === $data['acudiente_identificacion']) {
                return response()->json([
                    'success' => false, 
                    'message' => 'El modelo y el acudiente no pueden tener el mismo número de identificación. Por favor, verifique los datos ingresados.'
                ], 422);
            }

            // VALIDACIÓN ADICIONAL: Solo verificar que un modelo no sea su propio acudiente (autoreferencia)
            // NOTA: Removemos la validación que impedía que un acudiente fuera modelo,
            // ya que una persona SÍ puede ser modelo y acudiente de otros modelos

            Log::info('=== VALIDACIONES UPDATE PASADAS ===');

            // Procesar imágenes meta si existe
            $imagesMeta = json_decode($request->input('model_images_meta'), true) ?? [];

            DB::beginTransaction();

            // 1. Usar el modelo que ya obtuvimos en las validaciones
            $model = $currentModel;

            // 2. Actualizar datos de la persona
            $affectedPeople = DB::table('people')->where('id', $model->person_id)->update([
                'first_name' => $data['nombres'],
                'last_name' => $data['apellidos'],
                'identification_number' => $data['numero_identificacion'],
                'identification_type_id' => $data['identification_type_id'],
                'identification_place' => $data['lugar_expedicion'],
                'birth_date' => $data['fecha_nacimiento'],
                'address' => $data['direccion'],
                'phone' => $data['telefono'],
                'email' => $data['email'],
                'gender_id' => $data['gender_id'],
                'blood_type_id' => $data['blood_type_id'],
                'updated_at' => now(),
            ]);

            // 3. Actualizar perfil del modelo
            DB::table('model_profiles')->updateOrInsert(
                ['model_id' => $id],
                [
                    'height' => $data['estatura'],
                    'bust' => $data['busto'],
                    'waist' => $data['cintura'],
                    'hips' => $data['cadera'],
                    'hair_color_id' => $data['cabello'],
                    'eye_color_id' => $data['ojos'],
                    'skin_color_id' => $data['piel'],
                    'pants_size' => $data['pantalon'],
                    'shirt_size' => $data['camisa'],
                    'shoe_size' => $data['calzado'],
                    'updated_at' => now(),
                ]
            );

            // 4. Actualizar imágenes si se enviaron
            if (!empty($imagesMeta)) {
                Log::info('Procesando imágenes en modo edición', ['images_meta' => $imagesMeta]);
                
                // Obtener todas las imágenes existentes del modelo
                $existingImages = DB::table('model_files')->where('model_id', $id)->get();
                $existingImageIds = $existingImages->pluck('id')->toArray();
                
                // Separar imágenes nuevas y existentes que se mantienen
                $imagesToKeep = [];
                $newImages = [];
                
                foreach ($imagesMeta as $img) {
                    Log::info('Evaluando imagen individual', [
                        'temp_id' => $img['temp_id'] ?? 'no_temp_id',
                        'isNew' => $img['isNew'] ?? 'no_isNew',
                        'isExisting' => $img['isExisting'] ?? 'no_isExisting',
                        'id' => $img['id'] ?? 'no_id'
                    ]);

                    if (isset($img['isExisting']) && $img['isExisting'] && isset($img['id'])) {
                        // Imagen existente que se mantiene
                        $imagesToKeep[] = $img['id'];
                        Log::info('Imagen marcada como existente para mantener', ['id' => $img['id']]);
                    } elseif (isset($img['temp_id']) && !empty($img['temp_id'])) {
                        // Cualquier imagen con temp_id válido se considera nueva
                        $newImages[] = $img;
                        Log::info('Imagen identificada como nueva por temp_id', [
                            'temp_id' => $img['temp_id'],
                            'name' => $img['name']
                        ]);
                    } else {
                        Log::info('Imagen no procesada', [
                            'img' => $img,
                            'razon' => 'No tiene temp_id válido ni es imagen existente'
                        ]);
                    }
                }
                
                // Eliminar imágenes que ya no están en la lista (fueron removidas por el usuario)
                $imagesToDelete = array_diff($existingImageIds, $imagesToKeep);
                if (!empty($imagesToDelete)) {
                    Log::info('Eliminando imágenes no utilizadas', ['images_to_delete' => $imagesToDelete]);
                    
                    // Obtener rutas de archivos a eliminar del disco
                    $filesToDelete = DB::table('model_files')
                        ->whereIn('id', $imagesToDelete)
                        ->pluck('file_path')
                        ->toArray();
                    
                    // Eliminar archivos del disco
                    foreach ($filesToDelete as $filePath) {
                        $fullPath = public_path($filePath);
                        if (file_exists($fullPath)) {
                            unlink($fullPath);
                        }
                    }
                    
                    // Eliminar registros de la base de datos
                    DB::table('model_files')->whereIn('id', $imagesToDelete)->delete();
                }
                
                // Procesar imágenes nuevas
                if (!empty($newImages)) {
                    Log::info('Procesando imágenes nuevas', [
                        'cantidad' => count($newImages),
                        'new_images' => $newImages
                    ]);
                    
                    // Crear directorio definitivo para las imágenes del modelo
                    $definitiveImagePath = 'storage/modelos/' . $id;
                    $fullDefinitivePath = public_path($definitiveImagePath);
                    
                    if (!file_exists($fullDefinitivePath)) {
                        mkdir($fullDefinitivePath, 0755, true);
                        Log::info('Directorio creado', ['path' => $fullDefinitivePath]);
                    }

                    foreach ($newImages as $img) {
                        if (isset($img['temp_id']) && !empty($img['temp_id'])) {
                            $tempFilePath = public_path('storage/temp/modelos/' . $img['temp_id']);
                            $definitiveFileName = $img['temp_id'];
                            $definitiveFilePath = $fullDefinitivePath . '/' . $definitiveFileName;
                            $relativeDefinitivePath = $definitiveImagePath . '/' . $definitiveFileName;

                            Log::info('Procesando imagen individual', [
                                'temp_file_path' => $tempFilePath,
                                'definitive_file_path' => $definitiveFilePath,
                                'temp_exists' => file_exists($tempFilePath)
                            ]);

                            // Mover archivo de temporal a definitivo
                            if (file_exists($tempFilePath)) {
                                if (rename($tempFilePath, $definitiveFilePath)) {
                                    // Registrar en base de datos
                                    $insertedId = DB::table('model_files')->insertGetId([
                                        'model_id' => $id,
                                        'file_path' => $relativeDefinitivePath,
                                        'file_name' => $definitiveFileName,
                                        'file_type' => 'imagen',
                                        'created_at' => now(),
                                        'updated_at' => now(),
                                    ]);
                                    Log::info('Imagen nueva guardada exitosamente', [
                                        'file_path' => $relativeDefinitivePath,
                                        'db_id' => $insertedId
                                    ]);
                                } else {
                                    Log::error('Error moviendo archivo', [
                                        'from' => $tempFilePath,
                                        'to' => $definitiveFilePath
                                    ]);
                                }
                            } else {
                                Log::error('Archivo temporal no existe', [
                                    'temp_path' => $tempFilePath,
                                    'temp_id' => $img['temp_id']
                                ]);
                            }
                        } else {
                            Log::warning('Imagen sin temp_id válido', ['img' => $img]);
                        }
                    }
                } else {
                    Log::info('No hay imágenes nuevas para procesar');
                }
            }

            // 5. Actualizar redes sociales
            // Eliminar redes sociales existentes
            DB::table('model_social_media')->where('model_id', $id)->delete();

            $socialMediaData = [
                'facebook' => $data['facebook'] ?? null,
                'instagram' => $data['instagram'] ?? null,
                'twitter' => $data['twitter'] ?? null,
                'tiktok' => $data['tiktok'] ?? null,
                'other' => $data['otra_red_social'] ?? null,
            ];

            $platformMapping = [
                'facebook' => 1,
                'instagram' => 2,
                'twitter' => 3,
                'tiktok' => 4,
                'other' => 5,
            ];

            foreach ($socialMediaData as $platform => $url) {
                if (!empty($url)) {
                    DB::table('model_social_media')->insert([
                        'model_id' => $id,
                        'social_media_platform_id' => $platformMapping[$platform],
                        'url' => $url,
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            // 6. Actualizar acudiente si existe
            if (!empty($data['acudiente_nombres'])) {
                // Obtener acudiente actual para comparar si cambió la identificación
                $currentGuardian = DB::table('guardians')
                    ->where('model_id', $id)
                    ->where('is_active', true)
                    ->first();

                $guardianPersonId = null;

                if ($currentGuardian) {
                    // Obtener datos de la persona actual del acudiente
                    $currentGuardianPerson = DB::table('people')->where('id', $currentGuardian->person_id)->first();
                    
                    // Verificar si cambió la identificación del acudiente
                    if ($currentGuardianPerson && $currentGuardianPerson->identification_number === $data['acudiente_identificacion']) {
                        // La identificación NO cambió, actualizar la misma persona
                        DB::table('people')->where('id', $currentGuardian->person_id)->update([
                            'first_name' => $data['acudiente_nombres'],
                            'last_name' => $data['acudiente_apellidos'],
                            'identification_type_id' => $data['acudiente_tipo_identificacion'],
                            'identification_place' => $data['acudiente_lugar_expedicion'],
                            'address' => $data['acudiente_direccion'],
                            'phone' => $data['acudiente_telefono'],
                            'email' => $data['acudiente_email'],
                            'updated_at' => now(),
                        ]);

                        $guardianPersonId = $currentGuardian->person_id;
                        Log::info('Acudiente actualizado (misma identificación)', ['guardian_person_id' => $guardianPersonId]);
                    } else {
                        // La identificación SÍ cambió, buscar si existe la nueva persona
                        $existingPersonWithNewId = DB::table('people')
                            ->where('identification_number', $data['acudiente_identificacion'])
                            ->first();

                        if ($existingPersonWithNewId) {
                            // Ya existe una persona con la nueva identificación, usar esa persona y actualizar sus datos
                            DB::table('people')->where('id', $existingPersonWithNewId->id)->update([
                                'first_name' => $data['acudiente_nombres'],
                                'last_name' => $data['acudiente_apellidos'],
                                'identification_type_id' => $data['acudiente_tipo_identificacion'],
                                'identification_place' => $data['acudiente_lugar_expedicion'],
                                'address' => $data['acudiente_direccion'],
                                'phone' => $data['acudiente_telefono'],
                                'email' => $data['acudiente_email'],
                                'updated_at' => now(),
                            ]);

                            $guardianPersonId = $existingPersonWithNewId->id;
                            Log::info('Acudiente cambiado a persona existente', ['new_guardian_person_id' => $guardianPersonId]);
                        } else {
                            // No existe persona con la nueva identificación, crear nueva persona
                            $guardianPersonId = DB::table('people')->insertGetId([
                                'first_name' => $data['acudiente_nombres'],
                                'last_name' => $data['acudiente_apellidos'],
                                'identification_number' => $data['acudiente_identificacion'],
                                'identification_type_id' => $data['acudiente_tipo_identificacion'],
                                'identification_place' => $data['acudiente_lugar_expedicion'],
                                'address' => $data['acudiente_direccion'],
                                'phone' => $data['acudiente_telefono'],
                                'email' => $data['acudiente_email'],
                                'is_active' => true,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                            Log::info('Nueva persona creada para acudiente', ['new_guardian_person_id' => $guardianPersonId]);
                        }

                        // Actualizar la relación de guardian para apuntar a la nueva persona
                        DB::table('guardians')->where('id', $currentGuardian->id)->update([
                            'person_id' => $guardianPersonId,
                            'relationship_id' => $data['acudiente_parentesco'],
                            'updated_at' => now(),
                        ]);
                        Log::info('Relación de guardian actualizada con nueva persona', ['guardian_id' => $currentGuardian->id, 'new_person_id' => $guardianPersonId]);
                    }

                    // Solo actualizar el parentesco si no se actualizó arriba
                    if ($currentGuardianPerson && $currentGuardianPerson->identification_number === $data['acudiente_identificacion']) {
                        DB::table('guardians')->where('id', $currentGuardian->id)->update([
                            'relationship_id' => $data['acudiente_parentesco'],
                            'updated_at' => now(),
                        ]);
                    }
                } else {
                    // No hay acudiente actual, crear nuevo
                    $existingPersonWithNewId = DB::table('people')
                        ->where('identification_number', $data['acudiente_identificacion'])
                        ->first();

                    if ($existingPersonWithNewId) {
                        // Usar persona existente
                        DB::table('people')->where('id', $existingPersonWithNewId->id)->update([
                            'first_name' => $data['acudiente_nombres'],
                            'last_name' => $data['acudiente_apellidos'],
                            'identification_type_id' => $data['acudiente_tipo_identificacion'],
                            'identification_place' => $data['acudiente_lugar_expedicion'],
                            'address' => $data['acudiente_direccion'],
                            'phone' => $data['acudiente_telefono'],
                            'email' => $data['acudiente_email'],
                            'updated_at' => now(),
                        ]);
                        $guardianPersonId = $existingPersonWithNewId->id;
                        Log::info('Acudiente asignado desde persona existente', ['guardian_person_id' => $guardianPersonId]);
                    } else {
                        // Crear nueva persona
                        $guardianPersonId = DB::table('people')->insertGetId([
                            'first_name' => $data['acudiente_nombres'],
                            'last_name' => $data['acudiente_apellidos'],
                            'identification_number' => $data['acudiente_identificacion'],
                            'identification_type_id' => $data['acudiente_tipo_identificacion'],
                            'identification_place' => $data['acudiente_lugar_expedicion'],
                            'address' => $data['acudiente_direccion'],
                            'phone' => $data['acudiente_telefono'],
                            'email' => $data['acudiente_email'],
                            'is_active' => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                        Log::info('Nueva persona creada para acudiente', ['guardian_person_id' => $guardianPersonId]);
                    }

                    // Crear nueva relación de guardian
                    DB::table('guardians')->insert([
                        'model_id' => $id,
                        'person_id' => $guardianPersonId,
                        'relationship_id' => $data['acudiente_parentesco'],
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    Log::info('Nueva relación de guardian creada', ['model_id' => $id, 'guardian_person_id' => $guardianPersonId]);
                }
            }

            // Nota: En la edición de modelos no manejamos suscripciones ya que eso se gestiona por separado
            // Las suscripciones se crean/editan desde otros módulos específicos para facturación

            // Limpiar archivos temporales que no se usaron
            $this->cleanUpUnusedTempFiles($imagesMeta);

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Modelo actualizado correctamente']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al actualizar modelo: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['success' => false, 'message' => 'Error al actualizar modelo: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        // Si se envía un array de IDs en el body, hacer eliminación masiva
        if (request()->has('ids') && is_array(request()->input('ids'))) {
            $ids = request()->input('ids');
            
            // Validar que todos los IDs sean números
            foreach ($ids as $id) {
                if (!is_numeric($id)) {
                    return response()->json(['success' => false, 'message' => 'ID inválido: ' . $id], 400);
                }
            }
            
            // Verificar que existan los modelos
            $existingModels = DB::table('models')->whereIn('id', $ids)->count();
            if ($existingModels !== count($ids)) {
                return response()->json(['success' => false, 'message' => 'Algunos modelos no fueron encontrados'], 404);
            }
            
            // Desactivar todos los modelos
            DB::table('models')->whereIn('id', $ids)->update(['is_active' => false, 'updated_at' => now()]);
            
            // Desactivar todas las suscripciones de estos modelos
            DB::table('subscriptions')->whereIn('model_id', $ids)->update(['status' => 'inactive', 'updated_at' => now()]);
            
            return response()->json([
                'success' => true, 
                'message' => count($ids) . ' modelo(s) y sus suscripciones desactivado(s) correctamente'
            ]);
        }
        
        // Eliminación individual (comportamiento original)
        $modelo = DB::table('models')->where('id', $id)->first();
        if (!$modelo) {
            return response()->json(['success' => false, 'message' => 'Modelo no encontrado'], 404);
        }
        
        // Desactivar el modelo
        DB::table('models')->where('id', $id)->update(['is_active' => false, 'updated_at' => now()]);
        
        // Desactivar todas las suscripciones del modelo
        DB::table('subscriptions')->where('model_id', $id)->update(['status' => 'inactive', 'updated_at' => now()]);
        
        return response()->json(['success' => true, 'message' => 'Modelo y sus suscripciones desactivados correctamente']);
    }

    /**
     * Guardar imágenes de un modelo
     *
     * @param  int  $modelId
     * @param  array  $images
     * @return void
     */
    private function saveModelImages($modelId, $images)
    {
        if (empty($images) || !is_array($images)) {
            return;
        }

        $uploadPath = 'storage/modelos/' . $modelId;
        $fullPath = public_path($uploadPath);
        
        // Crear directorio si no existe
        if (!file_exists($fullPath)) {
            mkdir($fullPath, 0755, true);
        }

        $sortOrder = 0;
        foreach ($images as $image) {
            if (!$image || !isset($image['originFileObj'])) {
                continue;
            }

            $file = $image['originFileObj'];
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $fileName = uniqid() . '_' . time() . '.' . $extension;
            $filePath = $uploadPath . '/' . $fileName;
            $fullFilePath = $fullPath . '/' . $fileName;

            // Guardar archivo
            if ($file->move($fullPath, $fileName)) {
                // Insertar en base de datos
                DB::table('model_files')->insert([
                    'model_id' => $modelId,
                    'file_path' => $filePath,
                    'file_name' => $fileName,
                    'original_name' => $originalName,
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                    'file_type' => $image['file_type'] ?? 'portfolio',
                    'is_primary' => $image['is_primary'] ?? false,
                    'sort_order' => $sortOrder++,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    /**
     * Obtener imágenes de un modelo
     *
     * @param  int  $modelId
     * @return \Illuminate\Http\Response
     */
    public function getModelImages($modelId)
    {
        $images = DB::table('model_files')
            ->where('model_id', $modelId)
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->get();

        return response()->json($images);
    }

    /**
     * Eliminar imagen de un modelo
     *
     * @param  int  $modelId
     * @param  int  $imageId
     * @return \Illuminate\Http\Response
     */
    public function deleteModelImage($modelId, $imageId)
    {
        $image = DB::table('model_files')
            ->where('id', $imageId)
            ->where('model_id', $modelId)
            ->first();

        if (!$image) {
            return response()->json(['success' => false, 'message' => 'Imagen no encontrada'], 404);
        }

        // Eliminar archivo físico
        $fullPath = public_path($image->file_path);
        if (file_exists($fullPath)) {
            unlink($fullPath);
        }

        // Eliminar registro de base de datos
        DB::table('model_files')->where('id', $imageId)->delete();

        return response()->json(['success' => true, 'message' => 'Imagen eliminada correctamente']);
    }

    /**
     * Upload de imagen temporal
     */
    public function uploadImage(Request $request)
    {
        try {
            // Validar que se envió una imagen
            $request->validate([
                'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:10240'
            ]);

            // Crear directorio temporal si no existe
            $tempPath = storage_path('app/temp/modelos');
            if (!file_exists($tempPath)) {
                mkdir($tempPath, 0755, true);
            }

            // Generar nombre único para la imagen
            $fileName = uniqid() . '_' . time() . '.' . $request->file('image')->getClientOriginalExtension();
            $filePath = $tempPath . '/' . $fileName;

            // Mover imagen al directorio temporal
            $request->file('image')->move($tempPath, $fileName);

            // Retornar información de la imagen temporal
            return response()->json([
                'success' => true,
                'temp_id' => $fileName,
                'original_name' => $request->file('image')->getClientOriginalName(),
                'size' => filesize($filePath),
                'url' => asset('storage/temp/modelos/' . $fileName)
            ]);

        } catch (\Exception $e) {
            Log::error('Error en upload de imagen temporal: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al subir la imagen: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Limpiar archivos temporales no utilizados
     */
    private function cleanUpUnusedTempFiles($processedImages)
    {
        try {
            // CORREGIDO: usar la ruta correcta donde están las imágenes temporales
            $tempDir = public_path('storage/temp/modelos');
            
            if (!is_dir($tempDir)) {
                return;
            }

            // CORREGIDO: usar 'temp_id' solo para imágenes que lo tengan
            $processedFiles = array_map(function($img) {
                return $img['temp_id'] ?? null;
            }, $processedImages);
            
            // Filtrar nulls para evitar errores
            $processedFiles = array_filter($processedFiles);

            $files = glob($tempDir . '/*');
            $cutoffTime = now()->subHour(); // Eliminar archivos de más de 1 hora

            foreach ($files as $file) {
                if (is_file($file)) {
                    $fileName = basename($file);
                    $fileTime = filemtime($file);
                    
                    // Si no está en los procesados Y es viejo, eliminarlo
                    if (!in_array($fileName, $processedFiles) && $fileTime < $cutoffTime->timestamp) {
                        unlink($file);
                        Log::info("Archivo temporal eliminado: $fileName");
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('Error limpiando archivos temporales: ' . $e->getMessage());
        }
    }

    /**
     * Extraer nombre de usuario de URL de red social
     *
     * @param  string  $url
     * @param  string  $platform
     * @return string
     */
    private function extractUsernameFromUrl($url, $platform)
    {
        if (empty($url)) return '';
        
        // Remover protocolo y www
        $cleanUrl = preg_replace('#^https?://(www\.)?#', '', $url);
        
        switch (strtolower($platform)) {
            case 'instagram':
                if (preg_match('#instagram\.com/([^/?]+)#', $cleanUrl, $matches)) {
                    return '@' . $matches[1];
                }
                break;
            case 'facebook':
                if (preg_match('#facebook\.com/([^/?]+)#', $cleanUrl, $matches)) {
                    return $matches[1];
                }
                break;
            case 'twitter':
                if (preg_match('#twitter\.com/([^/?]+)#', $cleanUrl, $matches)) {
                    return '@' . $matches[1];
                }
                break;
            case 'tiktok':
                if (preg_match('#tiktok\.com/@?([^/?]+)#', $cleanUrl, $matches)) {
                    return '@' . $matches[1];
                }
                break;
        }
        
        return $url; // Si no se puede extraer, devolver la URL completa
    }
}
