const express = require('express');
const multer = require('multer');
const path = require('path')
const fs = require('fs');


const app = express();

const cors = require('cors');

// Configure multer to specify where to store uploaded files and other options
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/'); // The directory where uploaded files will be stored
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  });
  
const upload = multer({ storage });


app.use(cors())
app.use(express.json())

// app.get('/',(req,res)=>{
//     res.end('Welcome to fm')
// })
app.delete('/files/delete:filename',(req,res)=>{
    
    // console.log('Delete req',fileName)
    const fileName = req.body.fileName
    const filePath = `uploads/${fileName}`; // Adjust the file path based on your file storage location

    fs.unlink(filePath, (err) => {
        if (err) {
        console.error('Error deleting file: ', err);
        res.status(500).send('Internal Server Error');
        } else {
        res.sendStatus(200);
        }
    });  
});
app.post('/files/delete',(req,res)=>{
    const fileName = req.body.fileName
    console.log('Delete req',req.body)
    const filePath = `uploads/${fileName}`; // Adjust the file path based on your file storage location

    fs.unlink(filePath, (err) => {
        if (err) {
        console.error('Error deleting file: ', err);
        res.status(500).send('Internal Server Error');
        } else {
        res.sendStatus(200);
        }
    });  
});
app.post('/files/upload',upload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }
    const { originalname, size } = req.file;
    console.log('File uploaded')
    res.send(`File ${originalname} uploaded successfully!`);
});

app.get('/files/list',(req,res)=>{
    fs.readdir('uploads', (err, files) => {
        if (err) {
          console.error('Error listing files: ', err);
          res.status(500).send('Internal Server Error');
        } else {
          res.json(files);
        }
      });
});
app.get('/files/download/:fileName', (req, res) => {
    console.log('Download Req',req.params.fileName)
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, 'uploads', fileName); // Adjust the file path based on your file storage location
  
    // Use res.download to initiate the download
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Error downloading file: ', err);
        res.status(500).send('Internal Server Error');
      }
    });
  });

app.listen(1338,()=>{
    console.log('Listening on port 1338')
})