# Laravel Godmode - Full Stack Application Manager

A modern, clean, and modular application to manage development projects with different templates (Laravel, Node.js, etc.), using Docker for orchestration.

## ✨ Features

- **Template-based Project Creation** - Laravel, Node.js, and custom templates
- **Real-time Terminal Output** - WebSocket-powered terminal interface
- **Project Management Dashboard** - Visual status monitoring
- **Integrated Terminal per Project** - Run commands directly
- **Live Docker Configuration Editing** - Update configs on the fly
- **Environment File Editor** - Manage .env files easily
- **Real-time Logs Viewer** - Stream container logs
- **Project Backups** - Automated backup system
- **Modern UI** - Clean, responsive design with your brand guidelines

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd full-stack-app-manager
   ```

2. **Install dependencies**
   ```bash
   make install
   ```

3. **Start the application**
   ```bash
   make dev
   ```

4. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## 📋 Available Commands

```bash
make help          # Show all available commands
make install       # Install all dependencies
make dev           # Start in development mode
make start         # Start the application
make stop          # Stop the application
make restart       # Restart the application
make status        # Show application status
make clean         # Clean build artifacts
make deps          # Check dependencies
```

## 📁 Project Structure

```
├── backend/              # Node.js backend server
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── controllers/  # Business logic
│   │   └── utils/        # Utilities
│   └── package.json
├── frontend/             # Vanilla JS frontend
│   ├── public/
│   │   ├── js/           # JavaScript modules
│   │   ├── styles/       # CSS stylesheets
│   │   └── index.html
│   └── package.json
├── templates/            # Project templates
│   ├── laravel/          # Laravel template
│   └── nodejs/           # Node.js template
├── data/                 # Application data
│   └── projects.json     # Projects metadata
├── backups/              # Project backups
└── Makefile              # Command interface
```

## 🔷 Creating Projects

1. Click **"Create Project"** on the dashboard
2. Choose a template (Laravel, Node.js, etc.)
3. Configure versions and services
4. Set port mappings
5. Click **"Create Project"**

The system will:
- Generate Docker configurations
- Set up the development environment
- Start the containers
- Provide terminal access

## 🛠️ Templates

### Laravel Template
- PHP 7.4 - 8.3 support
- MySQL database
- Redis caching
- Nginx web server
- Optional PHPMyAdmin
- Optional MailHog

### Node.js Template
- Node.js 16-21 support
- Express.js framework
- MySQL database
- Optional Redis
- Package manager choice (npm, yarn, bun, pnpm)

## 🎨 UI Design

The interface follows modern design principles:
- **Clean & minimalistic** layout
- **Teal (#64FFDA)** primary color
- **Purple (#8B5CF6)** secondary color
- **Amber (#F59E0B)** accent color
- **Dark theme** with proper contrast
- **Inter** font family for text
- **Fira Code** for code/terminal

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Adding New Templates

1. Create template directory in `templates/`
2. Add `config.json` with template metadata
3. Create stub files in `stubs/` directory
4. Template will automatically appear in the UI

## 📡 API Endpoints

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/start` - Start project
- `POST /api/projects/:id/stop` - Stop project

### Templates
- `GET /api/templates` - List available templates
- `GET /api/templates/:id` - Get template details
- `GET /api/templates/:id/stubs` - Get template files

### Terminal
- `POST /api/terminal/create` - Create terminal session
- `POST /api/terminal/:id/input` - Send input to terminal
- `DELETE /api/terminal/:id` - Kill terminal session

## 🔌 WebSocket Events

- `connected` - WebSocket connection established
- `project_update` - Project status changed
- `terminal_output` - Terminal output data
- `log_update` - Container log update

## 📦 Dependencies

### Backend
- `express` - Web framework
- `cors` - Cross-origin resource sharing
- `ws` - WebSocket server
- `dockerode` - Docker API client
- `node-pty` - Terminal interface
- `uuid` - Unique ID generation

### Frontend
- Pure vanilla JavaScript
- No build tools required
- Modern ES6+ features
- CSS Grid & Flexbox

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

If you encounter issues:

1. Check the logs: `make logs`
2. Verify dependencies: `make deps`
3. Check application status: `make status`
4. Restart the application: `make restart`

For additional help, please open an issue on GitHub.
