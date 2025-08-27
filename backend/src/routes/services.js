const express = require('express');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();
const execAsync = promisify(exec);

const PROJECTS_FILE = path.join(__dirname, '../../../data/projects.json');

// Load projects helper
async function loadProjects() {
  try {
    const data = await fs.readFile(PROJECTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Service status for all projects
router.get('/status', async (req, res) => {
  try {
    const projects = await loadProjects();
    const serviceStatus = {};

    for (const project of projects) {
      if (project.template === 'laravel' && project.status === 'running') {
        serviceStatus[project.id] = await getProjectServices(project);
      }
    }

    res.json(serviceStatus);
  } catch (error) {
    console.error('Failed to get service status:', error);
    res.status(500).json({ error: 'Failed to get service status' });
  }
});

// Get specific project services
router.get('/:projectId', async (req, res) => {
  try {
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.projectId);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const services = await getProjectServices(project);
    res.json(services);
  } catch (error) {
    console.error('Failed to get project services:', error);
    res.status(500).json({ error: 'Failed to get project services' });
  }
});

// Control service daemon (start/stop/restart)
router.post('/:projectId/:service/:action', async (req, res) => {
  try {
    const { projectId, service, action } = req.params;
    const projects = await loadProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project || project.template !== 'laravel') {
      return res.status(404).json({ error: 'Laravel project not found' });
    }

    const result = await controlService(project, service, action);
    res.json(result);
  } catch (error) {
    console.error('Failed to control service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to control service',
      details: error.message
    });
  }
});

// Get service health check
router.get('/:projectId/health', async (req, res) => {
  try {
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.projectId);

    if (!project || project.template !== 'laravel') {
      return res.status(404).json({ error: 'Laravel project not found' });
    }

    const health = await getServiceHealth(project);
    res.json(health);
  } catch (error) {
    console.error('Failed to get service health:', error);
    res.status(500).json({ error: 'Failed to get service health' });
  }
});

// Get real-time metrics
router.get('/:projectId/metrics', async (req, res) => {
  try {
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.projectId);

    if (!project || project.template !== 'laravel') {
      return res.status(404).json({ error: 'Laravel project not found' });
    }

    const metrics = await getServiceMetrics(project);
    res.json(metrics);
  } catch (error) {
    console.error('Failed to get service metrics:', error);
    res.status(500).json({ error: 'Failed to get service metrics' });
  }
});

// Helper Functions

async function getProjectServices(project) {
  const services = {
    containers: {},
    laravel: {},
    database: {},
    cache: {},
    queue: {},
    scheduler: {},
    health: {}
  };

  try {
    // Container status
    const { stdout: psOutput } = await execAsync('docker-compose ps --format json', { cwd: project.path });
    const containers = JSON.parse(`[${psOutput.trim().split('\n').join(',')}]`);

    services.containers = {
      app: containers.find(c => c.Service === 'app')?.State === 'running',
      db: containers.find(c => c.Service === 'db')?.State === 'running',
      redis: containers.find(c => c.Service === 'redis')?.State === 'running',
      nginx: containers.find(c => c.Service === 'nginx')?.State === 'running'
    };

    // Laravel-specific services
    if (services.containers.app) {
      // Queue status
      services.queue = await getQueueStatus(project);

      // Scheduler status
      services.scheduler = await getScheduleStatus(project);

      // Database connectivity
      services.database = await getDatabaseStatus(project);

      // Cache status
      services.cache = await getCacheStatus(project);

      // Laravel application health
      services.laravel = await getLaravelHealth(project);
    }

    // Overall health score
    services.health = calculateHealthScore(services);

  } catch (error) {
    console.error('Error getting project services:', error);
    services.error = error.message;
  }

  return services;
}

