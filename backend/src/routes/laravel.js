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

// Save projects helper
async function saveProjects(projects) {
  await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

// Get Laravel-specific project status
router.get('/:id/status', async (req, res) => {
  try {
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.id);

    if (!project || project.template !== 'laravel') {
      return res.status(404).json({ error: 'Laravel project not found' });
    }

    const status = await getLaravelProjectStatus(project);
    res.json(status);
  } catch (error) {
    console.error('Failed to get Laravel status:', error);
    res.status(500).json({ error: 'Failed to get Laravel project status' });
  }
});

// Run Laravel Artisan commands
router.post('/:id/artisan', async (req, res) => {
  try {
    const { command, args = [] } = req.body;
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.id);

    if (!project || project.template !== 'laravel') {
      return res.status(404).json({ error: 'Laravel project not found' });
    }

    const fullCommand = `docker-compose exec -T app php artisan ${command} ${args.join(' ')}`;
    console.log(`Running Laravel command: ${fullCommand}`);

    const { stdout, stderr } = await execAsync(fullCommand, {
      cwd: project.path,
      timeout: 30000 // 30 second timeout
    });

    res.json({
      success: true,
      output: stdout,
      error: stderr || null,
      command: `php artisan ${command} ${args.join(' ')}`
    });
  } catch (error) {
    console.error('Artisan command failed:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      output: error.stdout || '',
      stderr: error.stderr || ''
    });
  }
});

// Get queue status and manage queue workers
router.get('/:id/queue/status', async (req, res) => {
  try {
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.id);

    if (!project || project.template !== 'laravel') {
      return res.status(404).json({ error: 'Laravel project not found' });
    }

    const queueStatus = await getQueueStatus(project);
    res.json(queueStatus);
  } catch (error) {
    console.error('Failed to get queue status:', error);
    res.status(500).json({ error: 'Failed to get queue status' });
  }
});

// Start queue worker
router.post('/:id/queue/start', async (req, res) => {
  try {
    const { queue = 'default', timeout = 60, tries = 3 } = req.body;
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.id);

    if (!project || project.template !== 'laravel') {
      return res.status(404).json({ error: 'Laravel project not found' });
    }

    // Start queue worker in background
    const command = `docker-compose exec -d app php artisan queue:work --queue=${queue} --timeout=${timeout} --tries=${tries} --sleep=3`;

    await execAsync(command, { cwd: project.path });

    res.json({
      success: true,
      message: `Queue worker started for queue: ${queue}`,
      queue,
      timeout,
      tries
    });
  } catch (error) {
    console.error('Failed to start queue worker:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start queue worker',
      details: error.message
    });
  }
});

// Stop queue workers
router.post('/:id/queue/stop', async (req, res) => {
  try {
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.id);

    if (!project || project.template !== 'laravel') {
      return res.status(404).json({ error: 'Laravel project not found' });
    }

    // Stop all queue workers
    const command = `docker-compose exec app php artisan queue:restart`;

    await execAsync(command, { cwd: project.path });

    res.json({
      success: true,
      message: 'All queue workers stopped'
    });
  } catch (error) {
    console.error('Failed to stop queue workers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop queue workers',
      details: error.message
    });
  }
});

// Get queue jobs
router.get('/:id/queue/jobs', async (req, res) => {
  try {
    const { status = 'all', limit = 50 } = req.query;
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.id);

    if (!project || project.template !== 'laravel') {
      return res.status(404).json({ error: 'Laravel project not found' });
    }

    const jobs = await getQueueJobs(project, status, limit);
    res.json(jobs);
  } catch (error) {
    console.error('Failed to get queue jobs:', error);
    res.status(500).json({ error: 'Failed to get queue jobs' });
  }
});

// Clear cache
router.post('/:id/cache/clear', async (req, res) => {
  try {
    const { types = ['all'] } = req.body;
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.id);

    if (!project || project.template !== 'laravel') {
      return res.status(404).json({ error: 'Laravel project not found' });
    }

    const results = await clearCache(project, types);
    res.json(results);
  } catch (error) {
    console.error('Failed to clear cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

// Run database migrations
router.post('/:id/migrate', async (req, res) => {
  try {
    const { fresh = false, seed = false } = req.body;
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.id);

    if (!project || project.template !== 'laravel') {
      return res.status(404).json({ error: 'Laravel project not found' });
    }

    const result = await runMigrations(project, fresh, seed);
    res.json(result);
  } catch (error) {
    console.error('Failed to run migrations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run migrations',
      details: error.message
    });
  }
});

// Get Laravel logs
router.get('/:id/logs', async (req, res) => {
  try {
    const { type = 'laravel', lines = 100 } = req.query;
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.id);

    if (!project || project.template !== 'laravel') {
      return res.status(404).json({ error: 'Laravel project not found' });
    }

    const logs = await getLaravelLogs(project, type, lines);
    res.json(logs);
  } catch (error) {
    console.error('Failed to get Laravel logs:', error);
    res.status(500).json({ error: 'Failed to get Laravel logs' });
  }
});

