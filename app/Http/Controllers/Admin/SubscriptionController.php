<?php
namespace App\Http\Controllers\Admin;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;


class SubscriptionController
{
    /**
     * Retorna la primera suscripción activa de una modelo por su id.
     * @param int $modelId
     * @return object|null
     */
    public static function index($modelId)
    {
        $result = DB::selectOne(<<<SQL
            SELECT s.*
            FROM subscriptions s
            WHERE s.model_id = ? AND s.is_active = 1
            ORDER BY s.id DESC
            LIMIT 1
        SQL, [$modelId]);
        return $result ?: null;
    }

    /**
     * Realiza un soft delete de la suscripción (is_active = false).
     * @param int $subscriptionId
     * @return int Número de filas afectadas
     */
    public static function softDelete($subscriptionId)
    {
        return DB::update(<<<SQL
            UPDATE subscriptions
            SET is_active = 0
            WHERE id = ?
        SQL, [$subscriptionId]);
    }

    /**
     * Renueva la suscripción actualizando fechas y status.
     * @param int $subscriptionId
     * @param int $renewTimes
     * @return int Número de filas afectadas
     */
    public static function renovar($subscriptionId, $renewTimes)
    {
        // Obtener datos actuales de la suscripción (incluye plan_id)
        $sub = DB::selectOne(<<<SQL
            SELECT start_date, end_date, subscription_plan_id FROM subscriptions WHERE id = ?
        SQL, [$subscriptionId]);
        if (!$sub) return 0;

        // Obtener duración y precio del plan en sede
        $plan = DB::selectOne(<<<SQL
            SELECT duration_months FROM subscription_plans WHERE id = ?
        SQL, [$sub->subscription_plan_id]);
        $branchPlan = DB::selectOne(<<<SQL
            SELECT custom_price FROM branch_subscription_plans WHERE subscription_plan_id = ? LIMIT 1
        SQL, [$sub->subscription_plan_id]);
        $precio = $branchPlan && $branchPlan->custom_price ? $branchPlan->custom_price : 0;
        if (!$plan) return 0;

        $statusId = 1;
        $today = date('Y-m-d');
        try {
            DB::beginTransaction();
            if ($sub->start_date && $sub->start_date > $today && $sub->end_date && $sub->end_date > $today) {
                // Ambos en el futuro: mantener start_date, prolongar end_date
                $newStart = $sub->start_date;
                $startRenovacion = $sub->end_date;
                $newEnd = date('Y-m-d', strtotime("$sub->end_date +" . ($plan->duration_months * $renewTimes) . " months"));
            } elseif ($sub->end_date && $sub->end_date >= $today) {
                // Solo end_date en el futuro: mantener start_date, prolongar end_date
                $newStart = $sub->start_date;
                $startRenovacion = $sub->end_date;
                $newEnd = date('Y-m-d', strtotime("$sub->end_date +" . ($plan->duration_months * $renewTimes) . " months"));
            } else {
                // Ya venció: usar hoy como inicio
                $newStart = $today;
                $startRenovacion = $today;
                $newEnd = date('Y-m-d', strtotime("$newStart +" . ($plan->duration_months * $renewTimes) . " months"));
            }

            // Actualizar suscripción
            $updated = DB::update(<<<SQL
                UPDATE subscriptions
                SET start_date = ?, end_date = ?, status_id = ?
                WHERE id = ?
            SQL, [$newStart, $newEnd, $statusId, $subscriptionId]);

            // Registrar en el historial con precio
            if ($updated) {
                DB::insert(<<<SQL
                    INSERT INTO subscription_history (subscription_id, start_date, end_date, event_type, price)
                    VALUES (?, ?, ?, ?, ?)
                SQL, [$subscriptionId, $startRenovacion, $newEnd, 'renovación', $precio]);
            }
            DB::commit();
            return $updated;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al renovar suscripción: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Registra la primera suscripción de un modelo a un plan, validando que no tenga otra activa.
     * @param int $modelId
     * @param int $planId
     * @param int $veces
     * @return bool
     */
    // $fechaInicio es opcional, si no llega se usa hoy
    public static function registrarSuscripcion($modelId, $planId, $veces, $branchId = null, $pagado = null, $paymentMethodId = null, $facturar = true, $fechaInicio = null)
    {
        // Verificar si el modelo ya tiene una suscripción activa
        $suscripcionActiva = DB::selectOne(<<<SQL
            SELECT id FROM subscriptions
            WHERE model_id = ? AND is_active = 1
        SQL, [$modelId]);
        if ($suscripcionActiva) {
            throw new \Exception('El modelo ya tiene una suscripción activa');
        }

        // Consultar la persona asociada al modelo
        $persona = DB::selectOne(<<<SQL
            SELECT person_id FROM models WHERE id = ?
        SQL, [$modelId]);
        if (!$persona) {
            throw new \Exception('No se encontró la persona asociada al modelo');
        }
        $personId = $persona->person_id;

        // Obtener duración del plan
        $plan = DB::selectOne(<<<SQL
            SELECT duration_months FROM subscription_plans WHERE id = ?
        SQL, [$planId]);
        if (!$plan) {
            throw new \Exception('No se encontró el plan de suscripción');
        }

        // Obtener precio del plan en la sede
        $branchPlan = DB::selectOne(<<<SQL
            SELECT custom_price FROM branch_subscription_plans WHERE subscription_plan_id = ? LIMIT 1
        SQL, [$planId]);
        $precioUnitario = $branchPlan && $branchPlan->custom_price ? $branchPlan->custom_price : 0;

        $inicio = $fechaInicio ? $fechaInicio : date('Y-m-d');
        $duracionTotal = $plan->duration_months * $veces;
        $fechaFin = date('Y-m-d', strtotime("$inicio +$duracionTotal months"));
        $statusId = 1;

        try {
            DB::beginTransaction();
            DB::insert(<<<SQL
                INSERT INTO subscriptions (model_id, subscription_plan_id, start_date, end_date, status_id, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())
            SQL, [$modelId, $planId, $inicio, $fechaFin, $statusId]);

            $subscriptionId = DB::getPdo()->lastInsertId();
            DB::insert(<<<SQL
                INSERT INTO subscription_history (subscription_id, start_date, end_date, event_type, price)
                VALUES (?, ?, ?, ?, ?)
            SQL, [$subscriptionId, $inicio, $fechaFin, 'registro', $precioUnitario * $veces]);

            if (!$facturar) {
                DB::commit();
                return true; // Si no se factura, terminar aquí
            }
            // Registrar factura
            $total = $precioUnitario * $veces;
            // Definir estado de la factura:
            // 1 = pendiente, 2 = pagada, 3 = abonada
            if ($pagado >= $total) {
                $estadoFactura = 2; // pagada
                $pagado = $total; // Si paga más, solo registrar el total
            } elseif ($pagado > 0 && $pagado < $total) {
                $estadoFactura = 3; // abonada
            } else {
                $estadoFactura = 1; // pendiente
            }
            $invoiceId = DB::table('invoices')->insertGetId([
                'branch_id' => $branchId,
                'person_id' => $personId,
                'invoice_date' => now(),
                'total_amount' => $total,
                'paid_amount' => $pagado,
                'remaining_amount' => max(0, $total - $pagado),
                'status_id' => $estadoFactura,
                'invoice_type_id' => 1,
                'observations' => null,
                'created_by' => auth()->id(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);


            // Registrar item de factura
            // item_type_id = 2 (suscripción), subscription_id (id del plan), cantidad, unit_price, total_price
            DB::table('invoice_items')->insert([
                'invoice_id' => $invoiceId,
                'item_type_id' => 2, // Suscripción
                'subscription_id' => $planId, // id del plan
                'quantity' => $veces,
                'unit_price' => $precioUnitario,
                'total_price' => $total,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Registrar pago
            if ($pagado > 0) {
                $cashRegister = DB::table('cash_register')
                    ->where('branch_id', $branchId)
                    ->where('status', 'open')
                    ->orderByDesc('opening_date')
                    ->first();

                if (!$cashRegister) {
                    DB::rollBack();
                    throw new \Exception('No hay caja abierta para registrar el pago');
                }

                DB::table('payments')->insert([
                    'branch_id' => $branchId,
                    'cash_register_id' => $cashRegister->id,
                    'invoice_id' => $invoiceId,
                    'payment_method_id' => $paymentMethodId,
                    'amount' => $pagado,
                    'created_by' => auth()->id(),
                    'payment_date' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Enviar correo con la factura y el PDF adjunto
            try {
                $invoicesController = new \App\Http\Controllers\Admin\InvoicesController();
                $invoiceData = $invoicesController->getInvoiceData($invoiceId);
                $pdf = $invoicesController->downloadPdf($invoiceId, true);
                $recipientEmail = DB::table('people')->where('id', $personId)->value('email');

                if ($recipientEmail) {
                    Mail::to($recipientEmail)->send(new \App\Mail\WelcomeMail($invoiceData, $pdf));
                    Log::info('Correo de factura enviado exitosamente.', ['invoice_id' => $invoiceId, 'recipient' => $recipientEmail]);
                } else {
                    Log::warning('No se encontró email para enviar la factura.', ['person_id' => $personId]);
                }
            } catch (\Exception $e) {
                Log::error('Error al enviar correo de factura: ' . $e->getMessage(), ['invoice_id' => $invoiceId]);
                // No detener el flujo principal si el correo falla, solo registrar el error.
            }


            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al registrar suscripción: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Cancela una suscripción: pone el estado como cancelada, la fecha fin como hoy y registra en el historial.
     * @param int $subscriptionId
     * @return bool
     */
    public static function cancelar($subscriptionId)
    {
        $hoy = date('Y-m-d');
        $statusId = 2; // Estado cancelada hardcodeado
        $precio = null; // Cancelar no tiene costo

        try {
            DB::beginTransaction();
            // Actualizar suscripción
            $updated = DB::update(<<<SQL
                UPDATE subscriptions
                SET status_id = ?, end_date = ?, is_active = 0
                WHERE id = ?
            SQL, [$statusId, $hoy, $subscriptionId]);

            // Registrar en el historial
            if ($updated) {
                DB::insert(<<<SQL
                    INSERT INTO subscription_history (subscription_id, start_date, end_date, event_type, price)
                    VALUES (?, ?, ?, ?, ?)
                SQL, [$subscriptionId, $hoy, $hoy, 'cancelada', $precio]);
            }
            DB::commit();
            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al cancelar suscripción: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Consulta el historial completo de suscripciones de un modelo en una sola consulta con JOIN.
     * Retorna un único arreglo con la información relevante.
     * @param int $modelId
     * @return array
     */
    public static function consultarHistoricoPorModelo($modelId)
    {
        $resultados = DB::select(<<<SQL
            SELECT
                s.id AS subscription_id,
                s.subscription_plan_id,
                sp.name AS plan_name,
                bsp.custom_price AS sede_price,
                s.start_date AS subscription_start,
                s.end_date AS subscription_end,
                s.status_id,
                s.is_active,
                s.created_at AS subscription_created,
                s.updated_at AS subscription_updated,
                sh.id AS history_id,
                sh.start_date AS history_start,
                sh.end_date AS history_end,
                sh.event_type,
                sh.price
            FROM subscriptions s
            LEFT JOIN subscription_history sh ON sh.subscription_id = s.id
            LEFT JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
            LEFT JOIN branch_subscription_plans bsp ON bsp.subscription_plan_id = sp.id
            WHERE s.model_id = ?
            ORDER BY s.id DESC, sh.id ASC
        SQL, [$modelId]);
        return $resultados;
    }
}

