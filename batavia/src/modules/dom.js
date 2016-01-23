/*
 * Javascript DOM module.
 *
 * This is a wrapper to allow Python code to access DOM objects and methods.
 */

/* Proxy function calls to DOM objects.
 * This has two purposes -
 *  1. To unwind posargs into arguments on the DOM function
 *  2. To set `this` on the function call.
 */

function __func_proxy__(obj, attr) {
    return function(posargs) {
        return obj[attr].apply(obj, posargs);
    };
}

/*
 * Proxy attribute access on DOM objects.
 */
function __attr_proxy__(obj, attr, proxy) {
    Object.defineProperty(
        proxy,
        attr,
        {
            get: function() {
                return obj[attr];
            },
            set: function(value) {
                obj[attr] = value;
            }
        }
    );

}

function __proxy__ (objname, obj) {
    var proxy = {};
    for (var attr in obj) {
        if (typeof obj[attr] === 'function') {
            proxy[attr] = __func_proxy__(obj, attr);
        } else {
            __attr_proxy__(obj, attr, proxy);
        }
    }
    return proxy;
}


export const dom = {
    self: __proxy__('self', window.self),
    window: __proxy__('window', window),
    parent: __proxy__('parent', parent),
    top: __proxy__('top', top),
    navigator: __proxy__('navigator', navigator),
    frames: __proxy__('frames', frames),
    location: __proxy__('location', location),
    history: __proxy__('history', history),
    document: __proxy__('document', document)
};
