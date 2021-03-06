/* eslint-disable no-useless-escape */
import ProviderValidator from '../ProviderValidator';
import HttpError from '../../helpers/errorHandler';
import UserService from '../../services/UserService';
import Response from '../../helpers/responseHelper';
import ProviderService, { providerService } from '../../services/ProviderService';

const errorMessage = 'Validation error occurred, see error object for details';

describe('ProviderValidator', () => {
  let res;
  let next;
  let req;
  beforeEach(() => {
    res = {
      status: jest.fn(() => ({
        json: jest.fn()
      }))
    };
    next = jest.fn();
    jest.spyOn(HttpError, 'sendErrorResponse').mockReturnValue();
    jest.spyOn(Response, 'sendResponse').mockReturnValue();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  describe('Provider_verifyProviderUpdate', () => {
    let httpSpy;
    beforeEach(() => {
      httpSpy = jest.spyOn(HttpError, 'sendErrorResponse');
    });
    it('should validate update parameters ', () => {
      const error = { message: { invalidParameter: 'Id should be a valid integer' } };
      req = {
        params: { id: 'notValid' },
        body: {}
      };
      httpSpy.mockReturnValue(error);
      ProviderValidator.verifyProviderUpdate(req, res, next);
      expect(httpSpy).toBeCalled();
    });

    it('should validate empty request body', () => {
      req = {
        params: { id: 1 },
        body: {}
      };
      ProviderValidator.verifyProviderUpdate(req, res, next);
      expect(httpSpy).toBeCalled();
    });

    it('should validate empty request body values', () => {
      req = {
        params: { id: 1 },
        body: {
          name: '',
          email: 'me@email.com'
        }
      };

      ProviderValidator.verifyProviderUpdate(req, res, next);
      expect(httpSpy).toBeCalled();
    });

    it('should return next if valid update body ', () => {
      req = {
        params: { id: 1 },
        body: { email: 'me@email.com' }
      };

      ProviderValidator.verifyProviderUpdate(req, res, next);
      expect(httpSpy).not.toBeCalled();
      expect(next).toBeCalled();
    });
    it('should return update object successfully', async () => {
      const userId = { dataValues: { id: 1 } };
      jest.spyOn(UserService, 'getUserByEmail')
        .mockReturnValue(userId);
      jest.spyOn(UserService, 'createUserByEmail')
        .mockReturnValue({ id: 1 });
      const body = {
        email: 'myemail@gmail.com',
        name: 'Uber Nairobi',
      };
      const updateData = await ProviderValidator.createUpdateBody(body);
      expect(UserService.getUserByEmail).toBeCalled();
      expect(updateData).toEqual({
        name: 'Uber Nairobi',
        providerUserId: 1
      });
    });
    it('should return message if user doesnt exist', async () => {
      jest.spyOn(UserService, 'getUserByEmail')
        .mockReturnValue(false);
      jest.spyOn(UserService, 'createUserByEmail')
        .mockReturnValue(Promise.reject());
      const body = {
        email: 'myemail@gmail.com',
        name: 'Uber Nairobi',
      };
      const updateData = await ProviderValidator.createUpdateBody(body);
      expect(UserService.getUserByEmail).toBeCalled();
      expect(updateData).toEqual({ message: 'User with email doesnt exist' });
    });
    it('should create a user profile if user exists on the workspace', async () => {
      jest.spyOn(UserService, 'getUserByEmail')
        .mockReturnValue(false);
      jest.spyOn(UserService, 'createUserByEmail')
        .mockReturnValue({ id: 1 });
      const body = {
        email: 'myemail@gmail.com',
        name: 'Uber Nairobi',
      };
      const updateData = await ProviderValidator.createUpdateBody(body);
      expect(UserService.getUserByEmail).toBeCalled();
      expect(updateData).toHaveProperty('providerUserId', 1);
    });
  });

  describe('ProviderValidator_validateNewProvider', () => {
    it('validates the PATCH method', () => {
      req = {
        method: 'PATCH',
        body: {}
      };
      ProviderValidator.validateNewProvider(req, res, next);
      expect(HttpError.sendErrorResponse)
        .toHaveBeenCalledWith({
          statusCode: 400,
          message: errorMessage,
          error: { email: 'Please provide email', name: 'Please provide name' }
        }, res);
    });

    it('returns next', () => {
      req = {
        body: {
          email: 'allan@andela.com',
          name: 'all'
        }
      };
      ProviderValidator.validateNewProvider(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('ProviderValidator_validateUserExistence', () => {
    let getUserSpy;
    let createUserByEmailSpy;

    beforeEach(() => {
      req = {
        body: {
          email: 'allan@andela.com',
          name: 'Uber'
        },
        headers: {
          teamurl: 'team.slack.com'
        }
      };
      getUserSpy = jest.spyOn(UserService, 'getUserByEmail');
      createUserByEmailSpy = jest.spyOn(UserService, 'createUserByEmail');
    });

    it('returns an error message if user does not exist', async () => {
      getUserSpy.mockResolvedValue(null);
      createUserByEmailSpy.mockResolvedValue(Promise.reject());
      const err = 'The user with specified email does not exist';
      await ProviderValidator.validateUserExistence(req, res, next);
      expect(UserService.getUserByEmail).toHaveBeenCalledWith(req.body.email);
      expect(Response.sendResponse).toHaveBeenCalledWith(res, 404, false, err);
    });

    it('returns next', async () => {
      const mockUser = {
        name: 'Allan',
        email: 'allan@allan.com'
      };
      getUserSpy.mockResolvedValue(mockUser);
      createUserByEmailSpy.mockResolvedValue(Promise.resolve());

      await ProviderValidator.validateUserExistence(req, res, next);
      expect(UserService.getUserByEmail).toHaveBeenCalledWith(req.body.email);
      expect(next).toHaveBeenCalled();
    });
  });
  describe('ProviderValidator_validateDriverRequestBody', () => {
    it('should throw errors if fields are missing in body', async () => {
      const createReq = {
        body: {
          driverName: 'Muhwezi Deo',
          driverNumber: '42220222',
          email: 'Test@test.com'
        }
      };
      await ProviderValidator.validateDriverRequestBody(createReq, res, next);
      expect(HttpError.sendErrorResponse).toHaveBeenCalledWith({
        statusCode: 400,
        message: errorMessage,
        error: {
          driverPhoneNo: 'Please provide driverPhoneNo',
          providerId: 'Please provide providerId'
        }
      }, res);
    });
    it('should throw errors if a field is empty', async () => {
      const createReq = {
        body: {
          driverName: '',
          driverNumber: '42220222',
          email: 'Test@test.com',
          driverPhoneNo: '07042211313',
          providerId: 1
        }
      };
      await ProviderValidator.validateDriverRequestBody(createReq, res, next);
      expect(HttpError.sendErrorResponse).toHaveBeenCalledWith({
        statusCode: 400,
        message: errorMessage,
        error: { driverName: '\"driverName\" is not allowed to be empty' }
      }, res);
    });
    it('should call next if request body is valid', async () => {
      const createReq = {
        body: {
          driverName: 'Test User',
          driverNumber: '42220222',
          email: 'Test@test.com',
          driverPhoneNo: '07042211313',
          providerId: 1
        }
      };
      await ProviderValidator.validateDriverRequestBody(createReq, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
  describe('ProviderValidator_validateProviderExistence', () => {
    it('should send error if a provider doesnt exist', async () => {
      const createReq = {
        body: {
          driverName: 'Test User',
          driverNumber: '42220222',
          email: 'Test@test.com',
          driverPhoneNo: '07042211313',
          providerId: 1
        }
      };
      jest.spyOn(ProviderService, 'findByPk').mockReturnValue(null);
      await ProviderValidator.validateProviderExistence(createReq, res, next);
      expect(Response.sendResponse).toBeCalledWith(res, 404, false, 'Provider doesnt exist');
    });
    it('should call next if provider exists', async () => {
      const createReq = {
        body: {
          driverName: 'Test User',
          driverNumber: '42220222',
          email: 'Test@test.com',
          driverPhoneNo: '07042211313',
          providerId: 1
        }
      };
      jest.spyOn(ProviderService, 'findByPk').mockReturnValue({
        name: 'Test Provider',
        email: 'test@test.com'
      });
      await ProviderValidator.validateProviderExistence(createReq, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
  it('should return an error if duplicate provider email is provided', async () => {
    const updateReq = {
      body: {
        driverName: 'Test User',
        driverNumber: '42220222',
        email: 'Test@test.com',
        driverPhoneNo: '07042211313',
      }
    };
    jest.spyOn(UserService, 'getUserByEmail').mockResolvedValue({ id: 1 });
    jest.spyOn(providerService, 'findProviderByUserId').mockResolvedValue(true);
    await ProviderValidator.validateProvider(updateReq, res, next);
    expect(Response.sendResponse).toHaveBeenCalledWith(
      res, 409, false, 'Provider with specified email already exists'
    );
  });

  it('should add provider user id if user exists', async () => {
    const updateReq = {
      body: {
        driverName: 'Test User',
        driverNumber: '42220222',
        email: 'Test@test.com',
        driverPhoneNo: '07042211313',
      }
    };
    jest.spyOn(UserService, 'getUserByEmail').mockResolvedValue({ id: 1 });
    jest.spyOn(providerService, 'findProviderByUserId').mockResolvedValue(null);
    await ProviderValidator.validateProvider(updateReq, res, next);
    expect(res.locals.providerData).toHaveProperty('providerUserId', 1);
    expect(next).toHaveBeenCalled();
  });
});
