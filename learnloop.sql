-- ============================================
--  Learn Loop - Database Schema
--  Import this file into MySQL before running
-- ============================================

CREATE DATABASE IF NOT EXISTS learnloop;
USE learnloop;

-- --------------------------
-- Table: users
-- --------------------------
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100)  NOT NULL,
  email      VARCHAR(150)  NOT NULL UNIQUE,
  password   VARCHAR(255)  NOT NULL,
  gender     ENUM('male','female','other') DEFAULT 'other',
  bio        TEXT,
  avatar_url VARCHAR(255)  DEFAULT NULL,
  points     INT DEFAULT 0,
  badges     VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------
-- Table: skills
-- --------------------------
CREATE TABLE IF NOT EXISTS skills (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT          NOT NULL,
  skill_name  VARCHAR(100) NOT NULL,
  category    VARCHAR(50)  NOT NULL,
  skill_type  ENUM('teach','learn') NOT NULL,
  description TEXT,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- --------------------------
-- Table: exchange_requests
-- --------------------------
CREATE TABLE IF NOT EXISTS exchange_requests (
  id                        INT AUTO_INCREMENT PRIMARY KEY,
  requester_id              INT NOT NULL,
  provider_id               INT NOT NULL,
  skill_id                  INT NOT NULL,
  message                   TEXT,
  status                    ENUM('pending','accepted','rejected','completed') DEFAULT 'pending',
  completed_at              TIMESTAMP NULL,
  completed_by_requester    TINYINT(1) DEFAULT 0,
  completed_by_provider      TINYINT(1) DEFAULT 0,
  created_at                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id)  REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (skill_id)     REFERENCES skills(id) ON DELETE CASCADE
);

-- --------------------------
-- Table: messages
-- --------------------------
CREATE TABLE IF NOT EXISTS messages (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  exchange_id     INT NOT NULL,
  sender_id       INT NOT NULL,
  message         TEXT NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exchange_id) REFERENCES exchange_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id)   REFERENCES users(id) ON DELETE CASCADE
);

-- --------------------------
-- Table: reviews
-- --------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  exchange_id  INT NOT NULL,
  reviewer_id  INT NOT NULL,
  reviewee_id  INT NOT NULL,
  rating       INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment      TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exchange_id) REFERENCES exchange_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- --------------------------
-- Table: resources
-- --------------------------
CREATE TABLE IF NOT EXISTS resources (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  exchange_id  INT NOT NULL,
  sender_id    INT NOT NULL,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  link         VARCHAR(500),
  file_name    VARCHAR(255),
  type         ENUM('link','pdf','notes','code','other') DEFAULT 'link',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exchange_id) REFERENCES exchange_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id)   REFERENCES users(id) ON DELETE CASCADE
);

-- --------------------------
-- Table: check_ins (gamification)
-- --------------------------
CREATE TABLE IF NOT EXISTS check_ins (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  exchange_id  INT NOT NULL,
  user_id      INT NOT NULL,
  check_in_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration     INT DEFAULT 0,
  FOREIGN KEY (exchange_id) REFERENCES exchange_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE
);

-- --------------------------
-- Sample Data
-- Note: Passwords below are bcrypt hashes of "password123"
-- --------------------------
INSERT INTO users (name, email, password, gender, bio) VALUES
('Poonam',  'poonam@example.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'male', 'CS student passionate about JavaScript and web development.'),
('Priyanshu Kumar',  'priyanshu@example.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'male', 'UI/UX design enthusiast. Love turning ideas into clean interfaces.'),
('Carlos Rivera', 'carlos@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'male', 'Bilingual student — native Spanish speaker, learning Python.'),
('Aisha Patel',   'aisha@example.com',  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'female', 'Data science student who loves teaching statistics and Excel.'),
('Prateeksha',     'prateeksha@example.com',   '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'female', 'Music and photography enthusiast looking to learn coding.');

INSERT INTO skills (user_id, skill_name, category, skill_type, description) VALUES
(1, 'JavaScript',          'Programming',    'teach', 'From basics to async/await. I can help with DOM, events, and project building.'),
(1, 'Spanish',             'Language',       'learn', 'Looking to learn conversational Spanish for travel.'),
(2, 'Figma & UI/UX',       'Design',         'teach', 'Wireframing, prototyping, design systems — I can guide you step by step.'),
(2, 'Python',              'Programming',    'learn', 'Interested in learning Python for data analysis projects.'),
(3, 'Spanish',             'Language',       'teach', 'Native speaker, can teach from beginner to advanced levels.'),
(3, 'Web Design',          'Design',         'learn', 'Want to improve my HTML/CSS and responsive design skills.'),
(4, 'Data Analysis',       'Data Science',   'teach', 'Excel, basic statistics, and data visualisation for beginners.'),
(4, 'Public Speaking',     'Communication',  'learn', 'Want to improve my confidence in presenting ideas.'),
(5, 'Photography',         'Creative Arts',  'teach', 'Composition, lighting, and editing with Lightroom.'),
(5, 'HTML & CSS',          'Programming',    'learn', 'Complete beginner, looking for a patient teacher.');

INSERT INTO exchange_requests (requester_id, provider_id, skill_id, message, status) VALUES
(2, 1, 1, 'Hi Poonam! I want to learn JavaScript. I can teach you Figma in return!', 'pending'),
(3, 2, 2, 'Hey Priyanshu! I can teach you Spanish if you teach me web design basics.', 'accepted'),
(5, 4, 8, 'Hi Prateeksha, I would love to learn data analysis from you!', 'pending');
