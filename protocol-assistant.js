/**
 * Gmail AI Agent Protocol Registration Assistant
 * 
 * This script helps register the app:// protocol on Windows systems
 * to enable OAuth integration with Gmail.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Check if running as administrator
let isAdmin = false;
try {
  execSync('net session', { stdio: 'ignore' });
  isAdmin = true;
} catch (e) {
  isAdmin = false;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ASCII art logo
console.log(`
  ______                 _ _    ___    _____   ___                       _   
 / _____)               (_) |  / _ \\  |  __ \\ / _ \\                     | |  
| /  ___  ____ ___  ____ _| | | |_| |_| |__) | |_| |____ ____  ____   __| |_ 
| | (___)/ _  |  \\/  _ | | | |_   _|_   ___ |  __/  _  |  _ \\/ _  | / _  __)
| \\____/( ( | | | | | | | | |  | |   | |   | | | | | | | | | ( ( | |( (_| |  
 \\_____/ \\_||_|_| |_| |_|_|_|  |_|   |_|   |_|_| |_| |_|_| |_|\\_||_| \\____|
                                                                            
`);
console.log('Gmail AI Agent - Protocol Registration Assistant');
console.log('===============================================\n');

if (!isAdmin) {
  console.log('⚠️  WARNING: This script must be run as administrator to register the protocol.');
  console.log('Please restart this script with administrator privileges.\n');
  
  console.log('Instructions:');
  console.log('1. Right-click on Command Prompt or PowerShell');
  console.log('2. Select "Run as administrator"');
  console.log('3. Navigate to this directory and run the script again');
  
  rl.question('\nPress Enter to exit...', () => {
    rl.close();
    process.exit(1);
  });
  
  return;
}

console.log('✅ Running with administrator privileges\n');

// Get the full path to the electron executable
const getAppPath = () => {
  let appPath = '';
  
  try {
    // First, check if we're in development mode
    if (fs.existsSync(path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron.exe'))) {
      appPath = path.join(__dirname, 'node_modules', 'electron', 'dist', 'electron.exe');
      console.log('Found development Electron executable');
    }
    // Then check for common installation paths
    else if (fs.existsSync(path.join(__dirname, 'release', 'Gmail AI Agent Setup.exe'))) {
      appPath = path.join(__dirname, 'release', 'Gmail AI Agent Setup.exe');
      console.log('Found installed application');
    }
    else if (fs.existsSync(path.join(__dirname, 'Gmail AI Agent.exe'))) {
      appPath = path.join(__dirname, 'Gmail AI Agent.exe');
      console.log('Found portable application');
    }
    else {
      appPath = path.join(__dirname, 'electron\\main.js');
      console.log('Using development main.js file');
    }
  } catch (err) {
    console.error('Error finding application path:', err);
    return '';
  }
  
  return appPath;
};

const registerProtocol = (appPath) => {
  try {
    console.log('Registering app:// protocol handler...');
    
    // Create registry commands
    const regCommands = [
      'REG ADD "HKCR\\app" /ve /t REG_SZ /d "URL:Gmail AI Agent Protocol" /f',
      'REG ADD "HKCR\\app" /v "URL Protocol" /t REG_SZ /d "" /f',
      'REG ADD "HKCR\\app\\shell\\open\\command" /ve /t REG_SZ /d "\\"' + appPath + '\\" \\"%1\\"" /f'
    ];
    
    // Execute each registry command
    regCommands.forEach(cmd => {
      console.log(`Executing: ${cmd}`);
      execSync(cmd);
    });
    
    console.log('\n✅ Protocol registration completed successfully!');
    console.log('\nThe app:// protocol is now registered to handle OAuth callbacks from Google.');
    
  } catch (err) {
    console.error('\n❌ Error registering protocol:', err);
    console.error('\nPlease try running this script again as administrator.');
  }
};

console.log('This assistant will register the app:// protocol handler for Gmail AI Agent.');
console.log('This is required for OAuth authentication to work in the desktop application.\n');

rl.question('Would you like to continue? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    const appPath = getAppPath();
    
    if (!appPath) {
      console.error('❌ Could not find the application path.');
      rl.close();
      return;
    }
    
    rl.question(`\nRegister protocol handler for: ${appPath}\nContinue? (y/n): `, (confirmAnswer) => {
      if (confirmAnswer.toLowerCase() === 'y') {
        registerProtocol(appPath);
      } else {
        console.log('Protocol registration cancelled.');
      }
      rl.close();
    });
  } else {
    console.log('Protocol registration cancelled.');
    rl.close();
  }
}); 