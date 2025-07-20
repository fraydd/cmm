<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    // Listar asistencias
    public function index(Request $request)
    {
        $attendances = DB::select('SELECT * FROM attendance_records ORDER BY check_in DESC');
        return Inertia::render('Admin/Attendance/Index', [
            'attendances' => $attendances
        ]);
    }

    // Mostrar un registro de asistencia
    public function show($id)
    {
        $attendance = DB::selectOne('SELECT * FROM attendance_records WHERE id = ?', [$id]);
        if (!$attendance) {
            abort(404);
        }
        return response()->json($attendance);
    }

    // Crear un nuevo registro de asistencia
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'branch_id' => 'required|integer',
            'employee_id' => 'nullable|integer',
            'model_id' => 'nullable|integer',
            'check_in' => 'required|date',
            'check_out' => 'nullable|date',
            'observations' => 'nullable|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $data = $validator->validated();
        $id = DB::table('attendance_records')->insertGetId($data);
        return response()->json(['id' => $id], 201);
    }

    // Actualizar un registro de asistencia
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'branch_id' => 'required|integer',
            'employee_id' => 'nullable|integer',
            'model_id' => 'nullable|integer',
            'check_in' => 'required|date',
            'check_out' => 'nullable|date',
            'observations' => 'nullable|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $data = $validator->validated();
        DB::table('attendance_records')->where('id', $id)->update($data);
        return response()->json(['success' => true]);
    }

    // Eliminar un registro de asistencia
    public function destroy($id)
    {
        DB::table('attendance_records')->where('id', $id)->delete();
        return response()->json(['success' => true]);
    }
} 