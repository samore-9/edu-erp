// backend/utils/logger.js — Simple structured logger
const fs   = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const LEVELS = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
const currentLevel = process.env.LOG_LEVEL
  ? LEVELS[process.env.LOG_LEVEL.toUpperCase()] ?? LEVELS.INFO
  : process.env.NODE_ENV === 'production' ? LEVELS.WARN : LEVELS.DEBUG;

const formatMessage = (level, message, meta = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(Object.keys(meta).length && { meta }),
  };
  return JSON.stringify(entry);
};

const writeToFile = (line) => {
  const date = new Date().toISOString().split('T')[0];
  const file = path.join(LOG_DIR, `${date}.log`);
  fs.appendFile(file, line + '\n', () => {}); // fire-and-forget
};

const log = (level, levelNum, message, meta) => {
  if (levelNum > currentLevel) return;
  const line = formatMessage(level, message, meta);

  // Console output with color in dev
  if (process.env.NODE_ENV !== 'production') {
    const colors = { ERROR: '\x1b[31m', WARN: '\x1b[33m', INFO: '\x1b[36m', DEBUG: '\x1b[90m' };
    const reset = '\x1b[0m';
    const ts = new Date().toLocaleTimeString();
    console.log(`${colors[level]}[${ts}] ${level}${reset} ${message}`, Object.keys(meta||{}).length ? meta : '');
  } else {
    writeToFile(line);
  }
};

const logger = {
  error: (msg, meta) => log('ERROR', LEVELS.ERROR, msg, meta),
  warn:  (msg, meta) => log('WARN',  LEVELS.WARN,  msg, meta),
  info:  (msg, meta) => log('INFO',  LEVELS.INFO,  msg, meta),
  debug: (msg, meta) => log('DEBUG', LEVELS.DEBUG, msg, meta),

  /** Express request logger middleware */
  requestMiddleware: (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const meta = { method: req.method, url: req.originalUrl, status: res.statusCode, ms: duration, ip: req.ip };
      if (res.statusCode >= 500) logger.error('HTTP Request', meta);
      else if (res.statusCode >= 400) logger.warn('HTTP Request', meta);
      else logger.info('HTTP Request', meta);
    });
    next();
  },
};

module.exports = logger;
