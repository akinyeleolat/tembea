
import {
  SlackDialogModel, SlackDialogSelectElementWithOptions,
  SlackDialog, SlackDialogText, SlackDialogElementWithDataSource
} from '../SlackModels/SlackDialogModels';
import dateDialogHelper from '../../../helpers/dateHelper';

import departments from '../data';
import WebClientSingleton from '../../../utils/WebClientSingleton';

const web = new WebClientSingleton();

class DialogPrompts {
  static sendTripDetailsForm(payload, forSelf) {
    const dialog = new SlackDialog('schedule_trip_form', 'Trip Details', 'Submit');
    const hint = `Enter date in Month/Day/Year format,
    leave a space and enter time in Hour:Minutes format. e.g 11/22/2018 22:00`;

    if (forSelf === 'false') {
      dialog.addElements([
        new SlackDialogElementWithDataSource('Rider\'s name', 'rider')
      ]);
    }

    dialog.addElements([
      new SlackDialogSelectElementWithOptions('Rider\'s department', 'department', departments),
      new SlackDialogText('Pickup location', 'pickup', 'Enter rider\'s pickup location'),
      new SlackDialogText('Destination', 'destination', 'Enter rider\'s destination'),
      new SlackDialogText('Date and Time', 'date_time', 'mm/dd/yy hh:mm', hint)
    ]);

    const dialogForm = new SlackDialogModel(payload.trigger_id, dialog);
    web.getWebClient().dialog.open(dialogForm);
  }

  static sendRescheduleTripForm(payload, callbackId, state, dialogName) {
    const dialog = new SlackDialog(callbackId || payload.callback_id,
      dialogName, 'submit', true, state);

    dialog.addElements(dateDialogHelper.generateDialogElements());

    const dialogForm = new SlackDialogModel(payload.trigger_id, dialog);
    
    web.getWebClient().dialog.open(dialogForm);
  }
}

export default DialogPrompts;