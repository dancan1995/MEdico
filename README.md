# MEđico

**An all-in-one Spinal Cord Injury (SCI) recovery support app** built with **React Native**, **Expo**, and **Firebase**. MEđico empowers users to schedule health reminders, log vitals & symptoms, track rehabilitation goals, maintain mental health journals, and communicate in real-time with caregivers or an AI assistant — all from their mobile device.

---

## Table of Contents

1. [Overview](#overview)  
2. [Features](#features)  
3. [Architecture & Technology Stack](#architecture--technology-stack)  
4. [Installation & Setup](#installation--setup)  
5. [Running the App Locally](#running-the-app-locally)   
6. [Third-Party Dependencies](#third-party-dependencies)  
7. [Roadmap](#roadmap)  
8. [Contributing](#contributing)  
9. [Contact](#contact)  

---

## Overview

MEđico is designed to assist individuals recovering from spinal cord injuries (SCI) by providing:

- **Automated reminders** for pressure relief and bladder routines  
- **Pain logging** with intensity, type, and location  
- **Rehabilitation goal tracking** (PT/OT milestones)  
- **Mental health journaling** with mood logging and trend visualization  
- **Real-time chat** with designated caregivers  
- **AI-powered chat assistant** for non-clinical support  
- **Secure data sync** across multiple devices  

By combining these capabilities into one cohesive experience, MEđico helps users maintain adherence to prescribed therapies, monitor progress, and stay connected to their support network.

---

## Features

1. **Pressure Relief Timer**  
   - Schedule recurring reminders (e.g., every 30 min)  
   - Local notifications fire even when the app is backgrounded  
   - Confirmation dialog and status-bar notification integration  

2. **Bladder Scheduler**  
   - Log catheter changes and fluid intake times  
   - Schedule one-off or recurring bladder reminders  
   - Notification taps relaunch the app via background service  

3. **Rehabilitation Goals Tracker**  
   - Create, update, and check off PT/OT goals with due dates  
   - Progress bar and goal completion count  
   - Firestore real-time sync allows caregivers to see updates instantly  

4. **Pain Log**  
   - Record pain type (e.g., neuropathic), location, and intensity (1–10)  
   - Trends chart visualizes pain over time  
   - Swipe-to-delete entries for easy cleanup  

5. **Mental Health & Journal**  
   - Log daily mood on a 1–10 scale and free-form journal entries  
   - Visualize mood trends with a line chart (Recharts)  
   - Export entries for sharing or backup  

6. **Caregiver Portal Chat**  
   - One-to-one chat channel between patient and caregiver  
   - Firestore `onSnapshot` listener for real-time message updates  
   - Swipe-to-delete messages and timestamp display  

7. **AI-Powered Therapy Chat**  
   - Chat with an integrated GPT-based assistant for mental health support  
   - Responses streamed in real time  
   - Safety fallback encourages professional help in crisis  

8. **Authentication & Security**  
   - Firebase Authentication (email/password)  
   - Per-user Firestore security rules enforce data isolation  
   - Support for “Forgot Password” and secure session handling  

---

## Architecture & Technology Stack

- **Frontend**:  
  - React Native (hooks, functional components)  
  - Expo (managed workflow, dev client for custom native modules)  
- **Backend**:  
  - Firebase Authentication  
  - Firestore (real-time listeners)  
  - Firebase Cloud Functions (if extended)  
- **Build & Deploy**:  
  - Expo Application Services (EAS) for production builds (`.aab`)  
  - Over-the-air updates via Expo Updates  

---

## Installation & Setup

1. **Prerequisites**  
   - Node.js ≥ 16  
   - Yarn or npm  
   - Expo CLI (`npm install -g expo-cli`)  
   - EAS CLI (`npm install -g eas-cli`)  
   - A Firebase project with Firestore and Authentication enabled  

2. **Clone Repository**  
   ```bash
   git clone https://github.com/dancan1995/MEdico.git
   cd MEdico
   ```

## Running the App Locally
1. Start Expo Dev Server

```bash
expo start
```

2. Use a Development Build

```bash
expo run:android   # for Android dev client
expo run:ios       # for iOS dev client
```

3. Testing Notifications

Ensure expo-notifications is configured

Run on a physical device or Simulator with notifications enabled

## Third Party Dependencies

| Library                            | Purpose                                   |
| ---------------------------------- | ----------------------------------------- |
| `expo`                             | Managed workflow, CLI                     |
| `expo-notifications`               | Local & push notifications API            |
| `@react-native-firebase/firestore` | Real-time Firestore data sync             |
| `react-native-gesture-handler`     | Swipe actions, touch handling             |
| `react-native-safe-area-context`   | Safe area padding on iOS                  |
| `@expo/vector-icons`               | Iconography                               |
| `recharts`                         | Charts for mood & pain trends (web build) |

## Roadmap
 Firestore real-time chat & data sync

 Local notifications & background scheduling

 Swipe-to-delete gestures

 AI chat integration

 End-to-end encryption for journals - Not done yet

 User settings & profile management - Not done yet

 Map integration for location-based reminders - Not done yet

 Bluetooth sensor integration for posture monitoring - Not done yet

 ## Contributing
1. Fork the repo

2. Create a feature branch (git checkout -b feature/YourFeature)

3. Commit your changes (git commit -m "Add YourFeature")

4. Push to your branch (git push origin feature/YourFeature)

5. Open a Pull Request

Please follow the existing code style and include appropriate tests.

## Contact
📧 dancanodhiambo95@gmail.com

linkedin.com/in/dancun-juma-366403102/
