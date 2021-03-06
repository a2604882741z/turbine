'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Created by Ricky on 2017/9/22.
 */

var Dep = function () {
    function Dep() {
        _classCallCheck(this, Dep);

        this.subs = [];
    }

    _createClass(Dep, [{
        key: 'addSub',
        value: function addSub(sub) {
            this.subs.push(sub);
        }
    }, {
        key: 'notify',
        value: function notify() {
            var args = Array.prototype.slice.call(arguments, 1);
            this.subs.forEach(function (sub) {
                if (sub != undefined) {
                    sub.update(args[0], args[1]);
                }
            });
        }
    }]);

    return Dep;
}();

var react = function () {
    function react(target, resource, call) {
        _classCallCheck(this, react);

        var length = arguments.length;
        if (length == 2 || length == 3) {
            this.recall = call;
            this.observe(target, resource);
        } else if (length == 1) {
            this.recall = resource;
        }
    }

    _createClass(react, [{
        key: 'observe',
        value: function observe(_obj, _res) {
            var type = Object.prototype.toString.call(_res);
            var ob = void 0;
            if (type == '[object Object]' || type == '[object Array]') {
                if (_res.__ob__) {
                    ob = _res.__ob__;
                } else if (_obj.__ob__) {
                    ob = _obj.__ob__;
                } else {
                    ob = type == '[object Array]' ? new observerArray(_obj, _res, this) : new observer(_obj, _res, this);
                }

                this.loopObj(_obj, _res, ob);
                if (type == '[object Array]') {
                    this.cloneArray(_obj, _res, ob);
                }
            }
        }
    }, {
        key: 'loopObj',
        value: function loopObj(obj, res, observer) {
            var _this = this;

            Object.keys(res).forEach(function (prop) {
                _this.observeObj(obj, res, prop, observer); // observe and set value to reactive data
            });
        }
    }, {
        key: 'observeObj',
        value: function observeObj(obj, res, prop, observer) {
            var _this2 = this;

            var dep = new Dep();
            var rawVal = res[prop];
            var _des = Object.getOwnPropertyDescriptor(obj, prop);

            // if resource is an Array and reactive Object has not such prop exist it will be initialized as resource's data type
            if (res instanceof Array && !obj.hasOwnProperty(prop)) {
                obj[prop] = new rawVal.__proto__.constructor();
            }

            if (_des == undefined || _des.hasOwnProperty("value")) {
                if (!(res instanceof Array)) {
                    // define value's subValue which value is an Object
                    Object.defineProperty(obj, prop, {
                        get: function get() {
                            var watcher = Dep.target;
                            if (rawVal instanceof Array && isObservered(rawVal)) {
                                dep = rawVal.__ob__.dep;
                            }
                            if (watcher) {
                                // Dep target would be triggered by watcher module
                                dep.addSub(watcher); // push watcher Object into the dep
                                watcher.dep = dep;
                            }

                            return rawVal;
                        },
                        set: function set(newVal) {
                            if (newVal === rawVal) {
                                return;
                            }

                            rawVal = observer.update(prop, newVal, _this2); // update values

                            dep.notify(rawVal, newVal); // notify watchers that value has been updated

                            _this2.recall && _this2.recall(rawVal); // call the public recall
                        },
                        enumerable: true,
                        configurable: true
                    });
                } else if (obj[prop] != rawVal && _typeof(obj[prop]) != "object") {
                    // update value when present is unequal to newVal and present val is not an Object or Array, if it is an Object and Array let program to compare these two value's subValues;
                    obj[prop] = rawVal;
                }
            } else if (obj[prop] != rawVal) {
                // if the reactive Object's subValue is unequal to resource's subValue,
                obj[prop] = observer.update(prop, rawVal, this);
            }

            observer.value = obj; // update the observer's value this will impact the real data structure
            this.observe(obj[prop], res[prop]); // loop subValues
        }
    }, {
        key: 'cloneArray',
        value: function cloneArray(array, res, observer) {
            var ORP = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];
            var arrayProto = Array.prototype;
            var newProto = Object.create(arrayProto);
            var self = this;

            ORP.forEach(function (prop) {
                Object.defineProperty(newProto, prop, {
                    value: function value(newVal) {
                        arrayProto[prop].apply(observer.value, arguments);
                        arrayProto[prop].apply(res, arguments);
                        observer.update();
                        self.recall && self.recall(newVal);
                    },
                    enumerable: false,
                    configurable: true,
                    writable: true
                });
            });
            array.__proto__ = newProto;
        }
    }]);

    return react;
}();

