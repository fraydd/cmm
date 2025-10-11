<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    public function index()
    {
        // Consultas reales para el dashboard
        // Total Modelos
        $totalModelos = DB::table('models')
            ->where('is_active', true)
            ->count();
        // Modelos Activos (con suscripción vigente)
        $modelosActivos = DB::table('models as m')
            ->join('subscriptions as s', function($join) {
                $join->on('m.id', '=', 's.model_id')
                    ->where('s.is_active', true)
                    ->whereDate('s.start_date', '<=', now()->toDateString())
                    ->whereDate('s.end_date', '>=', now()->toDateString());
            })
            ->where('m.is_active', true)
            ->count();
        // Asistencias Hoy (modelos)
        $asistenciasHoy = DB::table('attendance_records')
            ->whereDate('check_in', now()->toDateString())
            ->whereNotNull('model_id')
            ->count();
        // Total Asistencias (modelos)
        $totalAsistencias = DB::table('attendance_records')
            ->whereNotNull('model_id')
            ->count();

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'totalModelos' => $totalModelos,
                'modelosActivos' => $modelosActivos,
                'asistenciasHoy' => $asistenciasHoy,
                'totalAsistencias' => $totalAsistencias,
            ]
        ]);
    }
}
