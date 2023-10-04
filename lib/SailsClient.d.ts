import { Injector, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { SailsError } from './classes/SailsError';
import type { ISailsRequestOpts } from './interfaces/ISailsRequestOpts';
import type { ISailsResponse } from './interfaces/ISailsResponse';
import type { NgxSailsConfig } from './interfaces/NgxSailsConfig';
import type { AnyObject } from './util/AnyObject';
import * as i0 from "@angular/core";
export declare class SailsClient implements OnDestroy {
    readonly configuration: Readonly<NgxSailsConfig>;
    readonly io: SocketIOClient.Socket;
    readonly requestErrors: Observable<SailsError>;
    private readonly _cfg;
    private readonly _defaultHeaders;
    private readonly _errorsSbj;
    constructor(inj: Injector, io: any | null, cfg: NgxSailsConfig | null);
    delete<T = any>(url: string, opts?: ISailsRequestOpts): Observable<ISailsResponse<T>>;
    /** Emit an event */
    emit(event: string, ...args: any[]): void;
    /** Emit an event and wait for a response. */
    emitAndWait<T = any>(event: string, ...args: any[]): Observable<T>;
    get<T = any>(url: string, opts?: ISailsRequestOpts): Observable<ISailsResponse<T>>;
    head<T = any>(url: string, opts?: ISailsRequestOpts): Observable<ISailsResponse<T>>;
    /** @inheritDoc */
    ngOnDestroy(): void;
    on<T = any>(event: string): Observable<T>;
    options<T = any>(url: string, opts?: ISailsRequestOpts): Observable<ISailsResponse<T>>;
    patch<T = any>(url: string, body?: AnyObject, opts?: ISailsRequestOpts): Observable<ISailsResponse<T>>;
    post<T = any>(url: string, body?: AnyObject, opts?: ISailsRequestOpts): Observable<ISailsResponse<T>>;
    put<T = any>(url: string, body?: AnyObject, opts?: ISailsRequestOpts): Observable<ISailsResponse<T>>;
    private _sendRequest;
    static ɵfac: i0.ɵɵFactoryDeclaration<SailsClient, [null, { optional: true; }, { optional: true; }]>;
    static ɵprov: i0.ɵɵInjectableDeclaration<SailsClient>;
}
