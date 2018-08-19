const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
var Genre = require('../models/genre');
var Book = require('../models/book');
var async = require('async');
var mongoose = require('mongoose');

// Display list of all Genre.
exports.genre_list = function (req, res, next) {
    Genre.find()
        .sort([['name', 'ascending']])
        .exec(function (err, genre_list) {
            if (err)
                return next(err);
            res.render('genre_list', {title: 'Genre List', list_genre: genre_list });
        });
};

// Display detail page for a specific Genre.
exports.genre_detail = function (req, res, next) {
    var id = mongoose.Types.ObjectId(req.params.id);
    async.parallel({
        genre: function (callback) {
            Genre.findById(id)
                .exec(callback);
        },
        genre_books: function (callback) {
            Book.find({ 'genre': id })
                .exec(callback);
        },
    }, function (err, results) {
        if (err)
            return next(err);
        if (results.genre == null) {
            var err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }

        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books });
        });
};

// Display Genre create form on GET.
exports.genre_create_get = function (req, res, next) {
    res.render('genre_form', {title: 'Create Genre' });
};

// Handle Genre create on POST.
exports.genre_create_post = [ // this is array of middleware functions
    // Validate that the name field is not empty
    body('name', 'Genre name required').isLength({ min: 1 }).trim(),

    // Sanitize (trim and escape) the name field
    sanitizeBody('name').trim().escape(),

    // Process request after validation and sanitization
    (req, res, next) => {
        // extract the validation errors from a request
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data
        var genre = new Genre(
            { name: req.body.name }
        );

        if (!errors.isEmpty()) {
            // Errors exists, render the form again with sanitized value/error messages
            res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array() });
            return;
        }
        else {
            // Data from form is valid
            // Check if genre with same name already exists
            Genre.findOne({ 'name': req.body.name })
                .exec(function (err, found_genre) {
                    if (err)
                        return next(err);
                    if (found_genre) {
                        res.redirect(found_genre.url);
                    } else {
                        genre.save(function (err) {
                            if (err)
                                return next(err);
                            res.redirect(genre.url);
                        });
                    }
                })
        }
    }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function (req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id).exec(callback)
        },
        genres_books: function(callback) {
            Book.find({'genre': req.params.id}).exec(callback)
        },
    }, function(err, results) {
        if (err)
            return next(err);
        if (results.genre==null) {
            res.redirect('/catalog/genres');
        }
        res.render('genre_delete', { title: 'Delete Genre', genre:results.genre, genre_books:results.genres_books});
    });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function (req, res, next) {
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.body.genreid).exec(callback)
        },
        genres_books: function(callback) {
            Book.find({ 'genre' : req.body.genreid }).exec(callback)
        },
    }, function(err, results) {
        if (err)
            return next(err);
        if (results.genres_books.length > 0) {
            res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genres_books});
            return
        } else {
            Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err) {
                if (err)
                    return next(err);
                res.redirect('/catalog/genres');
            });
        }
    });
};

// Display Genre update form on GET.
exports.genre_update_get = function (req, res, next) {
    Genre.findById(req.params.id)
    .exec(function(err, genre) {
        if (err)
            return next(err);
        if (genre==null)
        {
            var err = new Error('Genre not found');
            err.status(404);
            return next(err);
        }
        res.render('genre_form', {title: 'Create Genre', genre: genre });
    });
};

// Handle Genre update on POST.
exports.genre_update_post = [
    // Validate that the name field is not empty
    body('name', 'Genre name required').isLength({ min: 1 }).trim(),

    // Sanitize (trim and escape) the name field
    sanitizeBody('name').trim().escape(),

    // Process request after validation and sanitization
    (req, res, next) => {
        // extract the validation errors from a request
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // Errors exists, render the form again with sanitized value/error messages
            res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array() });
            return;
        }
        else {
            // Data from form is valid
            // Check if genre with same name already exists
            Genre.findOne({ 'name': req.body.name })
                .exec(function (err, found_genre) {
                    if (err)
                        return next(err);
                    if (found_genre) {
                        res.redirect(found_genre.url);
                    } else {
                        var genre = new Genre(
                            { 
                                name: req.body.name,
                                _id: req.params.id
                            }
                        );

                        Genre.findByIdAndUpdate(req.params.id, genre, {}, function(err, thegenre) {
                            if (err)
                                return next(err);
                            res.redirect(thegenre.url);
                        });
                    }
                })
        }
    }
];