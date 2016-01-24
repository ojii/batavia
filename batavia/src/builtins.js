import {modules, stdout} from './batavia';

const WHITESPACE_REGEX = /(\r\n|\n|\r)/gm;

export class BaseException{
    constructor(...args){
        this.args = args;
    }
    toString(){
        return `${this.constructor.name}: ${this.args[0]}`;
    }
}

export class SystemExit extends BaseException {}
export class KeyboardInterrupt extends BaseException {}
export class GeneratorExit extends BaseException {}
export class Exception extends BaseException {}
export class StopIteration extends Exception {}
export class StopAsyncIteration extends Exception {}
export class ArithmeticError extends Exception {}
export class FloatingPointError extends ArithmeticError {}
export class OverflowError extends ArithmeticError {}
export class AssertionError extends Exception {}
export class AttributeError extends Exception {}
export class BufferError extends Exception {}
export class EOFError extends Exception {}
export class ImportError extends Exception {
    constructor(name){
        super(`No module named '${name}`);
    }
}
export class LookupError extends Exception {}
export class IndexError extends LookupError {}
export class KeyError extends LookupError {}
export class MemoryError extends Exception {}
export class NameError extends Exception {}
export class UnboundLocalError extends NameError {}
export class OSError extends Exception {}
export class BlockingIOError extends OSError {}
export class ChildProcessError extends OSError {}
export class ConnectionError extends OSError {}
export class BrokenPipeError extends ConnectionError {}
export class ConnectionAbortedError extends ConnectionError {}
export class ConnectionRefusedError extends ConnectionError {}
export class ConnectionResetError extends ConnectionError {}
export class FileExistsError extends OSError {}
export class FileNotFoundError extends OSError {}
export class InterruptedError extends OSError {}
export class ISADirectoryError extends OSError {}
export class NotADirectoryError extends OSError {}
export class PermissionError extends OSError {}
export class ProcessLookupError extends OSError {}
export class TimeoutError extends OSError {}
export class ReferenceError extends Exception {}
export class RuntimeError extends Exception {}
export class NotImplementedError extends RuntimeError {}
export class RecursionError extends RuntimeError {}
export class SyntaxError extends Exception {}
export class IndentationError extends SyntaxError {}
export class TabError extends IndentationError {}
export class SystemError extends Exception {}
export class TypeError extends Exception {}
export class ValueError extends Exception {}
export class UnicodeError extends ValueError {}
export class UnicodeDecodeError extends UnicodeError {}
export class UnicodeEncodeError extends UnicodeError {}
export class UnicodeTranslateError extends UnicodeError {}
export class Warning extends Exception {}
export class DepricationWarning extends Warning {}
export class PendingDeprecationWarning extends Warning {}
export class RuntimeWarning extends Warning {}
export class SyntaxWarning extends Warning {}
export class UserWarning extends Warning {}
export class FutureWarning extends Warning {}
export class ImportWarning extends Warning {}
export class UnicodeWarning extends Warning {}
export class BytesWarning extends Warning {}
export class ResourceWarning extends Warning {}

export class BataviaError extends Exception {}

export function __import__(args){
    const name = args[0], globals = args[1], names = args[3];
    let module, payload, bytecode, code, frame;
    if (modules.hasOwnProperty(name)){
        return modules[name];
    }

    try {
        payload = document.getElementById(`batavia-${name}`).text.replace(WHITESPACE_REGEX, "").trim();
        bytecode = atob(payload);
        code = modules.marshal.load_pyc(this, bytecode);
        frame = this.make_frame({
            code: code,
            f_globals: globals,
            f_locals: null
        });
        this.run_frame(frame);
        modules.sys.modules[name] = frame.f_locals;
        if (names === null){
            return modules.sys.modules[name];
        } else {
            module = {};
            for (var n in names){
                if (!name.hasOwnProperty(n)){continue;}
                module[n] = frame.f_locals[n];
            }
            return module;
        }
    } catch (err){
        throw new ImportError(name);
    }
}

export function abs(args){
    if (args.length !== 1){
        throw new TypeError(`abs() takes exactly one argument (${args.length} given)`);
    }
    if (args[0] === null){
        throw new TypeError("bad operatnd type for abs(): 'NoneType'");
    }
    return Math.abs(args[0]);
}

export function all(){
    throw new NotImplementedError("Builtin Batavia function 'all' not implemented");
}

