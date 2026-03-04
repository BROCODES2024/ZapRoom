# ⚡ ZapRoom 💬

ZapRoom is a real-time, room-based chat application built with **WebSocket technology**. It allows users to join chat rooms and exchange messages instantly—no login or authentication required. Designed for simplicity and speed, ZapRoom delivers seamless messaging through a lightweight **Node.js backend** and a modern **React frontend**.

[🎥 Watch Demo on YouTube](https://www.youtube.com/watch?v=F5hLT-PF3bY)

-----

## ✨ Features

### 🗨️ Core Chat Functionality

  - **Real-Time Messaging**: Instant message delivery using WebSockets.
  - **Room-Based Chat**: Create or join any room by simply entering a Room ID.
  - **Message History**: New users instantly see the last 50 messages upon joining.
  - **Typing Indicators**: See when other users in the room are typing.
  - **Private Messages (DMs)**: Send direct messages to other users within the same room.

### 👑 Host & Moderation Tools

  - **Automatic Host Assignment**: The first user to join a room becomes the host.
  - **Lock Room**: The host can lock a room to prevent new users from joining.
  - **Kick User**: The host can remove a user from the room.
  - **Ban User**: The host can permanently ban a user from rejoining the room.

### 🔒 Security & Reliability

  - **Input Validation & Sanitization**: Protects against invalid data and XSS attacks.
  - **Rate Limiting**: Prevents users from spamming the chat.
  - **Heartbeat & Liveness Checks**: Automatically detects and removes dead connections.
  - **Graceful Shutdown**: Server notifies clients and cleans up resources before shutting down.

### 🎨 User Experience

  - **Modern UI**: Clean and responsive interface built with Shadcn UI + Tailwind CSS.
  - **Dark Mode**: Seamlessly switch between light and dark themes.
  - **Real-Time User List**: See who is currently in the room.
  - **Toast Notifications**: Get clear feedback for system events and errors.
  - **Auto-Reconnect**: Client automatically attempts reconnection if disconnected.

-----

## 🛠️ Tech Stack

### Backend

  - Runtime: **Node.js**
  - Language: **TypeScript**
  - Framework: **WebSocket (`ws` library)**
  - Deployment: **Railway**

### Frontend

  - Framework: **Next.js 15 (App Router)**
  - Language: **TypeScript**
  - Styling: **Tailwind CSS v4**
  - UI Components: **Shadcn UI**
  - Deployment: **Railway**

-----

## 🚀 Deployment (Railway)

ZapRoom is configured for seamless deployment on [Railway](https://railway.app/). The project includes `railway.toml` files in both the frontend and backend directories.

1. Create a new empty project on Railway.
2. Deploy from your GitHub repository.
3. Railway will detect the monorepo-style setup and deploy both services (`zaproom-frontend` and `zaproom-backend`).
4. **Environment Variables**:
   - On the `zaproom-frontend` service, add a variable: `NEXT_PUBLIC_WS_URL=wss://<your-backend-railway-url>`

-----

## 🚀 Getting Started Locally

### ✅ Prerequisites

  - Install [Node.js](https://nodejs.org/) (comes with npm).

### 📥 Installation & Setup

Clone the repository:

```bash
git clone https://github.com/BROCODES2024/ZapRoom.git
cd ZapRoom
```

#### Backend Setup

```bash
cd backend
npm install
```

#### Frontend Setup

```bash
cd ../frontend
npm install
```

-----

### ▶️ Running the Application

You need **two terminals** open (one for backend, one for frontend).

**Start the Backend Server (Terminal 1)**

```bash
cd backend
npm run dev
```

  * Runs WebSocket server on: `ws://localhost:8080`

**Start the Frontend Application (Terminal 2)**

```bash
cd frontend
npm run dev
```

  * Runs frontend on: `http://localhost:3000`

Now open multiple browser tabs/windows at `http://localhost:3000` to simulate different users joining and interacting in a chat room 🚀

-----

## 🚀 Deployment

ZapRoom is designed to be easily deployed across two platforms for optimal performance:
- **Frontend:** [Vercel](https://vercel.com/) (Native Next.js Web Hosting)
- **Backend:** [Railway](https://railway.app/) (Native Node.js WebSockets)

### 1. Deploy the Backend (Railway)
1. Go to [Railway](https://railway.app/new) and select **Deploy from GitHub repo**.
2. Select your `ZapRoom` repository.
3. Railway will ask you to set the **Root Directory**. Set it to `/backend`.
4. Deploy the service.
5. In your Railway dashboard for this service, navigate to **Settings -> Networking -> Public Networking** and click **Generate Domain**.
6. Railway will give you a domain (e.g., `zaproom-backend-production...up.railway.app`).
7. Keep this domain handy. You will need it for the frontend.

### 2. Deploy the Frontend (Vercel)
Vercel handles Next.js perfectly right out of the box with zero configuration files.

1. Go to your [Vercel Dashboard](https://vercel.com/new) and click **Add New -> Project**.
2. Import your `ZapRoom` GitHub repository.
3. In the Configuration screen:
   - Provide a Project Name.
   - **Important:** Set the **Root Directory** to `frontend`.
   - Vercel will automatically detect the Framework Preset as `Next.js`.
4. Over in the **Environment Variables** section, add:
   - Key: `NEXT_PUBLIC_WS_URL`
   - Value: `wss://<your-backend-railway-url>` (Make sure to prepend `wss://` to the Railway URL you copied earlier).
5. Click **Deploy**.

Vercel will quickly build and deploy the Next.js application globally. Once it's finished, click your new Vercel domain to chat instantly!

-----

## 📌 Demo

  * Multiple users in real-time rooms
  * Host moderation controls (lock/kick/ban)
  * Private DMs + typing indicators
  * Auto reconnect + modern UI (with Dark Mode toggle)

-----

## 📜 License

This project is licensed under the **MIT License**.

📂 GitHub Repo: [ZapRoom](https://github.com/BROCODES2024/ZapRoom)
