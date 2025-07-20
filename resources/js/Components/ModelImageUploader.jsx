import React, { useState } from 'react';
import { Upload, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const MAX_IMAGES = 10;

const ModelImageUploader = ({ value = [], onChange }) => {
    const [fileList, setFileList] = useState(value);

    // Custom upload handler
    const customRequest = async ({ file, onSuccess, onError, onProgress }) => {
        const formData = new FormData();
        formData.append('image', file);

        // CSRF token
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

        try {
            const response = await fetch('/admin/modelos/upload-image', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
                credentials: 'include', // Importante para la cookie de sesión
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
        // Actualizar status y url cuando la subida termina
        const updatedList = newFileList.map(f => {
            if (f.status === 'done' && f.response && f.response.success) {
                return {
                    ...f,
                    temp_id: f.response.temp_id,
                    url: f.response.url,
                    name: f.response.original_name || f.name,
                    size: f.response.size || f.size,
                };
            }
            return f;
        });
        setFileList(updatedList);
        if (onChange) onChange(updatedList);
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