import {
  SlackDialog, SlackDialogText, SlackDialogElementWithDataSource
} from '../../SlackModels/SlackDialogModels';
import DialogPrompts from '../../SlackPrompts/DialogPrompts';

class JoinRouteDialogPrompts {
  static async sendFellowDetailsForm(payload, value) {
    const selectManager = new SlackDialogElementWithDataSource('Select Manager', 'manager');

    const dialog = new SlackDialog(
      `join_route_fellowDetails_${value}`, 'Enter Engagement Details', 'submit', true
    );
    const partnerNameText = new SlackDialogText(
      'Partner name', 'partnerName', 'Enter your Partner\'s name', false, 'E.g. Partner Co. LTD'
    );
    const workHoursText = new SlackDialogText(
      'Work hours', 'workHours', '18:00 - 00:00', false, 'hh:mm E.g. 18:00 - 00:00'
    );
    const startDateText = new SlackDialogText(
      'Start date', 'startDate', '12/12/2019', false, 'dd/mm/yyyy E.g. 12/12/2019'
    );
    const endDateText = new SlackDialogText(
      'End date', 'endDate', '12/12/2020', false, 'dd/mm/yyyy E.g. 12/12/2020'
    );
    dialog.addElements([selectManager, partnerNameText, workHoursText, startDateText, endDateText]);
    await DialogPrompts.sendDialog(dialog, payload);
  }
}

export default JoinRouteDialogPrompts;
