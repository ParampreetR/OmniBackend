const multer = require("multer");
const fs = require("fs");

const ClientFileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync("images")) {
      fs.mkdirSync("images");
    }

    cb(null, "images/");
  },

  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const uploadClientFile = multer({
  storage: ClientFileStorage,
  limits: { fileSize: 1024 * 1024 * 10 },
});

module.exports = { uploadClientFile };
