import { IUser } from './user.interface';
import { IDriver } from './driver.interface';
import { ICab } from './cab.interface';
import { IDepartment } from './department.interface';

export interface ITripInformation extends IApprovalInfo{
  id: number;
  origin: IAddress;
  pickup?: IAddress;
  destination: IAddress;
  tripStatus: string;
  departureTime: string;
  reason: string;
  tripNote?: string;
  noOfPassengers: number;
  driver?: IDriver;
  cab?: ICab;
  riderId?: number;
  rider?: IUser;
  requester?: IUser;
  response_url?: string;
  tripType: string;
  approver?: IUser;
  department?: IDepartment;
  managerComment: string;
  createdAt: string;
  distance: string;
  driverSlackId?: string;
}

interface IApprovalInfo {
  isApproved: boolean;
  approvedBy: string;

}

interface IReasonPayload {
  approvedReason: string;
}

interface IAddress {
  address: string;
}
