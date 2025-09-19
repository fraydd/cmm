<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lista de Modelos - CMM</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .btn {
            display: inline-block;
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .btn:hover {
            background-color: #0056b3;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #333;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        .actions {
            display: flex;
            gap: 10px;
        }
        .btn-edit {
            background-color: #28a745;
            padding: 5px 10px;
            font-size: 12px;
        }
        .btn-delete {
            background-color: #dc3545;
            padding: 5px 10px;
            font-size: 12px;
        }
        .no-data {
            text-align: center;
            padding: 40px;
            color: #666;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Lista de Modelos</h1>
        
        <a href="{{ route('modelos.create') }}" class="btn">Agregar Nuevo Modelo</a>
        
        @if(isset($modelos) && count($modelos) > 0)
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Fecha de Inscripción</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($modelos as $modelo)
                        <tr>
                            <td>{{ $modelo->id ?? 'N/A' }}</td>
                            <td>{{ $modelo->nombre ?? 'N/A' }}</td>
                            <td>{{ $modelo->email ?? 'N/A' }}</td>
                            <td>{{ $modelo->telefono ?? 'N/A' }}</td>
                            <td>{{ $modelo->fecha_inscripcion ?? 'N/A' }}</td>
                            <td>{{ $modelo->activo ? 'Activo' : 'Inactivo' }}</td>
                            <td class="actions">
                                <a href="{{ route('modelos.show', $modelo->id) }}" class="btn btn-edit">Ver</a>
                                <a href="{{ route('modelos.edit', $modelo->id) }}" class="btn btn-edit">Editar</a>
                                <form action="{{ route('modelos.destroy', $modelo->id) }}" method="POST" style="display: inline;">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit" class="btn btn-delete" onclick="return confirm('¿Estás seguro de eliminar este modelo?')">Eliminar</button>
                                </form>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @else
            <div class="no-data">
                <p>No hay modelos registrados aún.</p>
                <p>Haz clic en "Agregar Nuevo Modelo" para comenzar.</p>
            </div>
        @endif
        
        <div style="margin-top: 20px; text-align: center;">
            <a href="{{ route('welcome') }}" class="btn">Volver al Inicio</a>
        </div>
    </div>
</body>
</html> 