<div align="center">
  <img src="https://github.com/jevenson76/GmailOrganizer/blob/main/icon.png" alt="Gmail AI Agent" width="128" height="128" />
  <h1>Gmail AI Agent</h1>
</div>

An intelligent assistant that processes your Gmail inbox using AI to categorize emails, manage labels, and help you stay productive.

## Features

- **AI-Powered Email Analysis**: Automatically categorize and analyze email content
- **Smart Labeling**: Apply intelligent labels based on email content and importance
- **Email Analytics**: Visualize your communication patterns with interactive charts
- **Local LLM Integration**: Use Ollama for privacy-focused, offline AI processing
- **Desktop Application**: Works as both a web app and native desktop application
- **OAuth Authentication**: Secure Gmail API integration with proper authentication flows

## Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- A Google account with Gmail
- [Ollama](https://github.com/ollama/ollama) (optional, for local LLM processing)
- Windows OS (for desktop version with protocol registration)

### Installation

#### Web Application

1. Clone the repository
   ```
   git clone https://github.com/yourusername/gmail-ai-agent.git
   cd gmail-ai-agent
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create `.env.local` file with your Google OAuth credentials
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   NEXTAUTH_URL=http://localhost:5173
   NEXTAUTH_SECRET=your_random_secret_string
   ```

4. Start the development server
   ```
   npm run dev
   ```

5. Access the application at `http://localhost:5173`

#### Desktop Application (Electron)

1. Install dependencies
   ```
   npm install
   ```

2. Start the Electron development environment
   ```
   npm run electron:dev
   ```

3. For production build
   ```
   npm run electron:build
   ```

### OAuth Protocol Registration for Windows

The Gmail AI Agent desktop application requires protocol registration to handle OAuth callbacks from Google.

#### Automatic Registration

1. Right-click on the `register-protocol.bat` file
2. Select "Run as administrator"
3. Follow the on-screen instructions
4. Verify successful registration by typing `app://gmail-ai-agent/test` in a browser

#### Manual Registration

If automatic registration fails:

1. Open Command Prompt as Administrator
2. Navigate to the application directory
3. Run `node protocol-assistant.js`
4. Follow the prompts to register the protocol

## Usage

### Login

1. On first launch, you'll be prompted to sign in with your Google account
2. Click the "Sign in with Google" button
3. Authorize the application to access your Gmail account
4. After successful authentication, you'll be redirected to the dashboard

### Dashboard

The dashboard provides several views:

- **Inbox**: View and process your emails
- **Analytics**: Visualize email patterns and communication trends
- **Settings**: Configure application preferences and LLM settings

### Processing Emails

1. Click "Process New Emails" on the dashboard
2. The application will:
   - Fetch unread emails from your Gmail account
   - Analyze content using AI (local or remote)
   - Apply labels based on category and importance
   - Organize your inbox accordingly

### Email Analytics

Toggle the analytics view to see:
- Email volume trends over time
- Category distribution
- Importance levels
- Communication patterns

### Settings Configuration

Configure the application in the Settings panel:

- **Local LLM**: Enable/disable Ollama integration, select model, configure URL
- **Email Processing**: Set archive options, refresh intervals, batch sizes
- **Interface Settings**: Toggle dark mode, configure UI preferences

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `P` | Process new emails |
| `A` | Toggle analytics view |
| `S` | Open settings |
| `?` | Show keyboard shortcuts |
| `Esc` | Close modal dialogs |

## Packaging for Distribution

### Windows Application

1. Build the application
   ```
   npm run build
   ```

2. Package as Electron app
   ```
   npm run electron:build
   ```

3. Find the installer in the `release` folder:
   - `release/Gmail AI Agent Setup x.x.x.exe` (Installer)
   - `release/Gmail AI Agent x.x.x.exe` (Portable)

4. Register the protocol after installation by running the included protocol registration assistant.

### Web Deployment

1. Build the application
   ```
   npm run build
   ```

2. Deploy the contents of the `dist` folder to your web server

## Troubleshooting

### OAuth Protocol Issues

- Ensure you're running the protocol registration script as Administrator
- Verify that the application path is correct in the registry
- Check for any error messages in the application console

### Local LLM Connection

- Make sure Ollama is running and accessible at the configured URL
- Verify that you have the correct model installed (`ollama pull llama3`)
- Check network connectivity between the application and Ollama service

### Gmail API Access

- Verify your OAuth credentials are correctly set up
- Ensure you've authorized all required scopes
- Check for any quota limitations in the Google Cloud Console

## Development

### Project Structure

```
gmail-ai-agent/
├── electron/           # Electron-specific code
│   ├── main.js         # Main process
│   ├── preload.js      # Preload script
│   └── oauth-handler.js # OAuth handling
├── src/
│   ├── agent/          # AI agent tools and logic
│   ├── api/            # API integrations
│   ├── components/     # React components
│   ├── lib/            # Utility functions
│   └── services/       # Business logic services
├── protocol-assistant.js # Protocol registration tool
└── register-protocol.bat # Windows registration script
```

### Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Gmail API for email access
- Ollama for local LLM integration
- Electron for desktop application support
- React and Vite for frontend development
- All contributors who have helped improve this project 