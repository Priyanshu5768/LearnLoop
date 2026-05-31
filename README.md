# Learn Loop - Peer-to-Peer Skill Exchange Platform
>  A full-stack peer-to-peer learning platform enabling students to exchange skills, collaborate through real-time chat, share study resources, and build credibility via reviews and badges. Features structured skill matching, request-based learning workflows, and engagement tracking. Built using Node.js, MySQL, and Bootstrap 5.

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

---

## 🚀 Demo

### Running Locally

```bash
# Clone or download this repository
cd learn-loop

# Install dependencies
npm install

# Import database schema
mysql -u root < database/learnloop.sql

# Start the server
npm start
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
// Both users must approve for full completion
if (completedByRequester && completedByProvider) {
  status = 'completed';
} else {
  status = 'accepted'; // waiting for other user
}
```

### 3. Gamification
```javascript
POINTS_PER_CHECKIN = 5;
Badge Rules: 10pts → 'First Steps',  25pts → 'Active Learner',
             50pts → 'Knowledge Seeker',  100pts → 'Skill Master'
```

---

## 📂 Project Structure

```
learn-loop/
├── config/
│   └── db.js                    # MySQL connection pool
├── database/
│   └── learnloop.sql            # Schema + sample data
├── public/
│   ├── css/
│   │   └── style.css            # Glassmorphism stylesheet
│   ├── js/
│   │   └── main.js              # Frontend app logic
│   ├── uploads/                 # User-uploaded files
│   ├── index.html               # Landing page
│   ├── login.html               # Login page
│   ├── register.html            # Registration page
│   ├── dashboard.html           # User dashboard
│   ├── browse.html              # Skill browsing with filters
│   ├── add-skill.html           # Add a new skill
│   ├── exchange.html            # Exchange request management
│   ├── chat.html                # Messaging & resource sharing
│   └── profile.html             # Profile & gamification stats
├── routes/
│   ├── auth.js                  # Auth endpoints
│   ├── skills.js                # Skill CRUD
│   ├── exchange.js              # Exchange request flow
│   ├── messages.js              # Chat messaging
│   ├── reviews.js               # Rating system
│   ├── resources.js             # File sharing
│   └── gamify.js                # Gamification
├── sessions.js                  # In-memory session store
├── server.js                    # HTTP server entry point
├── package.json
├── .env
└── README.md
```

---

## 🧰 Tech Stack

| Technology | Purpose |
|------------|---------|
| Node.js | Backend runtime (vanilla http module) |
| MySQL 8.0 | Relational database |
| bcryptjs | Password hashing |
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
# 1. Install dependencies
npm install

# 2. Import the database
mysql -u root < database/learnloop.sql

# 3. Configure environment (.env)
#    DB_HOST=localhost
#    DB_USER=root
#    DB_PASSWORD=
#    DB_NAME=learnloop
#    PORT=3000

# 4. Start the server
npm start
```

### Sample Accounts (password: `password@123`)

| Name | Email |
|------|-------|
| Poonam | poonam@example.com |
| Priyanshu Kumar | priyanshu@example.com |
| Carlos Rivera | carlos@example.com |
| Aisha Patel | aisha@example.com |

---

## 🖼️ Screenshots

### Landing Page

<img width="1910" height="997" alt="image" src="https://github.com/user-attachments/assets/dd3d7096-dddf-421e-9acb-911fb438dd95" />


### Browse Skills

<img width="1909" height="1006" alt="image" src="https://github.com/user-attachments/assets/9fd6e534-2cfe-482a-a357-dc6dd7f09f04" />


### Dashboard

<img width="1908" height="987" alt="image" src="https://github.com/user-attachments/assets/2784d3a1-869a-4a53-8bd9-48084e26188c" />


### Exchange Requests

<img width="1914" height="994" alt="image" src="https://github.com/user-attachments/assets/9310aa5b-ef07-44e2-a8d4-44047781cfc7" />


### Chat & Resources

<img width="1898" height="988" alt="image" src="https://github.com/user-attachments/assets/578e1597-9754-4c70-980f-ae853b211554" />


### Profile & Gamification

<img width="1896" height="996" alt="image" src="https://github.com/user-attachments/assets/2ef69ddc-dd93-4240-be04-94cec96257ed" />


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

---

<p align="center">
  Made with ❤️ for peer-to-peer learning
</p>
