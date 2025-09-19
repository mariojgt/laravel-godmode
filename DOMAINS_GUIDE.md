# Local Domain Management Feature

## Overview
The Local Domain Management feature allows you to create custom domains for your local development projects. Instead of accessing your Laravel projects via `localhost:8000`, you can use custom domains like `myapp.test` or `api.myproject.local`.

## How It Works
This feature automatically manages your system's hosts file (`/etc/hosts` on macOS/Linux, `C:\Windows\System32\drivers\etc\hosts` on Windows) to redirect custom domains to your local development server.

## Features

### ✨ Key Features
- **Zero Dependencies**: Uses built-in system functionality (hosts file)
- **Simple Setup**: One-click domain addition with automatic hosts file management
- **Project Integration**: Link domains to specific Laravel projects
- **Domain Testing**: Built-in connectivity testing for added domains
- **Smart Suggestions**: Get domain name suggestions based on your project names
- **Cross-Platform**: Works on macOS, Linux, and Windows

### 🌐 Domain Management
- Add custom domains pointing to 127.0.0.1
- Remove domains when no longer needed
- Test domain connectivity and HTTP accessibility
- Copy domain URLs to clipboard
- View all managed domains in one place

### 🔧 System Integration
- Automatic hosts file backup (recommended)
- DNS cache flushing after changes
- Sudo/Admin permission handling
- Platform-specific installation commands

## Usage

### Adding a Domain
1. Go to **Settings** → **Domains** tab
2. Click **Add Domain**
3. Enter your desired domain (e.g., `myapp.test`)
4. Optionally link to a specific project
5. Click **Add Domain**
6. Enter your admin/sudo password when prompted

### Testing a Domain
1. Click the **Test** button on any domain card
2. The system will check:
   - DNS resolution (does the domain point to 127.0.0.1?)
   - HTTP accessibility (is there a service running?)
   - Response status code

### Removing a Domain
1. Click the **Remove** button on the domain card
2. Confirm the removal
3. Enter your admin/sudo password when prompted

## Best Practices

### Domain Naming
- Use `.test` or `.local` extensions for development
- Avoid real TLD extensions (.com, .org, etc.)
- Keep names simple and memorable
- Use project-specific names (e.g., `blog.test`, `api.myapp.test`)

### Security Considerations
- Only add domains you trust
- Regularly review your managed domains
- Use descriptive comments for domain purposes
- Remove unused domains to keep hosts file clean

## Examples

### Basic Laravel Project
```
Domain: blog.test
IP: 127.0.0.1
Project: My Blog
Comment: Main blog application
```
Access via: `http://blog.test:8000`

### API Project
```
Domain: api.myapp.test
IP: 127.0.0.1
Project: MyApp API
Comment: Backend API endpoints
```
Access via: `http://api.myapp.test:8000`

### Multiple Environments
```
Domain: dev.myapp.test    (Development)
Domain: staging.myapp.test (Staging)
Domain: local.myapp.test   (Local testing)
```

## Troubleshooting

### Domain Not Resolving
1. Check if domain was added successfully in Settings → Domains
2. Clear your browser's DNS cache
3. Try accessing via incognito/private browsing
4. Restart your browser
5. Flush system DNS cache:
   - macOS: `sudo dscacheutil -flushcache`
   - Linux: `sudo systemctl restart systemd-resolved`
   - Windows: `ipconfig /flushdns`

### Permission Issues
- Make sure you have admin/sudo privileges
- On macOS/Linux: You'll be prompted for your password
- On Windows: Run as Administrator

### Service Not Responding
1. Ensure your Laravel project is running
2. Check the correct port is being used
3. Verify firewall settings
4. Test with `curl` or browser dev tools

## Technical Details

### Hosts File Management
The system automatically manages a dedicated section in your hosts file:
```
# Laravel God Mode - Managed Domains
127.0.0.1    myapp.test    # My Laravel App
127.0.0.1    api.test     # API Server
```

### Platform Support
- **macOS**: Full support with sudo prompts
- **Linux**: Full support with sudo prompts
- **Windows**: Requires running as Administrator

### File Locations
- **macOS/Linux**: `/etc/hosts`
- **Windows**: `C:\Windows\System32\drivers\etc\hosts`

## Advanced Usage

### Manual Hosts File Editing
While the interface handles most cases, you can manually edit the hosts file if needed:
```bash
# macOS/Linux
sudo nano /etc/hosts

# Windows (as Administrator)
notepad C:\Windows\System32\drivers\etc\hosts
```

### Integration with Project Creation
When creating new projects, you can automatically set up custom domains by:
1. Creating the project first
2. Going to Settings → Domains
3. Adding a domain and linking it to the project
4. The project card will show the custom domain

### Backup and Restore
Always backup your hosts file before making changes:
```bash
# macOS/Linux
sudo cp /etc/hosts /etc/hosts.backup

# Windows
copy C:\Windows\System32\drivers\etc\hosts C:\Windows\System32\drivers\etc\hosts.backup
```

## FAQ

**Q: Will this affect my internet browsing?**
A: No, it only affects the specific domains you add. All other websites work normally.

**Q: Can I use real domain names?**
A: Yes, but it's not recommended. Use .test or .local domains to avoid conflicts.

**Q: What happens when I remove a domain?**
A: The entry is removed from your hosts file, and the domain will resolve normally again.

**Q: Can I have multiple domains for one project?**
A: Yes, you can add multiple domains pointing to the same project.

**Q: Does this work with HTTPS?**
A: The hosts file only handles DNS resolution. For HTTPS, you'll need SSL certificates configured in your web server.

## Support

If you encounter issues:
1. Check the system information in Settings → Domains
2. Verify your hosts file permissions
3. Test with a simple domain first (e.g., `test.test`)
4. Check the application logs for error details
5. Try restarting the Laravel God Mode application
