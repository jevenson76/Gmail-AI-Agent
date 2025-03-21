# Contributing to Gmail AI Agent

Thank you for your interest in contributing to Gmail AI Agent! This document provides guidelines and instructions for contributing to the project.

## Development Setup

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- Git
- A Google account with Gmail
- Ollama (optional, for local LLM testing)

### Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```
   git clone https://github.com/YOUR_USERNAME/gmail-ai-agent.git
   cd gmail-ai-agent
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Create a `.env.local` file with your development credentials:
   ```
   GOOGLE_CLIENT_ID=your_dev_client_id
   GOOGLE_CLIENT_SECRET=your_dev_client_secret
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_random_secret_string
   ```

5. Start the development server:
   ```
   npm run dev
   ```

## Electron Development

For developing the Electron desktop app:

1. Start the development server:
   ```
   npm run dev
   ```

2. In a separate terminal, start Electron:
   ```
   npm run electron:dev
   ```

3. For protocol registration testing:
   ```
   node protocol-assistant.js
   ```

## Code Structure

- `electron/` - Electron-specific code for desktop app
- `public/` - Static assets
- `src/` - Source code
  - `agent/` - AI agent components and tools
  - `api/` - API integrations with Gmail and other services
  - `components/` - React components
  - `lib/` - Utility functions and shared code
  - `pages/` - Page components and routing
  - `services/` - Core application services
  - `styles/` - CSS and styling

## Coding Standards

- Use TypeScript for type safety
- Follow the existing code style (Prettier and ESLint are configured)
- Write comments for complex logic
- Document public APIs and functions

## Testing

- Write tests for new features and bug fixes
- Run tests before submitting a PR:
  ```
  npm test
  ```

## Pull Request Process

1. Create a new branch from `main` for your changes
2. Make your changes and commit them with descriptive commit messages
3. Push your branch and submit a pull request
4. Ensure your PR description clearly describes the problem and solution
5. Address any feedback from code reviews

## Protocol Registration Development

When developing the protocol registration features:

1. Test in a development environment first
2. Keep in mind that protocol registration requires administrator privileges
3. Always provide clear user feedback for success and failure cases
4. Test the full OAuth flow with the protocol handler

## Versioning

This project follows [Semantic Versioning](https://semver.org/).

## Release Process

1. Update the version in `package.json`
2. Update the `CHANGELOG.md` with the changes
3. Create a new release on GitHub
4. Publish the new version

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code.

## Questions?

If you have questions about the development process or need help, please open an issue on GitHub. 