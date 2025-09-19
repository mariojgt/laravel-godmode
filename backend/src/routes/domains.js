const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const router = express.Router();

// Configuration
const HOSTS_FILE = process.platform === 'win32' ? 'C:\\Windows\\System32\\drivers\\etc\\hosts' : '/etc/hosts';
const LARAVEL_GODMODE_MARKER = '# Laravel God Mode - Managed Domains';

// Helper function to read hosts file
function readHostsFile() {
    try {
        return fs.readFileSync(HOSTS_FILE, 'utf8');
    } catch (error) {
        throw new Error(`Cannot read hosts file: ${error.message}`);
    }
}

// Helper function to write hosts file (requires sudo)
async function writeHostsFile(content, adminPassword = null) {
    try {
        const tempFile = path.join(os.tmpdir(), 'hosts_temp');
        fs.writeFileSync(tempFile, content);

        // First, try to check if we have write permissions
        try {
            fs.accessSync(HOSTS_FILE, fs.constants.W_OK);
            // If we can write directly, do it
            fs.writeFileSync(HOSTS_FILE, content);
            fs.unlinkSync(tempFile);
            return { success: true, method: 'direct' };
        } catch (permError) {
            // We need elevated permissions
            try {
                if (process.platform === 'win32') {
                    // Windows: Try direct copy first, then with password if provided
                    if (adminPassword) {
                        // For Windows, we'd need a different approach with PowerShell
                        execSync(`echo ${adminPassword} | powershell -Command "Start-Process cmd -ArgumentList '/c copy \"${tempFile}\" \"${HOSTS_FILE}\"' -Verb RunAs"`, { stdio: 'pipe' });
                    } else {
                        execSync(`copy "${tempFile}" "${HOSTS_FILE}"`, { stdio: 'pipe' });
                    }
                } else {
                    // macOS/Linux: Use sudo with password
                    if (adminPassword) {
                        // Use sudo with password via echo
                        execSync(`echo "${adminPassword}" | sudo -S cp "${tempFile}" "${HOSTS_FILE}"`, { stdio: 'pipe' });
                    } else {
                        // Try with sudo but handle the password requirement
                        execSync(`sudo -n cp "${tempFile}" "${HOSTS_FILE}"`, { stdio: 'pipe' });
                    }
                }
                fs.unlinkSync(tempFile);
                return { success: true, method: adminPassword ? 'sudo_password' : 'sudo' };
            } catch (sudoError) {
                // If password was provided but failed, return specific error
                if (adminPassword) {
                    return {
                        success: false,
                        passwordError: true,
                        error: 'Invalid password or insufficient privileges'
                    };
                }
                
                // Sudo failed, return instructions for manual setup
                const instructions = generateManualInstructions(content, tempFile);
                return {
                    success: false,
                    requiresManual: true,
                    tempFile: tempFile,
                    instructions: instructions,
                    error: 'Administrator privileges required'
                };
            }
        }
    } catch (error) {
        throw new Error(`Cannot write hosts file: ${error.message}`);
    }
}

// Helper function to generate manual setup instructions
function generateManualInstructions(content, tempFile) {
    const platform = process.platform;
    
    if (platform === 'win32') {
        return {
            title: 'Administrator Access Required',
            steps: [
                'Open Command Prompt as Administrator',
                `Copy the generated hosts file: copy "${tempFile}" "${HOSTS_FILE}"`,
                'Or manually edit hosts file and add the domain entries'
            ],
            note: 'You need administrator privileges to modify the hosts file on Windows.'
        };
    } else {
        return {
            title: 'Sudo Access Required',
            steps: [
                'Open Terminal',
                `Run: sudo cp "${tempFile}" "${HOSTS_FILE}"`,
                'Enter your password when prompted',
                'Or manually edit /etc/hosts file and add the domain entries'
            ],
            note: 'You need sudo privileges to modify the hosts file on macOS/Linux.',
            command: `sudo cp "${tempFile}" "${HOSTS_FILE}"`
        };
    }
}

