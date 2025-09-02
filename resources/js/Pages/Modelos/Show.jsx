import React, { useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import { List, Typography, Space, Button } from 'antd';
import { 
    FacebookOutlined, 
    InstagramOutlined, 
    TwitterOutlined, 
    LinkOutlined,
    TikTokOutlined,
    UserOutlined,
    ColumnHeightOutlined,
    BorderOutlined,
    ScanOutlined,
    EyeOutlined,
    ScissorOutlined,
    CaretUpOutlined,
    ArrowUpOutlined,
    TeamOutlined
} from '@ant-design/icons';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import styles from './Show.module.scss';
import ResponsiveNavMenu from '../../Components/ResponsiveNavMenu';
import { Viewer } from '@react-pdf-viewer/core';
import { Worker } from '@react-pdf-viewer/core'; // Importa Worker
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import '@react-pdf-viewer/core/lib/styles/index.css';

// Configura el workerSrc para PDF.js
import * as pdfjs from 'pdfjs-dist';

// Esta línea es CRUCIAL para resolver el error
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
export default function Show({ 
    modelo, 
    imagenes, 
    redes_sociales, 
    acudiente, 
    suscripciones, 
    portafolio,
    finanzas
}) {
    const [activeSection, setActiveSection] = useState('info');
    const [selectedImage, setSelectedImage] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);

    const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    };

    // Referencias para el visor 3D
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const modelRef = useRef(null);
    const rendererRef = useRef(null);
    const labelRendererRef = useRef(null);
    const markersRef = useRef([]);

    // Definir los elementos del menú según la nueva estructura
    const menuItems = [
        { key: 'info', label: 'Información' },
        { key: 'portfolio', label: 'Portafolio' },
        { key: 'acudiente', label: 'Acudiente' },
        { key: 'finanzas', label: 'Finanzas' }
    ];

   const carouselImages = imagenes.map(img => `/${img.file_path}`);
   const fotoperfil = carouselImages.length > 0 ? carouselImages[0] : '';
    // Transformar las imágenes al formato que requiere react-image-gallery
    const galleryImages = carouselImages.map((imageSrc, index) => ({
        original: imageSrc,
        thumbnail: imageSrc,
        originalAlt: `Imagen ${index + 1}`,
        thumbnailAlt: `Miniatura ${index + 1}`,
        description: `Imagen ${index + 1} del portafolio`
    }));
    const handleMenuClick = (key) => {
        setActiveSection(key);
    };
    function formatearCOP(valorStr) {
        // convertir el string a número
        const valor = parseFloat(valorStr);

        // en caso de que no sea un número válido
        if (isNaN(valor)) return "Valor no válido";

        // formatear a pesos colombianos
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            minimumFractionDigits: 0 // usa 2 si quieres decimales
        }).format(valor);
    }


    // Función para obtener el icono correcto según la plataforma
    const getSocialIcon = (plataforma) => {
        const platform = plataforma.toLowerCase();
        switch (platform) {
            case 'facebook':
                return <FacebookOutlined style={{ color: '#1877f2', fontSize: '24px' }} />;
            case 'instagram':
                return <InstagramOutlined style={{ color: '#E4405F', fontSize: '24px' }} />;
            case 'twitter':
                return <TwitterOutlined style={{ color: '#1DA1F2', fontSize: '24px' }} />;
            case 'tiktok':
                return <TikTokOutlined style={{ color: '#000000', fontSize: '24px' }} />;
            default:
                return <LinkOutlined style={{ color: '#666666', fontSize: '24px' }} />;
        }
    };

    // Funciones para el modal de imagen
    const openImageModal = (image, index) => {
        setSelectedImage(image);
        setCurrentImageIndex(index);
        setIsModalOpen(true);
    };

    const closeImageModal = () => {
        setSelectedImage(null);
        setCurrentImageIndex(0);
        setIsModalOpen(false);
    };

    const goToPreviousImage = () => {
        const newIndex = currentImageIndex === 0 ? carouselImages.length - 1 : currentImageIndex - 1;
        setCurrentImageIndex(newIndex);
        setSelectedImage(carouselImages[newIndex]);
    };

    const goToNextImage = () => {
        const newIndex = currentImageIndex === carouselImages.length - 1 ? 0 : currentImageIndex + 1;
        setCurrentImageIndex(newIndex);
        setSelectedImage(carouselImages[newIndex]);
    };

    // Cerrar modal con tecla Escape y navegar con flechas
    React.useEffect(() => {
        const handleKeyDown = (event) => {
            if (!isModalOpen) return;
            
            switch (event.key) {
                case 'Escape':
                    closeImageModal();
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    goToPreviousImage();
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    goToNextImage();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isModalOpen, currentImageIndex]);

    // Efecto para inicializar el visor 3D cuando se selecciona la sección
    React.useEffect(() => {
        if (activeSection === 'info') {
            // Cargar Three.js y los loaders necesarios dinámicamente
            const loadThreeJS = async () => {
                
                if (!window.THREE) {
                    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js');
                }
                
                // Cargar loaders necesarios para modelos 3D
                if (!window.THREE.GLTFLoader) {
                    await loadScript('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js');
                }
                
                setTimeout(() => initializeViewer3D(), 100);
            };
            
            loadThreeJS();
        }
    }, [activeSection]);

    // Función helper para cargar scripts
    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    // Función para inicializar el visor 3D
    const initializeViewer3D = () => {
        
        if (!window.THREE) {
            console.error('❌ Three.js no está disponible');
            return;
        }

        const container = document.getElementById('canvas-container-3d');
        const loading = document.querySelector(`.${styles.loading3d}`);
        
        if (!container || container.querySelector('canvas[data-initialized]')) {
            return;
        }


        // Variables del visor 3D
        let scene, camera, renderer, model;
        let rotationDirection = 1; // 1 para derecha, -1 para izquierda
        let currentRotation = 0; // Ángulo actual de rotación
        const maxRotation = Math.PI * 0.15; // 27 grados máximo en cada dirección (reducido de 90 grados)
        // Solo rotación automática, sin controles de usuario

        // Crear escena
        scene = new window.THREE.Scene();
        scene.background = new window.THREE.Color(0x000000); // Fondo negro para mejor contraste
        sceneRef.current = scene;

        // Crear cámara con un campo de visión más amplio para mostrar el modelo completo
        camera = new window.THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(0, 2.0, 2.2); // Posición inicial en picada pero más cerca: reducido Y de 2.2 a 2.0 y Z de 2.8 a 2.2

        // Crear renderer
        const canvas = document.getElementById('three-canvas-3d');
        renderer = new window.THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limitar pixel ratio para mejor performance
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = window.THREE.PCFSoftShadowMap; // Sombras más suaves
        renderer.outputEncoding = window.THREE.sRGBEncoding; // Usar outputEncoding en lugar de gammaOutput
        renderer.toneMapping = window.THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.9; // Reducir exposición para que se note mejor el rim lighting (de 2.2 a 1.9)
        renderer.physicallyCorrectLights = true; // Iluminación físicamente correcta
        
        rendererRef.current = renderer;

        // Marcar canvas como inicializado
        canvas.setAttribute('data-initialized', 'true');

        // Bloquear todas las interacciones del usuario con el canvas y el contenedor
        const blockInteractions = () => {
            // Configurar canvas para no recibir eventos
            canvas.style.userSelect = 'none';
            canvas.style.pointerEvents = 'none';
            canvas.style.touchAction = 'none';
            
            // Bloquear eventos también en el contenedor
            container.style.overflow = 'hidden';
            container.style.touchAction = 'none';
            
            // Prevenir todos los eventos de mouse en canvas
            const preventEvent = (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
            };
            
            // Eventos en canvas
            ['mousedown', 'mouseup', 'mousemove', 'click', 'dblclick', 'contextmenu', 'selectstart'].forEach(event => {
                canvas.addEventListener(event, preventEvent, { passive: false, capture: true });
            });
            
            // Prevenir scroll/zoom de manera más robusta
            ['wheel', 'DOMMouseScroll', 'mousewheel'].forEach(event => {
                canvas.addEventListener(event, preventEvent, { passive: false, capture: true });
                container.addEventListener(event, preventEvent, { passive: false, capture: true });
            });
            
            // Prevenir eventos táctiles en móviles de manera más robusta
            ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(event => {
                canvas.addEventListener(event, preventEvent, { passive: false, capture: true });
                container.addEventListener(event, preventEvent, { passive: false, capture: true });
            });
            
            // Prevenir arrastrar y otros eventos
            ['dragstart', 'drag', 'dragend', 'drop'].forEach(event => {
                canvas.addEventListener(event, preventEvent, { passive: false, capture: true });
            });
            
            // Prevenir eventos de teclado
            ['keydown', 'keyup', 'keypress'].forEach(event => {
                canvas.addEventListener(event, preventEvent, { passive: false, capture: true });
            });
        };

        // Función para crear marcadores del cuerpo con etiquetas 3D reales
        const createBodyMarkers = () => {
            
            if (!sceneRef.current || !modelRef.current) {
                return;
            }


            // Definir las medidas que queremos mostrar (solo las que están en la base de datos)
            const measurementData = {
                'Marker_Altura': {
                    measurement: 'Altura',
                    value: modelo?.altura ? `${modelo.altura} cm` : modelo?.medidas_fisicas?.estatura ? `${modelo.medidas_fisicas.estatura}m` : 'N/A'
                },
                'Marker_Busto': {
                    measurement: 'Busto',
                    value: modelo?.medida_busto ? `${modelo.medida_busto} cm` : modelo?.medidas_fisicas?.busto ? `${modelo.medidas_fisicas.busto} cm` : 'N/A'
                },
                'Marker_Cintura': {
                    measurement: 'Cintura',
                    value: modelo?.medida_cintura ? `${modelo.medida_cintura} cm` : modelo?.medidas_fisicas?.cintura ? `${modelo.medidas_fisicas.cintura} cm` : 'N/A'
                },
                'Marker_Cadera': {
                    measurement: 'Cadera',
                    value: modelo?.medida_cadera ? `${modelo.medida_cadera} cm` : modelo?.medidas_fisicas?.cadera ? `${modelo.medidas_fisicas.cadera} cm` : 'N/A'
                },
                'Marker_ColorCabello': {
                    measurement: 'Color Cabello',
                    value: modelo?.color_cabello || modelo?.caracteristicas?.color_cabello || 'N/A'
                },
                'Marker_ColorOjos': {
                    measurement: 'Color Ojos',
                    value: modelo?.color_ojos || modelo?.caracteristicas?.color_ojos || 'N/A'
                },
                'Marker_ColorPiel': {
                    measurement: 'Color Piel',
                    value: modelo?.color_piel || modelo?.caracteristicas?.color_piel || 'N/A'
                }
            };

            // Buscar marcadores en el modelo de Blender
            const bodyMarkers = [];
            
            // Recorrer todos los objetos del modelo para encontrar los marcadores
            modelRef.current.traverse((child) => {
                // Buscar objetos que empiecen con "Marker_"
                if (child.name && child.name.startsWith('Marker_')) {
                    const markerName = child.name;
                    const measurementInfo = measurementData[markerName];
                    
                    if (measurementInfo) {
                        
                        // Usar la posición del objeto desde Blender
                        bodyMarkers.push({
                            position: [child.position.x, child.position.y, child.position.z],
                            measurement: measurementInfo.measurement,
                            value: measurementInfo.value,
                            markerObject: child // Guardar referencia al objeto original
                        });
                        
                        // Ocultar el marcador original de Blender (opcional)
                        child.visible = false;
                    }
                }
            });

            // Si no encontramos marcadores en Blender, no mostrar marcadores por defecto
            // Los marcadores solo se mostrarán si están definidos como Empty objects en el modelo 3D
            if (bodyMarkers.length === 0) {
                // No crear marcadores por defecto - solo usar los del modelo 3D
                return;
            }


            // Crear los marcadores 3D con sprites que se ocultan detrás del modelo
            bodyMarkers.forEach((markerData, index) => {
                
                // Crear canvas para la etiqueta
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                
                // Configurar tamaño del canvas (reducido para menos separación)
                canvas.width = 800;
                canvas.height = 220; // Reducido de 280 a 220 para menos separación
                
                // Configurar estilos del texto
                context.font = 'bold 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                
                // SIN FONDO - solo texto con sombra para contraste
                // No dibujar rectángulo de fondo
                
                // Dibujar texto del título (measurement) en blanco con sombra
                context.fillStyle = '#000000'; // Sombra negra
                context.font = 'bold 50px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'; // Reducido de 56px a 50px
                // Sombra del título
                context.fillText(markerData.measurement, 404, 70); // Posición Y reducida de 84 a 70
                context.fillText(markerData.measurement, 396, 70);
                context.fillText(markerData.measurement, 400, 74);
                context.fillText(markerData.measurement, 400, 66);
                
                // Texto del título en blanco
                context.fillStyle = '#FFFFFF';
                context.fillText(markerData.measurement, 400, 70);
                
                // Dibujar texto del valor en blanco más grande con sombra
                context.fillStyle = '#000000'; // Sombra negra
                context.font = 'bold 60px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'; // Reducido de 68px a 60px
                // Sombra del valor
                context.fillText(markerData.value, 404, 150); // Posición Y reducida de 204 a 150
                context.fillText(markerData.value, 396, 150);
                context.fillText(markerData.value, 400, 154);
                context.fillText(markerData.value, 400, 146);
                
                // Texto del valor en blanco
                context.fillStyle = '#FFFFFF';
                context.fillText(markerData.value, 400, 150);
                
                // Crear textura desde el canvas
                const texture = new window.THREE.CanvasTexture(canvas);
                texture.needsUpdate = true;
                
                // Crear material del sprite
                const spriteMaterial = new window.THREE.SpriteMaterial({ 
                    map: texture,
                    transparent: true,
                    alphaTest: 0.1,
                    depthTest: true, // Esto hace que se oculte detrás del modelo
                    depthWrite: false
                });
                
                // Crear sprite
                const sprite = new window.THREE.Sprite(spriteMaterial);
                sprite.position.set(...markerData.position);
                
                // Escalar el sprite para que se vea bien (ajustado para canvas más compacto)
                sprite.scale.set(0.8, 0.22, 1); // Reducido Y de 0.28 a 0.22 para proporción del canvas más pequeño
                
                // Agregar al modelo para que rote con él
                modelRef.current.add(sprite);
                markersRef.current.push(sprite);
                
            });

        };

        // Función para cargar modelo 3D externo
        const loadExternalModel = () => {
            // Determinar dinámicamente el modelo según el género
            let selectedModelUrl;
            
            // Obtener el género del modelo desde el backend
            const generoModelo = modelo?.datos_personales?.genero?.toLowerCase();
            
            // Seleccionar modelo 3D según el género
            if (generoModelo === 'femenino') {
                selectedModelUrl = '/storage/3DModels/girl.glb';
            } else if (generoModelo === 'masculino') {
                selectedModelUrl = '/storage/3DModels/men.glb';
            } else {
                // Para casos de "No binario" o "Prefiero no decir", usar un modelo por defecto
                selectedModelUrl = '/storage/3DModels/girl.glb';
            }

            if (window.THREE.GLTFLoader) {
                const loader = new window.THREE.GLTFLoader();
                
                loader.load(
                    selectedModelUrl,
                    (gltf) => {
                        
                        model = gltf.scene;
                        modelRef.current = model;
                        
                        // Ajustar escala y posición del modelo
                        model.scale.setScalar(1);
                        model.position.set(0, 0, 0);
                        
                        // Calcular dimensiones del modelo
                        const box = new window.THREE.Box3().setFromObject(model);
                        const center = box.getCenter(new window.THREE.Vector3());
                        const size = box.getSize(new window.THREE.Vector3());
                        
                        // Ajustar posición del modelo para que esté completamente visible
                        // Posicionar el modelo correctamente sobre el piso
                        model.position.x = -center.x;
                        model.position.y = -box.min.y + 0.05; // Elevar ligeramente sobre el piso para que los pies no se corten
                        model.position.z = -center.z;
                        
                        // Ajustar la cámara para vista en picada más dinámica
                        const maxDim = Math.max(size.x, size.y, size.z);
                        // Posición de cámara en picada: más alta en Y, ligeramente atrás en Z
                        camera.position.set(0, size.y * 0.85, maxDim * 1.2); // Subir Y significativamente para picada
                        camera.lookAt(0, size.y * 0.45, 0); // Mirar hacia un punto más centrado del modelo
                        
                        // Habilitar sombras en el modelo
                        model.traverse((child) => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                                
                                // Suavizar el modelo
                                if (child.material) {
                                    // Si es un array de materiales
                                    if (Array.isArray(child.material)) {
                                        child.material.forEach(mat => {
                                            mat.needsUpdate = true;
                                            // Configuraciones para suavizar
                                            if (mat.map) mat.map.generateMipmaps = true;
                                            mat.transparent = false;
                                            mat.side = window.THREE.FrontSide;
                                            // Reducir brillo especular para menos reflejos duros
                                            if (mat.metalness !== undefined) mat.metalness = Math.min(mat.metalness, 0.3);
                                            if (mat.roughness !== undefined) mat.roughness = Math.max(mat.roughness, 0.7);
                                        });
                                    } else {
                                        child.material.needsUpdate = true;
                                        // Configuraciones para suavizar
                                        if (child.material.map) child.material.map.generateMipmaps = true;
                                        child.material.transparent = false;
                                        child.material.side = window.THREE.FrontSide;
                                        // Reducir brillo especular para menos reflejos duros
                                        if (child.material.metalness !== undefined) child.material.metalness = Math.min(child.material.metalness, 0.3);
                                        if (child.material.roughness !== undefined) child.material.roughness = Math.max(child.material.roughness, 0.7);
                                    }
                                }
                                
                                // Suavizar geometría si es necesario
                                if (child.geometry) {
                                    child.geometry.computeVertexNormals();
                                    if (child.geometry.attributes.normal) {
                                        child.geometry.normalizeNormals();
                                    }
                                }
                            }
                        });
                        
                        sceneRef.current.add(model);
                        
                        // Inicializar rotación del modelo
                        model.rotation.y = 0;
                        
                        // Crear marcadores de medidas corporales
                        setTimeout(() => {
                            createBodyMarkers();
                        }, 500); // Pequeño delay para asegurar que el modelo esté listo
                        
                        // Ocultar loading cuando el modelo esté cargado
                        if (loading) {
                            loading.style.display = 'none';
                            loading.style.cssText = 'display: none;'; // Asegurar que solo tenga display none
                        }
                        
                    },
                    (progress) => {
                        // Progreso de carga
                        const percent = Math.round((progress.loaded / progress.total) * 100);
                        if (loading) {
                            loading.textContent = `Cargando... ${percent}%`;
                            loading.style.cssText = ''; // Limpiar cualquier estilo inline
                        }
                    },
                    (error) => {
                        console.error('Error cargando el modelo 3D:', error);
                        if (loading) {
                            loading.textContent = 'Error cargando modelo...';
                            loading.style.cssText = ''; // Limpiar cualquier estilo inline
                        }
                        
                    }
                );
            } else {
                console.warn('GLTFLoader no disponible');
            }
        };

        // Agregar luces mejoradas con Rim Lighting cinematográfico
        const addLights = () => {
            // Crear piso/plataforma sólida
            const floorGeometry = new window.THREE.PlaneGeometry(20, 20);
            const floorMaterial = new window.THREE.MeshLambertMaterial({ 
                color: 0x000000, // Negro puro para el piso
                transparent: false
            });
            const floor = new window.THREE.Mesh(floorGeometry, floorMaterial);
            floor.rotation.x = -Math.PI / 2; // Rotar para que sea horizontal
            floor.position.y = -0.1; // Ligeramente por debajo del nivel del suelo
            floor.receiveShadow = true; // El piso puede recibir sombras
            scene.add(floor);

            // Luz ambiental suave para iluminación base
            const ambientLight = new window.THREE.AmbientLight(0x404040, 0.4); // Reducida para más contraste
            scene.add(ambientLight);

            // Luz hemisférica para iluminación natural
            const hemiLight = new window.THREE.HemisphereLight(0xffffff, 0x222222, 0.6);
            hemiLight.position.set(0, 20, 0);
            scene.add(hemiLight);

            // Luz direccional principal (key light) más potente
            const keyLight = new window.THREE.DirectionalLight(0xffffff, 1.5);
            keyLight.position.set(8, 12, 6);
            keyLight.castShadow = true;
            keyLight.shadow.mapSize.width = 4096;
            keyLight.shadow.mapSize.height = 4096;
            keyLight.shadow.camera.near = 0.5;
            keyLight.shadow.camera.far = 50;
            keyLight.shadow.camera.left = -12;
            keyLight.shadow.camera.right = 12;
            keyLight.shadow.camera.top = 12;
            keyLight.shadow.camera.bottom = -12;
            keyLight.shadow.radius = 10;
            keyLight.shadow.blurSamples = 25;
            keyLight.shadow.bias = -0.0001;
            scene.add(keyLight);

            // Luz de relleno (fill light)
            const fillLight = new window.THREE.DirectionalLight(0xffffff, 0.5);
            fillLight.position.set(-6, 8, -4);
            fillLight.castShadow = false;
            scene.add(fillLight);

            // RIM LIGHTING ROJO - Lado derecho
            const rimLightRed = new window.THREE.DirectionalLight(0xff3030, 2.0); // Rojo intenso
            rimLightRed.position.set(6, 2, -8); // Desde atrás derecha del modelo
            rimLightRed.castShadow = false;
            scene.add(rimLightRed);

            // RIM LIGHTING AZUL - Lado izquierdo
            const rimLightBlue = new window.THREE.DirectionalLight(0x3060ff, 2.0); // Azul intenso
            rimLightBlue.position.set(-6, 2, -8); // Desde atrás izquierda del modelo
            rimLightBlue.castShadow = false;
            scene.add(rimLightBlue);

            // Rim light adicional desde arriba (color cálido)
            const rimLightTop = new window.THREE.DirectionalLight(0xffaa60, 1.2); // Naranja cálido
            rimLightTop.position.set(0, 8, -10); // Desde arriba y atrás
            rimLightTop.castShadow = false;
            scene.add(rimLightTop);

            // Luz puntual frontal para resaltar detalles faciales
            const faceLight = new window.THREE.PointLight(0xffffff, 0.6, 15);
            faceLight.position.set(0, 3, 4);
            faceLight.castShadow = false;
            scene.add(faceLight);

            // Luz desde abajo muy suave para eliminar sombras duras
            const bottomLight = new window.THREE.DirectionalLight(0x4080ff, 0.2); // Azul muy suave
            bottomLight.position.set(0, -1, 2);
            bottomLight.castShadow = false;
            scene.add(bottomLight);

            // Luces puntuales adicionales para efectos de rim lighting más definidos
            const rimPointRed = new window.THREE.PointLight(0xff2040, 1.5, 25); // Rojo puntual
            rimPointRed.position.set(4, 2, -6);
            rimPointRed.castShadow = false;
            scene.add(rimPointRed);

            const rimPointBlue = new window.THREE.PointLight(0x4080ff, 1.5, 25); // Azul puntual
            rimPointBlue.position.set(-4, 2, -6);
            rimPointBlue.castShadow = false;
            scene.add(rimPointBlue);
        };

        // Función de animación automática con rotación pendular
        const animate = () => {
            const animationId = requestAnimationFrame(animate);

            // Rotación pendular suave (ida y vuelta sin vueltas completas)
            if (modelRef.current && modelRef.current.rotation !== undefined) {
                // Velocidad mucho más lenta
                const rotationSpeed = 0.0008; // Reducido de 0.002 a 0.0008 (mucho más lento)
                
                // Actualizar rotación actual
                currentRotation += rotationSpeed * rotationDirection;
                
                // Cambiar dirección cuando se alcanza el límite
                if (currentRotation >= maxRotation) {
                    rotationDirection = -1; // Cambiar a izquierda
                    currentRotation = maxRotation; // Asegurar que no exceda el límite
                } else if (currentRotation <= -maxRotation) {
                    rotationDirection = 1; // Cambiar a derecha
                    currentRotation = -maxRotation; // Asegurar que no exceda el límite
                }
                
                // Aplicar la rotación al modelo
                modelRef.current.rotation.y = currentRotation;
            }

            // Renderizar escena principal (los sprites se renderizan automáticamente)
            if (rendererRef.current && sceneRef.current && camera) {
                rendererRef.current.render(sceneRef.current, camera);
            }
        };

        // Inicializar todo en el orden correcto
        addLights();
        
        loadExternalModel(); // Cargar modelo externo

        // Iniciar animación automática inmediatamente
        setTimeout(() => {
            animate();
        }, 100);

        // Manejar redimensionamiento
        const handleResize = () => {
            if (container && camera && rendererRef.current) {
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
                rendererRef.current.setSize(container.clientWidth, container.clientHeight);
            }
        };

        window.addEventListener('resize', handleResize);
    };

    // Función para renderizar el contenido completo según la sección activa
    const renderContent = () => {
        switch (activeSection) {
            case 'info':
                // Layout de dos columnas para información general con visor 3D
                return (
                    <div className={styles.body}>
                                                <div className={`${styles.col2} ${styles.columna}`}>
                            <div className={styles.colContent}>
                                <h3>Información Personal</h3>
                                <div className={styles.personalInfo}>
                                    <div className={styles.infoRow}>
                                        <span className={styles.infoLabel}>Nombre completo:</span>
                                        <span className={styles.infoValue}>{modelo?.nombre_completo || 'No disponible'}</span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <span className={styles.infoLabel}>Tipo de identificación:</span>
                                        <span className={styles.infoValue}>{modelo?.datos_personales?.tipo_identificacion || 'No disponible'}</span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <span className={styles.infoLabel}>Número de identificación:</span>
                                        <span className={styles.infoValue}>{modelo?.datos_personales?.numero_identificacion || 'No disponible'}</span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <span className={styles.infoLabel}>Lugar de expedición:</span>
                                        <span className={styles.infoValue}>{modelo?.datos_personales?.lugar_expedicion || 'No disponible'}</span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <span className={styles.infoLabel}>Fecha de nacimiento:</span>
                                        <span className={styles.infoValue}>{modelo?.datos_personales?.fecha_nacimiento || 'No disponible'}</span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <span className={styles.infoLabel}>Edad:</span>
                                        <span className={styles.infoValue}>{modelo?.datos_personales?.edad ? `${modelo.datos_personales.edad} años` : 'No disponible'}</span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <span className={styles.infoLabel}>Género:</span>
                                        <span className={styles.infoValue}>{modelo?.datos_personales?.genero || 'No disponible'}</span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <span className={styles.infoLabel}>Tipo de sangre:</span>
                                        <span className={styles.infoValue}>{modelo?.datos_personales?.tipo_sangre || 'No disponible'}</span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <span className={styles.infoLabel}>Fecha de registro:</span>
                                        <span className={styles.infoValue}>{modelo?.fecha_registro ? new Date(modelo.fecha_registro).toLocaleDateString('es-ES') : 'No disponible'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className={styles.colContent}>
                                <h3>Información de Contacto</h3>
                                <div className={styles.personalInfo}>
                                    <div className={styles.infoRow}>
                                        <span className={styles.infoLabel}>Teléfono:</span>
                                        <span className={styles.infoValue}>{modelo?.contacto?.telefono || 'No disponible'}</span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <span className={styles.infoLabel}>Correo electrónico:</span>
                                        <span className={styles.infoValue}>{modelo?.contacto?.email || 'No disponible'}</span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <span className={styles.infoLabel}>Dirección:</span>
                                        <span className={styles.infoValue}>{modelo?.contacto?.direccion || 'No disponible'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className={styles.colContent}>
                                <h3>Características Físicas</h3>
                                <div className={styles.personalInfo}>
                                    <div className={styles.infoRow}>
                                        <span className={styles.infoLabel}>Color de cabello:</span>
                                        <span className={styles.infoValue}>{modelo?.medidas_fisicas?.color_cabello || 'No disponible'}</span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <span className={styles.infoLabel}>Color de ojos:</span>
                                        <span className={styles.infoValue}>{modelo?.medidas_fisicas?.color_ojos || 'No disponible'}</span>
                                    </div>
                                    <div className={styles.infoRow}>
                                        <span className={styles.infoLabel}>Color de piel:</span>
                                        <span className={styles.infoValue}>{modelo?.medidas_fisicas?.color_piel || 'No disponible'}</span>
                                    </div>
                                </div>
                            </div>                            
                            <div className={styles.colContent}>
                                <h3>Suscripciones</h3>
                                {suscripciones && suscripciones.length > 0 ? (
                                    suscripciones.map((suscripcion, index) => (
                                        <div key={index} className={styles.subscriptionItem}>
                                            <p><strong>{suscripcion.plan_nombre}</strong></p>
                                            <p className={styles.subscriptionDescription}>{suscripcion.plan_descripcion}</p>
                                            <p><strong>Vigencia:</strong> {suscripcion.fecha_inicio} hasta {suscripcion.fecha_fin}</p>
                                            <p><strong>Estado:</strong> 
                                                <span className={suscripcion.esta_activa ? styles.statusActive : styles.statusInactive}>
                                                    {suscripcion.esta_activa ? 'Activa' : 'Inactiva'}
                                                </span>
                                            </p>
                                            {suscripcion.esta_por_vencer && (
                                                <p className={styles.statusWarning}>Vence en {suscripcion.dias_restantes} días</p>
                                            )}
                                            <p><strong>Sucursal:</strong> {suscripcion.sucursal}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p>No hay suscripciones registradas</p>
                                )}
                            </div>
                        </div>
                        <div className={`${styles.col1} ${styles.columna}`}>
                            {/* Visualizador 3D integrado */}
                            <div className={styles.colContent}>
                                <h3>Visualizador 3D de Medidas</h3>
                                <div className={styles.viewer3dContainer}>
                                    <div id="canvas-container-3d" className={styles.canvasContainer3d}>
                                        <div className={styles.loading3d}>Cargando modelo 3D...</div>
                                        <canvas id="three-canvas-3d"></canvas>
                                    </div>
                                </div>
                            </div>
                                                        <div className={styles.colContent}>
                                <h3>Tallas de Ropa</h3>
                                <div className={styles.clothingSizesList}>
                                    <div className={styles.sizeItem}>
                                        <img 
                                            src="/storage/icons/trousers.png" 
                                            alt="Pantalón" 
                                            className={styles.sizeIcon}
                                        />
                                        <div className={styles.sizeDetails}>
                                            <span className={styles.sizeLabel}>Pantalón</span>
                                            <span className={styles.sizeValue}>{modelo?.medidas_fisicas?.talla_pantalon || 'No disponible'}</span>
                                        </div>
                                    </div>
                                    <div className={styles.sizeItem}>
                                        <img 
                                            src="/storage/icons/t-shirt.png" 
                                            alt="Camisa" 
                                            className={styles.sizeIcon}
                                        />
                                        <div className={styles.sizeDetails}>
                                            <span className={styles.sizeLabel}>Camisa</span>
                                            <span className={styles.sizeValue}>{modelo?.medidas_fisicas?.talla_camisa || 'No disponible'}</span>
                                        </div>
                                    </div>
                                    <div className={styles.sizeItem}>
                                        <img 
                                            src="/storage/icons/running-shoe.png" 
                                            alt="Calzado" 
                                            className={styles.sizeIcon}
                                        />
                                        <div className={styles.sizeDetails}>
                                            <span className={styles.sizeLabel}>Calzado</span>
                                            <span className={styles.sizeValue}>{modelo?.medidas_fisicas?.talla_calzado || 'No disponible'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Medidas Corporales Principales */}
                            <div className={styles.colContent}>
                                <h3>Medidas Corporales</h3>
                                <div className={styles.measuresGrid}>
                                    <div className={styles.measureCard}>
                                        <div className={styles.measureIcon}>
                                            <CaretUpOutlined style={{ color: '#1877f2', fontSize: '20px' }} />
                                        </div>
                                        <div className={styles.measureInfo}>
                                            <div className={styles.measureLabel}>Estatura</div>
                                            <div className={styles.measureValue}>{modelo?.medidas_fisicas?.estatura ? `${modelo.medidas_fisicas.estatura}m` : 'No disponible'}</div>
                                        </div>
                                    </div>
                                    <div className={styles.measureCard}>
                                        <div className={styles.measureIcon}>
                                            <BorderOutlined style={{ color: '#e74c3c', fontSize: '20px' }} />
                                        </div>
                                        <div className={styles.measureInfo}>
                                            <div className={styles.measureLabel}>Busto</div>
                                            <div className={styles.measureValue}>{modelo?.medidas_fisicas?.busto || 'No disponible'} cm</div>
                                        </div>
                                    </div>
                                    <div className={styles.measureCard}>
                                        <div className={styles.measureIcon}>
                                            <ScanOutlined style={{ color: '#27ae60', fontSize: '20px' }} />
                                        </div>
                                        <div className={styles.measureInfo}>
                                            <div className={styles.measureLabel}>Cintura</div>
                                            <div className={styles.measureValue}>{modelo?.medidas_fisicas?.cintura || 'No disponible'} cm</div>
                                        </div>
                                    </div>
                                    <div className={styles.measureCard}>
                                        <div className={styles.measureIcon}>
                                            <ColumnHeightOutlined style={{ color: '#f39c12', fontSize: '20px' }} />
                                        </div>
                                        <div className={styles.measureInfo}>
                                            <div className={styles.measureLabel}>Cadera</div>
                                            <div className={styles.measureValue}>{modelo?.medidas_fisicas?.cadera || 'No disponible'} cm</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                                                        <div className={styles.colContent}>
                                <h3>Redes Sociales</h3>
                                {redes_sociales && redes_sociales.length > 0 ? (
                                    <div className={styles.socialMediaGrid}>
                                        {redes_sociales.map((red, index) => (
                                            <div key={index} className={styles.socialMediaItem}>
                                                <Button
                                                    shape="circle"
                                                    size="large"
                                                    href={red.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.socialButton}
                                                >
                                                    {getSocialIcon(red.plataforma)}
                                                </Button>
                                                <Typography.Text className={styles.socialLabel}>
                                                    {red.plataforma}
                                                </Typography.Text>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className={styles.noSocialMessage}>
                                        No hay redes sociales registradas
                                    </p>
                                )}
                            </div>
                        </div>
                        
                    </div>
                );
            case 'portfolio':
                // Layout de una sola columna para portafolio
                // Estados para el PDF
                
                return (
                    <div className={styles.singleColumnBody}>
                        <div className={styles.singleColumn}>
                            <div className={styles.colContent}>
                                <h3>Galería de Imágenes</h3>
                                <p><strong>Total de imágenes:</strong> {estadisticas?.total_imagenes || 0}</p>
                                <p>Sesiones fotográficas profesionales y trabajos destacados del modelo</p>
                                {/* Galería de imágenes */}
                                <div className={styles.galleryContainer}>
                                    <ImageGallery
                                        items={galleryImages}
                                        showPlayButton={true}
                                        showFullscreenButton={true}
                                        showThumbnails={true}
                                        thumbnailPosition="bottom"
                                        autoPlay={false}
                                        slideDuration={450}
                                        slideInterval={3000}
                                        showIndex={true}
                                        showNav={true}
                                        additionalClass={styles.customGallery}
                                    />
                                </div>
                            </div>
                            
                            <div className={styles.colContent}>
                                <h3>Portafolio Profesional</h3>
                                <p>Documento PDF con el portfolio completo incluyendo trabajos realizados y experiencia profesional</p>
                                
                                <div className={styles.portfolioPreview}>
                                    {/* Ruta hardcodeada - reemplázala con tu ruta real */}
                                    <div className={styles.pdfViewer}>
                                    {/* Controles de navegación */}



<div className={styles.pdfViewer}>
          {/* Contenedor del PDF con Viewer */}
          <div className={styles.pdfContainer}>
            <Viewer
              fileUrl={`/${portafolio.file_path}`}
              renderError={(error) => (
                <div className={styles.pdfError}>
                  Error al cargar el PDF: {error.message}
                </div>
              )}
              renderLoader={() => (
                <div className={styles.pdfLoading}>
                  Cargando PDF...
                </div>
              )}
            />
          </div>
        </div>


                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'acudiente':
                return (
                    <div className={styles.singleColumnBody}>
                        <div className={styles.singleColumn}>
                            <div className={styles.colContent}>
                                <h3>Información del Representante Legal</h3>
                                {acudiente ? (
                                    <div className={styles.guardianInfo}>
                                        <div className={styles.guardianInfoRow}>
                                            <span className={styles.guardianInfoLabel}>Nombre completo:</span>
                                            <span className={styles.guardianInfoValue}>{acudiente.nombre_completo || 'No disponible'}</span>
                                        </div>
                                        <div className={styles.guardianInfoRow}>
                                            <span className={styles.guardianInfoLabel}>Número de identificación:</span>
                                            <span className={styles.guardianInfoValue}>{acudiente.numero_identificacion || 'No disponible'}</span>
                                        </div>
                                        <div className={styles.guardianInfoRow}>
                                            <span className={styles.guardianInfoLabel}>Lugar de expedición:</span>
                                            <span className={styles.guardianInfoValue}>{acudiente.lugar_expedicion || 'No disponible'}</span>
                                        </div>
                                        <div className={styles.guardianInfoRow}>
                                            <span className={styles.guardianInfoLabel}>Parentesco:</span>
                                            <span className={styles.guardianInfoValue}>{acudiente.parentesco || 'No disponible'}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className={styles.noGuardianMessage}>
                                        No hay información de representante legal registrada
                                    </p>
                                )}
                            </div>
                            
                            <div className={styles.colContent}>
                                <h3>Información de Contacto</h3>
                                {acudiente ? (
                                    <div className={styles.guardianInfo}>
                                        <div className={styles.guardianInfoRow}>
                                            <span className={styles.guardianInfoLabel}>Teléfono:</span>
                                            <span className={styles.guardianInfoValue}>{acudiente.telefono || 'No disponible'}</span>
                                        </div>
                                        <div className={styles.guardianInfoRow}>
                                            <span className={styles.guardianInfoLabel}>Dirección:</span>
                                            <span className={styles.guardianInfoValue}>{acudiente.direccion || 'No disponible'}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className={styles.noGuardianMessage}>
                                        No hay información de contacto del representante legal
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 'finanzas':
                return (
                    <div className={styles.body}>
                        <div className={`${styles.col1} ${styles.columna}`}>
                            <div className={styles.colContent}>
                                <h3>Resumen Financiero</h3>
                                <div className={styles.financialSummary}>
                                    <p><strong>Total facturado:</strong> ${formatearCOP(finanzas.totales[0].total) || 0}</p>
                                    <p><strong>Total pagado:</strong> ${formatearCOP(finanzas.totales[0].pagado) || 0}</p>
                                    <p><strong>Saldo pendiente:</strong> ${formatearCOP(finanzas.totales[0].pendiente) || 0}</p>
                                </div>
                            </div>
                            
                            <div className={styles.colContent}>
                                <h3>Facturas Recientes</h3>
                                <p><strong>Total de facturas:</strong> {finanzas.facturas?.length || 0}</p>
                               {finanzas.facturas && finanzas.facturas.length > 0 ? (
                                    finanzas.facturas.map((factura) => (
                                    <div key={factura.id} className="invoiceItem">
                                        <p><strong>Factura #{factura.id}</strong></p>
                                        <p>Sede: {factura.name}</p>
                                        <p>Total: {formatearCOP(factura.total_amount)}</p>
                                        <p>Pagado: {formatearCOP(factura.paid_amount)}</p>
                                        <p>Pendiente: {formatearCOP(factura.remaining_amount)}</p>
                                    </div>
                                    ))
                                ) : (
                                    <p>No hay facturas disponibles</p>
                                )}
                            </div>
                            
                            <div className={styles.colContent}>
                                <h3>Pagos Realizados</h3>
                                <p><strong>Total de pagos:</strong> {finanzas.pagos?.length || 0}</p>
                                 {finanzas.pagos && finanzas.pagos.length > 0 ? (
                                    finanzas.pagos.map((pago) => (
                                    <div key={pago.id} className="paymentItem">
                                        <p><strong>Pago de {formatearCOP(pago.amount)}</strong></p>
                                        <p>Fecha: {pago.payment_date}</p>
                                        <p>Método: {pago.name}</p>
                                        <p>Factura: #{pago.idFactura}</p>
                                    </div>
                                    ))
                                ) : (
                                    <p>No hay pagos registrados</p>
                                )}
                            </div>
                        </div>
                        
                        <div className={`${styles.col2} ${styles.columna}`}>
                            <div className={styles.colContent}>
                                <h3>Pagos Pendientes</h3>
                                {finanzas.deudas && finanzas.deudas.filter(f => f.pendiente > 0).length > 0 ? (
                                    finanzas.deudas.map((factura) => (
                                        <div className={styles.pendingItem}>
                                            <p><strong>Factura #{factura.id}</strong></p>
                                            <p>Monto pendiente: ${formatearCOP(factura.remaining_amount)}</p>
                                            <p>Fecha de emisión: 2025</p>
                                            <p>Sucursal: {factura.name}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles.noPendingPayments}>
                                        <p><strong>¡Excelente!</strong></p>
                                        <p>No hay pagos pendientes</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className={styles.singleColumnBody}>
                        <div className={styles.singleColumn}>
                            <div className={styles.colContent}>Contenido por defecto</div>
                            <div className={styles.colContent}>Selecciona una sección del menú</div>
                        </div>
                    </div>
                );
        }
    };
    return (
        <div className={styles.main}>
            <div className={styles.mainContainer}>
                <div className={styles.mainheader}>
                    <div className={styles.containerheader}>
                        <div className={styles.header}>
                            <div className={styles.carrusel}>
                                <Swiper
                                    modules={[Navigation, Pagination, EffectFade]}
                                    effect="fade"
                                    loop={true}
                                    autoplay={false}
                                    navigation={true}
                                    pagination={{
                                        clickable: true,
                                    }}
                                    className={styles.swiper}
                                >
                                    {carouselImages.map((image, index) => (
                                        <SwiperSlide key={index} className={styles.swiperSlide}>
                                            <div 
                                                className={styles.slideImg}
                                                style={{ '--slide-bg-image': `url(${image})` }}
                                            >
                                                <img 
                                                    src={image} 
                                                    alt={`Imagen ${index + 1}`}
                                                    className={styles.slideImage}
                                                    onClick={() => openImageModal(image, index)}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                            </div>
                            <div className={styles.perfil}>
                                <div className={styles.imagenPerfil}>
                                    <img 
                                        src={fotoperfil}
                                        alt="Perfil del modelo" 
                                        className={styles.perfilImage}
                                    />
                                </div>
                                <div className={styles.ContainerNombre}>
                                    <div className={styles.nombreInfo}>
                                        <h2 className={styles.nombre}>{modelo?.nombre_completo}</h2>
                                        <p className={styles.identificacion}>{modelo?.datos_personales.tipo_identificacion}: {modelo?.datos_personales.numero_identificacion}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.bar}>
                            <ResponsiveNavMenu
                                items={menuItems}
                                activeKey={activeSection}
                                onItemClick={handleMenuClick}
                            />
                        </div>
                    </div>
                </div>
                <div className={styles.containerbody}>
                    {renderContent()}
                </div>
            </div>

            {/* Modal para visualizar imagen */}
            {isModalOpen && (
                <div className={styles.imageModal} onClick={closeImageModal}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        {/* Botón de cerrar mejorado */}
                        <button 
                            className={styles.closeButton}
                            onClick={closeImageModal}
                            aria-label="Cerrar imagen"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        
                        {/* Botón anterior */}
                        <button 
                            className={styles.prevButton}
                            onClick={goToPreviousImage}
                            aria-label="Imagen anterior"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="15,18 9,12 15,6"></polyline>
                            </svg>
                        </button>
                        
                        {/* Botón siguiente */}
                        <button 
                            className={styles.nextButton}
                            onClick={goToNextImage}
                            aria-label="Imagen siguiente"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9,18 15,12 9,6"></polyline>
                            </svg>
                        </button>
                        
                        {/* Imagen */}
                        <img 
                            src={selectedImage} 
                            alt="Imagen ampliada"
                            className={styles.modalImage}
                        />
                        
                        {/* Contador de imágenes */}
                        <div className={styles.imageCounter}>
                            {currentImageIndex + 1} / {carouselImages.length}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
