<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ModeloController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        // BREAKPOINT 1: Inicio del método
        $inicio = microtime(true);
        
        // Logs para debugging
        Log::info('Accediendo a la lista de modelos');
        Log::debug('Parámetros de la petición:', request()->all());
        
        // BREAKPOINT 2: Antes de la consulta SQL
        $modelos = [
            [
                'id' => 1,
                'nombre' => 'Modelo A',
                'descripcion' => 'Este es el primer modelo de ejemplo',
                'version' => '1.0.0',
                'estado' => 'activo',
                'fecha_creacion' => '2024-01-15',
                'ultima_modificacion' => '2024-01-20'
            ],
            [
                'id' => 2,
                'nombre' => 'Modelo B',
                'descripcion' => 'Segundo modelo para pruebas',
                'version' => '2.1.0',
                'estado' => 'en_desarrollo',
                'fecha_creacion' => '2024-01-10',
                'ultima_modificacion' => '2024-01-18'
            ],
            [
                'id' => 3,
                'nombre' => 'Modelo C',
                'descripcion' => 'Tercer modelo de ejemplo',
                'version' => '1.5.2',
                'estado' => 'activo',
                'fecha_creacion' => '2024-01-05',
                'ultima_modificacion' => '2024-01-22'
            ],
            [
                'id' => 4,
                'nombre' => 'Modelo D',
                'descripcion' => 'Cuarto modelo para demostración',
                'version' => '3.0.0',
                'estado' => 'inactivo',
                'fecha_creacion' => '2024-01-20',
                'ultima_modificacion' => '2024-01-25'
            ],
            [
                'id' => 5,
                'nombre' => 'Modelo E',
                'descripcion' => 'Quinto modelo de la colección',
                'version' => '2.5.1',
                'estado' => 'archivado',
                'fecha_creacion' => '2024-01-12',
                'ultima_modificacion' => '2024-01-19'
            ],
            [
                'id' => 6,
                'nombre' => 'Modelo F',
                'descripcion' => 'Sexto modelo con características avanzadas',
                'version' => '4.0.0',
                'estado' => 'activo',
                'fecha_creacion' => '2024-01-08',
                'ultima_modificacion' => '2024-01-24'
            ],
            [
                'id' => 7,
                'nombre' => 'Modelo G',
                'descripcion' => 'Séptimo modelo para testing',
                'version' => '1.8.3',
                'estado' => 'en_desarrollo',
                'fecha_creacion' => '2024-01-16',
                'ultima_modificacion' => '2024-01-21'
            ],
            [
                'id' => 8,
                'nombre' => 'Modelo H',
                'descripcion' => 'Octavo modelo con funcionalidades especiales',
                'version' => '2.3.0',
                'estado' => 'activo',
                'fecha_creacion' => '2024-01-03',
                'ultima_modificacion' => '2024-01-17'
            ],
            [
                'id' => 9,
                'nombre' => 'Modelo I',
                'descripcion' => 'Noveno modelo de la serie',
                'version' => '1.2.1',
                'estado' => 'inactivo',
                'fecha_creacion' => '2024-01-14',
                'ultima_modificacion' => '2024-01-23'
            ],
            [
                'id' => 10,
                'nombre' => 'Modelo J',
                'descripcion' => 'Décimo modelo con mejoras significativas',
                'version' => '3.2.0',
                'estado' => 'activo',
                'fecha_creacion' => '2024-01-07',
                'ultima_modificacion' => '2024-01-26'
            ],
            [
                'id' => 11,
                'nombre' => 'Modelo A',
                'descripcion' => 'Este es el primer modelo de ejemplo',
                'version' => '1.0.0',
                'estado' => 'activo',
                'fecha_creacion' => '2024-01-15',
                'ultima_modificacion' => '2024-01-20'
            ],
            [
                'id' => 12,
                'nombre' => 'Modelo B',
                'descripcion' => 'Segundo modelo para pruebas',
                'version' => '2.1.0',
                'estado' => 'en_desarrollo',
                'fecha_creacion' => '2024-01-10',
                'ultima_modificacion' => '2024-01-18'
            ],
            [
                'id' => 13,
                'nombre' => 'Modelo C',
                'descripcion' => 'Tercer modelo de ejemplo',
                'version' => '1.5.2',
                'estado' => 'activo',
                'fecha_creacion' => '2024-01-05',
                'ultima_modificacion' => '2024-01-22'
            ],
            [
                'id' => 14,
                'nombre' => 'Modelo D',
                'descripcion' => 'Cuarto modelo para demostración',
                'version' => '3.0.0',
                'estado' => 'inactivo',
                'fecha_creacion' => '2024-01-20',
                'ultima_modificacion' => '2024-01-25'
            ],
            [
                'id' => 15,
                'nombre' => 'Modelo E',
                'descripcion' => 'Quinto modelo de la colección',
                'version' => '2.5.1',
                'estado' => 'archivado',
                'fecha_creacion' => '2024-01-12',
                'ultima_modificacion' => '2024-01-19'
            ],
            [
                'id' => 16,
                'nombre' => 'Modelo F',
                'descripcion' => 'Sexto modelo con características avanzadas',
                'version' => '4.0.0',
                'estado' => 'activo',
                'fecha_creacion' => '2024-01-08',
                'ultima_modificacion' => '2024-01-24'
            ],
            [
                'id' => 17,
                'nombre' => 'Modelo G',
                'descripcion' => 'Séptimo modelo para testing',
                'version' => '1.8.3',
                'estado' => 'en_desarrollo',
                'fecha_creacion' => '2024-01-16',
                'ultima_modificacion' => '2024-01-21'
            ],
            [
                'id' => 18,
                'nombre' => 'Modelo H',
                'descripcion' => 'Octavo modelo con funcionalidades especiales',
                'version' => '2.3.0',
                'estado' => 'activo',
                'fecha_creacion' => '2024-01-03',
                'ultima_modificacion' => '2024-01-17'
            ],
            [
                'id' => 19,
                'nombre' => 'Modelo I',
                'descripcion' => 'Noveno modelo de la serie',
                'version' => '1.2.1',
                'estado' => 'inactivo',
                'fecha_creacion' => '2024-01-14',
                'ultima_modificacion' => '2024-01-23'
            ],
            [
                'id' => 20,
                'nombre' => 'Modelo J',
                'descripcion' => 'Décimo modelo con mejoras significativas',
                'version' => '3.2.0',
                'estado' => 'activo',
                'fecha_creacion' => '2024-01-07',
                'ultima_modificacion' => '2024-01-26'
            ]
        ];
        
        // Simular una consulta SQL para ver en Debugbar
        // $totalModelos = DB::select('SELECT COUNT(*) as total FROM information_schema.tables WHERE table_schema = ?', ['cmm_db']);
        $totalModelos = 1;
        
        // BREAKPOINT 3: Después de la consulta SQL
        // Log::info('Total de tablas en la base de datos:', $totalModelos);
        
        // Cálculo de tiempo de ejecución
        $tiempoEjecucion = microtime(true) - $inicio;
        
        // BREAKPOINT 4: Antes de devolver la respuesta
        return Inertia::render('Modelos/Index', [
            'modelos' => $modelos,
            'debug_info' => [
                'total_tablas' => $totalModelos[0]->total ?? 0,
                'timestamp' => now()->toISOString(),
                'tiempo_ejecucion' => round($tiempoEjecucion * 1000, 2) . 'ms'
            ]
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
        //
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
