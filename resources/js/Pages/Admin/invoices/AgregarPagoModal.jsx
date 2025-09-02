import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Input, Select, Button, Typography, Space, DatePicker } from 'antd';
import { MinusCircleOutlined, EditOutlined, HomeOutlined, DollarOutlined, UserOutlined, CreditCardOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNotifications } from '../../../hooks/useNotifications.jsx';
import { useBranch } from '../../../hooks/useBranch.jsx';
import dayjs from 'dayjs';

const { Text } = Typography;

export default function AgregarPagoModal({ 
  open, 
  onClose, 
  record,
  mode = 'create', // 'create' o 'edit'
  initialData = null, // datos iniciales para modo edición
  editingPaymentId = null // ID del pago que se está editando
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotifications();
  const { selectedBranch } = useBranch();
  const [branches, setBranches] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);

  const isEditMode = mode === 'edit';

  const handleGuardar = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      
      const payload = {
        branch_id: selectedBranch.id,
        amount: values.amount,
        observations: values.observations || '',
        payment_method_id: values.payment_method_id || null,
        invoice_id: record.invoiceId,
      };

      // En modo edición, agregar la fecha si se proporciona
      if (isEditMode && values.payment_date) {
        payload.payment_date = values.payment_date.format('YYYY-MM-DD HH:mm:ss');
      }

      const endpoint = isEditMode 
        ? `/admin/invoices/updatePayment/${editingPaymentId || initialData?.id}` 
        : '/admin/invoices/createPayment';
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error al ${isEditMode ? 'actualizar' : 'registrar'} el pago`);
      }

      showSuccess(`Pago ${isEditMode ? 'actualizado' : 'registrado'} correctamente`);
      setLoading(false);
      if (onClose) onClose(true);
    } catch (error) {
      setLoading(false);
      showError(error.message || `Error al ${isEditMode ? 'actualizar' : 'registrar'} el pago`);
    }
  };

  // Configurar valores iniciales cuando se abre el modal
  useEffect(() => {
    if (open) {
      if (isEditMode && initialData) {
        // Modo edición: llenar con datos existentes
        form.setFieldsValue({
          amount: initialData.amount,
          payment_method_id: initialData.payment_method_id,
          observations: initialData.observations,
          payment_date: initialData.payment_date ? dayjs(initialData.payment_date) : dayjs()
        });
      } else {
        // Modo creación: valores por defecto
        form.setFieldsValue({
          amount: 0,
          payment_method_id: undefined,
          observations: '',
          payment_date: dayjs() // fecha actual por defecto
        });
      }
    } else {
      form.resetFields();
    }
  }, [open, form, isEditMode, initialData]);

  useEffect(() => {
    fetchMediosPago();
  }, []);

  // obtener medios de pago
  const fetchMediosPago = async () => {
    try {
      const response = await fetch('/admin/tienda/mediosPago', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMediosPago(data.medios_pago || []);
      } else {
        setMediosPago([]);
      }
    } catch (e) {
      setMediosPago([]);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => onClose(false)}
      footer={null}
      title={
        <Space>
          {isEditMode ? <EditOutlined /> : <MinusCircleOutlined />}
          <span>{isEditMode ? 'Editar Pago' : 'Registrar Pago'}</span>
        </Space>
      }
      width={420}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="amount"
          label={<span><DollarOutlined /> Monto</span>}
          rules={[
            { required: true, message: 'Ingrese el monto del pago' },
            { 
              type: 'number', 
              min: 0.01, 
              message: 'El monto debe ser mayor a 0',
              transform: (value) => {
                if (value === '' || value === null || value === undefined) {
                  return undefined;
                }
                return Number(value);
              }
            }
          ]}
          validateTrigger={['onBlur', 'onChange']}
        >
          <InputNumber 
            min={0.01} 
            style={{ width: '100%' }} 
            prefix="$" 
            placeholder="0.00"
            precision={2}
          />
        </Form.Item>

        <Form.Item
          name="payment_method_id"
          label={<span><CreditCardOutlined /> Medio de Pago</span>}
          rules={[
            { required: true, message: 'Seleccione un medio de pago' }
          ]}
        >
          <Select
            placeholder="Seleccione el medio de pago"
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={mediosPago.map(medio => ({
              value: medio.id,
              label: medio.name,
              key: medio.id
            }))}
          />
        </Form.Item>

        {/* Campo de fecha solo visible en modo edición */}
        {isEditMode && (
          <Form.Item
            name="payment_date"
            label={<span><CalendarOutlined /> Fecha y Hora del Pago</span>}
            rules={[
              { required: true, message: 'Seleccione la fecha del pago' }
            ]}
          >
            <DatePicker
              showTime={{
                format: 'HH:mm'
              }}
              format="DD/MM/YYYY HH:mm"
              placeholder="Seleccione fecha y hora"
              style={{ width: '100%' }}
            />
          </Form.Item>
        )}

        <Form.Item
          name="observations"
          label="Observaciones"
          rules={[
            { required: true, message: 'Las observaciones son requeridas para pagos' },
            { 
              min: 3, 
              message: 'Las observaciones deben tener al menos 3 caracteres' 
            }
          ]}
          validateTrigger={['onBlur']}
        >
          <Input.TextArea 
            rows={3} 
            placeholder="Describa el motivo del pago..."
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            onClick={handleGuardar} 
            loading={loading} 
            block
            danger={!isEditMode}
          >
            {isEditMode ? 'Actualizar Pago' : 'Registrar Pago'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}