import React from 'react';
import { Modal, Form, Input, Button, Space, Typography } from 'antd';
import { MailOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function InvitationModal({ 
    visible, 
    onCancel, 
    onSubmit, 
    loading = false,
    errors = {},
    data = {},
    setData = () => {}
}) {
    const [form] = Form.useForm();

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            onSubmit(values);
            form.resetFields(); // Limpiar tras submit
        } catch (error) {
            console.error('Error de validación del formulario:', error);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setData('email', ''); // Limpiar el estado externo
        onCancel();
    };

    return (
        <Modal
            title={
                <Space>
                    <MailOutlined />
                    <span>Enviar Nueva Invitación</span>
                </Space>
            }
            open={visible}
            onCancel={handleCancel}
            onOk={handleSubmit}
            confirmLoading={loading}
            okText="Enviar Invitación"
            cancelText="Cancelar"
            width={500}
            destroyOnClose={true}
        >
            <div style={{ marginTop: 16 }}>
                <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
                    Envía una invitación por email para que un nuevo usuario pueda registrarse en la plataforma.
                </Text>

                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ email: '' }}
                >
                    <Form.Item
                        name="email"
                        label="Correo Electrónico"
                        rules={[
                            { required: true, message: 'Por favor ingresa un correo electrónico' },
                            { type: 'email', message: 'Por favor ingresa un correo válido' }
                        ]}
                        validateStatus={errors.email ? 'error' : ''}
                        help={errors.email}
                    >
                        <Input
                            placeholder="usuario@ejemplo.com"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            prefix={<MailOutlined />}
                            size="large"
                            autoComplete="off"
                        />
                    </Form.Item>
                </Form>
            </div>
        </Modal>
    );
} 