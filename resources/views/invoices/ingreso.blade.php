<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Factura de Venta</title>
    <style>
        body {
            font-family: 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif';
            font-size: 13px;
            color: #111;
            background: #fff;
        }
        .header, .footer {
            text-align: center;
        }
        .header {
            margin-bottom: 20px;
        }
        .logo {
            width: 90px;
            height: auto;
            margin-bottom: 8px;
            filter: grayscale(100%);
        }
        .footer {
            margin-top: 30px;
            font-size: 11px;
            color: #444;
        }
        .info-table, .items-table, .payments-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .info-table td {
            padding: 3px 6px;
        }
        .items-table th, .items-table td, .payments-table th, .payments-table td {
            border: 1px solid #111;
            padding: 5px;
        }
        .items-table th, .payments-table th {
            background: #eee;
            color: #111;
        }
        .section-title {
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 5px;
            color: #111;
            border-bottom: 1px solid #111;
            padding-bottom: 2px;
        }
        h2 {
            font-family: 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif';
            font-weight: 700;
            color: #111;
            letter-spacing: 1px;
        }
        strong {
            color: #111;
        }
    </style>
</head>
<body>
    <div class="header">
        @if(!empty($logoBase64))
            <img src="{{ $logoBase64 }}" class="logo" alt="Logo">
        @else
            <div style="border: 1px solid #ccc; width: 90px; height: 60px; display: inline-block; text-align: center; line-height: 60px; font-size: 10px;">LOGO</div>
        @endif
        <h2>Factura de Venta</h2>
        <div><strong>Sucursal:</strong> {{ $invoice->branch_name }}<br>
            <small>{{ $invoice->branch_address }} | Tel: {{ $invoice->branch_phone }} | {{ $invoice->branch_email }}</small>
        </div>
    </div>

    <table class="info-table">
        <tr>
            <td><strong>Cliente:</strong> {{ $invoice->person_name }}</td>
            <td><strong>Identificación:</strong> {{ $invoice->identification_number }}</td>
        </tr>
        <tr>
            <td><strong>Email:</strong> {{ $invoice->person_email }}</td>
            <td><strong>Teléfono:</strong> {{ $invoice->person_phone }}</td>
        </tr>
        <tr>
            <td colspan="2"><strong>Dirección:</strong> {{ $invoice->person_address }}</td>
        </tr>
        <tr>
            <td><strong>Fecha:</strong> {{ $invoice->invoice_date }}</td>
            <td><strong>Estado:</strong> {{ $invoice->status }}</td>
        </tr>
        <tr>
            <td><strong>Tipo de factura:</strong> {{ $invoice->invoice_type }}</td>
            <td><strong>Emitida por:</strong> {{ $invoice->created_by_name }} ({{ $invoice->created_by_email }})</td>
        </tr>
    </table>

    <div class="section-title">Detalle de Items</div>
    <table class="items-table">
        <thead>
            <tr>
                <th>#</th>
                <th>Tipo</th>
                <th>Producto/Servicio</th>
                <th>Cantidad</th>
                <th>Valor Unitario</th>
                <th>Valor Total</th>
            </tr>
        </thead>
        <tbody>
        @foreach($items as $i => $item)
            <tr>
                <td>{{ $i+1 }}</td>
                <td>{{ $item->item_type }}</td>
                <td>{{ $item->product_name ?? $item->event_name ?? 'Suscripción' }}</td>
                <td>{{ $item->quantity }}</td>
                <td>${{ number_format($item->unit_price, 2) }}</td>
                <td>${{ number_format($item->total_price, 2) }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>

    <div class="section-title">Pagos</div>
    <table class="payments-table">
        <thead>
            <tr>
                <th>#</th>
                <th>Método</th>
                <th>Valor</th>
                <th>Fecha</th>
                <th>Registrado por</th>
            </tr>
        </thead>
        <tbody>
        @foreach($payments as $i => $payment)
            <tr>
                <td>{{ $i+1 }}</td>
                <td>{{ $payment->payment_method }}</td>
                <td>${{ number_format($payment->amount, 2) }}</td>
                <td>{{ $payment->payment_date }}</td>
                <td>{{ $payment->payment_created_by_name }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>

    <table class="info-table">
        <tr>
            <td><strong>Total:</strong> ${{ number_format($invoice->total_amount, 2) }}</td>
            <td><strong>Pagado:</strong> ${{ number_format($invoice->paid_amount, 2) }}</td>
            <td><strong>Pendiente:</strong> ${{ number_format($invoice->remaining_amount, 2) }}</td>
        </tr>
    </table>

    @if($invoice->observations)
        <div class="section-title">Observaciones</div>
        <div>{{ $invoice->observations }}</div>
    @endif

    <div class="footer">
        <hr>
        <div>Gracias por su compra.</div>
    </div>
</body>
</html>
