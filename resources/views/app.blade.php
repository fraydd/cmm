<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>CMM - Carlos Mario Miranda Models</title>
    
    <!-- Vite carga automáticamente CSS y JS -->
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
    
    <!-- Inertia maneja el head -->
    @inertiaHead
</head>
<body>
    <!-- Aquí es donde Inertia monta React -->
    @inertia
</body>
</html> 