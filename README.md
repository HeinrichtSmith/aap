# Claude Web UI

This project is a web-based frontend that acts as a middleman to a local Cursor AI + Claude instance running in the terminal.

## Architecture Overview

1.  **Frontend (Middleman Website)**
    *   Built with React + Vite.
    *   Styled with TailwindCSS + shadcn/ui for a native Apple-style look.
    *   Features message bubbles with timestamps, syntax highlighting for code, and collapsible panels for long output.
    *   Sends messages via WebSocket or REST to the backend.

2.  **Backend (Bridge to Terminal)**
    *   Node.js server.
    *   Uses `child_process` to send commands to the terminal.
    *   Pipes stdout/stderr and responds to the frontend.
    *   Maintains Claude Code context in Cursor’s server.
    *   Ensures file-system access with `fs`.

3.  **Claude Code Inside Cursor**
    *   Terminal relays prompts into `cursor ai --headless` or similar.
    *   Output is piped back into the backend, then sent to the frontend.
    *   File editing works via Claude prompts (e.g., `Edit main.py to use async`).
    *   Claude can access files via `read_file(path)` and `write_file(path, content)` prompts.

## Security
*   Restrict terminal access to a sandbox folder only.
*   Log every Claude prompt for debugging and control.
*   Ensure Claude can't execute dangerous commands (use chroot or docker if needed). 