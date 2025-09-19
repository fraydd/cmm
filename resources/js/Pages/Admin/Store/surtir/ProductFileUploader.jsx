import React, { useState, useEffect } from 'react';
import { Upload, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { usePage } from '@inertiajs/react';

const ProductFileUploader = ({ 
    value = [], 
    onChange, 
    maxFiles = 5,
    accept = "image/*",
    listType = "picture-card",
    uploadEndpoint = "/admin/store/products/upload-image"
}) => {
    const [fileList, setFileList] = useState([]);
    const { props } = usePage();

    // Sincronizar fileList cuando cambie el value (para modo edición)
    useEffect(() => {
        
        // Procesar si hay valores en value
        if (Array.isArray(value) && value.length > 0) {
            // Verificar si ya tenemos estos archivos para evitar re-procesamiento
            const valueIds = value.map(file => file.id || file.uid || file.temp_id).filter(Boolean);
            const currentIds = fileList.map(file => file.id || file.uid || file.temp_id).filter(Boolean);

            
            // SIMPLIFICADO: Siempre procesar si el fileList está vacío o los IDs son diferentes
            if (fileList.length === 0 || JSON.stringify(valueIds.sort()) !== JSON.stringify(currentIds.sort())) {
                const processedValue = value.map((file, index) => {
                    if (file.isExisting) {
                        return {
                            ...file,
                            status: 'done',
                            id: file.id || file.existingId,
                            existingId: file.existingId || file.id,
                            uid: file.uid || file.id?.toString() || `existing-${file.id || index}`
                        };
                    }
                    return {
                        ...file,
                        uid: file.uid || file.temp_id || `new-${index}-${Date.now()}`
                    };
                });

                setFileList(processedValue);
            } else {
                console.log('⏭️ ProductFileUploader - Sin cambios necesarios en fileList');
            }
        } else if (Array.isArray(value) && value.length === 0 && fileList.length > 0) {
            setFileList([]);
        }
    }, [value]); // SIMPLIFICADO: Solo depender de value

    // Custom upload handler
    const customRequest = async ({ file, onSuccess, onError, onProgress }) => {
        const formData = new FormData();
        formData.append('image', file);

        // CSRF token
        let csrfToken = props.csrf_token;
        
        if (!csrfToken) {
            const getCookie = (name) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop().split(';').shift();
            };

            const xsrfToken = getCookie('XSRF-TOKEN');
            if (xsrfToken) {
                try {
                    csrfToken = decodeURIComponent(xsrfToken);
                } catch (e) {
                    console.error('Error decodificando XSRF token:', e);
                }
            }
        }

        if (!csrfToken) {
            csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        }

        try {
            const response = await fetch(uploadEndpoint, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
                credentials: 'same-origin',
            });

            const res = await response.json();

            if (response.ok && res.success) {
                file.temp_id = res.temp_id;
                file.url = res.url;
                file.response = res;
                onSuccess(res, file);
            } else {
                onError(new Error(res.message || 'Error al subir la imagen'));
            }
        } catch (err) {
            onError(new Error('Error inesperado al subir la imagen'));
        }
    };

    // Manejar cambios en la lista de archivos
    const handleChange = ({ file, fileList: newFileList }) => {
        
        const updatedList = newFileList.map(f => {
            // Imagen recién subida
            if (f.status === 'done' && f.response && f.response.success) {
                return {
                    ...f,
                    temp_id: f.response.temp_id,
                    url: f.response.url,
                    name: f.response.original_name || f.name,
                    size: f.response.size || f.size,
                    isNew: true,
                };
            }
            // Imagen existente (de edición)
            if (f.isExisting || (f.uid && f.url && !f.response && !f.originFileObj)) {
                return {
                    ...f,
                    status: 'done',
                    isExisting: true,
                    id: f.id || f.existingId || f.uid,
                    existingId: f.existingId || f.id || f.uid
                };
            }
            // Otros casos (uploading, error, etc.)
            return f;
        });
        
        setFileList(updatedList);
        
        // Evitar llamar onChange si viene de una sincronización interna
        if (onChange) {
            // Pequeño debounce para evitar múltiples llamadas
            setTimeout(() => {
                onChange(updatedList);
            }, 0);
        }
    };

    // Validar antes de subir
    const beforeUpload = (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('Solo puede subir archivos de imagen!');
            return Upload.LIST_IGNORE;
        }
        
        const isLtMaxSize = file.size / 1024 / 1024 < 10; // 10MB
        if (!isLtMaxSize) {
            message.error('La imagen debe ser menor a 10MB!');
            return Upload.LIST_IGNORE;
        }
        
        if (fileList.length >= maxFiles) {
            message.error(`Máximo ${maxFiles} imágenes.`);
            return Upload.LIST_IGNORE;
        }
        
        return true;
    };



    return (
        <Upload
            listType={listType}
            customRequest={customRequest}
            fileList={fileList}
            onChange={handleChange}
            beforeUpload={beforeUpload}
            maxCount={maxFiles}
            multiple={maxFiles > 1}
            accept={accept}
            showUploadList={{ showRemoveIcon: true }}
        >
            {fileList.length >= maxFiles ? null : (
                <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Subir</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                        Máximo {maxFiles}
                    </div>
                </div>
            )}
        </Upload>
    );
};

export default ProductFileUploader;
