import {assert} from '../utils';
import {id} from '../builtins';
import {Cell} from './cell';

export class Frame {
    constructor(kwargs) {
        let v, cell;

        this.f_code = kwargs.f_code;
        this.f_globals = kwargs.f_globals;
        this.f_locals = kwargs.f_locals;
        this.f_back = kwargs.f_back;
        this.stack = [];

        if (this.f_back) {
            this.f_builtins = this.f_back.f_builtins;
        } else {
            this.f_builtins = this.f_locals.__builtins__;
            if (this.f_builtins.hasOwnProperty('__dict__')) {
                this.f_builtins = this.f_builtins.__dict__;
            }
        }

        this.f_lineno = this.f_code.co_firstlineno;
        this.f_lasti = 0;

        if (this.f_code.co_cellvars.length > 0) {
            this.cells = {};
            if (this.f_back && !this.f_back.cells) {
                this.f_back.cells = {};
            }
            for (v in this.f_code.co_cellvars) {
                if (!this.f_code.co_cellvars.hasOwnProperty(v)){continue;}
                // Make a cell for the variable in our locals, or null.
                cell = new Cell(this.f_locals[v]);
                if (this.f_back) {
                    this.f_back.cells[v] = this.cells[v] = cell;
                }
            }
        } else {
            this.cells = null;
        }

        if (this.f_code.co_freevars.length > 0) {
            if (!this.cells) {
                this.cells = {};
            }
            for (v in this.f_code.co_freevars) {
                if (!this.f_code.co_freevars.hasOwnProperty(v)){continue;}
                assert(this.cells !== null);
                assert(this.f_back.cells, `f_back.cells: ${this.f_back.cells}`);
                this.cells[v] = this.f_back.cells[v];
            }
        }
        this.block_stack = [];
        this.generator = null;
    }

    __repr__() {
        // FIXME: where does id and self come from?
        return `<Frame at 0x${id(this)}: ${this.f_code.co_filename} @ ${this.f_lineno}>`;
    }

    line_number() {
        // Get the current line number the frame is executing.
        // We don't keep f_lineno up to date, so calculate it based on the
        // instruction address and the line number table.
        let byte_increments = [], //six.iterbytes(lnotab[0::2]);
            line_increments = [], //six.iterbytes(lnotab[1::2]);
            byte_num = 0,
            line_num = this.f_code.co_firstlineno,
            byte_incr,
            line_incr,
            incr;

        for (var i = 0; i < byte_increments.length; i++){
            incr = byte_increments[i];
            byte_incr = byte_increments[incr];
            line_incr = line_increments[incr];

            byte_num += byte_incr;
            if (byte_num > this.f_lasti) {
                break;
            }
            line_num += line_incr;
        }

        return line_num;
    }
}
