'use strict';

import * as vm from './vm';
import * as batavia from './batavia';
import * as builtins from './builtins';
import * as utils from './utils';
import * as dis from './modules/dis';
import * as dom from './modules/dom';
import * as inspect from './modules/inspect';
import * as marshal from './modules/marshal';
import * as sys from './modules/sys';
import * as time from './modules/time';

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