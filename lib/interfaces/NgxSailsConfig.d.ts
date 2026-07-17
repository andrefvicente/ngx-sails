import type { ManagerOptions, SocketOptions } from 'socket.io-client';
import type { AnyObject } from '../util/AnyObject';
/** Sails socket configuration */
export interface NgxSailsConfig {
    headers?: AnyObject;
    options?: Partial<ManagerOptions & SocketOptions>;
    uri?: string;
}
