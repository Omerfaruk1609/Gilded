export class Logger {
  static info(message, metadata = {}) {
    console.log(JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message,
      ...metadata
    }));
  }

  static warn(message, metadata = {}) {
    console.warn(JSON.stringify({
      level: 'WARN',
      timestamp: new Date().toISOString(),
      message,
      ...metadata
    }));
  }

  static error(message, metadata = {}) {
    console.error(JSON.stringify({
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      message,
      ...metadata
    }));
  }
}
