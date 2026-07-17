import * as i0 from '@angular/core';
import { InjectionToken, Injectable, Optional, Inject, NgZone, ApplicationRef, PendingTasks } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import * as socketIoClient from 'socket.io-client';

function connectSocket(uri, opts) {
    const connect = socketIoClient.io || socketIoClient.default || socketIoClient;
    return connect(uri, opts);
}

/** Abstract response class */
class Response {
    constructor(response, request) {
        const rspParsed = typeof response === 'string'
            ? JSON.parse(response)
            : response;
        this.config = request;
        this.headers = rspParsed.headers || {};
        this.status = rspParsed.statusCode ?? 200;
    }
}

/** A sails response implementation */
class SailsError extends Response {
    constructor(response, request) {
        super(response, request);
        this.error = response.body ?? {};
    }
}

/** A sails response implementation */
class SailsResponse extends Response {
    constructor(response, request) {
        super(response, request);
        this.data = (response.body ?? {});
    }
}

/** User-provided custom socket.io instance */
const IO_INSTANCE = new InjectionToken('socket.io instance');

/** Ngx sails configuration injection token */
const NGX_SAILS_CONFIG = new InjectionToken('NgxSails config');

class SailsClient {
    constructor(inj, io, cfg) {
        const SAILS_IO_SDK_STRING = '__sails_io_sdk';
        const SAILS_IO_SDK = {
            language: 'javascript',
            platform: 'browser',
            version: '1.1.12'
        };
        const query = Object.entries(SAILS_IO_SDK).reduce((acc, [key, value]) => {
            acc[`${SAILS_IO_SDK_STRING}_${key}`] = value;
            return acc;
        }, {});
        if (cfg?.options?.query) {
            Object.assign(query, cfg.options.query);
        }
        this._cfg = {
            transports: ['websocket'],
            ...cfg?.options,
            query
        };
        this._uri = cfg?.uri || (typeof location !== 'undefined' ? location.origin : '');
        this.io = io || connectSocket(cfg?.uri, this._cfg);
        this._defaultHeaders = cfg?.headers || {};
        this._errorsSbj = new Subject();
        this.requestErrors = this._errorsSbj.asObservable();
        this.configuration = Object.freeze({
            headers: this._defaultHeaders,
            options: this._cfg,
        });
        this._zone = inj.get(NgZone);
        this._appRef = inj.get(ApplicationRef);
        try {
            this._pendingTasks = inj.get(PendingTasks);
        }
        catch (_a) {
            this._pendingTasks = null;
        }
        try {
            this._scheduler = inj.get(i0.ɵChangeDetectionScheduler);
        }
        catch (_b) {
            this._scheduler = null;
        }
    }
    delete(url, opts) {
        return this._sendRequest(url, "delete" /* RequestMethod.DELETE */, undefined, opts);
    }
    emit(event, ...args) {
        this.io.emit(event, ...args);
    }
    emitAndWait(event, ...args) {
        return wrapForAngularCd(new Observable(subscriber => {
            this.io.emit(event, ...args, (response) => {
                subscriber.next(response);
                subscriber.complete();
            });
        }), this._zone, this._pendingTasks, this._scheduler, this._appRef);
    }
    get(url, opts) {
        return this._sendRequest(url, "get" /* RequestMethod.GET */, undefined, opts);
    }
    head(url, opts) {
        return this._sendRequest(url, "head" /* RequestMethod.HEAD */, undefined, opts);
    }
    ngOnDestroy() {
        this._errorsSbj.complete();
    }
    on(event) {
        return wrapForAngularCd(new Observable(subscriber => {
            const next = (msg) => {
                subscriber.next(msg);
            };
            this.io.on(event, next);
            return () => {
                this.io.off(event, next);
            };
        }), this._zone, this._pendingTasks, this._scheduler, this._appRef, { trackPending: false });
    }
    options(url, opts) {
        return this._sendRequest(url, "options" /* RequestMethod.OPTIONS */, undefined, opts);
    }
    patch(url, body, opts) {
        return this._sendRequest(url, "patch" /* RequestMethod.PATCH */, body, opts);
    }
    post(url, body, opts) {
        return this._sendRequest(url, "post" /* RequestMethod.POST */, body, opts);
    }
    put(url, body, opts) {
        return this._sendRequest(url, "put" /* RequestMethod.PUT */, body, opts);
    }
    _sendRequest(url, method, data, options = {}) {
        return wrapForAngularCd(sendRequest(clean({
            data: clean(data),
            headers: clean({ ...this._defaultHeaders, ...options.headers }),
            method,
            params: clean(options.params || options.search || {}),
            url
        }), this.io, this._errorsSbj), this._zone, this._pendingTasks, this._scheduler, this._appRef);
    }
}
SailsClient.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.1.2", ngImport: i0, type: SailsClient, deps: [{ token: i0.Injector }, { token: IO_INSTANCE, optional: true }, { token: NGX_SAILS_CONFIG, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
SailsClient.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "15.1.2", ngImport: i0, type: SailsClient, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.1.2", ngImport: i0, type: SailsClient, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: i0.Injector }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [IO_INSTANCE]
                }] }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [NGX_SAILS_CONFIG]
                }] }]; } });

