import DriverController from '../DriverController';
import Response from '../../../helpers/responseHelper';
import { driverService } from '../../../services/DriverService';
import ProviderService from '../../../services/ProviderService';
import {
  createReq, expected, mockData, existingUserMock
} from './mockData';
import bugsnagHelper from '../../../helpers/bugsnagHelper';
import HttpError from '../../../helpers/errorHandler';

describe('DriverController', () => {
  let createDriverSpy;
  let updateDriverSpy;
  let res;

  Response.sendResponse = jest.fn();

  beforeEach(() => {
    createDriverSpy = jest.spyOn(driverService, 'createProviderDriver');
    res = {
      status: jest.fn(() => ({
        json: jest.fn(() => { })
      })).mockReturnValue({ json: jest.fn() })
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });
  describe('DriverController_addDriver', () => {
    it('should create driver successfully', async () => {
      jest.spyOn(ProviderService, 'findProviderByPk').mockReturnValue({});
      createDriverSpy.mockReturnValue(mockData);
      await DriverController.addProviderDriver(createReq, res);
      expect(Response.sendResponse).toHaveBeenCalled();
      expect(Response.sendResponse).toHaveBeenCalledWith(res, 201, true,
        'Driver added successfully', expected);
    });

    it('should return errors if they exist', async () => {
      createDriverSpy.mockReturnValue({
        errors: [
          {
            message: 'driverPhoneNo must be unique'
          }
        ]
      });
      await DriverController.addProviderDriver({}, res);
      expect(Response.sendResponse).toHaveBeenCalled();
      expect(Response.sendResponse).toHaveBeenCalledWith(res, 400, false,
        'driverPhoneNo must be unique');
    });

    it('should return error if a driver with a number exists', async () => {
      createDriverSpy.mockReturnValue(existingUserMock);
      await DriverController.addProviderDriver(createReq, res);
      expect(Response.sendResponse).toHaveBeenCalled();
      expect(Response.sendResponse).toHaveBeenCalledWith(res, 409, false,
        `Driver with  driver Number ${createReq.body.driverNumber} already exists`);
    });

    it('should throw an error if creating a driver fails', async () => {
      createDriverSpy.mockRejectedValue('Something went wrong');
      await DriverController.addProviderDriver(createReq, res);
      expect(Response.sendResponse).toHaveBeenCalled();
      expect(Response.sendResponse).toHaveBeenCalledWith(res, 500, false,
        'An error occurred in the creation of the driver');
    });
    describe('Update driver', () => {
      beforeEach(() => {
        updateDriverSpy = jest.spyOn(driverService, 'update');
        createReq.params = { driverId: 1 };
        jest.spyOn(driverService, 'update').mockResolvedValue({});
      });
      it('update a driver', async () => {
        updateDriverSpy.mockResolvedValue({});
        await DriverController.update(createReq, res);
        expect(Response.sendResponse).toHaveBeenCalledWith(res, 200, true,
          'Driver updated successfully', {});
      });

      it('should respond with an error if the driver does not exist', async () => {
        updateDriverSpy.mockResolvedValue({ message: 'Driver not found' });
        await DriverController.update(createReq, res);
        expect(Response.sendResponse).toHaveBeenCalledWith(res, 404, false,
          'Driver not found');
      });

      it('should catch errors', async () => {
        jest.spyOn(bugsnagHelper, 'log');
        jest.spyOn(HttpError, 'sendErrorResponse');
        updateDriverSpy.mockRejectedValue({ error: 'Something went wrong' });
        await DriverController.update(createReq, res);
        expect(bugsnagHelper.log).toHaveBeenCalledWith({ error: 'Something went wrong' });
        expect(HttpError.sendErrorResponse).toHaveBeenCalled();
      });
    });
  });

  describe('DriverController.deleteDriver', () => {
    it('should successfully delete a driver', async () => {
      const driver = { dataValues: { id: 2, providerId: 1 } };
      res.locals = { driver };

      jest.spyOn(driverService, 'deleteDriver').mockResolvedValue(1);
      await DriverController.deleteDriver({}, res);
      expect(Response.sendResponse).toHaveBeenCalled();
    });
  });
});
