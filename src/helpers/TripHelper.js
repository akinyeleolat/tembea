import Cache from '../cache';
import AddressService from '../services/AddressService';

export default class TripHelper {
  static cleanDateQueryParam(query, field) {
    if (query[field]) {
      // departureTime sample data => after,2018-10-10;before,2018-01-10
      const [a, b] = query[field].split(';');
      return this.extracted222(a, b);
    }
  }

  static extracted222(a, b) {
    const result = {};
    const [key1, value1] = this.extracted(a || '');
    if (key1) {
      result[key1] = value1;
    }

    const [key2, value2] = this.extracted(b || '');
    if (key2) {
      result[key2] = value2;
    }
    return result;
  }

  static extracted(a) {
    const [key, value] = a.split(':');
    if (key) {
      return [key, value];
    }
    return [];
  }

  static async updateTripData(userId, name, pickup, othersPickup, dateTime,
    tripType = 'Regular Trip') {
    const userTripData = await Cache.fetch(userId);
    const pickupCoords = pickup !== 'Others'
      ? await AddressService.findCoordinatesByAddress(pickup) : null;
    if (pickupCoords) {
      userTripData.pickupId = pickupCoords.id;
      userTripData.pickupLat = pickupCoords.location.latitude;
      userTripData.pickupLong = pickupCoords.location.longitude;
    }
    userTripData.id = userId;
    userTripData.name = name;
    userTripData.pickup = pickup;
    userTripData.othersPickup = othersPickup;
    userTripData.dateTime = dateTime;
    userTripData.departmentId = userTripData.department.value;
    userTripData.tripType = tripType;
    await Cache.saveObject(userId, userTripData);
  }

  static async getDestinationCoordinates(destination) {
    const destinationCoords = destination !== 'Others'
      ? await AddressService.findCoordinatesByAddress(destination) : null;
    return destinationCoords;
  }
}
