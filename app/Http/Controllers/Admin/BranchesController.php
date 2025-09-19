<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BranchesController extends Controller
{
    public function index()
    {
        try {
            // Consulta directa a la base de datos, sin modelo
            $branches = DB::select('SELECT b.id, b.name, b.address, b.phone, b.email, b.manager_id, u.name as manager_name, u.email as manager_email, b.is_active
                FROM branches b
                LEFT JOIN users u ON b.manager_id = u.id
                ORDER BY b.name');
            return \Inertia\Inertia::render('Admin/branches/Index', [
                'branches' => $branches
            ]);
        } catch (\Exception $e) {
            Log::error('Error al obtener las sedes: ' . $e->getMessage());
            abort(403, 'No tienes permiso para ver las sedes.');
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'required|email|max:255',
            'manager_id' => 'required|integer|exists:users,id',
            'is_active' => 'required|boolean',
        ]);
        try {
            DB::insert(<<<SQL
                INSERT INTO branches (name, address, phone, email, manager_id, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
            SQL,
            [
                $validated['name'],
                $validated['address'],
                $validated['phone'],
                $validated['email'],
                $validated['manager_id'],
                $validated['is_active'] ? 1 : 0,
            ]);
            return response()->json(['message' => 'Sede registrada correctamente'], 201);
        } catch (\Exception $e) {
            Log::error('Error al registrar sede: ' . $e->getMessage());
            return response()->json(['error' => 'Error al registrar la sede'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'required|email|max:255',
            'manager_id' => 'required|integer|exists:users,id',
            'is_active' => 'required|boolean',
        ]);
        try {
            $affected = DB::update(<<<SQL
                UPDATE branches
                SET name = ?, address = ?, phone = ?, email = ?, manager_id = ?, is_active = ?, updated_at = NOW()
                WHERE id = ?
            SQL,
            [
                $validated['name'],
                $validated['address'],
                $validated['phone'],
                $validated['email'],
                $validated['manager_id'],
                $validated['is_active'] ? 1 : 0,
                $id
            ]);
            if ($affected === 0) {
                return response()->json(['error' => 'Sede no encontrada o sin cambios'], 404);
            }
            return response()->json(['message' => 'Sede actualizada correctamente']);
        } catch (\Exception $e) {
            Log::error('Error al actualizar sede: ' . $e->getMessage());
            return response()->json(['error' => 'Error al actualizar la sede'], 500);
        }
    }

    public function searchManagers(Request $request)
    {
        try {
            $query = $request->input('query', '');
            if (strlen($query) < 3) {
                return response()->json(['message' => 'El término de búsqueda debe tener al menos 3 caracteres'], 400);
            }
            $likeQuery = '%' . $query . '%';
            $users = DB::select('
                SELECT id, name, email
                FROM users
                WHERE name LIKE ? OR email LIKE ?
                ORDER BY
                    CASE
                        WHEN name LIKE ? THEN 1
                        WHEN email LIKE ? THEN 2
                        ELSE 3
                    END,
                    name ASC
                LIMIT 15
            ', [
                $likeQuery,
                $likeQuery,
                $query . '%',
                $query . '%'
            ]);
            return response()->json(['users' => $users]);
        } catch (\Exception $e) {
            Log::error('Error al buscar managers: ' . $e->getMessage());
            return response()->json(['message' => 'Error al buscar managers'], 500);
        }
    }
}
