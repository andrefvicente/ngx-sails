import type { IRawSailsResponse } from '../interfaces/IRawSailsResponse';
import type { ISailsRequest } from '../interfaces/ISailsRequest';
import type { ISailsResponse } from '../interfaces/ISailsResponse';
import { Response } from './Response';
/** A sails response implementation */
export declare class SailsResponse<T = any> extends Response implements ISailsResponse<T> {
    readonly data: T;
    constructor(response: IRawSailsResponse, request: ISailsRequest);
}