async function getQueueStatus(project) {
  try {
    // Check for active queue workers
    const { stdout } = await execAsync(
      'docker-compose exec -T app ps aux | grep "queue:work" | grep -v grep | wc -l',
      { cwd: project.path, timeout: 5000 }
    );

    const workerCount = parseInt(stdout.trim()) || 0;

    // Get queue job counts
    let jobCounts = { pending: 0, processing: 0, failed: 0 };
    try {
      const { stdout: jobsOutput } = await execAsync(
        'docker-compose exec -T app php artisan queue:monitor',
        { cwd: project.path, timeout: 5000 }
      );

      // Parse queue monitor output
      const lines = jobsOutput.split('\n');
      for (const line of lines) {
        if (line.includes('pending')) {
          const match = line.match(/(\d+)\s+pending/);
          if (match) jobCounts.pending = parseInt(match[1]);
        }
        if (line.includes('processing')) {
          const match = line.match(/(\d+)\s+processing/);
          if (match) jobCounts.processing = parseInt(match[1]);
        }
        if (line.includes('failed')) {
          const match = line.match(/(\d+)\s+failed/);
          if (match) jobCounts.failed = parseInt(match[1]);
        }
      }
    } catch (error) {
      console.log('Queue monitor command not available or no jobs');
    }

    return {
      workers: workerCount,
      jobs: jobCounts,
      enabled: workerCount > 0,
      healthy: workerCount > 0 && jobCounts.failed < 10
    };
  } catch (error) {
    return {
      workers: 0,
      jobs: { pending: 0, processing: 0, failed: 0 },
      enabled: false,
      healthy: false,
      error: error.message
    };
  }
}

async function getScheduleStatus(project) {
  try {
    const { stdout } = await execAsync(
      'docker-compose exec -T app php artisan schedule:list',
      { cwd: project.path, timeout: 5000 }
    );

    const schedules = [];
    const lines = stdout.split('\n');

    for (const line of lines) {
      if (line.includes('artisan') || line.includes('command')) {
        schedules.push({
          command: line.trim(),
          next_run: 'N/A'
        });
      }
    }

    // Check if cron is running (simplified check)
    const cronEnabled = schedules.length > 0;

    return {
      enabled: cronEnabled,
      schedules: schedules.slice(0, 5), // Limit to 5 most recent
      count: schedules.length,
      healthy: cronEnabled,
      last_check: new Date().toISOString()
    };
  } catch (error) {
    return {
      enabled: false,
      schedules: [],
      count: 0,
      healthy: false,
      error: error.message,
      last_check: new Date().toISOString()
    };
  }
}

async function getDatabaseStatus(project) {
  try {
    const { stdout } = await execAsync(
      'docker-compose exec -T db mysql -u root -ppassword -e "SELECT 1 as connected" 2>/dev/null',
      { cwd: project.path, timeout: 5000 }
    );

    const connected = stdout.includes('connected');

    // Get database size
    let databaseSize = 'Unknown';
    try {
      const { stdout: sizeOutput } = await execAsync(
        `docker-compose exec -T db mysql -u root -ppassword -e "SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 1) AS 'DB Size in MB' FROM information_schema.tables WHERE table_schema='${project.name}'" 2>/dev/null`,
        { cwd: project.path, timeout: 5000 }
      );

      const sizeMatch = sizeOutput.match(/[\d.]+/);
      if (sizeMatch) {
        databaseSize = `${sizeMatch[0]} MB`;
      }
    } catch (error) {
      console.log('Could not get database size');
    }

    return {
      connected,
      size: databaseSize,
      healthy: connected,
      last_check: new Date().toISOString()
    };
  } catch (error) {
    return {
      connected: false,
      size: 'Unknown',
      healthy: false,
      error: error.message,
      last_check: new Date().toISOString()
    };
  }
}

async function getCacheStatus(project) {
  try {
    // Check Redis if available
    const { stdout } = await execAsync(
      'docker-compose exec -T redis redis-cli ping 2>/dev/null || echo "file"',
      { cwd: project.path, timeout: 5000 }
    );

    const redisAvailable = stdout.trim() === 'PONG';
    const cacheDriver = redisAvailable ? 'redis' : 'file';

    return {
      driver: cacheDriver,
      redis_available: redisAvailable,
      healthy: true, // Cache is always considered healthy
      last_check: new Date().toISOString()
    };
  } catch (error) {
    return {
      driver: 'file',
      redis_available: false,
      healthy: true,
      error: error.message,
      last_check: new Date().toISOString()
    };
  }
}

