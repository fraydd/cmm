import React, { useState } from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';
import styles from '../Attendance/Index.module.scss';
import { useBranch } from '../../../hooks/useBranch';

export default function CheckinIndex() {
    const [identification, setIdentification] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const { branchId } = useBranch();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setError(null);
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
            } else {
                setError(data.error || 'No se pudo registrar el check-in/out');
            }
        } catch (err) {
            setError('Error de red o del servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout>
            <div className={styles.invitationsPage}>
                <div className={styles.headerSection}>
                    <h2>Gestión de Check-in</h2>
                </div>
                <div className={styles.cardContainer}>
                    <div className={styles.tableContainer}>
                        <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '0 auto', padding: 32 }}>
                            <label htmlFor="identification">Número de identificación:</label>
                            <input
                                id="identification"
                                type="text"
                                value={identification}
                                onChange={e => setIdentification(e.target.value)}
                                placeholder="Ingrese el número de identificación"
                                style={{ width: '100%', padding: 8, marginBottom: 16 }}
                                autoFocus
                                autoComplete="off"
                                disabled={loading}
                            />
                            <button type="submit" disabled={loading || !identification} style={{ width: '100%', padding: 10 }}>
                                {loading ? 'Procesando...' : 'Registrar Check-in/out'}
                            </button>
                        </form>
                        {message && <div style={{ color: 'green', marginTop: 16 }}>{message}</div>}
                        {error && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
} 