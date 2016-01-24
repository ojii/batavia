import {modules, stdout} from './batavia';
import * as builtins from './builtins';
import {Block} from './core/Block';
import {Frame} from './core/Frame';
import {PyFunction} from './core/Function';
import {operators, comparisons, assert, iter} from './utils';

function build_class(args) {
    const func = args[0],
    // Create a locals context, and run the class function in it.
        locals = {};
    let klass;
    func.__call__.apply(this, [[], [], locals]);
    // Now construct the class, based on the constructed local context.
    klass = function (vm, args, kwargs) {
        if (this.__init__) {
            for (var attr in Object.getPrototypeOf(this)) {
                if (this[attr].__call__) {
                    this[attr].__self__ = this;
                }
            }
            this.__init__.__call__.apply(vm, [args, kwargs]);
        }
    };

    for (var attr in locals) {
        if (locals.hasOwnProperty(attr)) {
            klass.prototype[attr] = locals[attr];
        }
    }

    return ((vm, klass) => {
        return (args, kwargs) => {
            return new klass(vm, args, kwargs);
        };
    })(this, klass);
}

export class VirtualMachine {
    constructor() {
        modules.dis.init();
        this.frames = [];
        this.frame = null;
        this.return_value = null;
        this.last_exception = null;
    }

    run(tag, args) {
        args = args || [];
        const payload = document.getElementById('batavia-' + tag).text.replace(/(\r\n|\n|\r)/gm, "").trim();
        this.run_payload(payload, args);
    }

    run_payload(payload, args) {
        args = args || [];
        const bytecode = atob(payload);
        const code = modules.marshal.load_pyc(this, bytecode);
        // Set up sys.argv
        modules.sys.argv = ['batavia'];
        modules.sys.argv.extend(args);

        // Run the code
        this.run_code({'code': code});
    }

    PyErr_Occurred() {
        return this.last_exception !== null;
    }

    PyErr_SetString(exc, message) {
        window.console.log("SET EXCEPTION", exc, message);
        this.last_exception = {
            exception: exc,
            message: message
        };
    }

    top() {
        return this.frame.stack[this.frame.stack.length - 1];
    }

    pop(i = 0) {
        return this.frame.stack.splice(this.frame.stack.length - 1 - i, 1)[0];
    }

    push(val) {
        this.frame.stack.append(val);
    }

    popn(n) {
        if (n) {
            return this.frame.stack.splice(this.frame.stack.length - n, n);
        } else {
            return [];
        }
    }

    peek(n) {
        return this.frame.stack[this.frame.stack.length - n];
    }

    jump(to) {
        this.frame.f_lasti = to;
    }

    push_block(type, handler, level) {
        if (level === null) {
            level = this.frame.stack.length;
        }
        this.frame.block_stack.append(new Block(type, handler, level));
    }

    pop_block() {
        return this.frame.block_stack.pop();
    }

    make_frame(kwargs) {
        const code = kwargs.code,
            callargs = kwargs.callargs || {};
        let f_globals = kwargs.f_globals || null,
            f_locals = kwargs.f_locals || null;
        if (f_globals !== null) {
            if (f_locals === null) {
                f_locals = f_globals.copy();
            }
        } else if (this.frames.length > 0) {
            f_globals = this.frame.f_globals;
            f_locals = {};
        } else {
            f_globals = f_locals = {
                __builtins__: builtins,
                __name__: '__main__',
                __doc__: null,
                __package__: null
            };
        }
        f_locals.update(callargs);
        return new Frame({
            f_code: code,
            f_globals: f_globals,
            f_locals: f_locals,
            f_back: this.frame
        });
    }

    push_frame(frame) {
        this.frames.append(frame);
        this.frame = frame;
    }

    pop_frame() {
        this.frames.pop();
        if (this.frames.length) {
            this.frame = this.frames[this.frames.length - 1];
        } else {
            this.frame = null;
        }
    }

    run_code(kwargs) {
        const val = this.run_frame(this.make_frame({
            'code': kwargs.code,
            'f_globals': kwargs.f_globals || null,
            'f_locals': kwargs.f_locals || null
        }));

        // Check some invariants
        if (this.frames.length > 0) {
            throw new builtins.BataviaError("Frames left over!");
        }
        if (this.frame && this.frame.stack.length > 0) {
            throw new builtins.BataviaError("Data left on stack! " + this.frame.stack);
        }
        return val;
    }

