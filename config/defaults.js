/**
 * Default configuration for Laravel God Mode
 */

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },

  // Default ports for services
  ports: {
    startPort: 8000,
    mysql: 3306,
    redis: 6379,
    phpmyadmin: 8080,
    mailhog: 8025,
    vite: 5173
  },

  // PHP versions available
  phpVersions: ['7.4', '8.0', '8.1', '8.2', '8.3'],

  // Node.js versions available
  nodeVersions: ['16', '18', '20', '21'],

  // Default services
  defaultServices: ['mysql', 'nginx', 'redis'],

  // Available services
  availableServices: [
    'mysql',
    'nginx',
    'redis',
    'phpmyadmin',
    'mailhog',
    'supervisor'
  ],

  // Project defaults
  project: {
    phpVersion: '8.2',
    nodeVersion: '18',
    installBun: true,
    installPnpm: false,
    services: ['mysql', 'nginx', 'redis']
  },

  // Paths
  paths: {
    projects: './projects',
    stubs: './stubs',
    logs: './logs',
    data: './data'
  },

  // Docker configuration
  docker: {
    network: 'laravel-god-mode',
    defaultRestart: 'unless-stopped'
  },

  // Logging
  logging: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    maxFiles: 10,
    maxSize: '10MB'
  }
};
