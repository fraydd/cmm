<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Comprobante de Egreso</title>
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
        .info-table, .payments-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .info-table td {
            padding: 3px 6px;
        }
        .payments-table th, .payments-table td {
            border: 1px solid #111;
            padding: 5px;
        }
        .payments-table th {
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
        .amount-box {
            border: 2px solid #111;
            padding: 10px;
            margin: 15px 0;
            background: #f9f9f9;
        }
        .amount-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
        }
        .amount-label {
            font-weight: bold;
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
        <h2>Comprobante de Egreso</h2>
        <div><strong>Sucursal:</strong> {{ $invoice->branch_name }}<br>
            <small>{{ $invoice->branch_address }} | Tel: {{ $invoice->branch_phone }} | {{ $invoice->branch_email }}</small>
        </div>
    </div>

    <table class="info-table">
        <tr>
            <td><strong>N° Comprobante:</strong> {{ $invoice->id }}</td>
            <td><strong>Fecha:</strong> {{ $invoice->invoice_date }}</td>
        </tr>
        <tr>
            <td><strong>Beneficiario:</strong> {{ $invoice->person_name }}</td>
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
            <td><strong>Estado:</strong> {{ $invoice->status }}</td>
            <td><strong>Emitida por:</strong> {{ $invoice->created_by_name }} ({{ $invoice->created_by_email }})</td>
        </tr>
    </table>

    <div class="amount-box">
        <div class="amount-row">
            <span class="amount-label">Valor Total del Egreso:</span>
            <span>${{ number_format($invoice->total_amount, 2) }}</span>
        </div>
        <div class="amount-row">
            <span class="amount-label">Valor Pagado:</span>
            <span>${{ number_format($invoice->paid_amount, 2) }}</span>
        </div>
        <div class="amount-row">
            <span class="amount-label">Saldo Pendiente:</span>
            <span>${{ number_format($invoice->remaining_amount, 2) }}</span>
        </div>
    </div>

    <div class="section-title">Detalle de Pagos</div>
    <table class="payments-table">
        <thead>
            <tr>
                <th>#</th>
                <th>Método de Pago</th>
                <th>Valor</th>
                <th>Fecha de Pago</th>
                <th>Registrado por</th>
                <th>Observaciones</th>
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
                <td>{{ $payment->observations ?? 'N/A' }}</td>
            </tr>
        @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td colspan="2"><strong>Total Pagado</strong></td>
                <td><strong>${{ number_format($invoice->paid_amount, 2) }}</strong></td>
                <td colspan="3"></td>
            </tr>
        </tfoot>
    </table>

    @if($invoice->observations)
        <div class="section-title">Motivo del Egreso</div>
        <div style="border: 1px solid #ddd; padding: 10px; background: #f9f9f9;">
            {{ $invoice->observations }}
        </div>
    @endif

    <div class="footer">
        <hr>
        <div>Comprobante de Egreso - {{ $invoice->branch_name }}</div>
        <div>Generado el: {{ date('Y-m-d H:i:s') }}</div>
    </div>
</body>
</html>