    unwind_block(block) {
        let offset, exc;
        if (block.type === 'except-handler') {
            offset = 3;
        } else {
            offset = 0;
        }
        while (this.frame.stack.length > block.level + offset) {
            this.pop();
        }

        if (block.type === 'except-handler') {
            exc = this.popn(3);
            this.last_exception = {
                exctype: exc[2],
                value: exc[1],
                tb: exc[0]
            };
        }
    }

    parse_byte_and_args() {
        let operation = {
            'opoffset': this.frame.f_lasti,
            'opcode': this.frame.f_code.co_code[this.frame.f_lasti],
            'args': []
        }, arg, intArg, var_idx;
        this.frame.f_lasti += 1;
        if (operation.opcode >= modules.dis.HAVE_ARGUMENT) {
            arg = this.frame.f_code.co_code.slice(this.frame.f_lasti, this.frame.f_lasti + 2);
            this.frame.f_lasti += 2;
            intArg = arg[0] + (arg[1] << 8);
            if (modules.dis.hasconst.has(operation.opcode)) {
                operation.args = [this.frame.f_code.co_consts[intArg]];
            } else if (modules.dis.hasfree.has(operation.opcode)) {
                if (intArg < this.frame.f_code.co_cellvars.length) {
                    operation.args = [this.frame.f_code.co_cellvars[intArg]];
                } else {
                    var_idx = intArg - this.frame.f_code.co_cellvars.length;
                    operation.args = [this.frame.f_code.co_freevars[var_idx]];
                }
            } else if (modules.dis.hasname.has(operation.opcode)) {
                operation.args = [this.frame.f_code.co_names[intArg]];
            } else if (modules.dis.hasjrel.has(operation.opcode)) {
                operation.args = [this.frame.f_lasti + intArg];
            } else if (modules.dis.hasjabs.has(operation.opcode)) {
                operation.args = [intArg];
            } else if (modules.dis.haslocal.has(operation.opcode)) {
                operation.args = [this.frame.f_code.co_varnames[intArg]];
            } else {
                operation.args = [intArg];
            }
        }

        return operation;
    }

    log(opcode) {
        let indent = "    " * (this.frames.length - 1),
            op = `${opcode.opoffset}: ${opcode.byteName}`;
        for (var arg in opcode.args) {
            if (!opcode.args.hasOwnProperty(arg)) {
                continue;
            }
            op += ` ${opcode.args[arg]}`;
        }
        window.console.log(`  ${indent}data: ${this.frame.stack}`);
        window.console.log(`  ${indent}blks: ${this.frame.block_stack}`);
        window.console.log(`${indent}${op}`);
    }

    dispatch(opcode, args) {
        let bytecode_fn, why = null;
        try {
            // window.console.log('OPCODE: ', modules.dis.opname[opcode];, args);
            if (modules.dis.unary_ops.has(opcode)) {
                this.unaryOperator(modules.dis.opname[opcode].slice(6));
            } else if (modules.dis.binary_ops.has(opcode)) {
                this.binaryOperator(modules.dis.opname[opcode].slice(7));
            } else if (modules.dis.inplace_ops.has(opcode)) {
                this.inplaceOperator(modules.dis.opname[opcode].slice(8));
                // } else if (opcode in modules.dis.slice_ops) {
                //     this.sliceOperator(modules.dis.opname[opcode]);
            } else {
                // dispatch
                bytecode_fn = this[`byte_${modules.dis.opname[opcode]}`];
                if (!bytecode_fn) {
                    throw new builtins.BataviaError(
                        `Unknown opcode ${opcode} (${modules.dis.opname[opcode]})`
                    );
                }
                why = bytecode_fn.apply(this, args);
            }
        } catch (err) {
            // deal with exceptions encountered while executing the op.
            //FIXME this.last_exception = sys.exc_info()[:2] + (null,);
            stdout(err);
            why = 'exception';
            this.last_exception = err;
        }
        return why;
    }

