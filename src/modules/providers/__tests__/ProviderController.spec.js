import {
  providers, paginatedData, successMessage, returnedData
} from '../__mocks__/ProviderMockData';
import ProvidersController from '../ProvidersController';
import ProviderService from '../../../services/ProviderService';
import BugsnagHelper from '../../../helpers/bugsnagHelper';
import HttpError from '../../../helpers/errorHandler';
import ProviderHelper from '../../../helpers/providerHelper';
import Response from '../../../helpers/responseHelper';
import models from '../../../database/models';

const { sequelize } = models;

describe('ProviderController', () => {
  let req;
  let res;
  let providerServiceSpy;
  beforeEach(() => {
    req = {
      query: {
        page: 1, size: 3, name: 'uber'
      }
    };
    res = {
      status: jest.fn(() => ({
        json: jest.fn(() => { })
      })).mockReturnValue({ json: jest.fn() })
    };
  });
  describe('ProviderController_getAllProviders', () => {
    providerServiceSpy = jest.spyOn(ProviderService, 'getProviders');
    jest.spyOn(Response, 'sendResponse');
    jest.spyOn(BugsnagHelper, 'log');
    jest.spyOn(HttpError, 'sendErrorResponse');

    it('Should get all providers', async () => {
      const paginateSpy = jest.spyOn(ProviderHelper, 'paginateData');
      providerServiceSpy.mockResolvedValue(providers);
      paginateSpy.mockReturnValue(paginatedData);
      await ProvidersController.getAllProviders(req, res);
      expect(ProviderHelper.paginateData).toHaveBeenCalled();
      expect(Response.sendResponse).toBeCalledWith(res, 200, true, successMessage, returnedData);
    });

    it('Should catch errors', async () => {
      jest.spyOn(BugsnagHelper, 'log');
      const error = new Error('Something went wrong');
      providerServiceSpy.mockRejectedValue(error);
      await ProvidersController.getAllProviders(req, res);
      expect(BugsnagHelper.log).toBeCalledWith(error);
      expect(HttpError.sendErrorResponse).toBeCalledWith(error, res);
    });
  });
  describe('ProviderController_updateProvider', () => {
    jest.spyOn(Response, 'sendResponse');
    it('should update provider successfully', async () => {
      providerServiceSpy = jest.spyOn(ProviderService, 'updateProvider').mockReturnValue([1, [{}]]);
      req = {
        params: 1,
        body: {
          name: 'Sharks Uber',
          email: 'Sharks@uber.com'
        }
      };
      await ProvidersController.updateProvider(req, res);
      expect(Response.sendResponse).toBeCalled();
      expect(Response.sendResponse).toBeCalledWith(res, 200, true, 'Provider Details updated Successfully', {});
    });

    it('should return message if provider doesnt exist', async () => {
      providerServiceSpy = jest.spyOn(ProviderService, 'updateProvider').mockReturnValue([0, []]);
      req = {
        params: 100,
        body: {
          name: 'Sharks Uber',
          email: 'Sharks@uber.com'
        }
      };
      await ProvidersController.updateProvider(req, res);
      expect(Response.sendResponse).toBeCalled();
      expect(Response.sendResponse).toBeCalledWith(res, 404, false, 'Provider doesnt exist');
    });

    it('should return message if user doesnt exist', async () => {
      providerServiceSpy = jest.spyOn(ProviderService, 'updateProvider').mockReturnValue({
        message: 'user with email doesnt exist'
      });
      req = {
        params: 100,
        body: {
          name: 'Sharks Uber',
          email: 'Sharks@uber.com'
        }
      };
      await ProvidersController.updateProvider(req, res);
      expect(Response.sendResponse).toBeCalled();
      expect(Response.sendResponse).toBeCalledWith(res, 404, false, 'user with email doesnt exist');
    });

    it('should return message if update fails', async () => {
      const error = new Error('Something went wrong');
      providerServiceSpy = jest.spyOn(ProviderService, 'updateProvider').mockRejectedValue(error);
      req = {
        params: 100,
        body: {
          name: 'Sharks Uber',
          email: 'Sharks@uber.com'
        }
      };
      await ProvidersController.updateProvider(req, res);
      expect(BugsnagHelper.log).toBeCalled();
      expect(Response.sendResponse).toBeCalled();
    });
    it('should return message for sequelize validation error', async () => {
      const error = new sequelize.ValidationError();
      providerServiceSpy = jest.spyOn(ProviderService, 'updateProvider').mockRejectedValue(error);
      req = {
        params: 100,
        body: {
          name: 'Sharks Uber',
          email: 'Sharks@uber.com'
        }
      };
      await ProvidersController.updateProvider(req, res);
      expect(BugsnagHelper.log).toBeCalled();
      expect(Response.sendResponse).toBeCalled();
    });
  });
});
