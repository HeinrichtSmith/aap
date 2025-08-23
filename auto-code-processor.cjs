// Automated Code Processor for Cursor Bridge
// This processes code requests automatically using pattern matching and file analysis

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class AutoCodeProcessor {
  constructor() {
    this.instructionsFile = path.join(__dirname, 'cursor-instructions.md');
    this.responseFile = path.join(__dirname, 'cursor-response.md');
    this.lastRequestId = null;
    this.isProcessing = false;
    
    // File patterns for common components
    this.filePatterns = {
      header: ['App.jsx', 'Navigation.jsx', 'Header.jsx'],
      dashboard: ['Dashboard.jsx', 'pages/Dashboard.jsx'],
      button: ['components/', 'Button.jsx'],
      color: ['tailwind.config.js', 'index.css', 'app.css'],
      logo: ['App.jsx', 'Header.jsx', 'Navigation.jsx']
    };
    
    // Common transformations
    this.transformations = {
      'bigger|larger|increase': this.makeBigger.bind(this),
      'smaller|reduce|decrease': this.makeSmaller.bind(this),
      'color|colour': this.changeColor.bind(this),
      'add|create': this.addElement.bind(this),
      'remove|delete': this.removeElement.bind(this),
      'fix|repair': this.fixIssue.bind(this),
      'move|relocate': this.moveElement.bind(this),
      'dark mode|dark theme': this.enableDarkMode.bind(this),
      'light mode|light theme': this.enableLightMode.bind(this)
    };
  }

  async start() {
    console.log('🤖 Auto Code Processor Started');
    console.log('📡 Monitoring for code requests...\n');
    
    // Check for requests every second
    setInterval(() => this.checkForRequests(), 1000);
  }

  async checkForRequests() {
    if (this.isProcessing) return;
    
    try {
      const content = await fs.readFile(this.instructionsFile, 'utf8');
      const requestInfo = this.extractRequestInfo(content);
      
      if (requestInfo && requestInfo.id !== this.lastRequestId) {
        this.lastRequestId = requestInfo.id;
        this.isProcessing = true;
        
        console.log('\n🎯 NEW REQUEST DETECTED!');
        console.log(`📋 ID: ${requestInfo.id}`);
        console.log(`💬 Request: "${requestInfo.request}"`);
        console.log('⚙️  Processing automatically...\n');
        
        await this.processRequest(requestInfo);
      }
    } catch (error) {
      // File doesn't exist yet
    }
  }

  extractRequestInfo(content) {
    const idMatch = content.match(/\*\*Request ID:\*\* (\d+)/);
    const requestMatch = content.match(/## User Request:\n([\s\S]*?)\n\n## Instructions/);
    
    if (idMatch && requestMatch) {
      return {
        id: idMatch[1],
        request: requestMatch[1].trim()
      };
    }
    return null;
  }

  async processRequest(requestInfo) {
    try {
      // Analyze the request
      const analysis = await this.analyzeRequest(requestInfo.request);
      
      // Find relevant files
      const files = await this.findRelevantFiles(analysis);
      
      // Apply transformations
      const changes = await this.applyTransformations(analysis, files);
      
      // Create response
      await this.createResponse(requestInfo.id, analysis, changes);
      
      console.log('✅ Request processed successfully!\n');
    } catch (error) {
      console.error('❌ Error processing request:', error);
      await this.createErrorResponse(requestInfo.id, error.message);
    } finally {
      this.isProcessing = false;
    }
  }

  async analyzeRequest(request) {
    const analysis = {
      action: null,
      target: null,
      details: {},
      keywords: []
    };
    
    const lowerRequest = request.toLowerCase();
    
    // Determine action
    for (const [pattern, handler] of Object.entries(this.transformations)) {
      if (new RegExp(pattern).test(lowerRequest)) {
        analysis.action = handler;
        break;
      }
    }
    
    // Extract target elements
    if (lowerRequest.includes('logo')) analysis.target = 'logo';
    else if (lowerRequest.includes('header')) analysis.target = 'header';
    else if (lowerRequest.includes('button')) analysis.target = 'button';
    else if (lowerRequest.includes('dashboard')) analysis.target = 'dashboard';
    else if (lowerRequest.includes('navigation')) analysis.target = 'navigation';
    
    // Extract additional details
    if (lowerRequest.includes('blue')) analysis.details.color = 'blue';
    else if (lowerRequest.includes('red')) analysis.details.color = 'red';
    else if (lowerRequest.includes('green')) analysis.details.color = 'green';
    
    analysis.keywords = request.split(' ').filter(word => word.length > 3);
    
    return analysis;
  }

  async findRelevantFiles(analysis) {
    const files = [];
    const searchPaths = this.filePatterns[analysis.target] || ['src/'];
    
    for (const searchPath of searchPaths) {
      try {
        const fullPath = path.join(__dirname, 'src', searchPath);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          const dirFiles = await this.searchDirectory(fullPath, analysis.keywords);
          files.push(...dirFiles);
        } else if (stat.isFile()) {
          files.push(fullPath);
        }
      } catch (error) {
        // Path doesn't exist
      }
    }
    
    return files.slice(0, 5); // Limit to 5 most relevant files
  }

  async searchDirectory(dir, keywords) {
    const files = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.jsx')) {
          const filePath = path.join(dir, entry.name);
          const content = await fs.readFile(filePath, 'utf8');
          
          // Check if file contains relevant keywords
          const relevance = keywords.filter(keyword => 
            content.toLowerCase().includes(keyword.toLowerCase())
          ).length;
          
          if (relevance > 0) {
            files.push({ path: filePath, relevance });
          }
        }
      }
    } catch (error) {
      // Directory read error
    }
    
    return files
      .sort((a, b) => b.relevance - a.relevance)
      .map(f => f.path);
  }

  async applyTransformations(analysis, files) {
    const changes = [];
    
    if (!analysis.action) {
      throw new Error('Could not determine action from request');
    }
    
    for (const file of files) {
      try {
        const change = await analysis.action(file, analysis);
        if (change) {
          changes.push(change);
        }
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    }
    
    return changes;
  }

  // Transformation functions
  async makeBigger(filePath, analysis) {
    const content = await fs.readFile(filePath, 'utf8');
    let modified = content;
    let changesMade = [];
    
    // Size class transformations
    const sizeMap = {
      'w-8': 'w-12', 'h-8': 'h-12',
      'w-10': 'w-16', 'h-10': 'h-16',
      'w-12': 'w-20', 'h-12': 'h-20',
      'text-sm': 'text-base',
      'text-base': 'text-lg',
      'text-lg': 'text-xl',
      'text-xl': 'text-2xl',
      'text-2xl': 'text-3xl',
      'size={16}': 'size={24}',
      'size={20}': 'size={28}',
      'size={24}': 'size={32}',
      'size={28}': 'size={36}'
    };
    
    for (const [from, to] of Object.entries(sizeMap)) {
      if (modified.includes(from)) {
        modified = modified.replace(new RegExp(from, 'g'), to);
        changesMade.push(`${from} → ${to}`);
      }
    }
    
    if (changesMade.length > 0) {
      await fs.writeFile(filePath, modified);
      return {
        file: path.basename(filePath),
        changes: changesMade
      };
    }
    
    return null;
  }

  async makeSmaller(filePath, analysis) {
    const content = await fs.readFile(filePath, 'utf8');
    let modified = content;
    let changesMade = [];
    
    // Reverse size transformations
    const sizeMap = {
      'w-20': 'w-16', 'h-20': 'h-16',
      'w-16': 'w-12', 'h-16': 'h-12',
      'w-12': 'w-10', 'h-12': 'h-10',
      'text-3xl': 'text-2xl',
      'text-2xl': 'text-xl',
      'text-xl': 'text-lg',
      'text-lg': 'text-base',
      'text-base': 'text-sm',
      'size={36}': 'size={28}',
      'size={32}': 'size={24}',
      'size={28}': 'size={20}',
      'size={24}': 'size={16}'
    };
    
    for (const [from, to] of Object.entries(sizeMap)) {
      if (modified.includes(from)) {
        modified = modified.replace(new RegExp(from, 'g'), to);
        changesMade.push(`${from} → ${to}`);
      }
    }
    
    if (changesMade.length > 0) {
      await fs.writeFile(filePath, modified);
      return {
        file: path.basename(filePath),
        changes: changesMade
      };
    }
    
    return null;
  }

  async changeColor(filePath, analysis) {
    const content = await fs.readFile(filePath, 'utf8');
    let modified = content;
    let changesMade = [];
    
    const targetColor = analysis.details.color || 'blue';
    
    // Color transformations
    const colorMap = {
      'blue-500': `${targetColor}-500`,
      'blue-600': `${targetColor}-600`,
      'cyan-500': `${targetColor}-400`,
      'primary': targetColor
    };
    
    for (const [from, to] of Object.entries(colorMap)) {
      const regex = new RegExp(from, 'g');
      if (regex.test(modified)) {
        modified = modified.replace(regex, to);
        changesMade.push(`${from} → ${to}`);
      }
    }
    
    if (changesMade.length > 0) {
      await fs.writeFile(filePath, modified);
      return {
        file: path.basename(filePath),
        changes: changesMade
      };
    }
    
    return null;
  }

  async addElement(filePath, analysis) {
    // This would add new elements - simplified for demo
    return {
      file: path.basename(filePath),
      changes: ['Added new element (simplified demo)']
    };
  }

  async removeElement(filePath, analysis) {
    // This would remove elements - simplified for demo
    return {
      file: path.basename(filePath),
      changes: ['Removed element (simplified demo)']
    };
  }

  async fixIssue(filePath, analysis) {
    // This would fix issues - simplified for demo
    return {
      file: path.basename(filePath),
      changes: ['Fixed issue (simplified demo)']
    };
  }

  async moveElement(filePath, analysis) {
    // This would move elements - simplified for demo
    return {
      file: path.basename(filePath),
      changes: ['Moved element (simplified demo)']
    };
  }

  async enableDarkMode(filePath, analysis) {
    // This would enable dark mode - simplified for demo
    return {
      file: path.basename(filePath),
      changes: ['Enabled dark mode (simplified demo)']
    };
  }

  async enableLightMode(filePath, analysis) {
    // This would enable light mode - simplified for demo
    return {
      file: path.basename(filePath),
      changes: ['Enabled light mode (simplified demo)']
    };
  }

  async createResponse(requestId, analysis, changes) {
    const summary = changes.length > 0 
      ? `Successfully processed request with ${changes.length} file(s) modified`
      : 'No changes were needed';
    
    const changesList = changes.flatMap(change => 
      [`${change.file}:`, ...change.changes.map(c => `  - ${c}`)]
    );
    
    const response = `# Response to Request ${requestId}

## Summary:
${summary}

## Changes Made:
${changesList.join('\n')}

## Status: complete`;
    
    await fs.writeFile(this.responseFile, response);
  }

  async createErrorResponse(requestId, error) {
    const response = `# Response to Request ${requestId}

## Summary:
Failed to process request automatically

## Error:
${error}

## Status: error

Note: This request may require manual intervention.`;
    
    await fs.writeFile(this.responseFile, response);
  }
}

// Start the processor
const processor = new AutoCodeProcessor();
processor.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Auto processor stopped.');
  process.exit();
});