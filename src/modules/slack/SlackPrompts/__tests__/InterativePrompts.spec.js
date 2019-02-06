import InteractivePrompts from '../InteractivePrompts';
import InteractivePromptsHelpers from '../../helpers/slackHelpers/InteractivePromptsHelpers';
import SlackHelpers from '../../../../helpers/slack/slackHelpers';
import {
  SlackButtonsAttachmentFromAList, SlackAttachment, SlackSelectAction,
  SlackButtonAction, SlackCancelButtonAction
} from '../../SlackModels/SlackMessageModels';
import {
  sendBookNewTripMock,
  sendCompletionResponseMock,
} from '../__mocks__/InteractivePrompts.mock';
import LocationPrompts from '../LocationPrompts';
import WebClientSingleton from '../../../../utils/WebClientSingleton';
import BugsnagHelper from '../../../../helpers/bugsnagHelper';

jest.mock('../../../../utils/WebClientSingleton');
jest.mock('../../../slack/events/', () => ({
  slackEvents: jest.fn(() => ({
    raise: jest.fn(),
    handle: jest.fn()
  })),
}));
jest.mock('../../events/slackEvents', () => ({
  SlackEvents: jest.fn(() => ({
    raise: jest.fn(),
    handle: jest.fn()
  })),
  slackEventNames: Object.freeze({
    TRIP_APPROVED: 'trip_approved',
    TRIP_WAITING_CONFIRMATION: 'trip_waiting_confirmation',
    NEW_TRIP_REQUEST: 'new_trip_request',
    DECLINED_TRIP_REQUEST: 'declined_trip_request'
  })
}));

