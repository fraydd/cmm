DELIMITER $$

DROP PROCEDURE IF EXISTS RecalculateInvoiceTotals$$

CREATE PROCEDURE RecalculateInvoiceTotals(IN p_invoice_ids TEXT)
BEGIN
    -- 1. Crear tabla temporal para IDs válidos (tipo 1)
    DROP TEMPORARY TABLE IF EXISTS temp_valid_invoices;
    CREATE TEMPORARY TABLE temp_valid_invoices (
        invoice_id BIGINT UNSIGNED PRIMARY KEY,
        total_amount DECIMAL(12,2)
    );
    
    -- 2. Insertar solo IDs válidos (invoice_type_id = 1)
    INSERT INTO temp_valid_invoices (invoice_id, total_amount)
    SELECT id, total_amount
    FROM invoices 
    WHERE FIND_IN_SET(id, p_invoice_ids);
    -- AND FIND_IN_SET(id, p_invoice_ids);
    
    -- 3. Crear tabla temporal para montos pagados
    DROP TEMPORARY TABLE IF EXISTS temp_paid_amounts;
    CREATE TEMPORARY TABLE temp_paid_amounts (
        invoice_id BIGINT UNSIGNED PRIMARY KEY,
        paid_amount DECIMAL(12,2) DEFAULT 0
    );
    
    -- 4. Calcular montos pagados por factura
    INSERT INTO temp_paid_amounts (invoice_id, paid_amount)
    SELECT p.invoice_id, COALESCE(SUM(p.amount), 0) as paid_amount
    FROM payments p
    INNER JOIN temp_valid_invoices v ON p.invoice_id = v.invoice_id
    GROUP BY p.invoice_id;
    
    -- 5. Actualizar todas las facturas en una sola operación
    UPDATE invoices i
    INNER JOIN temp_valid_invoices v ON i.id = v.invoice_id
    LEFT JOIN temp_paid_amounts p ON i.id = p.invoice_id
    SET i.paid_amount = COALESCE(p.paid_amount, 0),
        i.remaining_amount = v.total_amount - COALESCE(p.paid_amount, 0),
        i.status_id = CASE 
            WHEN COALESCE(p.paid_amount, 0) = 0 THEN 1 -- Pendiente
            WHEN COALESCE(p.paid_amount, 0) >= v.total_amount THEN 2 -- Pagada
            ELSE 3 -- Parcialmente Pagada
        END,
        i.updated_at = CURRENT_TIMESTAMP;
    
    -- 6. Limpiar tablas temporales
    DROP TEMPORARY TABLE IF EXISTS temp_valid_invoices;
    DROP TEMPORARY TABLE IF EXISTS temp_paid_amounts;
    
END$$

DELIMITER ;