// Schedule management
router.get('/:id/schedule/status', async (req, res) => {
  try {
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.id);

    if (!project || project.template !== 'laravel') {
      return res.status(404).json({ error: 'Laravel project not found' });
    }

    const scheduleStatus = await getScheduleStatus(project);
    res.json(scheduleStatus);
  } catch (error) {
    console.error('Failed to get schedule status:', error);
    res.status(500).json({ error: 'Failed to get schedule status' });
  }
});

// Run scheduler manually
router.post('/:id/schedule/run', async (req, res) => {
  try {
    const projects = await loadProjects();
    const project = projects.find(p => p.id === req.params.id);

    if (!project || project.template !== 'laravel') {
      return res.status(404).json({ error: 'Laravel project not found' });
    }

    const result = await runScheduler(project);
    res.json(result);
  } catch (error) {
    console.error('Failed to run scheduler:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run scheduler',
      details: error.message
    });
  }
});

// Helper Functions

async function getLaravelProjectStatus(project) {
  const status = {
    project: project.name,
    services: {},
    database: {},
    cache: {},
    queue: {},
    schedule: {},
    storage: {}
  };

  try {
    // Check if containers are running
    const { stdout: psOutput } = await execAsync('docker-compose ps --format json', { cwd: project.path });
    const containers = JSON.parse(`[${psOutput.trim().split('\n').join(',')}]`);

    // Service status
    status.services = {
      app: containers.find(c => c.Service === 'app')?.State === 'running',
      db: containers.find(c => c.Service === 'db')?.State === 'running',
      redis: containers.find(c => c.Service === 'redis')?.State === 'running',
      nginx: containers.find(c => c.Service === 'nginx')?.State === 'running'
    };

    // Database status
    if (status.services.db) {
      try {
        const { stdout: dbStatus } = await execAsync(
          'docker-compose exec -T db mysql -u root -ppassword -e "SELECT 1 as status"',
          { cwd: project.path, timeout: 5000 }
        );
        status.database.connected = dbStatus.includes('status');
      } catch {
        status.database.connected = false;
      }
    }

    // Cache status (Redis)
    if (status.services.redis) {
      try {
        const { stdout: redisStatus } = await execAsync(
          'docker-compose exec -T redis redis-cli ping',
          { cwd: project.path, timeout: 5000 }
        );
        status.cache.connected = redisStatus.trim() === 'PONG';
      } catch {
        status.cache.connected = false;
      }
    }

    // Queue status
    status.queue = await getQueueStatus(project);

    // Schedule status
    status.schedule = await getScheduleStatus(project);

  } catch (error) {
    console.error('Error getting Laravel project status:', error);
    status.error = error.message;
  }

  return status;
}

async function getQueueStatus(project) {
  try {
    // Check if queue workers are running
    const { stdout: queueOutput } = await execAsync(
      'docker-compose exec -T app php artisan queue:monitor',
      { cwd: project.path, timeout: 10000 }
    );

    const queueStatus = {
      workers: 0,
      jobs: {
        pending: 0,
        processing: 0,
        failed: 0
      }
    };

    // Parse queue monitor output
    const lines = queueOutput.split('\n');
    for (const line of lines) {
      if (line.includes('worker')) {
        queueStatus.workers++;
      }
      if (line.includes('pending')) {
        const match = line.match(/(\d+)\s+pending/);
        if (match) queueStatus.jobs.pending = parseInt(match[1]);
      }
      if (line.includes('processing')) {
        const match = line.match(/(\d+)\s+processing/);
        if (match) queueStatus.jobs.processing = parseInt(match[1]);
      }
      if (line.includes('failed')) {
        const match = line.match(/(\d+)\s+failed/);
        if (match) queueStatus.jobs.failed = parseInt(match[1]);
      }
    }

    return queueStatus;
  } catch (error) {
    return {
      workers: 0,
      jobs: { pending: 0, processing: 0, failed: 0 },
      error: error.message
    };
  }
}

