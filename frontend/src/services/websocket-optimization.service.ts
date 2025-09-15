interface QueuedMessage {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  priority: number;
  retries: number;
}

interface BatchConfig {
  maxSize: number;
  maxWait: number;
  types: string[];
}

export class WebSocketOptimizationService {
  private static instance: WebSocketOptimizationService;
  private messageQueue: QueuedMessage[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private compressionEnabled = true;
  private batchConfig: BatchConfig = {
    maxSize: 10,
    maxWait: 100, // ms
    types: ['generation:stream', 'generation:progress']
  };

  static getInstance(): WebSocketOptimizationService {
    if (!WebSocketOptimizationService.instance) {
      WebSocketOptimizationService.instance = new WebSocketOptimizationService();
    }
    return WebSocketOptimizationService.instance;
  }

  // Queue message for batching
  queueMessage(type: string, payload: any, priority: number = 1): string {
    const id = this.generateMessageId();
    const message: QueuedMessage = {
      id,
      type,
      payload,
      timestamp: Date.now(),
      priority,
      retries: 0
    };

    this.messageQueue.push(message);
    this.scheduleFlush();
    
    return id;
  }

  // Process message queue
  private scheduleFlush(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // Immediate flush for high priority messages
    const highPriorityMessages = this.messageQueue.filter(m => m.priority >= 5);
    if (highPriorityMessages.length > 0) {
      this.flushQueue();
      return;
    }

    // Batch flush for regular messages
    if (this.messageQueue.length >= this.batchConfig.maxSize) {
      this.flushQueue();
    } else {
      this.batchTimer = setTimeout(() => {
        this.flushQueue();
      }, this.batchConfig.maxWait);
    }
  }

  // Flush message queue
  private flushQueue(): void {
    if (this.messageQueue.length === 0) return;

    // Sort by priority and timestamp
    this.messageQueue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.timestamp - b.timestamp; // Older messages first
    });

    // Group batchable messages
    const batchableMessages = this.messageQueue.filter(m => 
      this.batchConfig.types.includes(m.type)
    );
    
    const nonBatchableMessages = this.messageQueue.filter(m => 
      !this.batchConfig.types.includes(m.type)
    );

    // Send batched messages
    if (batchableMessages.length > 0) {
      this.sendBatchedMessages(batchableMessages);
    }

    // Send individual messages
    nonBatchableMessages.forEach(message => {
      this.sendMessage(message);
    });

    // Clear queue
    this.messageQueue = [];
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  // Send batched messages
  private sendBatchedMessages(messages: QueuedMessage[]): void {
    const batchPayload = {
      type: 'batch',
      messages: messages.map(m => ({
        id: m.id,
        type: m.type,
        payload: this.compressPayload(m.payload),
        timestamp: m.timestamp
      }))
    };

    this.sendToWebSocket(batchPayload);
  }

  // Send individual message
  private sendMessage(message: QueuedMessage): void {
    const payload = {
      id: message.id,
      type: message.type,
      payload: this.compressPayload(message.payload),
      timestamp: message.timestamp
    };

    this.sendToWebSocket(payload);
  }

  // Compress payload if enabled
  private compressPayload(payload: any): any {
    if (!this.compressionEnabled) {
      return payload;
    }

    try {
      // Simple compression for strings
      if (typeof payload === 'string' && payload.length > 1000) {
        return {
          compressed: true,
          data: this.compressString(payload)
        };
      }

      // Compress large objects
      if (typeof payload === 'object' && JSON.stringify(payload).length > 1000) {
        return {
          compressed: true,
          data: this.compressString(JSON.stringify(payload))
        };
      }

      return payload;
    } catch (error) {
      console.warn('Compression failed:', error);
      return payload;
    }
  }

  // Simple string compression using LZ-like algorithm
  private compressString(str: string): string {
    const dict: { [key: string]: number } = {};
    const result: (string | number)[] = [];
    let dictSize = 256;
    let w = '';

    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      const wc = w + c;

      if (dict[wc]) {
        w = wc;
      } else {
        result.push(dict[w] ? dict[w] : w);
        dict[wc] = dictSize++;
        w = c;
      }
    }

    if (w) {
      result.push(dict[w] ? dict[w] : w);
    }

