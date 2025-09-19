import React, { useState, useEffect } from 'react';
import { Button, Space, Tooltip } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { getCurrentTheme, toggleTheme } from '../utils/themeManager';

export default function ThemeSwitcher() {
    const [currentTheme, setCurrentTheme] = useState('light');

    useEffect(() => {
        // Obtener tema actual al montar el componente
        setCurrentTheme(getCurrentTheme());
    }, []);

    const handleToggleTheme = () => {
        const newTheme = toggleTheme();
        setCurrentTheme(newTheme);
    };

    return (
        <Space>
            <Tooltip title={`Cambiar a tema ${currentTheme === 'light' ? 'oscuro' : 'claro'}`}>
                <Button
                    type="text"
                    icon={currentTheme === 'light' ? <MoonOutlined /> : <SunOutlined />}
                    onClick={handleToggleTheme}
                    style={{
                        color: 'var(--cmm-text-secondary)',
                    }}
                />
            </Tooltip>
        </Space>
    );
} 