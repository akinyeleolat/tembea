const moment = require('moment');
const fs = require('fs');
const DateHelpers = require('../helpers/dateHelper');

moment.updateLocale('en', {
  weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
});

class Utils {
  static formatDate(dateStr) {
    const date = new Date(dateStr);
    return moment(date).format('ddd, MMM Do YYYY hh:mm a');
  }

  static getPreviousMonth() {
    return moment().date(0).format('MMM, YYYY');
  }

  static formatDateForDatabase(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return dateStr;
    const formattedDate = DateHelpers.changeDateFormat(dateStr);
    const date = new Date(formattedDate).getTime();
    return moment(date).format('YYYY-MM-DD HH:mm:ss');
  }

  static nextAlphabet(firstChar) {
    const char = firstChar.toUpperCase();
    return String.fromCharCode(char.charCodeAt(0) + 1);
  }

  static writableToReadableStream(writableStream) {
    return fs.createReadStream(writableStream.path);
  }

  static removeHoursFromDate(noOfHours, date) {
    const rawDate = moment(date, 'DD/MM/YYYY HH:mm').subtract(noOfHours, 'hours');
    return rawDate.format('DD/MM/YYYY HH:mm');
  }

  static chunkArray(array, number) {
    if (!Array.isArray(array) || !array.length) {
      return [];
    }
    return [array.slice(0, number)].concat(this.chunkArray(array.slice(number), number));
  }

  static convertMinutesToSeconds(minutes) {
    return 1000 * 60 * minutes;
  }
}

module.exports = Utils;
