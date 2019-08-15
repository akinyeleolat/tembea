import { getAction } from './rootFile';
import bugsnagHelper from '../../../helpers/bugsnagHelper';
import RouteRequestService from '../../../services/RouteRequestService';
import DialogPrompts from '../SlackPrompts/DialogPrompts';
import { SlackInteractiveMessage } from '../SlackModels/SlackMessageModels';
import ManagerFormValidator from '../../../helpers/slack/UserInputValidator/managerFormValidator';
import OperationsNotifications from '../SlackPrompts/notifications/OperationsRouteRequest/index';
import CleanData from '../../../helpers/cleanData';
import OperationsHelper from '../helpers/slackHelpers/OperationsHelper';
import SlackNotifications from '../SlackPrompts/Notifications';
import { providerErrorMessage } from '../../../helpers/constants';
import SlackHelpers from '../../../helpers/slack/slackHelpers';
import TripHelper from '../../../helpers/TripHelper';
import TripCompletionJob from '../../../services/jobScheduler/jobs/TripCompletionJob';
import InteractivePrompts from '../SlackPrompts/InteractivePrompts';
import TeamDetailsService from '../../../services/TeamDetailsService';
import tripService from '../../../services/TripService';
import RouteHelper from '../../../helpers/RouteHelper';
import UserService from '../../../services/UserService';

const handlers = {
  decline: async (payload) => {
    const { actions, channel: { id: channelId }, original_message: { ts: timeStamp } } = payload;
    const [{ value: routeRequestId }] = actions;

    const { botToken, routeRequest } = await RouteRequestService
      .getRouteRequestAndToken(routeRequestId, payload.team.id);

    const declined = routeRequest.status === 'Declined';
    const approved = routeRequest.status === 'Approved';

    if (approved || declined) {
      OperationsNotifications.updateOpsStatusNotificationMessage(payload, routeRequest, botToken);
      return;
    }

    const state = {
      decline: {
        timeStamp,
        channelId,
        routeRequestId
      }
    };

    DialogPrompts.sendReasonDialog(payload,
      'operations_route_declinedRequest',
      JSON.stringify(state), 'Decline', 'Decline', 'declineReason', 'route');
  },
  declinedRequest: async (data, respond) => {
    try {
      const payload = CleanData.trim(data);
      const { submission: { declineReason }, team: { id: teamId } } = payload;
      const { decline } = JSON.parse(payload.state);
      const { timeStamp, channelId, routeRequestId } = decline;
      const {
        slackBotOauthToken: oauthToken, routeRequest
      } = await RouteRequestService.getRouteRequestAndToken(routeRequestId, teamId);
      const updatedRequest = await RouteHelper.updateRouteRequest(routeRequest.Id,
        { status: 'Declined', opsComment: declineReason });
      await OperationsNotifications.completeOperationsDeclineAction(
        updatedRequest, channelId, teamId, routeRequestId,
        timeStamp, oauthToken, payload, respond, false
      );
    } catch (error) {
      bugsnagHelper.log(error);
      respond(
        new SlackInteractiveMessage('Unsuccessful request. Kindly Try again')
      );
    }
  },
  approve: async (data) => {
    const payload = CleanData.trim(data);
    const { actions, channel: { id: channelId }, original_message: { ts: timeStamp } } = payload;
    const [{ value: routeRequestId }] = actions;

    const { botToken, routeRequest, routeRequest: { status } } = await RouteRequestService
      .getRouteRequestAndToken(routeRequestId, payload.team.id);

    const declined = status === 'Declined';
    const approved = status === 'Approved';

    if (approved || declined) {
      await OperationsNotifications.updateOpsStatusNotificationMessage(
        payload, routeRequest, botToken
      );
      return;
    }
    const state = { approve: { timeStamp, channelId, routeRequestId } };
    try {
      await DialogPrompts.sendOperationsNewRouteApprovalDialog(payload, state);
    } catch (error) {
      await SlackNotifications.sendNotification(
        SlackNotifications.createDirectMessage(channelId, providerErrorMessage), botToken
      );
    }
  },
  approvedRequest: async (data, respond) => {
    try {
      const payload = CleanData.trim(data);
      const errors = ManagerFormValidator.approveRequestFormValidation(payload);
      if (errors.length > 0) { return { errors }; }
      const {
        team: { id: teamId }, user: { id: opsSlackId }, submission, state
      } = payload;

      const { id: opsUserId } = await UserService.getUserBySlackId(opsSlackId);
      const { approve: { channelId, timeStamp, routeRequestId } } = JSON.parse(state);

      const { botToken } = await TeamDetailsService.getTeamDetails(teamId);
      const updatedRequest = await RouteHelper.updateRouteRequest(routeRequestId, {
        opsReviewerId: opsUserId, opsComment: submission.opsComment, status: 'Approved',
      });

      const result = await RouteHelper.createNewRouteBatchFromSlack(
        submission, routeRequestId
      );
      await UserService.updateUser(updatedRequest.engagement.fellow.id, { routeBatchId: result.batch.id });
      await OperationsHelper.completeRouteApproval(updatedRequest, result, {
        channelId, opsSlackId, timeStamp, submission, botToken
      });
    } catch (error) {
      bugsnagHelper.log(error);
      respond(new SlackInteractiveMessage('Unsuccessful request. Kindly Try again'));
    }
  }
};

