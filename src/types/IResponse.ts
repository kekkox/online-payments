interface ISuccessResponse<T> {
  ok: true;
  data: T;
  message?: string;
}

export interface IErrorResponse {
  ok: false;
  message: string;
}

export type IResponse<T> = ISuccessResponse<T> | IErrorResponse;
