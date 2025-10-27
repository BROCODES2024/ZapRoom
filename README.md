# ⚡ ZapRoom 💬

ZapRoom is a real-time, room-based chat application built with **WebSocket technology**. It allows users to join chat rooms and exchange messages instantly—no login or authentication required. Designed for simplicity and speed, ZapRoom delivers seamless messaging through a lightweight **Node.js backend** and a modern **React frontend**.

[🎥 Watch Demo on YouTube](https://www.youtube.com/watch?v=F5hLT-PF3bY)
*🎥 Click the thumbnail above to watch the video demo on YouTube.*

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
  - Server: **Node.js http module** (for metrics)

### Frontend

  - Framework: **React**
  - Language: **TypeScript**
  - Build Tool: **Vite**
  - Styling: **Tailwind CSS**
  - UI Components: **Shadcn UI**

-----

## 🏛️ Architecture

### Current Architecture

The current architecture is a simple client-server model. Clients (React applications in user browsers) establish a direct WebSocket connection to a single Node.js backend server. All room management, user lists, and message history are stored directly in the server's memory. This provides excellent performance for smaller deployments but introduces limitations in scalability and data persistence.

```
+----------------+      <-- WebSocket -->      +--------------------------+
|                |      (JSON Payloads)      |                          |
|  Client        |                           |  Server (Node.js + ws)   |
|  (React App)   |                           |                          |
|                |      <-----------------     +-----------+--------------+
+----------------+                                        |
                                                          | (Reads/Writes)
                                                          ↓
                                             +--------------------------+
                                             |     In-Memory State      |
                                             | (rooms, users, messages) |
                                             +--------------------------+
```

-----

### Future Architecture (Scalable)

To achieve higher scalability and data persistence, the future architecture introduces several key components designed for a distributed environment. It moves from a monolithic, in-memory state to a system with a persistent database, a fleet of WebSocket servers, and a Pub/Sub system managed by a load balancer.

```
+----------+ 1. Connects via Load Balancer
|          |------------------------------------->+-----------------+
|  Clients |                                      |                 |
| (React,  |                                      |  Load Balancer  |
|   etc)   |                                      |                 |
|          |<-------------------------------------+-----------------+
+----------+                                              |
      ^                                                     | 2. Assigns connection
      |                                                     | to a healthy server
      |                                           +---------+---------+
      | 5. Message delivered to                   |         |         |
      |    all clients in the room                v         v         v
      |                                     +----------+----------+----------+
      |                                     | Server 1 | Server 2 | Server N |
      |                                     | (Node.js | (Node.js | (Node.js |
      |                                     |    ws)   |    ws)   |    ws)   |
      +-------------------------------------+----------+----------+----------+
                                                  ^    ^    ^    ^    ^
                                                  |    |    |    |    |
                      4. Pub/Sub broadcasts message |    |    |    |    | 3. Server 2 publishes
                         to ALL subscribed servers  +----+----+----+----+ message to room channel
                                                       |    |    |
                                                       v    v    v
                                                 +-----------------+
                                                 |   Pub/Sub System|
                                                 |   (e.g., Redis) |
                                                 +-----------------+
                                                         |
                                                         | 6. (Optional) Persists
                                                         |    message to DB
                                                         v
                                                 +-----------------+
                                                 |   PostgreSQL DB |
                                                 +-----------------+
```

**Key Components & Their Roles:**

1.  **Turborepo (Monorepo Strategy):** This will be used to manage the `frontend`, `backend`, and potentially shared `packages/` within a single repository, streamlining development, build processes, and shared code.
2.  **Load Balancer:** Distributes incoming client WebSocket connections across a fleet of backend WebSocket servers, ensuring high availability and efficient resource utilization.
3.  **Fleet of WebSocket Servers:** Multiple, stateless Node.js WebSocket server instances. Each server handles a subset of client connections and communicates with other servers via a Pub/Sub system.
4.  **Pub/Sub System (e.g., Redis):** A central messaging bus that enables inter-server communication. When a message is sent to a room by a client connected to one server, that server publishes the message to a specific channel in the Pub/Sub system. All other servers subscribed to that channel receive the message and deliver it to their connected clients in that room.
5.  **PostgreSQL Database:** The primary data store for persistent data like users, messages, and room configurations, accessed by the backend servers.

-----

## 📈 Scalability and Tradeoffs

### Scalability Benefits

  * **Horizontal Scaling:** The architecture allows for easy addition of more WebSocket servers as traffic grows, enabling the handling of a large number of concurrent connections.
  * **High Availability:** The load balancer and multiple server instances ensure that the application remains available even if individual servers fail.
  * **Persistence:** Moving from in-memory to PostgreSQL ensures all chat data is saved permanently.
  * **Efficient Real-time Communication:** The Pub/Sub system effectively distributes messages across the server fleet, enabling seamless communication in large-scale deployments.

### Tradeoffs

  * **Increased Complexity:** Moving to a distributed system inherently introduces more complexity in terms of deployment, monitoring, and troubleshooting.
  * **Higher Infrastructure Cost:** Running multiple servers, a Pub/Sub system, and a database will generally incur higher operational costs compared to a single-server setup.
  * **Debugging Challenges:** Tracing issues across multiple interconnected services can be more challenging than in a simple monolithic application.
  * **Development Overhead:** Setting up and configuring these new services requires additional development effort and expertise.

-----

## 🚧 Challenges and Learnings

Building a real-time chat application, even a simple one, presents several interesting challenges:

  * **WebSocket State Management:** Ensuring consistent state across connected clients and handling disconnections gracefully (heartbeats, auto-reconnect) is critical. The current in-memory approach simplifies this but limits scale.
  * **Concurrency:** Managing simultaneous message sends and room actions without race conditions.
  * **Security:** Input sanitization and rate limiting are crucial to prevent abuse and protect against common web vulnerabilities like XSS.
  * **Frontend-Backend Sync:** Keeping the UI updated in real-time while ensuring data consistency can be tricky, especially with features like typing indicators and message history.
  * **Moderation Logic:** Implementing robust host and moderation tools requires careful design to prevent misuse.

Learnings often revolve around:

  * The power and necessity of **WebSockets** for true real-time experiences.
  * The importance of **stateless servers** in a scalable architecture.
  * The role of **Pub/Sub patterns** for inter-service communication in distributed systems.
  * The eventual need for **persistence** and how to integrate it without sacrificing real-time performance.

-----

## 🛣️ Future Work

To further enhance ZapRoom and realize the full potential of its scalable architecture, the following areas will be explored:

1.  **User Authentication & Profiles:**
      * Implement user registration and login (e.g., using JWTs).
      * Create persistent user profiles with unique usernames and avatars.
      * Introduce private user settings.
2.  **Database Integration (PostgreSQL + Prisma):**
      * Transition from in-memory storage to a persistent PostgreSQL database.
      * Utilize Prisma ORM for robust and type-safe database interactions.
      * Store user data, chat messages (for extended history), and room configurations.
3.  **Advanced Room Features:**
      * Password-protected rooms.
      * Public vs. Private rooms.
      * Voice/Video chat integration.
      * File sharing within chat rooms.
4.  **Enhanced Moderation & Administration:**
      * Admin panel for global moderation (beyond room hosts).
      * Reporting system for inappropriate content or behavior.
      * More granular permissions for hosts and moderators.
5.  **Notifications:**
      * Push notifications for DMs or mentions when users are offline.
      * Browser tab notifications.
6.  **Deployment & Operations:**
      * Implement Docker for containerization of both frontend and backend services.
      * Orchestrate deployment and scaling using platforms like Kubernetes for robust scaling, self-healing, and zero-downtime deployments.
      * Set up CI/CD pipelines for automated testing and deployment.
      * Integrate centralized logging and monitoring solutions.
7.  **Monorepo with Turborepo:**
      * Restructure the project into a monorepo using Turborepo for efficient management of shared code and optimized build processes.

-----

## 🚀 Getting Started

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

-----

## 📌 Demo

  * Multiple users in real-time rooms
  * Host moderation controls (lock/kick/ban)
  * Private DMs + typing indicators
  * Auto reconnect + modern UI

-----

## 📜 License

This project is licensed under the **MIT License**.

📂 GitHub Repo: [ZapRoom](https://github.com/BROCODES2024/ZapRoom)
