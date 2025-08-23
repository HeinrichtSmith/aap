# Claude Development Notes

## Important Reminders

### Component Identification Protocol
**ALWAYS identify the correct component before making any edits:**
1. When asked to modify navigation, headers, or UI elements, first search and examine ALL relevant files
2. Use grep/search tools to find where the actual UI elements are rendered
3. Don't assume - many apps have multiple layout/navigation components
4. Read the file structure and imports carefully
5. Verify you're editing the component that actually renders the target elements

**Example mistake to avoid:**
- User asks to modify "nav bar" 
- Don't immediately edit Layout.jsx without checking if there's a separate Navigation component
- The main navigation might be in App.jsx, Layout.jsx, or a dedicated Navigation component

### Commands to run after code changes
- Run lint: `npm run lint` (if available)
- Run typecheck: `npm run typecheck` (if available) 
- Run tests: `npm test` (if available)

### Project Structure Notes
- Main navigation bar is in `/src/App.jsx` (Navigation component, lines 485-893)
- Layout component in `/src/components/Layout.jsx` is different from main navigation
- Picking page uses the main Navigation component from App.jsx, not its own nav