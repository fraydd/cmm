<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

use Inertia\Inertia;
use Illuminate\Http\Request;

class StoreController extends Controller
{
    public function index(Request $request)
    {
        $identificacion = $request->input('identificacion');
        if ($identificacion) {
            return Inertia::render('Admin/Store/Index', [
                'identificacion' => $identificacion
            ]);
        } else {
            return Inertia::render('Admin/Store/Index');
        }
    }

    public function getCatalog(Request $request)
    {
        $branchId = $request->input('branch_id');
        if (!$branchId) {
            return response()->json(['message' => 'Branch ID is required'], 400);
        }

        $productos = DB::select(<<<SQL
            SELECT
            p.id,
            p.name,
            pc.name as categoryName,
            p.description,
            p.price,
            pba.stock_quantity,
            GROUP_CONCAT(pf.file_path) as images
            FROM products p
            INNER JOIN product_categories pc ON p.category_id = pc.id
            INNER JOIN product_branch_access pba ON p.id = pba.product_id
            LEFT JOIN product_files pf ON p.id = pf.product_id
            WHERE pba.branch_id = ?
            AND pba.is_active = true
            GROUP BY
            p.id, p.name, pc.name, p.description, p.price, pba.stock_quantity
        SQL, [$branchId]);

        // Consulta unificada de suscripciones con cantidad de usuarios, popularidad y sedes de acceso
        $suscripciones = DB::select(<<<SQL
            SELECT
                sp.id,
                sp.name,
                bsp.custom_price as branch_price,
                sp.price,
                sp.description,
                sp.duration_months,
                COUNT(s.id) as cantidad_usuarios,
                (
                    SELECT GROUP_CONCAT(b.name SEPARATOR ', ')
                    FROM branch_subscription_plans bsp2
                    INNER JOIN branches b ON bsp2.branch_id = b.id
                    WHERE bsp2.subscription_plan_id = sp.id AND bsp2.is_active = 1
                ) as branches_access
            FROM subscription_plans sp
            INNER JOIN branch_subscription_plans bsp ON sp.id = bsp.subscription_plan_id
            LEFT JOIN subscriptions s ON s.subscription_plan_id = sp.id
            WHERE bsp.branch_id = ?
              AND bsp.is_active = 1
              AND sp.is_active = 1
            GROUP BY sp.id, sp.name, bsp.custom_price, sp.price, sp.description, sp.duration_months
        SQL, [$branchId]);

        // Determinar la suscripción más popular
        $maxUsuarios = 0;
        foreach ($suscripciones as $s) {
            if ($s->cantidad_usuarios > $maxUsuarios) {
                $maxUsuarios = $s->cantidad_usuarios;
            }
        }
        foreach ($suscripciones as $s) {
            $s->es_popular = ($s->cantidad_usuarios == $maxUsuarios && $maxUsuarios > 0);
            // Lógica de precio preferente por sede
            $precio = null;
            if (isset($s->branch_price) && $s->branch_price !== null && $s->branch_price !== '' && is_numeric($s->branch_price) && floatval($s->branch_price) > 0) {
                $precio = floatval($s->branch_price);
            } else {
                $precio = floatval($s->price);
            }
            $s->price = '$' . number_format($precio, 0, ',', '.');
        }

        // Formatear el precio a pesos colombianos y las imágenes como array
        $productos = array_map(function ($producto) {
            $producto = (array) $producto;
            $producto['price'] = '$' . number_format($producto['price'], 0, ',', '.');
            // Procesar imágenes: convertir string a array, o array vacío si null/vacío
            if (!empty($producto['images'])) {
                $producto['images'] = array_filter(explode(',', $producto['images']));
            } else {
                $producto['images'] = [];
            }
            return $producto;
        }, $productos);

        // Consulta de eventos filtrando por branch, activos y fechas
        $eventos = DB::select(<<<SQL
            SELECT 
                e.id,
                e.name,
                eba.custom_price as branch_price,
                e.price,
                e.description,
                eba.max_participants,
                eba.current_participants,
                e.event_date
            FROM events e
            INNER JOIN event_branch_access eba ON e.id = eba.event_id
            WHERE eba.branch_id = ?
              AND eba.is_active = 1
              AND e.is_active = 1
              AND e.registration_deadline >= CURDATE()
              AND e.event_date >= CURDATE()
        SQL, [$branchId]);

        // Formatear el precio de eventos usando el custom_price de la sede si es válido, si no el de evento
        $eventos = array_map(function ($evento) {
            $evento = (array) $evento;
            $precio = null;
            if (isset($evento['branch_price']) && $evento['branch_price'] !== null && $evento['branch_price'] !== '' && is_numeric($evento['branch_price']) && floatval($evento['branch_price']) > 0) {
                $precio = floatval($evento['branch_price']);
            } else {
                $precio = floatval($evento['price']);
            }
            $evento['price'] = '$' . number_format($precio, 0, ',', '.');
            return $evento;
        }, $eventos);

        return response()->json([
            'productos' => $productos,
            'suscripciones' => $suscripciones,
            'eventos' => $eventos
        ]);
    }