var observer = function () {
    function observer(target, rawVal, react) {
        _classCallCheck(this, observer);

        this.dep = new Dep();
        this.value = new target.__proto__.constructor();
        this.rawVal = rawVal;
        this.react = react;

        Object.defineProperty(target, "__ob__", {
            enumerable: false,
            value: this
        });
    }

    _createClass(observer, [{
        key: 'update',
        value: function update(key, newVal, refresh) {
            var val = this.value[key];
            var ob = void 0,
                subs = void 0;

            if (val != undefined && isObservered(val)) {
                ob = val.__ob__;
                subs = ob.dep.subs;

                if (isObservered(newVal)) {
                    var newOb_dep = newVal.__ob__.dep;
                    subs.forEach(function (watcher) {
                        return newOb_dep.addSub(watcher);
                    }); // update new value's watchers
                    this.rawVal[key] = newVal;
                } else {
                    this.react.observe(val, newVal);
                }
            } else {
                val = newVal;
            }

            // if (val != undefined && isObservered(val)) {
            //     ob = val.__ob__;
            //     subs = ob.dep.subs;
            //     if (isObservered(newVal)) { // if the new value has been observed
            //         let newOb_dep = newVal.__ob__.dep;
            //         subs.forEach(watcher => newOb_dep.addSub(watcher)); // update new value's watchers
            //         val = newVal;
            //     } else {
            //         this.react.observe(val, newVal); // if new value has not observed yet set it into next loop
            //         Object.defineProperty(newVal, "__ob__", {
            //             enumerable: false,
            //             configurable: true,
            //             value: ob
            //         });
            //     }
            // } else {
            //     if (val == undefined && !this.value instanceof Array) {
            //         let data = new this.value.__proto__.constructor();
            //         data[key] = newVal;
            //         this.react.observe(this.value, data);
            //     }
            //     val = newVal; // if reactive data is not observed and newVal is observed, update new value directly
            // }

            if (refresh === true) {
                this.react.recall && this.react.recall();
            }

            return val;
        }
    }, {
        key: 'destroy',
        value: function destroy(prop, refresh) {
            var ob = void 0,
                dep = void 0;

            if (arguments.length > 0) {
                // if prop argument has been settled, destroy sub values which is belong to prop
                ob = isObservered(this.value[prop]) && this.value[prop].__ob__;
                dep = ob ? ob.dep : false;
                delete this.value[prop];
                if (this.value instanceof Array) {
                    this.value.length -= 1;
                }
            } else {
                ob = this;
                dep = ob.dep;
            }

            if (ob) {
                // loop value's sub values to delete them and lunch destroy command discretely.
                Object.keys(ob.value).forEach(function (val) {
                    var ob = val.__ob__;
                    delete ob.value[prop];
                    if (isObservered(val)) {
                        ob.destroy();
                    }
                });

                // erase all watchers
                dep.subs.forEach(function (watcher) {
                    return watcher.unwatch();
                });
            }

            if (refresh === true) {
                this.react.recall && this.react.recall();
            }
        }
    }]);

    return observer;
}();

var observerArray = function (_observer) {
    _inherits(observerArray, _observer);

    function observerArray(target, rawVal, react) {
        _classCallCheck(this, observerArray);

        return _possibleConstructorReturn(this, (observerArray.__proto__ || Object.getPrototypeOf(observerArray)).call(this, target, rawVal, react));
    }

    _createClass(observerArray, [{
        key: 'update',
        value: function update(key, newVal, refresh) {

            if (arguments.length > 0) {
                this.value[key] = newVal;
                this.rawVal[key] = newVal;

                if (refresh) {
                    this.react.recall && this.react.recall();
                }
            }

            this.dep.notify();
        }
    }]);

    return observerArray;
}(observer);

function isObservered(val) {
    return (val instanceof Object || val instanceof Array) && val.__ob__ != undefined ? true : false;
}

exports.react = react;
exports.Dep = Dep;