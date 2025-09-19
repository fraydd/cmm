import { notification } from 'antd';
import { 
    CheckCircleOutlined, 
    ExclamationCircleOutlined, 
    InfoCircleOutlined,
    WarningOutlined 
} from '@ant-design/icons';

export const useNotifications = () => {
    const showSuccess = (message, description = '', duration = 3) => {
        notification.success({
            message,
            description,
            icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
            placement: 'bottomRight',
            duration: duration,
        });
    };

    const showError = (message, description = '', duration = 5) => {
        notification.error({
            message,
            description,
            icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
            placement: 'bottomRight',
            duration: duration,
        });
    };

    const showInfo = (message, description = '', duration = 4) => {
        notification.info({
            message,
            description,
            icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
            placement: 'bottomRight',
            duration: duration,
        });
    };

    const showWarning = (message, description = '', duration = 4) => {
        notification.warning({
            message,
            description,
            icon: <WarningOutlined style={{ color: '#faad14' }} />,
            placement: 'bottomRight',
            duration: duration,
        });
    };

    return {
        showSuccess,
        showError,
        showInfo,
        showWarning,
    };
}; 