    public function searchPerson(Request $request)
    {

        try {

            $persona = DB::select(<<<SQL
                SELECT p.id,
                CONCAT(p.first_name,' ', p.last_name) AS name,
                p.identification_number AS identification
                FROM people p
                WHERE p.identification_number = ?
            SQL, [$request->input('identificacion')]);

            if (empty($persona)) {
                return response()->json(['message' => 'Persona no registrada'], 404);
            }

            $cantidad = $this->cartCount($persona[0]->id, $request->input('branch_id'));
            $personaArr = [
                'id' => $persona[0]->id,
                'name' => $persona[0]->name,
                'identification' => $persona[0]->identification,
                'cart_count' => $cantidad
            ];
            return response()->json($personaArr);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al buscar persona'], 500);
        }
    }

    public function addToCart(Request $request)
    {
        // Validación de campos obligatorios
        $validated = $request->validate([
            'branch_id' => 'required|integer',
            'person_id' => 'required|integer',
            'type' => 'required|string',
            'id' => 'required|integer',
        ]);

        Log::info('Validated data:', $validated);

        try {
            $personId = $request->input('person_id');
            $type = $request->input('type'); // 'product', 'event', 'subscription'
            $quantity = 1;
            $productId = null;
            $eventId = null;
            $subscriptionId = null;
            $unitPrice = 0;
            $totalPrice = 0;
            $itemTypeId = null;
            $fechaFin = null;


            switch ($type) {
                case 'product':
                    $itemTypeId = 1;
                    $productId = $request->input('id');
                    $product = DB::table('products')->where('id', $productId)->first();
                    if (!$product) {
                        return response()->json(['message' => 'Producto no encontrado'], 404);
                    }
                    // Validar que no exista ya un registro igual en el carrito
                    $existe = DB::table('cart')
                        ->where('person_id', $personId)
                        ->where('product_id', $productId)
                        ->first();
                    if ($existe) {
                        return response()->json(['message' => 'Este producto ya está en el carrito.'], 409);
                    }
                    $branchId = $request->input('branch_id');
                    $producto = DB::selectOne(<<<SQL
                        select 
                        p.id, p.name, p.price,
                        pba.price as branch_price
                        from products p 
                        inner join product_branch_access pba on p.id = pba.product_id
                        where p.id = ? and pba.branch_id = ?
                    SQL, [$productId, $branchId]);
                    if (!$producto) {
                        return response()->json(['message' => 'Producto no encontrado'], 404);
                    }
                    // Tomar el precio de la sede si existe, no es vacío, es numérico y mayor que cero; si no, el del producto
                    if (
                        isset($producto->branch_price)
                        && $producto->branch_price !== null
                        && $producto->branch_price !== ''
                        && is_numeric($producto->branch_price)
                        && (float)$producto->branch_price > 0
                    ) {
                        $unitPrice = (float) $producto->branch_price;
                    } else {
                        $unitPrice = (float) $producto->price;
                    }

                    // Restar 1 al stock en product_branch_access
                    DB::table('product_branch_access')
                        ->where('product_id', $productId)
                        ->where('branch_id', $branchId)
                        ->decrement('stock_quantity', 1);
                    break;

                case 'Suscripción':
                    $itemTypeId = 2;
                    $subscriptionId = $request->input('id');
                    $branchId = $request->input('branch_id');

                    // Validación: solo una suscripción por persona por sede en el carrito

                    $suscripcionesEnCarrito = DB::table('cart')
                        ->where('person_id', $personId)
                        ->where('branch_id', $branchId)
                        ->whereNotNull('subscription_id')
                        ->count();
                    if ($suscripcionesEnCarrito > 0) {
                        return response()->json(['message' => 'Solo puedes tener una suscripción en el carrito a la vez. Elimina la anterior para agregar una nueva.'], 409);
                    }

                    // consultar la fecha en la que finaliza la suscripcion que mas vigencia tiene 
                    $fechaFin = DB::selectOne(
                        "SELECT s.end_date
                            FROM subscriptions s
                            INNER JOIN models m ON s.model_id = m.id
                            WHERE m.person_id = ?
                            ORDER BY s.end_date DESC
                            LIMIT 1",
                        [$personId]
                    );

                    // Si no hay suscripciones, usar la fecha actual (hoy)
                    $hoy = now()->toDateString();
                    if ($fechaFin && isset($fechaFin->end_date)) {
                        $fechaFinValue = \Carbon\Carbon::parse($fechaFin->end_date)->addDay()->toDateString();
                        // Si la fecha fin es menor que hoy, usar hoy
                        $fechaFin = ($fechaFinValue < $hoy) ? $hoy : $fechaFinValue;
                    } else {
                        $fechaFin = $hoy;
                    }

                    // Validar que el plan esté activo para la sede y obtener custom_price
                    $plan = DB::selectOne(<<<SQL
                        SELECT sp.*, bsp.custom_price
                        FROM subscription_plans sp
                        INNER JOIN branch_subscription_plans bsp ON sp.id = bsp.subscription_plan_id
                        WHERE bsp.branch_id = ?
                          AND bsp.is_active = 1
                          AND sp.is_active = 1
                          AND sp.id = ?
                    SQL, [$branchId, $subscriptionId]);
                    if (!$plan) {
                        return response()->json(['message' => 'El plan de suscripción no está disponible para esta sede'], 404);
                    }
                    // Elegir primero el custom_price de la sede, si es válido, si no el del plan
                    if (isset($plan->custom_price) && $plan->custom_price !== null && $plan->custom_price !== '' && is_numeric($plan->custom_price) && floatval($plan->custom_price) > 0) {
                        $unitPrice = floatval($plan->custom_price);
                    } else {
                        $unitPrice = is_numeric($plan->price) ? floatval($plan->price) : floatval(preg_replace('/[^\d.]/', '', $plan->price));
                    }
                    break;

                case 'Evento':
                    $eventId = $request->input('id');
                    $branchId = $request->input('branch_id');
                    // Validar que no exista ya un registro igual en el carrito para este evento
                    $existeEvento = DB::table('cart')
                        ->where('person_id', $personId)
                        ->where('event_id', $eventId)
                        ->first();
                    if ($existeEvento) {
                        return response()->json(['message' => 'Este evento ya está en el carrito.'], 409);
                    }
                    // Validar que el evento esté disponible para la sede, activo y fechas válidas
                    $evento = DB::selectOne(<<<SQL
                        SELECT e.*, eba.custom_price as branch_price, eba.max_participants, eba.current_participants
                        FROM events e
                        INNER JOIN event_branch_access eba ON e.id = eba.event_id
                        WHERE eba.branch_id = ?
                          AND eba.is_active = 1
                          AND e.is_active = 1
                          AND e.registration_deadline >= CURDATE()
                          AND e.event_date >= CURDATE()
                          AND e.id = ?
                    SQL, [$branchId, $eventId]);
                    if (!$evento) {
                        return response()->json(['message' => 'El evento no está disponible para esta sede o ya no está activo'], 404);
                    }

                    // Validar cupos disponibles
                    $cuposDisponibles = ($evento->max_participants ?? 0) - ($evento->current_participants ?? 0);
                    if ($cuposDisponibles < 1) {
                        return response()->json(['message' => 'No hay cupos disponibles para este evento.'], 409);
                    }

                    // incrementar en 1 la cantidad de current_participants
                    DB::table('event_branch_access')
                        ->where('event_id', $evento->id)
                        ->where('branch_id', $branchId)
                        ->increment('current_participants', $quantity);

                    // Tomar el precio de la sede si existe, si no el del evento
                    if (isset($evento->branch_price) && $evento->branch_price !== null && $evento->branch_price !== '' && is_numeric($evento->branch_price) && floatval($evento->branch_price) > 0) {
                        $unitPrice = floatval($evento->branch_price);
                    } else {
                        $unitPrice = is_numeric($evento->price) ? floatval($evento->price) : floatval(preg_replace('/[^\d.]/', '', $evento->price));
                    }
                    $itemTypeId = 3;
                    break;
                default:
                    return response()->json(['message' => 'Tipo de ítem no válido'], 400);

                    break;
            }

            $totalPrice = $unitPrice * $quantity;

            DB::table('cart')->insert([
                'person_id' => $personId,
                'subscription_id' => $subscriptionId,
                'event_id' => $eventId,
                'product_id' => $productId,
                'quantity' => $quantity,
                'branch_id' => $request->input('branch_id'),
                'unit_price' => $unitPrice,
                'total_price' => $totalPrice,
                'item_type_id' => $itemTypeId,
                'start_date' => $fechaFin,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $cartCount = $this->cartCount($personId, $request->input('branch_id'));

            return response()->json(['message' => 'Producto agregado al carrito', 'cart_count' => $cartCount], 201);
        } catch (\Exception $e) {
            Log::error('Error al agregar producto al carrito: ' . $e->getMessage());
            return response()->json(['message' => 'Error al agregar producto al carrito'], 500);
        }
    }

    /**
     * Retorna la cantidad de items en el carrito para una persona
     * @param int $personId
     * @return int
     */
    public function cartCount($personId, $branchId)
    {
        if (!$personId || !is_numeric($personId)) {
            return 0;
        }
        $result = DB::select(<<<SQL
            select COUNT(c.id) as cantidad
            from cart c
            where c.person_id = ?
              AND c.branch_id = ?
        SQL, [$personId, $branchId]);
        $cantidad = $result[0]->cantidad ?? 0;
        return (int)$cantidad;
    }

    /**
     * Retorna la cantidad de items en el carrito para una persona y una sede
     * @param Request $request Debe recibir person_id y branch_id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCartCount(Request $request)
    {
        $personId = $request->input('person_id');
        $branchId = $request->input('branch_id');
        if (!$personId || !is_numeric($personId) || !$branchId || !is_numeric($branchId)) {
            return response()->json(['error' => 'person_id y branch_id requeridos'], 400);
        }
        $cantidad = $this->cartCount($personId, $branchId);
        return response()->json(['cart_count' => $cantidad]);
    }

    /**
     * Retorna los items del carrito para una persona y una sede
     * @param Request $request Debe recibir person_id y branch_id
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCartItems(Request $request)
    {
        $personId = $request->input('person_id');
        $branchId = $request->input('branch_id');
        if (!$personId || !is_numeric($personId) || !$branchId || !is_numeric($branchId)) {
            return response()->json(['error' => 'person_id y branch_id requeridos'], 400);
        }
        try {
            // Productos
            $productos = DB::select(<<<SQL
                SELECT 
                    c.id, 
                    it.name AS type, 
                    p.name,
                    pba.price AS branch_price,
                    p.price,
                    c.quantity,
                    pc.name AS category,
                    pf.file_path AS image,
                    (pba.stock_quantity + c.quantity) as stock
                FROM cart c 
                INNER JOIN item_types it ON c.item_type_id = it.id
                INNER JOIN products p ON c.product_id = p.id
                LEFT JOIN product_branch_access pba ON p.id = pba.product_id
                LEFT JOIN product_categories pc ON p.category_id = pc.id
                LEFT JOIN product_files pf 
                    ON p.id = pf.product_id 
                    AND pf.id = (
                        SELECT MIN(pf2.id) 
                        FROM product_files pf2 
                        WHERE pf2.product_id = p.id
                    )
                WHERE c.person_id = ? 
                    AND pba.branch_id = ?
                    AND c.branch_id = ?
            SQL, [$personId, $branchId, $branchId]);

            // Suscripciones
            $suscripciones = DB::select(<<<SQL
                     SELECT
                         c.id,
                         it.name as type,
                         sp.name,
                         c.unit_price as price,
                         c.quantity,
                         c.start_date,
                         CONCAT(sp.duration_months, ' ', CASE WHEN sp.duration_months = 1 THEN 'Mes' ELSE 'Meses' END) as period
                     FROM cart c 
                     INNER JOIN item_types it ON c.item_type_id = it.id
                     INNER JOIN subscription_plans sp on c.subscription_id = sp.id
                     INNER JOIN branch_subscription_plans bsp on sp.id = bsp.subscription_plan_id
                     WHERE c.person_id = ?
                          AND bsp.branch_id = ?
                          AND c.branch_id = ?
                SQL, [$personId, $branchId, $branchId]);

            // consultar la fecha en la que finaliza la suscripcion que mas vigencia tiene 
            $fechaFin = DB::selectOne(
                "SELECT s.end_date
                    FROM subscriptions s
                    INNER JOIN models m ON s.model_id = m.id
                    WHERE m.person_id = ?
                    ORDER BY s.end_date DESC
                    LIMIT 1",
                [$personId]
            );

            // Eventos (puedes ajustar la query según tu modelo de eventos)
            $eventos = DB::select(<<<SQL
                SELECT
                   c.id,
                   it.name as type,
                   e.name,
                   e.price,
                   c.quantity,
                   e.event_date as fecha
                FROM cart c 
                INNER JOIN item_types it ON c.item_type_id = it.id
                INNER JOIN events e on c.event_id = e.id
                WHERE c.person_id = ?
                    AND c.branch_id = ?
            SQL, [$personId, $branchId]);

            return response()->json([
                'productos' => $productos,
                'suscripciones' => $suscripciones,
                'eventos' => $eventos,
                'fecha_fin_suscripcion' => $fechaFin,
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener items del carrito: ' . $e->getMessage());
            return response()->json(['error' => 'Error al obtener items del carrito'], 500);
        }
    }

    /**
     * Elimina un item del carrito y devuelve stock si es producto
     * @param Request $request Debe recibir id (cart id) y type
     * @return \Illuminate\Http\JsonResponse
     */
    public function removeCartItem(Request $request)
    {
        try {
            $cartId = $request->input('id');
            $type = $request->input('type');
            if (!$cartId || !$type) {
                return response()->json(['error' => 'id y type requeridos'], 400);
            }
            try {
                $cartItem = DB::table('cart')->where('id', $cartId)->first();
                if (!$cartItem) {
                    return response()->json(['error' => 'Item no encontrado en el carrito'], 404);
                }
                switch ($type) {
                    case 'Producto':
                        // Si es producto, devolver stock
                        if ($cartItem->product_id && $cartItem->branch_id) {
                            DB::table('product_branch_access')
                                ->where('product_id', $cartItem->product_id)
                                ->where('branch_id', $cartItem->branch_id)
                                ->increment('stock_quantity', $cartItem->quantity ?? 1);
                        }
                        break;

                    case 'Evento':
                        // Si es evento liberar cupo
                        if ($cartItem->event_id && $cartItem->branch_id) {
                            DB::table('event_branch_access')
                                ->where('event_id', $cartItem->event_id)
                                ->where('branch_id', $cartItem->branch_id)
                                ->decrement('current_participants', $cartItem->quantity ?? 1);
                        }
                        break;
                }
                // Eliminar el item del carrito
                DB::table('cart')->where('id', $cartId)->delete();
                return response()->json(['message' => 'Item eliminado del carrito']);
            } catch (\Exception $e) {
                Log::error('Error al eliminar item del carrito: ' . $e->getMessage());
                return response()->json(['error' => 'Error al eliminar item del carrito'], 500);
            }
        } catch (\Exception $e) {
            Log::error('Error al eliminar item del carrito: ' . $e->getMessage());
            return response()->json(['error' => 'Error al eliminar item del carrito'], 500);
        }
    }

    /**
     * Actualiza la cantidad de un item en el carrito y ajusta el stock.
     */
    public function updateCartItem(Request $request)
    {
        try {

            $validated = $request->validate([
                'id' => 'required|integer',
                'type' => 'required|string',
                'quantity' => 'required|integer|min:1',
                'branch_id' => 'required|integer',
            ]);

            $cartItemId = $validated['id'];
            $type = $validated['type'];
            $newQuantity = $validated['quantity'];
            $branchId = $validated['branch_id'];

            switch ($type) {
                case 'Producto':
                    // Obtener el item actual del carrito
                    $cartItem = DB::selectOne(<<<SQL
                        SELECT 
                            c.quantity,
                            p.id as productId
                        FROM cart c 
                        INNER JOIN products p ON c.product_id = p.id
                        LEFT JOIN product_branch_access pba ON p.id = pba.product_id
                        WHERE pba.branch_id = ?
                        and c.id = ?
                    SQL, [$branchId, $cartItemId]);
                    if (!$cartItem) {
                        return response()->json(['error' => 'Item no encontrado en el carrito'], 404);
                    }

                    $oldQuantity = $cartItem->quantity;
                    $productId = $cartItem->productId;

                    // Calcular la diferencia
                    $diff = $newQuantity - $oldQuantity;

                    $cartRow = DB::selectOne(<<<SQL
                        SELECT unit_price FROM cart WHERE id = ?
                    SQL, [$cartItemId]);
                    $unitPrice = $cartRow ? $cartRow->unit_price : 0;
                    $newTotal = $unitPrice * $newQuantity;
                    DB::table('cart')
                        ->where('id', $cartItemId)
                        ->update([
                            'quantity' => $newQuantity,
                            'total_price' => $newTotal
                        ]);

                    // Ajustar el stock en product_branch_access
                    if ($diff !== 0) {
                        DB::update(<<<SQL
                        UPDATE product_branch_access
                        SET stock_quantity = stock_quantity - ?
                        WHERE product_id = ? AND branch_id = ?
                    SQL, [$diff, $productId, $branchId]);
                    }

                    return response()->json(['success' => true]);
                    break;
                case 'Suscripción':
                    $fechainicio = request()->input('fecha_inicio');

                    $cartItem = DB::selectOne(<<<SQL
                        SELECT 
                            c.quantity,
                            c.unit_price
                        FROM cart c
                        WHERE c.branch_id = ?
                        and c.id = ?
                    SQL, [$branchId, $cartItemId]);
                    if (!$cartItem) {
                        return response()->json(['error' => 'Item no encontrado en el carrito'], 404);
                    }

                    $newTotal = $cartItem->unit_price * $newQuantity;

                    DB::table('cart')
                        ->where('id', $cartItemId)
                        ->update([
                            'quantity' => $newQuantity,
                            'total_price' => $newTotal,
                            'start_date' => $fechainicio
                        ]);
                    return response()->json(['success' => true]);

                    break;
                default:
                    return response()->json(['error' => 'Tipo no soportado'], 400);
            }
        } catch (\Exception $e) {
            Log::error('Error al editar item del carrito: ' . $e->getMessage());
            return response()->json(['error' => 'Error al editar item del carrito'], 500);
        }
    }

    public function mediosPago()
    {
        $mediosPago = DB::table('payment_methods')
            ->where('is_active', true)
            ->select('id', 'name')
            ->get();
        return response()->json(['medios_pago' => $mediosPago]);
    }

    public function processPayment(Request $request)
    {
        try {
            Log::info('Procesando pago...', $request->all());
            $personId = $request->input('person_id');
            $branchId = $request->input('branch_id');
            if (!$personId || !$branchId) {
                return response()->json(['error' => 'Faltan datos de persona o sede'], 400);
            }

            // 1. Obtener items del carrito
            $cartItems = DB::select(<<<SQL
                SELECT * FROM cart WHERE person_id = ? AND branch_id = ?
            SQL, [$personId, $branchId]);
            if (empty($cartItems)) {
                return response()->json(['error' => 'El carrito está vacío'], 400);
            }

            // 2. Crear invoice (usando los campos correctos)
            $total = array_sum(array_map(fn($item) => $item->total_price, $cartItems));
            $isFullPayment = $request->input('isFullPayment');
            if ($isFullPayment) {
                $amountPaid = $total;
            } else {
                $amountPaid = floatval($request->input('amount'));
            }
            $remaining = $total - $amountPaid;
            if ($remaining < 0) $remaining = 0;
            $statusId = ($amountPaid >= $total) ? 2 : 1;

            $invoiceId = DB::table('invoices')->insertGetId([
                'person_id' => $personId,
                'branch_id' => $branchId,
                'invoice_date' => now()->toDateString(),
                'total_amount' => $total,
                'paid_amount' => $amountPaid,
                'remaining_amount' => $remaining,
                'status_id' => $statusId,
                'invoice_type_id' => 1,
                'observations' => $request->input('observaciones'),
                'created_by' => auth()->id(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 3. Pasar items del cart a invoice_items
            foreach ($cartItems as $item) {
                DB::table('invoice_items')->insert([
                    'invoice_id' => $invoiceId,
                    'product_id' => $item->product_id,
                    'subscription_id' => $item->subscription_id,
                    'event_id' => $item->event_id,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'total_price' => $item->total_price,
                    'item_type_id' => $item->item_type_id,
                    'branch_id' => $branchId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 4. Registrar el pago en la tabla payments
            $paymentMethodId = $request->input('paymentMethod');
            // amountPaid ya calculado arriba
            $paymentId = DB::table('payments')->insertGetId([
                'branch_id' => $branchId,
                'invoice_id' => $invoiceId,
                'payment_method_id' => $paymentMethodId,
                'amount' => $amountPaid,
                'payment_date' => now(),
                'observations' => $request->input('observaciones'),
                'created_by' => auth()->id(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 5. Registrar movimiento de caja
            // Determinar tipo de movimiento (ingreso por venta)
            $cashRegister = DB::table('cash_register')
                ->where('branch_id', $branchId)
                ->where('status', 'open')
                ->orderByDesc('opening_date')
                ->first();
            if ($cashRegister) {
                DB::table('cash_movements')->insert([
                    'cash_register_id' => $cashRegister->id,
                    'movement_type' => 'ingreso',
                    'invoice_id' => $invoiceId,
                    'payment_id' => $paymentId,
                    'amount' => $amountPaid,
                    'concept' => 'Venta en tienda',
                    'observations' => $request->input('observaciones'),
                    'movement_date' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // 6. Borrar items del cart
            DB::delete(<<<SQL
                DELETE FROM cart WHERE person_id = ? AND branch_id = ?
            SQL, [$personId, $branchId]);

            return response()->json(['message' => 'Pago procesado exitosamente', 'invoice_id' => $invoiceId], 200);
        } catch (\Exception $e) {
            Log::error('Error al procesar el pago: ' . $e->getMessage());
            return response()->json(['error' => 'Error al procesar el pago'], 500);
        }
    }
}
