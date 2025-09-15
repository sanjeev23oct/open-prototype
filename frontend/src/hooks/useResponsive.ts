import { useState, useEffect } from 'react';

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

interface ResponsiveState {
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
}

export const useResponsive = (): ResponsiveState => {
  const [state, setState] = useState<ResponsiveState>(() => {
    if (typeof window === 'undefined') {
      return {
        breakpoint: 'desktop',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        width: 1024,
        height: 768,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      breakpoint: getBreakpoint(width),
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      width,
      height,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setState({
        breakpoint: getBreakpoint(width),
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        width,
        height,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return state;
};

const getBreakpoint = (width: number): Breakpoint => {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// Hook for specific breakpoint checks
export const useBreakpoint = (breakpoint: Breakpoint): boolean => {
  const { breakpoint: current } = useResponsive();
  return current === breakpoint;
};

// Hook for minimum breakpoint checks
export const useMinBreakpoint = (breakpoint: Breakpoint): boolean => {
  const { width } = useResponsive();
  
  switch (breakpoint) {
    case 'mobile':
      return width >= 0;
    case 'tablet':
      return width >= 768;
    case 'desktop':
      return width >= 1024;
    default:
      return false;
  }
};