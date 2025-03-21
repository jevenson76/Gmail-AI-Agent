/**
 * Gmail AI Agent Setup Script
 * 
 * This script guides users through the initial setup process for the Gmail AI Agent.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');
const { exec } = require('child_process');

// Create interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ASCII art logo
const logo = `
  ______                 _ _    ___    _____   ___                       _   
 / _____)               (_) |  / _ \\  |  __ \\ / _ \\                     | |  
| /  ___  ____ ___  ____ _| | | |_| |_| |__) | |_| |____ ____  ____   __| |_ 
| | (___)/ _  |  \\/  _ | | | |_   _|_   ___ |  __/  _  |  _ \\/ _  | / _  __)
| \\____/( ( | | | | | | | | |  | |   | |   | | | | | | | | | ( ( | |( (_| |  
 \\_____/ \\_||_|_| |_| |_|_|_|  |_|   |_|   |_|_| |_| |_|_| |_|\\_||_| \\____|
                                                                            
`;

console.log(logo);
console.log('Welcome to Gmail AI Agent Setup\n');

// Configuration object
const config = {
  googleCredentials: {
    clientId: '',
    clientSecret: ''
  },
  databaseConfig: {
    provider: 'sqlite',
    url: 'file:./data.db'
  },
  localLLM: {
    enabled: false,
    model: 'llama3',
    url: 'http://localhost:11434'
  },
  emailProcessing: {
    autoArchive: false,
    refreshInterval: 300 // 5 minutes
  }
};

// Check if .env already exists
const envExists = fs.existsSync(path.join(process.cwd(), '.env'));

// Generate a random string for AUTH_SECRET
const generateSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Check if Ollama is installed
const checkOllama = () => {
  return new Promise((resolve) => {
    exec('ollama --version', (error) => {
      resolve(!error);
    });
  });
};

// Main setup flow
async function setup() {
  console.log('This setup will guide you through configuring your Gmail AI Agent.\n');
  
  if (envExists) {
    const answer = await askQuestion('An existing configuration was found. Overwrite? (y/n): ');
    if (answer.toLowerCase() !== 'y') {
      console.log('Setup canceled. Existing configuration preserved.');
      rl.close();
      return;
    }
  }
  
  console.log('\n=== Google OAuth Configuration ===');
  console.log('You need to create OAuth credentials in the Google Cloud Console:');
  console.log('1. Go to https://console.cloud.google.com/');
  console.log('2. Create a new project (or select an existing one)');
  console.log('3. Go to "APIs & Services" > "Credentials"');
  console.log('4. Click "Create Credentials" > "OAuth client ID"');
  console.log('5. Configure the consent screen if prompted');
  console.log('6. Select "Web application" as the application type');
  console.log('7. Add "http://localhost:3000" to Authorized JavaScript origins');
  console.log('8. Add "http://localhost:3000/api/auth/callback/google" to Authorized redirect URIs');
  console.log('9. Click "Create" and copy the Client ID and Client Secret\n');
  
  config.googleCredentials.clientId = await askQuestion('Enter your Google Client ID: ');
  config.googleCredentials.clientSecret = await askQuestion('Enter your Google Client Secret: ');
  
  console.log('\n=== Local LLM Configuration ===');
  
  const ollamaInstalled = await checkOllama();
  
  if (ollamaInstalled) {
    console.log('Ollama detected on your system!');
    const enableLLM = await askQuestion('Would you like to enable local LLM processing? (y/n): ');
    config.localLLM.enabled = enableLLM.toLowerCase() === 'y';
    
    if (config.localLLM.enabled) {
      config.localLLM.model = await askQuestion('Enter the model to use (default: llama3): ') || 'llama3';
      
      console.log(`\nWe'll download the ${config.localLLM.model} model now...`);
      console.log('This might take a while depending on your internet connection.');
      
      const pullModel = await askQuestion('Continue with model download? (y/n): ');
      if (pullModel.toLowerCase() === 'y') {
        console.log(`Downloading ${config.localLLM.model}...`);
        await new Promise((resolve) => {
          const child = exec(`ollama pull ${config.localLLM.model}`);
          
          child.stdout.on('data', (data) => {
            console.log(data.toString().trim());
          });
          
          child.stderr.on('data', (data) => {
            console.error(data.toString().trim());
          });
          
          child.on('close', (code) => {
            if (code === 0) {
              console.log('Model downloaded successfully!');
            } else {
              console.log('Model download failed. You can try downloading it later with:');
              console.log(`ollama pull ${config.localLLM.model}`);
              config.localLLM.enabled = false;
            }
            resolve();
          });
        });
      } else {
        console.log('Skipping model download. You can download it later with:');
        console.log(`ollama pull ${config.localLLM.model}`);
      }
    }
  } else {
    console.log('Ollama not detected on your system.');
    console.log('For local LLM processing, we recommend installing Ollama:');
    console.log('- Visit https://ollama.ai/download for installation instructions');
    console.log('- After installation, run this setup again to configure local LLM options');
    config.localLLM.enabled = false;
  }
  
  console.log('\n=== Email Processing Configuration ===');
  
  const autoArchive = await askQuestion('Automatically archive emails after processing? (y/n): ');
  config.emailProcessing.autoArchive = autoArchive.toLowerCase() === 'y';
  
  const interval = await askQuestion('Email refresh interval in seconds (default: 300): ');
  if (interval && !isNaN(parseInt(interval))) {
    config.emailProcessing.refreshInterval = parseInt(interval);
  }
  
  // Generate the .env file
  const envContent = `# Gmail AI Agent Configuration
# Generated on ${new Date().toLocaleString()}

# Google OAuth
GOOGLE_CLIENT_ID=${config.googleCredentials.clientId}
GOOGLE_CLIENT_SECRET=${config.googleCredentials.clientSecret}

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${generateSecret()}

# Database
DATABASE_URL=${config.databaseConfig.url}

# Local LLM
LOCAL_LLM_ENABLED=${config.localLLM.enabled}
LOCAL_LLM_MODEL=${config.localLLM.model}
LOCAL_LLM_URL=${config.localLLM.url}

# Email Processing
AUTO_ARCHIVE=${config.emailProcessing.autoArchive}
REFRESH_INTERVAL=${config.emailProcessing.refreshInterval}
`;

  fs.writeFileSync(path.join(process.cwd(), '.env'), envContent);
  
  console.log('\n=== Setup Complete ===');
  console.log('Configuration has been saved to .env file');
  console.log('\nTo start the application, run:');
  console.log('npm run dev');
  console.log('\nThen open your browser and navigate to:');
  console.log('http://localhost:3000');
  
  rl.close();
}

// Helper function to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Start the setup
setup().catch(error => {
  console.error('Error during setup:', error);
  rl.close();
});

// Handle exit
rl.on('close', () => {
  console.log('\nThank you for setting up Gmail AI Agent!');
  process.exit(0);
}); 