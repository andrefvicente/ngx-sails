import * as i0 from '@angular/core';
import { InjectionToken, Injectable, Optional, Inject } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import * as _io from 'socket.io-client';

/** Abstract response class */
class Response {
    constructor(response, request) {
        var _a;
        const rspParsed = typeof response === 'string'
            ? JSON.parse(response)
            : response;
        this.config = request;
        this.headers = rspParsed.headers || {};
        this.status = (_a = rspParsed.statusCode) !== null && _a !== void 0 ? _a : 200;
    }
}

/** A sails response implementation */
class SailsError extends Response {
    constructor(response, request) {
        var _a;
        super(response, request);
        this.error = (_a = response.body) !== null && _a !== void 0 ? _a : {};
    }
}

/** A sails response implementation */
class SailsResponse extends Response {
    constructor(response, request) {
        var _a;
        super(response, request);
        this.data = ((_a = response.body) !== null && _a !== void 0 ? _a : {});
    }
}

/** User-provided custom socket.io instance */
const IO_INSTANCE = new InjectionToken('socket.io instance');

/** Ngx sails configuration injection token */
const NGX_SAILS_CONFIG = new InjectionToken('NgxSails config');

class SailsClient {
    constructor(inj, io, cfg) {
        var _a;
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
        if ((_a = cfg === null || cfg === void 0 ? void 0 : cfg.options) === null || _a === void 0 ? void 0 : _a.query) {
            Object.assign(query, cfg.options.query);
        }
        this._cfg = Object.assign(Object.assign({ transports: ['websocket'] }, cfg === null || cfg === void 0 ? void 0 : cfg.options), { query });
        this.io = io || (_io.default || _io)(cfg === null || cfg === void 0 ? void 0 : cfg.uri, this._cfg);
        this._defaultHeaders = (cfg === null || cfg === void 0 ? void 0 : cfg.headers) || {};
        this._errorsSbj = new Subject();
        this.requestErrors = this._errorsSbj.asObservable();
        this.configuration = Object.freeze({
            headers: this._defaultHeaders,
            options: this._cfg,
        });
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
        return new Observable(subscriber => {
            this.io.emit(event, ...args, (response) => {
                subscriber.next(response);
                subscriber.complete();
            });
        });
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
        return new Observable(subscriber => {
            function next(msg) {
                subscriber.next(msg);
            }
            this.io.on(event, next);
            return () => {
                this.io.off(event, next);
            };
        });
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
        return sendRequest(clean({
            data: clean(data),
            headers: clean(Object.assign(Object.assign({}, this._defaultHeaders), options.headers)),
            method,
            params: clean(options.params || options.search || {}),
            url
        }), this.io, this._errorsSbj);
    }
}
SailsClient.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.1.2", ngImport: i0, type: SailsClient, deps: [{ token: i0.Injector }, { token: IO_INSTANCE, optional: true }, { token: NGX_SAILS_CONFIG, optional: true }], target: i0.ɵɵFactoryTarget.Injectable });
SailsClient.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "15.1.2", ngImport: i0, type: SailsClient, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.1.2", ngImport: i0, type: SailsClient, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () {
        return [{ type: i0.Injector }, { type: undefined, decorators: [{
                        type: Optional
                    }, {
                        type: Inject,
                        args: [IO_INSTANCE]
                    }] }, { type: undefined, decorators: [{
                        type: Optional
                    }, {
                        type: Inject,
                        args: [NGX_SAILS_CONFIG]
                    }] }];
    } });
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
        const out = Object.assign({}, headers);
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
        const out = Object.assign({}, obj);
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
