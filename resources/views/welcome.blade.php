<!-- resources/views/welcome.blade.php -->
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>CMM - Carlos Mario Miranda Models</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="{{ asset('css/app.css') }}" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .welcome-container {
            text-align: center;
            color: white;
            max-width: 600px;
            padding: 40px;
        }
        .welcome-title {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .welcome-subtitle {
            font-size: 1.2rem;
            margin-bottom: 40px;
            opacity: 0.9;
        }
        .admin-button {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            border: 2px solid rgba(255,255,255,0.3);
            font-weight: 600;
            transition: all 0.3s ease;
        }
        .admin-button:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        }
        .features {
            margin-top: 60px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 30px;
        }
        .feature {
            background: rgba(255,255,255,0.1);
            padding: 30px 20px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
        }
        .feature h3 {
            margin-bottom: 15px;
            font-size: 1.3rem;
        }
        .feature p {
            opacity: 0.8;
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="welcome-container">
        @if(session('error'))
            <div style="background: #ffdddd; color: #a94442; border: 1px solid #ebccd1; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                {{ session('error') }}
            </div>
        @endif
        <h1 class="welcome-title">CMM</h1>
        <p class="welcome-subtitle">Carlos Mario Miranda Models</p>
        <p class="welcome-subtitle">Sistema de Gestión Integral para Modelos</p>
        
        <a href="/admin" class="admin-button">
            Acceder al Panel de Administración
        </a>
        
        <div class="features">
            <div class="feature">
                <h3>🎯 Gestión de Modelos</h3>
                <p>Administra perfiles, portafolios y carreras de modelos de manera eficiente</p>
            </div>
            <div class="feature">
                <h3>💰 Control de Caja</h3>
                <p>Gestiona ingresos, gastos y flujo de efectivo con reportes detallados</p>
            </div>
            <div class="feature">
                <h3>🎓 Academia</h3>
                <p>Control de asistencias, horarios y seguimiento académico</p>
            </div>
        </div>
    </div>
</body>
</html>