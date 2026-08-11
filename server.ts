import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import crypto from "crypto";
import { fileURLToPath } from "url";

const getDirname = () => {
  if (typeof __dirname !== "undefined") {
    return __dirname;
  }
  // @ts-ignore
  return path.dirname(fileURLToPath(import.meta.url));
};
const currentDir = getDirname();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize DB
  const db = new Database("database.sqlite");
  db.exec(`
    CREATE TABLE IF NOT EXISTS access_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      session_id TEXT DEFAULT NULL,
      expires_at DATETIME DEFAULT NULL
    )
  `);

  // Simple migration in case table already exists
  try {
    db.exec(`ALTER TABLE access_codes ADD COLUMN session_id TEXT DEFAULT NULL`);
  } catch (e) {}
  
  try {
    db.exec(`ALTER TABLE access_codes ADD COLUMN expires_at DATETIME DEFAULT NULL`);
  } catch (e) {}

  // API Routes
  const adminMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const adminCode = req.headers['x-admin-code'];
    if (adminCode !== 'pejuangunhan2027') {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  app.post("/api/admin/generate-code", adminMiddleware, (req, res) => {
    try {
      const count = req.body.count || 1;
      const expiresInDays = req.body.expiresInDays || null;
      const codes: string[] = [];
      const stmt = db.prepare("INSERT INTO access_codes (code, expires_at) VALUES (?, ?)");
      
      const generateSingleCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randomPart = '';
        for (let i = 0; i < 3; i++) {
          randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `UNHAN-${randomPart}`;
      };

      const generateUniqueCode = () => {
        let code = '';
        let isUnique = false;
        while (!isUnique) {
          code = generateSingleCode();
          const existing = db.prepare("SELECT * FROM access_codes WHERE code = ?").get(code);
          if (!existing) {
            isUnique = true;
          }
        }
        return code;
      };

      let expiresAtValue = null;
      if (expiresInDays) {
        const d = new Date();
        d.setDate(d.getDate() + parseInt(expiresInDays));
        expiresAtValue = d.toISOString().replace('T', ' ').substring(0, 19);
      }

      const insertMany = db.transaction((codesToInsert: string[]) => {
        for (const code of codesToInsert) {
          stmt.run(code, expiresAtValue);
        }
      });

      for (let i = 0; i < count; i++) {
        codes.push(generateUniqueCode());
      }
      
      insertMany(codes);

      res.json({ success: true, codes });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate code" });
    }
  });

  app.get("/api/admin/codes", adminMiddleware, (req, res) => {
    try {
      const codes = db.prepare("SELECT * FROM access_codes ORDER BY created_at DESC").all();
      res.json(codes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch codes" });
    }
  });
  
  app.post("/api/admin/reset-device", adminMiddleware, (req, res) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: "Code is required" });
      db.prepare("UPDATE access_codes SET session_id = NULL WHERE code = ?").run(code);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset device" });
    }
  });

  app.post("/api/admin/deactivate-code", adminMiddleware, (req, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ error: "Code is required" });
      }
      db.prepare("UPDATE access_codes SET is_active = 0 WHERE code = ?").run(code);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to deactivate code" });
    }
  });

  app.delete("/api/admin/delete-code", adminMiddleware, (req, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ error: "Code is required" });
      }
      db.prepare("DELETE FROM access_codes WHERE code = ?").run(code);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete code" });
    }
  });

  app.post("/api/login", (req, res) => {
    try {
      const { code, sessionId } = req.body;
      if (!code) {
        return res.status(400).json({ error: "Code is required" });
      }
      const row = db.prepare("SELECT * FROM access_codes WHERE code = ?").get(code) as any;
      
      if (!row) {
        return res.status(401).json({ error: "Kode akses tidak valid" });
      }
      
      if (row.is_active === 0) {
        return res.status(401).json({ error: "Kode akses sudah tidak aktif" });
      }

      if (row.expires_at) {
        const now = new Date();
        const expiresAt = new Date(row.expires_at.replace(' ', 'T') + 'Z');
        if (now > expiresAt) {
          return res.status(401).json({ error: "Masa berlaku kode akses telah habis" });
        }
      }
      
      let finalSessionId = row.session_id;

      if (finalSessionId) {
        // Code is already bound to a session
        if (finalSessionId !== sessionId) {
          return res.status(401).json({ error: "Kode akses sedang digunakan di perangkat lain" });
        }
      } else {
        // Bind code to new session
        finalSessionId = crypto.randomUUID();
        db.prepare("UPDATE access_codes SET session_id = ? WHERE code = ?").run(finalSessionId, code);
      }
      
      res.json({ success: true, message: "Login berhasil", sessionId: finalSessionId });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/logout", (req, res) => {
    try {
      const { code, sessionId } = req.body;
      if (code && sessionId) {
        db.prepare("UPDATE access_codes SET session_id = NULL WHERE code = ? AND session_id = ?").run(code, sessionId);
      }
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to logout" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
