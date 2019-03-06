import models from '../../../database/models';
import SlackHelpers from '../slackHelpers';
import TeamDetailsService from '../../../services/TeamDetailsService';
import WebClientSingleton from '../../../utils/WebClientSingleton';
import {
  testUserFromDb, testTripFromDb, slackUserMock, createNewUserMock, newUser
} from '../__mocks__';
import UserService from '../../../services/UserService';
import tripService from '../../../services/TripService';

const { TripRequest, User } = models;

// setup for all
const webClientMock = {
  users: {
    info: jest.fn(() => Promise.resolve({
      user: slackUserMock,
      token: 'sdf'
    })),
    profile: {
      get: jest.fn(() => Promise.resolve({
        profile: {
          tz_offset: 'someValue',
          email: 'sekito.ronald@andela.com'
        }
      }))
    }
  }
};

describe('slackHelpers', () => {
  beforeEach(() => {
    jest.spyOn(WebClientSingleton.prototype, 'getWebClient').mockReturnValue(webClientMock);

    jest.spyOn(User, 'findOne').mockResolvedValue(testUserFromDb);
    jest.spyOn(User, 'findByPk').mockResolvedValue(testUserFromDb);
    jest.spyOn(User, 'findOrCreate').mockResolvedValue([{ dataValues: testUserFromDb.dataValues }]);
    jest.spyOn(UserService, 'getUserBySlackId').mockResolvedValue(testUserFromDb);

    jest.spyOn(TripRequest, 'findByPk').mockResolvedValue(testTripFromDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('fetchUserInformationFromSlack', () => {
    it('should call WebClientSingleton.getWebClient', async (done) => {
      // invoke
      const slackUser = await SlackHelpers.fetchUserInformationFromSlack('slackId', 'token');

      expect(typeof slackUser).toEqual('object');
      expect(slackUser).toEqual(slackUserMock);
      done();
    });
  });

  describe('getUserInfoFromSlack', () => {
    it('should return user info from slack', async (done) => {
      const slackId = 'U145';
      const teamId = 'TS14';
      const token = 'token';
      jest.spyOn(TeamDetailsService, 'getTeamDetailsBotOauthToken').mockResolvedValue(token);
      SlackHelpers.fetchUserInformationFromSlack = jest
        .fn()
        .mockResolvedValue({ user: slackUserMock });

      const slackUser = await SlackHelpers.getUserInfoFromSlack(slackId, teamId);

      expect(TeamDetailsService.getTeamDetailsBotOauthToken).toBeCalledWith(teamId);
      expect(SlackHelpers.fetchUserInformationFromSlack).toBeCalledWith(slackId, token);
      expect(slackUser).toBeInstanceOf(Object);
      expect(slackUser.user).toEqual(slackUserMock);
      done();
    });
  });

  describe('findOrCreateUserBySlackId', () => {
    const userId = 1;
    const teamId = 'U1GHSGS';
    const validUser = { id: teamId, email: 'tembea@andela.com' };
    beforeEach(() => {
      // create expected results
      jest.spyOn(SlackHelpers, 'getUserInfoFromSlack').mockResolvedValue(slackUserMock);
      jest.spyOn(UserService, 'createNewUser').mockResolvedValue(validUser);
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should create and return new user if user does not exist', async (done) => {
      // mock dependencies and return expected values
      const nullUser = undefined;
      jest.spyOn(UserService, 'getUserBySlackId').mockResolvedValue(nullUser);

      // test expected behavior
      const user = await SlackHelpers.findOrCreateUserBySlackId(userId, teamId);
      expect(UserService.getUserBySlackId).toBeCalledWith(userId);
      expect(SlackHelpers.getUserInfoFromSlack).toBeCalledWith(userId, teamId);
      expect(UserService.createNewUser).toBeCalledWith(createNewUserMock);
      expect(user).toEqual(validUser);
      done();
    });

    it('should return user based on slackId if user already exists', async (done) => {
      jest.spyOn(UserService, 'getUserBySlackId').mockResolvedValue(validUser);
      const user = await SlackHelpers.findOrCreateUserBySlackId(userId, teamId);
      expect(UserService.getUserBySlackId).toBeCalledWith(userId);
      expect(SlackHelpers.getUserInfoFromSlack).toBeCalledTimes(0);
      expect(UserService.createNewUser).toBeCalledTimes(0);
      expect(user).toEqual(validUser);
      done();
    });
  });

  describe('findUserByIdOrSlackId', () => {
    it('should return user object when slackId is valid', async (done) => {
      jest.spyOn(UserService, 'getUserBySlackId').mockResolvedValue(testUserFromDb);
      const user = await SlackHelpers.findUserByIdOrSlackId('U4500');
      expect(UserService.getUserBySlackId).toBeCalledTimes(1);
      expect(UserService.getUserBySlackId).toBeCalledWith('U4500');
      expect(user).toEqual(testUserFromDb.dataValues);
      done();
    });

    it('should return user object when id is valid', async (done) => {
      jest.spyOn(UserService, 'getUserById').mockResolvedValue(testUserFromDb);
      const user = await SlackHelpers.findUserByIdOrSlackId(10);
      expect(UserService.getUserById).toBeCalledTimes(1);
      expect(UserService.getUserById).toBeCalledWith(10);
      expect(user).toEqual(testUserFromDb.dataValues);
      done();
    });
  });

  describe('isRequestApproved', () => {
    it('should return trip status object with approved false', async (done) => {
      tripService.getById = jest.fn(() => Promise.resolve({}));
      const trip = await SlackHelpers.isRequestApproved(23, 'UE45');
      expect(trip).toEqual({ approvedBy: null, isApproved: false });
      done();
    });

    it('should return a valid approval status when request exists', async (done) => {
      jest.spyOn(tripService, 'getById').mockResolvedValue(testTripFromDb);
      jest.spyOn(SlackHelpers, 'findUserByIdOrSlackId').mockResolvedValue(testUserFromDb.dataValues);
      const trip = await SlackHelpers.isRequestApproved(23, 'UE45');
      expect(trip).toEqual({
        approvedBy: `<@${testUserFromDb.dataValues.slackId}>`, isApproved: true
      });
      done();
    });
  });

  describe('approveRequest', () => {
    it('should approve request when parameters is valid', async (done) => {
      jest.spyOn(tripService, 'getById').mockResolvedValue(testTripFromDb);
      jest.spyOn(testTripFromDb, 'update').mockResolvedValue({});
      jest.spyOn(SlackHelpers, 'findUserByIdOrSlackId').mockResolvedValue({ id: 5 });

      const tripStatus = await SlackHelpers.approveRequest(23, 'UE45', 'some text');
      expect(testTripFromDb.update).toBeCalledTimes(1);
      expect(tripStatus).toBeTruthy();
      done();
    });

    it('should return false when trip is not found', async (done) => {
      jest.spyOn(tripService, 'getById').mockResolvedValue(undefined);
      const trip = await SlackHelpers.approveRequest(23, 'UE45', 'some text');
      expect(trip).toBeFalsy();
      done();
    });

    it('should return false if manager is not found', async (done) => {
      jest.spyOn(tripService, 'getById').mockResolvedValue(testTripFromDb);
      SlackHelpers.findUserByIdOrSlackId = jest.fn(() => Promise.resolve({}));
      const trip = await SlackHelpers.approveRequest(23, 'UE45', 'some text');
      expect(trip).toBeFalsy();
      done();
    });
  });

  describe('handleCancellation', () => {
    it('should return true/false when trip status is Cancelled', async (done) => {
      const tripRequest = {
        tripStatus: 'Cancelled'
      };
      jest.spyOn(SlackHelpers, 'getTripRequest').mockImplementation().mockResolvedValue(tripRequest);
      const result = await SlackHelpers.handleCancellation();

      expect(result).toEqual(true);

      done();
    });
  });

  describe('findOrCreateUserBySlackId', () => {
    beforeEach(() => {
      jest.spyOn(UserService, 'getUserBySlackId').mockResolvedValue();
      jest.spyOn(SlackHelpers, 'getUserInfoFromSlack').mockResolvedValue(newUser);
      jest.spyOn(UserService, 'createNewUser').mockReturnValue({
        username: 'santos',
        email: 'tembea@tem.com'
      });
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it("should return new user when user isn't found", async (done) => {
      const result = await SlackHelpers.findOrCreateUserBySlackId('1aaaBa', 'TI34DJ');
      expect(result).toEqual({ username: 'santos', email: 'tembea@tem.com' });
      expect(UserService.getUserBySlackId).toHaveBeenCalledTimes(1);
      expect(UserService.createNewUser).toHaveBeenCalledTimes(1);
      done();
    });

    it('should return null when user is found', async (done) => {
      UserService.getUserBySlackId = jest.fn(() => ({}));
      const result = await SlackHelpers.findOrCreateUserBySlackId('1aaaBa', 'TI34DJ');
      expect(UserService.getUserBySlackId).toHaveBeenCalled();
      expect(UserService.createNewUser).toHaveBeenCalledTimes(0);
      expect(result).toEqual({});
      done();
    });
  });

  describe('getTriprequest', () => {
    it('should return valid trip request if id exists', async () => {
      jest.spyOn(tripService, 'getById').mockResolvedValue(testTripFromDb);
      const result = await SlackHelpers.getTripRequest(1, {});
      expect(result).toEqual(testTripFromDb.dataValues);
    });
  });

  describe('noOfPassengers', () => {
    it('should return name value pairs', () => {
      const result = SlackHelpers.noOfPassengers();
      expect(result.length === 10);
      expect(result[0]).toHaveProperty('text');
      expect(result[0]).toHaveProperty('value');
    });
  });
});
