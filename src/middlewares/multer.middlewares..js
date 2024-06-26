import multer from "multer";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cd(null, "./public/temp");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: storage,
  //   limits: {
  //     fileSize: 1024 * 1024 * 10,
  //   },
  //   fileFilter(req, file, cb) {
  //     if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
  //       return cb(new Error("Please upload an image"));
  //     }
  //     cb(null, true);
  //   },
});

export { upload };
