# 🚀 Simple Laravel Manager

A dead-simple Laravel project manager that creates and manages Laravel applications using Docker. Built for simplicity and ease of use with a clean project structure.

## ✨ Features

- **One-click Laravel project creation** - Just enter a name and go
- **Docker-powered** - Each project runs in its own containers
- **Auto port management** - No port conflicts, ever
- **Clean web interface** - Simple, beautiful, and functional
- **Project Makefiles** - Easy command management for each project
- **Organized structure** - Laravel apps in `src/` folder for flexibility
- **Template system** - Fully customizable via stub files
- **Zero configuration** - Works out of the box

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the manager:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   ```
   http://localhost:3000
   ```

4. **Create your first Laravel project:**
   - Click "Create New Project"
   - Enter a project name (e.g., "my-blog")
   - Select services (Redis, PHPMyAdmin, Mailhog)
   - Click "Create Project"
   - Wait for it to build (this takes a few minutes the first time)
   - Click "Start" when ready
   - Click "Open" to view your Laravel app!

## 📋 Requirements

- Node.js 16+
- Docker & Docker Compose
- Composer (for Laravel project creation)

## 🎯 How It Works

1. **Project Creation:** Creates a new Laravel project using Composer in `src/` folder
2. **Docker Setup:** Generates Docker configuration from stub templates
3. **Port Assignment:** Automatically assigns available ports (starting from 8000)
4. **Container Management:** Start/stop containers with one click or via Makefile

## 📁 Project Structure

```
simple-laravel-manager/
├── server.js              # Main server
├── package.json           # Dependencies
├── stubs/                 # Template files
│   ├── docker-compose.yml.stub
│   ├── Dockerfile.stub
│   ├── Dockerfile.vite.stub
│   ├── nginx.conf.stub
│   ├── supervisor.conf.stub
│   ├── .env.stub
│   └── project-Makefile.stub
├── public/
│   └── index.html         # Web interface
└── projects/              # Your Laravel projects
    └── my-blog/           # Example project
        ├── src/           # Laravel application
        │   ├── app/
        │   ├── resources/
        │   ├── routes/
        │   └── ...
        ├── docker/        # Docker configs
        │   ├── nginx.conf
        │   └── supervisor.conf
        ├── docker-compose.yml
        ├── Dockerfile
        ├── Dockerfile.vite
        ├── Makefile       # Project commands
        └── .env           # Environment variables
```

## 🛠️ Project Management with Makefiles

Each created project includes a Makefile for easy management:

```bash
cd projects/my-blog

# Start the project
make start

# Stop the project
make stop

# View logs
make logs

# Open shell in app container
make shell

# Run Laravel artisan commands
make artisan CMD='migrate'
make artisan CMD='make:controller UserController'

# Run composer commands
make composer CMD='require laravel/breeze'

# Run npm commands
make npm CMD='install'
make npm CMD='run build'

# Show project info and URLs
make info

# Clean up everything
make clean
```

## 🔧 Configuration

### Default Ports
- **Web Interface:** 3000
- **Laravel Apps:** 8000, 8001, 8002... (auto-assigned)
- **MySQL:** 3306, 3307, 3308... (auto-assigned)
- **Redis:** 6379, 6380, 6381... (auto-assigned, if enabled)
- **PHPMyAdmin:** 8080, 8081, 8082... (auto-assigned, if enabled)
- **Mailhog:** 8025, 8026, 8027... (auto-assigned, if enabled)
- **Vite:** 5173, 5174, 5175... (auto-assigned)

### Environment Variables
```bash
PORT=3000                  # Manager port
```

## 🛠️ Development

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

## 📦 What Each Project Gets

- **Laravel:** Latest version via Composer in `src/` folder
- **PHP 8.2** with FPM and Supervisor
- **Nginx** as web server
- **MySQL 8.0** database
- **Vite** development server
- **Optional services:** Redis, PHPMyAdmin, Mailhog
- **Project Makefile** for easy command management
- **Automatic configuration** with proper environment setup

## 📝 Stub Files System

The manager uses stub files for complete customization. All stub files are required:

