import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "arsip-surat-secret-key-2024";

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Database Setup
const db = new Database("arsip.db");
db.pragma("journal_mode = WAL");

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL, -- ADMIN, STAFF, PIMPINAN
    full_name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS letters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL, -- INCOMING, OUTGOING
    letter_number TEXT UNIQUE NOT NULL,
    subject TEXT NOT NULL,
    sender TEXT NOT NULL,
    recipient TEXT NOT NULL,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING', -- PENDING, PROCESSED, COMPLETED
    file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS dispositions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    letter_id INTEGER NOT NULL,
    from_user_id INTEGER NOT NULL,
    to_user_id INTEGER NOT NULL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (letter_id) REFERENCES letters(id),
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id)
  );
`);

// Seed Admin User if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)").run(
    "admin",
    hashedPassword,
    "ADMIN",
    "Administrator"
  );
  
  // Seed some other roles for testing
  db.prepare("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)").run(
    "staff",
    bcrypt.hashSync("staff123", 10),
    "STAFF",
    "Staff Arsip"
  );
  db.prepare("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)").run(
    "pimpinan",
    bcrypt.hashSync("pimpinan123", 10),
    "PIMPINAN",
    "Kepala Instansi"
  );
}

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use((req, res, next) => {
  if (req.url.startsWith("/api")) {
    console.log(`${req.method} ${req.url}`);
  }
  next();
});
app.use("/uploads", express.static(uploadDir));

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Forbidden" });
    req.user = user;
    next();
  });
};

// API Routes
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role, full_name: user.full_name }, JWT_SECRET, {
    expiresIn: "24h",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.json({ id: user.id, username: user.username, role: user.role, full_name: user.full_name });
});

app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

app.get("/api/auth/me", authenticateToken, (req: any, res) => {
  res.json(req.user);
});

// Dashboard Stats
app.get("/api/stats", authenticateToken, (req, res) => {
  const incoming = db.prepare("SELECT COUNT(*) as count FROM letters WHERE type = 'INCOMING'").get() as any;
  const outgoing = db.prepare("SELECT COUNT(*) as count FROM letters WHERE type = 'OUTGOING'").get() as any;
  const pending = db.prepare("SELECT COUNT(*) as count FROM letters WHERE status = 'PENDING'").get() as any;
  const processed = db.prepare("SELECT COUNT(*) as count FROM letters WHERE status = 'PROCESSED'").get() as any;

  res.json({
    incoming: incoming.count,
    outgoing: outgoing.count,
    pending: pending.count,
    processed: processed.count,
  });
});

// Letters CRUD
app.get("/api/letters/next-number", authenticateToken, (req, res) => {
  const { type } = req.query;
  const year = new Date().getFullYear();
  const count = db.prepare("SELECT COUNT(*) as count FROM letters WHERE type = ? AND strftime('%Y', created_at) = ?").get(type, year.toString()) as any;
  const nextNum = (count.count + 1).toString().padStart(3, '0');
  const code = type === 'INCOMING' ? 'SM' : 'SK';
  res.json({ number: `${nextNum}/${code}/${year}` });
});

app.get("/api/letters/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  if (isNaN(Number(id))) return res.status(400).json({ error: "Invalid ID" });
  const letter = db.prepare("SELECT * FROM letters WHERE id = ?").get(id);
  if (!letter) return res.status(404).json({ error: "Letter not found" });
  res.json(letter);
});

app.get("/api/letters", authenticateToken, (req, res) => {
  const { type, search } = req.query;
  let query = "SELECT * FROM letters WHERE 1=1";
  const params: any[] = [];

  if (type) {
    query += " AND type = ?";
    params.push(type);
  }

  if (search) {
    query += " AND (subject LIKE ? OR letter_number LIKE ? OR sender LIKE ? OR recipient LIKE ?)";
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam, searchParam);
  }

  query += " ORDER BY created_at DESC";
  const letters = db.prepare(query).all(...params);
  res.json(letters);
});

app.post("/api/letters", authenticateToken, upload.single("file"), (req, res) => {
  const { type, letter_number, subject, sender, recipient, date, category } = req.body;
  const file_path = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const result = db.prepare(`
      INSERT INTO letters (type, letter_number, subject, sender, recipient, date, category, file_path)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(type, letter_number, subject, sender, recipient, date, category, file_path);

    res.json({ id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.patch("/api/letters/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  db.prepare("UPDATE letters SET status = ? WHERE id = ?").run(status, id);
  res.json({ success: true });
});

app.delete("/api/letters/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const letter = db.prepare("SELECT file_path FROM letters WHERE id = ?").get(id) as any;
  if (letter?.file_path) {
    const fullPath = path.join(__dirname, letter.file_path);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
  db.prepare("DELETE FROM letters WHERE id = ?").run(id);
  db.prepare("DELETE FROM dispositions WHERE letter_id = ?").run(id);
  res.json({ success: true });
});

// Dispositions
app.get("/api/letters/:id/dispositions", authenticateToken, (req, res) => {
  const { id } = req.params;
  const dispositions = db.prepare(`
    SELECT d.*, u1.full_name as from_name, u2.full_name as to_name
    FROM dispositions d
    JOIN users u1 ON d.from_user_id = u1.id
    JOIN users u2 ON d.to_user_id = u2.id
    WHERE d.letter_id = ?
    ORDER BY d.created_at ASC
  `).all(id);
  res.json(dispositions);
});

app.post("/api/dispositions", authenticateToken, (req: any, res) => {
  const { letter_id, to_user_id, notes } = req.body;
  const from_user_id = req.user.id;

  db.prepare(`
    INSERT INTO dispositions (letter_id, from_user_id, to_user_id, notes)
    VALUES (?, ?, ?, ?)
  `).run(letter_id, from_user_id, to_user_id, notes);

  // Update letter status to PROCESSED if it was PENDING
  db.prepare("UPDATE letters SET status = 'PROCESSED' WHERE id = ? AND status = 'PENDING'").run(letter_id);

  res.json({ success: true });
});

// Users List (for disposition target)
app.get("/api/users", authenticateToken, (req, res) => {
  const users = db.prepare("SELECT id, username, full_name, role FROM users").all();
  res.json(users);
});

app.post("/api/users", authenticateToken, (req: any, res) => {
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
  const { username, password, full_name, role } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    db.prepare("INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)").run(
      username,
      hashedPassword,
      full_name,
      role
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/users/:id", authenticateToken, (req: any, res) => {
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
  const { id } = req.params;
  if (Number(id) === req.user.id) return res.status(400).json({ error: "Cannot delete yourself" });
  db.prepare("DELETE FROM users WHERE id = ?").run(id);
  res.json({ success: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
