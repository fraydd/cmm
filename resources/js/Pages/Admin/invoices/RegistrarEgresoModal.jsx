import React, { useState, useEffect } from 'react';
import { Modal, Form, InputNumber, Input, Select, Button, Typography, Space, Checkbox } from 'antd';
import { UserOutlined, DollarOutlined, EditOutlined, TeamOutlined, FileTextOutlined } from '@ant-design/icons';
import { useNotifications } from '../../../hooks/useNotifications.jsx';
import { useBranch } from '../../../hooks/useBranch.jsx';
import { CreditCardOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function RegistrarEgresoModal({ open, onClose, initialData = null }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotifications();
  const [peopleOptions, setPeopleOptions] = useState([]);
  const [searching, setSearching] = useState(false);
  const { branchId } = useBranch();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [payAll, setPayAll] = useState(true);
  // Cargar métodos de pago al abrir el modal
  // Sincronizar el valor del check con el formulario
  useEffect(() => {
    if (payAll) {
      // Si se paga todo, limpiar el campo de pago parcial
      form.setFieldsValue({ partial_payment: undefined });
    }
  }, [payAll, form]);
  useEffect(() => {
    if (open) {
      setLoadingPaymentMethods(true);
      fetch('/admin/invoices/mediosPago', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
        .then(res => res.json())
        .then(data => {
          setPaymentMethods((data.medios_pago || []).map(m => ({ value: m.id, label: m.name })));
        })
        .catch(() => setPaymentMethods([]))
        .finally(() => setLoadingPaymentMethods(false));
    }
  }, [open]);

  // Cargar datos iniciales si es edición
  useEffect(() => {
    if (open && initialData) {
      form.setFieldsValue({
        person_id: initialData.person_id,
        amount: initialData.amount,
        details: initialData.details,
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, initialData, form]);

  // Buscar personas por nombre, apellido o identificación
  const handleSearchPeople = async (value) => {
    if (!value || value.length < 3) return;
    setSearching(true);
    try {
      const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      const response = await fetch(`/admin/search/people?query=${encodeURIComponent(value)}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRF-TOKEN': token
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPeopleOptions((data.people || []).map(p => ({
          value: p.id,
          label: p.name
        })));
      } else {
        setPeopleOptions([]);
      }
    } catch (e) {
      setPeopleOptions([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!branchId) {
        showError('Debe seleccionar una sede.');
        return;
      }
      setLoading(true);
      const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
      const body = {
        branch_id: branchId,
        person_id: values.person_id,
        amount: values.amount,
        details: values.details,
        payment_method_id: values.payment_method_id,
        pay_all: payAll
      };
      if (!payAll) {
        body.partial_payment = values.partial_payment;
      }
      const response = await fetch('/admin/invoices/createEgreso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(body)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al registrar el egreso');
      }
      showSuccess('Egreso registrado correctamente');
      setLoading(false);
      if (onClose) onClose(true);
    } catch (error) {
      setLoading(false);
      showError(error.message || 'Error al registrar el egreso');
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => onClose(false)}
      footer={null}
      title={
        <Space>
          <TeamOutlined />
          <span>Registrar Egreso</span>
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
          name="person_id"
          label={<span><UserOutlined /> Persona</span>}
          rules={[{ required: true, message: 'Seleccione la persona a la que se le paga' }]}
        >
          <Select
            showSearch
            placeholder="Buscar persona por nombre, apellido o identificación"
            filterOption={false}
            onSearch={handleSearchPeople}
            notFoundContent={searching ? 'Buscando...' : 'No hay resultados'}
            options={peopleOptions}
            allowClear
          />
        </Form.Item>
        <Form.Item
          name="amount"
          label={<span><DollarOutlined /> Monto total</span>}
          rules={[
            { required: true, message: 'Ingrese el monto del egreso' },
            { type: 'number', min: 0.01, message: 'El monto debe ser mayor a 0', transform: value => Number(value) }
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
        <Form.Item>
          <Checkbox checked={payAll} onChange={e => setPayAll(e.target.checked)}>
            ¿Pagar todo el egreso ahora?
          </Checkbox>
        </Form.Item>
        {!payAll && (
          <Form.Item
            name="partial_payment"
            label={<span><DollarOutlined /> Monto a pagar ahora</span>}
            rules={[
              { required: true, message: 'Ingrese el monto a pagar ahora' },
              { type: 'number', min: 0.01, message: 'El monto debe ser mayor a 0', transform: value => Number(value) }
              // Podrías agregar una validación para que no supere el total
            ]}
            validateTrigger={['onBlur', 'onChange']}
          >
            <InputNumber
              min={0.01}
              style={{ width: '100%' }}
              prefix="$"
              placeholder="Monto a pagar ahora"
              precision={2}
            />
          </Form.Item>
        )}
        <Form.Item
          name="payment_method_id"
          label={<span><CreditCardOutlined /> Método de Pago</span>}
          rules={[{ required: true, message: 'Seleccione el método de pago' }]}
        >
          <Select
            placeholder="Seleccione el método de pago"
            options={paymentMethods}
            loading={loadingPaymentMethods}
            allowClear
            showSearch
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          />
        </Form.Item>
        <Form.Item
          name="details"
          label={<span><FileTextOutlined /> Detalles (opcional)</span>}
          rules={[
            { max: 250, message: 'Máximo 250 caracteres' }
          ]}
        >
          <Input.TextArea
            rows={3}
            placeholder="Detalles del egreso..."
            maxLength={250}
            showCount
          />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            block
          >
            Registrar Egreso
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
