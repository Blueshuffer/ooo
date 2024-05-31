const express = require('express');
const mysql = require('mysql');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3001;

// ตั้งค่า CORS
app.use(cors());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'imgupload',
    password: 'Ssaa112233++',
    database: 'imgupload'
});

db.connect(err => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// ตรวจสอบและสร้างโฟลเดอร์ uploads ถ้าไม่มีก็สร้าง
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// ตั้งค่า multer เพื่อจัดการการอัปโหลดไฟล์
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // ตรวจสอบชนิดของไฟล์
const allowedTypes = /./; // อนุญาติทุกประเภท
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Error: File type not allowed!');
    }
};

const upload = multer({
    storage,
    limits:
    { fileSize: 1024 * 1024 * 50 }, // จำกัดขนาดไฟล์ที่ 5MB
    fileFilter
});

// ตั้งค่าเส้นทาง API สำหรับการอัปโหลดไฟล์
app.post('/api/upload', upload.array('files', 12), (req, res) => {
    const files = req.files;
    if (!files) {
        return res.status(400).json({ message: 'No files uploaded' });
    }

    const fileData = files.map(file => [file.filename, `public/uploads/${file.filename}`]);

    const sql = 'INSERT INTO files (filename, url) VALUES ?';
    db.query(sql, [fileData], (err, result) => {
        if (err) {
            console.error('Error inserting into database:', err);
            return res.status(500).json({ message: 'Database error' });
        }
      
        res.status(200).json({ status:'ok', message: "Files uploaded successfully", data: result });
    });
});

// ตั้งค่าเส้นทาง API เพื่อดึงข้อมูลไฟล์ที่อัปโหลด
app.get('/api/get', (req, res) => {
    const sql = 'SELECT * FROM files';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching from database:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(results);
    });
});

// ตั้งค่าเส้นทางสำหรับไฟล์ที่อัปโหลด
app.use('/uploads', express.static(uploadDir));







app.delete("/api/delete/:id", (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM files WHERE id = ?", id, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.send(result);
    }
  });
});




app.get("/api/url", (req, res) => {
    db.query("SELECT * FROM urls", (err, result) => {
        if (err) {
            console.error('Error fetching URLs:', err);
            res.status(500).json({ error: 'Failed to retrieve URLs' });
        } else {
            res.json(result);
        }
    });
});






// เริ่มเซิร์ฟเวอร์
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
