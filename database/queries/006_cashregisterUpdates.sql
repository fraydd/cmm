DELIMITER $$

-- ----------------------------------------------------------------------------
-- TRIGGER: invoices_after_insert
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS invoices_after_insert$$

CREATE TRIGGER invoices_after_insert
AFTER INSERT ON invoices
FOR EACH ROW
BEGIN
    DECLARE affected_cash_registers TEXT;
    
    -- Obtener todas las cajas asociadas a los pagos de esta nueva factura
    SELECT GROUP_CONCAT(DISTINCT cash_register_id) INTO affected_cash_registers
    FROM payments 
    WHERE invoice_id = NEW.id
    AND cash_register_id IS NOT NULL;
    
    -- Si hay cajas afectadas, recalcularlas
    IF affected_cash_registers IS NOT NULL AND affected_cash_registers != '' THEN
        CALL RecalculateCashRegisterTotals(affected_cash_registers);
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- TRIGGER: invoices_after_update  
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS invoices_after_update$$

CREATE TRIGGER invoices_after_update
AFTER UPDATE ON invoices
FOR EACH ROW
BEGIN
    DECLARE affected_cash_registers TEXT;
    
    -- Obtener todas las cajas asociadas a los pagos de esta factura modificada
    SELECT GROUP_CONCAT(DISTINCT cash_register_id) INTO affected_cash_registers
    FROM payments 
    WHERE invoice_id = NEW.id
    AND cash_register_id IS NOT NULL;
    
    -- Si hay cajas afectadas, recalcularlas
    IF affected_cash_registers IS NOT NULL AND affected_cash_registers != '' THEN
        CALL RecalculateCashRegisterTotals(affected_cash_registers);
    END IF;
END$$

-- ----------------------------------------------------------------------------
-- TRIGGER: invoices_after_delete
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS invoices_after_delete$$

CREATE TRIGGER invoices_after_delete
AFTER DELETE ON invoices
FOR EACH ROW
BEGIN
    DECLARE affected_cash_registers TEXT;
    
    -- Obtener todas las cajas asociadas a los pagos de esta factura eliminada
    SELECT GROUP_CONCAT(DISTINCT cash_register_id) INTO affected_cash_registers
    FROM payments 
    WHERE invoice_id = OLD.id
    AND cash_register_id IS NOT NULL;
    
    -- Si hay cajas afectadas, recalcularlas
    IF affected_cash_registers IS NOT NULL AND affected_cash_registers != '' THEN
        CALL RecalculateCashRegisterTotals(affected_cash_registers);
    END IF;
END$$

DELIMITER ;