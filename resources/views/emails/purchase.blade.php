<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmación de Compra</title>
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
            <h1>¡Gracias por tu compra!</h1>
        </div>
        <div class="content">
            <p>Hola, <strong>{{ $invoiceData['invoice']->person_name ?? 'Cliente' }}</strong>,</p>
            <p>Tu compra ha sido registrada exitosamente. Adjuntamos la factura correspondiente en formato PDF para tu control y consulta.</p>
            @if(isset($invoiceData['invoice']->id))
            <p><strong>Factura N°:</strong> {{ $invoiceData['invoice']->id }}</p>
            @endif
            @if(isset($invoiceData['invoice']->invoice_date))
            <p><strong>Fecha:</strong> {{ $invoiceData['invoice']->invoice_date }}</p>
            @endif
            @if(isset($invoiceData['invoice']->total_amount))
            <p><strong>Total:</strong> ${{ number_format($invoiceData['invoice']->total_amount, 0, ',', '.') }}</p>
            @endif
            <p>Si tienes alguna duda o necesitas soporte adicional, no dudes en contactarnos.</p>
            <p>Gracias por confiar en nosotros.</p>
            <p>Atentamente,<br>El equipo de CM Management</p>
        </div>
        <div class="footer">
            <p>&copy; {{ date('Y') }} CM Management. Todos los derechos reservados.</p>
            <p>Este es un correo electrónico generado automáticamente, por favor no respondas a esta dirección.</p>
        </div>
    </div>
</body>
</html>
