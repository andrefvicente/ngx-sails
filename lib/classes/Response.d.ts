import type { IRawSailsResponse } from '../interfaces/IRawSailsResponse';
import type { ISailsRequest } from '../interfaces/ISailsRequest';
import type { ISailsResponse } from '../interfaces/ISailsResponse';
import type { AnyObject } from '../util/AnyObject';
/** Abstract response class */
export declare abstract class Response implements Omit<ISailsResponse, 'data'> {
    readonly config: ISailsRequest;
    readonly headers: AnyObject;
    readonly status: number;
    protected constructor(response: IRawSailsResponse, request: ISailsRequest);
}
