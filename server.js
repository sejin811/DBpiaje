// server.js
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("comments.db");

app.use(cors());
app.use(bodyParser.json());

db.run("CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY, name TEXT, comment TEXT)");

app.get("/comments", (req, res) => {
  db.all("SELECT name, comment FROM comments", (err, rows) => {
    if (err) return res.status(500).send(err);
    res.json(rows);
  });
});

app.post("/comments", (req, res) => {
  const { name, comment } = req.body;
  db.run("INSERT INTO comments (name, comment) VALUES (?, ?)", [name, comment], function(err) {
    if (err) return res.status(500).send(err);
    res.status(200).send("Saved");
  });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));

app.use(express.static("public"));