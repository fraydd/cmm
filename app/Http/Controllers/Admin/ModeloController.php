<?php

namespace App\Http\Controllers\Admin;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ModeloController extends \App\Http\Controllers\Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $inicio = microtime(true);
        
        Log::info('Accediendo a la lista de modelos');
        Log::debug('Parámetros de la petición:', request()->all());
        
        $modelos = DB::table('models as m')
            ->join('people as p', 'm.person_id', '=', 'p.id')
            ->leftJoin('model_profiles as mp', 'm.id', '=', 'mp.model_id')
            ->leftJoin('subscriptions as s', function($join) {
                $join->on('m.id', '=', 's.model_id');
            })
            ->where('m.is_active', true)
            ->where('p.is_active', true)
            ->select([
                'm.id',
                DB::raw("CONCAT(p.first_name, ' ', p.last_name) as nombre"),
                DB::raw("CONCAT(mp.bust, '-', mp.waist, '-', mp.hips, ' (', mp.height, 'm)') as medidas"),
                DB::raw("'Modelo profesional con experiencia en pasarela y fotografía' as descripcion"),
                'p.identification_number',
                'p.phone',
                'p.email',
                'm.created_at as fecha_creacion',
                's.start_date as fecha_inicio_suscripcion',
                's.end_date as fecha_fin_suscripcion'
            ])
            ->orderBy('m.created_at', 'desc')
            ->get()
            ->map(function($modelo) {
                $hoy = date('Y-m-d');
                $estado = 'Sin suscripción';
                if ($modelo->fecha_inicio_suscripcion && $modelo->fecha_fin_suscripcion) {
                    if ($modelo->fecha_inicio_suscripcion > $hoy) {
                        $estado = 'Proximo';
                    } elseif ($modelo->fecha_inicio_suscripcion <= $hoy && $modelo->fecha_fin_suscripcion >= $hoy) {
                        $estado = 'Activo';
                    } elseif ($modelo->fecha_fin_suscripcion < $hoy) {
                        $estado = 'Vencido';
                    }
                }
                return [
                    'id' => $modelo->id,
                    'nombre' => $modelo->nombre,
                    'descripcion' => $modelo->descripcion,
                    'medidas' => $modelo->medidas ?? 'No registradas',
                    'estado' => $estado,
                    'fecha_creacion' => $modelo->fecha_creacion ? date('Y-m-d', strtotime($modelo->fecha_creacion)) : 'N/A',
                    'ultima_modificacion' => $modelo->fecha_fin_suscripcion ? date('Y-m-d', strtotime($modelo->fecha_fin_suscripcion)) : 'N/A',
                    'identificacion' => $modelo->identification_number,
                    'telefono' => $modelo->phone,
                    'email' => $modelo->email
                ];
            })
            ->toArray();
        
        $totalModelos = 1;
        
        
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
                'total_tablas' => $totalModelos[0]->total ?? 0,
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
            $plans = DB::table('branch_subscription_plans as bsp')
                ->join('subscription_plans as sp', 'bsp.subscription_plan_id', '=', 'sp.id')
                ->where('bsp.branch_id', $branchId)
                ->where('bsp.is_active', true)
                ->where('sp.is_active', true)
                ->orderBy('sp.name')
                ->select('sp.id', 'sp.name', 'sp.description', DB::raw('COALESCE(bsp.custom_price, sp.price) as price'), 'sp.duration_months')
                ->get();
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
        $imagesMeta = json_decode($request->input('model_images_meta'), true) ?? [];

        DB::beginTransaction();
        try {
            // 1. Buscar o insertar en people
            $person = DB::table('people')->where('identification_number', $data['numero_identificacion'])->first();
            if ($person) {
                $personId = $person->id;
            } else {
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
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 2. Insertar en models
            $modelId = DB::table('models')->insertGetId([
                'person_id' => $personId,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 3. Insertar en model_profiles
            DB::table('model_profiles')->insert([
                'model_id' => $modelId,
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
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 4. Mover imágenes de temporal a definitivo y registrar en base de datos
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

            // 5. Insertar redes sociales
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

            // 6. Insertar acudiente
            // Primero insertar en la tabla people
            $guardianPerson = DB::table('people')->where('identification_number', $data['acudiente_identificacion'])->first();
            if ($guardianPerson) {
                $guardianPersonId = $guardianPerson->id;
            } else {
                $guardianPersonId = DB::table('people')->insertGetId([
                    'first_name' => $data['acudiente_nombres'],
                    'last_name' => $data['acudiente_apellidos'],
                    'identification_number' => $data['acudiente_identificacion'],
                    'identification_place' => $data['acudiente_lugar_expedicion'],
                    'address' => $data['acudiente_direccion'],
                    'phone' => $data['acudiente_telefono'],
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Luego insertar en la tabla guardians
            DB::table('guardians')->insert([
                'model_id' => $modelId,
                'person_id' => $guardianPersonId,
                'relationship_id' => $data['acudiente_parentesco'],
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 7. Insertar suscripción
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
            ->where('g.model_id', $id)
            ->where('g.is_active', true)
            ->select([
                DB::raw("CONCAT(p.first_name, ' ', p.last_name) as nombre_completo"),
                'p.identification_number as numero_identificacion',
                'p.identification_place as lugar_expedicion',
                'p.phone as telefono',
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
        //
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
        //
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
            
            return response()->json([
                'success' => true, 
                'message' => count($ids) . ' modelo(s) desactivado(s) correctamente'
            ]);
        }
        
        // Eliminación individual (comportamiento original)
        $modelo = DB::table('models')->where('id', $id)->first();
        if (!$modelo) {
            return response()->json(['success' => false, 'message' => 'Modelo no encontrado'], 404);
        }
        DB::table('models')->where('id', $id)->update(['is_active' => false, 'updated_at' => now()]);
        return response()->json(['success' => true, 'message' => 'Modelo desactivado correctamente']);
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

            // CORREGIDO: usar 'temp_id' en lugar de 'file_path'
            $processedFiles = array_map(function($img) {
                return $img['temp_id'];
            }, $processedImages);

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
