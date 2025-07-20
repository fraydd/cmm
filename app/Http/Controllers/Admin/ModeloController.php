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

            // 4. Insertar imágenes
            foreach ($imagesMeta as $img) {
                DB::table('model_images')->insert([
                    'model_id' => $modelId,
                    'file_path' => $img['url'],
                    'file_name' => $img['temp_id'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
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

            DB::table('subscriptions')->insert([
                'model_id' => $modelId,
                'branch_subscription_plan_id' => $branchPlan->id,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

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
        //
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
                DB::table('model_images')->insert([
                    'model_id' => $modelId,
                    'file_path' => $filePath,
                    'file_name' => $fileName,
                    'original_name' => $originalName,
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                    'image_type' => $image['image_type'] ?? 'portfolio',
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
        $images = DB::table('model_images')
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
        $image = DB::table('model_images')
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
        DB::table('model_images')->where('id', $imageId)->delete();

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
}