    manage_block_stack(why) {
        assert(why !== 'yield');
        let exc, block = this.frame.block_stack[this.frame.block_stack.length - 1];
        if (block.type === 'loop' && why === 'continue') {
            this.jump(this.return_value);
            why = null;
            return why;
        }

        this.pop_block();
        this.unwind_block(block);

        if (block.type === 'loop' && why === 'break') {
            why = null;
            this.jump(block.handler);
            return why;
        }

        if (why === 'exception' &&
            (block.type === 'setup-except' || block.type === 'finally')) {
            this.push_block('except-handler');
            exc = this.last_exception;
            this.push(exc[2]);
            this.push(exc[1]);
            this.push(exc[0]);
            // PyErr_Normalize_Exception goes here
            this.push(exc[2]);
            this.push(exc[1]);
            this.push(exc[0]);
            why = null;
            this.jump(block.handler);
            return why;
        } else if (block.type === 'finally') {
            if (why === 'return' || why === 'continue') {
                this.push(this.return_value);
            }
            this.push(why);

            why = null;
            this.jump(block.handler);
            return why;
        }

        return why;
    }

    run_frame(frame) {
        let why, operation;

        this.push_frame(frame);
        while (true) {
            operation = this.parse_byte_and_args();
            // this.log(operation);

            // When unwinding the block stack, we need to keep track of why we
            // are doing it.
            why = this.dispatch(operation.opcode, operation.args);
            if (why === 'exception') {
                // TODO: ceval calls PyTraceBack_Here, not sure what that does.
            }

            if (why === 'reraise') {
                why = 'exception';
            }

            if (why !== 'yield') {
                while (why && frame.block_stack.length > 0) {
                    // Deal with any block management we need to do.
                    why = this.manage_block_stack(why);
                }
            }

            if (why) {
                break;
            }
        }

        // TODO: handle generator exception state

        this.pop_frame();

        if (why === 'exception') {
            throw this.last_exception;
        }

        return this.return_value;
    }

    byte_LOAD_CONST(c) {
        this.push(c);
    }

    byte_POP_TOP() {
        this.pop();
    }

    byte_DUP_TOP() {
        this.push(this.top());
    }

    byte_DUP_TOPX(count) {
        const items = this.popn(count);
        for (var n = 0; n < 2; n++) {
            for (var i = 0; i < count; i++) {
                this.push(items[i]);
            }
        }
    }

    byte_DUP_TOP_TWO() {
        const items = this.popn(2);
        this.push(items[0]);
        this.push(items[1]);
        this.push(items[0]);
        this.push(items[1]);
    }

    byte_ROT_TWO() {
        const items = this.popn(2);
        this.push(items[1]);
        this.push(items[2]);
    }

    byte_ROT_THREE() {
        const items = this.popn(3);
        this.push(items[2]);
        this.push(items[0]);
        this.push(items[1]);
    }

    byte_ROT_FOUR() {
        const items = this.popn(4);
        this.push(items[3]);
        this.push(items[0]);
        this.push(items[1]);
        this.push(items[2]);
    }

    byte_LOAD_NAME(name) {
        const frame = this.frame;
        let val;
        if (frame.f_locals.hasOwnProperty(name)) {
            val = frame.f_locals[name];
        } else if (frame.f_globals.hasOwnProperty(name)) {
            val = frame.f_globals[name];
        } else if (frame.f_builtins.hasOwnProperty(name)) {
            val = frame.f_builtins[name];
        } else {
            throw new builtins.NameError(`name '${name}' is not defined`);
        }
        this.push(val);
    }

    byte_STORE_NAME(name) {
        this.frame.f_locals[name] = this.pop();
    }

    byte_DELETE_NAME(name) {
        delete this.frame.f_locals[name];
    }

    byte_LOAD_FAST(name) {
        if (this.frame.f_locals.hasOwnProperty(name)) {
            this.push(this.frame.f_locals[name]);
        } else {
            throw new builtins.NameError(`local variable '${name}' referenced before assignment`);
        }
    }

    byte_STORE_FAST(name) {
        this.frame.f_locals[name] = this.pop();
    }

    byte_DELETE_FAST(name) {
        delete this.frame.f_locals[name];
    }

    byte_STORE_GLOBAL(name) {
        this.frame.f_globals[name] = this.pop();
    }

    byte_LOAD_GLOBAL(name) {
        let val;
        if (this.frame.f_globals.hasOwnProperty(name)) {
            val = this.frame.f_globals[name];
        } else if (this.frame.f_builtins.hasOwnProperty(name)) {
            val = this.frame.f_builtins[name];
        } else {
            throw new builtins.NameError(`Global name '${name}' is not defined`);
        }
        this.push(val);
    }

    byte_LOAD_DEREF(name) {
        this.push(this.frame.cells[name].get());
    }

    byte_STORE_DEREF(name) {
        this.frame.cells[name].set(this.pop());
    }

    byte_LOAD_LOCALS() {
        this.push(this.frame.f_locals());
    }

