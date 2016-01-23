/*************************************************************************
 * A C-FILE like object
 *************************************************************************/

export class PYCFile {
    constructor(data) {
        this.magic = data.slice(0, 4);
        this.modtime = data.slice(4, 8);
        this.size = data.slice(8, 12);
        this.data = data.slice(12);

        // this.data = data;
        this.depth = 0;
        this.ptr = 0;
        this.end = this.data.length;
        this.refs = [];
    }

    getc() {
        if (this.ptr < this.end) {
            return this.data[this.ptr++].charCodeAt();
        }
        throw this.EOF;
    }

    fread(n) {
        let retval;
        if (this.ptr + n <= this.end) {
            retval = this.data.slice(this.ptr, this.ptr + n);
            this.ptr += n;
            return retval;
        }
        throw this.EOF;

    }
}
PYCFile.EOF = '\x04';
