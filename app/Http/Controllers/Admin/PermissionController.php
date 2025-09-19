<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PermissionController extends Controller
{
    /**
     * Listar roles y sus permisos asignados
     */
    public function index()
    {
        $rolesWithPermissions = $this->_getRolesData();
        $permisos = DB::table('permissions')->orderBy('name', 'asc')->get(['id', 'name', 'guard_name', 'description']);
        return Inertia::render('Admin/permisos/Index', [
            'roles' => $rolesWithPermissions,
            'permisos' => $permisos
        ]);
    }

    /**
     * Obtener roles y sus permisos asignados
     */
    public function getRoles()

    {
        $rolesWithPermissions = $this->_getRolesData();
        return response()->json([
            'roles' => $rolesWithPermissions
        ]);
    }

    /**
     * Método interno para obtener los datos de roles y permisos (uso interno)
     */
    protected function _getRolesData()
    {
        // Consulta SQL para obtener roles
        $roles = DB::select(<<<SQL
            SELECT r.id, r.name, r.guard_name, r.created_at, r.updated_at
            FROM roles r
            ORDER BY r.name ASC
        SQL);

        // Consulta SQL para obtener permisos por rol
        $rolesWithPermissions = [];
        foreach ($roles as $rol) {
            $permisos = DB::select(<<<SQL
                SELECT p.id, p.name, p.guard_name
                FROM permissions p
                INNER JOIN role_has_permissions rp ON rp.permission_id = p.id
                WHERE rp.role_id = ?
                ORDER BY p.name ASC
            SQL, [$rol->id]);
            $rolesWithPermissions[] = [
                'id' => $rol->id,
                'name' => $rol->name,
                'guard_name' => $rol->guard_name,
                'created_at' => $rol->created_at,
                'updated_at' => $rol->updated_at,
                'permissions' => $permisos
            ];
        }
        return $rolesWithPermissions;
    }

    /**
     * Crear un nuevo rol y asignar permisos fijos
     */
    public function store(Request $request)
    {
        Log::info('Intentando crear rol con datos: ' . json_encode($request->all()));
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:roles,name',
                'permissions' => 'array'
            ]);

            DB::beginTransaction();
            try {
                // Insertar el rol
                $guardName = 'web';
                DB::insert(<<<SQL
                    INSERT INTO roles (name, guard_name, created_at, updated_at)
                    VALUES (?, ?, NOW(), NOW())
                SQL, [
                    $validated['name'],
                    $guardName
                ]);

                // Obtener el id del rol insertado
                $newRoleId = DB::getPdo()->lastInsertId();

                // Insertar permisos si existen
                if (!empty($validated['permissions']) && is_array($validated['permissions'])) {
                    foreach ($validated['permissions'] as $permId) {
                        DB::insert(<<<SQL
                            INSERT INTO role_has_permissions (role_id, permission_id)
                            VALUES (?, ?)
                        SQL, [
                            $newRoleId,
                            $permId
                        ]);
                    }
                }

                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

            return response()->json([
                'message' => 'Rol creado exitosamente',
                'role_id' => $newRoleId
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error al crear el rol: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error al crear el rol',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar un rol y sus permisos usando SQL puro y transacciones
     */
    public function update(Request $request, $id)
    {
        Log::info('Intentando actualizar rol con datos: ' . json_encode($request->all()));
                // Proteger el rol admin (id=1) para que no se pueda editar
        if ((int)$id === 1) {
            return response()->json([
                'error' => 'No se puede editar el rol admin',
                'message' => 'El rol admin es protegido y no puede ser editado.'
            ], 403);
        }
        try {
            $validated = $request->validate([
                'name' => 'required',
                'permissions' => 'array'
            ]);

            DB::beginTransaction();
            try {
                // Actualizar el nombre del rol
                DB::update(<<<SQL
                    UPDATE roles SET name = ?, updated_at = NOW() WHERE id = ?
                SQL, [
                    $validated['name'],
                    $id
                ]);

                // Eliminar permisos actuales
                DB::table('role_has_permissions')->where('role_id', $id)->delete();

                // Insertar nuevos permisos si existen
                if (!empty($validated['permissions']) && is_array($validated['permissions'])) {
                    foreach ($validated['permissions'] as $permId) {
                        DB::insert(<<<SQL
                            INSERT INTO role_has_permissions (role_id, permission_id)
                            VALUES (?, ?)
                        SQL, [
                            $id,
                            $permId
                        ]);
                    }
                }

                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
            return response()->json([
                'message' => 'Rol actualizado exitosamente'
            ]);

        } catch (\Exception $e) {
            Log::error('Error al actualizar el rol: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error al actualizar el rol',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar un rol y sus asociaciones
     */
    public function destroy($id)
    {
        // Proteger el rol admin (id=1) para que no se pueda borrar
        if ((int)$id === 1) {
            return response()->json([
                'error' => 'No se puede eliminar el rol admin',
                'message' => 'El rol admin es protegido y no puede ser eliminado.'
            ], 403);
        }

    
        DB::beginTransaction();
        try {
            // Eliminar asociaciones en model_has_roles
            DB::table('model_has_roles')->where('role_id', $id)->delete();
            // Eliminar asociaciones en role_has_permissions
            DB::table('role_has_permissions')->where('role_id', $id)->delete();
            // Eliminar el rol
            DB::table('roles')->where('id', $id)->delete();
            DB::commit();
            return response()->json([
                'message' => 'Rol y asociaciones eliminados exitosamente'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Error al eliminar el rol',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
