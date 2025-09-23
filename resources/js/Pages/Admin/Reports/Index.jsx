
import React from 'react';
import { Typography, Button, Select, Spin } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import AdminLayout from '../../../Layouts/AdminLayout';
import styles from './Reports.module.scss';

import CustomDateRangePicker from '../../../Components/CustomDateRangePicker';

const { Title, Text } = Typography;

export default function ReportsIndex() {
    // Ya no se necesita modelosBranches
    const [empleadosBranches, setEmpleadosBranches] = React.useState([]);
    const [branchOptions, setBranchOptions] = React.useState([]);
    const [loadingBranches, setLoadingBranches] = React.useState(true);

        // Para facturas
    const [facturasBranches, setFacturasBranches] = React.useState([]);
    const [facturasDateRange, setFacturasDateRange] = React.useState([null, null]);
    const [downloadingFacturas, setDownloadingFacturas] = React.useState(false);
    const facturasDateRangeRef = React.useRef();

    // Para cierres de caja
    const [cierresBranches, setCierresBranches] = React.useState([]);
    const [dateRange, setDateRange] = React.useState([null, null]);
    const [downloadingCierres, setDownloadingCierres] = React.useState(false);
    const dateRangeRef = React.useRef();

    React.useEffect(() => {
        fetch('/admin/asistencias/branches/access')
            .then(res => res.json())
            .then(data => {
                setBranchOptions(Array.isArray(data)
                    ? data.map(b => ({ label: b.name, value: b.id }))
                    : []);
            })
            .finally(() => setLoadingBranches(false));
    }, []);

    // Handler para descargar modelos (sin sedes)
    const handleDownloadModelos = async () => {
        const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        const response = await fetch('/admin/informes/modelos/excel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': token,
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'modelos.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Handler para descargar empleados
    const handleDownloadEmpleados = async () => {
        const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        const response = await fetch('/admin/informes/empleados/excel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': token,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ branches: empleadosBranches })
        });
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'empleados.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <AdminLayout title="Informes">
            <div className={styles.reportsPage}>
                <div className={styles.headerSection}>
                    <div>
                        <Title level={2} className={styles.reportsTitle}>
                            <BarChartOutlined style={{ marginRight: '8px' }} />
                            Informes
                        </Title>
                        <Text type="secondary">Panel para visualizar y generar informes del sistema.</Text>
                    </div>
                </div>
                <div className={styles.cardContainer}>
                    {/* Card de Modelos */}
                    <div className={styles.reportCard}>
                        <div className={styles.reportTitle}>Reporte de Modelos</div>
                        <div className={styles.reportDescription}>
                            Descarga el listado completo de modelos registrados en el sistema. Este reporte incluye información relevante para análisis y gestión.
                        </div>
                        <div className={styles.reportActionsRow}>
                            <Button
                                type="primary"
                                onClick={handleDownloadModelos}
                                disabled={loadingBranches}
                            >
                                Descargar Excel de Modelos
                            </Button>
                        </div>
                    </div>
                    {/* Card de Empleados */}
                    <div className={styles.reportCard}>
                        <div className={styles.reportTitle}>Reporte de Empleados</div>
                        <div className={styles.reportDescription}>
                            Obtén el informe completo de los empleados registrados en el sistema. Incluye datos relevantes para gestión de personal y análisis de recursos humanos.
                        </div>
                        <div className={styles.reportActionsRow}>
                            {loadingBranches ? (
                                <Spin size="small" />
                            ) : (
                                <Select
                                    className={styles.branchSelector}
                                    mode="multiple"
                                    placeholder="Selecciona las sedes"
                                    options={branchOptions}
                                    value={empleadosBranches}
                                    onChange={setEmpleadosBranches}
                                />
                            )}
                            <Button
                                type="primary"
                                onClick={handleDownloadEmpleados}
                                disabled={loadingBranches || empleadosBranches.length === 0}
                            >
                                Descargar Excel de Empleados
                            </Button>
                        </div>
                    </div>
                        {/* Card de Facturas */}
                        <div className={styles.reportCard}>
                            <div className={styles.reportTitle}>Reporte de Facturas</div>
                            <div className={styles.reportDescription}>
                                Filtra las facturas por rango de fechas y sedes. Este filtro te permite preparar el reporte para exportar o visualizar.
                            </div>
                            <div className={styles.reportActionsRow}>
                                <CustomDateRangePicker
                                    ref={facturasDateRangeRef}
                                    onChange={setFacturasDateRange}
                                    className={styles.dateRangePicker}
                                    placeholder={["Fecha inicio", "Fecha fin"]}
                                    disabled={loadingBranches}
                                />
                                {loadingBranches ? (
                                    <Spin size="small" />
                                ) : (
                                    <Select
                                        className={styles.branchSelector}
                                        mode="multiple"
                                        placeholder="Selecciona las sedes"
                                        options={branchOptions}
                                        value={facturasBranches}
                                        onChange={setFacturasBranches}
                                    />
                                )}
                                <Button
                                    type="primary"
                                    loading={downloadingFacturas}
                                    onClick={async () => {
                                        if (!facturasDateRange[0] || !facturasDateRange[1] || facturasBranches.length === 0) return;
                                        setDownloadingFacturas(true);
                                        const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                                        const body = {
                                            branches: facturasBranches,
                                            start_date: facturasDateRange[0] ? facturasDateRange[0].format('YYYY-MM-DD') : null,
                                            end_date: facturasDateRange[1] ? facturasDateRange[1].format('YYYY-MM-DD') : null
                                        };
                                        try {
                                            const response = await fetch('/admin/informes/facturas/excel', {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'X-CSRF-TOKEN': token,
                                                    'X-Requested-With': 'XMLHttpRequest'
                                                },
                                                body: JSON.stringify(body)
                                            });
                                            const blob = await response.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = 'facturas.xlsx';
                                            a.click();
                                            window.URL.revokeObjectURL(url);
                                        } finally {
                                            setDownloadingFacturas(false);
                                        }
                                    }}
                                    disabled={
                                        loadingBranches ||
                                        facturasBranches.length === 0 ||
                                        !facturasDateRange[0] || !facturasDateRange[1]
                                    }
                                >
                                    Descargar Excel de Facturas
                                </Button>
                            </div>
                        </div>
                        {/* Card de Cierres de Caja */}
                        <div className={styles.reportCard}>
                            <div className={styles.reportTitle}>Reporte de Cierres de Caja</div>
                            <div className={styles.reportDescription}>
                                Descarga el informe de cierres de caja filtrando por rango de fechas y sedes. El reporte incluye la conversión de hora local Colombia.
                            </div>
                            <div className={styles.reportActionsRow}>
                                <CustomDateRangePicker
                                    ref={dateRangeRef}
                                    onChange={setDateRange}
                                    className={styles.dateRangePicker}
                                    placeholder={["Fecha inicio", "Fecha fin"]}
                                    disabled={loadingBranches}
                                />
                                {loadingBranches ? (
                                    <Spin size="small" />
                                ) : (
                                    <Select
                                        className={styles.branchSelector}
                                        mode="multiple"
                                        placeholder="Selecciona las sedes"
                                        options={branchOptions}
                                        value={cierresBranches}
                                        onChange={setCierresBranches}
                                    />
                                )}
                                <Button
                                    type="primary"
                                    loading={downloadingCierres}
                                    onClick={async () => {
                                        if (!dateRange[0] || !dateRange[1] || cierresBranches.length === 0) return;
                                        setDownloadingCierres(true);
                                        const token = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
                                        const body = {
                                            branches: cierresBranches,
                                            start_date: dateRange[0] ? dateRange[0].format('YYYY-MM-DD') : null,
                                            end_date: dateRange[1] ? dateRange[1].format('YYYY-MM-DD') : null
                                        };
                                        try {
                                            const response = await fetch('/admin/informes/cierres-caja/excel', {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'X-CSRF-TOKEN': token,
                                                    'X-Requested-With': 'XMLHttpRequest'
                                                },
                                                body: JSON.stringify(body)
                                            });
                                            const blob = await response.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = 'cierres_caja.xlsx';
                                            a.click();
                                            window.URL.revokeObjectURL(url);
                                        } finally {
                                            setDownloadingCierres(false);
                                        }
                                    }}
                                    disabled={
                                        loadingBranches ||
                                        cierresBranches.length === 0 ||
                                        !dateRange[0] || !dateRange[1]
                                    }
                                >
                                    Descargar Excel de Cierres de Caja
                                </Button>
                            </div>
                        </div>
                </div>
            </div>
        </AdminLayout>
    );
}
