import models from '../../database/models';

const {
  Department,
  User,
  TripRequest,
  Address
} = models;
  
class DataHelper {
  static async getDepartments() {
    const departments = await Department.findAll();
    const departmentNames = departments.map(item => ({
      label: item.dataValues.name,
      value: item.dataValues.id
    }));
    return departmentNames;
  }
  
  static async getHeadByDepartmentId(departmentId) {
    const department = await Department.findByPk(departmentId, {
      include: [{
        model: User,
        as: 'head'
      }]
    });
  
    return department.dataValues.head.dataValues;
  }
  
  static async getUserById(userId) {
    const user = await User.findByPk(userId);
  
    return user.dataValues;
  }

  static async getUserBySlackId(slackId) {
    const user = await User.findOne({ where: { slackId } });
    return user.dataValues;
  }
  
  static async getTripRequest(tripId) {
    const tripRequest = await TripRequest.findByPk(tripId, {
      include: [{
        model: User,
        as: 'rider'
      },
      {
        model: User,
        as: 'requester'
      },
      {
        model: Address,
        as: 'origin'
      }, {
        model: Address,
        as: 'destination'
      }, {
        model: Department,
        as: 'department'
      }]
    });
  
    return tripRequest.dataValues;
  }
}
  
export default DataHelper;