import React, { useState, useEffect, useRef, Suspense } from 'react';
import { PerformanceService } from '../services/performance.service';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  className?: string;
  minHeight?: number;
  onLoad?: () => void;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback,
  rootMargin = '50px',
  threshold = 0.1,
  className = '',
  minHeight = 200,
  onLoad
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const performanceService = PerformanceService.getInstance();

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = performanceService.createIntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          onLoad?.();
          observer.unobserve(element);
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [isVisible, rootMargin, threshold, onLoad, performanceService]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div
      ref={elementRef}
      className={className}
      style={{ minHeight: isVisible ? 'auto' : minHeight }}
    >
      {isVisible ? (
        <Suspense fallback={fallback || <LazyFallback />}>
          <div onLoad={handleLoad}>
            {children}
          </div>
        </Suspense>
      ) : (
        fallback || <LazyFallback minHeight={minHeight} />
      )}
    </div>
  );
};

interface LazyFallbackProps {
  minHeight?: number;
}

const LazyFallback: React.FC<LazyFallbackProps> = ({ minHeight = 200 }) => (
  <div 
    className="flex items-center justify-center bg-gray-50 rounded-lg"
    style={{ minHeight }}
  >
    <div className="text-center">
      <div className="animate-pulse">
        <div className="w-12 h-12 bg-gray-300 rounded-full mx-auto mb-4"></div>
        <div className="h-4 bg-gray-300 rounded w-24 mx-auto mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-16 mx-auto"></div>
      </div>
    </div>
  </div>
);

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<LazyWrapperProps, 'children'>
) {
  return React.forwardRef<any, P>((props, ref) => (
    <LazyWrapper {...options}>
      <Component {...props} ref={ref} />
    </LazyWrapper>
  ));
}

// Hook for lazy loading images
export const useLazyImage = (src: string, placeholder?: string) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          const image = new Image();
          image.onload = () => {
            setImageSrc(src);
            setIsLoaded(true);
          };
          image.onerror = () => {
            setIsError(true);
          };
          image.src = src;
          observer.unobserve(img);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(img);

    return () => {
      observer.unobserve(img);
    };
  }, [src]);

  return { imageSrc, isLoaded, isError, imgRef };
};

// Virtual scrolling component
interface VirtualScrollProps {
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
}

export const VirtualScroll: React.FC<VirtualScrollProps> = ({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
  overscan = 5
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const performanceService = PerformanceService.getInstance();

  const handleScroll = performanceService.throttle((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, 16); // ~60fps

  const { startIndex, endIndex, offsetY } = performanceService.calculateVisibleItems(
    containerHeight,
    itemHeight,
    scrollTop,
    items.length,
    overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Memoized component wrapper
export function withMemo<P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return React.memo(Component, areEqual);
}

// Performance-optimized list component
interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  itemClassName?: string;
  virtual?: boolean;
  itemHeight?: number;
  containerHeight?: number;
}

export function OptimizedList<T>({
  items,
  renderItem,
  keyExtractor,
  className = '',
  itemClassName = '',
  virtual = false,
  itemHeight = 50,
  containerHeight = 400
}: OptimizedListProps<T>) {
  if (virtual && itemHeight && containerHeight) {
    return (
      <VirtualScroll
        items={items}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
        renderItem={renderItem}
        className={className}
      />
    );
  }

  return (
    <div className={className}>
      {items.map((item, index) => (
        <div key={keyExtractor(item, index)} className={itemClassName}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}