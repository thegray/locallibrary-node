var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var moment = require('moment');

var AuthorSchema = new Schema(
    {
        first_name: { type: String, required: true, max: 100 },
        family_name: { type: String, required: true, max: 100 },
        date_of_birth: { type: Date },
        date_of_death: { type: Date }
    }
);

// Virtual for author's full name
AuthorSchema
    .virtual('name')
    .get(function () {
        return this.family_name + ', ' + this.first_name;
    });

// Virtual for author's url
AuthorSchema
    .virtual('url')
    .get(function () {
        return '/catalog/author/' + this._id;
    });

AuthorSchema
    .virtual('date_of_birth_fmt')
    .get(function () {
        return moment(this.date_of_birth).format('MMMM Do, YYYY');
    });

AuthorSchema
    .virtual('date_of_death_fmt')
    .get(function () {
        return moment(this.date_of_death).format('MMMM Do, YYYY');
    });

AuthorSchema
    .virtual('date_of_birth_yyyy_mm_dd')
    .get(function() {
        return moment(this.date_of_birth).format('YYYY-MM-DD');
    });

AuthorSchema
    .virtual('date_of_death_yyyy_mm_dd')
    .get(function() {
        return moment(this.date_of_death).format('YYYY-MM-DD');
    });

// Export model
module.exports = mongoose.model('Author', AuthorSchema);