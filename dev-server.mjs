import express from 'express';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4201; // Different port from ng serve (4200)

app.use(express.json({ limit: '10mb' }));

// Enable CORS for Angular dev server
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Dev server is running' });
});

/**
 * Get project structure
 */
app.get('/api/files/structure', async (req, res) => {
  try {
    const structure = await getDirectoryStructure(path.join(__dirname, 'src'));
    res.json({ success: true, structure });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Read file content
 */
app.post('/api/files/read', async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ success: false, error: 'File path is required' });
    }

    // Security: Only allow reading from src/ directory
    const normalizedPath = path.normalize(filePath);
    const srcPath = path.join(__dirname, 'src');
    const fullPath = path.join(__dirname, normalizedPath);

    if (!fullPath.startsWith(srcPath) && !fullPath.startsWith(path.join(__dirname, 'angular.json'))) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const content = await fs.readFile(fullPath, 'utf-8');
    res.json({ success: true, content, path: filePath });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Write file content
 */
app.post('/api/files/write', async (req, res) => {
  try {
    const { filePath, content } = req.body;

    if (!filePath || content === undefined) {
      return res.status(400).json({ success: false, error: 'File path and content are required' });
    }

    // Security: Only allow writing to src/ directory
    const normalizedPath = path.normalize(filePath);
    const srcPath = path.join(__dirname, 'src');
    const fullPath = path.join(__dirname, normalizedPath);

    if (!fullPath.startsWith(srcPath)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Create directory if it doesn't exist
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    await fs.writeFile(fullPath, content, 'utf-8');
    res.json({ success: true, message: 'File written successfully', path: filePath });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * List files in directory
 */
app.post('/api/files/list', async (req, res) => {
  try {
    const { dirPath = 'src' } = req.body;

    // Security: Only allow listing from project root
    const normalizedPath = path.normalize(dirPath);
    const fullPath = path.join(__dirname, normalizedPath);

    if (!fullPath.startsWith(__dirname)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const files = await fs.readdir(fullPath, { withFileTypes: true });
    const fileList = files.map(file => ({
      name: file.name,
      isDirectory: file.isDirectory(),
      path: path.join(dirPath, file.name)
    }));

    res.json({ success: true, files: fileList });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Execute command
 */
app.post('/api/commands/execute', async (req, res) => {
  try {
    const { command, args = [] } = req.body;

    if (!command) {
      return res.status(400).json({ success: false, error: 'Command is required' });
    }

    // Security: Whitelist of allowed commands
    const allowedCommands = ['ng', 'npm', 'node', 'git'];
    if (!allowedCommands.includes(command)) {
      return res.status(403).json({ success: false, error: 'Command not allowed' });
    }

    // Execute command
    const child = spawn(command, args, {
      cwd: __dirname,
      shell: true
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      res.json({
        success: code === 0,
        exitCode: code,
        stdout,
        stderr,
        command: `${command} ${args.join(' ')}`
      });
    });

    child.on('error', (error) => {
      res.status(500).json({
        success: false,
        error: error.message
      });
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      child.kill();
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: 'Command timeout after 5 minutes'
        });
      }
    }, 5 * 60 * 1000);

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Create Angular component files and update parent component
 */
app.post('/api/component/create', async (req, res) => {
  try {
    const { componentName, componentPath, files, insertInto } = req.body;

    if (!componentName || !componentPath || !files) {
      return res.status(400).json({
        success: false,
        error: 'componentName, componentPath, and files are required'
      });
    }

    // Security: Ensure paths are within src/
    const srcPath = path.join(__dirname, 'src');
    const fullComponentPath = path.join(__dirname, componentPath);

    if (!fullComponentPath.startsWith(srcPath)) {
      return res.status(403).json({
        success: false,
        error: 'Component path must be within src/ directory'
      });
    }

    console.log(`\n📦 Creating component: ${componentName}`);
    console.log(`📂 Location: ${componentPath}`);

    // Create component directory
    await fs.mkdir(fullComponentPath, { recursive: true });

    const createdFiles = [];

    // Write component files
    if (files.ts) {
      const tsPath = path.join(fullComponentPath, `${componentName}.component.ts`);
      await fs.writeFile(tsPath, files.ts, 'utf-8');
      createdFiles.push(tsPath);
      console.log(`✓ Created: ${componentName}.component.ts`);
    }

    if (files.html) {
      const htmlPath = path.join(fullComponentPath, `${componentName}.component.html`);
      await fs.writeFile(htmlPath, files.html, 'utf-8');
      createdFiles.push(htmlPath);
      console.log(`✓ Created: ${componentName}.component.html`);
    }

    if (files.scss) {
      const scssPath = path.join(fullComponentPath, `${componentName}.component.scss`);
      await fs.writeFile(scssPath, files.scss, 'utf-8');
      createdFiles.push(scssPath);
      console.log(`✓ Created: ${componentName}.component.scss`);
    }

    // Update parent component if insertInto is provided
    if (insertInto) {
      const { componentFilePath, importStatement, templatePath, templateInsert } = insertInto;

      // Update component TypeScript file with import
      if (componentFilePath && importStatement) {
        const fullComponentFilePath = path.join(__dirname, componentFilePath);

        if (fullComponentFilePath.startsWith(srcPath)) {
          const componentContent = await fs.readFile(fullComponentFilePath, 'utf-8');

          // Find the last import statement
          const lines = componentContent.split('\n');
          let lastImportIndex = -1;

          for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('import ')) {
              lastImportIndex = i;
            }
          }

          // Insert new import after last import
          if (lastImportIndex >= 0) {
            lines.splice(lastImportIndex + 1, 0, importStatement);

            // Also update imports array in @Component decorator
            const updatedContent = lines.join('\n');
            const importsArrayMatch = updatedContent.match(/imports:\s*\[([\s\S]*?)\]/);

            if (importsArrayMatch) {
              const currentImports = importsArrayMatch[1].trim();
              const componentClassName = importStatement.match(/import\s+{\s*(\w+)/)?.[1];

              if (componentClassName && !currentImports.includes(componentClassName)) {
                const newImports = currentImports
                  ? `${currentImports}, ${componentClassName}`
                  : componentClassName;
                const newContent = updatedContent.replace(
                  /imports:\s*\[([\s\S]*?)\]/,
                  `imports: [${newImports}]`
                );

                await fs.writeFile(fullComponentFilePath, newContent, 'utf-8');
                console.log(`✓ Updated imports in: ${componentFilePath}`);
              }
            }
          }
        }
      }

      // Update template file
      if (templatePath && templateInsert) {
        const fullTemplatePath = path.join(__dirname, templatePath);

        if (fullTemplatePath.startsWith(srcPath)) {
          let templateContent = await fs.readFile(fullTemplatePath, 'utf-8');
          const { position, content } = templateInsert;

          if (position === 'start') {
            templateContent = content + '\n' + templateContent;
          } else if (position === 'end') {
            templateContent = templateContent + '\n' + content;
          } else if (position.before) {
            templateContent = templateContent.replace(position.before, content + '\n' + position.before);
          } else if (position.after) {
            templateContent = templateContent.replace(position.after, position.after + '\n' + content);
          }

          await fs.writeFile(fullTemplatePath, templateContent, 'utf-8');
          console.log(`✓ Updated template: ${templatePath}`);
        }
      }
    }

    console.log(`✅ Component ${componentName} created successfully!\n`);

    res.json({
      success: true,
      message: `Component ${componentName} created successfully`,
      files: createdFiles,
      componentPath
    });

  } catch (error) {
    console.error(`❌ Error creating component:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * MCP-style directory tree (recursive structure)
 */
app.post('/api/mcp/directory-tree', async (req, res) => {
  try {
    const { path: dirPath } = req.body;

    if (!dirPath) {
      return res.status(400).json({ success: false, error: 'path is required' });
    }

    const fullPath = path.join(__dirname, dirPath);
    const srcPath = path.join(__dirname, 'src');

    if (!fullPath.startsWith(srcPath) && !fullPath.startsWith(__dirname)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const tree = await buildDirectoryTree(fullPath, 3);
    res.json({ success: true, tree });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * MCP-style list directory
 */
app.post('/api/mcp/list-directory', async (req, res) => {
  try {
    const { path: dirPath } = req.body;

    if (!dirPath) {
      return res.status(400).json({ success: false, error: 'path is required' });
    }

    const fullPath = path.join(__dirname, dirPath);
    const srcPath = path.join(__dirname, 'src');

    if (!fullPath.startsWith(srcPath) && !fullPath.startsWith(__dirname)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    const items = entries.map(entry => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
      path: path.join(dirPath, entry.name)
    }));

    res.json({ success: true, entries: items });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * MCP-style read file
 */
app.post('/api/mcp/read-file', async (req, res) => {
  try {
    const { path: filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ success: false, error: 'path is required' });
    }

    const fullPath = path.join(__dirname, filePath);
    const srcPath = path.join(__dirname, 'src');

    if (!fullPath.startsWith(srcPath) && !fullPath.startsWith(__dirname)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const content = await fs.readFile(fullPath, 'utf-8');
    res.json({ success: true, content, path: filePath });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Helper to build directory tree
 */
async function buildDirectoryTree(dir, maxDepth, currentDepth = 0) {
  if (currentDepth >= maxDepth) {
    return null;
  }

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const children = [];

    for (const entry of entries) {
      // Skip node_modules, dist, .git, etc.
      if (['node_modules', 'dist', '.git', '.angular'].includes(entry.name)) {
        continue;
      }

      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(__dirname, fullPath);

      if (entry.isDirectory()) {
        const subtree = await buildDirectoryTree(fullPath, maxDepth, currentDepth + 1);
        children.push({
          type: 'directory',
          name: entry.name,
          path: relativePath,
          children: subtree
        });
      } else {
        children.push({
          type: 'file',
          name: entry.name,
          path: relativePath
        });
      }
    }

    return children;
  } catch (error) {
    console.error('Error building directory tree:', error);
    return [];
  }
}

/**
 * Get file stats
 */
app.post('/api/files/stats', async (req, res) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ success: false, error: 'File path is required' });
    }

    const fullPath = path.join(__dirname, path.normalize(filePath));
    const stats = await fs.stat(fullPath);

    res.json({
      success: true,
      stats: {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Helper function to get directory structure
 */
async function getDirectoryStructure(dir, depth = 0, maxDepth = 3) {
  if (depth > maxDepth) return null;

  const items = await fs.readdir(dir, { withFileTypes: true });
  const structure = [];

  for (const item of items) {
    const itemPath = path.join(dir, item.name);
    const relativePath = path.relative(__dirname, itemPath);

    if (item.isDirectory()) {
      // Skip node_modules, dist, .git
      if (['node_modules', 'dist', '.git', '.angular'].includes(item.name)) {
        continue;
      }

      const children = await getDirectoryStructure(itemPath, depth + 1, maxDepth);
      structure.push({
        name: item.name,
        type: 'directory',
        path: relativePath,
        children
      });
    } else {
      structure.push({
        name: item.name,
        type: 'file',
        path: relativePath
      });
    }
  }

  return structure;
}

// Start dev API server
app.listen(PORT, () => {
  console.log(`🚀 Dev API Server running on http://localhost:${PORT}`);
  console.log(`📁 Project root: ${__dirname}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /api/health - Health check`);
  console.log(`  GET  /api/files/structure - Get project structure`);
  console.log(`  POST /api/files/read - Read file content`);
  console.log(`  POST /api/files/write - Write file content`);
  console.log(`  POST /api/files/list - List directory contents`);
  console.log(`  POST /api/files/stats - Get file stats`);
  console.log(`  POST /api/commands/execute - Execute command`);
  console.log(`  POST /api/component/create - Create Angular component`);
  console.log(`\n⚡ Run 'npm start' in another terminal to start Angular dev server`);
});