async function getLaravelHealth(project) {
  try {
    // Check if Laravel is responding
    const appPort = project.ports?.app || 8000;

    // Simple health check by checking if app responds
    try {
      const { stdout } = await execAsync(
        `curl -s -o /dev/null -w "%{http_code}" http://localhost:${appPort} || echo "000"`,
        { timeout: 5000 }
      );

      const httpCode = parseInt(stdout.trim());
      const responding = httpCode >= 200 && httpCode < 500;

      return {
        responding,
        http_code: httpCode,
        port: appPort,
        healthy: responding,
        last_check: new Date().toISOString()
      };
    } catch (error) {
      return {
        responding: false,
        http_code: 0,
        port: appPort,
        healthy: false,
        error: error.message,
        last_check: new Date().toISOString()
      };
    }
  } catch (error) {
    return {
      responding: false,
      healthy: false,
      error: error.message,
      last_check: new Date().toISOString()
    };
  }
}

function calculateHealthScore(services) {
  let totalServices = 0;
  let healthyServices = 0;

  // Container health
  const containerCount = Object.keys(services.containers).length;
  const runningContainers = Object.values(services.containers).filter(Boolean).length;
  totalServices += containerCount;
  healthyServices += runningContainers;

  // Laravel services health
  if (services.laravel?.healthy) healthyServices += 1;
  totalServices += 1;

  if (services.database?.healthy) healthyServices += 1;
  totalServices += 1;

  if (services.cache?.healthy) healthyServices += 1;
  totalServices += 1;

  const score = Math.round((healthyServices / totalServices) * 100);

  return {
    score,
    status: score >= 90 ? 'excellent' : score >= 70 ? 'good' : score >= 50 ? 'warning' : 'critical',
    total_services: totalServices,
    healthy_services: healthyServices
  };
}

async function controlService(project, service, action) {
  try {
    let command = '';

    switch (service) {
      case 'queue':
        switch (action) {
          case 'start':
            command = 'docker-compose exec -d app php artisan queue:work --sleep=3 --tries=3 --max-time=3600';
            break;
          case 'stop':
            command = 'docker-compose exec app php artisan queue:restart';
            break;
          case 'restart':
            await execAsync('docker-compose exec app php artisan queue:restart', { cwd: project.path });
            await new Promise(resolve => setTimeout(resolve, 2000));
            command = 'docker-compose exec -d app php artisan queue:work --sleep=3 --tries=3 --max-time=3600';
            break;
          default:
            throw new Error(`Unknown queue action: ${action}`);
        }
        break;

      case 'scheduler':
        switch (action) {
          case 'run':
            command = 'docker-compose exec app php artisan schedule:run';
            break;
          default:
            throw new Error(`Unknown scheduler action: ${action}`);
        }
        break;

      default:
        throw new Error(`Unknown service: ${service}`);
    }

    const { stdout, stderr } = await execAsync(command, {
      cwd: project.path,
      timeout: 30000
    });

    return {
      success: true,
      service,
      action,
      output: stdout,
      error: stderr || null,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      service,
      action,
      error: error.message,
      output: error.stdout || '',
      stderr: error.stderr || '',
      timestamp: new Date().toISOString()
    };
  }
}

async function getServiceHealth(project) {
  const services = await getProjectServices(project);

  return {
    overall: services.health,
    services: {
      containers: services.containers,
      queue: {
        status: services.queue?.enabled ? 'running' : 'stopped',
        healthy: services.queue?.healthy || false
      },
      database: {
        status: services.database?.connected ? 'connected' : 'disconnected',
        healthy: services.database?.healthy || false
      },
      cache: {
        status: services.cache?.driver || 'unknown',
        healthy: services.cache?.healthy || false
      },
      laravel: {
        status: services.laravel?.responding ? 'responding' : 'not responding',
        healthy: services.laravel?.healthy || false
      }
    },
    timestamp: new Date().toISOString()
  };
}

async function getServiceMetrics(project) {
  try {
    // Get container resource usage
    const { stdout: statsOutput } = await execAsync(
      'docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" $(docker-compose ps -q)',
      { cwd: project.path, timeout: 10000 }
    );

    const containerStats = [];
    const lines = statsOutput.split('\n').slice(1); // Skip header

    for (const line of lines) {
      if (line.trim()) {
        const [name, cpu, memory] = line.split('\t');
        containerStats.push({
          name: name?.trim(),
          cpu: cpu?.trim(),
          memory: memory?.trim()
        });
      }
    }

    // Get queue metrics
    const queueMetrics = await getQueueStatus(project);

    return {
      containers: containerStats,
      queue: {
        workers: queueMetrics.workers,
        jobs: queueMetrics.jobs
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      containers: [],
      queue: { workers: 0, jobs: { pending: 0, processing: 0, failed: 0 } },
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = router;
