import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, Row, Col, Checkbox, Card, Divider } from 'antd';
import ProductFileUploader from './ProductFileUploader';

const { TextArea } = Input;
const { Option } = Select;

const ProductModal = ({ 
    visible, 
    onCancel, 
    onSubmit, 
    mode, // 'create' o 'edit'
    productData = null,
    categories = [], // Categorías disponibles
    branches = [] // Sedes disponibles desde el backend
}) => {
    const [form] = Form.useForm();
    const [selectedBranches, setSelectedBranches] = useState([]);
    const [sameForAllBranches, setSameForAllBranches] = useState(true);
    const [productImages, setProductImages] = useState([]);
    const [originalBranchValues, setOriginalBranchValues] = useState({}); // Para guardar valores originales
    const [imagesInitialized, setImagesInitialized] = useState(false); // Flag para evitar re-procesamiento

    // Log cuando cambien las sedes disponibles
    useEffect(() => {
  
    }, [branches]);

    // Actualizar formulario cuando cambien los datos del producto
    useEffect(() => {
        if (visible) {
            if (mode === 'edit' && productData) {
                
                // Usar las sedes asignadas del backend
                const assignedBranchIds = productData.assigned_branch_ids || [];
                const assignedBranches = productData.assigned_branches || [];
                
                // Mapear los datos del backend al formulario
                const formData = {
                    name: productData.name,
                    description: productData.description,
                    price: parseFloat(productData.price),
                    category_id: productData.category_id,
                    branches: assignedBranchIds, // Usar todas las sedes asignadas
                };
                form.setFieldsValue(formData);
                setSelectedBranches(assignedBranchIds);
                
                // Inicializar datos de todas las sedes asignadas
                const branchData = {};
                const originalValues = {}; // Guardar valores originales para restaurar
                
                assignedBranches.forEach(branchInfo => {
                    const branchId = branchInfo.branch_id;
                    const price = branchInfo.price || parseFloat(productData.price);
                    const stock = branchInfo.stock_quantity || 0;
                    
                    branchData[`branch_${branchId}_price`] = price;
                    branchData[`branch_${branchId}_stock`] = stock;
                    
                    // Guardar valores originales
                    originalValues[`branch_${branchId}_price`] = price;
                    originalValues[`branch_${branchId}_stock`] = stock;
                });
                
                form.setFieldsValue(branchData);
                setOriginalBranchValues(originalValues); // Guardar para restaurar después
                
                // Procesar imágenes existentes si las hay (solo una vez)
                if (!imagesInitialized) {
                    const existingImages = productData.images || [];
                    if (existingImages.length > 0) {
                        const imagesFormatted = existingImages.map(img => ({
                            uid: img.id.toString(), // Asegurar que uid sea string
                            id: img.id,
                            existingId: img.id,
                            name: img.file_name || img.name || `Imagen ${img.id}`,
                            status: 'done',
                            url: img.url || (img.file_path && img.file_path.startsWith('http') ? img.file_path : `/${img.file_path}`),
                            isExisting: true,
                            thumbUrl: img.url || (img.file_path && img.file_path.startsWith('http') ? img.file_path : `/${img.file_path}`),
                            type: 'image/jpeg' // Tipo por defecto para compatibilidad
                        }));
                        setProductImages(imagesFormatted);
                        
                       
                    } else {
                        setProductImages([]);
                    }
                    setImagesInitialized(true);
                }

                // CORREGIDO: En modo editar, desactivar "mismo para todas" para mostrar valores personalizados
                setSameForAllBranches(false);
            } else if (mode === 'create') {
                // Valores por defecto para crear
                form.setFieldsValue({
                    name: '',
                    description: '',
                    price: 0,
                    category_id: undefined,
                    branches: [],
                });
                setSelectedBranches([]);
                setSameForAllBranches(true);
                setProductImages([]);
                setOriginalBranchValues({}); // Limpiar valores originales
                setImagesInitialized(false); // Reset flag para create
            }
        } else {
            // Cuando el modal se cierra, resetear el flag de imágenes
            setImagesInitialized(false);
        }
    }, [visible, mode, productData?.id]); // Dependencia más específica

    // Manejar cambio de sedes seleccionadas
    const handleBranchesChange = (branchIds) => {
        setSelectedBranches(branchIds);
        
        // Si está activado "mismo para todas", copiar valores del primer campo a los demás
        if (sameForAllBranches && branchIds.length > 0) {
            const firstBranchId = branchIds[0];
            const firstPrice = form.getFieldValue(`branch_${firstBranchId}_price`) || 0;
            const firstStock = form.getFieldValue(`branch_${firstBranchId}_stock`) || 0;
            
            const branchData = {};
            branchIds.forEach(branchId => {
                branchData[`branch_${branchId}_price`] = firstPrice;
                branchData[`branch_${branchId}_stock`] = firstStock;
            });
            form.setFieldsValue(branchData);
        }
    };

    // Manejar cambio del checkbox "mismo para todas"
    const handleSameForAllChange = (e) => {
        const checked = e.target.checked;
        setSameForAllBranches(checked);
        
        if (checked && selectedBranches.length > 0) {
            // ACTIVAR: Guardar valores actuales antes de aplicar configuración uniforme
            const currentValues = {};
            selectedBranches.forEach(branchId => {
                currentValues[`branch_${branchId}_price`] = form.getFieldValue(`branch_${branchId}_price`) || 0;
                currentValues[`branch_${branchId}_stock`] = form.getFieldValue(`branch_${branchId}_stock`) || 0;
            });
            setOriginalBranchValues(currentValues);
            
            // Copiar valores del primer campo a todos los demás
            const firstBranchId = selectedBranches[0];
            const firstPrice = form.getFieldValue(`branch_${firstBranchId}_price`) || 0;
            const firstStock = form.getFieldValue(`branch_${firstBranchId}_stock`) || 0;
            
            const branchData = {};
            selectedBranches.forEach(branchId => {
                branchData[`branch_${branchId}_price`] = firstPrice;
                branchData[`branch_${branchId}_stock`] = firstStock;
            });
            form.setFieldsValue(branchData);
            
        } else if (!checked && selectedBranches.length > 0) {
            // DESACTIVAR: Restaurar valores originales guardados
            const valuesToRestore = {};
            selectedBranches.forEach(branchId => {
                if (originalBranchValues[`branch_${branchId}_price`] !== undefined) {
                    valuesToRestore[`branch_${branchId}_price`] = originalBranchValues[`branch_${branchId}_price`];
                }
                if (originalBranchValues[`branch_${branchId}_stock`] !== undefined) {
                    valuesToRestore[`branch_${branchId}_stock`] = originalBranchValues[`branch_${branchId}_stock`];
                }
            });
            
            if (Object.keys(valuesToRestore).length > 0) {
                form.setFieldsValue(valuesToRestore);
            }
        }
    };

    // Manejar cambio en el primer campo cuando "mismo para todas" está activado
    const handleMasterFieldChange = (field, value) => {
        if (sameForAllBranches && selectedBranches.length > 0) {
            const branchData = {};
            selectedBranches.forEach(branchId => {
                branchData[`branch_${branchId}_${field}`] = value;
            });
            form.setFieldsValue(branchData);
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            // Estructurar datos del producto base
            const productBaseData = {
                id: mode === 'edit' ? productData?.id : null,
                name: values.name,
                description: values.description || null,
                category_id: values.category_id,
                is_active: true // Por defecto activo
            };

            // Para crear, agregar precio base (será el precio del primer branch o 0)
            if (mode === 'create') {
                if (selectedBranches.length > 0) {
                    const firstBranchId = selectedBranches[0];
                    productBaseData.price = values[`branch_${firstBranchId}_price`] || 0;
                } else {
                    productBaseData.price = 0; // Fallback si no hay sedes
                }
            }

            // Estructurar datos de las sedes (product_branch_access)
            const branchesData = selectedBranches.map(branchId => {
                const branch = branches.find(b => b.id === branchId);
                return {
                    branch_id: branchId,
                    branch_name: branch?.name, // Para referencia (no se guarda en BD)
                    price: values[`branch_${branchId}_price`] || 0,
                    stock_quantity: values[`branch_${branchId}_stock`] || 0,
                    is_active: true
                };
            });

            // Estructura final bien organizada
            const structuredData = {
                mode: mode, // 'create' o 'edit'
                product: productBaseData,
                branches: branchesData,
                images: productImages, // Agregar imágenes
                metadata: {
                    total_branches: branchesData.length,
                    same_config_all_branches: sameForAllBranches,
                    total_images: productImages.length,
                    timestamp: new Date().toISOString(),
                    form_data_raw: values // Para debugging si es necesario
                }
            };

            
    
            
            onSubmit(structuredData);
        } catch (error) {
            console.error('Error al validar formulario:', error);
        }
    };

    const handleCancel = () => {
        // Limpiar estado al cancelar
        setProductImages([]);
        setSelectedBranches([]);
        setSameForAllBranches(true);
        setOriginalBranchValues({}); // Limpiar valores originales
        setImagesInitialized(false); // Reset flag de imágenes
        form.resetFields();
        onCancel();
    };

    const modalTitle = mode === 'create' ? 'Crear Producto' : 'Editar Producto';

    return (
        <Modal
            title={modalTitle}
            open={visible}
            onCancel={handleCancel}
            onOk={handleSubmit}
            width={800}
            okText={mode === 'create' ? 'Crear' : 'Actualizar'}
            cancelText="Cancelar"
            maskClosable={false}
        >
            <Form
                form={form}
                layout="vertical"
                autoComplete="off"
            >
                <Row gutter={16}>
                    <Col span={16}>
                        <Form.Item
                            label="Nombre del Producto"
                            name="name"
                            rules={[
                                { required: true, message: 'El nombre es requerido' },
                                { max: 255, message: 'El nombre no puede exceder 255 caracteres' }
                            ]}
                        >
                            <Input placeholder="Ingrese el nombre del producto" />
                        </Form.Item>
                    </Col>
                    <Col span={8}>
                        <Form.Item
                            label="Categoría"
                            name="category_id"
                            rules={[{ required: true, message: 'La categoría es requerida' }]}
                        >
                            <Select placeholder="Seleccione una categoría">
                                {categories.map(category => (
                                    <Option key={category.id} value={category.id}>
                                        {category.name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    label="Descripción"
                    name="description"
                >
                    <TextArea 
                        rows={2} 
                        placeholder="Descripción del producto (opcional)"
                        maxLength={500}
                        showCount
                    />
                </Form.Item>

                <Divider orientation="left">Imágenes del Producto</Divider>
                
                <Form.Item
                    label="Imágenes"
                    name="product_images"
                    extra="Suba hasta 5 imágenes del producto. Formatos: JPG, PNG, GIF, WEBP (máximo 10MB cada una)"
                >
                    <ProductFileUploader
                        value={productImages}
                        onChange={(images) => {
                            if (images) {
                                setProductImages(images);
                            }
                        }}
                        maxFiles={5}
                        accept="image/*"
                        listType="picture-card"
                        uploadEndpoint="/admin/store/products/upload-image"
                    />
                    {/* Log adicional para debug */}
                    <div style={{ display: 'none' }}>
                        ProductImages length: {productImages.length} - 
                        IDs: {productImages.map(img => img.id || img.uid).join(', ')}
                    </div>
                </Form.Item>

                <Form.Item
                    label="Sedes"
                    name="branches"
                    rules={[{ required: true, message: 'Debe seleccionar al menos una sede' }]}
                >
                    <Select
                        mode="multiple"
                        placeholder="Seleccione las sedes donde estará disponible el producto"
                        onChange={handleBranchesChange}
                        optionFilterProp="children"
                    >
                        {branches.map(branch => (
                            <Option key={branch.id} value={branch.id}>
                                {branch.name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                {selectedBranches.length > 0 && (
                    <>
                        <Divider orientation="left">Configuración por Sede</Divider>
                        
                        {selectedBranches.length > 1 && (
                            <Checkbox
                                checked={sameForAllBranches}
                                onChange={handleSameForAllChange}
                                style={{ marginBottom: 16 }}
                            >
                                Usar el mismo precio y stock para todas las sedes
                            </Checkbox>
                        )}

                        <div style={{
                            maxHeight: '300px',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            paddingRight: '8px',
                            marginRight: '-8px'
                        }}>
                            {selectedBranches.map((branchId, index) => {
                                const branch = branches.find(b => b.id === branchId);
                                const isFirst = index === 0;
                                const isDisabled = sameForAllBranches && !isFirst && selectedBranches.length > 1;
                                
                                return (
                                    <Card 
                                        key={branchId}
                                        size="small"
                                        title={branch?.name}
                                        style={{ marginBottom: 16 }}
                                        type={isFirst && sameForAllBranches && selectedBranches.length > 1 ? "inner" : "default"}
                                    >
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item
                                                    label="Precio"
                                                    name={`branch_${branchId}_price`}
                                                    rules={[
                                                        { required: true, message: 'El precio es requerido' },
                                                        { type: 'number', min: 0, message: 'El precio debe ser mayor o igual a 0' }
                                                    ]}
                                                >
                                                    <InputNumber
                                                        style={{ width: '100%' }}
                                                        placeholder="0.00"
                                                        formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                                        precision={2}
                                                        min={0}
                                                        disabled={isDisabled}
                                                        onChange={(value) => isFirst && handleMasterFieldChange('price', value)}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    label="Stock"
                                                    name={`branch_${branchId}_stock`}
                                                    rules={[
                                                        { required: true, message: 'El stock es requerido' },
                                                        { type: 'number', min: 0, message: 'El stock debe ser mayor o igual a 0' }
                                                    ]}
                                                >
                                                    <InputNumber
                                                        style={{ width: '100%' }}
                                                        placeholder="0"
                                                        min={0}
                                                        precision={0}
                                                        disabled={isDisabled}
                                                        onChange={(value) => isFirst && handleMasterFieldChange('stock', value)}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </Card>
                                );
                            })}
                        </div>
                    </>
                )}
            </Form>
        </Modal>
    );
};

export default ProductModal;
