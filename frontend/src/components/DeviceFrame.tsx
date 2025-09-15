import React from 'react';
import { Smartphone, Tablet, Monitor, Laptop } from 'lucide-react';

type DeviceType = 'mobile' | 'tablet' | 'laptop' | 'desktop';

interface DeviceFrameProps {
  device: DeviceType;
  children: React.ReactNode;
  className?: string;
  showFrame?: boolean;
}

interface DeviceConfig {
  width: number;
  height: number;
  scale: number;
  frameClass: string;
  icon: React.ComponentType<any>;
  name: string;
}

const deviceConfigs: Record<DeviceType, DeviceConfig> = {
  mobile: {
    width: 375,
    height: 667,
    scale: 1,
    frameClass: 'bg-gray-900 rounded-[2.5rem] p-2',
    icon: Smartphone,
    name: 'iPhone SE'
  },
  tablet: {
    width: 768,
    height: 1024,
    scale: 0.8,
    frameClass: 'bg-gray-800 rounded-[1.5rem] p-3',
    icon: Tablet,
    name: 'iPad'
  },
  laptop: {
    width: 1366,
    height: 768,
    scale: 0.6,
    frameClass: 'bg-gray-700 rounded-lg p-1',
    icon: Laptop,
    name: 'Laptop'
  },
  desktop: {
    width: 1920,
    height: 1080,
    scale: 0.4,
    frameClass: 'bg-gray-600 rounded-md p-1',
    icon: Monitor,
    name: 'Desktop'
  }
};

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ 
  device, 
  children, 
  className = '',
  showFrame = true 
}) => {
  const config = deviceConfigs[device];
  const Icon = config.icon;

  if (!showFrame) {
    return (
      <div 
        className={`bg-white rounded-lg shadow-lg overflow-hidden ${className}`}
        style={{
          width: config.width * config.scale,
          height: config.height * config.scale,
          maxWidth: '100%',
          maxHeight: '100%'
        }}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={`inline-block ${className}`}>
      {/* Device Label */}
      <div className="flex items-center justify-center mb-4 space-x-2">
        <Icon className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">{config.name}</span>
        <span className="text-xs text-gray-500">
          {config.width} × {config.height}
        </span>
      </div>

      {/* Device Frame */}
      <div className={config.frameClass}>
        {/* Mobile-specific elements */}
        {device === 'mobile' && (
          <>
            {/* Notch */}
            <div className="flex justify-center mb-2">
              <div className="w-16 h-1 bg-gray-700 rounded-full"></div>
            </div>
            
            {/* Screen */}
            <div 
              className="bg-white rounded-[1.5rem] overflow-hidden shadow-inner"
              style={{
                width: config.width * config.scale,
                height: config.height * config.scale - 40
              }}
            >
              {children}
            </div>
            
            {/* Home Indicator */}
            <div className="flex justify-center mt-2">
              <div className="w-32 h-1 bg-gray-700 rounded-full"></div>
            </div>
          </>
        )}

        {/* Tablet-specific elements */}
        {device === 'tablet' && (
          <>
            {/* Home Button */}
            <div className="flex justify-center mb-3">
              <div className="w-12 h-12 bg-gray-600 rounded-full border-2 border-gray-500"></div>
            </div>
            
            {/* Screen */}
            <div 
              className="bg-white rounded-xl overflow-hidden shadow-inner"
              style={{
                width: config.width * config.scale,
                height: config.height * config.scale - 60
              }}
            >
              {children}
            </div>
          </>
        )}

        {/* Laptop-specific elements */}
        {device === 'laptop' && (
          <>
            {/* Screen */}
            <div 
              className="bg-white rounded-md overflow-hidden shadow-inner mb-2"
              style={{
                width: config.width * config.scale,
                height: config.height * config.scale - 20
              }}
            >
              {children}
            </div>
            
            {/* Keyboard Base */}
            <div 
              className="bg-gray-600 rounded-b-lg h-4"
              style={{ width: config.width * config.scale }}
            >
              <div className="flex justify-center pt-1">
                <div className="w-20 h-1 bg-gray-500 rounded"></div>
              </div>
            </div>
          </>
        )}

        {/* Desktop-specific elements */}
        {device === 'desktop' && (
          <>
            {/* Screen */}
            <div 
              className="bg-white rounded-sm overflow-hidden shadow-inner mb-1"
              style={{
                width: config.width * config.scale,
                height: config.height * config.scale - 20
              }}
            >
              {children}
            </div>
            
            {/* Stand */}
            <div className="flex justify-center">
              <div className="w-32 h-3 bg-gray-500 rounded-b-lg"></div>
            </div>
          </>
        )}
      </div>

      {/* Device Info */}
      <div className="mt-4 text-center">
        <div className="text-xs text-gray-500">
          Scale: {Math.round(config.scale * 100)}%
        </div>
      </div>
    </div>
  );
};

// Device selector component
interface DeviceSelectorProps {
  currentDevice: DeviceType;
  onDeviceChange: (device: DeviceType) => void;
  className?: string;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  currentDevice,
  onDeviceChange,
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-1 bg-gray-100 rounded-lg p-1 ${className}`}>
      {Object.entries(deviceConfigs).map(([key, config]) => {
        const Icon = config.icon;
        const deviceKey = key as DeviceType;
        
        return (
          <button
            key={key}
            onClick={() => onDeviceChange(deviceKey)}
            className={`p-2 rounded-md transition-colors ${
              currentDevice === deviceKey
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title={`${config.name} (${config.width}×${config.height})`}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
};

// Responsive device detector
export const useDeviceDetection = () => {
  const [detectedDevice, setDetectedDevice] = React.useState<DeviceType>('desktop');

  React.useEffect(() => {
    const updateDevice = () => {
      const width = window.innerWidth;
      
      if (width < 768) {
        setDetectedDevice('mobile');
      } else if (width < 1024) {
        setDetectedDevice('tablet');
      } else if (width < 1440) {
        setDetectedDevice('laptop');
      } else {
        setDetectedDevice('desktop');
      }
    };

    updateDevice();
    window.addEventListener('resize', updateDevice);
    
    return () => window.removeEventListener('resize', updateDevice);
  }, []);

  return detectedDevice;
};