export function any(){
    throw new NotImplementedError("Builtin Batavia function 'any' not implemented");
}

export function apply(){
    throw new NotImplementedError("Builtin Batavia function 'apply' not implemented");
}

export function basestring(){
    throw new NotImplementedError("Builtin Batavia function 'basestring' not implemented");
}
export function bin(){
    throw new NotImplementedError("Builtin Batavia function 'bin' not implemented");
}
export function bool(){
    throw new NotImplementedError("Builtin Batavia function 'bool' not implemented");
}
export function buffer(){
    throw new NotImplementedError("Builtin Batavia function 'buffer' not implemented");
}
export function bytearray(){
    throw new NotImplementedError("Builtin Batavia function 'bytearray' not implemented");
}
export function bytes(){
    throw new NotImplementedError("Builtin Batavia function 'bytes' not implemented");
}
export function callable(){
    throw new NotImplementedError("Builtin Batavia function 'callable' not implemented");
}
export function chr(args) {
    return String.fromCharCode(args[0]);
}
export function classmethod(){
    throw new NotImplementedError("Builtin Batavia function 'classmethod' not implemented");
}
export function cmp(){
    throw new NotImplementedError("Builtin Batavia function 'cmp' not implemented");
}
export function coerce(){
    throw new NotImplementedError("Builtin Batavia function 'coerce' not implemented");
}
export function compile(){
    throw new NotImplementedError("Builtin Batavia function 'compile' not implemented");
}
export function complex(){
    throw new NotImplementedError("Builtin Batavia function 'complex' not implemented");
}
export function copyright(){
    throw new NotImplementedError("Builtin Batavia function 'copyright' not implemented");
}
export function credits(){
    throw new NotImplementedError("Builtin Batavia function 'credits' not implemented");
}
export function delattr(){
    throw new NotImplementedError("Builtin Batavia function 'delattr' not implemented");
}
export function dict(){
    throw new NotImplementedError("Builtin Batavia function 'dict' not implemented");
}
export function dir(){
    throw new NotImplementedError("Builtin Batavia function 'dir' not implemented");
}
export function divmod(){
    throw new NotImplementedError("Builtin Batavia function 'divmod' not implemented");
}
export function enumerate(){
    throw new NotImplementedError("Builtin Batavia function 'enumerate' not implemented");
}
/*
eval isn't allowed to be re-bound
export function eval(){
    throw new NotImplementedError("Builtin Batavia function 'eval' not implemented");
}
*/
export function execfile(){
    throw new NotImplementedError("Builtin Batavia function 'execfile' not implemented");
}
export function exit(){
    throw new NotImplementedError("Builtin Batavia function 'exit' not implemented");
}
export function file(){
    throw new NotImplementedError("Builtin Batavia function 'file' not implemented");
}
export function filter(){
    throw new NotImplementedError("Builtin Batavia function 'filter' not implemented");
}
export function float(){
    throw new NotImplementedError("Builtin Batavia function 'float' not implemented");
}
export function format(){
    throw new NotImplementedError("Builtin Batavia function 'format' not implemented");
}
export function frozenset(){
    throw new NotImplementedError("Builtin Batavia function 'frozenset' not implemented");
}
export function getattr(){
    throw new NotImplementedError("Builtin Batavia function 'getattr' not implemented");
}
export function globals(){
    throw new NotImplementedError("Builtin Batavia function 'globals' not implemented");
}
export function hasattr(){
    throw new NotImplementedError("Builtin Batavia function 'hasattr' not implemented");
}
export function hash(){
    throw new NotImplementedError("Builtin Batavia function 'hash' not implemented");
}
export function help(){
    throw new NotImplementedError("Builtin Batavia function 'help' not implemented");
}
export function hex(){
    throw new NotImplementedError("Builtin Batavia function 'hex' not implemented");
}
export function id(){
    throw new NotImplementedError("Builtin Batavia function 'id' not implemented");
}
export function input(){
    throw new NotImplementedError("Builtin Batavia function 'input' not implemented");
}
export function int(args) {
    var base = 10;
    if (args.length > 1) {
        base = args[1];
    }
    return parseInt(args[0], base);
}
export function intern(){
    throw new NotImplementedError("Builtin Batavia function 'intern' not implemented");
}
export function isinstance(){
    throw new NotImplementedError("Builtin Batavia function 'isinstance' not implemented");
}
export function issubclass(){
    throw new NotImplementedError("Builtin Batavia function 'issubclass' not implemented");
}
export function iter(){
    throw new NotImplementedError("Builtin Batavia function 'iter' not implemented");
}
export function len(args) {
    return args[0].length;
}
export function license(){
    throw new NotImplementedError("Builtin Batavia function 'license' not implemented");
}
export function list(){
    throw new NotImplementedError("Builtin Batavia function 'list' not implemented");
}
export function locals(){
    throw new NotImplementedError("Builtin Batavia function 'locals' not implemented");
}
export function long(){
    throw new NotImplementedError("Builtin Batavia function 'long' not implemented");
}
export function map(args) {
    // FIXME
    args[0].call(this, [args[1]], {});
}
export function max(args) {
    return Math.max.apply(null, args);
}
export function memoryview(){
    throw new NotImplementedError("Builtin Batavia function 'memoryview' not implemented");
}
export function min(args) {
    return Math.min.apply(null, args);
}
export function next(iterator) {
    return iterator.__next__();
}
export function object(){
    throw new NotImplementedError("Builtin Batavia function 'object' not implemented");
}
export function oct(){
    throw new NotImplementedError("Builtin Batavia function 'oct' not implemented");
}
export function open(){
    throw new NotImplementedError("Builtin Batavia function 'open' not implemented");
}
export function ord(args) {
    return args[0].charCodeAt(0);
}
export function pow(){
    throw new NotImplementedError("Builtin Batavia function 'pow' not implemented");
}
export function print(args) {
    stdout(args.join(' ') + '\n');
}
export function property(){
    throw new NotImplementedError("Builtin Batavia function 'property' not implemented");
}
export function quit(){
    throw new NotImplementedError("Builtin Batavia function 'quit' not implemented");
}
export function* range(args) {
    for (var current = args[0]; current < args[1]; current += (args[2] || 1)) {
        yield current;
    }
}
export function raw_input(){
    throw new NotImplementedError("Builtin Batavia function 'raw_input' not implemented");
}
export function reduce(){
    throw new NotImplementedError("Builtin Batavia function 'reduce' not implemented");
}
export function reload(){
    throw new NotImplementedError("Builtin Batavia function 'reload' not implemented");
}
export function repr(){
    throw new NotImplementedError("Builtin Batavia function 'repr' not implemented");
}
export function reversed(){
    throw new NotImplementedError("Builtin Batavia function 'reversed' not implemented");
}
export function round(){
    throw new NotImplementedError("Builtin Batavia function 'round' not implemented");
}
export function set(){
    throw new NotImplementedError("Builtin Batavia function 'set' not implemented");
}
export function setattr(){
    throw new NotImplementedError("Builtin Batavia function 'setattr' not implemented");
}
export function slice(args) {
    if (args.length === 1) {
        return {
            start: 0,
            stop: args[0],
            step: 1
        };
    } else {
        return {
            start: args[0],
            stop: args[1],
            step: args[2] || 1
        };
    }
}
export function sorted(){
    throw new NotImplementedError("Builtin Batavia function 'sorted' not implemented");
}
export function staticmethod(){
    throw new NotImplementedError("Builtin Batavia function 'staticmethod' not implemented");
}
export function str(args) {
    window.console.log(typeof args[0]);
    // FIXME: object's __str__ method should be used if available
    return String(args[0]);
}
export function sum(args) {
    return args.reduce(function (a, b) {
        return a + b;
    });
}
/*
// super is a keyword in JS
export function super(){
    throw new NotImplementedError("Builtin Batavia function 'super' not implemented");
}*/
export function tuple(){
    throw new NotImplementedError("Builtin Batavia function 'tuple' not implemented");
}
export function type(){
    throw new NotImplementedError("Builtin Batavia function 'type' not implemented");
}
export function unichr(){
    throw new NotImplementedError("Builtin Batavia function 'unichr' not implemented");
}
export function unicode(){
    throw new NotImplementedError("Builtin Batavia function 'unicode' not implemented");
}
export function vars(){
    throw new NotImplementedError("Builtin Batavia function 'vars' not implemented");
}
export function xrange(){
    throw new NotImplementedError("Builtin Batavia function 'xrange' not implemented");
}
export function zip(){
    throw new NotImplementedError("Builtin Batavia function 'zip' not implemented");
}