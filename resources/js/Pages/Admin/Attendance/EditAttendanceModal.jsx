import React, { useState } from 'react';
import { Modal, DatePicker, Form, Button, message, Card, Typography, Space, Divider, Tag } from 'antd';
import { UserOutlined, ClockCircleOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function EditAttendanceModal({ open, onClose, record, type }) {
  // Convertir string a dayjs si existe, si no, retorna now
  const getDayjs = (dateStr) => (dateStr ? dayjs(dateStr) : dayjs());

  // Estado local para los campos editables
  const [ingreso, setIngreso] = useState(getDayjs(record?.ingreso));
  const [salida, setSalida] = useState(getDayjs(record?.salida));

  // Actualizar los valores si cambia el registro
  React.useEffect(() => {
    setIngreso(getDayjs(record?.ingreso));
    setSalida(getDayjs(record?.salida));
  }, [record]);

  const handleGuardar = async () => {
    const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const payload = {
      time_zone: timeZone,
      type,
      ingreso: ingreso ? ingreso.format('YYYY-MM-DD HH:mm:ss') : null,
      salida: type === 'employees' ? (salida ? salida.format('YYYY-MM-DD HH:mm:ss') : null) : null,
    };

    try {
      const response = await fetch(`/admin/asistencias/${record.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': token,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al guardar la asistencia');
      }
      const result = await response.json();
      message.success('Asistencia guardada correctamente');
      if (onClose) onClose(true);
    } catch (error) {
      message.error(error.message || 'Error al guardar la asistencia');
      // No cerrar el modal
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => onClose(false)}
      footer={null}
      title={
        <Space>
          <ClockCircleOutlined />
          <span>Editar Asistencia</span>
        </Space>
      }
      width={500}
    >
      {record ? (
        <div style={{ padding: '8px 0' }}>
          {/* Información del Usuario */}
          <Card 
            size="small" 
            style={{ 
              marginBottom: 20,
            }}
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Space>
                <UserOutlined style={{ color: '#1890ff' }} />
                <Text strong style={{ fontSize: '16px' }}>
                  {record.nombres || 'N/A'}
                </Text>
              </Space>
              
              <Space>
                <Text type="secondary">Tipo de Personal:</Text>
                  {type === 'models' ? 'Modelo' : 'Empleado'}
              </Space>

              {record.identificacion && (
                <Space>
                  <Text type="secondary">Identificación:</Text>
                  <Text>{record.identificacion}</Text>
                </Space>
              )}
            </Space>
          </Card>

          {/* Sección de Edición */}
          <div style={{ marginTop: 0 }}>
            <Title level={5} style={{ margin: '0 0 16px 0', color: '#595959' }}>
              <CalendarOutlined style={{ marginRight: 8 }} />
              Horarios de Asistencia
            </Title>

            <div style={{ marginBottom: 20 }}>
              <div style={{ marginBottom: 8 }}>
                <Space>
                  <Text strong>Hora de Ingreso</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    (Requerido)
                  </Text>
                </Space>
              </div>
              <DatePicker
                showTime
                value={ingreso}
                style={{ 
                  width: '100%',
                  height: '40px'
                }}
                format="YYYY-MM-DD HH:mm:ss"
                onChange={setIngreso}
                placeholder="Selecciona fecha y hora de ingreso"
              />
            </div>

            {type === 'employees' && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ marginBottom: 8 }}>
                  <Space>
                    <Text strong>Hora de Salida</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      (Opcional)
                    </Text>
                  </Space>
                </div>
                <DatePicker
                  showTime
                  value={salida}
                  style={{ 
                    width: '100%',
                    height: '40px'
                  }}
                  format="YYYY-MM-DD HH:mm:ss"
                  onChange={setSalida}
                  placeholder="Selecciona fecha y hora de salida"
                />
              </div>
            )}

            <Divider style={{ margin: '20px 0' }} />

            <div style={{ marginBottom: 0 }}>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button 
                  onClick={onClose}
                  style={{ 
                    minWidth: '80px',
                    height: '40px'
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="primary" 
                  onClick={handleGuardar}
                  style={{ 
                    minWidth: '120px',
                    height: '40px'
                  }}
                >
                  Guardar Cambios
                </Button>
              </Space>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          color: '#999'
        }}>
          <Text type="secondary">No hay datos disponibles para mostrar</Text>
        </div>
      )}
    </Modal>
  );
}