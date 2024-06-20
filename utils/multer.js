const multer = require('multer');
const AppError = require('./AppError');


const multerStorage = multer.memoryStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        const ext = file.mimetype.split('/')[1];
        cb(null, `${Date.now()}.${ext}`);
    }
});

const imageFilter = (req, file, cb) => {
    if(file.mimetype.startsWith('image')){
        cb(null, true);
    } else {
        cb(new AppError('Not an IMAGE! Please upload only IMAGE.', 400), false);
    }
}
const imageUpload = multer({
    storage: multerStorage,
    fileFilter: imageFilter
});



module.exports = {
    imageUpload
};