<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB; // Added this import for DB facade
use Illuminate\Support\Facades\Log; // Added for logging

class CheckinController extends Controller
{
    // Mostrar la vista de check-in
    public function index()
    {
        return Inertia::render('Admin/Checkin/Index');
    }

    // Registrar un nuevo check-in (aún sin lógica)
    public function store(Request $request)
    {
        // Log de debugging
        Log::info('=== CHECK-IN REQUEST ===', [
            'all_data' => $request->all(),
            'identification' => $request->input('identification_number'),
            'branch_id' => $request->input('branch_id'),
            'branch_id_type' => gettype($request->input('branch_id'))
        ]);

        $identification = $request->input('identification_number');
        $branchId = $request->input('branch_id');
        if (!$identification) {
            return response()->json(['success' => false, 'error' => 'Debe ingresar un número de identificación.'], 422);
        }
        if (!$branchId || !is_numeric($branchId)) {
            return response()->json(['success' => false, 'error' => 'Sucursal no válida.'], 422);
        }
        // Buscar persona por identificación
        $person = DB::table('people')->where('identification_number', $identification)->first();
        if (!$person) {
            return response()->json(['success' => false, 'error' => 'No se encontró ninguna persona registrada con ese número de identificación.'], 404);
        }
        // Buscar si es empleado
        $empleado = DB::table('employees')->where('person_id', $person->id)->where('is_active', true)->first();
        if ($empleado) {
            return $this->checkinEmpleado($empleado, $person, (int)$branchId);
        } else {
            // Buscar si es modelo
            $modelo = DB::table('models')->where('person_id', $person->id)->where('is_active', true)->first();
            if ($modelo) {
                return $this->checkinModelo($modelo, $person, (int)$branchId);
            } else {
                return response()->json(['success' => false, 'error' => 'No se encontró ningún empleado o modelo activo con ese número de identificación.'], 404);
            }
        }
    }

    // Check-in para empleados: lógica de in/out
    private function checkinEmpleado($empleado, $person, $branchId)
    {
        // Validar acceso del empleado a la sede
        $acceso = DB::table('employee_branch_access')
            ->where('employee_id', $empleado->id)
            ->where('branch_id', $branchId)
            ->exists();
        if (!$acceso) {
            return response()->json([
                'success' => false,
                'error' => 'No tienes acceso a esta sede. Contacta con administración.'
            ], 403);
        }

        $today = date('Y-m-d');
        $ultimo = DB::table('attendance_records')
            ->where('employee_id', $empleado->id)
            ->where('is_closed', false)
            ->whereDate('check_in', $today)
            ->orderByDesc('check_in')
            ->first();
        if (!$ultimo) {
            // No hay registro abierto hoy, crear uno nuevo (check-in)
            DB::table('attendance_records')->insert([
                'branch_id' => $branchId,
                'employee_id' => $empleado->id,
                'model_id' => null,
                'check_in' => now(),
                'check_out' => null,
                'is_closed' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            return response()->json([
                'success' => true,
                'message' => 'Check-in registrado: ¡Bienvenido/a ' . $person->first_name . ' ' . $person->last_name . '!',
                'type' => 'employee',
                'data' => [
                    'nombre' => $person->first_name . ' ' . $person->last_name,
                ]
            ]);
        } else if (is_null($ultimo->check_out)) {
            // Hay registro abierto, hacer check-out y cerrar
            DB::table('attendance_records')->where('id', $ultimo->id)->update([
                'check_out' => now(),
                'is_closed' => true,
                'updated_at' => now(),
            ]);
            return response()->json([
                'success' => true,
                'message' => 'Check-out registrado: ¡Hasta luego ' . $person->first_name . ' ' . $person->last_name . '!',
                'type' => 'employee',
                'data' => [
                    'nombre' => $person->first_name . ' ' . $person->last_name,
                ]
            ]);
        } else {
            // Ya tiene check-in y check-out hoy, crear nuevo registro
            DB::table('attendance_records')->insert([
                'branch_id' => $branchId,
                'employee_id' => $empleado->id,
                'model_id' => null,
                'check_in' => now(),
                'check_out' => null,
                'is_closed' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            return response()->json([
                'success' => true,
                'message' => 'Nuevo check-in registrado: ¡Bienvenido/a nuevamente ' . $person->first_name . ' ' . $person->last_name . '!',
                'type' => 'employee',
                'data' => [
                    'nombre' => $person->first_name . ' ' . $person->last_name,
                ]
            ]);
        }
    }

    // Check-in para modelos: solo check-in y cerrar
    private function checkinModelo($modelo, $person, $branchId)
    {
        // Verificar si el modelo tiene una suscripción activa con acceso a esta sede (usando branch_subscription_plans)
        $subscription = DB::table('models as m')
            ->join('subscriptions as s', 'm.id', '=', 's.model_id')
            ->join('subscription_plans as sp', 's.subscription_plan_id', '=', 'sp.id')
            ->join('branch_subscription_plans as bsp', 'sp.id', '=', 'bsp.subscription_plan_id')
            ->where('m.id', $modelo->id)
            ->where('bsp.branch_id', $branchId)
            ->where('s.start_date', '<=', now()->toDateString())
            ->where('s.end_date', '>=', now()->toDateString())
            ->where('s.is_active', true)
            ->select('s.id as subscription_id', 's.end_date', 's.start_date', 's.is_active')
            ->first();

        if (!$subscription) {

            return response()->json([
                'success' => false,
                'error' => 'No tienes una suscripción activa que te permita acceso a esta sede. Contacta con administración.'
            ], 403);
        }
        

        // Obtener el path de la imagen de perfil del modelo (solo el primer resultado)
        $imagenPerfil = DB::table('model_files')
            ->where('model_id', $modelo->id)
            ->where('file_type', 'perfil')
            ->value('file_path');

        // Si la ruta ya incluye 'storage/', solo usa asset().
        $urlImagen = $imagenPerfil ? asset($imagenPerfil) : null;

        DB::table('attendance_records')->insert([
            'branch_id' => $branchId,
            'employee_id' => null,
            'model_id' => $modelo->id,
            'check_in' => now(),
            'check_out' => null,
            'is_closed' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        // Aquí podrías calcular y retornar datos de suscripción, etc.
        return response()->json([
            'success' => true,
            'message' => 'Check-in de modelo registrado: ¡Bienvenido/a ' . $person->first_name . ' ' . $person->last_name . '!',
            'type' => 'model',
            'data' => [
                'nombre' => $person->first_name . ' ' . $person->last_name,
                'subscription_end_date' => $subscription->end_date,
                'subscription_id' => $subscription->subscription_id,
                'image_url' => $urlImagen
            ]
        ]);
    }
}