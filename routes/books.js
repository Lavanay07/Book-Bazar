const express = require('express');
const router = express.Router();
const Book = require('../models/Book'); // Import the Book model
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configure multer for handling file uploads
const storage = multer.diskStorage({
    // Configuration for file storage
    destination: function (req, file, cb) {
        cb(null, 'public/uploads'); // Store the uploaded images in the "public/uploads" directory
    },
    filename: function (req, file, cb) {
        // cb(null, Date.now() + '-' + file.originalname); // Generate unique file names
        const uniqueFilename = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueFilename);
        // Save the unique filename to the request object so it can be accessed in the route handler
        req.uniqueFilename = uniqueFilename;
    }
});

const upload = multer({ storage: storage });

function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        // User is authenticated
        return next();
    } else {
        // User is not authenticated, display an alert message
        return res.status(401).json({ error: 'You must be logged in to access this feature.' });
    }
}


router.get('/checkAuthentication', isAuthenticated, (req, res) => {
    // If the user is authenticated, return a JSON response
    res.json({ isAuthenticated: true });
});

// Route to add a book
router.post('/addbook', isAuthenticated, upload.single('image'), async (req, res) => {
    // Book addition logic
    const userEmail=req.session.user.email;
    try {
        // Extract book data from the request body and file
        const { title, author, publicationYear, description, price, publisher, language } = req.body;
        // const imagePath = `/uploads/${req.uniqueFilename}`;

        // Save the image file
        // const filename = path.join(__dirname, '/uploads/', req.file.originalname);
        // req.file.save(filename);
        // Get the path of the saved file
        const filename = `/uploads/${req.uniqueFilename}`;

        // Call the Python script to process the image
        const python = spawn('python', ['./script.py', filename]);
        let processedImage;
        python.stdout.on('data', (data) => {
            processedImage = data.toString();
        });
        
        // Wait for the Python script to finish
        python.on('close', async (code) => {
            if (code !== 0) {
                console.error('Python script exited with code', code);
                return res.status(500).json({ success: false, message: 'Internal server error.' });
            }

            // // Delete the original image file
            // fs.unlink(filename, (err) => {
            //     if (err) {
            //         console.error('Error:', err);
            //         return res.status(500).json({ success: false, message: 'Internal server error.' });
            //     }
            // });

            // Create a new book object (assuming you have a schema and model for books in your database)
            const newBook = new Book({
                title,
                author,
                publicationYear,
                description,
                price,
                publisher,
                language,
                image: filename, // Save the path to the processed image in the database
                userEmail
            });

            // Save the book to the database
            await newBook.save();

            res.status(200).json({ success: true, message: 'Book added to the database.' });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
});


module.exports = router;