    unaryOperator(op) {
        const x = this.pop();
        this.push(operators[op](x));
    }

    binaryOperator(op) {
        const items = this.popn(2);
        this.push(operators[op](items[0], items[1]));
    }

    inplaceOperator(op) {
        const items = this.popn(2);
        this.push(operators[op](items[0], items[1]));
    }

    byte_COMPARE_OP(opnum) {
        const items = this.popn(2);
        this.push(comparisons[opnum](items[0], items[1]));
    }

    byte_LOAD_ATTR(attr) {
        const obj = this.pop();
        this.push(obj[attr]);
    }

    byte_STORE_ATTR(name) {
        const items = this.popn(2);
        items[1][name] = items[0];
    }

    byte_DELETE_ATTR(name) {
        const obj = this.pop();
        delete obj[name];
    }

    byte_STORE_SUBSCR() {
        const items = this.popn(3);
        items[2][items[1]] = items[0];
    }

    byte_DELETE_SUBSCR() {
        const items = this.popn(2);
        delete items[1][items[0]];
    }

    byte_BUILD_TUPLE(count) {
        this.push(this.popn(count));
    }

    byte_BUILD_LIST(count) {
        this.push(this.popn(count));
    }

    byte_BUILD_SET(count) {
        const retval = new Set();
        for (var i = 0; i < count; i++) {
            retval.add(this.pop());
        }
        this.push(retval);
    }

    byte_BUILD_MAP() {
        this.push({});
    }

    byte_STORE_MAP() {
        const items = this.popn(3);
        items[0][items[1]] = items[2];
        this.push(items[0]);
    }

    byte_UNPACK_SEQUENCE() {
        const seq = this.pop();
        if (seq.__next__) {
            try {
                while (true) {
                    this.push(seq.__next__());
                }
            } catch (err) {
            }
        } else {
            for (var i = seq.length; i > 0; i--) {
                this.push(seq[i]);
            }
        }
    }

    byte_BUILD_SLICE(count) {
        if (count === 2 || count === 3) {
            const items = this.popn(count);
            this.push(builtins.slice(items));
        } else {
            throw new builtins.BataviaError(`Strange BUILD_SLICE count: ${count}`);
        }
    }

    byte_LIST_APPEND(count) {
        const val = this.pop(), the_list = this.peek(count);
        the_list.append(val);
    }

    byte_SET_ADD(count) {
        const val = this.pop, the_set = this.peek(count);
        the_set.add(val);
    }

    byte_MAP_ADD(count) {
        const items = this.popn(2), the_map = this.peek(count);
        the_map[items[1]] = items[0];
    }

    byte_PRINT_EXPR() {
        stdout(this.pop());
    }

    byte_PRINT_ITEM() {
        this.print_item(this.pop());
    }

    byte_PRINT_ITEM_TO() {
        const to = this.pop(); // FIXME - this is ignored.
        this.print_item(this.pop(), to);
    }

    byte_PRINT_NEWLINE() {
        this.print_newline();
    }

    byte_PRINT_NEWLINE_TO() {
        const to = this.pop(); // FIXME - this is ignored.
        this.print_newline(to);
    }

    print_item(item, to) {
        if (to === undefined) {
            // to = sys.stdout;  // FIXME - this is ignored
        }
        stdout(item);
    }

    print_newline(to) {
        if (to === undefined) {
            // to = sys.stdout;  // FIXME - this is ignored
        }
        stdout("");
    }

    byte_JUMP_FORWARD(jump) {
        this.jump(jump);
    }

    byte_JUMP_ABSOLUTE(jump) {
        this.jump(jump);
    }

    byte_POP_JUMP_IF_TRUE(jump) {
        if (this.pop()) {
            this.jump(jump);
        }
    }

    byte_POP_JUMP_IF_FALSE(jump) {
        if (!this.pop()) {
            this.jump(jump);
        }
    }

    byte_POP_JUMP_IF_TRUE_OR_POP(jump) {
        const val = this.top();
        if (val) {
            this.jump(jump);
        } else {
            this.pop();
        }
    }

    byte_JUMP_IF_FALSE_OR_POP(jump) {
        const val = this.top();
        if (!val) {
            this.jump(jump);
        } else {
            this.pop();
        }
    }

    byte_SETUP_LOOP(dest) {
        this.push_block('loop', dest);
    }

    byte_GET_ITER() {
        this.push(iter(this.pop()));
    }