class OperationsHandler {
  static operationsRouteController(action) {
    const errorHandler = (() => {
      throw new Error(`Unknown action: operations_route_${action}`);
    });
    return handlers[action] || errorHandler;
  }

  static async handleOperationsActions(data, respond) {
    try {
      const payload = CleanData.trim(data);
      const action = getAction(payload, 'actions');
      const actionHandler = OperationsHandler.operationsRouteController(action);
      return actionHandler(payload, respond);
    } catch (error) {
      bugsnagHelper.log(error);
      respond(new SlackInteractiveMessage('Error:bangbang:: I was unable to do that.'));
    }
  }
  /**
   * Complete the assignment of cab and driver to a trip request
   * Update transaction state in cache and db
   * create a trip scheduler
   * Send notifications to requester, rider, ops channel and manager
   *
   * @param {object} data request object from slack
   */

  static async completeOpsAssignCabDriver(data) {
    const {
      submission: {
        driver, driverNumber, cab: model, regNumber, confirmationComment
      }, team: { id: teamId }, user: { id: userId }, state, channel
    } = data;
    const { tripId, timeStamp: ts } = JSON.parse(state);
    const { id: opsUserId } = await SlackHelpers.findOrCreateUserBySlackId(userId, teamId);
    const timeStamp = TripHelper.convertApprovalDateFormat(ts);
    const updateTripStatusPayload = OperationsHelper
      .getUpdateTripStatusPayload(tripId, confirmationComment, opsUserId, timeStamp);
    try {
      const trip = await tripService
        .updateRequest(tripId, updateTripStatusPayload);
      const { rider: { slackId: riderSlackId }, requester: { slackId: requesterSlackId } } = trip;
      TripCompletionJob.createScheduleForATrip(trip);
      const slackBotOauthToken = await TeamDetailsService.getTeamDetailsBotOauthToken(teamId);
      const tripInformation = { ...trip, cab: { model, regNumber }, driver: { driverName: driver, driverPhoneNo: driverNumber } };
      const driverDetails = `,${driver},${driverNumber}`;
      const message = 'Thank you for completing this trip request';
      const tripDetailsAttachment = OperationsHelper.getTripDetailsAttachment(tripInformation, driverDetails);
      InteractivePrompts.messageUpdate(channel.id, message, ts, [tripDetailsAttachment], slackBotOauthToken);
      OperationsHelper.sendcompleteOpAssignCabMsg(teamId, { requesterSlackId, riderSlackId }, tripInformation);
    } catch (error) { bugsnagHelper.log(error); }
  }
}

export { handlers, OperationsHandler };