// Helper function to parse hosts file entries
function parseHostsFile(content) {
    const lines = content.split('\n');
    const domains = [];
    let inManagedSection = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line === LARAVEL_GODMODE_MARKER) {
            inManagedSection = true;
            continue;
        }

        if (inManagedSection && line.startsWith('#') && line !== LARAVEL_GODMODE_MARKER) {
            inManagedSection = false;
            continue;
        }

        if (inManagedSection && line && !line.startsWith('#')) {
            const parts = line.split(/\s+/);
            if (parts.length >= 2) {
                domains.push({
                    ip: parts[0],
                    domain: parts[1],
                    comment: parts.slice(2).join(' ') || '',
                    managed: true
                });
            }
        }
    }

    return domains;
}

// Helper function to validate domain name
function validateDomain(domain) {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(domain) && domain.length <= 253;
}

// Helper function to check if domain is already in use
function isDomainInUse(domain, excludeManaged = false) {
    try {
        const content = readHostsFile();
        const lines = content.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const parts = trimmed.split(/\s+/);
                if (parts.length >= 2 && parts[1] === domain) {
                    if (excludeManaged) {
                        // Check if this is in our managed section
                        const managedDomains = parseHostsFile(content);
                        const isManaged = managedDomains.some(d => d.domain === domain);
                        if (!isManaged) return true;
                    } else {
                        return true;
                    }
                }
            }
        }
        return false;
    } catch (error) {
        return false;
    }
}

// Helper function to get project domains from data file
function getProjectDomains() {
    try {
        const projectsFile = path.join(__dirname, '../../../data/projects.json');
        const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));

        const domains = [];
        projects.forEach(project => {
            if (project.customDomain) {
                domains.push({
                    projectId: project.id,
                    projectName: project.name,
                    domain: project.customDomain,
                    port: project.ports?.app || 8000,
                    active: project.status === 'running'
                });
            }
        });

        return domains;
    } catch (error) {
        return [];
    }
}

// Helper function to flush DNS cache
function flushDNSCache() {
    try {
        switch (process.platform) {
            case 'darwin': // macOS
                execSync('sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder', { stdio: 'pipe' });
                break;
            case 'win32': // Windows
                execSync('ipconfig /flushdns', { stdio: 'pipe' });
                break;
            case 'linux': // Linux
                execSync('sudo systemctl restart systemd-resolved', { stdio: 'pipe' });
                break;
        }
        return true;
    } catch (error) {
        console.warn('Failed to flush DNS cache:', error.message);
        return false;
    }
}

// Get all managed domains
router.get('/', (req, res) => {
    try {
        const content = readHostsFile();
        const managedDomains = parseHostsFile(content);
        const projectDomains = getProjectDomains();

        // Combine managed domains with project information
        const domains = managedDomains.map(domain => {
            const projectInfo = projectDomains.find(p => p.domain === domain.domain);
            return {
                ...domain,
                projectId: projectInfo?.projectId,
                projectName: projectInfo?.projectName,
                port: projectInfo?.port,
                active: projectInfo?.active || false,
                url: `http://${domain.domain}${projectInfo?.port && projectInfo.port !== 80 ? `:${projectInfo.port}` : ''}`
            };
        });

        res.json({
            success: true,
            data: {
                domains,
                hostsFile: HOSTS_FILE,
                managedCount: domains.length,
                canWrite: process.getuid ? process.getuid() === 0 : true // Simplified check
            }
        });
    } catch (error) {
        console.error('Domain list error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to read domains',
            details: error.message
        });
    }
});

