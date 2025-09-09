# ⚡ ZapRoom  

ZapRoom is a real-time, room-based chat application built with **WebSocket technology**. It allows users to join chat rooms and exchange messages instantly—no login or authentication required. Designed for simplicity and speed, ZapRoom delivers seamless messaging through a lightweight **Node.js backend** and a modern **React frontend**.  

> 🎥 Click the image above to watch the video demo.  

---

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

---

## 🛠️ Tech Stack  

### Backend  
- Runtime: **Node.js**  
- Language: **TypeScript**  
- Framework: **WebSocket (`ws` library)**  
- Server: **Node.js http module** (for metrics)  

### Frontend  
- Framework: **React**  
- Language: **TypeScript**  
- Build Tool: **Vite**  
- Styling: **Tailwind CSS**  
- UI Components: **Shadcn UI**  

---

## 🚀 Getting Started  

### ✅ Prerequisites  
- Install [Node.js](https://nodejs.org/) (comes with npm).  

### 📥 Installation & Setup  

Clone the repository:  
```bash
git clone <your-repository-url>
cd ZapRoom
````

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

---

### ▶️ Running the Application

You need **two terminals** open (one for backend, one for frontend).

**Start the Backend Server**

```bash
cd backend
npm start
```

* Runs WebSocket server on: `ws://localhost:8080`

**Start the Frontend Application**

```bash
cd frontend
npm run dev
```

* Runs frontend on: `http://localhost:5173`

Now open multiple browser tabs/windows to simulate different users joining and interacting in a chat room 🚀

---

## 📌 Demo

* Multiple users in real-time rooms
* Host moderation controls (lock/kick/ban)
* Private DMs + typing indicators
* Auto reconnect + modern UI

---

## 📜 License

This project is licensed under the **MIT License**.

```

