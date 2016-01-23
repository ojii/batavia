import * as builtins from './builtins';

export function assert(condition, message) {
    if (!condition) {
        throw message || "Assertion failed";
    }
}

/*************************************************************************
 * Modify String to behave like a Python String
 *************************************************************************/

String.prototype.startswith = function (str) {
    return this.slice(0, str.length) === str;
};

/*************************************************************************
 * Modify Object to behave like a Python Dictionary
 *************************************************************************/

Object.prototype.update = function (values) {
    for (var key in values) {
        if (values.hasOwnProperty(key)) {
            this[key] = values[key];
        }
    }
};

Object.prototype.copy = function () {
    var dup = {};
    for (var key in this) {
        if (this.hasOwnProperty(key)) {
            dup[key] = this[key];
        }
    }
    return dup;
};

/*************************************************************************
 * Modify Array to behave like a Python List
 *************************************************************************/

Array.prototype.append = function (value) {
    this.push(value);
};

Array.prototype.extend = function (values) {
    if (values.length > 0) {
        this.push.apply(this, values);
    }
};

/*************************************************************************
 * Subclass Object to provide a Set object
 *************************************************************************/


Set.prototype.remove = Set.prototype.delete;
Set.prototype.update = function (values) {
    for (var value in values) {
        if (values.hasOwnProperty(value)) {
            this.add(value);
        }
    }
};

/*************************************************************************
 * An implementation of iter()
 *************************************************************************/

class Iterable {
    constructor(data) {
        this.index = 0;
        this.data = data;
    }

    __next__() {
        const retval = this.data[this.index];
        if (retval === undefined) {
            throw new builtins.StopIteration();
        }
        this.index++;
        return retval;
    }
}

export function iter(data) {
    // if data is already iterable, just return it.
    if (data.__next__) {
        return data;
    }
    return new Iterable(data);
}

export function next(iterator) {
    return iterator.__next__();
}

/*************************************************************************
 * An implementation of range()
 *************************************************************************/

export function* range(start, stop, step = 1) {
    for (var current = start; current < stop; current += step) {
        yield current;
    }
}


/*************************************************************************
 * sprintf() implementation
 *************************************************************************/

export function _substitute (format, args) {
    var results = [];

    /* This is the general form regex for a sprintf-like string. */
    var re = /\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-gijosuxX])/g;
    var match;
    var lastIndex = 0;
    for (var i = 0; i < args.length; i++) {
        var arg = args[i];

        match = re.exec(format);
        if (match) {
            switch (match[8]) {
                case "b":
                    arg = arg.toString(2);
                    break;
                case "c":
                    arg = String.fromCharCode(arg);
                    break;
                case "d":
                case "i":
                    arg = parseInt(arg, 10);
                    break;
                case "j":
                    arg = JSON.stringify(arg, null, match[6] ? parseInt(match[6], 10) : 0);
                    break;
                case "e":
                    arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential();
                    break;
                case "f":
                    arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg);
                    break;
                case "g":
                    arg = match[7] ? parseFloat(arg).toPrecision(match[7]) : parseFloat(arg);
                    break;
                case "o":
                    arg = arg.toString(8);
                    break;
                case "s":
                    arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg);
                    break;
                case "u":
                    arg = arg >>> 0;
                    break;
                case "x":
                    arg = arg.toString(16);
                    break;
                case "X":
                    arg = arg.toString(16).toUpperCase();
                    break;
            }

            results.push(format.slice(lastIndex, match.index));
            lastIndex = re.lastIndex;
            results.push(arg);
        } else {
            throw new builtins.TypeError('not all arguments converted during string formatting');
        }
    }
    // Push the rest of the string.
    results.push(format.slice(re.lastIndex));
    return results.join('');
}



/*************************************************************************
 * Operator defintions that match Python-like behavior.
 *************************************************************************/

export var operators = {
    // UNARY operators.js
    POSITIVE: function (a) {
        return +a;
    },
    NEGATIVE: function (a) {
        return -a;
    },
    NOT: function (a) {
        return !a;
    },
    CONVERT: function () {
        throw new builtins.NotImplementedError('Unary convert not implemented');
    },
    INVERT: function () {
        throw new builtins.NotImplementedError('Unary invert not implemented');
    },

    // BINARY/INPLACE operators.js
    POWER: function (a, b) {
        return Math.pow(a, b);
    },
    MULTIPLY: function (a, b) {
        var result, i;
        if (a instanceof Array) {
            result = [];
            if (b instanceof Array) {
                throw new builtins.TypeError("can't multiply sequence by non-int of type 'list'");
            } else {
                for (i = 0; i < b; i++) {
                    result.extend(a);
                }
            }
        } else if (b instanceof Array) {
            result = [];
            for (i = 0; i < a; i++) {
                result.extend(b);
            }
        }
        else {
            result = a * b;
        }
        return result;
    },
    DIVIDE: function (a, b) {
        return Math.floor(a / b);
    },
    FLOOR_DIVIDE: function (a, b) {
        return Math.floor(a / b);
    },
    TRUE_DIVIDE: function (a, b) {
        return a / b;
    },
    MODULO: function (a, b) {
        if (typeof a === 'string') {
            if (b instanceof Array) {
                return _substitute(a, b);
            } else if (b instanceof Object) {
                throw new builtins.BataviaError("Named string formatting not supported");
            } else {
                return _substitute(a, [b]);
            }
        } else {
            return a % b;
        }
    },
    ADD: function (a, b) {
        var result;
        if (a instanceof Array) {
            if (b instanceof Array) {
                result = [];
                result.extend(a);
                result.extend(b);
            } else {
                throw new builtins.TypeError('can only concatenate list (not "' + (typeof b) + '") to list');
            }
        } else if (b instanceof Array) {
            throw new builtins.TypeError("unsupported operand type(s) for +: '" + (typeof a) + "' and 'list'");
        }
        else {
            result = a + b;
        }
        return result;
    },
    SUBTRACT: function (a, b) {
        return a - b;
    },
    SUBSCR: function (a, b) {
        if (b instanceof Object) {
            var start, stop, result;
            if (b.start === null) {
                start = 0;
            }
            if (b.stop === null) {
                stop = a.length;
            }
            if (b.step === 1) {
                result = a.slice(start, stop);
            } else {
                result = [];
                for (var i = start; i < stop; i += b.step) {
                    result.push(a[i]);
                }
            }
            return result;
        } else {
            return a[b];
        }
    },
    LSHIFT: function (a, b) {
        return a << b;
    },
    RSHIFT: function (a, b) {
        return a >> b;
    },
    AND: function (a, b) {
        return a & b;
    },
    XOR: function (a, b) {
        return a ^ b;
    },
    OR: function (a, b) {
        return a | b;
    }
};

export var comparisons = [
    function (x, y) {
        return x < y;
    },
    function (x, y) {
        return x <= y;
    },
    function (x, y) {
        return x == y; // jshint ignore:line
    },
    function (x, y) {
        return x != y; // jshint ignore:line
    },
    function (x, y) {
        return x > y;
    },
    function (x, y) {
        return x >= y;
    },
    function (x, y) {
        return x in y;
    },
    function (x, y) {
        return !(x in y);
    },
    function (x, y) {
        return x === y;
    },
    function (x, y) {
        return x !== y;
    },
    function () {
        return false;
    }
];