- `docker-compose.yml.stub` - Docker Compose configuration
- `Dockerfile.stub` - Main application container
- `Dockerfile.vite.stub` - Vite development container
- `nginx.conf.stub` - Nginx web server configuration
- `supervisor.conf.stub` - Process management
- `.env.stub` - Laravel environment variables
- `project-Makefile.stub` - Project management commands

### Placeholder Variables

Use these placeholders in your stub files:

- `{{PROJECT_NAME}}` - Project name
- `{{APP_PORT}}` - Application port
- `{{DB_PORT}}` - Database port
- `{{VITE_PORT}}` - Vite development port
- `{{REDIS_PORT}}` - Redis port (if enabled)
- `{{PHPMYADMIN_PORT}}` - PHPMyAdmin port (if enabled)
- `{{MAILHOG_PORT}}` - Mailhog port (if enabled)
- `{{REDIS_SERVICE}}` - Redis service configuration (conditional)
- `{{PHPMYADMIN_SERVICE}}` - PHPMyAdmin service configuration (conditional)
- `{{MAILHOG_SERVICE}}` - Mailhog service configuration (conditional)

## 🎨 Web Interface

- **Clean, dark theme** - Easy on the eyes
- **Responsive design** - Works on mobile and desktop
- **Real-time updates** - See project status instantly
- **One-click actions** - Start, stop, delete projects with one click
- **Service selection** - Choose Redis, PHPMyAdmin, Mailhog
- **Custom ports** - Advanced port configuration

## 🔍 Troubleshooting

### Project won't start?
1. Make sure Docker is running
2. Check if ports are available
3. Look at Docker logs: `make logs` in the project directory
4. Try rebuilding: `make build`

### Project creation fails?
1. Ensure Composer is installed globally
2. Check internet connection (downloads Laravel)
3. Make sure you have disk space
4. Verify all stub files exist in `stubs/` directory

### Can't access Laravel app?
1. Wait a few minutes after starting (first run takes time)
2. Check the container is running: `make status`
3. Try refreshing the browser
4. Check logs: `make logs`

### Missing stub files?
The server will not start if any stub files are missing. Ensure all required stub files exist in the `stubs/` directory.

## 🚀 Deployment

### Run as a Service (Linux)

1. **Create systemd service:**
   ```bash
   sudo nano /etc/systemd/system/laravel-manager.service
   ```

2. **Service configuration:**
   ```ini
   [Unit]
   Description=Simple Laravel Manager
   After=network.target

   [Service]
   Type=simple
   User=your-username
   WorkingDirectory=/path/to/simple-laravel-manager
   ExecStart=/usr/bin/node server.js
   Restart=on-failure
   Environment=NODE_ENV=production

   [Install]
   WantedBy=multi-user.target
   ```

3. **Enable and start:**
   ```bash
   sudo systemctl enable laravel-manager
   sudo systemctl start laravel-manager
   ```

## 🔐 Security Notes

- **Local use only** - This tool is designed for local development
- **No authentication** - Don't expose to the internet
- **File permissions** - Projects created with current user permissions
- **Docker security** - Follow Docker best practices for production

## 💡 Tips & Best Practices

1. **Use the Makefiles** - They provide the easiest way to manage projects
2. **Customize stub files** - Modify templates to match your workflow
3. **Organize by environment** - Use different Laravel apps in `src/` for different environments
4. **Backup projects** - The `src/` folder contains your Laravel application
5. **Use version control** - Initialize git repositories in the `src/` folder

## 🎯 Roadmap

- [ ] **Multiple PHP versions** - Choose PHP 7.4, 8.0, 8.1, 8.2, 8.3
- [ ] **Database options** - PostgreSQL, SQLite support
- [ ] **SSL support** - HTTPS for local development
- [ ] **Backup/restore** - Project backup functionality
- [ ] **Custom templates** - Multiple Laravel project templates
- [ ] **Logs viewer** - View container logs in the web interface
- [ ] **Environment management** - Multiple environment configs
- [ ] **Import existing projects** - Import existing Laravel projects

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

MIT License - feel free to use this for anything!

## 🙏 Credits

- **Laravel** - The amazing PHP framework
- **Docker** - For containerization magic
- **Express.js** - Simple and fast web framework
- **Make** - For simple command management

---

**Made with ❤️ for Laravel developers who want simplicity and organization**