async function getQueueJobs(project, status, limit) {
  try {
    let command = '';

    switch (status) {
      case 'failed':
        command = `docker-compose exec -T app php artisan queue:failed --format=json`;
        break;
      case 'pending':
        command = `docker-compose exec -T app php artisan horizon:list --format=json`;
        break;
      default:
        command = `docker-compose exec -T app php artisan queue:monitor --format=json`;
    }

    const { stdout } = await execAsync(command, {
      cwd: project.path,
      timeout: 10000
    });

    // Parse JSON output (Laravel commands may not always return valid JSON)
    try {
      return JSON.parse(stdout);
    } catch {
      // Fallback to text parsing
      return { jobs: stdout.split('\n').filter(line => line.trim()) };
    }
  } catch (error) {
    return {
      jobs: [],
      error: error.message
    };
  }
}

async function clearCache(project, types) {
  const results = {};

  for (const type of types) {
    try {
      let command = '';

      switch (type) {
        case 'all':
          command = 'docker-compose exec -T app php artisan optimize:clear';
          break;
        case 'config':
          command = 'docker-compose exec -T app php artisan config:clear';
          break;
        case 'view':
          command = 'docker-compose exec -T app php artisan view:clear';
          break;
        case 'route':
          command = 'docker-compose exec -T app php artisan route:clear';
          break;
        case 'cache':
          command = 'docker-compose exec -T app php artisan cache:clear';
          break;
        default:
          continue;
      }

      const { stdout } = await execAsync(command, {
        cwd: project.path,
        timeout: 15000
      });

      results[type] = {
        success: true,
        output: stdout.trim()
      };
    } catch (error) {
      results[type] = {
        success: false,
        error: error.message
      };
    }
  }

  return {
    success: Object.values(results).every(r => r.success),
    results
  };
}

async function runMigrations(project, fresh, seed) {
  try {
    let command = 'docker-compose exec -T app php artisan ';

    if (fresh) {
      command += 'migrate:fresh';
      if (seed) {
        command += ' --seed';
      }
    } else {
      command += 'migrate --force';
    }

    const { stdout, stderr } = await execAsync(command, {
      cwd: project.path,
      timeout: 60000 // 1 minute timeout for migrations
    });

    return {
      success: true,
      output: stdout,
      error: stderr || null,
      type: fresh ? (seed ? 'fresh+seed' : 'fresh') : 'normal'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout || '',
      stderr: error.stderr || ''
    };
  }
}

async function getLaravelLogs(project, type, lines) {
  try {
    let command = '';

    switch (type) {
      case 'laravel':
        command = `docker-compose exec -T app tail -n ${lines} storage/logs/laravel.log`;
        break;
      case 'nginx':
        command = `docker-compose logs --tail=${lines} nginx`;
        break;
      case 'mysql':
        command = `docker-compose logs --tail=${lines} db`;
        break;
      case 'redis':
        command = `docker-compose logs --tail=${lines} redis`;
        break;
      default:
        command = `docker-compose logs --tail=${lines}`;
    }

    const { stdout } = await execAsync(command, {
      cwd: project.path,
      timeout: 10000
    });

    return {
      type,
      logs: stdout.split('\n').filter(line => line.trim()),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      type,
      logs: [`Error fetching logs: ${error.message}`],
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

async function getScheduleStatus(project) {
  try {
    // Check if cron is configured
    const { stdout } = await execAsync(
      'docker-compose exec -T app php artisan schedule:list',
      { cwd: project.path, timeout: 10000 }
    );

    const schedules = [];
    const lines = stdout.split('\n');

    for (const line of lines) {
      if (line.includes('artisan') || line.includes('command')) {
        schedules.push({
          command: line.trim(),
          next_run: 'N/A' // Laravel doesn't easily provide next run time
        });
      }
    }

    return {
      enabled: schedules.length > 0,
      schedules,
      last_check: new Date().toISOString()
    };
  } catch (error) {
    return {
      enabled: false,
      schedules: [],
      error: error.message,
      last_check: new Date().toISOString()
    };
  }
}

async function runScheduler(project) {
  try {
    const { stdout, stderr } = await execAsync(
      'docker-compose exec -T app php artisan schedule:run',
      { cwd: project.path, timeout: 30000 }
    );

    return {
      success: true,
      output: stdout,
      error: stderr || null,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      output: error.stdout || '',
      stderr: error.stderr || '',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = router;
