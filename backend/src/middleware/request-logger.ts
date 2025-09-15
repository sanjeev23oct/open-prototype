import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log request
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = getStatusColor(res.statusCode);
    
    console.log(
      `${new Date().toISOString()} - ${req.method} ${req.url} - ${statusColor}${res.statusCode}\x1b[0m - ${duration}ms`
    );
  });
  
  next();
};

const getStatusColor = (statusCode: number): string => {
  if (statusCode >= 200 && statusCode < 300) {
    return '\x1b[32m'; // Green
  } else if (statusCode >= 300 && statusCode < 400) {
    return '\x1b[33m'; // Yellow
  } else if (statusCode >= 400 && statusCode < 500) {
    return '\x1b[31m'; // Red
  } else {
    return '\x1b[35m'; // Magenta
  }
};