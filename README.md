# DevDesk Task Manager Pro 💻

A professional, all-in-one task management application that helps developers organize their work, track time, and boost productivity. It features local storage for offline use and optional Firebase integration for cloud sync.

## ✨ Features

| Feature | Description |
| :--- | :--- |
| **📝 Task Management** | Create, edit, delete, and categorize tasks (Freelancing, Code Ideas, Urgent, etc.). |
| **⏰ Professional Timer** | Focus timer with Pomodoro (25m), Deep Work (90m), and custom modes. |
| **💾 Dual Storage** | Works offline with LocalStorage, with optional Firebase Realtime Database setup. |
| **📅 Time-Based Tasks** | Set due dates and times with automatic browser notifications. |
| **🔔 Smart Notifications** | Get notified for due tasks and when the timer completes. |

## 🚀 Quick Start

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge, etc.)
- (Optional) A Firebase account for cloud sync

### Installation & Running the App
1. **Clone the repository**
   ```bash
   git clone https://github.com/muneeb99shah/DevDesk-Task-Manager.git
   cd devdesk-task-manager

2: Open the application

Simply open the index.html file in your web browser.

OR, use a local server for a better experience:
 
# If you have Python installed
python -m http.server 8000
# Then visit http://localhost:8000

3: Firebase Setup (Optional)
Follow these steps to enable cloud synchronization across devices:

   1: Create a Firebase Project:

    Go to the Firebase Console.

    Click "Add project" and follow the setup instructions.

    2: Set Up a Realtime Database:

    In your Firebase project console, go to Build > Realtime Database.

    Click "Create Database". Start in locked mode for security.

    Go to the Rules tab and update the rules to allow read/write for now:

        {
            "rules": {
                ".read": true,
                ".write": true
        }
        }

    Click "Publish".

    3: Get Your Firebase Config:

    In Project Settings (Settings icon > Project settings), find your Firebase SDK configuration object.

    In index.html, find the firebaseConfig constant and replace it with your own configuration:
    const firebaseConfig = {
        apiKey: "your-api-key-here",
        authDomain: "your-project-id.firebaseapp.com",
        projectId: "your-project-id",
        storageBucket: "your-project-id.appspot.com",
        messagingSenderId: "your-sender-id",
        appId: "your-app-id"
    };


Contributing
We welcome contributions! Please follow these steps to contribute:

1: Fork the repository on GitHub.

2: Clone your fork locally:
git clone https://github.com/your-username/devdesk-task-manager.git

3: Create a new branch for your feature or fix:
git checkout -b feature/your-amazing-feature

4:Make your changes and test them.
5:Commit your changes:
git commit -m "Add a meaningful commit message"

6: Push to your branch:
git push origin feature/your-amazing-feature

7: Open a Pull Request on the original repository.


Reporting Issues
When reporting bugs, please include:
Steps to reproduce the issue.
Expected vs. actual behavior.
Your browser and OS version.