DELIMITER $$

-- ----------------------------------------------------------------------------
-- TRIGGER: payments_after_insert
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS payments_after_insert$$

CREATE TRIGGER payments_after_insert
AFTER INSERT ON payments
FOR EACH ROW
BEGIN
    -- Ejecutar inmediatamente para la factura afectada
    CALL RecalculateInvoiceTotals(NEW.invoice_id);
END$$

-- ----------------------------------------------------------------------------
-- TRIGGER: payments_after_update  
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS payments_after_update$$

CREATE TRIGGER payments_after_update
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
    DECLARE affected_ids TEXT;
    
    -- Determinar qué facturas fueron afectadas
    IF OLD.invoice_id != NEW.invoice_id THEN
        -- Si cambió el invoice_id, ambas facturas fueron afectadas
        SET affected_ids = CONCAT(OLD.invoice_id, ',', NEW.invoice_id);
    ELSE
        -- Si mismo invoice_id pero monto diferente, solo esa factura
        SET affected_ids = NEW.invoice_id;
    END IF;
    
    -- Ejecutar inmediatamente para las facturas afectadas
    CALL RecalculateInvoiceTotals(affected_ids);
END$$

-- ----------------------------------------------------------------------------
-- TRIGGER: payments_after_delete
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS payments_after_delete$$

CREATE TRIGGER payments_after_delete
AFTER DELETE ON payments
FOR EACH ROW
BEGIN
    -- Ejecutar inmediatamente para la factura afectada
    CALL RecalculateInvoiceTotals(OLD.invoice_id);
END$$

DELIMITER ;