import React, { useState, useEffect, useRef } from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import { LeftOutlined, RightOutlined, CloseOutlined } from '@ant-design/icons';
import styles from './ProductCard.module.scss';


const ProductCard = ({
  product = {
    id: 0,
    name: 'Product Name',
    price: '$39',
    description: 'Product description',
    image: 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/245657/t-shirt.png',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: [
      { name: 'blue', color: '#007bff' },
      { name: 'red', color: '#dc3545' },
      { name: 'white', color: '#ffffff' },
      { name: 'green', color: '#28a745' }
    ],
    gallery: [
      'https://s3-us-west-2.amazonaws.com/s.cdpn.io/245657/t-shirt-large.png',
      'https://s3-us-west-2.amazonaws.com/s.cdpn.io/245657/t-shirt-large2.png',
      'https://s3-us-west-2.amazonaws.com/s.cdpn.io/245657/t-shirt-large3.png'
    ]
  },
  onColorSelect,
  onSizeSelect,
  onAddToCart
}) => {
  // Estado de cargando para el botón de agregar al carrito
  const [loadingCart, setLoadingCart] = useState(false);
  // Callback para agregar al carrito
  const handleAddToCart = async () => {
    if (onAddToCart && product.id !== undefined) {
      setLoadingCart(true);
      try {
        await onAddToCart({
          id: product.id,
          type: 'product'
        });
      } finally {
        setLoadingCart(false);
      }
    }
  };
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [carouselPosition, setCarouselPosition] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  
  const cardRef = useRef(null);
  const carouselSlideWidth = 335;

  // Handle card hover
  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Handle flip to back
  const handleViewDetails = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsHovered(false);
    
    setTimeout(() => {
      setIsFlipped(true);
      setTimeout(() => {
        setIsAnimating(false);
        setIsHovered(true);
      }, 400);
    }, 50);
  };

  // Handle flip to front
  const handleFlipBack = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsHovered(false);
    
    setTimeout(() => {
      setIsFlipped(false);
      setTimeout(() => {
        setIsAnimating(false);
      }, 400);
    }, 50);
  };

  // Handle carousel navigation
  const handleNextImage = () => {
    if (isAnimating) return;
    const maxPosition = (product.gallery.length - 1) * carouselSlideWidth;
    const newPosition = Math.min(carouselPosition + carouselSlideWidth, maxPosition);
    
    if (newPosition !== carouselPosition) {
      setIsAnimating(true);
      setCarouselPosition(newPosition);
      setCurrentImageIndex(Math.min(currentImageIndex + 1, product.gallery.length - 1));
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const handlePrevImage = () => {
    if (isAnimating) return;
    const newPosition = Math.max(carouselPosition - carouselSlideWidth, 0);
    
    if (newPosition !== carouselPosition) {
      setIsAnimating(true);
      setCarouselPosition(newPosition);
      setCurrentImageIndex(Math.max(currentImageIndex - 1, 0));
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  // Handle color selection
  const handleColorSelect = (color) => {
    setSelectedColor(color);
    onColorSelect && onColorSelect(color);
  };

  // Handle size selection
  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    onSizeSelect && onSizeSelect(size);
  };

  return (
    <div className={styles.make3DSpace}>
      <div 
        ref={cardRef}
        className={`${styles.productCard} ${isHovered ? styles.animate : ''} ${isFlipped ? styles.flipped : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Front Side */}
        <div className={`${styles.productFront} ${isFlipped ? styles.hidden : ''}`}>
          <div className={styles.shadow}></div>
          {(!product.image || product.image === '') ? (
            <div className={styles.imagePlaceholder}>
              <span role="img" aria-label="Sin imagen" className={styles.placeholderIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#bdbdbd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21" /></svg>
              </span>
              <div className={styles.placeholderText}>Sin imagen</div>
            </div>
          ) : (
            <img src={product.image} alt={product.name} />
          )}
          <div className={styles.imageOverlay}></div>
          <div className={styles.viewDetails} onClick={handleViewDetails}>
            Detalles
          </div>
          <div className={styles.stats}>
            <div className={styles.statsContainer}>
              <span className={styles.productPrice}>{product.price}</span>
              <span className={styles.productName}>{product.name}</span>
              {typeof product.stock_quantity !== 'undefined' && product.stock_quantity !== null && (
                <span className={styles.productStock} style={{ color: product.stock_quantity > 0 ? '#52c41a' : '#ff4d4f', fontWeight: 500, marginLeft: 8 }}>
                  Stock: {product.stock_quantity}
                </span>
              )}
              <p>{product.description}</p>
              <button
                className={styles.addToCartBtn}
                onClick={handleAddToCart}
                type="button"
                disabled={loadingCart || (typeof product.stock_quantity !== 'undefined' && product.stock_quantity !== null && product.stock_quantity <= 0)}
                style={
                  (loadingCart || (typeof product.stock_quantity !== 'undefined' && product.stock_quantity !== null && product.stock_quantity <= 0))
                    ? { cursor: 'not-allowed' }
                    : {}
                }
              >
                {loadingCart ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <LoadingOutlined spin /> Cargando...
                  </span>
                ) : (
                  'Agregar al carrito'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Back Side */}
        <div className={`${styles.productBack} ${!isFlipped ? styles.hidden : ''}`}>
          <div className={styles.shadow}></div>
          <div className={styles.carousel}>
            <ul 
              className={styles.carouselList}
              style={{ 
                transform: `translateX(-${carouselPosition}px)`,
                width: `${product.gallery.length * carouselSlideWidth}px`
              }}
            >
              {(Array.isArray(product.gallery) && product.gallery.length > 0) ? (
                product.gallery.map((image, index) => (
                  <li key={index} className={styles.carouselItem}>
                    {image && image !== '' ? (
                      <img src={image} alt={`${product.name} ${index + 1}`} />
                    ) : (
                      <div className={styles.imagePlaceholder}>
                        <span role="img" aria-label="Sin imagen" className={styles.placeholderIcon}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bdbdbd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21" /></svg>
                        </span>
                        <div className={styles.placeholderText}>Sin imagen</div>
                      </div>
                    )}
                  </li>
                ))
              ) : (
                <li className={styles.carouselItem}>
                  <div className={styles.imagePlaceholder}>
                    <span role="img" aria-label="Sin imagen" className={styles.placeholderIcon}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bdbdbd" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21" /></svg>
                    </span>
                    <div className={styles.placeholderText}>Sin imagen</div>
                  </div>
                </li>
              )}
            </ul>
            <div className={styles.arrowsPerspective}>
              <div 
                className={`${styles.carouselPrev} ${isHovered ? styles.visible : ''}`}
                onClick={handlePrevImage}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}
              >
                <LeftOutlined />
              </div>
              <div 
                className={`${styles.carouselNext} ${isHovered ? styles.visible : ''}`}
                onClick={handleNextImage}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}
              >
                <RightOutlined />
              </div>
            </div>
          </div>
          <div className={styles.flipBack} onClick={handleFlipBack} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28}}>
            <CloseOutlined />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;