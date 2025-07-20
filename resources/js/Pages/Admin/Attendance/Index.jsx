import React from 'react';
import AdminLayout from '../../../Layouts/AdminLayout';
import styles from './Index.module.scss';

export default function AttendanceIndex({ attendances }) {
    return (
        <AdminLayout>
            <div className={styles.invitationsPage}>
                <div className={styles.headerSection}>
                    <h2>Gestión de Asistencias</h2>
                </div>
                <div className={styles.cardContainer}>
                    <div className={styles.tableContainer}>
                        {/* Aquí irá la tabla de asistencias */}
                        <p>Próximamente: tabla de asistencias</p>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
} 