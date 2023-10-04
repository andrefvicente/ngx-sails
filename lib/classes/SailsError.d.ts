import type { IRawSailsResponse } from '../interfaces/IRawSailsResponse';
import type { ISailsRequest } from '../interfaces/ISailsRequest';
import { Response } from './Response';
/** A sails response implementation */
export declare class SailsError extends Response {
    readonly error: any;
    constructor(response: IRawSailsResponse, request: ISailsRequest);
}
