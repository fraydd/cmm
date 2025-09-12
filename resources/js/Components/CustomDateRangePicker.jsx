// CustomDateRangePicker.jsx
import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { DatePicker, Space } from 'antd';
import dayjs from 'dayjs';

const CustomDateRangePicker = forwardRef(({ 
    format = 'YYYY-MM-DD', 
    size = 'middle',
    disabled = false,
    placeholder = ['Fecha inicio', 'Fecha fin'],
    style = {},
    className = '',
    onChange
}, ref) => {
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    // ======================
    // Métodos públicos
    // ======================
    useImperativeHandle(ref, () => ({
        setRange: (range) => {
            if (range && range[0] && range[1]) {
                setStartDate(dayjs(range[0]));
                setEndDate(dayjs(range[1]));
            }
        },
        getRange: () => {
            return startDate && endDate ? [startDate, endDate] : null;
        },
        validate: () => {
            if (!startDate || !endDate) return { valid: false, message: 'Ambas fechas son requeridas' };
            if (endDate.isBefore(startDate, 'day')) return { valid: false, message: 'La fecha fin no puede ser anterior a la fecha inicio' };
            return { valid: true, message: '' };
        }
    }));

    // ======================
    // Handlers
    // ======================
    const handleStartChange = (date) => {
        setStartDate(date);
        if (date && endDate && endDate.isBefore(date)) {
            setEndDate(null); // limpiar si no es coherente
        }
        if (onChange) onChange([date, endDate]);
    };

    const handleEndChange = (date) => {
        setEndDate(date);
        if (onChange) onChange([startDate, date]);
    };

    // ======================
    // Validaciones internas
    // ======================
    const disableStart = (current) => {
        if (!current) return false;
        // Si ya hay fecha fin, no permitir más allá de ella
        return endDate ? current.isAfter(endDate, 'day') : false;
    };

    const disableEnd = (current) => {
        if (!current) return false;
        // No permitir antes de start
        return startDate ? current.isBefore(startDate, 'day') : false;
    };

    return (
        <Space direction="horizontal" size="middle" className={className} style={style}>
            <DatePicker
                value={startDate}
                onChange={handleStartChange}
                disabledDate={disableStart}
                placeholder={placeholder[0]}
                format={format}
                size={size}
                disabled={disabled}
                style={{ width: 140 }}
                getPopupContainer={trigger => trigger.parentElement}
            />

            <DatePicker
                value={endDate}
                onChange={handleEndChange}
                disabledDate={disableEnd}
                placeholder={placeholder[1]}
                format={format}
                size={size}
                disabled={disabled}
                style={{ width: 140 }}
                getPopupContainer={trigger => trigger.parentElement}
            />
        </Space>
    );
});

export default CustomDateRangePicker;
