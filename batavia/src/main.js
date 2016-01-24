'use strict';

import * as vm from './vm';
import * as batavia from './batavia';
import * as builtins from './builtins';
import * as utils from './utils';
import {dis} from './modules/dis';
import {dom} from './modules/dom';
import {inspect} from './modules/inspect';
import {marshal} from './modules/marshal';
import {sys} from './modules/sys';
import {time} from './modules/time';

export const VirtualMachine = vm.VirtualMachine;
export const internals = {
    batavia: batavia,
    builtins: builtins,
    utils: utils,
    dis: dis,
    dom: dom,
    inspect: inspect,
    marshal: marshal,
    sys: sys,
    time: time
};