# 🤖 Claude Chat Assistant for Arrowhead Polaris

A beautiful, Apple-style chat interface that integrates Claude AI directly into your Warehouse Management System. Chat with Claude to create components, edit files, search your codebase, and manage your WMS development workflow.

![Claude Chat Demo](https://img.shields.io/badge/Status-Ready-brightgreen)
![React](https://img.shields.io/badge/React-18+-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![WebSocket](https://img.shields.io/badge/WebSocket-Supported-orange)

## ✨ Features

### 🎨 Beautiful UI
- **Apple-style Design**: Glassmorphism, smooth animations, and modern aesthetics
- **Framer Motion**: Fluid animations for all interactions
- **Syntax Highlighting**: Code blocks with copy functionality
- **Responsive**: Works on desktop and tablet
- **Dark Theme**: Matches your WMS design system

### 🔧 Powerful Integration
- **Real-time Chat**: WebSocket connection with fallback to REST API
- **Session Persistence**: Maintains context across conversations
- **File Operations**: Create, edit, read, and search files
- **Cursor AI Ready**: Automatically detects and uses Claude Code CLI
- **Smart Fallback**: Intelligent simulation when CLI unavailable

### 🎮 Game-like Experience
- **Audio Feedback**: Success, error, and interaction sounds
- **Visual Feedback**: Hover effects, loading states, and animations
- **Instant Responses**: Fast, responsive interactions
- **Context Awareness**: Remembers previous conversations

## 🚀 Quick Start

### 1. One-Command Setup
```bash
./start-chat-system.sh
```

This script will:
- ✅ Check prerequisites (Node.js 18+)
- ✅ Install all dependencies
- ✅ Start both frontend and backend servers
- ✅ Monitor and restart if needed

### 2. Manual Setup

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
npm install react-syntax-highlighter
npm run dev
```

### 3. Access Your WMS
- Open http://localhost:5173
- Look for the chat button in the bottom-right corner
- Start chatting with Claude! 🎉

## 💬 How to Use

### Starting a Conversation
1. Click the floating chat button (💬) in the bottom-right
2. Type your message in the input field
3. Press Enter or click Send
4. Watch Claude respond in real-time!

### Example Commands

**Create Components:**
```
Create a new component called UserProfile
```

**Edit Files:**
```
Edit Layout.jsx to add a new menu item for settings
```

**Search Code:**
```
Find all files that use the useWarehouse hook
```

**File Operations:**
```
Show me the contents of App.jsx
List all files in the components directory
```

**General Help:**
```
How do I add a new page to the WMS?
What's the best way to add animations?
```

## 🏗️ Architecture

```
┌─────────────────────┐    WebSocket/REST    ┌─────────────────────┐
│                     │◄────────────────────►│                     │
│   Frontend (React)  │                      │  Backend (Node.js)  │
│                     │                      │                     │
│ ┌─────────────────┐ │                      │ ┌─────────────────┐ │
│ │   ChatWidget    │ │                      │ │  Claude Bridge  │ │
│ │                 │ │                      │ │                 │ │
│ │ • Apple UI      │ │                      │ │ • Cursor AI     │ │
│ │ • Animations    │ │                      │ │ • File Ops      │ │
│ │ • Syntax Highlight│ │                      │ │ • Sessions     │ │
│ └─────────────────┘ │                      │ └─────────────────┘ │
└─────────────────────┘                      └─────────────────────┘
                                                        │
                                                        ▼
                                              ┌─────────────────────┐
                                              │                     │
                                              │   Cursor AI CLI     │
                                              │   (Claude Code)     │
                                              │                     │
                                              └─────────────────────┘
```

## 🎯 Supported Operations

### File Management
- ✅ Create new React components
- ✅ Edit existing files
- ✅ Read file contents
- ✅ List directory contents
- ✅ Search codebase

### Code Generation
- ✅ React components with hooks
- ✅ Tailwind CSS styling
- ✅ Framer Motion animations
- ✅ TypeScript support
- ✅ WMS-specific patterns

### Development Workflow
- ✅ Add new features
- ✅ Debug issues
- ✅ Refactor code
- ✅ Code reviews
- ✅ Documentation

## 🔧 Configuration

### Backend Configuration
Edit `backend/server.js` to customize:
- Port numbers
- CORS settings
- Session management
- File operation scope

### Frontend Configuration
Edit `src/components/chat/ChatWidget.jsx` to customize:
- UI appearance
- Animation settings
- Connection parameters
- Audio feedback

### Cursor AI Integration
The system automatically detects these commands:
- `cursor claude`
- `cursor ai`
- `cursor prompt`
- `code --claude`
- `claude-code`

## 🔒 Security

- **Scoped Operations**: All file operations limited to project directory
- **Session Isolation**: Each chat session is isolated
- **Input Validation**: All inputs validated and sanitized
- **No Arbitrary Execution**: No shell command execution
- **CORS Protection**: Configured for development safety

## 🎨 Customization

### Styling
The chat widget uses your existing WMS design system:
- Dark theme with glassmorphism
- Consistent with existing components
- Tailwind CSS classes
- Framer Motion animations

### Audio
Integrates with your existing audio system:
- Success sounds for completed operations
- Error sounds for failures
- Click sounds for interactions
- Configurable volume and effects

### Animations
All animations use Framer Motion:
- Smooth entrance/exit transitions
- Hover and click effects
- Loading states
- Message bubble animations

## 🐛 Troubleshooting

### Common Issues

**Chat button not appearing:**
- Check console for errors
- Verify ChatWidget is imported in Layout.jsx
- Ensure all dependencies are installed

**Connection failed:**
- Verify backend is running on port 3001
- Check firewall settings
- Try refreshing the page

**File operations not working:**
- Check file permissions
- Verify project directory structure
- Look at backend logs

**Cursor AI not detected:**
- Install Cursor AI with Claude Code
- Ensure it's in your PATH
- Check authentication

### Debug Mode
Enable debug logging:
```javascript
// In ChatWidget.jsx
const DEBUG = true;
```

### Log Files
Check these files for debugging:
- `logs/backend.log` - Backend operations
- `logs/frontend.log` - Frontend issues
- Browser console - Client-side errors

## 📊 Performance

- **WebSocket**: Real-time communication
- **Session Caching**: Efficient context management
- **Lazy Loading**: Components loaded on demand
- **Optimized Rendering**: Minimal re-renders
- **Audio Preloading**: Smooth sound effects

## 🚀 Advanced Usage

### Custom Commands
Add new command types in `backend/claude-bridge.js`:
```javascript
if (lowerPrompt.includes('deploy')) {
  return { type: 'deploy', target: this.extractTarget(prompt) };
}
```

### Extended File Operations
Enhance file operations with more sophisticated parsing:
```javascript
async handleAdvancedEdit(action, prompt, sessionId) {
  // Your custom logic here
}
```

### Integration with Other Tools
The backend can be extended to integrate with:
- Git operations
- Database queries
- API calls
- Build processes

## 🤝 Contributing

To extend the chat assistant:

1. **Add new features** to the Claude bridge
2. **Enhance UI components** with new animations
3. **Improve command parsing** for better understanding
4. **Add new integrations** with development tools

## 📈 Roadmap

- [ ] Voice input support
- [ ] File diff visualization
- [ ] Git integration
- [ ] Database query support
- [ ] Multi-language support
- [ ] Plugin system

## 🎉 Success!

You now have a fully functional Claude Chat Assistant integrated into your WMS! The system provides:

- **Beautiful UI** that matches your design system
- **Real-time communication** with Claude AI
- **Actual file operations** for development tasks
- **Session persistence** for context awareness
- **Fallback systems** for reliability

Start chatting with Claude and watch your development workflow transform! 🚀

---

*Built with ❤️ for the Arrowhead Polaris WMS* 