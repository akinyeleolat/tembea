import models from '../../src/database/models';

const {
  User,
  Provider,
  Driver,
  RouteRequest,
  TripRequest,
  Department,
  Country
} = models;

export const createModel = async (Model, payload) => {
  const result = await Model.create(payload);
  return result.get({ plain: true });
};

export const createUser = async userPayload => createModel(User, userPayload);

export const createProvider = async providerPayload => createModel(Provider, providerPayload);

export const createDriver = async driverPayload => createModel(Driver, driverPayload);

export const createRouteRequest = async requestPayload => createModel(
  RouteRequest, requestPayload
);

export const createTripRequests = async (payload) => {
  const result = await TripRequest.bulkCreate(payload);
  return result;
};

export const createDepartment = async data => createModel(Department, data);
export const createCountry = async data => createModel(Country, data);
