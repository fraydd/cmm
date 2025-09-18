<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Carbon\Carbon;

class StoreAdminController extends Controller
{
    /**
     * Mostrar la página principal de administración de tienda
     */
    public function index()
    {
        return Inertia::render('Admin/Store/surtir/Index', [
            'auth' => [
                'user' => auth()->user()
            ],
            'branch' => auth()->user()->branch ?? null
        ]);
    }

    /**
     * Obtener datos para productos
     */
    public function getProducts(Request $request)
    {
        try {
            $branchId = $request->input('branch_id');
            
            if (!$branchId) {
                return response()->json(['message' => 'branch_id es requerido'], 400);
            }

            $sql = <<<SQL
                SELECT 
                    p.id,
                    p.name,
                    p.description,
                    p.price,
                    p.stock_quantity as base_stock,
                    p.is_active as product_active,
                    pc.name as category_name,
                    pc.id as category_id,
                    pba.stock_quantity,
                    pba.price as branch_price,
                    pba.is_active as branch_active
                FROM products p
                INNER JOIN product_categories pc ON p.category_id = pc.id
                INNER JOIN product_branch_access pba ON p.id = pba.product_id
                WHERE pba.branch_id = ?
                  AND pba.is_active = true
                  AND p.is_active = true
                ORDER BY p.name ASC
            SQL;

            $products = DB::select($sql, [$branchId]);

            // Obtener todas las sedes asignadas por producto
            $productIds = array_column($products, 'id');
            $productBranches = []; // Inicializar siempre, incluso si no hay productos
            $productImages = []; // Inicializar siempre, incluso si no hay productos
            
            if (!empty($productIds)) {
                $placeholders = str_repeat('?,', count($productIds) - 1) . '?';
                
                $branchesSql = <<<SQL
                    SELECT 
                        pba.product_id,
                        pba.branch_id,
                        pba.stock_quantity as branch_stock,
                        pba.price as branch_price,
                        pba.is_active as branch_active,
                        b.name as branch_name
                    FROM product_branch_access pba
                    INNER JOIN branches b ON pba.branch_id = b.id
                    WHERE pba.product_id IN ($placeholders)
                      AND pba.is_active = true
                    ORDER BY pba.product_id, b.name ASC
                SQL;

                $branchesData = DB::select($branchesSql, $productIds);

                // Agrupar sedes por producto
                foreach ($branchesData as $branchData) {
                    $productId = $branchData->product_id;
                    if (!isset($productBranches[$productId])) {
                        $productBranches[$productId] = [];
                    }
                    $productBranches[$productId][] = [
                        'branch_id' => (int) $branchData->branch_id,
                        'branch_name' => $branchData->branch_name,
                        'stock_quantity' => (int) $branchData->branch_stock,
                        'price' => $branchData->branch_price ? floatval($branchData->branch_price) : null,
                        'is_active' => (bool) $branchData->branch_active
                    ];
                }

                // Obtener imágenes de productos
                $imagesSql = <<<SQL
                    SELECT 
                        product_id,
                        id,
                        file_path,
                        file_name,
                        created_at
                    FROM product_files
                    WHERE product_id IN ($placeholders)
                      AND file_type = 'imagen'
                    ORDER BY product_id, created_at ASC
                SQL;

                $imagesData = DB::select($imagesSql, $productIds);

                // Agrupar imágenes por producto
                $productImages = [];
                foreach ($imagesData as $imageData) {
                    $productId = $imageData->product_id;
                    if (!isset($productImages[$productId])) {
                        $productImages[$productId] = [];
                    }
                    
                    // Generar URL completa para la imagen
                    $imageUrl = $imageData->file_path;
                    if (!str_starts_with($imageUrl, 'http')) {
                        $imageUrl = asset($imageData->file_path);
                    }
                    
                    $productImages[$productId][] = [
                        'id' => (int) $imageData->id,
                        'file_path' => $imageData->file_path,
                        'file_name' => $imageData->file_name,
                        'url' => $imageUrl,
                        'created_at' => $imageData->created_at
                    ];
                }
            }

            // Para productos, usar SIEMPRE el precio de la sede específica, no el precio base
            $products = array_map(function ($product) use ($productBranches, $productImages) {
                $product = (array) $product;
                
                // CORREGIDO: Usar el precio de la sede específica (branch_price), no el precio base
                $product['final_price'] = $product['branch_price'] ? floatval($product['branch_price']) : 0;
                
                // Mantener tanto el precio base como el precio de sede para referencia
                $product['base_price'] = floatval($product['price']);
                $product['branch_price'] = $product['branch_price'] ? floatval($product['branch_price']) : 0;
                
                // Agregar lista de sedes asignadas
                $productId = $product['id'];
                $product['assigned_branches'] = $productBranches[$productId] ?? [];
                $product['assigned_branch_ids'] = array_column($product['assigned_branches'], 'branch_id');
                
                // Agregar imágenes del producto
                $product['images'] = $productImages[$productId] ?? [];
                
                return $product;
            }, $products);

            // Consulta para obtener todas las categorías activas (independiente de productos)
            $categoriesSql = <<<SQL
                SELECT 
                    pc.id,
                    pc.name,
                    COALESCE(product_counts.product_count, 0) as product_count
                FROM product_categories pc
                LEFT JOIN (
                    SELECT 
                        p.category_id,
                        COUNT(DISTINCT p.id) as product_count
                    FROM products p
                    INNER JOIN product_branch_access pba ON p.id = pba.product_id
                    WHERE pba.branch_id = ?
                      AND pba.is_active = true
                      AND p.is_active = true
                    GROUP BY p.category_id
                ) product_counts ON pc.id = product_counts.category_id
                WHERE pc.is_active = true
                ORDER BY pc.name ASC
            SQL;

            $categories = DB::select($categoriesSql, [$branchId]);

            return response()->json([
                'products' => $products,
                'categories' => $categories
            ]);

        } catch (\Exception $e) {
            Log::error('Error al obtener productos: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Error al obtener los productos'
            ], 500);
        }
    }

    /**
     * Obtener todas las categorías activas
     */
    public function getCategories()
    {
        try {
            $categories = DB::table('product_categories')
                ->where('is_active', true)
                ->orderBy('name', 'ASC')
                ->select('id', 'name')
                ->get();

            return response()->json([
                'success' => true,
                'categories' => $categories
            ]);

        } catch (\Exception $e) {
            Log::error('Error al obtener categorías: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener las categorías'
            ], 500);
        }
    }



    /**
     * Obtener datos para suscripciones
     */
    public function getSubscriptions(Request $request)
    {
        try {
            $branchId = $request->input('branch_id');
            
            if (!$branchId) {
                return response()->json(['message' => 'branch_id es requerido'], 400);
            }

            $sql = <<<SQL
                SELECT 
                    sp.id,
                    sp.name,
                    sp.description,
                    sp.price,
                    sp.duration_months,
                    sp.is_active as plan_active,
                    bsp.custom_price as branch_price,
                    bsp.is_active as branch_active
                FROM subscription_plans sp
                INNER JOIN branch_subscription_plans bsp ON sp.id = bsp.subscription_plan_id
                WHERE bsp.branch_id = ?
                  AND bsp.is_active = true
                  AND sp.is_active = true
                ORDER BY sp.name ASC
            SQL;

            $subscriptions = DB::select($sql, [$branchId]);

            // Obtener todas las sedes asignadas por plan de suscripción
            $subscriptionIds = array_column($subscriptions, 'id');
            $subscriptionBranches = []; // Inicializar siempre, incluso si no hay suscripciones
            
            if (!empty($subscriptionIds)) {
                $placeholders = str_repeat('?,', count($subscriptionIds) - 1) . '?';
                
                $branchesSql = <<<SQL
                    SELECT 
                        bsp.subscription_plan_id,
                        bsp.branch_id,
                        bsp.custom_price as branch_price,
                        bsp.is_active as branch_active,
                        b.name as branch_name
                    FROM branch_subscription_plans bsp
                    INNER JOIN branches b ON bsp.branch_id = b.id
                    WHERE bsp.subscription_plan_id IN ($placeholders)
                      AND bsp.is_active = true
                    ORDER BY bsp.subscription_plan_id, b.name ASC
                SQL;

                $branchesData = DB::select($branchesSql, $subscriptionIds);

                // Agrupar sedes por plan de suscripción
                foreach ($branchesData as $branchData) {
                    $subscriptionId = $branchData->subscription_plan_id;
                    if (!isset($subscriptionBranches[$subscriptionId])) {
                        $subscriptionBranches[$subscriptionId] = [];
                    }
                    $subscriptionBranches[$subscriptionId][] = [
                        'branch_id' => (int) $branchData->branch_id,
                        'branch_name' => $branchData->branch_name,
                        'custom_price' => $branchData->branch_price ? floatval($branchData->branch_price) : null,
                        'is_active' => (bool) $branchData->branch_active
                    ];
                }
            }

            // Para suscripciones, usar SIEMPRE el precio de la sede específica, no el precio base
            $subscriptions = array_map(function ($subscription) use ($subscriptionBranches) {
                $subscription = (array) $subscription;
                
                // CORREGIDO: Usar el precio de la sede específica (branch_price), no el precio base
                $subscription['final_price'] = $subscription['branch_price'] ? floatval($subscription['branch_price']) : 0;
                
                // Mantener tanto el precio base como el precio de sede para referencia
                $subscription['base_price'] = floatval($subscription['price']);
                $subscription['branch_price'] = $subscription['branch_price'] ? floatval($subscription['branch_price']) : 0;
                
                // Agregar lista de sedes asignadas
                $subscriptionId = $subscription['id'];
                $subscription['assigned_branches'] = $subscriptionBranches[$subscriptionId] ?? [];
                $subscription['assigned_branch_ids'] = array_column($subscription['assigned_branches'], 'branch_id');
                
                return $subscription;
            }, $subscriptions);

            return response()->json([
                'subscriptions' => $subscriptions
            ]);

        } catch (\Exception $e) {
            Log::error('Error al obtener suscripciones: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Error al obtener las suscripciones'
            ], 500);
        }
    }

    /**
     * Obtener datos para eventos
     */
    public function getEvents(Request $request)
    {
        try {
            $branchId = $request->input('branch_id');
            
            if (!$branchId) {
                return response()->json(['message' => 'branch_id es requerido'], 400);
            }

            $sql = <<<SQL
                SELECT 
                    e.id,
                    e.name,
                    e.description,
                    e.event_date,
                    e.registration_deadline,
                    e.price,
                    e.max_participants as base_max_participants,
                    e.current_participants as base_current_participants,
                    e.is_active as event_active,
                    eba.max_participants,
                    eba.custom_price as branch_price,
                    eba.current_participants,
                    eba.is_active as branch_active,
                    CASE 
                        WHEN e.event_date < CURDATE() OR e.registration_deadline < CURDATE() 
                        THEN 'vencido' 
                        ELSE 'disponible' 
                    END as event_status
                FROM events e
                INNER JOIN event_branch_access eba ON e.id = eba.event_id
                WHERE eba.branch_id = ?
                  AND eba.is_active = true
                  AND e.is_active = true
                ORDER BY e.event_date ASC
            SQL;

            $events = DB::select($sql, [$branchId]);

            // Obtener todas las sedes asignadas por evento
            $eventIds = array_column($events, 'id');
            $eventBranches = []; // Inicializar siempre, incluso si no hay eventos
            
            if (!empty($eventIds)) {
                $placeholders = str_repeat('?,', count($eventIds) - 1) . '?';
                
                $branchesSql = <<<SQL
                    SELECT 
                        eba.event_id,
                        eba.branch_id,
                        eba.custom_price as branch_price,
                        eba.max_participants as branch_max_participants,
                        eba.current_participants as branch_current_participants,
                        eba.is_active as branch_active,
                        b.name as branch_name
                    FROM event_branch_access eba
                    INNER JOIN branches b ON eba.branch_id = b.id
                    WHERE eba.event_id IN ($placeholders)
                      AND eba.is_active = true
                    ORDER BY eba.event_id, b.name ASC
                SQL;

                $branchesData = DB::select($branchesSql, $eventIds);

                // Agrupar sedes por evento
                foreach ($branchesData as $branchData) {
                    $eventId = $branchData->event_id;
                    if (!isset($eventBranches[$eventId])) {
                        $eventBranches[$eventId] = [];
                    }
                    $eventBranches[$eventId][] = [
                        'branch_id' => (int) $branchData->branch_id,
                        'branch_name' => $branchData->branch_name,
                        'custom_price' => $branchData->branch_price ? floatval($branchData->branch_price) : null,
                        'max_participants' => (int) $branchData->branch_max_participants,
                        'current_participants' => (int) $branchData->branch_current_participants,
                        'is_active' => (bool) $branchData->branch_active
                    ];
                }
            }

            // Para eventos, usar SIEMPRE el precio de la sede específica, no el precio base
            $events = array_map(function ($event) use ($eventBranches) {
                $event = (array) $event;
                
                // CORREGIDO: Usar el precio de la sede específica (branch_price), no el precio base
                $event['final_price'] = $event['branch_price'] ? floatval($event['branch_price']) : 0;
                
                // Mantener tanto el precio base como el precio de sede para referencia
                $event['base_price'] = floatval($event['price']);
                $event['branch_price'] = $event['branch_price'] ? floatval($event['branch_price']) : 0;
                
                // Agregar lista de sedes asignadas
                $eventId = $event['id'];
                $event['assigned_branches'] = $eventBranches[$eventId] ?? [];
                $event['assigned_branch_ids'] = array_column($event['assigned_branches'], 'branch_id');
                
                return $event;
            }, $events);

            return response()->json([
                'events' => $events
            ]);

        } catch (\Exception $e) {
            Log::error('Error al obtener eventos: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Error al obtener los eventos'
            ], 500);
        }
    }

    /**
     * Upload de imagen temporal para productos
     */
    public function uploadProductImage(Request $request)
    {
        try {
            $request->validate([
                'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:10240'
            ]);

            // Crear directorio temporal si no existe
            $tempPath = public_path('storage/temp/productos');
            if (!file_exists($tempPath)) {
                mkdir($tempPath, 0755, true);
            }

            // Generar nombre único para la imagen
            $fileName = uniqid() . '_' . time() . '.' . $request->file('image')->getClientOriginalExtension();
            $filePath = $tempPath . '/' . $fileName;

            // Mover imagen al directorio temporal
            $request->file('image')->move($tempPath, $fileName);

            return response()->json([
                'success' => true,
                'temp_id' => $fileName,
                'original_name' => $request->file('image')->getClientOriginalName(),
                'size' => filesize($filePath),
                'url' => asset('storage/temp/productos/' . $fileName)
            ]);

        } catch (\Exception $e) {
            Log::error('Error en upload de imagen de producto: ' . $e->getMessage());
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
            $tempDir = public_path('storage/temp/productos');
            
            if (!is_dir($tempDir)) {
                return;
            }

            $processedFiles = array_map(function($img) {
                return $img['temp_id'] ?? null;
            }, $processedImages);
            
            $processedFiles = array_filter($processedFiles);

            $files = glob($tempDir . '/*');
            $cutoff = now()->subHours(2)->timestamp;

            foreach ($files as $file) {
                if (is_file($file)) {
                    $filename = basename($file);
                    
                    if (!in_array($filename, $processedFiles) && filemtime($file) < $cutoff) {
                        unlink($file);
                    }
                }
            }
        } catch (\Exception $e) {
            Log::warning('Error al limpiar archivos temporales: ' . $e->getMessage());
        }
    }

    /**
     * Actualizar plan de suscripción con acceso por sedes
     */
    public function updateSubscription(Request $request)
    {
        try {
            $data = $request->all();
            $mode = $data['mode'];

            // Validaciones dinámicas según el modo
            $validationRules = [
                'mode' => 'required|string|in:create,edit',
                'subscription' => 'required|array',
                'subscription.name' => 'required|string|max:255',
                'subscription.description' => 'nullable|string',
                'subscription.duration_months' => 'required|integer|min:1|max:60',
                'branches' => 'required|array|min:1',
                'branches.*.branch_id' => 'required|exists:branches,id',
                'branches.*.custom_price' => 'required|numeric|min:0',
                'metadata' => 'nullable|array'
            ];

            if ($mode === 'create') {
                // En creación, el precio base es requerido
                $validationRules['subscription.price'] = 'required|numeric|min:0';
            } elseif ($mode === 'edit') {
                // En edición, el precio base es opcional (se usa el de cada sede)
                $validationRules['subscription.price'] = 'nullable|numeric|min:0';
                $validationRules['subscription.id'] = 'required|exists:subscription_plans,id';
            }

            $request->validate($validationRules);

            $subscriptionData = $data['subscription'];
            $branchesData = $data['branches'];

            Log::info('========== ACTUALIZANDO PLAN DE SUSCRIPCIÓN ==========', [
                'mode' => $mode,
                'subscription_name' => $subscriptionData['name'],
                'branches_count' => count($branchesData),
                'duration_months' => $subscriptionData['duration_months']
            ]);

            DB::beginTransaction();

            if ($mode === 'create') {
                // ===== CREAR NUEVO PLAN DE SUSCRIPCIÓN =====
                
                // Para creación, usar el precio del plan o el precio de la primera sede
                $basePrice = $subscriptionData['price'] ?? $branchesData[0]['custom_price'] ?? 0;
                
                // 1. Insertar en tabla subscription_plans
                $subscriptionId = DB::table('subscription_plans')->insertGetId([
                    'name' => $subscriptionData['name'],
                    'description' => $subscriptionData['description'] ?? null,
                    'price' => $basePrice,
                    'duration_months' => $subscriptionData['duration_months'],
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                Log::info('Plan de suscripción creado', ['subscription_id' => $subscriptionId, 'base_price' => $basePrice]);

            } elseif ($mode === 'edit') {
                // ===== EDITAR PLAN DE SUSCRIPCIÓN EXISTENTE =====
                
                $subscriptionId = $subscriptionData['id'] ?? null;
                if (!$subscriptionId) {
                    throw new \Exception('ID de plan de suscripción requerido para edición');
                }

                // Verificar que el plan existe
                $existingSubscription = DB::table('subscription_plans')->where('id', $subscriptionId)->where('is_active', true)->first();
                if (!$existingSubscription) {
                    throw new \Exception('Plan de suscripción no encontrado');
                }

                // Para edición, usar el precio enviado o mantener el actual, o usar el precio de la primera sede
                $basePrice = $subscriptionData['price'] ?? $existingSubscription->price ?? $branchesData[0]['custom_price'] ?? 0;

                // 1. Actualizar tabla subscription_plans
                DB::table('subscription_plans')->where('id', $subscriptionId)->update([
                    'name' => $subscriptionData['name'],
                    'description' => $subscriptionData['description'] ?? null,
                    'price' => $basePrice,
                    'duration_months' => $subscriptionData['duration_months'],
                    'updated_at' => now(),
                ]);

                Log::info('Plan de suscripción actualizado', ['subscription_id' => $subscriptionId, 'base_price' => $basePrice]);
            }

            // ===== GESTIONAR ACCESO POR SEDES =====
            
            if ($mode === 'edit') {
                // Para edición, eliminar accesos existentes y recrear
                DB::table('branch_subscription_plans')->where('subscription_plan_id', $subscriptionId)->delete();
                Log::info('Accesos por sede eliminados para recrear');
            }

            // Insertar o recrear accesos por sede
            foreach ($branchesData as $branch) {
                // Usar precio de sede específico, o el precio base del plan, o 0
                $branchPrice = $branch['custom_price'] ?? $subscriptionData['price'] ?? 0;
                
                DB::table('branch_subscription_plans')->insert([
                    'subscription_plan_id' => $subscriptionId,
                    'branch_id' => $branch['branch_id'],
                    'custom_price' => $branchPrice,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            Log::info('Accesos por sede configurados para suscripción', ['branches_count' => count($branchesData)]);

            DB::commit();

            Log::info('Plan de suscripción procesado exitosamente', [
                'subscription_id' => $subscriptionId,
                'mode' => $mode
            ]);

            return response()->json([
                'success' => true,
                'message' => $mode === 'create' ? 'Plan de suscripción creado exitosamente' : 'Plan de suscripción actualizado exitosamente',
                'subscription_id' => $subscriptionId
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al procesar plan de suscripción: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar el plan de suscripción: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar evento con acceso por sedes
     */
    public function updateEvent(Request $request)
    {
        try {
            $data = $request->all();
            $mode = $data['mode'];

            // Validaciones dinámicas según el modo
            $validationRules = [
                'mode' => 'required|string|in:create,edit',
                'event' => 'required|array',
                'event.name' => 'required|string|max:255',
                'event.description' => 'nullable|string',
                'event.event_date' => 'required|date_format:Y-m-d|after_or_equal:' . now()->format('Y-m-d'),
                'event.registration_deadline' => 'required|date_format:Y-m-d|before:event.event_date',
                'event.max_participants' => 'required|integer|min:1',
                'branches' => 'required|array|min:1',
                'branches.*.branch_id' => 'required|exists:branches,id',
                'branches.*.custom_price' => 'required|numeric|min:0',
                'branches.*.max_participants' => 'required|integer|min:1',
                'metadata' => 'nullable|array'
            ];

            if ($mode === 'create') {
                // En creación, el precio base es requerido
                $validationRules['event.price'] = 'required|numeric|min:0';
            } elseif ($mode === 'edit') {
                // En edición, el precio base es opcional (se usa el de cada sede)
                $validationRules['event.price'] = 'nullable|numeric|min:0';
                $validationRules['event.id'] = 'required|exists:events,id';
                
                // 🔒 VALIDACIÓN: No permitir editar eventos vencidos
                $eventId = $data['event']['id'];
                $existingEvent = DB::table('events')->where('id', $eventId)->first();
                
                if ($existingEvent) {
                    $eventDate = Carbon::parse($existingEvent->event_date);
                    $registrationDeadline = Carbon::parse($existingEvent->registration_deadline);
                    $today = Carbon::today();
                    
                    if ($eventDate->lt($today) || $registrationDeadline->lt($today)) {
                        return response()->json([
                            'success' => false,
                            'message' => 'No se puede editar un evento vencido. El evento o su fecha límite de registro ya han pasado.'
                        ], 422);
                    }
                }
            }

            $request->validate($validationRules);

            $eventData = $data['event'];
            $branchesData = $data['branches'];

            Log::info('========== ACTUALIZANDO EVENTO ==========', [
                'mode' => $mode,
                'event_name' => $eventData['name'],
                'event_date' => $eventData['event_date'],
                'registration_deadline' => $eventData['registration_deadline'],
                'branches_count' => count($branchesData),
                'max_participants' => $eventData['max_participants']
            ]);

            DB::beginTransaction();

            if ($mode === 'create') {
                // ===== CREAR NUEVO EVENTO =====
                
                // Para creación, usar el precio del evento o el precio de la primera sede
                $basePrice = $eventData['price'] ?? $branchesData[0]['custom_price'] ?? 0;
                
                // 1. Insertar en tabla events
                $eventId = DB::table('events')->insertGetId([
                    'name' => $eventData['name'],
                    'description' => $eventData['description'] ?? null,
                    'event_date' => $eventData['event_date'],
                    'registration_deadline' => $eventData['registration_deadline'],
                    'price' => $basePrice,
                    'max_participants' => $eventData['max_participants'],
                    'current_participants' => 0, // Siempre inicia en 0
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                Log::info('Evento creado', [
                    'event_id' => $eventId, 
                    'base_price' => $basePrice,
                    'event_date' => $eventData['event_date'],
                    'registration_deadline' => $eventData['registration_deadline']
                ]);

            } elseif ($mode === 'edit') {
                // ===== EDITAR EVENTO EXISTENTE =====
                
                $eventId = $eventData['id'] ?? null;
                if (!$eventId) {
                    throw new \Exception('ID de evento requerido para edición');
                }

                // Verificar que el evento existe
                $existingEvent = DB::table('events')->where('id', $eventId)->where('is_active', true)->first();
                if (!$existingEvent) {
                    throw new \Exception('Evento no encontrado');
                }

                // Para edición, usar el precio enviado o mantener el actual, o usar el precio de la primera sede
                $basePrice = $eventData['price'] ?? $existingEvent->price ?? $branchesData[0]['custom_price'] ?? 0;

                // 1. Actualizar tabla events
                DB::table('events')->where('id', $eventId)->update([
                    'name' => $eventData['name'],
                    'description' => $eventData['description'] ?? null,
                    'event_date' => $eventData['event_date'],
                    'registration_deadline' => $eventData['registration_deadline'],
                    'price' => $basePrice,
                    'max_participants' => $eventData['max_participants'],
                    'updated_at' => now(),
                ]);

                Log::info('Evento actualizado', [
                    'event_id' => $eventId, 
                    'base_price' => $basePrice,
                    'event_date' => $eventData['event_date'],
                    'registration_deadline' => $eventData['registration_deadline']
                ]);
            }

            // ===== GESTIONAR ACCESO POR SEDES =====
            
            if ($mode === 'edit') {
                // Para edición, eliminar accesos existentes y recrear
                DB::table('event_branch_access')->where('event_id', $eventId)->delete();
                Log::info('Accesos por sede eliminados para recrear');
            }

            // Insertar o recrear accesos por sede
            foreach ($branchesData as $branch) {
                // Usar precio de sede específico, o el precio base del evento, o 0
                $branchPrice = $branch['custom_price'] ?? $eventData['price'] ?? 0;
                $branchMaxParticipants = $branch['max_participants'] ?? $eventData['max_participants'] ?? 50;
                
                DB::table('event_branch_access')->insert([
                    'event_id' => $eventId,
                    'branch_id' => $branch['branch_id'],
                    'custom_price' => $branchPrice,
                    'max_participants' => $branchMaxParticipants,
                    'current_participants' => 0, // Siempre inicia en 0 para nuevos eventos o se mantiene para edición
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            Log::info('Accesos por sede configurados para evento', ['branches_count' => count($branchesData)]);

            DB::commit();

            Log::info('Evento procesado exitosamente', [
                'event_id' => $eventId,
                'mode' => $mode
            ]);

            return response()->json([
                'success' => true,
                'message' => $mode === 'create' ? 'Evento creado exitosamente' : 'Evento actualizado exitosamente',
                'event_id' => $eventId
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al procesar evento: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar el evento: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar producto con imágenes y acceso por sedes
     */
    public function updateProduct(Request $request)
    {
        try {
            $data = $request->all();
            $mode = $data['mode'];

            // Validaciones dinámicas según el modo
            $validationRules = [
                'mode' => 'required|string|in:create,edit',
                'product' => 'required|array',
                'product.name' => 'required|string|max:255',
                'product.description' => 'nullable|string',
                'product.category_id' => 'required|exists:product_categories,id',
                'branches' => 'required|array|min:1',
                'branches.*.branch_id' => 'required|exists:branches,id',
                'branches.*.stock_quantity' => 'required|integer|min:0',
                'branches.*.price' => 'nullable|numeric|min:0',
                'images' => 'nullable|array',
                'metadata' => 'nullable|array'
            ];

            if ($mode === 'create') {
                // En creación, el precio base es requerido
                $validationRules['product.price'] = 'required|numeric|min:0';
            } elseif ($mode === 'edit') {
                // En edición, el precio base es opcional (se usa el de cada sede)
                $validationRules['product.price'] = 'nullable|numeric|min:0';
                $validationRules['product.id'] = 'required|exists:products,id';
            }

            $request->validate($validationRules);

            $productData = $data['product'];
            $branchesData = $data['branches'];
            $imagesData = $data['images'] ?? [];

            Log::info('========== ACTUALIZANDO PRODUCTO ==========', [
                'mode' => $mode,
                'product_name' => $productData['name'],
                'branches_count' => count($branchesData),
                'images_count' => count($imagesData)
            ]);

            DB::beginTransaction();

            if ($mode === 'create') {
                // ===== CREAR NUEVO PRODUCTO =====
                
                // Para creación, usar el precio del producto o el precio de la primera sede
                $basePrice = $productData['price'] ?? $branchesData[0]['price'] ?? 0;
                
                // 1. Insertar en tabla products
                $productId = DB::table('products')->insertGetId([
                    'category_id' => $productData['category_id'],
                    'name' => $productData['name'],
                    'description' => $productData['description'] ?? null,
                    'price' => $basePrice,
                    'stock_quantity' => 0, // stock base siempre 0, se maneja por sede
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                Log::info('Producto creado', ['product_id' => $productId, 'base_price' => $basePrice]);

            } elseif ($mode === 'edit') {
                // ===== EDITAR PRODUCTO EXISTENTE =====
                
                $productId = $productData['id'] ?? null;
                if (!$productId) {
                    throw new \Exception('ID de producto requerido para edición');
                }

                // Verificar que el producto existe
                $existingProduct = DB::table('products')->where('id', $productId)->where('is_active', true)->first();
                if (!$existingProduct) {
                    throw new \Exception('Producto no encontrado');
                }

                // Para edición, usar el precio enviado o mantener el actual, o usar el precio de la primera sede
                $basePrice = $productData['price'] ?? $existingProduct->price ?? $branchesData[0]['price'] ?? 0;

                // 1. Actualizar tabla products
                DB::table('products')->where('id', $productId)->update([
                    'category_id' => $productData['category_id'],
                    'name' => $productData['name'],
                    'description' => $productData['description'] ?? null,
                    'price' => $basePrice,
                    'updated_at' => now(),
                ]);

                Log::info('Producto actualizado', ['product_id' => $productId, 'base_price' => $basePrice]);
            }

            // ===== GESTIONAR ACCESO POR SEDES =====
            
            if ($mode === 'edit') {
                // Para edición, eliminar accesos existentes y recrear
                DB::table('product_branch_access')->where('product_id', $productId)->delete();
                Log::info('Accesos por sede eliminados para recrear');
            }

            // Insertar o recrear accesos por sede
            foreach ($branchesData as $branch) {
                // Usar precio de sede específico, o el precio base del producto, o 0
                $branchPrice = $branch['price'] ?? $productData['price'] ?? 0;
                
                DB::table('product_branch_access')->insert([
                    'product_id' => $productId,
                    'branch_id' => $branch['branch_id'],
                    'stock_quantity' => $branch['stock_quantity'],
                    'price' => $branchPrice,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            Log::info('Accesos por sede configurados', ['branches_count' => count($branchesData)]);

            // ===== GESTIONAR IMÁGENES =====
            
            if (!empty($imagesData)) {
                Log::info('Procesando imágenes', ['images_meta' => $imagesData]);

                if ($mode === 'edit') {
                    // Para edición, obtener imágenes existentes
                    $existingImages = DB::table('product_files')
                        ->where('product_id', $productId)
                        ->where('file_type', 'imagen')
                        ->get();
                    $existingImageIds = $existingImages->pluck('id')->toArray();

                    // Separar imágenes nuevas y existentes que se mantienen
                    $imagesToKeep = [];
                    $newImages = [];

                    foreach ($imagesData as $img) {
                        Log::info('Evaluando imagen', [
                            'temp_id' => $img['temp_id'] ?? 'no_temp_id',
                            'isNew' => $img['isNew'] ?? 'no_isNew',
                            'isExisting' => $img['isExisting'] ?? 'no_isExisting',
                            'id' => $img['id'] ?? 'no_id'
                        ]);

                        if (isset($img['isExisting']) && $img['isExisting'] && isset($img['id'])) {
                            // Imagen existente que se mantiene
                            $imagesToKeep[] = $img['id'];
                            Log::info('Imagen marcada para mantener', ['id' => $img['id']]);
                        } elseif (isset($img['temp_id']) && !empty($img['temp_id'])) {
                            // Imagen nueva con temp_id
                            $newImages[] = $img;
                            Log::info('Imagen nueva identificada', [
                                'temp_id' => $img['temp_id'],
                                'name' => $img['name'] ?? 'no_name'
                            ]);
                        }
                    }

                    // Eliminar imágenes que ya no están en la lista
                    $imagesToDelete = array_diff($existingImageIds, $imagesToKeep);
                    if (!empty($imagesToDelete)) {
                        Log::info('Eliminando imágenes no utilizadas', ['images_to_delete' => $imagesToDelete]);

                        // Obtener rutas de archivos a eliminar del disco
                        $filesToDelete = DB::table('product_files')
                            ->whereIn('id', $imagesToDelete)
                            ->pluck('file_path')
                            ->toArray();

                        // Eliminar archivos del disco
                        foreach ($filesToDelete as $filePath) {
                            $fullPath = public_path($filePath);
                            if (file_exists($fullPath)) {
                                unlink($fullPath);
                                Log::info('Archivo eliminado', ['path' => $fullPath]);
                            }
                        }

                        // Eliminar registros de la base de datos
                        DB::table('product_files')->whereIn('id', $imagesToDelete)->delete();
                    }
                } else {
                    // Para creación, todas las imágenes son nuevas
                    $newImages = array_filter($imagesData, function($img) {
                        return isset($img['temp_id']) && !empty($img['temp_id']);
                    });
                }

                // Procesar imágenes nuevas
                if (!empty($newImages)) {
                    Log::info('Procesando imágenes nuevas', [
                        'cantidad' => count($newImages),
                        'new_images' => $newImages
                    ]);

                    // Crear directorio definitivo para las imágenes del producto
                    $definitiveImagePath = 'storage/productos/' . $productId;
                    $fullDefinitivePath = public_path($definitiveImagePath);

                    if (!file_exists($fullDefinitivePath)) {
                        mkdir($fullDefinitivePath, 0755, true);
                        Log::info('Directorio creado', ['path' => $fullDefinitivePath]);
                    }

                    foreach ($newImages as $img) {
                        if (isset($img['temp_id']) && !empty($img['temp_id'])) {
                            $tempFilePath = public_path('storage/temp/productos/' . $img['temp_id']);
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
                                    $insertedId = DB::table('product_files')->insertGetId([
                                        'product_id' => $productId,
                                        'file_path' => $relativeDefinitivePath,
                                        'file_name' => $definitiveFileName,
                                        'file_type' => 'imagen',
                                        'created_at' => now(),
                                        'updated_at' => now(),
                                    ]);
                                    Log::info('Imagen guardada exitosamente', [
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
                        }
                    }

                    // Limpiar archivos temporales no utilizados
                    $this->cleanUpUnusedTempFiles($newImages);
                }
            }

            DB::commit();

            Log::info('Producto procesado exitosamente', [
                'product_id' => $productId,
                'mode' => $mode
            ]);

            return response()->json([
                'success' => true,
                'message' => $mode === 'create' ? 'Producto creado exitosamente' : 'Producto actualizado exitosamente',
                'product_id' => $productId
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al procesar producto: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error al procesar el producto: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Soft delete de evento con validación de vencimiento
     */
    public function deleteEvent(Request $request)
    {
        try {
            $request->validate(['event_id' => 'required|exists:events,id']);
            $eventId = $request->input('event_id');
            
            $event = DB::table('events')->where('id', $eventId)->first();
            if (!$event) {
                return response()->json(['success' => false, 'message' => 'El evento no existe'], 404);
            }

            // Validar si está vencido
            $eventDate = Carbon::parse($event->event_date);
            $registrationDeadline = Carbon::parse($event->registration_deadline);
            $today = Carbon::today();
            
            if ($eventDate->lt($today) || $registrationDeadline->lt($today)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No se puede eliminar un evento vencido'
                ], 422);
            }

            DB::beginTransaction();
            
            // Soft delete del evento y sus accesos
            DB::table('events')->where('id', $eventId)->update(['is_active' => false]);
            DB::table('event_branch_access')->where('event_id', $eventId)->update(['is_active' => false]);
            
            DB::commit();

            return response()->json(['success' => true, 'message' => 'Evento eliminado exitosamente']);

        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error al eliminar evento: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error al eliminar evento'], 500);
        }
    }

    /**
     * Soft delete de producto
     */
    public function deleteProduct(Request $request)
    {
        try {
            $request->validate(['product_id' => 'required|exists:products,id']);
            $productId = $request->input('product_id');

            DB::beginTransaction();
            
            // Soft delete del producto y sus accesos
            DB::table('products')->where('id', $productId)->update(['is_active' => false]);
            DB::table('product_branch_access')->where('product_id', $productId)->update(['is_active' => false]);
            
            DB::commit();

            return response()->json(['success' => true, 'message' => 'Producto eliminado exitosamente']);

        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error al eliminar producto: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error al eliminar producto'], 500);
        }
    }

    /**
     * Soft delete de plan de suscripción
     */
    public function deleteSubscription(Request $request)
    {
        try {
            $request->validate(['subscription_id' => 'required|exists:subscription_plans,id']);
            $subscriptionId = $request->input('subscription_id');

            DB::beginTransaction();
            
            // Soft delete del plan y sus accesos
            DB::table('subscription_plans')->where('id', $subscriptionId)->update(['is_active' => false]);
            DB::table('branch_subscription_plans')->where('subscription_plan_id', $subscriptionId)->update(['is_active' => false]);
            
            DB::commit();

            return response()->json(['success' => true, 'message' => 'Plan de suscripción eliminado exitosamente']);

        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Error al eliminar plan: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error al eliminar plan'], 500);
        }
    }
}
