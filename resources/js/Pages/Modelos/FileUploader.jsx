import React, { useState, useEffect } from 'react';
import { Upload, message } from 'antd';
import { PlusOutlined, FileTextOutlined } from '@ant-design/icons';
import { usePage } from '@inertiajs/react';

const FileUploader = ({ 
    value = [], 
    onChange, 
    maxFiles = 10, 
    accept = "image/*", 
    fileType = "image",
    listType = "picture-card",
    uploadEndpoint = "/admin/modelos/upload-image"
}) => {
    const [fileList, setFileList] = useState([]);
    const { props } = usePage();

    // Icono según el tipo de archivo
    const uploadButtonIcon = fileType === "pdf" ? <FileTextOutlined /> : <PlusOutlined />;
    const uploadButtonText = fileType === "pdf" ? "PDF" : "Subir";

    // Sincronizar fileList cuando cambie el value (para modo edición)
    useEffect(() => {
        if (Array.isArray(value) && value.length > 0) {
            const processedValue = value.map(file => {
                if (file.isExisting) {
                    return {
                        ...file,
                        status: 'done',
                        id: file.id || file.existingId,
                        existingId: file.existingId || file.id
                    };
                }
                return file;
            });
            
            setFileList(processedValue);
        } else if (value.length === 0) {
            setFileList([]);
        }
    }, [value.length]);

    // Custom upload handler
    const customRequest = async ({ file, onSuccess, onError, onProgress }) => {
        const formData = new FormData();
        formData.append(fileType === "pdf" ? 'pdf' : 'image', file);

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
                onError(new Error(res.message || `Error al subir el ${fileType === "pdf" ? "PDF" : "archivo"}`));
            }
        } catch (err) {
            onError(new Error(`Error inesperado al subir el ${fileType === "pdf" ? "PDF" : "archivo"}`));
        }
    };

    // Manejar cambios en la lista de archivos
    const handleChange = ({ file, fileList: newFileList }) => {
        if (file.status === 'done' && file.response) {
            console.log(`${fileType.toUpperCase()} SUBIDO: ${file.name}`);
        } else if (file.status === 'removed') {
            console.log(`${fileType.toUpperCase()} ELIMINADO: ${file.name}`);
        }
        
        const updatedList = newFileList.map(f => {
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
        
        setFileList(updatedList);
        if (onChange) {
            onChange(updatedList);
        }
    };

    // Validar antes de subir
    const beforeUpload = (file) => {
        if (fileType === "pdf") {
            const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
            if (!isPdf) {
                message.error('Solo se permiten archivos PDF!');
                return Upload.LIST_IGNORE;
            }
        } else {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('Solo puede subir archivos de imagen!');
                return Upload.LIST_IGNORE;
            }
        }
        
        const maxSize = fileType === "pdf" ? 5 : 10; // PDF: 5MB, imágenes: 10MB
        const isLtMaxSize = file.size / 1024 / 1024 < maxSize;
        if (!isLtMaxSize) {
            message.error(`El archivo debe ser menor a ${maxSize}MB!`);
            return Upload.LIST_IGNORE;
        }
        
        if (fileList.length >= maxFiles) {
            message.error(`Máximo ${maxFiles} ${fileType === "pdf" ? "PDF" : "imágenes"}.`);
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
            style={{ maxWidth: '300px' }}
        >
            {fileList.length >= maxFiles ? null : (
                <div>
                    {uploadButtonIcon}
                    <div style={{ marginTop: 8 }}>{uploadButtonText}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                        Máximo {maxFiles}
                    </div>
                </div>
            )}
        </Upload>
    );
};

export default FileUploader;