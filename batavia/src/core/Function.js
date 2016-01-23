import {modules} from '../batavia';

export function make_callable(func) {
    return function (args, kwargs, locals) {
        let callargs = modules.inspect.getcallargs(func, args, kwargs),
            frame = this.make_frame({
                'code': func.__code__,
                'callargs': callargs,
                'f_globals': func.__globals__,
                'f_locals': locals || {}
            }),
            gen,
            retval;

        if (func.__code__.co_flags & modules.dis.CO_GENERATOR) {
            // FIXME: where does Generator come from?
            gen = new Generator(frame, this);
            frame.generator = gen;
            retval = gen;
        } else {
            retval = this.run_frame(frame);
        }
        return retval;
    };
}

export class PyFunction {
    constructor(name, code, globals, defaults, closure/*, vm*/) {
        // this._vm = vm;
        this.__code__ = code;
        this.__globals__ = globals;
        this.__defaults__ = defaults;
        this.__kwdefaults__ = null;
        this.__closure__ = closure;
        if (code.co_consts.length > 0) {
            this.__doc__ = code.co_consts[0];
        } else {
            this.__doc__ = null;
        }
        this.__name__ = name || code.co_name;
        this.__dict__ = {};
        this.__annotations__ = {};
        this.__qualname__ = this.__name__;

        // var kw = {
        //     'argdefs': this.__defaults__,
        // }
        // if (closure) {
        //     kw['closure'] = tuple(make_cell(0) for _ in closure)
        // }

        this.__call__ = make_callable(this);

        this.argspec = modules.inspect.getfullargspec(this);
    }
}
