# 🤖 Angular AI Agent - Browser-First Agentic Workflow

> **A revolutionary AI-powered development assistant that runs entirely in your browser with full access to your Angular application's runtime, file system, and build process.**

Inspired by the demo at https://www.youtube.com/watch?v=1vjnvPUN7QU

[![Angular](https://img.shields.io/badge/Angular-20.3.0-red)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 🌟 Features

### ✅ Phase 1: Component Selection & Runtime Context
- **Click-to-select components** from inspector mode
- **Automatic context chips** showing selected components in chat
- **Full runtime state access** (signals, properties, methods)
- **Beautiful gradient UI** with animations
- Component state automatically included in AI prompts

### ✅ Phase 2: File System & Command Execution
- **Read/Write ANY file** in your project
- **Execute commands** (ng build, ng test, git, npm)
- **Browse project structure** with full tree visualization
- **Secure API server** with whitelisting and CORS
- **Dev server** on port 4201 for all file operations

### ✅ Phase 3: Deep Introspection & Advanced Features
- **Component Tree** hierarchy visualization
- **Injector Tree** showing dependency injection structure
- **Reactivity Graph** analyzing signal dependencies
- **Change Detection Path** visualization
- **Automated Test Generation** for components
- **Code Refactoring** capabilities
- **Runtime component creation** with JIT compilation

---

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd Angular-Advent-Calendar

# Install dependencies
npm install --legacy-peer-deps
```

### 2. Start the Development Environment

```bash
# Start BOTH Angular dev server AND file system API server
npm run start:full
```

This starts:
- **Angular Dev Server** on `http://localhost:4200`
- **Dev API Server** on `http://localhost:4201`

Alternatively, start them separately:

```bash
# Terminal 1: Angular dev server
npm start

# Terminal 2: File system API server
npm run start:dev
```

### 3. Configure Your API Key

1. Open the app at `http://localhost:4200`
2. Click the AI assistant button (bottom right)
3. Select your AI model (Gemini 2.5 Flash recommended)
4. Enter your API key
5. Get your FREE API key at: https://aistudio.google.com/app/apikey

### 4. Start Using the AI Agent!

Try these commands:

```
"What components are on this page?"
"Show me the component tree"
"Enable inspector mode"
*Click on a component*
"What's the current state of this component?"
"Show me the routes file"
"Create a navbar component at the top"
"Run ng build"
"Generate tests for app-advent-calendar"
```

---

## 📖 User Guide

### Component Selection & Context

The AI has full access to your application's runtime state:

1. **Enable Inspector**: Click the eye icon in the chat
2. **Select Components**: Click any component on the page
3. **See Context Chips**: Selected components appear as gradient chips
4. **Ask Questions**: AI now knows about selected components' state

**Example Workflow:**
```
User: *Enables inspector and clicks advent calendar component*
AI: "✨ Added <app-advent-calendar> to context"
User: "What signals does this component have?"
AI: "This component has 5 signals: selectedDay, days, theme, isOpen, currentMonth"
```

### File System Operations

When the dev server is running, the AI can access your file system:

#### Read Files
```
"Show me the contents of src/app/app.routes.ts"
"Read the advent calendar component"
```

#### Write/Create Files
```
"Create a new component called UserProfile in src/app/components"
"Add a new route for /profile"
"Update the theme service to support more colors"
```

#### Browse Structure
```
"Show me the project structure"
"List all files in src/app/components"
"What files are in the services folder?"
```

### Command Execution

Execute build commands and see output:

```
"Run ng build"
"Execute npm test"
"Run git status"
"Check if there are uncommitted changes"
```

### Deep Introspection

Get deep insights into your Angular application:

#### Component Tree
```
"Show me the component tree"
```
Output:
```
app-root
  app-advent-calendar [3 signals]
    app-day-cell [2 signals]
  app-ai-assistant-chat [12 signals]
```

#### Injector Tree
```
"Show me the injector tree"
```
Shows dependency injection hierarchy for all components.

#### Reactivity Graph
```
"Show me the reactivity graph"
```
Visualizes all signals and their dependencies across components.

#### Change Detection Path
```
"Show me the change detection path"
```
Shows the order Angular checks components during change detection.

### Test Generation

Automatically generate tests for components:

```
"Generate tests for app-advent-calendar"
"Create test file for the theme service at src/app/services/theme.service.spec.ts"
```

### Code Refactoring

AI-assisted refactoring:

```
"Rename all instances of 'selectedDate' to 'activeDate'"
"Refactor the calendar component to use standalone APIs"
```

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Angular App)                 │
│                                                          │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────┐ │
│  │   AI Chat    │  │   Inspector    │  │ Introspection│ │
│  │   Component  │→→│   Service      │→→│   Service    │ │
│  └──────────────┘  └────────────────┘  └─────────────┘ │
│         ↓                                      ↓         │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────┐ │
│  │  Runtime     │  │  File System   │  │  Component  │ │
│  │Modification  │  │    Service     │  │  Compiler   │ │
│  └──────────────┘  └────────────────┘  └─────────────┘ │
│         ↓                   ↓                            │
└─────────│───────────────────│────────────────────────────┘
          │                   │
          │          ┌────────↓─────────┐
          │          │   Dev Server     │ (Port 4201)
          │          │ (Express API)    │
          │          └──────────────────┘
          │                   ↓
          │          ┌────────────────────┐
          │          │  File System       │
          │          │  • Read/Write      │
          │          │  • Execute Commands│
          │          └────────────────────┘
          ↓
  ┌────────────────┐
  │  Gemini AI API │
  └────────────────┘
```

### Core Services

#### 1. **GeminiAIService**
- Communicates with Google Gemini AI API
- Manages conversation history
- Enhanced with Angular build system expertise
- Handles JSON response parsing

**Location**: `src/app/services/ai-assistant/gemini-ai.service.ts`

#### 2. **ComponentInspectorService**
- Chrome DevTools-like element inspection
- Hover and click to inspect components
- Highlights components with visual overlays
- Shows component details in modal

**Location**: `src/app/services/ai-assistant/component-inspector.service.ts`

#### 3. **AngularIntrospectionService**
- Deep introspection into Angular runtime
- Component tree building
- Injector tree analysis
- Reactivity graph generation
- Change detection path calculation

**Location**: `src/app/services/ai-assistant/angular-introspection.service.ts`

**Key Methods:**
- `getComponentTree()` - Build component hierarchy
- `getInjectorTree()` - Show dependency injection structure
- `getReactivityGraph()` - Analyze signal dependencies
- `getChangeDetectionPath()` - Visualize CD order

#### 4. **RuntimeModificationService**
- Executes AI-generated actions
- Component creation with JIT compilation
- Property modification
- Style changes
- File operations delegation
- Test generation
- Code refactoring

**Location**: `src/app/services/ai-assistant/runtime-modification.service.ts`

**Action Types:**
- `CREATE_COMPONENT` - Create Angular components at runtime
- `HIGHLIGHT_COMPONENTS` - Visual component highlighting
- `INSPECT_ELEMENT` - Toggle inspector mode
- `MODIFY_PROPERTY` - Change component properties
- `CHANGE_STYLE` - Update CSS dynamically
- `READ_FILE` - Read source files
- `WRITE_FILE` - Create/modify files
- `LIST_FILES` - Browse directories
- `EXECUTE_COMMAND` - Run CLI commands
- `GET_PROJECT_STRUCTURE` - Full project tree
- `GET_COMPONENT_TREE` - Component hierarchy
- `GET_INJECTOR_TREE` - DI structure
- `GET_REACTIVITY_GRAPH` - Signal dependencies
- `GET_CHANGE_DETECTION_PATH` - CD visualization
- `GENERATE_TEST` - Auto-generate tests
- `REFACTOR_CODE` - Code refactoring

#### 5. **RuntimeComponentCompilerService**
- JIT compilation of components
- Dynamic component class creation
- Template and style compilation
- Signal support in dynamic components

**Location**: `src/app/services/ai-assistant/runtime-component-compiler.service.ts`

#### 6. **FileSystemService**
- Interface to dev server API
- File read/write operations
- Command execution
- Project structure browsing
- Health check monitoring

**Location**: `src/app/services/ai-assistant/file-system.service.ts`

**API Endpoints:**
- `GET /api/health` - Health check
- `POST /api/files/read` - Read file content
- `POST /api/files/write` - Write file content
- `POST /api/files/list` - List directory contents
- `GET /api/files/structure` - Get project structure
- `POST /api/files/stats` - Get file metadata
- `POST /api/commands/execute` - Execute command

### Dev Server (dev-server.mjs)

Express server providing file system and command execution capabilities:

**Security Features:**
- Command whitelist: `ng`, `npm`, `git`, `node` only
- File write restricted to `src/` directory
- Read-only access outside `src/` (except angular.json)
- CORS restricted to `localhost:4200`
- 5-minute timeout on commands

**Location**: `dev-server.mjs`

---

## 🔧 Configuration

### Package Scripts

```json
{
  "start": "ng serve",                    // Angular dev server only
  "start:dev": "node dev-server.mjs",     // API server only
  "start:full": "concurrently \"npm start\" \"npm run start:dev\"",  // Both servers
  "build": "ng build",
  "test": "ng test"
}
```

### Environment Variables

No environment variables required. All configuration is done through:
- API key (entered in UI)
- Model selection (Gemini 2.5 Flash, 1.5 Flash, or 1.5 Pro)

### Dev Server Configuration

Edit `dev-server.mjs` to customize:

```javascript
const PORT = 4201;  // Change port if needed

// Add more allowed commands
const allowedCommands = ['ng', 'npm', 'node', 'git', 'your-command'];

// Adjust timeouts
setTimeout(() => child.kill(), 5 * 60 * 1000); // 5 minutes default
```

---

## 📚 API Reference

### AI Action Format

All AI actions follow this JSON structure:

```json
{
  "message": "User-friendly response",
  "action": {
    "type": "ACTION_TYPE",
    "payload": { /* action-specific data */ }
  }
}
```

### Example Actions

#### CREATE_COMPONENT
```json
{
  "message": "Creating a navbar component!",
  "action": {
    "type": "CREATE_COMPONENT",
    "payload": {
      "componentCode": {
        "selector": "app-navbar",
        "name": "NavbarComponent",
        "template": "<nav>...</nav>",
        "styles": ".nav { ... }",
        "typescript": "const componentLogic = { isDark: signal(false) };"
      },
      "position": "top"
    }
  }
}
```

#### EXECUTE_COMMAND
```json
{
  "message": "Running build...",
  "action": {
    "type": "EXECUTE_COMMAND",
    "payload": {
      "command": "ng",
      "args": ["build"]
    }
  }
}
```

#### GENERATE_TEST
```json
{
  "message": "Generating test...",
  "action": {
    "type": "GENERATE_TEST",
    "payload": {
      "componentSelector": "app-advent-calendar",
      "filePath": "src/app/components/advent-calendar/advent-calendar.component.spec.ts"
    }
  }
}
```

---

## 🛠️ Development

### Building from Source

```bash
# Install dependencies
npm install --legacy-peer-deps

# Development build
npm run build

# Production build
ng build --configuration=production
```

### Project Structure

```
src/app/
├── components/
│   ├── advent-calendar/          # Main advent calendar
│   ├── ai-assistant/              # AI chat components
│   │   ├── ai-assistant-chat/    # Main chat UI
│   │   └── ai-assistant-button/  # Floating button
│   └── day-cell/                  # Calendar day cells
├── services/
│   └── ai-assistant/              # AI services
│       ├── gemini-ai.service.ts          # AI API communication
│       ├── component-inspector.service.ts # Element inspection
│       ├── angular-introspection.service.ts # Deep introspection
│       ├── runtime-modification.service.ts # Action execution
│       ├── runtime-component-compiler.service.ts # JIT compilation
│       ├── file-system.service.ts        # File operations
│       ├── context-provider.service.ts   # App context
│       └── models.ts                     # TypeScript interfaces
├── app.config.ts                  # JIT compiler config
└── app.routes.ts                  # Application routes

dev-server.mjs                     # Express API server
```

### Adding New AI Capabilities

1. **Add Action Type** to `RuntimeModificationService`:

```typescript
case 'YOUR_ACTION':
  return await this.yourAction(action.payload);
```

2. **Implement Handler**:

```typescript
private async yourAction(payload: any): Promise<{ success: boolean; message: string }> {
  // Your implementation
  return { success: true, message: "Done!" };
}
```

3. **Add to Valid Types**:

```typescript
const validTypes = [
  // ... existing types
  'YOUR_ACTION'
];
```

4. **Update AI Prompt** in `GeminiAIService` to document the new capability.

---

## 🔐 Security Considerations

### Command Whitelist
Only these commands are allowed:
- `ng` - Angular CLI
- `npm` - Package manager
- `git` - Version control
- `node` - Node.js runtime

### File System Restrictions
- **Write access**: Limited to `src/` directory
- **Read access**: Project files only
- **No access**: node_modules, system files

### CORS Policy
- Only `http://localhost:4200` can access the API
- Prevents cross-origin attacks

### Timeout Protection
- Commands timeout after 5 minutes
- Prevents hanging processes

### API Key Security
- Stored in browser localStorage only
- Never sent to dev server
- Only used for Gemini API calls

---

## 🐛 Troubleshooting

### Dev Server Not Available

**Error**: "Dev server not available"

**Solution**:
```bash
# Ensure dev server is running
npm run start:dev

# Or start both servers
npm run start:full
```

### File Operations Failing

**Error**: "Access denied" or "Failed to read file"

**Solution**:
- Ensure file path is correct (relative to project root)
- Check file exists
- Verify dev server is running
- Check you're not trying to access restricted directories

### Component Creation Errors

**Error**: "JIT compiler unavailable"

**Solution**:
- Already fixed in this implementation
- JIT compiler is included via `import '@angular/compiler'`

### Build Warnings

**Warning**: "bundle initial exceeded maximum budget"

**Solution**:
- This is expected due to JIT compiler inclusion (~962KB)
- Not a problem for development
- For production, consider splitting or lazy loading

### Inspector Not Working

**Problem**: Clicking components doesn't add them to context

**Solution**:
- Enable inspector mode first (eye icon)
- Ensure you're clicking on Angular components (elements with `-` in tag name)
- Check browser console for errors

---

## 📝 Examples & Use Cases

### Use Case 1: Creating a New Feature

```
User: "Create a user profile component with a form"
AI: [Creates component with signals, form, validation]

User: "Add it to the routes"
AI: [Reads app.routes.ts, adds new route, writes file]

User: "Run the build to verify"
AI: [Executes ng build, shows output]

User: "Generate tests for it"
AI: [Creates spec file with tests for all signals and inputs]
```

### Use Case 2: Debugging Component State

```
User: *Enables inspector, clicks advent-calendar component*
AI: "✨ Added <app-advent-calendar> to context"

User: "What's the current state?"
AI: "The component has these signals:
- selectedDay: 15
- days: [array of 24 days]
- theme: 'dark'
- isOpen: true"

User: "Show me the reactivity graph"
AI: [Shows all signals and their dependencies]
```

### Use Case 3: Refactoring

```
User: "Show me the component tree"
AI: [Displays full component hierarchy]

User: "I want to rename 'selectedDay' to 'activeDay' everywhere"
AI: [Analyzes files, applies refactoring, writes changes]

User: "Run tests to make sure nothing broke"
AI: [Executes ng test, shows results]
```

### Use Case 4: Learning the Codebase

```
User: "What are all the routes in this app?"
AI: [Reads app.routes.ts, lists all routes]

User: "Show me the injector tree"
AI: [Shows all services and their dependencies]

User: "What components use the ThemeService?"
AI: [Analyzes imports, shows usage]
```

---

## 🎯 Roadmap

### ✅ Completed
- Component selection and context
- File system operations
- Command execution
- Component tree visualization
- Injector tree analysis
- Reactivity graph
- Test generation
- Code refactoring
- JIT compilation at runtime

### 🚧 In Progress
- Enhanced test generation with edge cases
- Visual component tree UI
- Interactive reactivity graph
- Code coverage analysis

### 📋 Planned
- WebContainer integration (run entirely in browser, no dev server)
- VSCode extension
- Component drag-and-drop builder
- Performance profiling
- Bundle analysis
- Automated migration tools
- Multi-file refactoring
- Git integration UI

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines
- Follow Angular style guide
- Write tests for new features
- Update documentation
- Keep bundle size reasonable

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Inspired by https://www.youtube.com/watch?v=1vjnvPUN7QU
- Built with Angular 20.3.0
- Powered by Google Gemini AI
- Uses JIT compilation for runtime component creation

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/angular-advent-calendar/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/angular-advent-calendar/discussions)
- **Documentation**: This README and inline code comments

---

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

**Made with ❤️ by the Angular community**
