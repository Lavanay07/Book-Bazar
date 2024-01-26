const mongoose = require('mongoose');

// Define the Book model schema here
const bookSchema = new mongoose.Schema({
    title: String,
    author: String,
    publicationYear: Number,
    description: String,
    price: Number,
    publisher: String,
    language: String,
    image: String,
    userEmail:String
});
// export const Book=mongoose.model('Book',bookSchema)
module.exports = mongoose.model('Book', bookSchema);
