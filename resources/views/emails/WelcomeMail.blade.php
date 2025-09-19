<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenida y Factura</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
            background-color: #f4f4f7;
            color: #333;
            line-height: 1.5;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #e2e2e2;
        }
        .header {
            background-color: #4a5568;
            color: #ffffff;
            padding: 20px;
            text-align: center;
        }
        .header img {
            max-width: 140px;
            margin-bottom: 10px;
            display: block;
            margin-left: auto;
            margin-right: auto;
            filter: brightness(0) invert(1);
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .content {
            padding: 30px;
        }
        .content p {
            margin: 0 0 15px;
        }
        .footer {
            background-color: #f8f8f8;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #777;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #3490dc;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="{{ $message->embed(public_path('storage/logos/logo.png')) }}" alt="CM Management Logo">
            <h1>¡Bienvenid@ a CM Management!</h1>
        </div>
        <div class="content">
            <p>Hola, <strong>{{ $invoiceData['invoice']->person_name }}</strong>,</p>
            <p>¡Te damos la más cordial bienvenida! Tu registro como modelo en nuestra plataforma ha sido completado exitosamente.</p>
            <p>Estamos muy emocionados de empezar a trabajar contigo. Adjunto a este correo, encontrarás la factura correspondiente a tu inscripción.</p>
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            <p>Atentamente,<br>El equipo de CM Management</p>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} CM Management. Todos los derechos reservados.</p>
            <p>Este es un correo electrónico generado automáticamente, por favor no respondas a esta dirección.</p>
        </div>
    </div>
</body>
</html>