    byte_FOR_ITER(jump) {
        const iterobj = this.top();
        let v;
        try {
            v = builtins.next(iterobj);
            this.push(v);
        } catch (err) {
            if (err instanceof builtins.StopIteration) {
                this.pop();
                this.jump(jump);
            } else {
                throw err;
            }
        }
    }

    byte_BREAK_LOOP() {
        return 'break';
    }

    byte_CONTINUE_LOOP(dest) {
        this.return_value = dest;
        return 'continue';
    }

    byte_SETUP_EXCEPT(dest) {
        this.push_block('setup-except', dest);
    }

    byte_SETUP_FINALLY(dest) {
        this.push_block('finally', dest);
    }

// byte_END_FINALLY() {
//     var v = this.pop();
//     if isinstance(v, str):
//         why = v
//         if why in ('return', 'continue'):
//             this.return_value = this.pop()
//         if why == 'silenced':       // PY3
//             block = this.pop_block()
//             assert block.type == 'except-handler'
//             this.unwind_block(block)
//             why = null
//     elif v is null:
//         why = null
//     elif issubclass(v, BaseException):
//         exctype = v
//         val = this.pop()
//         tb = this.pop()
//         this.last_exception = (exctype, val, tb)
//         why = 'reraise'
//     else:       // pragma: no cover
//         throw "Confused END_FINALLY")
//     return why
// }
    byte_POP_BLOCK() {
        this.pop_block();
    }

    byte_RAISE_VARARGS(argc) {
        let cause, exc;
        if (argc === 2) {
            cause = this.pop();
            exc = this.pop();
        } else if (argc === 1) {
            exc = this.pop();
        }
        return this.do_raise(exc, cause);
    }

//     do_throw(exc, cause) {
//             if exc is null:         // reraise
//                 exc_type, val, tb = this.last_exception
//                 if exc_type is null:
//                     return 'exception'      // error
//                 else:
//                     return 'reraise'

//             elif type(exc) == type:
//                 // As in `throw ValueError`
//                 exc_type = exc
//                 val = exc()             // Make an instance.
//             elif isinstance(exc, BaseException):
//                 // As in `throw ValueError('foo')`
//                 exc_type = type(exc)
//                 val = exc
//             else:
//                 return 'exception'      // error

//             // If you reach this point, you're guaranteed that
//             // val is a valid exception instance and exc_type is its class.
//             // Now do a similar thing for the cause, if present.
//             if cause:
//                 if type(cause) == type:
//                     cause = cause()
//                 elif not isinstance(cause, BaseException):
//                     return 'exception'  // error

//                 val.__cause__ = cause

//             this.last_exception = exc_type, val, val.__traceback__
//             return 'exception'
// }
//      byte_POP_EXCEPT(){
//         block = this.pop_block()
//         if block.type != 'except-handler':
//             throw Exception("popped block is not an except handler")
//         this.unwind_block(block)
// }
//      byte_SETUP_WITH(dest) {
//         ctxmgr = this.pop()
//         this.push(ctxmgr.__exit__)
//         ctxmgr_obj = ctxmgr.__enter__()
//         if PY2:
//             this.push_block('with', dest)
//         elif PY3:
//             this.push_block('finally', dest)
//         this.push(ctxmgr_obj)
// }
//      byte_WITH_CLEANUP(){
//         // The code here does some weird stack manipulation: the exit function
//         // is buried in the stack, and where depends on what's on top of it.
//         // Pull out the exit function, and leave the rest in place.
//         v = w = null
//         u = this.top()
//         if u is null:
//             exit_func = this.pop(1)
//         elif isinstance(u, str):
//             if u in ('return', 'continue'):
//                 exit_func = this.pop(2)
//             else:
//                 exit_func = this.pop(1)
//             u = null
//         elif issubclass(u, BaseException):
//             if PY2:
//                 w, v, u = this.popn(3)
//                 exit_func = this.pop()
//                 this.push(w, v, u)
//             elif PY3:
//                 w, v, u = this.popn(3)
//                 tp, exc, tb = this.popn(3)
//                 exit_func = this.pop()
//                 this.push(tp, exc, tb)
//                 this.push(null)
//                 this.push(w, v, u)
//                 block = this.pop_block()
//                 assert block.type == 'except-handler'
//                 this.push_block(block.type, block.handler, block.level-1)
//         else:       // pragma: no cover
//             throw "Confused WITH_CLEANUP")
//         exit_ret = exit_func(u, v, w)
//         err = (u is not null) and bool(exit_ret)
//         if err:
//             // An error occurred, and was suppressed
//             if PY2:
//                 this.popn(3)
//                 this.push(null)
//             elif PY3:
//                 this.push('silenced')

//     #// Functions
// }
    byte_MAKE_FUNCTION(argc) {
        const name = this.pop(),
            code = this.pop(),
            defaults = this.popn(argc);
        this.push(new PyFunction(name, code, this.frame.globals, defaults, null, this));
    }

