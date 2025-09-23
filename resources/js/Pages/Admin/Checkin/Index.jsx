import React, { useState } from 'react';
// Instanciar el audio de error una sola vez fuera del componente
const errorAudio = typeof window !== 'undefined' ? new Audio('/sounds/access.mp3') : null;
import { Input, Button, Spin, Avatar } from 'antd';
import { FullscreenOutlined } from '@ant-design/icons';
import { UserOutlined, IdcardOutlined } from '@ant-design/icons';
import AdminLayout from '../../../Layouts/AdminLayout';
import { useBranch } from '../../../hooks/useBranch';
import styles from './CheckinIndex.module.scss';


export default function CheckinIndex() {
    const contentRef = React.useRef();
    // Función para pantalla completa
    const handleFullscreen = () => {
        if (contentRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                contentRef.current.requestFullscreen();
            }
        }
    };
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const [imageUrl, setImageUrl] = useState(null);
    const [subscriptionEndDate, setSubscriptionEndDate] = useState(null);

    React.useEffect(() => {
        if (message || error) {
            const timer = setTimeout(() => {
                setMessage(null);
                setError(null);
                setImageUrl(null);
                setSubscriptionEndDate(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message, error]);

    const [identification, setIdentification] = useState('');
    const [loading, setLoading] = useState(false);
 
    const { branchId } = useBranch();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);
        setImageUrl(null);
        setIdentification('');
        setSubscriptionEndDate(null);

        try {
            const response = await fetch('/admin/checkin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify({ identification_number: identification, branch_id: branchId })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                setMessage(data.message || 'Check-in/out registrado correctamente');
                setSubscriptionEndDate(data.data.subscription_end_date || null);
                if (data.data.image_url) {
                    setImageUrl(data.data.image_url);
                } else {
                    // Imagen predeterminada de avatar de Ant Design
                    setImageUrl('default-avatar');
                }
            } else {
                setError(data.error || 'No se pudo registrar el check-in/out');
                setImageUrl(null);
                // Reproducir sonido de error reutilizando el objeto
                try {
                    if (errorAudio) {
                        errorAudio.currentTime = 0;
                        errorAudio.play();
                    }
                } catch (e) { /* ignorar error de audio */ }
            }
        } catch (err) {
            setError('Error de red o del servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div ref={contentRef} className={styles.invitationsPage} style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 100 }}>
                    <Button
                        type="primary"
                        shape="circle"
                        icon={<FullscreenOutlined />}
                        onClick={handleFullscreen}
                        style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0)' }}
                    />
                </div>
                <div className={styles.headerSection}>
                    <h2>Check-in</h2>
                </div>
                <div className={styles.cardContainer}>
                    <div className={styles.tableContainer}>
                        <div className={styles.formCard}>
                            <div className={styles.formHeader}>
                                <IdcardOutlined className={styles.formIcon} />
                                <h3>Sistema de Check-in</h3>
                                <p>Ingresa tu número de identificación</p>
                            </div>
                            <form onSubmit={handleSubmit} className={styles.checkinForm}>
                                <Input
                                    id="identification"
                                    className={styles.inputField}
                                    type="text"
                                    value={identification}
                                    onChange={e => {
                                        // Permitir solo números
                                        const value = e.target.value.replace(/\D/g, '');
                                        setIdentification(value);
                                    }}
                                    placeholder="Número de identificación"
                                    prefix={<IdcardOutlined />}
                                    size="large"
                                    autoFocus
                                    autoComplete="off"
                                    disabled={loading}
                                />
                                <Button
                                    type="primary"
                                    className={styles.submitButton}
                                    htmlType="submit"
                                    loading={loading}
                                    disabled={!identification}
                                    size="large"
                                    block
                                >
                                    {loading ? 'Procesando...' : 'Registrar Check-in/out'}
                                </Button>
                            </form>
                        </div>
                    </div>
                    <div className={styles.information}>
                        <div className={styles.imageContainer}>
                            {imageUrl === 'default-avatar' ? (
                                <Avatar 
                                    size={120} 
                                    icon={<UserOutlined />} 
                                    style={{ 
                                        background: 'var(--cmm-primary-500)', 
                                        color: 'white',
                                        border: '4px solid var(--cmm-primary-500)',
                                        boxShadow: '0 4px 12px var(--cmm-shadow-color)'
                                    }} 
                                />
                            ) : imageUrl ? (
                                <img className={styles.image} src={imageUrl} alt="Foto de perfil" />
                            ) : null}
                        </div>
                        {
                            message && <div className={styles.message}>
                                <div className={styles.messageTitle}>
                                    ✅ {message}
                                </div>
                                {subscriptionEndDate && (
                                    <div className={styles.subscriptionInfo}>
                                        <strong>Acceso válido hasta:</strong> {new Date(subscriptionEndDate).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </div>
                                )}
                            </div>
                        }
                        {
                            error && <div className={styles.error}>
                                <div className={styles.errorIcon}>❌</div>
                                <div className={styles.errorText}>{error}</div>
                            </div>
                        }
                    </div>
                    
                </div>
            </div>
        </AdminLayout>
    );
} 