const Express = require("express");
const sessions = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const db = new sqlite3.Database("./data.db");
const { uploadClientFile } = require("./multerConfig");
const cookieParser = require("cookie-parser");

// let loggedIn = null;

const app = Express();
// let uid = 2;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(
  bodyParser.json({
    extended: true,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());

app.use(
  sessions({
    secret: "this is the secret of cookies that will be encrypted",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      domain: "",
    },
  })
);

const middleware = (req, res, next) => {
  if (req.session.userid) {
    next();
  }
};

app.get("/", (req, res) => {
  res.send(req.session.id);
  res.send("");
});

app.get("/isLoggedIn", (req, res) => {
  console.log(req.session.userid);
  // res.send(); //temp
  if (req.session.userid) {
    console.log("User id loggedin " + req.session.userid);
    res.send();
  } else {
    res.status(401);
    res.send();
  }
});

app.get("/logout", (req, res) => {
  // loggedIn = null;
  delete req.session.userid;
  res.send();
});

app.post("/login", (req, res) => {
  if (!req.body.username || !req.body.password) {
    res.status(500);
    res.send();
  }

  db.get(
    "SELECT * FROM Users WHERE username = ? AND password = ?",
    [req.body.username, req.body.password],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(401);
        res.send();
      } else {
        if (!result) {
          res.send(401);
          res.send();
          return;
        }

        console.log("session set");
        req.session.userid = result.id;
        // loggedIn = result.id;

        res.send();
      }
    }
  );
});

app.get("/getUserInfo", middleware, (req, res) => {
  if (!req.session.userid) {
    res.status(401);
    res.send();
  }

  // console.log("User id is " + req.session.userid);

  db.get(
    "SELECT * FROM Users WHERE id = ?",
    [req.session.userid],
    (err, result) => {
      if (!err) {
        console.log(result);
        res.send(result);
      } else {
        console.error(err);
        res.status(500);
        res.send();
      }
    }
  );
});

app.post("/register", (req, res) => {
  console.log(req.body);
  db.run(
    "INSERT INTO Users(name, username, password, address, phone) values (?, ?, ?, '', '')",
    [req.body.name, req.body.username, req.body.password],
    (err) => {
      if (err) {
        console.log(err);
        res.status(500);
        res.send("Server error");
      } else {
        // uid++;
        console.log("registered");
        res.send();
      }
    }
  );
});

app.post("/editUser", uploadClientFile.single("file"), (req, res) => {
  console.log("Image updates for user with ID " + req.session.userid);

  db.run(
    "UPDATE Users SET name = ?, image = ? ,username = ?, address = ?, phone = ?, password = ? WHERE id = ?",
    [
      req.body.name,
      req.file ? req.file.originalname : undefined,
      req.body.username,
      req.body.address,
      req.body.phone,
      req.body.password,
      req.session.userid,
    ],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500);
      } else {
        console.log(result);
        res.send();
      }
    }
  );
});

app.post("/post", uploadClientFile.single("file"), (req, res) => {
  console.log(req);
  db.run(
    "INSERT INTO Posts(title, image, description) values (?, ?, ?)",
    [
      req.body.title,
      req.file ? req.file.originalname : undefined,
      req.body.description,
    ],
    (err) => {
      if (err) {
        console.log(err);
        res.status(500);
        res.send("Server error");
      } else {
        // uid++;
        console.log("registered");
        res.send();
      }
    }
  );
});

app.get("/getImage/:name", (req, res) => {
  console.log(req.params);
  try {
    res.sendFile(__dirname + "/images/" + req.params.name);
  } catch (err) {
    console.error(err);
    res.status(500);
    res.send();
  }
});

app.post("/editPost", (req, res) => {
  console.log(req.body);
  db.run(
    "UPDATE Posts SET title = ?, description = ? WHERE id = ?",
    [req.body.title, req.body.description, req.body.id],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500);
      } else {
        console.log(result);
        res.send();
      }
    }
  );
});

app.delete("/post/:id", (req, res) => {
  console.log(req.params.id);

  db.get("DELETE FROM Posts WHERE id=?", [req.params.id], (err, result) => {
    if (!err) {
      console.log(err, result);
      res.send();
    } else {
      res.status(500);
      res.send();
    }
  });
});

app.get("/posts", (req, res) => {
  db.all("SELECT * FROM Posts", (err, result) => {
    if (!err) {
      console.log(err, result);
      res.send(result);
    }
  });
});

app.listen(8080, () => {
  db.serialize(() => {
    db.run(
      "CREATE TABLE IF NOT EXISTS Users  (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, name TEXT, username TEXT, password TEXT, image TEXT, address TEXT, phone TEXT)"
    );
    db.run(
      "CREATE TABLE IF NOT EXISTS Posts (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, userid TEXT, title TEXT, image TEXT, description TEXT)"
    );
  });

  console.log("backend live at https://localhost:8080");
});
