import multer from "multer";

const fileFilter = (req, file, cb) => {
  // console.log(file.mimetype)
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
      cb(null, true); // Accept the file
    } else {
      cb(new Error('Only .png and .jpg format allowed!'), false); // Reject the file
    }
  };

const multerUpload = multer({limits: {
    fileSize: 1024 * 1024 * 5,
},
fileFilter: fileFilter
})

export const singleAvatar = multerUpload.single("avatar");