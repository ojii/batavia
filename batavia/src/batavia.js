import {dis} from './modules/dis';
import {dom} from './modules/dom';
import {inspect} from './modules/inspect';
import {marshal} from './modules/marshal';
import {sys} from './modules/sys';
import {time} from './modules/time';


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

