<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PermissionController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        \Log::info('Entrando al método index de PermissionController');

        try {
            // Consulta optimizada con eager loading para permisos y roles
            $permisos = \Spatie\Permission\Models\Permission::with([
                'roles' => function($query) {
                    $query->select('id', 'name', 'guard_name');
                }
            ])
            ->orderBy('name', 'asc')
            ->get()
            ->map(function ($permiso) {
                return [
                    'id' => $permiso->id,
                    'name' => $permiso->name,
                    'guard_name' => $permiso->guard_name,
                    'roles' => $permiso->roles->pluck('name')->toArray(),
                    'roles_count' => $permiso->roles->count(),
                    'created_at' => $permiso->created_at ? $permiso->created_at->format('Y-m-d H:i:s') : null,
                    'updated_at' => $permiso->updated_at ? $permiso->updated_at->format('Y-m-d H:i:s') : null,
                ];
            });

            // Obtener todos los roles disponibles para selectors
            $roles = \Spatie\Permission\Models\Role::orderBy('name', 'asc')->get(['id', 'name', 'guard_name']);

            // Si es una petición AJAX/fetch específica para recargar datos, devolver JSON
            if (request()->ajax() && request()->header('X-Requested-With') === 'XMLHttpRequest' && request()->header('Content-Type') === 'application/json') {
                return response()->json([
                    'permisos' => $permisos,
                    'roles' => $roles,
                    'total' => $permisos->count(),
                    'timestamp' => now()->toISOString()
                ]);
            }

            // Si la petición es AJAX o espera JSON, responde con JSON
            if (request()->wantsJson()) {
                return response()->json([
                    'permisos' => $permisos,
                    'roles' => $roles,
                    'total' => $permisos->count()
                ]);
            }

            // Si es una petición normal, renderiza la vista Inertia
            return Inertia::render('Admin/permisos/Index', [
                'permisos' => $permisos,
                'roles' => $roles,
                'total' => $permisos->count()
            ]);
        } catch (\Exception $e) {
            \Log::error('Error en el método index de PermissionController: ' . $e->getMessage());
            
            if (request()->wantsJson()) {
                return response()->json(['error' => 'Ocurrió un error al procesar la solicitud.'], 500);
            }
            
            return redirect()->back()->with('error', 'Ocurrió un error al cargar los permisos.');
        }
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        // Obtener todos los permisos disponibles
        $permisos = \Spatie\Permission\Models\Permission::orderBy('name', 'asc')->get(['id', 'name', 'guard_name']);
        
        if (request()->wantsJson()) {
            return response()->json([
                'permisos' => $permisos
            ]);
        }
        
        return Inertia::render('Admin/permisos/Create', [
            'permisos' => $permisos
        ]);
    }

    /**
     * Get all available permissions for role creation/editing.
     *
     * @return \Illuminate\Http\Response
     */
    public function getPermissions()
    {
        \Log::info('Accediendo al método getPermissions');
        
        try {
            $permisos = \Spatie\Permission\Models\Permission::orderBy('name', 'asc')->get(['id', 'name', 'guard_name']);
            
            \Log::info('Permisos obtenidos: ' . $permisos->count());
            
            return response()->json([
                'permisos' => $permisos,
                'total' => $permisos->count()
            ]);
        } catch (\Exception $e) {
            \Log::error('Error al obtener permisos: ' . $e->getMessage());
            return response()->json([
                'error' => 'Error al cargar los permisos.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        \Log::info('Intentando crear rol con datos: ' . json_encode($request->all()));
        
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:roles,name',
                'guard_name' => 'required|string|max:255',
                'permissions' => 'array',
                'permissions.*' => 'exists:permissions,id'
            ]);

            \Log::info('Datos validados correctamente');

            // Crear el rol
            $role = \Spatie\Permission\Models\Role::create([
                'name' => $validated['name'],
                'guard_name' => $validated['guard_name'] ?? 'web'
            ]);

            \Log::info('Rol creado con ID: ' . $role->id);

            // Asignar permisos si se proporcionaron
            if (isset($validated['permissions']) && is_array($validated['permissions'])) {
                $permissions = \Spatie\Permission\Models\Permission::whereIn('id', $validated['permissions'])->get();
                $role->syncPermissions($permissions);
                \Log::info('Permisos asignados: ' . $permissions->count());
            }

            // Siempre devolver JSON para peticiones AJAX
            return response()->json([
                'message' => 'Rol creado exitosamente',
                'role' => $role->load('permissions')
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Error de validación al crear rol: ' . json_encode($e->errors()));
            
            return response()->json([
                'error' => 'Error de validación',
                'errors' => $e->errors(),
                'message' => 'Los datos proporcionados no son válidos'
            ], 422);
            
        } catch (\Exception $e) {
            \Log::error('Error al crear rol: ' . $e->getMessage());
            
            return response()->json([
                'error' => 'Error al crear el rol',
                'message' => $e->getMessage()
            ], 500);
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
        //
    }
}
