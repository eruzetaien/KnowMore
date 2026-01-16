export const RequestStatus = {
    Success :  0,
    SystemValidationError :  -1,
    BusinessValidationError :  -2,
    SystemError :  -3,
} as const;
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

export interface ApiResponse<T> {
  status : RequestStatus,
  message: string,
  data? : T
}