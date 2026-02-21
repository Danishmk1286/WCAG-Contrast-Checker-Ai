import React from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  webpSrc?: string;
  avifSrc?: string;
  priority?: boolean;
  className?: string;
}

/**
 * OptimizedImage component that uses modern image formats (WebP/AVIF) with fallbacks
 * Implements picture element for better browser support and performance
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  webpSrc,
  avifSrc,
  priority = false,
  className = '',
  loading,
  fetchPriority,
  ...props
}) => {
  // Determine loading strategy
  const loadingStrategy = priority ? 'eager' : (loading || 'lazy');
  const fetchPriorityValue = priority ? 'high' : (fetchPriority || 'auto');

  // Extract width and height from props for layout stability
  // Explicitly exclude fetchPriority and loading from spread to avoid React warnings
  const { width, height, fetchPriority: _, loading: __, ...imgProps } = props;
  
  // If no modern formats provided, use regular img with optimizations
  if (!webpSrc && !avifSrc) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loadingStrategy}
        fetchpriority={fetchPriorityValue}
        decoding="async"
        width={width}
        height={height}
        onError={(e) => {
          // Fallback handling: if image fails to load, log error but don't break layout
          console.warn(`Image failed to load: ${src}`);
          if (props.onError) {
            props.onError(e);
          }
        }}
        {...imgProps}
      />
    );
  }

  // Use picture element with modern formats
  return (
    <picture>
      {/* AVIF format - best compression, newer browsers */}
      {avifSrc && (
        <source
          srcSet={avifSrc}
          type="image/avif"
        />
      )}
      {/* WebP format - good compression, wider support */}
      {webpSrc && (
        <source
          srcSet={webpSrc}
          type="image/webp"
        />
      )}
      {/* Fallback to original format - ensures stable layout even if modern formats fail */}
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loadingStrategy}
        fetchpriority={fetchPriorityValue}
        decoding="async"
        width={width}
        height={height}
        onError={(e) => {
          // Fallback handling: if all formats fail, log error but maintain layout
          console.warn(`All image formats failed to load. Original: ${src}, WebP: ${webpSrc}, AVIF: ${avifSrc}`);
          if (props.onError) {
            props.onError(e);
          }
        }}
        {...imgProps}
      />
    </picture>
  );
};

export default OptimizedImage;