    return btoa(JSON.stringify(result));
  }

  // Decompress payload
  decompressPayload(payload: any): any {
    if (payload && payload.compressed) {
      try {
        return this.decompressString(payload.data);
      } catch (error) {
        console.warn('Decompression failed:', error);
        return payload.data;
      }
    }
    return payload;
  }

  // Decompress string
  private decompressString(compressed: string): string {
    try {
      const data = JSON.parse(atob(compressed));
      const dict: { [key: number]: string } = {};
      let dictSize = 256;
      let result = '';
      let w = String(data[0]);
      result += w;

      for (let i = 1; i < data.length; i++) {
        const k = data[i];
        let entry: string;

        if (dict[k]) {
          entry = dict[k];
        } else if (k === dictSize) {
          entry = w + w[0];
        } else {
          throw new Error('Invalid compressed data');
        }

        result += entry;
        dict[dictSize++] = w + entry[0];
        w = entry;
      }

      return result;
    } catch (error) {
      console.warn('String decompression failed:', error);
      return compressed;
    }
  }

  // Debounce WebSocket messages
  debounceMessage(
    type: string,
    payload: any,
    delay: number = 100
  ): void {
    const key = `debounce:${type}`;
    
    // Clear existing timeout
    if ((this as any)[key]) {
      clearTimeout((this as any)[key]);
    }

    // Set new timeout
    (this as any)[key] = setTimeout(() => {
      this.queueMessage(type, payload);
      delete (this as any)[key];
    }, delay);
  }

  // Throttle WebSocket messages
  throttleMessage(
    type: string,
    payload: any,
    limit: number = 100
  ): void {
    const key = `throttle:${type}`;
    
    if (!(this as any)[key]) {
      this.queueMessage(type, payload);
      (this as any)[key] = true;
      
      setTimeout(() => {
        delete (this as any)[key];
      }, limit);
    }
  }

  // Message deduplication
  private messageHashes = new Set<string>();
  
  deduplicateMessage(type: string, payload: any): boolean {
    const hash = this.hashMessage(type, payload);
    
    if (this.messageHashes.has(hash)) {
      return false; // Duplicate message
    }
    
    this.messageHashes.add(hash);
    
    // Clean up old hashes (keep last 1000)
    if (this.messageHashes.size > 1000) {
      const hashes = Array.from(this.messageHashes);
      this.messageHashes.clear();
      hashes.slice(-500).forEach(h => this.messageHashes.add(h));
    }
    
    return true; // New message
  }

  // Connection health monitoring
  private connectionMetrics = {
    latency: 0,
    messagesSent: 0,
    messagesReceived: 0,
    errors: 0,
    lastPing: 0
  };

  updateConnectionMetrics(metric: keyof typeof this.connectionMetrics, value: number): void {
    this.connectionMetrics[metric] = value;
  }

  getConnectionHealth(): {
    status: 'excellent' | 'good' | 'poor' | 'critical';
    metrics: typeof this.connectionMetrics;
    recommendations: string[];
  } {
    const { latency, errors, messagesSent } = this.connectionMetrics;
    const errorRate = messagesSent > 0 ? errors / messagesSent : 0;
    
    let status: 'excellent' | 'good' | 'poor' | 'critical';
    const recommendations: string[] = [];

    if (latency < 50 && errorRate < 0.01) {
      status = 'excellent';
    } else if (latency < 100 && errorRate < 0.05) {
      status = 'good';
    } else if (latency < 300 && errorRate < 0.1) {
      status = 'poor';
      recommendations.push('Consider reducing message frequency');
    } else {
      status = 'critical';
      recommendations.push('Connection issues detected - check network');
      recommendations.push('Consider implementing retry logic');
    }

    if (latency > 200) {
      recommendations.push('High latency detected - enable compression');
    }

    if (errorRate > 0.05) {
      recommendations.push('High error rate - implement message queuing');
    }

    return {
      status,
      metrics: { ...this.connectionMetrics },
      recommendations
    };
  }

  // Adaptive batching based on connection quality
  adaptBatchingToConnection(): void {
    const health = this.getConnectionHealth();
    
    switch (health.status) {
      case 'excellent':
        this.batchConfig.maxSize = 5;
        this.batchConfig.maxWait = 50;
        break;
      case 'good':
        this.batchConfig.maxSize = 10;
        this.batchConfig.maxWait = 100;
        break;
      case 'poor':
        this.batchConfig.maxSize = 20;
        this.batchConfig.maxWait = 200;
        break;
      case 'critical':
        this.batchConfig.maxSize = 50;
        this.batchConfig.maxWait = 500;
        break;
    }
  }

  // Private helper methods
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashMessage(type: string, payload: any): string {
    const str = type + JSON.stringify(payload);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return hash.toString(36);
  }

  private sendToWebSocket(payload: any): void {
    // This would integrate with the actual WebSocket service
    // For now, we'll just log the optimized message
    console.log('Optimized WebSocket message:', payload);
  }

  // Configuration methods
  enableCompression(enabled: boolean = true): void {
    this.compressionEnabled = enabled;
  }

  updateBatchConfig(config: Partial<BatchConfig>): void {
    this.batchConfig = { ...this.batchConfig, ...config };
  }

  // Cleanup
  cleanup(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    this.messageQueue = [];
    this.messageHashes.clear();
  }
}