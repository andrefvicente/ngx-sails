import * as i0 from '@angular/core';
import { InjectionToken, Injectable, Optional, Inject, NgZone, ApplicationRef, PendingTasks } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import * as _io from 'socket.io-client';

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
        this.io = io || (_io.default || _io)(cfg?.uri, this._cfg);
        this._defaultHeaders = cfg?.headers || {};
        this._errorsSbj = new Subject();
        this.requestErrors = this._errorsSbj.asObservable();
        this.configuration = Object.freeze({
            headers: this._defaultHeaders,
            options: this._cfg,
        });
        // Resolve Angular CD deps from Injector (keeps ɵfac signature stable)
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
    /** Emit an event */
    emit(event, ...args) {
        this.io.emit(event, ...args);
    }
    /** Emit an event and wait for a response. */
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
    /** @inheritDoc */
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
        const request = clean({
            data: clean(data),
            headers: clean({ ...this._defaultHeaders, ...options.headers }),
            method,
            params: clean(options.params || options.search || {}),
            url
        });
        // HTTP via Zone-patched fetch so Angular change detection runs after responses.
        // Socket.io callbacks often complete already inside NgZone and leave templates stale.
        return wrapForAngularCd(sendHttpRequest(request, this._uri, this._errorsSbj), this._zone, this._pendingTasks, this._scheduler, this._appRef);
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


/** Deliver async Observable notifications inside Angular's CD cycle. */
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
        const settle = () => {
            if (settled) {
                return;
            }
            settled = true;
            try {
                done();
            }
            catch (_b) { }
            try {
                if (scheduler) {
                    scheduler.notify(11 /* PendingTaskRemoved */);
                    scheduler.notify(4 /* MarkForCheck */);
                }
            }
            catch (_c) { }
        };
        const deliver = (fn) => {
            if (NgZone.isInAngularZone()) {
                fn();
            }
            else {
                zone.run(fn);
            }
        };
        const subscription = source.subscribe({
            next: (value) => deliver(() => subscriber.next(value)),
            error: (err) => {
                deliver(() => subscriber.error(err));
                settle();
            },
            complete: () => {
                deliver(() => subscriber.complete());
                settle();
            },
        });
        return () => {
            subscription.unsubscribe();
            settle();
        };
    });
}

function sendHttpRequest(request, baseUri, errors$) {
    request.headers = lowerCaseHeaders(request.headers);
    return new Observable(subscriber => {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const method = String(request.method || 'get').toUpperCase();
        let url;
        try {
            url = new URL(request.url, baseUri || (typeof location !== 'undefined' ? location.origin : 'http://localhost'));
        }
        catch (_a) {
            url = new URL(request.url, typeof location !== 'undefined' ? location.origin : 'http://localhost');
        }
        const params = request.params || {};
        for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
                url.searchParams.set(key, String(value));
            }
        }
        const headers = { ...(request.headers || {}) };
        // Browsers forbid setting Host; preserve tenant slug for backends that read x-host.
        if (headers['host'] && !headers['x-host']) {
            headers['x-host'] = headers['host'];
        }
        delete headers['host'];
        const init = {
            method,
            headers,
            credentials: 'include',
        };
        if (controller) {
            init.signal = controller.signal;
        }
        if (method !== 'GET' && method !== 'HEAD' && request.data !== undefined) {
            if (!headers['content-type']) {
                headers['content-type'] = 'application/json';
            }
            init.body = typeof request.data === 'string' ? request.data : JSON.stringify(request.data);
        }
        fetch(url.toString(), init).then(async (res) => {
            const text = await res.text();
            let body = null;
            if (text) {
                try {
                    body = JSON.parse(text);
                }
                catch (_b) {
                    body = text;
                }
            }
            const headerMap = {};
            res.headers.forEach((value, key) => {
                headerMap[key] = value;
            });
            const rawResponse = {
                statusCode: res.status,
                body,
                headers: headerMap,
            };
            if (rawResponse.statusCode >= 400) {
                const error = new SailsError(rawResponse, request);
                errors$.next(error);
                subscriber.error(error);
            }
            else {
                subscriber.next(new SailsResponse(rawResponse, request));
                subscriber.complete();
            }
        }).catch((err) => {
            if (err?.name === 'AbortError') {
                return;
            }
            subscriber.error(err);
        });
        return () => {
            try {
                controller?.abort();
            }
            catch (_c) { }
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

/**
 * Generated bundle index. Do not edit.
 */

export { IO_INSTANCE, NGX_SAILS_CONFIG, Response, SailsClient, SailsError, SailsResponse };
//# sourceMappingURL=aloreljs-ngx-sails.mjs.map
