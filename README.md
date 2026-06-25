# Learn Loop - Peer-to-Peer Skill Exchange Platform
>**LearnLoop is a project I built to solve a real problem — students have skills others need, but no easy way to connect. So I built a platform where you can teach what you know and learn what you don't — no money, just skill exchange.**

---

## 📌 Features

| Module | Description |
|--------|------------|
| 🔐 **Authentication** | Register, login, logout, profile management, and password change |
| 📋 **Skill Management** | Add, browse, search, and delete skills across 8 categories |
| 🔄 **Exchange Requests** | Send, accept, reject, and mutually complete skill swap requests |
| 💬 **Messaging** | Real-time polling chat between exchange partners |
| 📁 **Resource Sharing** | Upload and share files (PDFs, images, code, notes) per exchange |
| ⭐ **Reviews & Ratings** | 1–5 star rating system with comments after exchanges |
| 🎮 **Gamification** | Daily check-ins, points system, and progression badges |
| 🔔 **Email Notifications** | Async Bull/Redis job queue — notifies users on new requests and acceptances |

---

## 🚀 Demo

### Running Locally

```bash
 Clone or download this repository
cd learn-loop

 Install dependencies
npm install

 Import database schema
mysql -u root < database/learnloop.sql

 Start the server
npm start

 Start the notification worker (separate terminal)
npm run worker
```

Then open **http://localhost:3000** in your browser.

---

## 🛠️ How It Works

### 1. Skill Exchange Flow

```
Register → Add Skills (teach/learn) → Browse Others' Skills →
Send Exchange Request → Partner Accepts → Chat & Share Resources →
Both Mark Complete → Leave a Review → Earn Points & Badges
```

### 2. Completion System
```javascript
 Both users must approve for full completion
if (completedByRequester && completedByProvider) {
  status = 'completed';
} else {
  status = 'accepted'; 
}
```

### 3. Async Notification System
```
User sends request → API adds job to Bull Queue → Redis (Upstash) stores job
Background Worker picks up job → Nodemailer sends HTML email via Gmail SMTP
```

### 4. Gamification
```
POINTS_PER_CHECKIN = 5;
Badge Rules: 10pts → First Steps,  25pts → Active Learner,
             50pts → Knowledge Seeker,  100pts → Skill Master
```

---

## 📂 Project Structure

```
learn-loop/
├── config/
│   └── db.js                     MySQL connection pool
├── database/
│   └── learnloop.sql             Schema + sample data
├── public/
│   ├── css/
│   │   └── style.css            Glassmorphism stylesheet
│   ├── js/
│   │   └── main.js               Frontend app logic
│   ├── uploads/                  User-uploaded files
│   ├── index.html                Landing page
│   ├── login.html                Login page
│   ├── register.html             Registration page
│   ├── dashboard.html            User dashboard
│   ├── browse.html               Skill browsing with filters
│   ├── add-skill.html            Add a new skill
│   ├── exchange.html             Exchange request management
│   ├── chat.html                 Messaging & resource sharing
│   └── profile.html              Profile & gamification stats
├── queues/
│   └── notificationQueue.js      Bull queue definition (Redis-backed)
├── routes/
│   ├── auth.js                   Auth endpoints
│   ├── skills.js                 Skill CRUD
│   ├── exchange.js               Exchange request flow + queue producer
│   ├── messages.js               Chat messaging
│   ├── reviews.js                Rating system
│   ├── resources.js              File sharing
│   └── gamify.js                 Gamification
├── workers/
│   └── notificationWorker.js     Bull queue consumer — sends HTML emails
├── sessions.js                   In-memory session store
├── server.js                     HTTP server entry point
├── package.json
├── .env                          Environment variables (not committed)
└── README.md
```

---

## 🧰 Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js | Backend runtime (vanilla http module) |
| MySQL 8.0 | Relational database |
| bcryptjs | Password hashing |
| Bull | Redis-backed async job queue |
| Nodemailer | Email transport via Gmail SMTP |
| Upstash Redis | Cloud Redis instance (job store) |
| Bootstrap 5.3 | Frontend UI framework |
| Vanilla JavaScript | Frontend logic |

---

## 📥 Installation

### Prerequisites
- Node.js v18 or higher
- MySQL 8.0
- npm package manager

### Setup

```bash
 1. Install dependencies
npm install

 2. Import the database
mysql -u root < database/learnloop.sql

 3. Configure environment (.env)
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=
    DB_NAME=learnloop
    PORT=3000
    REDIS_HOST=your_upstash_host
    REDIS_PORT=6379
    REDIS_PASSWORD=your_upstash_password
    EMAIL_USER=your_gmail@gmail.com
    EMAIL_PASS=your_gmail_app_password

 4. Start the server
npm start

 5. Start the notification worker (separate terminal)
npm run worker
```

### Sample Accounts (password: `password@123`)

| Name | Email |
|------|-------|
| Poonam | poonam@example.com |
| Priyanshu Kumar | priyanshu@example.com |
---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update name, bio, gender |
| PUT | `/api/auth/password` | Change password |

### Skills
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/skills` | Browse skills with filters |
| GET | `/api/skills/my` | Get user's skills |
| POST | `/api/skills` | Add a skill |
| DELETE | `/api/skills/:id` | Delete own skill |

### Exchange
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/exchange/request` | Send exchange request |
| GET | `/api/exchange/my` | Get sent & received requests |
| PUT | `/api/exchange/:id/accept` | Accept a request |
| PUT | `/api/exchange/:id/reject` | Reject a request |
| PUT | `/api/exchange/:id/complete` | Toggle completion |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/conversations` | List conversations |
| GET | `/api/messages/:exchangeId` | Get messages |
| POST | `/api/messages/:exchangeId` | Send message |

### Reviews & Resources
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reviews` | Submit a review |
| GET | `/api/reviews/user/:userId` | Get user's reviews |
| GET | `/api/resources/:exchangeId` | Get shared resources |
| POST | `/api/resources/:exchangeId` | Upload resource |
| DELETE | `/api/resources/delete/:id` | Delete resource |

### Gamification
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/gamify/checkin/:exchangeId` | Daily check-in (min 2 min) |
| GET | `/api/gamify/stats` | Get points & badges |

---

## 📝 License

This is a **Web Technologies Project** as a part of my B-Tech in Computer Science And Engineering.

---

## 👨‍🎓 Author

**Priyanshu Kumar**
- B.Tech CSE (R)
- NIET (Noida Institute of Engineering and Technology), Greater Noida

---

## 🙏 Acknowledgments

- Bootstrap 5.3 for the UI framework
- Google Fonts (Poppins) for typography
- bcryptjs for secure password hashing
- Bull & Upstash Redis for async job queue

---

<p align="center">
  Made with ❤️ for peer-to-peer learning
</p>
