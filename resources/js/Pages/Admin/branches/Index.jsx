import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from '../../../Layouts/AdminLayout.jsx';
import { Button, Tag, Space } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import AgregarSedeModal from './AgregarSedeModal.jsx';
import { useNotifications } from '../../../hooks/useNotifications.jsx';
import styles from './Index.module.scss';
import { Typography } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
const { Title } = Typography;

export default function BranchesIndex({ branches = [] }) {
    const { showSuccess, showError } = useNotifications();
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedBranch, setSelectedBranch] = useState(null);

    const handleEdit = (id) => {
        const branch = branches.find(b => b.id === id);
        setSelectedBranch(branch);
        setModalMode('edit');
        setModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedBranch(null);
        setModalMode('create');
        setModalOpen(true);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setSelectedBranch(null);
    };

    const handleModalSuccess = () => {
        // Recarga la página para traer los datos actualizados
        router.reload({ only: ['branches'] });
    };

    return (
        <AdminLayout title="Sedes">
            <div className={styles.branchesHeader}>
                <Title level={2}>
                    <HomeOutlined className={styles.headerIcon} /> Sedes
                </Title>
            </div>
            <div className={styles.branchesList}>
                <div
                    className={styles.addBranchCard}
                    onClick={handleAdd}
                    tabIndex={0}
                    role="button"
                    aria-label="Agregar nueva sede"
                >
                    <PlusOutlined style={{ fontSize: 32 }} />
                </div>
                {branches.length === 0 ? (
                    <div className={styles.branchCard}>No hay sedes registradas.</div>
                ) : (
                    branches.map(branch => (
                        <div className={styles.branchCard} key={branch.id}>
                            <div className={styles.branchInfo}>
                                <div className={styles.branchName}>{branch.name}</div>
                                <div className={styles.branchDetails}>
                                    {branch.address} &middot; {branch.phone}
                                    {branch.email && (
                                        <><br /><span style={{ color: '#888' }}>{branch.email}</span></>
                                    )}
                                    {branch.manager_name && (
                                        <><br /><span style={{ color: '#888' }}>Manager: {branch.manager_name}</span></>
                                    )}
                                </div>
                            </div>
                            <div className={styles.branchStatus}>
                                <Tag color={branch.is_active ? 'green' : 'red'}>
                                    {branch.is_active ? 'Activa' : 'Inactiva'}
                                </Tag>
                            </div>
                            <Space className={styles.branchActions}>
                                <Button icon={<EditOutlined />} onClick={() => handleEdit(branch.id)}>
                                    Editar
                                </Button>
                            </Space>
                        </div>
                    ))
                )}
            </div>
            <AgregarSedeModal
                open={modalOpen}
                onClose={handleModalClose}
                onSuccess={handleModalSuccess}
                mode={modalMode}
                branch={selectedBranch}
            />
        </AdminLayout>
    );
}

