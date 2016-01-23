export function exception(name) {
    class Exception {
        constructor(...args) {
            this.args = args;
        }

        toString() {
            return `${name}: ${this.args[0]}`;
        }
    }
    return Exception;
}

export const BataviaError = exception('BataviaError');
