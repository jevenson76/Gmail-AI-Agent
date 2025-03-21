/**
 * Gmail AI Agent Demo Script
 * 
 * This file demonstrates the key features of the Gmail AI Agent.
 * Run this script to see a walkthrough of the application's capabilities.
 */

const features = [
  {
    name: "Email Analysis & Categorization",
    description: "Automatically analyzes incoming emails to categorize them by type and importance.",
    demo: async () => {
      console.log("=== Email Analysis & Categorization Demo ===");
      console.log("1. Fetching unread emails from your Gmail inbox");
      console.log("2. Analyzing content using advanced NLP techniques");
      console.log("3. Categorizing emails into predefined buckets (Meeting_Ready_Lead, Power, etc.)");
      console.log("4. Calculating importance score (1-10) based on content and context");
      console.log("5. Generating concise summaries for quick review");
      
      // Sample output
      console.log("\nExample output:");
      console.log({
        from: "john.smith@example.com",
        subject: "Meeting to discuss partnership opportunity",
        category: "Meeting_Ready_Lead",
        importance: 8,
        summary: "John wants to schedule a meeting next week to discuss a potential partnership opportunity. He's interested in our enterprise offering."
      });
    }
  },
  {
    name: "Smart Response Generation",
    description: "Creates contextually appropriate email responses as drafts or for immediate sending.",
    demo: async () => {
      console.log("=== Smart Response Generation Demo ===");
      console.log("1. Analyzing email content and context");
      console.log("2. Determining appropriate response strategy based on category and importance");
      console.log("3. Generating personalized reply using local LLM or rule-based templates");
      console.log("4. Creating Gmail draft for review or sending immediately for urgent matters");
      
      // Sample output
      console.log("\nExample output:");
      console.log({
        originalSubject: "Meeting to discuss partnership opportunity",
        generatedResponse: "Hi John,\n\nThank you for reaching out about the potential partnership. I'd be happy to meet and discuss this further.\n\nHow does Tuesday at 2pm EST work for you? If not, please suggest some times that work for your schedule.\n\nLooking forward to our conversation.\n\nBest regards,\n[Your Name]",
        savedAsDraft: true,
        actions: ["Schedule meeting", "Prepare partnership overview", "Research John's company"]
      });
    }
  },
  {
    name: "Automatic Labeling & Organization",
    description: "Creates and applies Gmail labels based on email content and importance.",
    demo: async () => {
      console.log("=== Automatic Labeling & Organization Demo ===");
      console.log("1. Generating appropriate labels based on analysis results");
      console.log("2. Creating labels in Gmail if they don't exist");
      console.log("3. Applying labels to emails for better organization");
      console.log("4. Archiving emails after processing (optional)");
      
      // Sample output
      console.log("\nExample output:");
      console.log({
        appliedLabels: [
          "Category_Meeting_Ready_Lead",
          "Priority_High",
          "Action_Schedule"
        ],
        archived: true
      });
    }
  },
  {
    name: "Local LLM Integration",
    description: "Uses Ollama to run LLMs locally, reducing costs and latency while maintaining privacy.",
    demo: async () => {
      console.log("=== Local LLM Integration Demo ===");
      console.log("1. Connecting to local Ollama instance");
      console.log("2. Using configured model (llama3, mistral, etc.) for analysis");
      console.log("3. Processing emails without sending data to external APIs");
      console.log("4. Falling back to rule-based approach if local LLM is unavailable");
      
      // Sample output
      console.log("\nExample local LLM configuration:");
      console.log({
        enabled: true,
        model: "llama3",
        serverUrl: "http://localhost:11434",
        status: "Connected"
      });
    }
  },
  {
    name: "Keyboard Shortcuts & Batch Operations",
    description: "Provides Gmail-like keyboard shortcuts and batch email operations.",
    demo: async () => {
      console.log("=== Keyboard Shortcuts & Batch Operations Demo ===");
      console.log("1. Gmail-like keyboard shortcuts (i, d, a, t for navigation)");
      console.log("2. Batch selection mode (x to toggle)");
      console.log("3. Bulk actions: archive, delete, label");
      console.log("4. Quick access to common functions");
      
      // Sample shortcuts
      console.log("\nSome available shortcuts:");
      console.log([
        { key: "i", action: "Go to Inbox" },
        { key: "d", action: "Go to Drafts" },
        { key: "a", action: "Go to Archive" },
        { key: "t", action: "Go to Trash" },
        { key: "x", action: "Toggle batch selection" },
        { key: "e", action: "Archive selected emails" },
        { key: "Shift+a", action: "Select all visible emails" },
        { key: "p", action: "Process new emails" }
      ]);
    }
  },
  {
    name: "Analytics Dashboard",
    description: "Visualizes email patterns and metrics to gain insights into your inbox.",
    demo: async () => {
      console.log("=== Analytics Dashboard Demo ===");
      console.log("1. Email volume trends over time");
      console.log("2. Category distribution visualization");
      console.log("3. Importance distribution metrics");
      console.log("4. Response time analytics");
      
      // Sample stats
      console.log("\nExample analytics:");
      console.log({
        totalProcessed: 287,
        categoryBreakdown: {
          "Meeting_Ready_Lead": 42,
          "Power": 18,
          "Interested": 95,
          "Question": 73,
          "Not_Interested": 31,
          "Other": 28
        },
        averageImportance: 5.8,
        highPriorityPercentage: 26,
        lowPriorityPercentage: 31
      });
    }
  }
];

// Run the demo
async function runDemo() {
  console.log("=======================================");
  console.log("      GMAIL AI AGENT DEMO");
  console.log("=======================================");
  console.log("\nThis demo will showcase the key features of the Gmail AI Agent.\n");
  
  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    console.log(`\n[FEATURE ${i+1}/${features.length}]: ${feature.name}`);
    console.log(`Description: ${feature.description}`);
    console.log("----------------------------------------");
    await feature.demo();
    console.log("----------------------------------------");
    
    // Pause between features
    if (i < features.length - 1) {
      console.log("\nPress Enter to continue to the next feature...");
      await new Promise(resolve => {
        process.stdin.once('data', () => {
          resolve();
        });
      });
    }
  }
  
  console.log("\n=======================================");
  console.log("      DEMO COMPLETED");
  console.log("=======================================");
  console.log("\nThe Gmail AI Agent is now ready to process your emails!");
  console.log("To get started:");
  console.log("1. Ensure you've configured your Google OAuth credentials");
  console.log("2. Start the application with 'npm run dev'");
  console.log("3. Navigate to http://localhost:3000 in your browser");
  console.log("\nThanks for watching the demo!");
  
  process.exit(0);
}

// Start the demo
runDemo().catch(error => {
  console.error("Error running demo:", error);
  process.exit(1);
}); 