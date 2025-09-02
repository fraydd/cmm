DELIMITER $$

DROP PROCEDURE IF EXISTS RecalculateCashRegisterTotals$$

CREATE PROCEDURE RecalculateCashRegisterTotals(IN p_cash_register_ids TEXT)
BEGIN
    -- 1. Crear tabla temporal para IDs válidos de cajas
    DROP TEMPORARY TABLE IF EXISTS temp_valid_cash_registers;
    CREATE TEMPORARY TABLE temp_valid_cash_registers (
        cash_register_id BIGINT UNSIGNED PRIMARY KEY
    );
    
    -- 2. Insertar solo IDs válidos de cash_register
    INSERT INTO temp_valid_cash_registers (cash_register_id)
    SELECT id
    FROM cash_register 
    WHERE FIND_IN_SET(id, p_cash_register_ids);
    
    -- 3. Crear tabla temporal para total de ingresos (invoice_type_id = 1)
    DROP TEMPORARY TABLE IF EXISTS temp_total_income;
    CREATE TEMPORARY TABLE temp_total_income (
        cash_register_id BIGINT UNSIGNED PRIMARY KEY,
        total_income DECIMAL(12,2) DEFAULT 0
    );
    
    -- 4. Calcular total de ingresos (facturas tipo 1)
    INSERT INTO temp_total_income (cash_register_id, total_income)
    SELECT cr.id, COALESCE(SUM(p.amount), 0) as total_income
    FROM cash_register cr
    INNER JOIN payments p ON p.cash_register_id = cr.id
    INNER JOIN invoices i ON p.invoice_id = i.id
    INNER JOIN temp_valid_cash_registers v ON cr.id = v.cash_register_id
    WHERE i.invoice_type_id = 1 -- Ingresos
    GROUP BY cr.id;
    
    -- 5. Crear tabla temporal para total de egresos (invoice_type_id = 2)
    DROP TEMPORARY TABLE IF EXISTS temp_total_expenses;
    CREATE TEMPORARY TABLE temp_total_expenses (
        cash_register_id BIGINT UNSIGNED PRIMARY KEY,
        total_expenses DECIMAL(12,2) DEFAULT 0
    );
    
    -- 6. Calcular total de egresos (facturas tipo 2)
    INSERT INTO temp_total_expenses (cash_register_id, total_expenses)
    SELECT cr.id, COALESCE(SUM(p.amount), 0) as total_expenses
    FROM cash_register cr
    INNER JOIN payments p ON p.cash_register_id = cr.id
    INNER JOIN invoices i ON p.invoice_id = i.id
    INNER JOIN temp_valid_cash_registers v ON cr.id = v.cash_register_id
    WHERE i.invoice_type_id = 2 -- Egresos
    GROUP BY cr.id;
    
    -- 7. Actualizar los totales en cash_register
    UPDATE cash_register cr
    INNER JOIN temp_valid_cash_registers v ON cr.id = v.cash_register_id
    LEFT JOIN temp_total_income ti ON cr.id = ti.cash_register_id
    LEFT JOIN temp_total_expenses te ON cr.id = te.cash_register_id
    SET cr.total_income = COALESCE(ti.total_income, 0),
        cr.total_expenses = COALESCE(te.total_expenses, 0),
        cr.final_amount = cr.initial_amount + COALESCE(ti.total_income, 0) - COALESCE(te.total_expenses, 0),
        cr.updated_at = CURRENT_TIMESTAMP;
    
    -- 8. Limpiar tablas temporales
    DROP TEMPORARY TABLE IF EXISTS temp_valid_cash_registers;
    DROP TEMPORARY TABLE IF EXISTS temp_total_income;
    DROP TEMPORARY TABLE IF EXISTS temp_total_expenses;
    
END$$

DELIMITER ;