/**
 * Socket.io callbacks often already run inside NgZone, so Angular CD can flush
 * before component state updates. Defer emissions to a macrotask and force
 * detectChanges after each delivery (required on Angular 22).
 */
function wrapForAngularCd(source, zone, pendingTasks, scheduler, appRef, options = {}) {
    const trackPending = options.trackPending !== false;
    return new Observable(subscriber => {
        let done = () => { };
        if (trackPending && pendingTasks) {
            try {
                done = pendingTasks.add();
            }
            catch (_a) { }
        }
        let settled = false;
        const forceDetect = () => {
            try {
                if (scheduler) {
                    scheduler.notify(11 /* PendingTaskRemoved */);
                    scheduler.notify(4 /* MarkForCheck */);
                }
            }
            catch (_b) { }
            try {
                if (appRef && !appRef.destroyed) {
                    for (const ref of appRef.components) {
                        try {
                            ref.changeDetectorRef?.detectChanges?.();
                        }
                        catch (_c) { }
                    }
                }
            }
            catch (_d) { }
        };
        const deliver = (fn) => {
            // Always leave the current turn — zone.run alone is a no-op when already in-zone.
            setTimeout(() => {
                zone.run(() => {
                    try {
                        fn();
                    }
                    finally {
                        forceDetect();
                    }
                });
            }, 0);
        };
        const settle = () => {
            if (settled) {
                return;
            }
            settled = true;
            try {
                done();
            }
            catch (_e) { }
        };
        const subscription = source.subscribe({
            next: (value) => {
                deliver(() => subscriber.next(value));
            },
            error: (err) => {
                deliver(() => {
                    subscriber.error(err);
                    settle();
                });
            },
            complete: () => {
                deliver(() => {
                    subscriber.complete();
                    settle();
                });
            },
        });
        return () => {
            subscription.unsubscribe();
            settle();
        };
    });
}

function sendRequest(request, io, errors$) {
    const { method } = request;
    request.headers = lowerCaseHeaders(request.headers);
    return new Observable(subscriber => {
        let unsubscribed = false;
        io.emit(method, request, (rawResponse) => {
            if (!unsubscribed) {
                if (rawResponse.statusCode >= 400) {
                    const error = new SailsError(rawResponse, request);
                    errors$.next(error);
                    subscriber.error(error);
                }
                else {
                    try {
                        subscriber.next(new SailsResponse(rawResponse, request));
                        subscriber.complete();
                    }
                    catch (e) {
                        subscriber.error(e);
                    }
                }
            }
        });
        return () => {
            unsubscribed = true;
        };
    });
}
function lowerCaseHeaders(headers) {
    if (headers) {
        let lowercased;
        const out = { ...headers };
        for (const [header, value] of Object.entries(headers)) {
            lowercased = header.toLowerCase();
            if (lowercased !== header) {
                out[lowercased] = value;
                delete out[header];
            }
        }
        return out;
    }
    return headers;
}
function clean(obj) {
    if (obj) {
        const out = { ...obj };
        for (const [key, value] of Object.entries(out)) {
            if (value === undefined) {
                delete out[key];
            }
        }
    }
    return obj;
}

export { IO_INSTANCE, NGX_SAILS_CONFIG, Response, SailsClient, SailsError, SailsResponse };