// Add new domain
// Add domain endpoint
router.post('/', async (req, res) => {
    try {
        const { domain, ip = '127.0.0.1', comment = '', projectId, adminPassword } = req.body;

        if (!domain) {
            return res.status(400).json({
                success: false,
                error: 'Domain is required'
            });
        }

        if (!validateDomain(domain)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid domain format'
            });
        }

        if (isDomainInUse(domain, true)) {
            return res.status(400).json({
                success: false,
                error: 'Domain is already in use'
            });
        }

        // Read current hosts file
        let content = readHostsFile();

        // Find or create managed section
        let managedSectionExists = content.includes(LARAVEL_GODMODE_MARKER);

        if (!managedSectionExists) {
            // Add managed section at the end
            content += `\n\n${LARAVEL_GODMODE_MARKER}\n`;
        }

        // Add the new domain entry
        const newEntry = `${ip}\t${domain}${comment ? `\t# ${comment}` : ''}`;

        if (managedSectionExists) {
            // Find the end of managed section and insert before it
            const lines = content.split('\n');
            const markerIndex = lines.findIndex(line => line.trim() === LARAVEL_GODMODE_MARKER);
            let insertIndex = lines.length;

            // Find the end of managed section
            for (let i = markerIndex + 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('#') && line !== LARAVEL_GODMODE_MARKER) {
                    insertIndex = i;
                    break;
                }
                if (line === '') {
                    // Empty line might indicate end of section
                    const nextNonEmpty = lines.slice(i + 1).find(l => l.trim() !== '');
                    if (nextNonEmpty && nextNonEmpty.startsWith('#')) {
                        insertIndex = i;
                        break;
                    }
                }
            }

            lines.splice(insertIndex, 0, newEntry);
            content = lines.join('\n');
        } else {
            content += `${newEntry}\n`;
        }

        // Try to write hosts file with password if provided
        const writeResult = await writeHostsFile(content, adminPassword);

        if (!writeResult.success && writeResult.passwordError) {
            // Password was wrong
            return res.status(401).json({
                success: false,
                error: 'Invalid administrator password',
                passwordError: true,
                message: 'The provided password is incorrect or insufficient privileges'
            });
        } else if (!writeResult.success && writeResult.requiresManual) {
            // Return manual instructions
            return res.status(403).json({
                success: false,
                error: 'Administrator privileges required',
                requiresManual: true,
                instructions: writeResult.instructions,
                tempFile: writeResult.tempFile,
                domainEntry: newEntry,
                message: 'Please follow the manual instructions to complete domain setup'
            });
        } else if (!writeResult.success) {
            throw new Error(writeResult.error || 'Failed to write hosts file');
        }

        // Update project data if projectId is provided
        if (projectId) {
            const projectsFile = path.join(__dirname, '../../../data/projects.json');
            const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));
            const projectIndex = projects.findIndex(p => p.id === projectId);

            if (projectIndex !== -1) {
                projects[projectIndex].customDomain = domain;
                fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));
            }
        }

        // Flush DNS cache
        flushDNSCache();

        const successMessage = writeResult.method === 'direct' ? 
            'Domain added successfully' : 
            writeResult.method === 'sudo_password' ?
            'Domain added successfully using your administrator password' :
            'Domain added successfully using elevated privileges';

        res.json({
            success: true,
            data: {
                domain,
                ip,
                comment,
                projectId,
                method: writeResult.method,
                message: successMessage
            }
        });

    } catch (error) {
        console.error('Add domain error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to add domain',
            details: error.message
        });
    }
});

// Remove domain
router.delete('/:domain', (req, res) => {
    try {
        const { domain } = req.params;

        if (!domain) {
            return res.status(400).json({
                success: false,
                error: 'Domain is required'
            });
        }

        // Read current hosts file
        let content = readHostsFile();
        const lines = content.split('\n');
        let inManagedSection = false;
        const newLines = [];

        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed === LARAVEL_GODMODE_MARKER) {
                inManagedSection = true;
                newLines.push(line);
                continue;
            }

            if (inManagedSection && trimmed.startsWith('#') && trimmed !== LARAVEL_GODMODE_MARKER) {
                inManagedSection = false;
                newLines.push(line);
                continue;
            }

            if (inManagedSection && trimmed && !trimmed.startsWith('#')) {
                const parts = trimmed.split(/\s+/);
                if (parts.length >= 2 && parts[1] === domain) {
                    // Skip this line (remove the domain)
                    continue;
                }
            }

            newLines.push(line);
        }

        // Write hosts file
        writeHostsFile(newLines.join('\n'));

        // Remove domain from project data
        const projectsFile = path.join(__dirname, '../../../data/projects.json');
        try {
            const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));
            projects.forEach(project => {
                if (project.customDomain === domain) {
                    delete project.customDomain;
                }
            });
            fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));
        } catch (error) {
            console.warn('Failed to update project data:', error.message);
        }

        // Flush DNS cache
        flushDNSCache();

        res.json({
            success: true,
            data: {
                domain,
                message: 'Domain removed successfully'
            }
        });

    } catch (error) {
        console.error('Remove domain error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove domain',
            details: error.message
        });
    }
});