    byte_LOAD_CLOSURE(name) {
        this.push(this.frame.cells[name]);
    }

    byte_MAKE_CLOSURE(argc) {
        const name = this.pop(),
            items = this.popn(2),
            defaults = this.popn(argc),
            fn = new PyFunction(name, items[1], this.frame.f_globals, defaults, items[0], this);
        this.push(fn);
    }

    byte_CALL_FUNCTION(arg) {
        return this.call_function(arg, [], {});
    }

    byte_CALL_FUNCTION_VAR(arg) {
        return this.call_function(arg, this.pop(), {});
    }

    byte_CALL_FUNCTION_KW(arg) {
        return this.call_function(arg, [], this.pop());
    }

    byte_CALL_FUNCTION_VAR_KW(arg) {
        const items = this.popn(2);
        return this.call_function(arg, ...items);
    }

    call_function(arg, args, kwargs) {
        const lenKw = Math.floor(arg / 256),
            lenPos = arg % 256,
            namedargs = {};
        let items, posargs, func, retval;

        for (var i = 0; i < lenKw; i++) {
            items = this.popn(2);
            namedargs[items[0]] = items[1];
        }
        namedargs.update(kwargs);
        posargs = this.popn(lenPos);
        posargs.extend(args);

        func = this.pop();

        if (func.hasOwnProperty('im_func')) {
            if (func.im_self) {
                posargs.insert(0, func.im_self);
            }
            if (!builtins.isisntance(posargs[0], func.im_class)) {
                throw new builtins.BataviaError(
                    `unbound method ${func.im_func.__name__}() must be called ` +
                    `with ${func.im_class.__name__} instance as first argument ` +
                    `(got ${builtins.type(posargs[0]).__name__} instance instead`
                );
            }
            func = func.im_func;
        } else if (func.hasOwnProperty('__call__')) {
            func = func.__call__;
        }
        retval = func.apply(this, [posargs, namedargs]);
        this.push(retval);
    }

    byte_RETURN_VALUE() {
        this.return_value = this.pop();
        if (this.frame.generator) {
            this.frame.generator.finished = true;
        }
        return "return";
    }

//  byte_YIELD_VALUE(){
//         this.return_value = this.pop()
//         return "yield"
// }
//  byte_YIELD_FROM(){
//         u = this.pop()
//         x = this.top()

//         try:
//             if not isinstance(x, Generator) or u is null:
//                 // Call next on iterators.
//                 retval = next(x)
//             else:
//                 retval = x.send(u)
//             this.return_value = retval
//         except StopIteration as e:
//             this.pop()
//             this.push(e.value)
//         else:
//             // YIELD_FROM decrements f_lasti, so that it will be called
//             // repeatedly until a StopIteration is raised.
//             this.jump(this.frame.f_lasti - 1)
//             // Returning "yield" prevents the block stack cleanup code
//             // from executing, suspending the frame in its current state.
//             return "yield"

//     #// Importing
// }
    byte_IMPORT_NAME(name) {
        const items = this.popn(2);
        this.push(
            builtins.__import__.apply(this, [[name, this.frame.f_globals, this.frame.f_locals, items[1], items[0]]])
        );
    }

    byte_IMPORT_STAR() {
        const mod = this.pop();
        for (var attr in mod) {
            if (attr[0] !== '_') {
                this.frame.f_locals[attr] = mod[attr];
            }
        }
    }

    byte_IMPORT_FROM(name) {
        const mod = this.top();
        this.push(mod[name]);
    }

//  byte_EXEC_STMT() {
//     stmt, globs, locs = this.popn(3)
//     six.exec_(stmt, globs, locs) f
// };
    byte_LOAD_BUILD_CLASS() {
        this.push(build_class.bind(this));
    }

    byte_STORE_LOCALS() {
        this.frame.f_locals = this.pop();
    }

    byte_SET_LINENO(lineno) {
        this.frame.f_lineno = lineno;
    }
}
