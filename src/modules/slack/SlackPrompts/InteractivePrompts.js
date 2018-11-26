import {
  SlackInteractiveMessage,
  SlackAttachment, SlackButtonAction, SlackCancelButtonAction
} from '../SlackModels/SlackMessageModels';
import slackInteractionsHelpers from '../../../helpers/slack/navButtons';

class InteractivePrompts {
  static sendBookNewTripResponse(payload, respond) {
    const attachment = new SlackAttachment();

    // main buttons
    attachment.addFieldsOrActions('actions', [
      new SlackButtonAction('yes', 'For Me', 'true'),
      new SlackButtonAction('no', 'For Someone', 'false'),
    ]);

    attachment.addOptionalProps('book_new_trip');

    // add navigation buttons
    const navAttachment = slackInteractionsHelpers(
      'back_to_launch', 'back_to_launch'
    );

    const message = new SlackInteractiveMessage('Who are you booking for?',
      [attachment, navAttachment]);
    respond(message);
  }

  static sendCompletionResponse(payload, respond, requestId) {
    const requester = payload.user.id;
    const rider = payload.submission.rider || 'self';

    const attachment = new SlackAttachment();
    attachment.addFieldsOrActions('actions', [
      // sample button actions
      new SlackButtonAction('view', 'View', `${requester} ${rider}`),
      new SlackButtonAction('reschedule', 'Reschedule ', requestId),
      new SlackCancelButtonAction('Cancel Trip', requestId, 'Are you sure you want to cancel this trip', 'cancel_trip'),
      new SlackCancelButtonAction()
    ]);

    attachment.addOptionalProps('itinerary_actions');

    const message = new SlackInteractiveMessage('Success! Your request has been submitted.', [attachment]);
    respond(message);
  }

  static sendRescheduleCompletion(trip) {
    const attachments = new SlackAttachment();
    attachments.addFieldsOrActions('actions', [
      new SlackButtonAction('view', 'View', 'view'),
      new SlackButtonAction('reschedule', 'Reschedule ', trip.dataValues.id),
      new SlackCancelButtonAction('Cancel Trip', trip.dataValues.id, 'Are you sure you want to cancel this trip', 'cancel_trip'),
      new SlackCancelButtonAction()
    ]);
    attachments.addOptionalProps('itinerary_actions');
    return new SlackInteractiveMessage('Success! Your request has been submitted.', [attachments]);
  }

  static sendRescheduleError(trip) {
    const attachments = new SlackAttachment();
    attachments.addFieldsOrActions('actions', [
      new SlackButtonAction('reschedule', 'Try Again', trip.dataValues.id)
    ]);
    attachments.addOptionalProps('itinerary_actions');
    return new SlackInteractiveMessage('Oh! I was unable to save this trip', [attachments]);
  }

  static sendTripError() {
    return new SlackInteractiveMessage('Dang! I hit an error with this trip');
  }

  static sendTripItinerary(payload, respond) {
    const attachment = new SlackAttachment();

    // main buttons
    attachment.addFieldsOrActions('actions', [
      new SlackButtonAction('history', 'Trip History', 'view_trips_history'),
      new SlackButtonAction('upcoming', 'Upcoming Trips ', 'view_upcoming_trips')
    ]);

    attachment.addOptionalProps('fallback', 'trip_itinerary', '#FFCCAA', 'default');

    // add navigation buttons
    const navAttachment = slackInteractionsHelpers(
      'back_to_launch', 'back_to_launch'
    );

    const message = new SlackInteractiveMessage('Please choose an option',
      [attachment, navAttachment]);
    respond(message);
  }
}

export default InteractivePrompts;
