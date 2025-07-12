const fs = require('fs').promises;
const path = require('path');
const config = require('../config/defaults');

/**
 * Simple, effective logger for Laravel God Mode
 */
class Logger {
  constructor() {
    this.logLevel = config.logging.level;
    this.logsDir = config.paths.logs;
    this.init();
  }

  async init() {
    try {
      await fs.mkdir(this.logsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create logs directory:', error);
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  getLogFileName(type = 'app') {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logsDir, `${type}-${date}.log`);
  }

  async writeLog(level, message, meta = {}) {
    const timestamp = this.getTimestamp();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };

    const logLine = `[${timestamp}] ${level.toUpperCase()}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}\n`;

    // Console output
    const colorMap = {
      error: '\x1b[31m',
      warn: '\x1b[33m',
      info: '\x1b[36m',
      debug: '\x1b[37m',
      success: '\x1b[32m'
    };

    console.log(`${colorMap[level] || '\x1b[37m'}${logLine.trim()}\x1b[0m`);

    // File output
    try {
      await fs.appendFile(this.getLogFileName(), logLine);
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  error(message, meta = {}) {
    return this.writeLog('error', message, meta);
  }

  warn(message, meta = {}) {
    return this.writeLog('warn', message, meta);
  }

  info(message, meta = {}) {
    return this.writeLog('info', message, meta);
  }

  debug(message, meta = {}) {
    if (this.logLevel === 'debug') {
      return this.writeLog('debug', message, meta);
    }
  }

  success(message, meta = {}) {
    return this.writeLog('success', message, meta);
  }

  // Project-specific logging
  async projectLog(projectName, action, details = {}) {
    const fileName = this.getLogFileName(`project-${projectName}`);
    const logEntry = `[${this.getTimestamp()}] ${action}: ${JSON.stringify(details)}\n`;

    try {
      await fs.appendFile(fileName, logEntry);
    } catch (error) {
      this.error('Failed to write project log', { projectName, action, error: error.message });
    }
  }

  // Command execution logging
  async commandLog(projectName, command, result) {
    await this.projectLog(projectName, 'COMMAND', {
      command,
      success: result.success,
      output: result.stdout?.substring(0, 500), // Limit output size
      error: result.stderr?.substring(0, 500)
    });
  }
}

module.exports = new Logger();
