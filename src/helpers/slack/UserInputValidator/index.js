import { WebClient } from '@slack/client';
import { SlackDialogError } from '../../../modules/slack/SlackModels/SlackDialogModels';
import DateDialogHelper from '../../dateHelper';
import TeamDetailsService from '../../../services/TeamDetailsService';

class UserInputValidator {
  static checkWord(word, name) {
    const wordsNumbersOnly = /^[A-Za-z0-9- ,]+$/;
    if (!wordsNumbersOnly.test(word)) {
      return [new SlackDialogError(name, 'Only alphabets, dashes and spaces are allowed.')];
    }
    return [];
  }

  static checkOriginAnDestination(pickup, destination, pickupName, destinationName) {
    if (pickup.toLowerCase() === destination.toLowerCase() && pickup !== 'Others') {
      return [
        new SlackDialogError(pickupName, 'Pickup location and Destination cannot be the same.'),
        new SlackDialogError(destinationName, 'Pickup location and Destination cannot be the same.')
      ];
    }
    return [];
  }

  static checkDate(date, tzOffset) {
    if (this.checkDateFormat(date)) {
      const diff = DateDialogHelper.dateChecker(date, tzOffset);
      if (diff < 0) {
        return [new SlackDialogError('date_time', 'Date cannot be in the past.')];
      }
    }
    return [];
  }

  static checkDateFormat(date) {
    if (!DateDialogHelper.dateFormat(date)) {
      return [new SlackDialogError('date_time',
        'Time format must be in Day/Month/Year format. See hint.')];
    }
    return [];
  }

  static checkLocations(field, optionalField, fieldName, optionalFieldName) {
    const errors = [];
    const locationDescription = fieldName === 'pickup'
      ? 'Pickup location' : 'Destination';

    if (field !== 'Others' && optionalField) {
      errors.push(
        new SlackDialogError(fieldName,
          `You must select 'Others' before entering a new ${locationDescription}.`),
        new SlackDialogError(optionalFieldName,
          `Enter new location here after selecting 'Others' in the ${locationDescription} field.`)
      );
    }
    if (field === 'Others' && !optionalField) {
      errors.push(
        new SlackDialogError(optionalFieldName,
          `You selected 'Others' in the ${locationDescription} field, please enter a new location.`)
      );
    }
    return errors;
  }

  static async fetchUserInformationFromSlack(userId, slackBotOauthToken) {
    const web = new WebClient(slackBotOauthToken);

    const { user } = await web.users.info({
      token: slackBotOauthToken,
      user: userId
    });
    return user;
  }

  static validateLocationEntries(payload) {
    const {
      pickup, othersPickup, destination, othersDestination //eslint-disable-line
    } = payload.submission;
    const errors = [];

    errors.push(...this.checkWord(pickup, 'pickup'));
    errors.push(...this.checkWord(destination, 'destination'));
    errors.push(...this.checkOriginAnDestination(
      pickup,
      destination,
      'pickup',
      'destination'
    ));

    errors.push(...this.checkLocations(pickup, othersPickup, 'pickup', 'othersPickup'));
    errors.push(...this.checkLocations(destination, othersDestination,
      'destination', 'othersDestination'));

    return errors;
  }

  static async validateDateAndTimeEntry(payload) {
    const { dateTime } = payload.submission;
    const errors = [];

    try {
      const slackBotOauthToken = await TeamDetailsService.getTeamDetailsBotOauthToken(payload.team.id);
      const user = await this.fetchUserInformationFromSlack(payload.user.id, slackBotOauthToken);

      errors.push(...this.checkDate(dateTime, user.tz_offset));
      errors.push(...this.checkDateFormat(dateTime));

      return errors;
    } catch (error) {
      throw new Error('There was a problem processing your request');
    }
  }

  static checkUsername(user, name) {
    const username = /[a-zA-Z]$/;
    if (!user || !username.test(user)) {
      return [new SlackDialogError(name, 'Invalid username.')];
    }
    return [];
  }

  static checkPhoneNumber(phoneNumber, name) {
    const num = /^[0-9]{6,16}$/;

    if (!num.test(phoneNumber)) {
      return [new SlackDialogError(name, 'Invalid phone number!')];
    }
    return [];
  }

  static checkNumberPlate(numberPlate, name) {
    const plate = /[A-Z0-9\s]$/;
    let testStr = '';
    if (numberPlate) testStr = numberPlate.toUpperCase();
    if (!plate.test(testStr)) {
      return [new SlackDialogError(name, 'Invalid cab registration number!')];
    }
    return [];
  }

  static validateCabDetails(payload) {
    const { driverName, driverPhoneNo, regNumber } = payload.submission;
    const errors = [];
    errors.push(...this.checkUsername(driverName, 'driverName'));
    errors.push(...this.checkPhoneNumber(driverPhoneNo, 'driverPhoneNo'));
    errors.push(...this.checkNumberPlate(regNumber, 'regNumber'));
    return errors;
  }
}

export default UserInputValidator;