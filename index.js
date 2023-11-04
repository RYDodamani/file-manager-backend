const express = require('express');
const multer = require('multer');
const path = require('path')
const fs = require('fs');
const fileUpload = require('express-fileupload')
const { S3Client, PutObjectCommand, GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand
 } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
    region: 'ap-south-1',
    credentials: {
        accessKeyId: 'AKIAQVEVHERX5CM6TFQH',
        secretAccessKey: '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'
    }
})


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

app.use((req,res,next)=>{
  // let r = req;
  // delete r.socket
  console.log('New Req at',req.url,req.params);
  next();
})
app.use(cors())
app.use(express.json())
app.use('/files/uploadToS3',fileUpload());

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
app.post('/files/deleteS3', async (req, res)=>{
  const command = {
    Bucket: 'elasticbeanstalk-ap-south-1-045410100335',
    Key: 'fileuploads/'+req.body.fileName
  }
  console.log('S3 Delete command',command)

  try{
    const deleteresp = await s3Client.send(new DeleteObjectCommand(command))
    console.log('Delete Response',deleteresp)
    res.status(200).send("Deleted")
  }
  catch(e){

  }

})
app.post('/files/upload',upload.single('file'), (req, res) => {
    console.log('Local Upload')
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }
    const { originalname, size } = req.file;
    console.log('File uploaded')
    res.send(`File ${originalname} uploaded successfully!`);
});

app.post('/files/uploadToS3', async (req, res) => {
    const file = req.files.file;
    console.log('File',file)
    const params = {
        Bucket: 'elasticbeanstalk-ap-south-1-045410100335',
        Key: 'fileuploads/'+file.name,
        Body: file.data,
        ACL: 'public-read-write'
    }

    try{
        const data = await s3Client.send(new PutObjectCommand(params))
        // console.log('Upload s3 resp',data)
        res.end('File uploaded successfully!');
    }
    catch(err){
        console.log('Fail Upload',err)
    }
    
});
app.get('/files/listS3', async (req, res) => {
    console.log('List S3 req')
    const params = {
        Bucket: 'elasticbeanstalk-ap-south-1-045410100335',
        // Key: 'fileuploads/Clark Kent_ARC Connect.pdf'
        MaxKeys: 10,
        Prefix: 'fileuploads'
    };

    try{
        const command = new ListObjectsV2Command(params);
        const response = await s3Client.send(command);
        // console.log('List S3 res',response);
        res.json(response)
    }
    catch(err){
        console.log('List err',err)
        res.end('List err')
    }
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
app.get('/files/downloadS3/:key', async (req,res) => {
  console.log('S3 file download req',req.params);
  const command = new GetObjectCommand({
    Bucket: 'elasticbeanstalk-ap-south-1-045410100335',
    Key: 'fileuploads/'+req.params.key
  });
  /* // Opens The file instead
  try{
    const response = await s3Client.send(command);
    const body = response.Body;
    body.pipe(res)
  }
  catch(e){

  }
  */

  try{
    const response = await s3Client.send(command);
    const body = response.Body;
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.key}"`);
    res.setHeader('Content-Type',response.ContentType);
    body.pipe(res)
  }
  catch(e){
    
  }
  
})
app.listen(1338,()=>{
    console.log('Listening on port 1338')
})