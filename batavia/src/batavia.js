import {dis} from './modules/dis';
import {dom} from './modules/dis';
import {inspect} from './modules/dis';
import {marshal} from './modules/dis';
import {sys} from './modules/dis';
import {time} from './modules/dis';


function fixedConsoleLog(msg) {
    window.console.log.call(window.console, msg);
}

export var stdout = fixedConsoleLog;
export var stderr = fixedConsoleLog;
export var modules = {
    'dis': dis,
    'dom': dom,
    'inspect': inspect,
    'marshal': marshal,
    'sys': sys,
    'time': time
};

