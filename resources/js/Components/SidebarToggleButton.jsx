import React from 'react';
import { Button } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import styles from './SidebarToggleButton.module.scss';

const SidebarToggleButton = ({ collapsed, onToggle, tooltip }) => {
    return (
        <Button
            type="primary"
            shape="circle"
            size="small"
            icon={collapsed ? <RightOutlined /> : <LeftOutlined />}
            onClick={onToggle}
            title={tooltip}
            className={styles.sidebarToggleButton}
        />
    );
};

export default SidebarToggleButton; 