// Test domain accessibility
router.post('/test/:domain', (req, res) => {
    try {
        const { domain } = req.params;
        const { port = 80 } = req.body;

        if (!domain) {
            return res.status(400).json({
                success: false,
                error: 'Domain is required'
            });
        }

        // Test DNS resolution
        const { execSync } = require('child_process');
        let dnsResolved = false;
        let resolvedIP = null;

        try {
            const output = execSync(`nslookup ${domain}`, { encoding: 'utf8', timeout: 5000 });
            dnsResolved = output.includes('127.0.0.1') || output.includes('localhost');

            // Extract IP from nslookup output
            const ipMatch = output.match(/Address: (\d+\.\d+\.\d+\.\d+)/);
            if (ipMatch) {
                resolvedIP = ipMatch[1];
            }
        } catch (error) {
            dnsResolved = false;
        }

        // Test HTTP connectivity
        let httpAccessible = false;
        let httpStatus = null;

        try {
            const testUrl = `http://${domain}${port !== 80 ? `:${port}` : ''}`;
            const output = execSync(`curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "${testUrl}"`, {
                encoding: 'utf8',
                timeout: 10000
            });
            httpStatus = parseInt(output.trim());
            httpAccessible = httpStatus >= 200 && httpStatus < 400;
        } catch (error) {
            httpAccessible = false;
        }

        res.json({
            success: true,
            data: {
                domain,
                port,
                dnsResolved,
                resolvedIP,
                httpAccessible,
                httpStatus,
                testUrl: `http://${domain}${port !== 80 ? `:${port}` : ''}`,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Domain test error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to test domain',
            details: error.message
        });
    }
});

// Get domain suggestions
router.get('/suggestions', (req, res) => {
    try {
        const { projectName } = req.query;

        const suggestions = [];

        if (projectName) {
            const cleanName = projectName.toLowerCase().replace(/[^a-z0-9]/g, '');
            suggestions.push(
                `${cleanName}.test`,
                `${cleanName}.local`,
                `${cleanName}.dev`,
                `app.${cleanName}.test`,
                `api.${cleanName}.test`,
                `admin.${cleanName}.test`
            );
        }

        // Add generic suggestions
        suggestions.push(
            'myapp.test',
            'laravel.test',
            'app.test',
            'local.test',
            'dev.test'
        );

        // Remove duplicates and filter existing domains
        const content = readHostsFile();
        const existingDomains = parseHostsFile(content).map(d => d.domain);

        const uniqueSuggestions = [...new Set(suggestions)]
            .filter(domain => !existingDomains.includes(domain))
            .slice(0, 10);

        res.json({
            success: true,
            data: {
                suggestions: uniqueSuggestions,
                projectName
            }
        });

    } catch (error) {
        console.error('Domain suggestions error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get domain suggestions',
            details: error.message
        });
    }
});

// Get hosts file info
router.get('/info', (req, res) => {
    try {
        const content = readHostsFile();
        const lines = content.split('\n');
        const managedDomains = parseHostsFile(content);

        const info = {
            hostsFile: HOSTS_FILE,
            totalLines: lines.length,
            managedDomains: managedDomains.length,
            canWrite: fs.constants && fs.access ? false : true, // Will need sudo
            platform: process.platform,
            requiresSudo: process.platform !== 'win32',
            backupRecommended: true
        };

        res.json({
            success: true,
            data: info
        });

    } catch (error) {
        console.error('Hosts info error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get hosts file info',
            details: error.message
        });
    }
});

module.exports = router;
