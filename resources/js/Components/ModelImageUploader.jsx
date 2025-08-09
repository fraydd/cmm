import React, { useState, useEffect } from 'react';
import { Upload, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { usePage } from '@inertiajs/react';

const MAX_IMAGES = 10;

const ModelImageUploader = ({ value = [], onChange }) => {
    const [fileList, setFileList] = useState(value);
    const { props } = usePage();

    // Sincronizar fileList cuando cambie el value (para modo edición)
    useEffect(() => {
        // Solo logear si hay un cambio real en la cantidad de imágenes
        if (value.length !== fileList.length) {
            console.log(`SYNC UPLOADER: ${fileList.length} -> ${value.length} imágenes`);
        }
        
        // Asegurar que las imágenes existentes mantengan sus marcadores
        const processedValue = value.map(img => {
            if (img.isExisting) {
                return {
                    ...img,
                    status: 'done',
                    // Asegurar que no se pierdan los IDs para imágenes existentes
                    id: img.id || img.existingId,
                    existingId: img.existingId || img.id
                };
            }
            return img;
        });
        
        setFileList(processedValue);
    }, [value]);

    // Custom upload handler
    const customRequest = async ({ file, onSuccess, onError, onProgress }) => {
        const formData = new FormData();
        formData.append('image', file);

        // CSRF token: obtener desde Inertia, cookie o meta tag
        let csrfToken = props.csrf_token; // Desde Inertia
        
        // Si no está en Inertia, obtener de la cookie XSRF-TOKEN decodificada
        if (!csrfToken) {
            // Función para obtener cookie por nombre
            const getCookie = (name) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop().split(';').shift();
            };

            // Obtener token de la cookie XSRF-TOKEN y decodificar
            const xsrfToken = getCookie('XSRF-TOKEN');
            if (xsrfToken) {
                try {
                    csrfToken = decodeURIComponent(xsrfToken);
                } catch (e) {
                    console.error('Error decodificando XSRF token:', e);
                }
            }
        }

        // Si no hay token en cookie, intentar obtener del meta tag
        if (!csrfToken) {
            csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        }

        try {
            const response = await fetch('/admin/modelos/upload-image', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
                credentials: 'same-origin', // Cambiar de 'include' a 'same-origin'
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
        // Solo logear acciones importantes
        if (file.status === 'done') {
            console.log(`IMAGEN SUBIDA: ${file.name}`);
        } else if (file.status === 'removed') {
            console.log(`IMAGEN ELIMINADA: ${file.name}`);
        }
        
        // Actualizar status y url cuando la subida termina
        const updatedList = newFileList.map(f => {
            // Si es una imagen nueva que se acaba de subir
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
            // Si es una imagen existente (del modo edición), mantener sus datos
            if (f.isExisting || (f.uid && f.url && !f.response && !f.originFileObj)) {
                return {
                    ...f,
                    status: 'done',
                    isExisting: true,
                    id: f.id || f.existingId || f.uid,
                    existingId: f.existingId || f.id || f.uid
                };
            }
            return f;
        });
        
        console.log(`LISTA ACTUALIZADA: ${updatedList.length} total`);
        setFileList(updatedList);
        if (onChange) {
            onChange(updatedList);
        }
    };

    // Validar antes de subir
    const beforeUpload = (file) => {
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('Solo puede subir archivos de imagen!');
            return Upload.LIST_IGNORE;
        }
        const isLt10M = file.size / 1024 / 1024 < 10;
        if (!isLt10M) {
            message.error('La imagen debe ser menor a 10MB!');
            return Upload.LIST_IGNORE;
        }
        if (fileList.length >= MAX_IMAGES) {
            message.error(`Máximo ${MAX_IMAGES} imágenes.`);
            return Upload.LIST_IGNORE;
        }
        return true;
    };

    return (
        <Upload
            listType="picture-card"
            customRequest={customRequest}
            fileList={fileList}
            onChange={handleChange}
            beforeUpload={beforeUpload}
            maxCount={MAX_IMAGES}
            multiple
            accept="image/*"
            showUploadList={{ showRemoveIcon: true }}
        >
            {fileList.length >= MAX_IMAGES ? null : (
                <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Subir</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                        Máximo {MAX_IMAGES}
                    </div>
                </div>
            )}
        </Upload>
    );
};

export default ModelImageUploader;