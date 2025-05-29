// server.js
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("comments.db");

app.use(cors());
app.use(bodyParser.json());

// created_at 컬럼 추가 (기존 테이블에는 없는 경우)
db.run(`
  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY,
    name TEXT,
    comment TEXT,
    created_at TEXT
  )
`);

app.get("/comments", (req, res) => {
  db.all("SELECT id, name, comment, created_at FROM comments ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).send(err);
    res.json(rows);
  });
});

app.post("/comments", (req, res) => {
  const { name, comment } = req.body;
  const created_at = new Date().toISOString();
  db.run("INSERT INTO comments (name, comment, created_at) VALUES (?, ?, ?)", [name, comment, created_at], function(err) {
    if (err) return res.status(500).send(err);
    res.status(200).send("Saved");
  });
});

app.delete("/comments/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM comments WHERE id = ?", [id], function(err) {
    if (err) return res.status(500).send(err);
    res.status(200).send("Deleted");
  });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));