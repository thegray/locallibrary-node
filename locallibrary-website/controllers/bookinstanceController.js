const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
var Book = require('../models/book');
var BookInstance = require('../models/bookinstance');

var async = require('async');

var statusBook = ['Maintenance', 'Available', 'Loaned', 'Reserved'];

// Display list of all BookInstances.
exports.bookinstance_list = function (req, res, next) {
    BookInstance.find()
        .populate('book')
        .exec(function (err, list_bookinstances) {
            if (err)
                return next(err);
            res.render('bookinstance_list',
                { title: 'Book Instance List', bookinstance_list: list_bookinstances });
        });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function (req, res) {
    BookInstance.findById(req.params.id)
        .populate('book')
        .exec(function (err, bookinstance) {
            if (err)
                return next(err);
            if (bookinstance == null) {
                var err = new Error('Book copy not found');
                err.status = 404;
                return next(err);
            }

            res.render('bookinstance_detail', { title: 'Book', bookinstance: bookinstance });
        });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function (req, res, next) {
    Book.find({}, 'title')
        .exec(function (err, books) {
            if (err)
                return next(err);
            res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, status: statusBook });
        });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
    body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

    sanitizeBody('book').trim().escape(),
    sanitizeBody('imprint').trim().escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),

    (req, res, next) => {
        const errors = validationResult(req);
        var bookinstance = new BookInstance({
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
        });

        if (!errors.isEmpty()) {
            Book.find({}, 'title')
                .exec(function (err, books) {
                    if (err)
                        return next(err);
                    res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance, status: statusBook });
                });
            return;
        } else {
            bookinstance.save(function (err) {
                if (err)
                    return next(err);
                res.redirect(bookinstance.url);
            });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function (req, res, next) {
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function(err, bookinstance) {
        if (err)
            return next(err);
        if (bookinstance==null) {
            res.redirect('/catalog/bookinstances');
        }
        res.render('bookinstance_delete', { title: 'Delete Bookinstance', bookinstance: bookinstance});
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function (req, res, next) {
    BookInstance.findByIdAndRemove(req.body.bookinstanceid)
    .exec(function(err) {
        if (err)
            return next(err);
        res.redirect('/catalog/bookinstances');
    });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function (req, res, next) {
    async.parallel({
        book: function(callback) {
            Book.find({}, 'title').exec(callback);
        },
        bookinstance: function(callback) {
            BookInstance.findById(req.params.id)
            .populate('book')
            .exec(callback);
        },
    }, function(err, results) {
        if (err)
            return next(err);
        if (results.bookinstance==null) {
            var err = new Error('Book copy not found');
            err.status = 404;
            return next(err);
        }
        //console.log('date:' + results.bookinstance.due_back_yyyy_mm_dd);
        res.render('bookinstance_form', { title: 'Update Instance', book_list: results.book, selected_book: results.bookinstance.book._id, bookinstance: results.bookinstance, status: statusBook });
    });
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
    body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),

    sanitizeBody('book').trim().escape(),
    sanitizeBody('imprint').trim().escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),

    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            Book.find({}, 'title')
                .exec(function (err, books) {
                    if (err)
                        return next(err);
                    res.render('bookinstance_form', { title: 'Update BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance, status: statusBook });
                });
            return;
        } else {
            var bookinstance = new BookInstance({
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back,
                _id:req.params.id
            });
            
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function(err, theinstance) {
                if (err)
                    return next(err);
                res.redirect(theinstance.url);
            });
        }
    }
];