describe('Interactive Prompts test', () => {
  let getWebClient;
  const update = jest.fn(() => {});
  beforeEach(() => {
    getWebClient = jest.spyOn(WebClientSingleton.prototype, 'getWebClient');
    getWebClient.mockImplementationOnce(() => ({
      chat: { update }
    }));
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  it('should sendBookNewTrip Response', (done) => {
    const respond = jest.fn(value => value);
    const payload = jest.fn(() => 'respond');
    const result = InteractivePrompts.sendBookNewTripResponse(payload, respond);
    expect(result).toBe(undefined);
    expect(respond).toHaveBeenCalledWith(sendBookNewTripMock);
    done();
  });

  it('should create view open trips response', (done) => {
    const respond = jest.fn(value => value);
    const result = InteractivePrompts.sendCompletionResponse(respond, 1);
    expect(result).toBe(undefined);
    expect(respond).toHaveBeenCalledWith(sendCompletionResponseMock);

    done();
  });

  it('should send decline response', (done) => {
    const tripInitial = {
      id: 2,
      requestId: null,
      departmentId: 23,
      tripStatus: 'Approved',
      department: null,
      destination: { dataValues: {} },
      origin: { dataValues: {} },
      pickup: { },
      departureDate: null,
      requestDate: new Date(),
      requester: { dataValues: {} },
      rider: { dataValues: { slackId: 2 } },
    };
    InteractivePrompts.sendManagerDeclineOrApprovalCompletion(true, tripInitial, 'timeStamp', 1);
    expect(update).toHaveBeenCalledTimes(1);
    done();
  });

  it('should sendRescheduleCompletion response', (done) => {
    const trip = { dataValues: { id: 1 } };
    const result = InteractivePrompts.sendRescheduleCompletion(trip);

    expect(result).toHaveProperty('attachments');
    done();
  });

  it('should SendRescheduleError response', (done) => {
    const trip = { dataValues: { id: 23 } };
    const result = InteractivePrompts.sendRescheduleError(trip);

    expect(result).toHaveProperty('attachments');
    done();
  });

  it('should SendTripError response', (done) => {
    const result = InteractivePrompts.sendTripError();

    expect(result).toHaveProperty('text', 'Dang! I hit an error with this trip');
    done();
  });

  it('should send upcoming trips', async () => {
    const response = jest.fn();
    const payload = {
      user: { id: 1 },
      actions: [{
        name: 'page_1',
        value: 'xxxx'
      }]
    };
    const trip = {
      origin: { address: '' },
      destination: { address: '' },
      requester: { slackId: 1, name: '' }
    };
    const trips = [trip];
    InteractivePrompts.sendUpcomingTrips(trips, 20, 10, payload, response);
    expect(response).toBeCalledTimes(1);
  });

  it('should send rider select list', () => {
    const response = jest.fn();
    InteractivePrompts.sendRiderSelectList({ channel: { id: 1 }, user: { id: 2 } }, response);
    expect(response).toBeCalledTimes(1);
  });

  it('should send list of departments', async () => {
    const response = jest.fn();
    SlackHelpers.getDepartments = jest.fn(() => 'attachment');
    SlackButtonsAttachmentFromAList.createAttachments = jest.fn(() => []);
    const props = {
      payload: { channel: { id: 1 }, user: { id: 2 }, team: { id: '45THKULE' } },
      respond: response,
      attachmentCallbackId: 'aata',
      navButtonCallbackId: 'atab',
      navButtonValue: 'io'
    };

    await InteractivePrompts.sendListOfDepartments(props);
    expect(response).toBeCalledTimes(1);
  });

  it('should send list of departments with forSelf as [false]', async () => {
    const response = jest.fn();
    SlackHelpers.getDepartments = jest.fn(() => 'attachment');
    SlackButtonsAttachmentFromAList.createAttachments = jest.fn(() => []);
    const props = {
      payload: { channel: { id: 1 }, user: { id: 2 }, team: { id: '45THKULE' } },
      respond: response,
      attachmentCallbackId: 'aata',
      navButtonCallbackId: 'atab',
      navButtonValue: 'io'
    };

    await InteractivePrompts.sendListOfDepartments(props, 'false');
    expect(response).toBeCalledTimes(1);
  });
  describe('sendOpsDeclineOrApprovalCompletion', () => {
    const tripInfo = {
      decliner: {
        dataValues: {
          slackId: 'XXXXXXX'
        }
      },
      rider: {
        dataValues: {

        }
      },
      origin: {
        dataValues: {

        }
      },
      destination: {
        dataValues: {

        }
      },
      requester: {
        dataValues: {

        }
      },
      department: {
        dataValues: {

        }
      },
      confirmer: {
        slackId: 'XXXXXXXXX'
      },
      cab: {
        dataValues: {
          driverName: 'Dave',
          driverPhoneNo: '2345678',
          regNumber: 'GE 890 DSX'
        }
      }
    };
    it('should send ops decline or approval', async (done) => {
      await InteractivePrompts.sendOpsDeclineOrApprovalCompletion(
        false, tripInfo, '3456787654.3456787654', 'DM45676543', 'just a token'
      );
      expect(update).toHaveBeenCalledTimes(1);
      done();
    });
    it('should handle errors', async (done) => {
      const log = jest.spyOn(BugsnagHelper, 'log');
      const error = new Error('Async error');
      update.mockRejectedValue(error);
      await InteractivePrompts.sendOpsDeclineOrApprovalCompletion(
        false, tripInfo, '3456787654.3456787654', 'DM45676543', 'just a token'
      );
      expect(update).toHaveBeenCalledTimes(1);
      expect(log).toHaveBeenCalledTimes(1);
      expect(log).toHaveBeenCalledWith(error);
      done();
    });
  });
});

describe('test send add passenger response', () => {
  it('should provide an interface to add passengers', (done) => {
    const respond = jest.fn(value => value);
    InteractivePrompts.sendAddPassengersResponse(respond);
    expect(respond).toHaveBeenCalled();
    done();
  });
});

describe('test send add passenger response with forSelf as [false]', () => {
  it('should provide an interface to add passengers', (done) => {
    const respond = jest.fn(value => value);
    InteractivePrompts.sendAddPassengersResponse(respond, false);
    expect(respond).toHaveBeenCalled();
    done();
  });
});

describe('test send preview response and cancel response', () => {
  beforeEach(() => {
    InteractivePromptsHelpers.generatePreviewTripResponse = jest.fn(() => 'called');
  });

  it('should send preview response', () => {
    const respond = jest.fn(value => value);
    InteractivePrompts.sendPreviewTripResponse('trip', respond);
    expect(respond).toBeCalled();
  });
});

describe('LocationPrompts', () => {
  let fieldsOrActionsSpy;
  let optionalPropsSpy;

  beforeEach(() => {
    fieldsOrActionsSpy = jest.spyOn(SlackAttachment.prototype, 'addFieldsOrActions');
    optionalPropsSpy = jest.spyOn(SlackAttachment.prototype, 'addOptionalProps');
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('sendLocationSuggestionResponse', () => {
    const backButtonAction = new SlackButtonAction(
      'back', '< Back', 'back_to_routes_launch', '#FFCCAA'
    );
    const cancelButtonAction = new SlackCancelButtonAction();

    it('should sendLocationSuggestionResponse: atleast one prediction location', () => {
      const predictedLocations = [{ text: 'Location1', value: 'place_id' }];
      const selectedActions = new SlackSelectAction('predictedLocations',
        'Select Home location', predictedLocations);
      const buttonAction = new SlackButtonAction('no', 'Location not listed', 'no');
      LocationPrompts.sendLocationSuggestionsResponse(
        'https://staticMap',
        predictedLocations
      );
      expect(fieldsOrActionsSpy).toBeCalledWith('actions', [selectedActions, buttonAction]);
      expect(fieldsOrActionsSpy).toBeCalledWith('actions', [backButtonAction, cancelButtonAction]);
      expect(optionalPropsSpy).toBeCalledWith('new_route_suggestions', '', '#3AAF85');
      expect(optionalPropsSpy).toBeCalledWith('back_to_launch', undefined, '#4285f4');
    });

    it('sendLocationSuggestionResponse: empty PredictionLocations', () => {
      const selectedActions = new SlackButtonAction('retry', 'Try Again', 'retry');
      const buttonAction = new SlackButtonAction('no', 'Enter Location Coordinates', 'no');
      LocationPrompts.sendLocationSuggestionsResponse(
        'https://staticMap',
        []
      );
      expect(fieldsOrActionsSpy).toBeCalledWith('actions', [selectedActions, buttonAction]);
      expect(fieldsOrActionsSpy).toBeCalledWith('actions', [backButtonAction, cancelButtonAction]);
      expect(optionalPropsSpy).toBeCalledWith('new_route_locationNotFound', '', '#3AAF85');
      expect(optionalPropsSpy).toBeCalledWith('back_to_launch', undefined, '#4285f4');
    });
  });

  it('should sendLocationConfirmationResponse', () => {
    const respond = jest.fn(value => value);
    LocationPrompts.sendLocationConfirmationResponse(
      respond,
      'https://staticMap',
      'test location',
      '1,1'
    );
    expect(respond).toBeCalled();
  });

  it('should sendLocationCoordinatesNotFound', () => {
    const respond = jest.fn(value => value);
    LocationPrompts.sendLocationCoordinatesNotFound(respond);
    expect(respond).toBeCalled();
  });
  describe('InteractivePrompts_sendTripHistory', () => {
    const respond = jest.fn();
    beforeEach(() => {
      jest.spyOn(InteractivePromptsHelpers, 'formatTripHistory').mockReturnValue([]);
    });
    it('Should trip histroy Dialog', () => {
      InteractivePrompts.sendTripHistory([], 2, 1, [], respond);
      expect(InteractivePromptsHelpers.formatTripHistory).toBeCalled();
    });
  });
});
