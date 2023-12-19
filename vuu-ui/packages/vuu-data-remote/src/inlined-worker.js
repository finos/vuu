export const workerSourceCode = `
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};

// ../../node_modules/object-assign/index.js
var require_object_assign = __commonJS({
  "../../node_modules/object-assign/index.js"(exports, module) {
    "use strict";
    var getOwnPropertySymbols = Object.getOwnPropertySymbols;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var propIsEnumerable = Object.prototype.propertyIsEnumerable;
    function toObject(val) {
      if (val === null || val === void 0) {
        throw new TypeError("Object.assign cannot be called with null or undefined");
      }
      return Object(val);
    }
    function shouldUseNative() {
      try {
        if (!Object.assign) {
          return false;
        }
        var test1 = new String("abc");
        test1[5] = "de";
        if (Object.getOwnPropertyNames(test1)[0] === "5") {
          return false;
        }
        var test2 = {};
        for (var i = 0; i < 10; i++) {
          test2["_" + String.fromCharCode(i)] = i;
        }
        var order2 = Object.getOwnPropertyNames(test2).map(function(n) {
          return test2[n];
        });
        if (order2.join("") !== "0123456789") {
          return false;
        }
        var test3 = {};
        "abcdefghijklmnopqrst".split("").forEach(function(letter) {
          test3[letter] = letter;
        });
        if (Object.keys(Object.assign({}, test3)).join("") !== "abcdefghijklmnopqrst") {
          return false;
        }
        return true;
      } catch (err) {
        return false;
      }
    }
    module.exports = shouldUseNative() ? Object.assign : function(target, source) {
      var from;
      var to = toObject(target);
      var symbols;
      for (var s = 1; s < arguments.length; s++) {
        from = Object(arguments[s]);
        for (var key in from) {
          if (hasOwnProperty.call(from, key)) {
            to[key] = from[key];
          }
        }
        if (getOwnPropertySymbols) {
          symbols = getOwnPropertySymbols(from);
          for (var i = 0; i < symbols.length; i++) {
            if (propIsEnumerable.call(from, symbols[i])) {
              to[symbols[i]] = from[symbols[i]];
            }
          }
        }
      }
      return to;
    };
  }
});

// ../../node_modules/react/cjs/react.development.js
var require_react_development = __commonJS({
  "../../node_modules/react/cjs/react.development.js"(exports) {
    "use strict";
    if (true) {
      (function() {
        "use strict";
        var _assign = require_object_assign();
        var ReactVersion = "17.0.2";
        var REACT_ELEMENT_TYPE = 60103;
        var REACT_PORTAL_TYPE = 60106;
        exports.Fragment = 60107;
        exports.StrictMode = 60108;
        exports.Profiler = 60114;
        var REACT_PROVIDER_TYPE = 60109;
        var REACT_CONTEXT_TYPE = 60110;
        var REACT_FORWARD_REF_TYPE = 60112;
        exports.Suspense = 60113;
        var REACT_SUSPENSE_LIST_TYPE = 60120;
        var REACT_MEMO_TYPE = 60115;
        var REACT_LAZY_TYPE = 60116;
        var REACT_BLOCK_TYPE = 60121;
        var REACT_SERVER_BLOCK_TYPE = 60122;
        var REACT_FUNDAMENTAL_TYPE = 60117;
        var REACT_SCOPE_TYPE = 60119;
        var REACT_OPAQUE_ID_TYPE = 60128;
        var REACT_DEBUG_TRACING_MODE_TYPE = 60129;
        var REACT_OFFSCREEN_TYPE = 60130;
        var REACT_LEGACY_HIDDEN_TYPE = 60131;
        if (typeof Symbol === "function" && Symbol.for) {
          var symbolFor = Symbol.for;
          REACT_ELEMENT_TYPE = symbolFor("react.element");
          REACT_PORTAL_TYPE = symbolFor("react.portal");
          exports.Fragment = symbolFor("react.fragment");
          exports.StrictMode = symbolFor("react.strict_mode");
          exports.Profiler = symbolFor("react.profiler");
          REACT_PROVIDER_TYPE = symbolFor("react.provider");
          REACT_CONTEXT_TYPE = symbolFor("react.context");
          REACT_FORWARD_REF_TYPE = symbolFor("react.forward_ref");
          exports.Suspense = symbolFor("react.suspense");
          REACT_SUSPENSE_LIST_TYPE = symbolFor("react.suspense_list");
          REACT_MEMO_TYPE = symbolFor("react.memo");
          REACT_LAZY_TYPE = symbolFor("react.lazy");
          REACT_BLOCK_TYPE = symbolFor("react.block");
          REACT_SERVER_BLOCK_TYPE = symbolFor("react.server.block");
          REACT_FUNDAMENTAL_TYPE = symbolFor("react.fundamental");
          REACT_SCOPE_TYPE = symbolFor("react.scope");
          REACT_OPAQUE_ID_TYPE = symbolFor("react.opaque.id");
          REACT_DEBUG_TRACING_MODE_TYPE = symbolFor("react.debug_trace_mode");
          REACT_OFFSCREEN_TYPE = symbolFor("react.offscreen");
          REACT_LEGACY_HIDDEN_TYPE = symbolFor("react.legacy_hidden");
        }
        var MAYBE_ITERATOR_SYMBOL = typeof Symbol === "function" && Symbol.iterator;
        var FAUX_ITERATOR_SYMBOL = "@@iterator";
        function getIteratorFn(maybeIterable) {
          if (maybeIterable === null || typeof maybeIterable !== "object") {
            return null;
          }
          var maybeIterator = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL];
          if (typeof maybeIterator === "function") {
            return maybeIterator;
          }
          return null;
        }
        var ReactCurrentDispatcher = {
          /**
           * @internal
           * @type {ReactComponent}
           */
          current: null
        };
        var ReactCurrentBatchConfig = {
          transition: 0
        };
        var ReactCurrentOwner = {
          /**
           * @internal
           * @type {ReactComponent}
           */
          current: null
        };
        var ReactDebugCurrentFrame = {};
        var currentExtraStackFrame = null;
        function setExtraStackFrame(stack) {
          {
            currentExtraStackFrame = stack;
          }
        }
        {
          ReactDebugCurrentFrame.setExtraStackFrame = function(stack) {
            {
              currentExtraStackFrame = stack;
            }
          };
          ReactDebugCurrentFrame.getCurrentStack = null;
          ReactDebugCurrentFrame.getStackAddendum = function() {
            var stack = "";
            if (currentExtraStackFrame) {
              stack += currentExtraStackFrame;
            }
            var impl = ReactDebugCurrentFrame.getCurrentStack;
            if (impl) {
              stack += impl() || "";
            }
            return stack;
          };
        }
        var IsSomeRendererActing = {
          current: false
        };
        var ReactSharedInternals = {
          ReactCurrentDispatcher,
          ReactCurrentBatchConfig,
          ReactCurrentOwner,
          IsSomeRendererActing,
          // Used by renderers to avoid bundling object-assign twice in UMD bundles:
          assign: _assign
        };
        {
          ReactSharedInternals.ReactDebugCurrentFrame = ReactDebugCurrentFrame;
        }
        function warn4(format) {
          {
            for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
              args[_key - 1] = arguments[_key];
            }
            printWarning("warn", format, args);
          }
        }
        function error4(format) {
          {
            for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
              args[_key2 - 1] = arguments[_key2];
            }
            printWarning("error", format, args);
          }
        }
        function printWarning(level, format, args) {
          {
            var ReactDebugCurrentFrame2 = ReactSharedInternals.ReactDebugCurrentFrame;
            var stack = ReactDebugCurrentFrame2.getStackAddendum();
            if (stack !== "") {
              format += "%s";
              args = args.concat([stack]);
            }
            var argsWithFormat = args.map(function(item) {
              return "" + item;
            });
            argsWithFormat.unshift("Warning: " + format);
            Function.prototype.apply.call(console[level], console, argsWithFormat);
          }
        }
        var didWarnStateUpdateForUnmountedComponent = {};
        function warnNoop(publicInstance, callerName) {
          {
            var _constructor = publicInstance.constructor;
            var componentName = _constructor && (_constructor.displayName || _constructor.name) || "ReactClass";
            var warningKey = componentName + "." + callerName;
            if (didWarnStateUpdateForUnmountedComponent[warningKey]) {
              return;
            }
            error4("Can't call %s on a component that is not yet mounted. This is a no-op, but it might indicate a bug in your application. Instead, assign to \`this.state\` directly or define a \`state = {};\` class property with the desired state in the %s component.", callerName, componentName);
            didWarnStateUpdateForUnmountedComponent[warningKey] = true;
          }
        }
        var ReactNoopUpdateQueue = {
          /**
           * Checks whether or not this composite component is mounted.
           * @param {ReactClass} publicInstance The instance we want to test.
           * @return {boolean} True if mounted, false otherwise.
           * @protected
           * @final
           */
          isMounted: function(publicInstance) {
            return false;
          },
          /**
           * Forces an update. This should only be invoked when it is known with
           * certainty that we are **not** in a DOM transaction.
           *
           * You may want to call this when you know that some deeper aspect of the
           * component's state has changed but \`setState\` was not called.
           *
           * This will not invoke \`shouldComponentUpdate\`, but it will invoke
           * \`componentWillUpdate\` and \`componentDidUpdate\`.
           *
           * @param {ReactClass} publicInstance The instance that should rerender.
           * @param {?function} callback Called after component is updated.
           * @param {?string} callerName name of the calling function in the public API.
           * @internal
           */
          enqueueForceUpdate: function(publicInstance, callback, callerName) {
            warnNoop(publicInstance, "forceUpdate");
          },
          /**
           * Replaces all of the state. Always use this or \`setState\` to mutate state.
           * You should treat \`this.state\` as immutable.
           *
           * There is no guarantee that \`this.state\` will be immediately updated, so
           * accessing \`this.state\` after calling this method may return the old value.
           *
           * @param {ReactClass} publicInstance The instance that should rerender.
           * @param {object} completeState Next state.
           * @param {?function} callback Called after component is updated.
           * @param {?string} callerName name of the calling function in the public API.
           * @internal
           */
          enqueueReplaceState: function(publicInstance, completeState, callback, callerName) {
            warnNoop(publicInstance, "replaceState");
          },
          /**
           * Sets a subset of the state. This only exists because _pendingState is
           * internal. This provides a merging strategy that is not available to deep
           * properties which is confusing. TODO: Expose pendingState or don't use it
           * during the merge.
           *
           * @param {ReactClass} publicInstance The instance that should rerender.
           * @param {object} partialState Next partial state to be merged with state.
           * @param {?function} callback Called after component is updated.
           * @param {?string} Name of the calling function in the public API.
           * @internal
           */
          enqueueSetState: function(publicInstance, partialState, callback, callerName) {
            warnNoop(publicInstance, "setState");
          }
        };
        var emptyObject = {};
        {
          Object.freeze(emptyObject);
        }
        function Component(props, context, updater) {
          this.props = props;
          this.context = context;
          this.refs = emptyObject;
          this.updater = updater || ReactNoopUpdateQueue;
        }
        Component.prototype.isReactComponent = {};
        Component.prototype.setState = function(partialState, callback) {
          if (!(typeof partialState === "object" || typeof partialState === "function" || partialState == null)) {
            {
              throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
            }
          }
          this.updater.enqueueSetState(this, partialState, callback, "setState");
        };
        Component.prototype.forceUpdate = function(callback) {
          this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
        };
        {
          var deprecatedAPIs = {
            isMounted: ["isMounted", "Instead, make sure to clean up subscriptions and pending requests in componentWillUnmount to prevent memory leaks."],
            replaceState: ["replaceState", "Refactor your code to use setState instead (see https://github.com/facebook/react/issues/3236)."]
          };
          var defineDeprecationWarning = function(methodName, info5) {
            Object.defineProperty(Component.prototype, methodName, {
              get: function() {
                warn4("%s(...) is deprecated in plain JavaScript React classes. %s", info5[0], info5[1]);
                return void 0;
              }
            });
          };
          for (var fnName in deprecatedAPIs) {
            if (deprecatedAPIs.hasOwnProperty(fnName)) {
              defineDeprecationWarning(fnName, deprecatedAPIs[fnName]);
            }
          }
        }
        function ComponentDummy() {
        }
        ComponentDummy.prototype = Component.prototype;
        function PureComponent(props, context, updater) {
          this.props = props;
          this.context = context;
          this.refs = emptyObject;
          this.updater = updater || ReactNoopUpdateQueue;
        }
        var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
        pureComponentPrototype.constructor = PureComponent;
        _assign(pureComponentPrototype, Component.prototype);
        pureComponentPrototype.isPureReactComponent = true;
        function createRef() {
          var refObject = {
            current: null
          };
          {
            Object.seal(refObject);
          }
          return refObject;
        }
        function getWrappedName(outerType, innerType, wrapperName) {
          var functionName = innerType.displayName || innerType.name || "";
          return outerType.displayName || (functionName !== "" ? wrapperName + "(" + functionName + ")" : wrapperName);
        }
        function getContextName(type) {
          return type.displayName || "Context";
        }
        function getComponentName(type) {
          if (type == null) {
            return null;
          }
          {
            if (typeof type.tag === "number") {
              error4("Received an unexpected object in getComponentName(). This is likely a bug in React. Please file an issue.");
            }
          }
          if (typeof type === "function") {
            return type.displayName || type.name || null;
          }
          if (typeof type === "string") {
            return type;
          }
          switch (type) {
            case exports.Fragment:
              return "Fragment";
            case REACT_PORTAL_TYPE:
              return "Portal";
            case exports.Profiler:
              return "Profiler";
            case exports.StrictMode:
              return "StrictMode";
            case exports.Suspense:
              return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
              return "SuspenseList";
          }
          if (typeof type === "object") {
            switch (type.\$\$typeof) {
              case REACT_CONTEXT_TYPE:
                var context = type;
                return getContextName(context) + ".Consumer";
              case REACT_PROVIDER_TYPE:
                var provider = type;
                return getContextName(provider._context) + ".Provider";
              case REACT_FORWARD_REF_TYPE:
                return getWrappedName(type, type.render, "ForwardRef");
              case REACT_MEMO_TYPE:
                return getComponentName(type.type);
              case REACT_BLOCK_TYPE:
                return getComponentName(type._render);
              case REACT_LAZY_TYPE: {
                var lazyComponent = type;
                var payload = lazyComponent._payload;
                var init = lazyComponent._init;
                try {
                  return getComponentName(init(payload));
                } catch (x) {
                  return null;
                }
              }
            }
          }
          return null;
        }
        var hasOwnProperty = Object.prototype.hasOwnProperty;
        var RESERVED_PROPS = {
          key: true,
          ref: true,
          __self: true,
          __source: true
        };
        var specialPropKeyWarningShown, specialPropRefWarningShown, didWarnAboutStringRefs;
        {
          didWarnAboutStringRefs = {};
        }
        function hasValidRef(config) {
          {
            if (hasOwnProperty.call(config, "ref")) {
              var getter = Object.getOwnPropertyDescriptor(config, "ref").get;
              if (getter && getter.isReactWarning) {
                return false;
              }
            }
          }
          return config.ref !== void 0;
        }
        function hasValidKey(config) {
          {
            if (hasOwnProperty.call(config, "key")) {
              var getter = Object.getOwnPropertyDescriptor(config, "key").get;
              if (getter && getter.isReactWarning) {
                return false;
              }
            }
          }
          return config.key !== void 0;
        }
        function defineKeyPropWarningGetter(props, displayName) {
          var warnAboutAccessingKey = function() {
            {
              if (!specialPropKeyWarningShown) {
                specialPropKeyWarningShown = true;
                error4("%s: \`key\` is not a prop. Trying to access it will result in \`undefined\` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", displayName);
              }
            }
          };
          warnAboutAccessingKey.isReactWarning = true;
          Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: true
          });
        }
        function defineRefPropWarningGetter(props, displayName) {
          var warnAboutAccessingRef = function() {
            {
              if (!specialPropRefWarningShown) {
                specialPropRefWarningShown = true;
                error4("%s: \`ref\` is not a prop. Trying to access it will result in \`undefined\` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", displayName);
              }
            }
          };
          warnAboutAccessingRef.isReactWarning = true;
          Object.defineProperty(props, "ref", {
            get: warnAboutAccessingRef,
            configurable: true
          });
        }
        function warnIfStringRefCannotBeAutoConverted(config) {
          {
            if (typeof config.ref === "string" && ReactCurrentOwner.current && config.__self && ReactCurrentOwner.current.stateNode !== config.__self) {
              var componentName = getComponentName(ReactCurrentOwner.current.type);
              if (!didWarnAboutStringRefs[componentName]) {
                error4('Component "%s" contains the string ref "%s". Support for string refs will be removed in a future major release. This case cannot be automatically converted to an arrow function. We ask you to manually fix this case by using useRef() or createRef() instead. Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref', componentName, config.ref);
                didWarnAboutStringRefs[componentName] = true;
              }
            }
          }
        }
        var ReactElement = function(type, key, ref, self2, source, owner, props) {
          var element = {
            // This tag allows us to uniquely identify this as a React Element
            \$\$typeof: REACT_ELEMENT_TYPE,
            // Built-in properties that belong on the element
            type,
            key,
            ref,
            props,
            // Record the component responsible for creating this element.
            _owner: owner
          };
          {
            element._store = {};
            Object.defineProperty(element._store, "validated", {
              configurable: false,
              enumerable: false,
              writable: true,
              value: false
            });
            Object.defineProperty(element, "_self", {
              configurable: false,
              enumerable: false,
              writable: false,
              value: self2
            });
            Object.defineProperty(element, "_source", {
              configurable: false,
              enumerable: false,
              writable: false,
              value: source
            });
            if (Object.freeze) {
              Object.freeze(element.props);
              Object.freeze(element);
            }
          }
          return element;
        };
        function createElement(type, config, children) {
          var propName;
          var props = {};
          var key = null;
          var ref = null;
          var self2 = null;
          var source = null;
          if (config != null) {
            if (hasValidRef(config)) {
              ref = config.ref;
              {
                warnIfStringRefCannotBeAutoConverted(config);
              }
            }
            if (hasValidKey(config)) {
              key = "" + config.key;
            }
            self2 = config.__self === void 0 ? null : config.__self;
            source = config.__source === void 0 ? null : config.__source;
            for (propName in config) {
              if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
                props[propName] = config[propName];
              }
            }
          }
          var childrenLength = arguments.length - 2;
          if (childrenLength === 1) {
            props.children = children;
          } else if (childrenLength > 1) {
            var childArray = Array(childrenLength);
            for (var i = 0; i < childrenLength; i++) {
              childArray[i] = arguments[i + 2];
            }
            {
              if (Object.freeze) {
                Object.freeze(childArray);
              }
            }
            props.children = childArray;
          }
          if (type && type.defaultProps) {
            var defaultProps = type.defaultProps;
            for (propName in defaultProps) {
              if (props[propName] === void 0) {
                props[propName] = defaultProps[propName];
              }
            }
          }
          {
            if (key || ref) {
              var displayName = typeof type === "function" ? type.displayName || type.name || "Unknown" : type;
              if (key) {
                defineKeyPropWarningGetter(props, displayName);
              }
              if (ref) {
                defineRefPropWarningGetter(props, displayName);
              }
            }
          }
          return ReactElement(type, key, ref, self2, source, ReactCurrentOwner.current, props);
        }
        function cloneAndReplaceKey(oldElement, newKey) {
          var newElement = ReactElement(oldElement.type, newKey, oldElement.ref, oldElement._self, oldElement._source, oldElement._owner, oldElement.props);
          return newElement;
        }
        function cloneElement(element, config, children) {
          if (!!(element === null || element === void 0)) {
            {
              throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + element + ".");
            }
          }
          var propName;
          var props = _assign({}, element.props);
          var key = element.key;
          var ref = element.ref;
          var self2 = element._self;
          var source = element._source;
          var owner = element._owner;
          if (config != null) {
            if (hasValidRef(config)) {
              ref = config.ref;
              owner = ReactCurrentOwner.current;
            }
            if (hasValidKey(config)) {
              key = "" + config.key;
            }
            var defaultProps;
            if (element.type && element.type.defaultProps) {
              defaultProps = element.type.defaultProps;
            }
            for (propName in config) {
              if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
                if (config[propName] === void 0 && defaultProps !== void 0) {
                  props[propName] = defaultProps[propName];
                } else {
                  props[propName] = config[propName];
                }
              }
            }
          }
          var childrenLength = arguments.length - 2;
          if (childrenLength === 1) {
            props.children = children;
          } else if (childrenLength > 1) {
            var childArray = Array(childrenLength);
            for (var i = 0; i < childrenLength; i++) {
              childArray[i] = arguments[i + 2];
            }
            props.children = childArray;
          }
          return ReactElement(element.type, key, ref, self2, source, owner, props);
        }
        function isValidElement(object) {
          return typeof object === "object" && object !== null && object.\$\$typeof === REACT_ELEMENT_TYPE;
        }
        var SEPARATOR = ".";
        var SUBSEPARATOR = ":";
        function escape(key) {
          var escapeRegex = /[=:]/g;
          var escaperLookup = {
            "=": "=0",
            ":": "=2"
          };
          var escapedString = key.replace(escapeRegex, function(match) {
            return escaperLookup[match];
          });
          return "\$" + escapedString;
        }
        var didWarnAboutMaps = false;
        var userProvidedKeyEscapeRegex = /\/+/g;
        function escapeUserProvidedKey(text) {
          return text.replace(userProvidedKeyEscapeRegex, "\$&/");
        }
        function getElementKey(element, index) {
          if (typeof element === "object" && element !== null && element.key != null) {
            return escape("" + element.key);
          }
          return index.toString(36);
        }
        function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
          var type = typeof children;
          if (type === "undefined" || type === "boolean") {
            children = null;
          }
          var invokeCallback = false;
          if (children === null) {
            invokeCallback = true;
          } else {
            switch (type) {
              case "string":
              case "number":
                invokeCallback = true;
                break;
              case "object":
                switch (children.\$\$typeof) {
                  case REACT_ELEMENT_TYPE:
                  case REACT_PORTAL_TYPE:
                    invokeCallback = true;
                }
            }
          }
          if (invokeCallback) {
            var _child = children;
            var mappedChild = callback(_child);
            var childKey = nameSoFar === "" ? SEPARATOR + getElementKey(_child, 0) : nameSoFar;
            if (Array.isArray(mappedChild)) {
              var escapedChildKey = "";
              if (childKey != null) {
                escapedChildKey = escapeUserProvidedKey(childKey) + "/";
              }
              mapIntoArray(mappedChild, array, escapedChildKey, "", function(c) {
                return c;
              });
            } else if (mappedChild != null) {
              if (isValidElement(mappedChild)) {
                mappedChild = cloneAndReplaceKey(
                  mappedChild,
                  // Keep both the (mapped) and old keys if they differ, just as
                  // traverseAllChildren used to do for objects as children
                  escapedPrefix + // \$FlowFixMe Flow incorrectly thinks React.Portal doesn't have a key
                  (mappedChild.key && (!_child || _child.key !== mappedChild.key) ? (
                    // \$FlowFixMe Flow incorrectly thinks existing element's key can be a number
                    escapeUserProvidedKey("" + mappedChild.key) + "/"
                  ) : "") + childKey
                );
              }
              array.push(mappedChild);
            }
            return 1;
          }
          var child;
          var nextName;
          var subtreeCount = 0;
          var nextNamePrefix = nameSoFar === "" ? SEPARATOR : nameSoFar + SUBSEPARATOR;
          if (Array.isArray(children)) {
            for (var i = 0; i < children.length; i++) {
              child = children[i];
              nextName = nextNamePrefix + getElementKey(child, i);
              subtreeCount += mapIntoArray(child, array, escapedPrefix, nextName, callback);
            }
          } else {
            var iteratorFn = getIteratorFn(children);
            if (typeof iteratorFn === "function") {
              var iterableChildren = children;
              {
                if (iteratorFn === iterableChildren.entries) {
                  if (!didWarnAboutMaps) {
                    warn4("Using Maps as children is not supported. Use an array of keyed ReactElements instead.");
                  }
                  didWarnAboutMaps = true;
                }
              }
              var iterator = iteratorFn.call(iterableChildren);
              var step;
              var ii = 0;
              while (!(step = iterator.next()).done) {
                child = step.value;
                nextName = nextNamePrefix + getElementKey(child, ii++);
                subtreeCount += mapIntoArray(child, array, escapedPrefix, nextName, callback);
              }
            } else if (type === "object") {
              var childrenString = "" + children;
              {
                {
                  throw Error("Objects are not valid as a React child (found: " + (childrenString === "[object Object]" ? "object with keys {" + Object.keys(children).join(", ") + "}" : childrenString) + "). If you meant to render a collection of children, use an array instead.");
                }
              }
            }
          }
          return subtreeCount;
        }
        function mapChildren(children, func, context) {
          if (children == null) {
            return children;
          }
          var result = [];
          var count = 0;
          mapIntoArray(children, result, "", "", function(child) {
            return func.call(context, child, count++);
          });
          return result;
        }
        function countChildren(children) {
          var n = 0;
          mapChildren(children, function() {
            n++;
          });
          return n;
        }
        function forEachChildren(children, forEachFunc, forEachContext) {
          mapChildren(children, function() {
            forEachFunc.apply(this, arguments);
          }, forEachContext);
        }
        function toArray2(children) {
          return mapChildren(children, function(child) {
            return child;
          }) || [];
        }
        function onlyChild(children) {
          if (!isValidElement(children)) {
            {
              throw Error("React.Children.only expected to receive a single React element child.");
            }
          }
          return children;
        }
        function createContext(defaultValue, calculateChangedBits) {
          if (calculateChangedBits === void 0) {
            calculateChangedBits = null;
          } else {
            {
              if (calculateChangedBits !== null && typeof calculateChangedBits !== "function") {
                error4("createContext: Expected the optional second argument to be a function. Instead received: %s", calculateChangedBits);
              }
            }
          }
          var context = {
            \$\$typeof: REACT_CONTEXT_TYPE,
            _calculateChangedBits: calculateChangedBits,
            // As a workaround to support multiple concurrent renderers, we categorize
            // some renderers as primary and others as secondary. We only expect
            // there to be two concurrent renderers at most: React Native (primary) and
            // Fabric (secondary); React DOM (primary) and React ART (secondary).
            // Secondary renderers store their context values on separate fields.
            _currentValue: defaultValue,
            _currentValue2: defaultValue,
            // Used to track how many concurrent renderers this context currently
            // supports within in a single renderer. Such as parallel server rendering.
            _threadCount: 0,
            // These are circular
            Provider: null,
            Consumer: null
          };
          context.Provider = {
            \$\$typeof: REACT_PROVIDER_TYPE,
            _context: context
          };
          var hasWarnedAboutUsingNestedContextConsumers = false;
          var hasWarnedAboutUsingConsumerProvider = false;
          var hasWarnedAboutDisplayNameOnConsumer = false;
          {
            var Consumer = {
              \$\$typeof: REACT_CONTEXT_TYPE,
              _context: context,
              _calculateChangedBits: context._calculateChangedBits
            };
            Object.defineProperties(Consumer, {
              Provider: {
                get: function() {
                  if (!hasWarnedAboutUsingConsumerProvider) {
                    hasWarnedAboutUsingConsumerProvider = true;
                    error4("Rendering <Context.Consumer.Provider> is not supported and will be removed in a future major release. Did you mean to render <Context.Provider> instead?");
                  }
                  return context.Provider;
                },
                set: function(_Provider) {
                  context.Provider = _Provider;
                }
              },
              _currentValue: {
                get: function() {
                  return context._currentValue;
                },
                set: function(_currentValue) {
                  context._currentValue = _currentValue;
                }
              },
              _currentValue2: {
                get: function() {
                  return context._currentValue2;
                },
                set: function(_currentValue2) {
                  context._currentValue2 = _currentValue2;
                }
              },
              _threadCount: {
                get: function() {
                  return context._threadCount;
                },
                set: function(_threadCount) {
                  context._threadCount = _threadCount;
                }
              },
              Consumer: {
                get: function() {
                  if (!hasWarnedAboutUsingNestedContextConsumers) {
                    hasWarnedAboutUsingNestedContextConsumers = true;
                    error4("Rendering <Context.Consumer.Consumer> is not supported and will be removed in a future major release. Did you mean to render <Context.Consumer> instead?");
                  }
                  return context.Consumer;
                }
              },
              displayName: {
                get: function() {
                  return context.displayName;
                },
                set: function(displayName) {
                  if (!hasWarnedAboutDisplayNameOnConsumer) {
                    warn4("Setting \`displayName\` on Context.Consumer has no effect. You should set it directly on the context with Context.displayName = '%s'.", displayName);
                    hasWarnedAboutDisplayNameOnConsumer = true;
                  }
                }
              }
            });
            context.Consumer = Consumer;
          }
          {
            context._currentRenderer = null;
            context._currentRenderer2 = null;
          }
          return context;
        }
        var Uninitialized = -1;
        var Pending = 0;
        var Resolved = 1;
        var Rejected = 2;
        function lazyInitializer(payload) {
          if (payload._status === Uninitialized) {
            var ctor = payload._result;
            var thenable = ctor();
            var pending = payload;
            pending._status = Pending;
            pending._result = thenable;
            thenable.then(function(moduleObject) {
              if (payload._status === Pending) {
                var defaultExport = moduleObject.default;
                {
                  if (defaultExport === void 0) {
                    error4("lazy: Expected the result of a dynamic import() call. Instead received: %s\n\nYour code should look like: \n  const MyComponent = lazy(() => import('./MyComponent'))", moduleObject);
                  }
                }
                var resolved = payload;
                resolved._status = Resolved;
                resolved._result = defaultExport;
              }
            }, function(error5) {
              if (payload._status === Pending) {
                var rejected = payload;
                rejected._status = Rejected;
                rejected._result = error5;
              }
            });
          }
          if (payload._status === Resolved) {
            return payload._result;
          } else {
            throw payload._result;
          }
        }
        function lazy(ctor) {
          var payload = {
            // We use these fields to store the result.
            _status: -1,
            _result: ctor
          };
          var lazyType = {
            \$\$typeof: REACT_LAZY_TYPE,
            _payload: payload,
            _init: lazyInitializer
          };
          {
            var defaultProps;
            var propTypes;
            Object.defineProperties(lazyType, {
              defaultProps: {
                configurable: true,
                get: function() {
                  return defaultProps;
                },
                set: function(newDefaultProps) {
                  error4("React.lazy(...): It is not supported to assign \`defaultProps\` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it.");
                  defaultProps = newDefaultProps;
                  Object.defineProperty(lazyType, "defaultProps", {
                    enumerable: true
                  });
                }
              },
              propTypes: {
                configurable: true,
                get: function() {
                  return propTypes;
                },
                set: function(newPropTypes) {
                  error4("React.lazy(...): It is not supported to assign \`propTypes\` to a lazy component import. Either specify them where the component is defined, or create a wrapping component around it.");
                  propTypes = newPropTypes;
                  Object.defineProperty(lazyType, "propTypes", {
                    enumerable: true
                  });
                }
              }
            });
          }
          return lazyType;
        }
        function forwardRef(render) {
          {
            if (render != null && render.\$\$typeof === REACT_MEMO_TYPE) {
              error4("forwardRef requires a render function but received a \`memo\` component. Instead of forwardRef(memo(...)), use memo(forwardRef(...)).");
            } else if (typeof render !== "function") {
              error4("forwardRef requires a render function but was given %s.", render === null ? "null" : typeof render);
            } else {
              if (render.length !== 0 && render.length !== 2) {
                error4("forwardRef render functions accept exactly two parameters: props and ref. %s", render.length === 1 ? "Did you forget to use the ref parameter?" : "Any additional parameter will be undefined.");
              }
            }
            if (render != null) {
              if (render.defaultProps != null || render.propTypes != null) {
                error4("forwardRef render functions do not support propTypes or defaultProps. Did you accidentally pass a React component?");
              }
            }
          }
          var elementType = {
            \$\$typeof: REACT_FORWARD_REF_TYPE,
            render
          };
          {
            var ownName;
            Object.defineProperty(elementType, "displayName", {
              enumerable: false,
              configurable: true,
              get: function() {
                return ownName;
              },
              set: function(name) {
                ownName = name;
                if (render.displayName == null) {
                  render.displayName = name;
                }
              }
            });
          }
          return elementType;
        }
        var enableScopeAPI = false;
        function isValidElementType(type) {
          if (typeof type === "string" || typeof type === "function") {
            return true;
          }
          if (type === exports.Fragment || type === exports.Profiler || type === REACT_DEBUG_TRACING_MODE_TYPE || type === exports.StrictMode || type === exports.Suspense || type === REACT_SUSPENSE_LIST_TYPE || type === REACT_LEGACY_HIDDEN_TYPE || enableScopeAPI) {
            return true;
          }
          if (typeof type === "object" && type !== null) {
            if (type.\$\$typeof === REACT_LAZY_TYPE || type.\$\$typeof === REACT_MEMO_TYPE || type.\$\$typeof === REACT_PROVIDER_TYPE || type.\$\$typeof === REACT_CONTEXT_TYPE || type.\$\$typeof === REACT_FORWARD_REF_TYPE || type.\$\$typeof === REACT_FUNDAMENTAL_TYPE || type.\$\$typeof === REACT_BLOCK_TYPE || type[0] === REACT_SERVER_BLOCK_TYPE) {
              return true;
            }
          }
          return false;
        }
        function memo(type, compare) {
          {
            if (!isValidElementType(type)) {
              error4("memo: The first argument must be a component. Instead received: %s", type === null ? "null" : typeof type);
            }
          }
          var elementType = {
            \$\$typeof: REACT_MEMO_TYPE,
            type,
            compare: compare === void 0 ? null : compare
          };
          {
            var ownName;
            Object.defineProperty(elementType, "displayName", {
              enumerable: false,
              configurable: true,
              get: function() {
                return ownName;
              },
              set: function(name) {
                ownName = name;
                if (type.displayName == null) {
                  type.displayName = name;
                }
              }
            });
          }
          return elementType;
        }
        function resolveDispatcher() {
          var dispatcher = ReactCurrentDispatcher.current;
          if (!(dispatcher !== null)) {
            {
              throw Error("Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem.");
            }
          }
          return dispatcher;
        }
        function useContext(Context, unstable_observedBits) {
          var dispatcher = resolveDispatcher();
          {
            if (unstable_observedBits !== void 0) {
              error4("useContext() second argument is reserved for future use in React. Passing it is not supported. You passed: %s.%s", unstable_observedBits, typeof unstable_observedBits === "number" && Array.isArray(arguments[2]) ? "\n\nDid you call array.map(useContext)? Calling Hooks inside a loop is not supported. Learn more at https://reactjs.org/link/rules-of-hooks" : "");
            }
            if (Context._context !== void 0) {
              var realContext = Context._context;
              if (realContext.Consumer === Context) {
                error4("Calling useContext(Context.Consumer) is not supported, may cause bugs, and will be removed in a future major release. Did you mean to call useContext(Context) instead?");
              } else if (realContext.Provider === Context) {
                error4("Calling useContext(Context.Provider) is not supported. Did you mean to call useContext(Context) instead?");
              }
            }
          }
          return dispatcher.useContext(Context, unstable_observedBits);
        }
        function useState(initialState) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useState(initialState);
        }
        function useReducer(reducer, initialArg, init) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useReducer(reducer, initialArg, init);
        }
        function useRef(initialValue) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useRef(initialValue);
        }
        function useEffect(create, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useEffect(create, deps);
        }
        function useLayoutEffect(create, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useLayoutEffect(create, deps);
        }
        function useCallback(callback, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useCallback(callback, deps);
        }
        function useMemo2(create, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useMemo(create, deps);
        }
        function useImperativeHandle(ref, create, deps) {
          var dispatcher = resolveDispatcher();
          return dispatcher.useImperativeHandle(ref, create, deps);
        }
        function useDebugValue(value, formatterFn) {
          {
            var dispatcher = resolveDispatcher();
            return dispatcher.useDebugValue(value, formatterFn);
          }
        }
        var disabledDepth = 0;
        var prevLog;
        var prevInfo;
        var prevWarn;
        var prevError;
        var prevGroup;
        var prevGroupCollapsed;
        var prevGroupEnd;
        function disabledLog() {
        }
        disabledLog.__reactDisabledLog = true;
        function disableLogs() {
          {
            if (disabledDepth === 0) {
              prevLog = console.log;
              prevInfo = console.info;
              prevWarn = console.warn;
              prevError = console.error;
              prevGroup = console.group;
              prevGroupCollapsed = console.groupCollapsed;
              prevGroupEnd = console.groupEnd;
              var props = {
                configurable: true,
                enumerable: true,
                value: disabledLog,
                writable: true
              };
              Object.defineProperties(console, {
                info: props,
                log: props,
                warn: props,
                error: props,
                group: props,
                groupCollapsed: props,
                groupEnd: props
              });
            }
            disabledDepth++;
          }
        }
        function reenableLogs() {
          {
            disabledDepth--;
            if (disabledDepth === 0) {
              var props = {
                configurable: true,
                enumerable: true,
                writable: true
              };
              Object.defineProperties(console, {
                log: _assign({}, props, {
                  value: prevLog
                }),
                info: _assign({}, props, {
                  value: prevInfo
                }),
                warn: _assign({}, props, {
                  value: prevWarn
                }),
                error: _assign({}, props, {
                  value: prevError
                }),
                group: _assign({}, props, {
                  value: prevGroup
                }),
                groupCollapsed: _assign({}, props, {
                  value: prevGroupCollapsed
                }),
                groupEnd: _assign({}, props, {
                  value: prevGroupEnd
                })
              });
            }
            if (disabledDepth < 0) {
              error4("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
            }
          }
        }
        var ReactCurrentDispatcher\$1 = ReactSharedInternals.ReactCurrentDispatcher;
        var prefix;
        function describeBuiltInComponentFrame(name, source, ownerFn) {
          {
            if (prefix === void 0) {
              try {
                throw Error();
              } catch (x) {
                var match = x.stack.trim().match(/\n( *(at )?)/);
                prefix = match && match[1] || "";
              }
            }
            return "\n" + prefix + name;
          }
        }
        var reentry = false;
        var componentFrameCache;
        {
          var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;
          componentFrameCache = new PossiblyWeakMap();
        }
        function describeNativeComponentFrame(fn, construct) {
          if (!fn || reentry) {
            return "";
          }
          {
            var frame = componentFrameCache.get(fn);
            if (frame !== void 0) {
              return frame;
            }
          }
          var control;
          reentry = true;
          var previousPrepareStackTrace = Error.prepareStackTrace;
          Error.prepareStackTrace = void 0;
          var previousDispatcher;
          {
            previousDispatcher = ReactCurrentDispatcher\$1.current;
            ReactCurrentDispatcher\$1.current = null;
            disableLogs();
          }
          try {
            if (construct) {
              var Fake = function() {
                throw Error();
              };
              Object.defineProperty(Fake.prototype, "props", {
                set: function() {
                  throw Error();
                }
              });
              if (typeof Reflect === "object" && Reflect.construct) {
                try {
                  Reflect.construct(Fake, []);
                } catch (x) {
                  control = x;
                }
                Reflect.construct(fn, [], Fake);
              } else {
                try {
                  Fake.call();
                } catch (x) {
                  control = x;
                }
                fn.call(Fake.prototype);
              }
            } else {
              try {
                throw Error();
              } catch (x) {
                control = x;
              }
              fn();
            }
          } catch (sample) {
            if (sample && control && typeof sample.stack === "string") {
              var sampleLines = sample.stack.split("\n");
              var controlLines = control.stack.split("\n");
              var s = sampleLines.length - 1;
              var c = controlLines.length - 1;
              while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
                c--;
              }
              for (; s >= 1 && c >= 0; s--, c--) {
                if (sampleLines[s] !== controlLines[c]) {
                  if (s !== 1 || c !== 1) {
                    do {
                      s--;
                      c--;
                      if (c < 0 || sampleLines[s] !== controlLines[c]) {
                        var _frame = "\n" + sampleLines[s].replace(" at new ", " at ");
                        {
                          if (typeof fn === "function") {
                            componentFrameCache.set(fn, _frame);
                          }
                        }
                        return _frame;
                      }
                    } while (s >= 1 && c >= 0);
                  }
                  break;
                }
              }
            }
          } finally {
            reentry = false;
            {
              ReactCurrentDispatcher\$1.current = previousDispatcher;
              reenableLogs();
            }
            Error.prepareStackTrace = previousPrepareStackTrace;
          }
          var name = fn ? fn.displayName || fn.name : "";
          var syntheticFrame = name ? describeBuiltInComponentFrame(name) : "";
          {
            if (typeof fn === "function") {
              componentFrameCache.set(fn, syntheticFrame);
            }
          }
          return syntheticFrame;
        }
        function describeFunctionComponentFrame(fn, source, ownerFn) {
          {
            return describeNativeComponentFrame(fn, false);
          }
        }
        function shouldConstruct(Component2) {
          var prototype = Component2.prototype;
          return !!(prototype && prototype.isReactComponent);
        }
        function describeUnknownElementTypeFrameInDEV(type, source, ownerFn) {
          if (type == null) {
            return "";
          }
          if (typeof type === "function") {
            {
              return describeNativeComponentFrame(type, shouldConstruct(type));
            }
          }
          if (typeof type === "string") {
            return describeBuiltInComponentFrame(type);
          }
          switch (type) {
            case exports.Suspense:
              return describeBuiltInComponentFrame("Suspense");
            case REACT_SUSPENSE_LIST_TYPE:
              return describeBuiltInComponentFrame("SuspenseList");
          }
          if (typeof type === "object") {
            switch (type.\$\$typeof) {
              case REACT_FORWARD_REF_TYPE:
                return describeFunctionComponentFrame(type.render);
              case REACT_MEMO_TYPE:
                return describeUnknownElementTypeFrameInDEV(type.type, source, ownerFn);
              case REACT_BLOCK_TYPE:
                return describeFunctionComponentFrame(type._render);
              case REACT_LAZY_TYPE: {
                var lazyComponent = type;
                var payload = lazyComponent._payload;
                var init = lazyComponent._init;
                try {
                  return describeUnknownElementTypeFrameInDEV(init(payload), source, ownerFn);
                } catch (x) {
                }
              }
            }
          }
          return "";
        }
        var loggedTypeFailures = {};
        var ReactDebugCurrentFrame\$1 = ReactSharedInternals.ReactDebugCurrentFrame;
        function setCurrentlyValidatingElement(element) {
          {
            if (element) {
              var owner = element._owner;
              var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
              ReactDebugCurrentFrame\$1.setExtraStackFrame(stack);
            } else {
              ReactDebugCurrentFrame\$1.setExtraStackFrame(null);
            }
          }
        }
        function checkPropTypes(typeSpecs, values, location, componentName, element) {
          {
            var has = Function.call.bind(Object.prototype.hasOwnProperty);
            for (var typeSpecName in typeSpecs) {
              if (has(typeSpecs, typeSpecName)) {
                var error\$1 = void 0;
                try {
                  if (typeof typeSpecs[typeSpecName] !== "function") {
                    var err = Error((componentName || "React class") + ": " + location + " type \`" + typeSpecName + "\` is invalid; it must be a function, usually from the \`prop-types\` package, but received \`" + typeof typeSpecs[typeSpecName] + "\`.This often happens because of typos such as \`PropTypes.function\` instead of \`PropTypes.func\`.");
                    err.name = "Invariant Violation";
                    throw err;
                  }
                  error\$1 = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
                } catch (ex) {
                  error\$1 = ex;
                }
                if (error\$1 && !(error\$1 instanceof Error)) {
                  setCurrentlyValidatingElement(element);
                  error4("%s: type specification of %s \`%s\` is invalid; the type checker function must return \`null\` or an \`Error\` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", componentName || "React class", location, typeSpecName, typeof error\$1);
                  setCurrentlyValidatingElement(null);
                }
                if (error\$1 instanceof Error && !(error\$1.message in loggedTypeFailures)) {
                  loggedTypeFailures[error\$1.message] = true;
                  setCurrentlyValidatingElement(element);
                  error4("Failed %s type: %s", location, error\$1.message);
                  setCurrentlyValidatingElement(null);
                }
              }
            }
          }
        }
        function setCurrentlyValidatingElement\$1(element) {
          {
            if (element) {
              var owner = element._owner;
              var stack = describeUnknownElementTypeFrameInDEV(element.type, element._source, owner ? owner.type : null);
              setExtraStackFrame(stack);
            } else {
              setExtraStackFrame(null);
            }
          }
        }
        var propTypesMisspellWarningShown;
        {
          propTypesMisspellWarningShown = false;
        }
        function getDeclarationErrorAddendum() {
          if (ReactCurrentOwner.current) {
            var name = getComponentName(ReactCurrentOwner.current.type);
            if (name) {
              return "\n\nCheck the render method of \`" + name + "\`.";
            }
          }
          return "";
        }
        function getSourceInfoErrorAddendum(source) {
          if (source !== void 0) {
            var fileName = source.fileName.replace(/^.*[\\\/]/, "");
            var lineNumber = source.lineNumber;
            return "\n\nCheck your code at " + fileName + ":" + lineNumber + ".";
          }
          return "";
        }
        function getSourceInfoErrorAddendumForProps(elementProps) {
          if (elementProps !== null && elementProps !== void 0) {
            return getSourceInfoErrorAddendum(elementProps.__source);
          }
          return "";
        }
        var ownerHasKeyUseWarning = {};
        function getCurrentComponentErrorInfo(parentType) {
          var info5 = getDeclarationErrorAddendum();
          if (!info5) {
            var parentName = typeof parentType === "string" ? parentType : parentType.displayName || parentType.name;
            if (parentName) {
              info5 = "\n\nCheck the top-level render call using <" + parentName + ">.";
            }
          }
          return info5;
        }
        function validateExplicitKey(element, parentType) {
          if (!element._store || element._store.validated || element.key != null) {
            return;
          }
          element._store.validated = true;
          var currentComponentErrorInfo = getCurrentComponentErrorInfo(parentType);
          if (ownerHasKeyUseWarning[currentComponentErrorInfo]) {
            return;
          }
          ownerHasKeyUseWarning[currentComponentErrorInfo] = true;
          var childOwner = "";
          if (element && element._owner && element._owner !== ReactCurrentOwner.current) {
            childOwner = " It was passed a child from " + getComponentName(element._owner.type) + ".";
          }
          {
            setCurrentlyValidatingElement\$1(element);
            error4('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', currentComponentErrorInfo, childOwner);
            setCurrentlyValidatingElement\$1(null);
          }
        }
        function validateChildKeys(node, parentType) {
          if (typeof node !== "object") {
            return;
          }
          if (Array.isArray(node)) {
            for (var i = 0; i < node.length; i++) {
              var child = node[i];
              if (isValidElement(child)) {
                validateExplicitKey(child, parentType);
              }
            }
          } else if (isValidElement(node)) {
            if (node._store) {
              node._store.validated = true;
            }
          } else if (node) {
            var iteratorFn = getIteratorFn(node);
            if (typeof iteratorFn === "function") {
              if (iteratorFn !== node.entries) {
                var iterator = iteratorFn.call(node);
                var step;
                while (!(step = iterator.next()).done) {
                  if (isValidElement(step.value)) {
                    validateExplicitKey(step.value, parentType);
                  }
                }
              }
            }
          }
        }
        function validatePropTypes(element) {
          {
            var type = element.type;
            if (type === null || type === void 0 || typeof type === "string") {
              return;
            }
            var propTypes;
            if (typeof type === "function") {
              propTypes = type.propTypes;
            } else if (typeof type === "object" && (type.\$\$typeof === REACT_FORWARD_REF_TYPE || // Note: Memo only checks outer props here.
            // Inner props are checked in the reconciler.
            type.\$\$typeof === REACT_MEMO_TYPE)) {
              propTypes = type.propTypes;
            } else {
              return;
            }
            if (propTypes) {
              var name = getComponentName(type);
              checkPropTypes(propTypes, element.props, "prop", name, element);
            } else if (type.PropTypes !== void 0 && !propTypesMisspellWarningShown) {
              propTypesMisspellWarningShown = true;
              var _name = getComponentName(type);
              error4("Component %s declared \`PropTypes\` instead of \`propTypes\`. Did you misspell the property assignment?", _name || "Unknown");
            }
            if (typeof type.getDefaultProps === "function" && !type.getDefaultProps.isReactClassApproved) {
              error4("getDefaultProps is only used on classic React.createClass definitions. Use a static property named \`defaultProps\` instead.");
            }
          }
        }
        function validateFragmentProps(fragment) {
          {
            var keys = Object.keys(fragment.props);
            for (var i = 0; i < keys.length; i++) {
              var key = keys[i];
              if (key !== "children" && key !== "key") {
                setCurrentlyValidatingElement\$1(fragment);
                error4("Invalid prop \`%s\` supplied to \`React.Fragment\`. React.Fragment can only have \`key\` and \`children\` props.", key);
                setCurrentlyValidatingElement\$1(null);
                break;
              }
            }
            if (fragment.ref !== null) {
              setCurrentlyValidatingElement\$1(fragment);
              error4("Invalid attribute \`ref\` supplied to \`React.Fragment\`.");
              setCurrentlyValidatingElement\$1(null);
            }
          }
        }
        function createElementWithValidation(type, props, children) {
          var validType = isValidElementType(type);
          if (!validType) {
            var info5 = "";
            if (type === void 0 || typeof type === "object" && type !== null && Object.keys(type).length === 0) {
              info5 += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.";
            }
            var sourceInfo = getSourceInfoErrorAddendumForProps(props);
            if (sourceInfo) {
              info5 += sourceInfo;
            } else {
              info5 += getDeclarationErrorAddendum();
            }
            var typeString;
            if (type === null) {
              typeString = "null";
            } else if (Array.isArray(type)) {
              typeString = "array";
            } else if (type !== void 0 && type.\$\$typeof === REACT_ELEMENT_TYPE) {
              typeString = "<" + (getComponentName(type.type) || "Unknown") + " />";
              info5 = " Did you accidentally export a JSX literal instead of a component?";
            } else {
              typeString = typeof type;
            }
            {
              error4("React.createElement: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", typeString, info5);
            }
          }
          var element = createElement.apply(this, arguments);
          if (element == null) {
            return element;
          }
          if (validType) {
            for (var i = 2; i < arguments.length; i++) {
              validateChildKeys(arguments[i], type);
            }
          }
          if (type === exports.Fragment) {
            validateFragmentProps(element);
          } else {
            validatePropTypes(element);
          }
          return element;
        }
        var didWarnAboutDeprecatedCreateFactory = false;
        function createFactoryWithValidation(type) {
          var validatedFactory = createElementWithValidation.bind(null, type);
          validatedFactory.type = type;
          {
            if (!didWarnAboutDeprecatedCreateFactory) {
              didWarnAboutDeprecatedCreateFactory = true;
              warn4("React.createFactory() is deprecated and will be removed in a future major release. Consider using JSX or use React.createElement() directly instead.");
            }
            Object.defineProperty(validatedFactory, "type", {
              enumerable: false,
              get: function() {
                warn4("Factory.type is deprecated. Access the class directly before passing it to createFactory.");
                Object.defineProperty(this, "type", {
                  value: type
                });
                return type;
              }
            });
          }
          return validatedFactory;
        }
        function cloneElementWithValidation(element, props, children) {
          var newElement = cloneElement.apply(this, arguments);
          for (var i = 2; i < arguments.length; i++) {
            validateChildKeys(arguments[i], newElement.type);
          }
          validatePropTypes(newElement);
          return newElement;
        }
        {
          try {
            var frozenObject = Object.freeze({});
            /* @__PURE__ */ new Map([[frozenObject, null]]);
            /* @__PURE__ */ new Set([frozenObject]);
          } catch (e) {
          }
        }
        var createElement\$1 = createElementWithValidation;
        var cloneElement\$1 = cloneElementWithValidation;
        var createFactory = createFactoryWithValidation;
        var Children = {
          map: mapChildren,
          forEach: forEachChildren,
          count: countChildren,
          toArray: toArray2,
          only: onlyChild
        };
        exports.Children = Children;
        exports.Component = Component;
        exports.PureComponent = PureComponent;
        exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = ReactSharedInternals;
        exports.cloneElement = cloneElement\$1;
        exports.createContext = createContext;
        exports.createElement = createElement\$1;
        exports.createFactory = createFactory;
        exports.createRef = createRef;
        exports.forwardRef = forwardRef;
        exports.isValidElement = isValidElement;
        exports.lazy = lazy;
        exports.memo = memo;
        exports.useCallback = useCallback;
        exports.useContext = useContext;
        exports.useDebugValue = useDebugValue;
        exports.useEffect = useEffect;
        exports.useImperativeHandle = useImperativeHandle;
        exports.useLayoutEffect = useLayoutEffect;
        exports.useMemo = useMemo2;
        exports.useReducer = useReducer;
        exports.useRef = useRef;
        exports.useState = useState;
        exports.version = ReactVersion;
      })();
    }
  }
});

// ../../node_modules/react/index.js
var require_react = __commonJS({
  "../../node_modules/react/index.js"(exports, module) {
    "use strict";
    if (false) {
      module.exports = null;
    } else {
      module.exports = require_react_development();
    }
  }
});

// ../vuu-utils/src/array-utils.ts
function partition(array, test, pass = [], fail = []) {
  for (let i = 0, len = array.length; i < len; i++) {
    (test(array[i], i) ? pass : fail).push(array[i]);
  }
  return [pass, fail];
}

// ../vuu-utils/src/column-utils.ts
var metadataKeys = {
  IDX: 0,
  RENDER_IDX: 1,
  IS_LEAF: 2,
  IS_EXPANDED: 3,
  DEPTH: 4,
  COUNT: 5,
  KEY: 6,
  SELECTED: 7,
  count: 8,
  // TODO following only used in datamodel
  PARENT_IDX: "parent_idx",
  IDX_POINTER: "idx_pointer",
  FILTER_COUNT: "filter_count",
  NEXT_FILTER_IDX: "next_filter_idx"
};
var { DEPTH, IS_LEAF } = metadataKeys;

// ../vuu-utils/src/cookie-utils.ts
var getCookieValue = (name) => {
  var _a, _b;
  if (((_a = globalThis.document) == null ? void 0 : _a.cookie) !== void 0) {
    return (_b = globalThis.document.cookie.split("; ").find((row) => row.startsWith(\`\${name}=\`))) == null ? void 0 : _b.split("=")[1];
  }
};

// ../vuu-utils/src/range-utils.ts
function getFullRange({ from, to }, bufferSize = 0, rowCount = Number.MAX_SAFE_INTEGER) {
  if (bufferSize === 0) {
    if (rowCount < from) {
      return { from: 0, to: 0 };
    } else {
      return { from, to: Math.min(to, rowCount) };
    }
  } else if (from === 0) {
    return { from, to: Math.min(to + bufferSize, rowCount) };
  } else {
    const rangeSize = to - from;
    const buff = Math.round(bufferSize / 2);
    const shortfallBefore = from - buff < 0;
    const shortFallAfter = rowCount - (to + buff) < 0;
    if (shortfallBefore && shortFallAfter) {
      return { from: 0, to: rowCount };
    } else if (shortfallBefore) {
      return { from: 0, to: rangeSize + bufferSize };
    } else if (shortFallAfter) {
      return {
        from: Math.max(0, rowCount - (rangeSize + bufferSize)),
        to: rowCount
      };
    } else {
      return { from: from - buff, to: to + buff };
    }
  }
}
var withinRange = (value, { from, to }) => value >= from && value < to;
var WindowRange = class {
  constructor(from, to) {
    this.from = from;
    this.to = to;
  }
  isWithin(index) {
    return withinRange(index, this);
  }
  //find the overlap of this range and a new one
  overlap(from, to) {
    return from >= this.to || to < this.from ? [0, 0] : [Math.max(from, this.from), Math.min(to, this.to)];
  }
  copy() {
    return new WindowRange(this.from, this.to);
  }
};

// ../vuu-utils/src/DataWindow.ts
var { KEY } = metadataKeys;

// ../vuu-utils/src/date/formatter.ts
var baseTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit"
};
var formatConfigByTimePatterns = {
  "hh:mm:ss": {
    locale: "en-GB",
    options: { ...baseTimeFormatOptions, hour12: false }
  },
  "hh:mm:ss a": {
    locale: "en-GB",
    options: { ...baseTimeFormatOptions, hour12: true }
  }
};
var baseDateFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric"
};
var formatConfigByDatePatterns = {
  "dd.mm.yyyy": {
    locale: "en-GB",
    options: { ...baseDateFormatOptions },
    postProcessor: (s) => s.replaceAll("/", ".")
  },
  "dd/mm/yyyy": { locale: "en-GB", options: { ...baseDateFormatOptions } },
  "dd MMM yyyy": {
    locale: "en-GB",
    options: { ...baseDateFormatOptions, month: "short" }
  },
  "dd MMMM yyyy": {
    locale: "en-GB",
    options: { ...baseDateFormatOptions, month: "long" }
  },
  "mm/dd/yyyy": { locale: "en-US", options: { ...baseDateFormatOptions } },
  "MMM dd, yyyy": {
    locale: "en-US",
    options: { ...baseDateFormatOptions, month: "short" }
  },
  "MMMM dd, yyyy": {
    locale: "en-US",
    options: { ...baseDateFormatOptions, month: "long" }
  }
};
var formatConfigByDateTimePatterns = { ...formatConfigByDatePatterns, ...formatConfigByTimePatterns };

// ../vuu-utils/src/logging-utils.ts
var logLevels = ["error", "warn", "info", "debug"];
var isValidLogLevel = (value) => typeof value === "string" && logLevels.includes(value);
var DEFAULT_LOG_LEVEL = "error";
var NO_OP = () => void 0;
var DEFAULT_DEBUG_LEVEL = false ? "error" : "info";
var { loggingLevel = DEFAULT_DEBUG_LEVEL } = getLoggingSettings();
var logger = (category) => {
  const debugEnabled5 = loggingLevel === "debug";
  const infoEnabled5 = debugEnabled5 || loggingLevel === "info";
  const warnEnabled = infoEnabled5 || loggingLevel === "warn";
  const errorEnabled = warnEnabled || loggingLevel === "error";
  const info5 = infoEnabled5 ? (message) => console.info(\`[\${category}] \${message}\`) : NO_OP;
  const warn4 = warnEnabled ? (message) => console.warn(\`[\${category}] \${message}\`) : NO_OP;
  const debug5 = debugEnabled5 ? (message) => console.debug(\`[\${category}] \${message}\`) : NO_OP;
  const error4 = errorEnabled ? (message) => console.error(\`[\${category}] \${message}\`) : NO_OP;
  if (false) {
    return {
      errorEnabled,
      error: error4
    };
  } else {
    return {
      debugEnabled: debugEnabled5,
      infoEnabled: infoEnabled5,
      warnEnabled,
      errorEnabled,
      info: info5,
      warn: warn4,
      debug: debug5,
      error: error4
    };
  }
};
function getLoggingSettings() {
  if (typeof loggingSettings !== "undefined") {
    return loggingSettings;
  } else {
    return {
      loggingLevel: getLoggingLevelFromCookie()
    };
  }
}
function getLoggingLevelFromCookie() {
  const value = getCookieValue("vuu-logging-level");
  if (isValidLogLevel(value)) {
    return value;
  } else {
    return DEFAULT_LOG_LEVEL;
  }
}

// ../vuu-utils/src/debug-utils.ts
var { debug, debugEnabled } = logger("range-monitor");
var RangeMonitor = class {
  constructor(source) {
    this.source = source;
    this.range = { from: 0, to: 0 };
    this.timestamp = 0;
  }
  isSet() {
    return this.timestamp !== 0;
  }
  set({ from, to }) {
    const { timestamp } = this;
    this.range.from = from;
    this.range.to = to;
    this.timestamp = performance.now();
    if (timestamp) {
      debugEnabled && debug(
        \`<\${this.source}> [\${from}-\${to}], \${(this.timestamp - timestamp).toFixed(0)} ms elapsed\`
      );
    } else {
      return 0;
    }
  }
};

// ../vuu-utils/src/event-emitter.ts
function isArrayOfListeners(listeners) {
  return Array.isArray(listeners);
}
function isOnlyListener(listeners) {
  return !Array.isArray(listeners);
}
var _events;
var EventEmitter = class {
  constructor() {
    __privateAdd(this, _events, /* @__PURE__ */ new Map());
  }
  addListener(event, listener) {
    const listeners = __privateGet(this, _events).get(event);
    if (!listeners) {
      __privateGet(this, _events).set(event, listener);
    } else if (isArrayOfListeners(listeners)) {
      listeners.push(listener);
    } else if (isOnlyListener(listeners)) {
      __privateGet(this, _events).set(event, [listeners, listener]);
    }
  }
  removeListener(event, listener) {
    if (!__privateGet(this, _events).has(event)) {
      return;
    }
    const listenerOrListeners = __privateGet(this, _events).get(event);
    let position = -1;
    if (listenerOrListeners === listener) {
      __privateGet(this, _events).delete(event);
    } else if (Array.isArray(listenerOrListeners)) {
      for (let i = length; i-- > 0; ) {
        if (listenerOrListeners[i] === listener) {
          position = i;
          break;
        }
      }
      if (position < 0) {
        return;
      }
      if (listenerOrListeners.length === 1) {
        listenerOrListeners.length = 0;
        __privateGet(this, _events).delete(event);
      } else {
        listenerOrListeners.splice(position, 1);
      }
    }
  }
  removeAllListeners(event) {
    if (event && __privateGet(this, _events).has(event)) {
      __privateGet(this, _events).delete(event);
    } else if (event === void 0) {
      __privateGet(this, _events).clear();
    }
  }
  emit(event, ...args) {
    if (__privateGet(this, _events)) {
      const handler = __privateGet(this, _events).get(event);
      if (handler) {
        this.invokeHandler(handler, args);
      }
    }
  }
  once(event, listener) {
    const handler = (...args) => {
      this.removeListener(event, handler);
      listener(...args);
    };
    this.on(event, handler);
  }
  on(event, listener) {
    this.addListener(event, listener);
  }
  hasListener(event, listener) {
    const listeners = __privateGet(this, _events).get(event);
    if (Array.isArray(listeners)) {
      return listeners.includes(listener);
    } else {
      return listeners === listener;
    }
  }
  invokeHandler(handler, args) {
    if (isArrayOfListeners(handler)) {
      handler.slice().forEach((listener) => this.invokeHandler(listener, args));
    } else {
      switch (args.length) {
        case 0:
          handler();
          break;
        case 1:
          handler(args[0]);
          break;
        case 2:
          handler(args[0], args[1]);
          break;
        default:
          handler.call(null, ...args);
      }
    }
  }
};
_events = new WeakMap();

// ../vuu-utils/src/round-decimal.ts
var PUNCTUATION_STR = String.fromCharCode(8200);
var DIGIT_STR = String.fromCharCode(8199);
var Space = {
  DIGIT: DIGIT_STR,
  TWO_DIGITS: DIGIT_STR + DIGIT_STR,
  THREE_DIGITS: DIGIT_STR + DIGIT_STR + DIGIT_STR,
  FULL_PADDING: [
    null,
    PUNCTUATION_STR + DIGIT_STR,
    PUNCTUATION_STR + DIGIT_STR + DIGIT_STR,
    PUNCTUATION_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR,
    PUNCTUATION_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR
  ]
};
var LEADING_FILL = DIGIT_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR + DIGIT_STR;

// ../vuu-utils/src/json-utils.ts
var { COUNT } = metadataKeys;

// ../vuu-utils/src/keyset.ts
var KeySet = class {
  constructor(range) {
    this.keys = /* @__PURE__ */ new Map();
    this.free = [];
    this.nextKeyValue = 0;
    this.reset(range);
  }
  next() {
    if (this.free.length > 0) {
      return this.free.pop();
    } else {
      return this.nextKeyValue++;
    }
  }
  reset({ from, to }) {
    this.keys.forEach((keyValue, rowIndex) => {
      if (rowIndex < from || rowIndex >= to) {
        this.free.push(keyValue);
        this.keys.delete(rowIndex);
      }
    });
    const size = to - from;
    if (this.keys.size + this.free.length > size) {
      this.free.length = Math.max(0, size - this.keys.size);
    }
    for (let rowIndex = from; rowIndex < to; rowIndex++) {
      if (!this.keys.has(rowIndex)) {
        const nextKeyValue = this.next();
        this.keys.set(rowIndex, nextKeyValue);
      }
    }
    if (this.nextKeyValue > this.keys.size) {
      this.nextKeyValue = this.keys.size;
    }
  }
  keyFor(rowIndex) {
    const key = this.keys.get(rowIndex);
    if (key === void 0) {
      console.log(\`key not found
        keys: \${this.toDebugString()}
        free : \${this.free.join(",")}  
      \`);
      throw Error(\`KeySet, no key found for rowIndex \${rowIndex}\`);
    }
    return key;
  }
  toDebugString() {
    return Array.from(this.keys.entries()).map((k, v) => \`\${k}=>\${v}\`).join(",");
  }
};

// ../vuu-utils/src/row-utils.ts
var { IDX } = metadataKeys;

// ../vuu-utils/src/selection-utils.ts
var { SELECTED } = metadataKeys;
var RowSelected = {
  False: 0,
  True: 1,
  First: 2,
  Last: 4
};
var rangeIncludes = (range, index) => index >= range[0] && index <= range[1];
var SINGLE_SELECTED_ROW = RowSelected.True + RowSelected.First + RowSelected.Last;
var FIRST_SELECTED_ROW_OF_BLOCK = RowSelected.True + RowSelected.First;
var LAST_SELECTED_ROW_OF_BLOCK = RowSelected.True + RowSelected.Last;
var getSelectionStatus = (selected, itemIndex) => {
  for (const item of selected) {
    if (typeof item === "number") {
      if (item === itemIndex) {
        return SINGLE_SELECTED_ROW;
      }
    } else if (rangeIncludes(item, itemIndex)) {
      if (itemIndex === item[0]) {
        return FIRST_SELECTED_ROW_OF_BLOCK;
      } else if (itemIndex === item[1]) {
        return LAST_SELECTED_ROW_OF_BLOCK;
      } else {
        return RowSelected.True;
      }
    }
  }
  return RowSelected.False;
};
var expandSelection = (selected) => {
  if (selected.every((selectedItem) => typeof selectedItem === "number")) {
    return selected;
  }
  const expandedSelected = [];
  for (const selectedItem of selected) {
    if (typeof selectedItem === "number") {
      expandedSelected.push(selectedItem);
    } else {
      for (let i = selectedItem[0]; i <= selectedItem[1]; i++) {
        expandedSelected.push(i);
      }
    }
  }
  return expandedSelected;
};

// ../vuu-utils/src/useId.ts
var import_react = __toESM(require_react());

// ../../node_modules/html-to-image/es/util.js
var uuid = (() => {
  let counter = 0;
  const random = () => (
    // eslint-disable-next-line no-bitwise
    \`0000\${(Math.random() * 36 ** 4 << 0).toString(36)}\`.slice(-4)
  );
  return () => {
    counter += 1;
    return \`u\${random()}\${counter}\`;
  };
})();

// src/websocket-connection.ts
var { debug: debug2, debugEnabled: debugEnabled2, error, info, infoEnabled, warn } = logger(
  "websocket-connection"
);
var WS = "ws";
var isWebsocketUrl = (url) => url.startsWith(WS + "://") || url.startsWith(WS + "s://");
var connectionAttemptStatus = {};
var setWebsocket = Symbol("setWebsocket");
var connectionCallback = Symbol("connectionCallback");
async function connect(connectionString, protocol, callback, retryLimitDisconnect = 10, retryLimitStartup = 5) {
  connectionAttemptStatus[connectionString] = {
    status: "connecting",
    connect: {
      allowed: retryLimitStartup,
      remaining: retryLimitStartup
    },
    reconnect: {
      allowed: retryLimitDisconnect,
      remaining: retryLimitDisconnect
    }
  };
  return makeConnection(connectionString, protocol, callback);
}
async function reconnect(connection) {
  throw Error("connection broken");
}
async function makeConnection(url, protocol, callback, connection) {
  const {
    status: currentStatus,
    connect: connectStatus,
    reconnect: reconnectStatus
  } = connectionAttemptStatus[url];
  const trackedStatus = currentStatus === "connecting" ? connectStatus : reconnectStatus;
  try {
    callback({ type: "connection-status", status: "connecting" });
    const reconnecting = typeof connection !== "undefined";
    const ws = await createWebsocket(url, protocol);
    console.info(
      "%c\u26A1 %cconnected",
      "font-size: 24px;color: green;font-weight: bold;",
      "color:green; font-size: 14px;"
    );
    if (connection !== void 0) {
      connection[setWebsocket](ws);
    }
    const websocketConnection = connection != null ? connection : new WebsocketConnection(ws, url, protocol, callback);
    const status = reconnecting ? "reconnected" : "connection-open-awaiting-session";
    callback({ type: "connection-status", status });
    websocketConnection.status = status;
    trackedStatus.remaining = trackedStatus.allowed;
    return websocketConnection;
  } catch (err) {
    const retry = --trackedStatus.remaining > 0;
    callback({
      type: "connection-status",
      status: "disconnected",
      reason: "failed to connect",
      retry
    });
    if (retry) {
      return makeConnectionIn(url, protocol, callback, connection, 2e3);
    } else {
      throw Error("Failed to establish connection");
    }
  }
}
var makeConnectionIn = (url, protocol, callback, connection, delay) => new Promise((resolve) => {
  setTimeout(() => {
    resolve(makeConnection(url, protocol, callback, connection));
  }, delay);
});
var createWebsocket = (connectionString, protocol) => new Promise((resolve, reject) => {
  const websocketUrl = isWebsocketUrl(connectionString) ? connectionString : \`wss://\${connectionString}\`;
  if (infoEnabled && protocol !== void 0) {
    info(\`WebSocket Protocol \${protocol == null ? void 0 : protocol.toString()}\`);
  }
  const ws = new WebSocket(websocketUrl, protocol);
  ws.onopen = () => resolve(ws);
  ws.onerror = (evt) => reject(evt);
});
var closeWarn = () => {
  warn == null ? void 0 : warn(\`Connection cannot be closed, socket not yet opened\`);
};
var sendWarn = (msg) => {
  warn == null ? void 0 : warn(\`Message cannot be sent, socket closed \${msg.body.type}\`);
};
var parseMessage = (message) => {
  try {
    return JSON.parse(message);
  } catch (e) {
    throw Error(\`Error parsing JSON response from server \${message}\`);
  }
};
var WebsocketConnection = class {
  constructor(ws, url, protocol, callback) {
    this.close = closeWarn;
    this.requiresLogin = true;
    this.send = sendWarn;
    this.status = "ready";
    this.messagesCount = 0;
    this.connectionMetricsInterval = null;
    this.handleWebsocketMessage = (evt) => {
      const vuuMessageFromServer = parseMessage(evt.data);
      this.messagesCount += 1;
      if (true) {
        if (debugEnabled2 && vuuMessageFromServer.body.type !== "HB") {
          debug2 == null ? void 0 : debug2(\`<<< \${vuuMessageFromServer.body.type}\`);
        }
      }
      this[connectionCallback](vuuMessageFromServer);
    };
    this.url = url;
    this.protocol = protocol;
    this[connectionCallback] = callback;
    this[setWebsocket](ws);
  }
  reconnect() {
    reconnect(this);
  }
  [(connectionCallback, setWebsocket)](ws) {
    const callback = this[connectionCallback];
    ws.onmessage = (evt) => {
      this.status = "connected";
      ws.onmessage = this.handleWebsocketMessage;
      this.handleWebsocketMessage(evt);
    };
    this.connectionMetricsInterval = setInterval(() => {
      callback({
        type: "connection-metrics",
        messagesLength: this.messagesCount
      });
      this.messagesCount = 0;
    }, 2e3);
    ws.onerror = () => {
      error(\`\u26A1 connection error\`);
      callback({
        type: "connection-status",
        status: "disconnected",
        reason: "error"
      });
      if (this.connectionMetricsInterval) {
        clearInterval(this.connectionMetricsInterval);
        this.connectionMetricsInterval = null;
      }
      if (this.status === "connection-open-awaiting-session") {
        error(
          \`Websocket connection lost before Vuu session established, check websocket configuration\`
        );
      } else if (this.status !== "closed") {
        reconnect(this);
        this.send = queue;
      }
    };
    ws.onclose = () => {
      info == null ? void 0 : info(\`\u26A1 connection close\`);
      callback({
        type: "connection-status",
        status: "disconnected",
        reason: "close"
      });
      if (this.connectionMetricsInterval) {
        clearInterval(this.connectionMetricsInterval);
        this.connectionMetricsInterval = null;
      }
      if (this.status !== "closed") {
        reconnect(this);
        this.send = queue;
      }
    };
    const send = (msg) => {
      if (true) {
        if (debugEnabled2 && msg.body.type !== "HB_RESP") {
          debug2 == null ? void 0 : debug2(\`>>> \${msg.body.type}\`);
        }
      }
      ws.send(JSON.stringify(msg));
    };
    const queue = (msg) => {
      info == null ? void 0 : info(\`TODO queue message until websocket reconnected \${msg.body.type}\`);
    };
    this.send = send;
    this.close = () => {
      this.status = "closed";
      ws.close();
      this.close = closeWarn;
      this.send = sendWarn;
      info == null ? void 0 : info("close websocket");
    };
  }
};

// src/message-utils.ts
var MENU_RPC_TYPES = [
  "VIEW_PORT_MENUS_SELECT_RPC",
  "VIEW_PORT_MENU_TABLE_RPC",
  "VIEW_PORT_MENU_ROW_RPC",
  "VIEW_PORT_MENU_CELL_RPC",
  "VP_EDIT_CELL_RPC",
  "VP_EDIT_ROW_RPC",
  "VP_EDIT_ADD_ROW_RPC",
  "VP_EDIT_DELETE_CELL_RPC",
  "VP_EDIT_DELETE_ROW_RPC",
  "VP_EDIT_SUBMIT_FORM_RPC"
];
var isVuuMenuRpcRequest = (message) => MENU_RPC_TYPES.includes(message["type"]);
var isVuuRpcRequest = (message) => message["type"] === "VIEW_PORT_RPC_CALL";
var stripRequestId = ({
  requestId,
  ...rest
}) => [requestId, rest];
var getFirstAndLastRows = (rows) => {
  let firstRow = rows.at(0);
  if (firstRow.updateType === "SIZE") {
    if (rows.length === 1) {
      return rows;
    } else {
      firstRow = rows.at(1);
    }
  }
  const lastRow = rows.at(-1);
  return [firstRow, lastRow];
};
var groupRowsByViewport = (rows) => {
  const result = {};
  for (const row of rows) {
    const rowsForViewport = result[row.viewPortId] || (result[row.viewPortId] = []);
    rowsForViewport.push(row);
  }
  return result;
};
var createSchemaFromTableMetadata = ({
  columns,
  dataTypes,
  key,
  table
}) => {
  return {
    table,
    columns: columns.map((col, idx) => ({
      name: col,
      serverDataType: dataTypes[idx]
    })),
    key
  };
};

// src/vuuUIMessageTypes.ts
var isConnectionStatusMessage = (msg) => msg.type === "connection-status";
var isConnectionQualityMetrics = (msg) => msg.type === "connection-metrics";
var isViewporttMessage = (msg) => "viewport" in msg;
var isSessionTableActionMessage = (messageBody) => messageBody.type === "VIEW_PORT_MENU_RESP" && messageBody.action !== null && isSessionTable(messageBody.action.table);
var isSessionTable = (table) => {
  if (table !== null && typeof table === "object" && "table" in table && "module" in table) {
    return table.table.startsWith("session");
  }
  return false;
};

// src/server-proxy/messages.ts
var CHANGE_VP_SUCCESS = "CHANGE_VP_SUCCESS";
var CLOSE_TREE_NODE = "CLOSE_TREE_NODE";
var CLOSE_TREE_SUCCESS = "CLOSE_TREE_SUCCESS";
var CREATE_VP = "CREATE_VP";
var DISABLE_VP = "DISABLE_VP";
var DISABLE_VP_SUCCESS = "DISABLE_VP_SUCCESS";
var ENABLE_VP = "ENABLE_VP";
var ENABLE_VP_SUCCESS = "ENABLE_VP_SUCCESS";
var GET_VP_VISUAL_LINKS = "GET_VP_VISUAL_LINKS";
var GET_VIEW_PORT_MENUS = "GET_VIEW_PORT_MENUS";
var HB = "HB";
var HB_RESP = "HB_RESP";
var LOGIN = "LOGIN";
var OPEN_TREE_NODE = "OPEN_TREE_NODE";
var OPEN_TREE_SUCCESS = "OPEN_TREE_SUCCESS";
var REMOVE_VP = "REMOVE_VP";
var SET_SELECTION_SUCCESS = "SET_SELECTION_SUCCESS";

// src/server-proxy/rpc-services.ts
var getRpcServiceModule = (service) => {
  switch (service) {
    case "TypeAheadRpcHandler":
      return "TYPEAHEAD";
    default:
      return "SIMUL";
  }
};

// src/server-proxy/array-backed-moving-window.ts
var EMPTY_ARRAY = [];
var log = logger("array-backed-moving-window");
function dataIsUnchanged(newRow, existingRow) {
  if (!existingRow) {
    return false;
  }
  if (existingRow.data.length !== newRow.data.length) {
    return false;
  }
  if (existingRow.sel !== newRow.sel) {
    return false;
  }
  for (let i = 0; i < existingRow.data.length; i++) {
    if (existingRow.data[i] !== newRow.data[i]) {
      return false;
    }
  }
  return true;
}
var _range;
var ArrayBackedMovingWindow = class {
  // Note, the buffer is already accounted for in the range passed in here
  constructor({ from: clientFrom, to: clientTo }, { from, to }, bufferSize) {
    __privateAdd(this, _range, void 0);
    this.setRowCount = (rowCount) => {
      var _a;
      (_a = log.info) == null ? void 0 : _a.call(log, \`setRowCount \${rowCount}\`);
      if (rowCount < this.internalData.length) {
        this.internalData.length = rowCount;
      }
      if (rowCount < this.rowCount) {
        this.rowsWithinRange = 0;
        const end = Math.min(rowCount, this.clientRange.to);
        for (let i = this.clientRange.from; i < end; i++) {
          const rowIndex = i - __privateGet(this, _range).from;
          if (this.internalData[rowIndex] !== void 0) {
            this.rowsWithinRange += 1;
          }
        }
      }
      this.rowCount = rowCount;
    };
    this.bufferBreakout = (from, to) => {
      const bufferPerimeter = this.bufferSize * 0.25;
      if (__privateGet(this, _range).to - to < bufferPerimeter) {
        return true;
      } else if (__privateGet(this, _range).from > 0 && from - __privateGet(this, _range).from < bufferPerimeter) {
        return true;
      } else {
        return false;
      }
    };
    this.bufferSize = bufferSize;
    this.clientRange = new WindowRange(clientFrom, clientTo);
    __privateSet(this, _range, new WindowRange(from, to));
    this.internalData = new Array(bufferSize);
    this.rowsWithinRange = 0;
    this.rowCount = 0;
  }
  get range() {
    return __privateGet(this, _range);
  }
  // TODO we shpuld probably have a hasAllClientRowsWithinRange
  get hasAllRowsWithinRange() {
    return this.rowsWithinRange === this.clientRange.to - this.clientRange.from || // this.rowsWithinRange === this.range.to - this.range.from ||
    this.rowCount > 0 && this.clientRange.from + this.rowsWithinRange === this.rowCount;
  }
  // Check to see if set of rows is outside the current viewport range, indicating
  // that veiwport is being scrolled quickly and server is not able to keep up.
  outOfRange(firstIndex, lastIndex) {
    const { from, to } = this.range;
    if (lastIndex < from) {
      return true;
    }
    if (firstIndex >= to) {
      return true;
    }
  }
  setAtIndex(row) {
    const { rowIndex: index } = row;
    const internalIndex = index - __privateGet(this, _range).from;
    if (dataIsUnchanged(row, this.internalData[internalIndex])) {
      return false;
    }
    const isWithinClientRange = this.isWithinClientRange(index);
    if (isWithinClientRange || this.isWithinRange(index)) {
      if (!this.internalData[internalIndex] && isWithinClientRange) {
        this.rowsWithinRange += 1;
      }
      this.internalData[internalIndex] = row;
    }
    return isWithinClientRange;
  }
  getAtIndex(index) {
    return __privateGet(this, _range).isWithin(index) && this.internalData[index - __privateGet(this, _range).from] != null ? this.internalData[index - __privateGet(this, _range).from] : void 0;
  }
  isWithinRange(index) {
    return __privateGet(this, _range).isWithin(index);
  }
  isWithinClientRange(index) {
    return this.clientRange.isWithin(index);
  }
  // Returns [false] or [serverDataRequired, clientRows, holdingRows]
  setClientRange(from, to) {
    var _a;
    (_a = log.debug) == null ? void 0 : _a.call(log, \`setClientRange \${from} - \${to}\`);
    const currentFrom = this.clientRange.from;
    const currentTo = Math.min(this.clientRange.to, this.rowCount);
    if (from === currentFrom && to === currentTo) {
      return [
        false,
        EMPTY_ARRAY
        /*, EMPTY_ARRAY*/
      ];
    }
    const originalRange = this.clientRange.copy();
    this.clientRange.from = from;
    this.clientRange.to = to;
    this.rowsWithinRange = 0;
    for (let i = from; i < to; i++) {
      const internalIndex = i - __privateGet(this, _range).from;
      if (this.internalData[internalIndex]) {
        this.rowsWithinRange += 1;
      }
    }
    let clientRows = EMPTY_ARRAY;
    const offset = __privateGet(this, _range).from;
    if (this.hasAllRowsWithinRange) {
      if (to > originalRange.to) {
        const start = Math.max(from, originalRange.to);
        clientRows = this.internalData.slice(start - offset, to - offset);
      } else {
        const end = Math.min(originalRange.from, to);
        clientRows = this.internalData.slice(from - offset, end - offset);
      }
    }
    const serverDataRequired = this.bufferBreakout(from, to);
    return [serverDataRequired, clientRows];
  }
  setRange(from, to) {
    var _a, _b;
    if (from !== __privateGet(this, _range).from || to !== __privateGet(this, _range).to) {
      (_a = log.debug) == null ? void 0 : _a.call(log, \`setRange \${from} - \${to}\`);
      const [overlapFrom, overlapTo] = __privateGet(this, _range).overlap(from, to);
      const newData = new Array(to - from);
      this.rowsWithinRange = 0;
      for (let i = overlapFrom; i < overlapTo; i++) {
        const data = this.getAtIndex(i);
        if (data) {
          const index = i - from;
          newData[index] = data;
          if (this.isWithinClientRange(i)) {
            this.rowsWithinRange += 1;
          }
        }
      }
      this.internalData = newData;
      __privateGet(this, _range).from = from;
      __privateGet(this, _range).to = to;
    } else {
      (_b = log.debug) == null ? void 0 : _b.call(log, \`setRange \${from} - \${to} IGNORED because not changed\`);
    }
  }
  //TODO temp
  get data() {
    return this.internalData;
  }
  getData() {
    var _a;
    const { from, to } = __privateGet(this, _range);
    const { from: clientFrom, to: clientTo } = this.clientRange;
    const startOffset = Math.max(0, clientFrom - from);
    const endOffset = Math.min(
      to - from,
      to,
      clientTo - from,
      (_a = this.rowCount) != null ? _a : to
    );
    return this.internalData.slice(startOffset, endOffset);
  }
  clear() {
    var _a;
    (_a = log.debug) == null ? void 0 : _a.call(log, "clear");
    this.internalData.length = 0;
    this.rowsWithinRange = 0;
    this.setRowCount(0);
  }
  // used only for debugging
  getCurrentDataRange() {
    const rows = this.internalData;
    const len = rows.length;
    let [firstRow] = this.internalData;
    let lastRow = this.internalData[len - 1];
    if (firstRow && lastRow) {
      return [firstRow.rowIndex, lastRow.rowIndex];
    } else {
      for (let i = 0; i < len; i++) {
        if (rows[i] !== void 0) {
          firstRow = rows[i];
          break;
        }
      }
      for (let i = len - 1; i >= 0; i--) {
        if (rows[i] !== void 0) {
          lastRow = rows[i];
          break;
        }
      }
      if (firstRow && lastRow) {
        return [firstRow.rowIndex, lastRow.rowIndex];
      } else {
        return [-1, -1];
      }
    }
  }
};
_range = new WeakMap();

// src/server-proxy/viewport.ts
var EMPTY_GROUPBY = [];
var { debug: debug3, debugEnabled: debugEnabled3, error: error2, info: info2, infoEnabled: infoEnabled2, warn: warn2 } = logger("viewport");
var isLeafUpdate = ({ rowKey, updateType }) => updateType === "U" && !rowKey.startsWith("\$root");
var NO_DATA_UPDATE = [
  void 0,
  void 0
];
var NO_UPDATE_STATUS = {
  count: 0,
  mode: void 0,
  size: 0,
  ts: 0
};
var Viewport = class {
  constructor({
    aggregations,
    bufferSize = 50,
    columns,
    filter,
    groupBy = [],
    table,
    range,
    sort,
    title,
    viewport,
    visualLink
  }, postMessageToClient) {
    /** batchMode is irrelevant for Vuu Table, it was introduced to try and improve rendering performance of AgGrid */
    this.batchMode = true;
    this.hasUpdates = false;
    this.pendingUpdates = [];
    this.pendingOperations = /* @__PURE__ */ new Map();
    this.pendingRangeRequests = [];
    this.rowCountChanged = false;
    this.selectedRows = [];
    this.useBatchMode = true;
    this.lastUpdateStatus = NO_UPDATE_STATUS;
    this.updateThrottleTimer = void 0;
    this.rangeMonitor = new RangeMonitor("ViewPort");
    this.disabled = false;
    this.isTree = false;
    // TODO roll disabled/suspended into status
    this.status = "";
    this.suspended = false;
    this.suspendTimer = null;
    // Records SIZE only updates
    this.setLastSizeOnlyUpdateSize = (size) => {
      this.lastUpdateStatus.size = size;
    };
    this.setLastUpdate = (mode) => {
      const { ts: lastTS, mode: lastMode } = this.lastUpdateStatus;
      let elapsedTime = 0;
      if (lastMode === mode) {
        const ts = Date.now();
        this.lastUpdateStatus.count += 1;
        this.lastUpdateStatus.ts = ts;
        elapsedTime = lastTS === 0 ? 0 : ts - lastTS;
      } else {
        this.lastUpdateStatus.count = 1;
        this.lastUpdateStatus.ts = 0;
        elapsedTime = 0;
      }
      this.lastUpdateStatus.mode = mode;
      return elapsedTime;
    };
    this.rangeRequestAlreadyPending = (range) => {
      const { bufferSize } = this;
      const bufferThreshold = bufferSize * 0.25;
      let { from: stillPendingFrom } = range;
      for (const { from, to } of this.pendingRangeRequests) {
        if (stillPendingFrom >= from && stillPendingFrom < to) {
          if (range.to + bufferThreshold <= to) {
            return true;
          } else {
            stillPendingFrom = to;
          }
        }
      }
      return false;
    };
    this.sendThrottledSizeMessage = () => {
      this.updateThrottleTimer = void 0;
      this.lastUpdateStatus.count = 3;
      this.postMessageToClient({
        clientViewportId: this.clientViewportId,
        mode: "size-only",
        size: this.lastUpdateStatus.size,
        type: "viewport-update"
      });
    };
    // If we are receiving multiple SIZE updates but no data, table is loading rows
    // outside of our viewport. We can safely throttle these requests. Doing so will
    // alleviate pressure on UI DataTable.
    this.shouldThrottleMessage = (mode) => {
      const elapsedTime = this.setLastUpdate(mode);
      return mode === "size-only" && elapsedTime > 0 && elapsedTime < 500 && this.lastUpdateStatus.count > 3;
    };
    this.throttleMessage = (mode) => {
      if (this.shouldThrottleMessage(mode)) {
        info2 == null ? void 0 : info2("throttling updates setTimeout to 2000");
        if (this.updateThrottleTimer === void 0) {
          this.updateThrottleTimer = setTimeout(
            this.sendThrottledSizeMessage,
            2e3
          );
        }
        return true;
      } else if (this.updateThrottleTimer !== void 0) {
        clearTimeout(this.updateThrottleTimer);
        this.updateThrottleTimer = void 0;
      }
      return false;
    };
    this.getNewRowCount = () => {
      if (this.rowCountChanged && this.dataWindow) {
        this.rowCountChanged = false;
        return this.dataWindow.rowCount;
      }
    };
    this.aggregations = aggregations;
    this.bufferSize = bufferSize;
    this.clientRange = range;
    this.clientViewportId = viewport;
    this.columns = columns;
    this.filter = filter;
    this.groupBy = groupBy;
    this.keys = new KeySet(range);
    this.pendingLinkedParent = visualLink;
    this.table = table;
    this.sort = sort;
    this.title = title;
    infoEnabled2 && (info2 == null ? void 0 : info2(
      \`constructor #\${viewport} \${table.table} bufferSize=\${bufferSize}\`
    ));
    this.dataWindow = new ArrayBackedMovingWindow(
      this.clientRange,
      range,
      this.bufferSize
    );
    this.postMessageToClient = postMessageToClient;
  }
  get hasUpdatesToProcess() {
    if (this.suspended) {
      return false;
    }
    return this.rowCountChanged || this.hasUpdates;
  }
  get size() {
    var _a;
    return (_a = this.dataWindow.rowCount) != null ? _a : 0;
  }
  subscribe() {
    const { filter } = this.filter;
    this.status = this.status === "subscribed" ? "resubscribing" : "subscribing";
    return {
      type: CREATE_VP,
      table: this.table,
      range: getFullRange(this.clientRange, this.bufferSize),
      aggregations: this.aggregations,
      columns: this.columns,
      sort: this.sort,
      groupBy: this.groupBy,
      filterSpec: { filter }
    };
  }
  handleSubscribed({
    viewPortId,
    aggregations,
    columns,
    filterSpec: filter,
    range,
    sort,
    groupBy
  }, tableSchema) {
    this.serverViewportId = viewPortId;
    this.status = "subscribed";
    this.aggregations = aggregations;
    this.columns = columns;
    this.groupBy = groupBy;
    this.isTree = groupBy && groupBy.length > 0;
    this.dataWindow.setRange(range.from, range.to);
    return {
      aggregations,
      type: "subscribed",
      clientViewportId: this.clientViewportId,
      columns,
      filter,
      groupBy,
      range,
      sort,
      tableSchema
    };
  }
  awaitOperation(requestId, msg) {
    this.pendingOperations.set(requestId, msg);
  }
  // Return a message if we need to communicate this to client UI
  completeOperation(requestId, ...params) {
    var _a;
    const { clientViewportId, pendingOperations } = this;
    const pendingOperation = pendingOperations.get(requestId);
    if (!pendingOperation) {
      error2(
        \`no matching operation found to complete for requestId \${requestId}\`
      );
      return;
    }
    const { type } = pendingOperation;
    info2 == null ? void 0 : info2(\`completeOperation \${type}\`);
    pendingOperations.delete(requestId);
    if (type === "CHANGE_VP_RANGE") {
      const [from, to] = params;
      (_a = this.dataWindow) == null ? void 0 : _a.setRange(from, to);
      for (let i = this.pendingRangeRequests.length - 1; i >= 0; i--) {
        const pendingRangeRequest = this.pendingRangeRequests[i];
        if (pendingRangeRequest.requestId === requestId) {
          pendingRangeRequest.acked = true;
          break;
        } else {
          warn2 == null ? void 0 : warn2("range requests sent faster than they are being ACKed");
        }
      }
    } else if (type === "config") {
      const { aggregations, columns, filter, groupBy, sort } = pendingOperation.data;
      this.aggregations = aggregations;
      this.columns = columns;
      this.filter = filter;
      this.groupBy = groupBy;
      this.sort = sort;
      if (groupBy.length > 0) {
        this.isTree = true;
      } else if (this.isTree) {
        this.isTree = false;
      }
      debug3 == null ? void 0 : debug3(\`config change confirmed, isTree : \${this.isTree}\`);
      return {
        clientViewportId,
        type,
        config: pendingOperation.data
      };
    } else if (type === "groupBy") {
      this.isTree = pendingOperation.data.length > 0;
      this.groupBy = pendingOperation.data;
      debug3 == null ? void 0 : debug3(\`groupBy change confirmed, isTree : \${this.isTree}\`);
      return {
        clientViewportId,
        type,
        groupBy: pendingOperation.data
      };
    } else if (type === "columns") {
      this.columns = pendingOperation.data;
      return {
        clientViewportId,
        type,
        columns: pendingOperation.data
      };
    } else if (type === "filter") {
      this.filter = pendingOperation.data;
      return {
        clientViewportId,
        type,
        filter: pendingOperation.data
      };
    } else if (type === "aggregate") {
      this.aggregations = pendingOperation.data;
      return {
        clientViewportId,
        type: "aggregate",
        aggregations: this.aggregations
      };
    } else if (type === "sort") {
      this.sort = pendingOperation.data;
      return {
        clientViewportId,
        type,
        sort: this.sort
      };
    } else if (type === "selection") {
    } else if (type === "disable") {
      this.disabled = true;
      return {
        type: "disabled",
        clientViewportId
      };
    } else if (type === "enable") {
      this.disabled = false;
      return {
        type: "enabled",
        clientViewportId
      };
    } else if (type === "CREATE_VISUAL_LINK") {
      const [colName, parentViewportId, parentColName] = params;
      this.linkedParent = {
        colName,
        parentViewportId,
        parentColName
      };
      this.pendingLinkedParent = void 0;
      return {
        type: "vuu-link-created",
        clientViewportId,
        colName,
        parentViewportId,
        parentColName
      };
    } else if (type === "REMOVE_VISUAL_LINK") {
      this.linkedParent = void 0;
      return {
        type: "vuu-link-removed",
        clientViewportId
      };
    }
  }
  // TODO when a range request arrives, consider the viewport to be scrolling
  // until data arrives and we have the full range.
  // When not scrolling, any server data is an update
  // When scrolling, we are in batch mode
  rangeRequest(requestId, range) {
    if (debugEnabled3) {
      this.rangeMonitor.set(range);
    }
    const type = "CHANGE_VP_RANGE";
    if (this.dataWindow) {
      const [serverDataRequired, clientRows] = this.dataWindow.setClientRange(
        range.from,
        range.to
      );
      let debounceRequest;
      const maxRange = this.dataWindow.rowCount || void 0;
      const serverRequest = serverDataRequired && !this.rangeRequestAlreadyPending(range) ? {
        type,
        viewPortId: this.serverViewportId,
        ...getFullRange(range, this.bufferSize, maxRange)
      } : null;
      if (serverRequest) {
        debugEnabled3 && (debug3 == null ? void 0 : debug3(
          \`create CHANGE_VP_RANGE: [\${serverRequest.from} - \${serverRequest.to}]\`
        ));
        this.awaitOperation(requestId, { type });
        const pendingRequest = this.pendingRangeRequests.at(-1);
        if (pendingRequest) {
          if (pendingRequest.acked) {
            console.warn("Range Request before previous request is filled");
          } else {
            const { from, to } = pendingRequest;
            if (this.dataWindow.outOfRange(from, to)) {
              debounceRequest = {
                clientViewportId: this.clientViewportId,
                type: "debounce-begin"
              };
            } else {
              warn2 == null ? void 0 : warn2("Range Request before previous request is acked");
            }
          }
        }
        this.pendingRangeRequests.push({ ...serverRequest, requestId });
        if (this.useBatchMode) {
          this.batchMode = true;
        }
      } else if (clientRows.length > 0) {
        this.batchMode = false;
      }
      this.keys.reset(this.dataWindow.clientRange);
      const toClient = this.isTree ? toClientRowTree : toClientRow;
      if (clientRows.length) {
        return [
          serverRequest,
          clientRows.map((row) => {
            return toClient(row, this.keys, this.selectedRows);
          })
        ];
      } else if (debounceRequest) {
        return [serverRequest, void 0, debounceRequest];
      } else {
        return [serverRequest];
      }
    } else {
      return [null];
    }
  }
  setLinks(links) {
    this.links = links;
    return [
      {
        type: "vuu-links",
        links,
        clientViewportId: this.clientViewportId
      },
      this.pendingLinkedParent
    ];
  }
  setMenu(menu) {
    return {
      type: "vuu-menu",
      menu,
      clientViewportId: this.clientViewportId
    };
  }
  openTreeNode(requestId, message) {
    if (this.useBatchMode) {
      this.batchMode = true;
    }
    return {
      type: OPEN_TREE_NODE,
      vpId: this.serverViewportId,
      treeKey: message.key
    };
  }
  closeTreeNode(requestId, message) {
    if (this.useBatchMode) {
      this.batchMode = true;
    }
    return {
      type: CLOSE_TREE_NODE,
      vpId: this.serverViewportId,
      treeKey: message.key
    };
  }
  createLink(requestId, colName, parentVpId, parentColumnName) {
    const message = {
      type: "CREATE_VISUAL_LINK",
      parentVpId,
      childVpId: this.serverViewportId,
      parentColumnName,
      childColumnName: colName
    };
    this.awaitOperation(requestId, message);
    if (this.useBatchMode) {
      this.batchMode = true;
    }
    return message;
  }
  removeLink(requestId) {
    const message = {
      type: "REMOVE_VISUAL_LINK",
      childVpId: this.serverViewportId
    };
    this.awaitOperation(requestId, message);
    return message;
  }
  suspend() {
    this.suspended = true;
    info2 == null ? void 0 : info2("suspend");
  }
  resume() {
    this.suspended = false;
    if (debugEnabled3) {
      debug3 == null ? void 0 : debug3(\`resume: \${this.currentData()}\`);
    }
    return [this.size, this.currentData()];
  }
  currentData() {
    const out = [];
    if (this.dataWindow) {
      const records = this.dataWindow.getData();
      const { keys } = this;
      const toClient = this.isTree ? toClientRowTree : toClientRow;
      for (const row of records) {
        if (row) {
          out.push(toClient(row, keys, this.selectedRows));
        }
      }
    }
    return out;
  }
  enable(requestId) {
    this.awaitOperation(requestId, { type: "enable" });
    info2 == null ? void 0 : info2(\`enable: \${this.serverViewportId}\`);
    return {
      type: ENABLE_VP,
      viewPortId: this.serverViewportId
    };
  }
  disable(requestId) {
    this.awaitOperation(requestId, { type: "disable" });
    info2 == null ? void 0 : info2(\`disable: \${this.serverViewportId}\`);
    this.suspended = false;
    return {
      type: DISABLE_VP,
      viewPortId: this.serverViewportId
    };
  }
  columnRequest(requestId, columns) {
    this.awaitOperation(requestId, {
      type: "columns",
      data: columns
    });
    debug3 == null ? void 0 : debug3(\`columnRequest: \${columns}\`);
    return this.createRequest({ columns });
  }
  filterRequest(requestId, dataSourceFilter) {
    this.awaitOperation(requestId, {
      type: "filter",
      data: dataSourceFilter
    });
    if (this.useBatchMode) {
      this.batchMode = true;
    }
    const { filter } = dataSourceFilter;
    info2 == null ? void 0 : info2(\`filterRequest: \${filter}\`);
    return this.createRequest({ filterSpec: { filter } });
  }
  setConfig(requestId, config) {
    this.awaitOperation(requestId, { type: "config", data: config });
    const { filter, ...remainingConfig } = config;
    if (this.useBatchMode) {
      this.batchMode = true;
    }
    debugEnabled3 ? debug3 == null ? void 0 : debug3(\`setConfig \${JSON.stringify(config)}\`) : info2 == null ? void 0 : info2(\`setConfig\`);
    return this.createRequest(
      {
        ...remainingConfig,
        filterSpec: typeof (filter == null ? void 0 : filter.filter) === "string" ? {
          filter: filter.filter
        } : {
          filter: ""
        }
      },
      true
    );
  }
  aggregateRequest(requestId, aggregations) {
    this.awaitOperation(requestId, { type: "aggregate", data: aggregations });
    info2 == null ? void 0 : info2(\`aggregateRequest: \${aggregations}\`);
    return this.createRequest({ aggregations });
  }
  sortRequest(requestId, sort) {
    this.awaitOperation(requestId, { type: "sort", data: sort });
    info2 == null ? void 0 : info2(\`sortRequest: \${JSON.stringify(sort.sortDefs)}\`);
    return this.createRequest({ sort });
  }
  groupByRequest(requestId, groupBy = EMPTY_GROUPBY) {
    var _a;
    this.awaitOperation(requestId, { type: "groupBy", data: groupBy });
    if (this.useBatchMode) {
      this.batchMode = true;
    }
    if (!this.isTree) {
      (_a = this.dataWindow) == null ? void 0 : _a.clear();
    }
    return this.createRequest({ groupBy });
  }
  selectRequest(requestId, selected) {
    this.selectedRows = selected;
    this.awaitOperation(requestId, { type: "selection", data: selected });
    info2 == null ? void 0 : info2(\`selectRequest: \${selected}\`);
    return {
      type: "SET_SELECTION",
      vpId: this.serverViewportId,
      selection: expandSelection(selected)
    };
  }
  removePendingRangeRequest(firstIndex, lastIndex) {
    for (let i = this.pendingRangeRequests.length - 1; i >= 0; i--) {
      const { from, to } = this.pendingRangeRequests[i];
      let isLast = true;
      if (firstIndex >= from && firstIndex < to || lastIndex > from && lastIndex < to) {
        if (!isLast) {
          console.warn(
            "removePendingRangeRequest TABLE_ROWS are not for latest request"
          );
        }
        this.pendingRangeRequests.splice(i, 1);
        break;
      } else {
        isLast = false;
      }
    }
  }
  updateRows(rows) {
    var _a, _b, _c;
    const [firstRow, lastRow] = getFirstAndLastRows(rows);
    if (firstRow && lastRow) {
      this.removePendingRangeRequest(firstRow.rowIndex, lastRow.rowIndex);
    }
    if (rows.length === 1) {
      if (firstRow.vpSize === 0 && this.disabled) {
        debug3 == null ? void 0 : debug3(
          \`ignore a SIZE=0 message on disabled viewport (\${rows.length} rows)\`
        );
        return;
      } else if (firstRow.updateType === "SIZE") {
        this.setLastSizeOnlyUpdateSize(firstRow.vpSize);
      }
    }
    for (const row of rows) {
      if (this.isTree && isLeafUpdate(row)) {
        continue;
      } else {
        if (row.updateType === "SIZE" || ((_a = this.dataWindow) == null ? void 0 : _a.rowCount) !== row.vpSize) {
          (_b = this.dataWindow) == null ? void 0 : _b.setRowCount(row.vpSize);
          this.rowCountChanged = true;
        }
        if (row.updateType === "U") {
          if ((_c = this.dataWindow) == null ? void 0 : _c.setAtIndex(row)) {
            this.hasUpdates = true;
            if (!this.batchMode) {
              this.pendingUpdates.push(row);
            }
          }
        }
      }
    }
  }
  // This is called only after new data has been received from server - data
  // returned direcly from buffer does not use this.
  getClientRows() {
    let out = void 0;
    let mode = "size-only";
    if (!this.hasUpdates && !this.rowCountChanged) {
      return NO_DATA_UPDATE;
    }
    if (this.hasUpdates) {
      const { keys, selectedRows } = this;
      const toClient = this.isTree ? toClientRowTree : toClientRow;
      if (this.updateThrottleTimer) {
        self.clearTimeout(this.updateThrottleTimer);
        this.updateThrottleTimer = void 0;
      }
      if (this.pendingUpdates.length > 0) {
        out = [];
        mode = "update";
        for (const row of this.pendingUpdates) {
          out.push(toClient(row, keys, selectedRows));
        }
        this.pendingUpdates.length = 0;
      } else {
        const records = this.dataWindow.getData();
        if (this.dataWindow.hasAllRowsWithinRange) {
          out = [];
          mode = "batch";
          for (const row of records) {
            out.push(toClient(row, keys, selectedRows));
          }
          this.batchMode = false;
        }
      }
      this.hasUpdates = false;
    }
    if (this.throttleMessage(mode)) {
      return NO_DATA_UPDATE;
    } else {
      return [out, mode];
    }
  }
  createRequest(params, overWrite = false) {
    if (overWrite) {
      return {
        type: "CHANGE_VP",
        viewPortId: this.serverViewportId,
        ...params
      };
    } else {
      return {
        type: "CHANGE_VP",
        viewPortId: this.serverViewportId,
        aggregations: this.aggregations,
        columns: this.columns,
        sort: this.sort,
        groupBy: this.groupBy,
        filterSpec: {
          filter: this.filter.filter
        },
        ...params
      };
    }
  }
};
var toClientRow = ({ rowIndex, rowKey, sel: isSelected, data }, keys, selectedRows) => {
  return [
    rowIndex,
    keys.keyFor(rowIndex),
    true,
    false,
    0,
    0,
    rowKey,
    isSelected ? getSelectionStatus(selectedRows, rowIndex) : 0
  ].concat(data);
};
var toClientRowTree = ({ rowIndex, rowKey, sel: isSelected, data }, keys, selectedRows) => {
  const [depth, isExpanded, , isLeaf, , count, ...rest] = data;
  return [
    rowIndex,
    keys.keyFor(rowIndex),
    isLeaf,
    isExpanded,
    depth,
    count,
    rowKey,
    isSelected ? getSelectionStatus(selectedRows, rowIndex) : 0
  ].concat(rest);
};

// src/server-proxy/server-proxy.ts
var _requestId = 1;
var { debug: debug4, debugEnabled: debugEnabled4, error: error3, info: info3, infoEnabled: infoEnabled3, warn: warn3 } = logger("server-proxy");
var nextRequestId = () => \`\${_requestId++}\`;
var DEFAULT_OPTIONS = {};
var isActiveViewport = (viewPort) => viewPort.disabled !== true && viewPort.suspended !== true;
var NO_ACTION = {
  type: "NO_ACTION"
};
var addTitleToLinks = (links, serverViewportId, label) => links.map(
  (link) => link.parentVpId === serverViewportId ? { ...link, label } : link
);
function addLabelsToLinks(links, viewports) {
  return links.map((linkDescriptor) => {
    const { parentVpId } = linkDescriptor;
    const viewport = viewports.get(parentVpId);
    if (viewport) {
      return {
        ...linkDescriptor,
        parentClientVpId: viewport.clientViewportId,
        label: viewport.title
      };
    } else {
      throw Error("addLabelsToLinks viewport not found");
    }
  });
}
var ServerProxy = class {
  constructor(connection, callback) {
    this.authToken = "";
    this.user = "user";
    this.pendingRequests = /* @__PURE__ */ new Map();
    this.queuedRequests = [];
    this.cachedTableMetaRequests = /* @__PURE__ */ new Map();
    this.cachedTableSchemas = /* @__PURE__ */ new Map();
    this.connection = connection;
    this.postMessageToClient = callback;
    this.viewports = /* @__PURE__ */ new Map();
    this.mapClientToServerViewport = /* @__PURE__ */ new Map();
  }
  async reconnect() {
    await this.login(this.authToken);
    const [activeViewports, inactiveViewports] = partition(
      Array.from(this.viewports.values()),
      isActiveViewport
    );
    this.viewports.clear();
    this.mapClientToServerViewport.clear();
    const reconnectViewports = (viewports) => {
      viewports.forEach((viewport) => {
        const { clientViewportId } = viewport;
        this.viewports.set(clientViewportId, viewport);
        this.sendMessageToServer(viewport.subscribe(), clientViewportId);
      });
    };
    reconnectViewports(activeViewports);
    setTimeout(() => {
      reconnectViewports(inactiveViewports);
    }, 2e3);
  }
  async login(authToken, user = "user") {
    if (authToken) {
      this.authToken = authToken;
      this.user = user;
      return new Promise((resolve, reject) => {
        this.sendMessageToServer(
          { type: LOGIN, token: this.authToken, user },
          ""
        );
        this.pendingLogin = { resolve, reject };
      });
    } else if (this.authToken === "") {
      error3("login, cannot login until auth token has been obtained");
    }
  }
  subscribe(message) {
    if (!this.mapClientToServerViewport.has(message.viewport)) {
      const pendingTableSchema = this.getTableMeta(message.table);
      const viewport = new Viewport(message, this.postMessageToClient);
      this.viewports.set(message.viewport, viewport);
      const pendingSubscription = this.awaitResponseToMessage(
        viewport.subscribe(),
        message.viewport
      );
      const awaitPendingReponses = Promise.all([
        pendingSubscription,
        pendingTableSchema
      ]);
      awaitPendingReponses.then(([subscribeResponse, tableSchema]) => {
        const { viewPortId: serverViewportId } = subscribeResponse;
        const { status: previousViewportStatus } = viewport;
        if (message.viewport !== serverViewportId) {
          this.viewports.delete(message.viewport);
          this.viewports.set(serverViewportId, viewport);
        }
        this.mapClientToServerViewport.set(message.viewport, serverViewportId);
        const clientResponse = viewport.handleSubscribed(
          subscribeResponse,
          tableSchema
        );
        if (clientResponse) {
          this.postMessageToClient(clientResponse);
          if (debugEnabled4) {
            debug4(
              \`post DataSourceSubscribedMessage to client: \${JSON.stringify(
                clientResponse
              )}\`
            );
          }
        }
        if (viewport.disabled) {
          this.disableViewport(viewport);
        }
        if (this.queuedRequests.length > 0) {
          this.processQueuedRequests();
        }
        if (previousViewportStatus === "subscribing" && // A session table will never have Visual Links, nor Context Menus
        !isSessionTable(viewport.table)) {
          this.sendMessageToServer({
            type: GET_VP_VISUAL_LINKS,
            vpId: serverViewportId
          });
          this.sendMessageToServer({
            type: GET_VIEW_PORT_MENUS,
            vpId: serverViewportId
          });
          Array.from(this.viewports.entries()).filter(
            ([id, { disabled }]) => id !== serverViewportId && !disabled
          ).forEach(([vpId]) => {
            this.sendMessageToServer({
              type: GET_VP_VISUAL_LINKS,
              vpId
            });
          });
        }
      });
    } else {
      error3(\`spurious subscribe call \${message.viewport}\`);
    }
  }
  processQueuedRequests() {
    const messageTypesProcessed = {};
    while (this.queuedRequests.length) {
      const queuedRequest = this.queuedRequests.pop();
      if (queuedRequest) {
        const { clientViewportId, message, requestId } = queuedRequest;
        if (message.type === "CHANGE_VP_RANGE") {
          if (messageTypesProcessed.CHANGE_VP_RANGE) {
            continue;
          }
          messageTypesProcessed.CHANGE_VP_RANGE = true;
          const serverViewportId = this.mapClientToServerViewport.get(clientViewportId);
          if (serverViewportId) {
            this.sendMessageToServer(
              {
                ...message,
                viewPortId: serverViewportId
              },
              requestId
            );
          }
        }
      }
    }
  }
  unsubscribe(clientViewportId) {
    const serverViewportId = this.mapClientToServerViewport.get(clientViewportId);
    if (serverViewportId) {
      info3 == null ? void 0 : info3(
        \`Unsubscribe Message (Client to Server):
        \${serverViewportId}\`
      );
      this.sendMessageToServer({
        type: REMOVE_VP,
        viewPortId: serverViewportId
      });
    } else {
      error3(
        \`failed to unsubscribe client viewport \${clientViewportId}, viewport not found\`
      );
    }
  }
  getViewportForClient(clientViewportId, throws = true) {
    const serverViewportId = this.mapClientToServerViewport.get(clientViewportId);
    if (serverViewportId) {
      const viewport = this.viewports.get(serverViewportId);
      if (viewport) {
        return viewport;
      } else if (throws) {
        throw Error(
          \`Viewport not found for client viewport \${clientViewportId}\`
        );
      } else {
        return null;
      }
    } else if (this.viewports.has(clientViewportId)) {
      return this.viewports.get(clientViewportId);
    } else if (throws) {
      throw Error(
        \`Viewport server id not found for client viewport \${clientViewportId}\`
      );
    } else {
      return null;
    }
  }
  /**********************************************************************/
  /* Handle messages from client                                        */
  /**********************************************************************/
  setViewRange(viewport, message) {
    const requestId = nextRequestId();
    const [serverRequest, rows, debounceRequest] = viewport.rangeRequest(
      requestId,
      message.range
    );
    info3 == null ? void 0 : info3(\`setViewRange \${message.range.from} - \${message.range.to}\`);
    if (serverRequest) {
      if (true) {
        info3 == null ? void 0 : info3(
          \`CHANGE_VP_RANGE [\${message.range.from}-\${message.range.to}] => [\${serverRequest.from}-\${serverRequest.to}]\`
        );
      }
      const sentToServer = this.sendIfReady(
        serverRequest,
        requestId,
        viewport.status === "subscribed"
      );
      if (!sentToServer) {
        this.queuedRequests.push({
          clientViewportId: message.viewport,
          message: serverRequest,
          requestId
        });
      }
    }
    if (rows) {
      info3 == null ? void 0 : info3(\`setViewRange \${rows.length} rows returned from cache\`);
      this.postMessageToClient({
        mode: "batch",
        type: "viewport-update",
        clientViewportId: viewport.clientViewportId,
        rows
      });
    } else if (debounceRequest) {
      this.postMessageToClient(debounceRequest);
    }
  }
  setConfig(viewport, message) {
    const requestId = nextRequestId();
    const request = viewport.setConfig(requestId, message.config);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }
  aggregate(viewport, message) {
    const requestId = nextRequestId();
    const request = viewport.aggregateRequest(requestId, message.aggregations);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }
  sort(viewport, message) {
    const requestId = nextRequestId();
    const request = viewport.sortRequest(requestId, message.sort);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }
  groupBy(viewport, message) {
    const requestId = nextRequestId();
    const request = viewport.groupByRequest(requestId, message.groupBy);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }
  filter(viewport, message) {
    const requestId = nextRequestId();
    const { filter } = message;
    const request = viewport.filterRequest(requestId, filter);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }
  setColumns(viewport, message) {
    const requestId = nextRequestId();
    const { columns } = message;
    const request = viewport.columnRequest(requestId, columns);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }
  setTitle(viewport, message) {
    if (viewport) {
      viewport.title = message.title;
      this.updateTitleOnVisualLinks(viewport);
    }
  }
  select(viewport, message) {
    const requestId = nextRequestId();
    const { selected } = message;
    const request = viewport.selectRequest(requestId, selected);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }
  disableViewport(viewport) {
    const requestId = nextRequestId();
    const request = viewport.disable(requestId);
    this.sendIfReady(request, requestId, viewport.status === "subscribed");
  }
  enableViewport(viewport) {
    if (viewport.disabled) {
      const requestId = nextRequestId();
      const request = viewport.enable(requestId);
      this.sendIfReady(request, requestId, viewport.status === "subscribed");
    }
  }
  suspendViewport(viewport) {
    viewport.suspend();
    viewport.suspendTimer = setTimeout(() => {
      info3 == null ? void 0 : info3("suspendTimer expired, escalate suspend to disable");
      this.disableViewport(viewport);
    }, 3e3);
  }
  resumeViewport(viewport) {
    if (viewport.suspendTimer) {
      debug4 == null ? void 0 : debug4("clear suspend timer");
      clearTimeout(viewport.suspendTimer);
      viewport.suspendTimer = null;
    }
    const [size, rows] = viewport.resume();
    debug4 == null ? void 0 : debug4(\`resumeViewport size \${size}, \${rows.length} rows sent to client\`);
    this.postMessageToClient({
      clientViewportId: viewport.clientViewportId,
      mode: "batch",
      rows,
      size,
      type: "viewport-update"
    });
  }
  openTreeNode(viewport, message) {
    if (viewport.serverViewportId) {
      const requestId = nextRequestId();
      this.sendIfReady(
        viewport.openTreeNode(requestId, message),
        requestId,
        viewport.status === "subscribed"
      );
    }
  }
  closeTreeNode(viewport, message) {
    if (viewport.serverViewportId) {
      const requestId = nextRequestId();
      this.sendIfReady(
        viewport.closeTreeNode(requestId, message),
        requestId,
        viewport.status === "subscribed"
      );
    }
  }
  createLink(viewport, message) {
    const { parentClientVpId, parentColumnName, childColumnName } = message;
    const requestId = nextRequestId();
    const parentVpId = this.mapClientToServerViewport.get(parentClientVpId);
    if (parentVpId) {
      const request = viewport.createLink(
        requestId,
        childColumnName,
        parentVpId,
        parentColumnName
      );
      this.sendMessageToServer(request, requestId);
    } else {
      error3("ServerProxy unable to create link, viewport not found");
    }
  }
  removeLink(viewport) {
    const requestId = nextRequestId();
    const request = viewport.removeLink(requestId);
    this.sendMessageToServer(request, requestId);
  }
  updateTitleOnVisualLinks(viewport) {
    var _a;
    const { serverViewportId, title } = viewport;
    for (const vp of this.viewports.values()) {
      if (vp !== viewport && vp.links && serverViewportId && title) {
        if ((_a = vp.links) == null ? void 0 : _a.some((link) => link.parentVpId === serverViewportId)) {
          const [messageToClient] = vp.setLinks(
            addTitleToLinks(vp.links, serverViewportId, title)
          );
          this.postMessageToClient(messageToClient);
        }
      }
    }
  }
  removeViewportFromVisualLinks(serverViewportId) {
    var _a;
    for (const vp of this.viewports.values()) {
      if ((_a = vp.links) == null ? void 0 : _a.some(({ parentVpId }) => parentVpId === serverViewportId)) {
        const [messageToClient] = vp.setLinks(
          vp.links.filter(({ parentVpId }) => parentVpId !== serverViewportId)
        );
        this.postMessageToClient(messageToClient);
      }
    }
  }
  menuRpcCall(message) {
    const viewport = this.getViewportForClient(message.vpId, false);
    if (viewport == null ? void 0 : viewport.serverViewportId) {
      const [requestId, rpcRequest] = stripRequestId(message);
      this.sendMessageToServer(
        {
          ...rpcRequest,
          vpId: viewport.serverViewportId
        },
        requestId
      );
    }
  }
  viewportRpcCall(message) {
    const viewport = this.getViewportForClient(message.vpId, false);
    if (viewport == null ? void 0 : viewport.serverViewportId) {
      const [requestId, rpcRequest] = stripRequestId(message);
      this.sendMessageToServer(
        {
          ...rpcRequest,
          vpId: viewport.serverViewportId,
          namedParams: {}
        },
        requestId
      );
    }
  }
  rpcCall(message) {
    const [requestId, rpcRequest] = stripRequestId(message);
    const module = getRpcServiceModule(rpcRequest.service);
    this.sendMessageToServer(rpcRequest, requestId, { module });
  }
  handleMessageFromClient(message) {
    var _a;
    if (isViewporttMessage(message)) {
      if (message.type === "disable") {
        const viewport = this.getViewportForClient(message.viewport, false);
        if (viewport !== null) {
          return this.disableViewport(viewport);
        } else {
          return;
        }
      } else {
        const viewport = this.getViewportForClient(message.viewport);
        switch (message.type) {
          case "setViewRange":
            return this.setViewRange(viewport, message);
          case "config":
            return this.setConfig(viewport, message);
          case "aggregate":
            return this.aggregate(viewport, message);
          case "sort":
            return this.sort(viewport, message);
          case "groupBy":
            return this.groupBy(viewport, message);
          case "filter":
            return this.filter(viewport, message);
          case "select":
            return this.select(viewport, message);
          case "suspend":
            return this.suspendViewport(viewport);
          case "resume":
            return this.resumeViewport(viewport);
          case "enable":
            return this.enableViewport(viewport);
          case "openTreeNode":
            return this.openTreeNode(viewport, message);
          case "closeTreeNode":
            return this.closeTreeNode(viewport, message);
          case "createLink":
            return this.createLink(viewport, message);
          case "removeLink":
            return this.removeLink(viewport);
          case "setColumns":
            return this.setColumns(viewport, message);
          case "setTitle":
            return this.setTitle(viewport, message);
          default:
        }
      }
    } else if (isVuuRpcRequest(message)) {
      return this.viewportRpcCall(message);
    } else if (isVuuMenuRpcRequest(message)) {
      return this.menuRpcCall(message);
    } else {
      const { type, requestId } = message;
      switch (type) {
        case "GET_TABLE_LIST": {
          (_a = this.tableList) != null ? _a : this.tableList = this.awaitResponseToMessage(
            { type },
            requestId
          );
          this.tableList.then((response) => {
            this.postMessageToClient({
              type: "TABLE_LIST_RESP",
              tables: response.tables,
              requestId
            });
          });
          return;
        }
        case "GET_TABLE_META": {
          this.getTableMeta(message.table, requestId).then((tableSchema) => {
            if (tableSchema) {
              this.postMessageToClient({
                type: "TABLE_META_RESP",
                tableSchema,
                requestId
              });
            }
          });
          return;
        }
        case "RPC_CALL":
          return this.rpcCall(message);
        default:
      }
    }
    error3(
      \`Vuu ServerProxy Unexpected message from client \${JSON.stringify(
        message
      )}\`
    );
  }
  getTableMeta(table, requestId = nextRequestId()) {
    if (isSessionTable(table)) {
      return Promise.resolve(void 0);
    }
    const key = \`\${table.module}:\${table.table}\`;
    let tableMetaRequest = this.cachedTableMetaRequests.get(key);
    if (!tableMetaRequest) {
      tableMetaRequest = this.awaitResponseToMessage(
        { type: "GET_TABLE_META", table },
        requestId
      );
      this.cachedTableMetaRequests.set(key, tableMetaRequest);
    }
    return tableMetaRequest == null ? void 0 : tableMetaRequest.then((response) => this.cacheTableMeta(response));
  }
  awaitResponseToMessage(message, requestId = nextRequestId()) {
    return new Promise((resolve, reject) => {
      this.sendMessageToServer(message, requestId);
      this.pendingRequests.set(requestId, { reject, resolve });
    });
  }
  sendIfReady(message, requestId, isReady = true) {
    if (isReady) {
      this.sendMessageToServer(message, requestId);
    }
    return isReady;
  }
  sendMessageToServer(body, requestId = \`\${_requestId++}\`, options = DEFAULT_OPTIONS) {
    const { module = "CORE" } = options;
    if (this.authToken) {
      this.connection.send({
        requestId,
        sessionId: this.sessionId,
        token: this.authToken,
        user: this.user,
        module,
        body
      });
    }
  }
  handleMessageFromServer(message) {
    var _a, _b, _c;
    const { body, requestId, sessionId } = message;
    const pendingRequest = this.pendingRequests.get(requestId);
    if (pendingRequest) {
      const { resolve } = pendingRequest;
      this.pendingRequests.delete(requestId);
      resolve(body);
      return;
    }
    const { viewports } = this;
    switch (body.type) {
      case HB:
        this.sendMessageToServer(
          { type: HB_RESP, ts: +/* @__PURE__ */ new Date() },
          "NA"
        );
        break;
      case "LOGIN_SUCCESS":
        if (sessionId) {
          this.sessionId = sessionId;
          (_a = this.pendingLogin) == null ? void 0 : _a.resolve(sessionId);
          this.pendingLogin = void 0;
        } else {
          throw Error("LOGIN_SUCCESS did not provide sessionId");
        }
        break;
      case "REMOVE_VP_SUCCESS":
        {
          const viewport = viewports.get(body.viewPortId);
          if (viewport) {
            this.mapClientToServerViewport.delete(viewport.clientViewportId);
            viewports.delete(body.viewPortId);
            this.removeViewportFromVisualLinks(body.viewPortId);
          }
        }
        break;
      case SET_SELECTION_SUCCESS:
        {
          const viewport = this.viewports.get(body.vpId);
          if (viewport) {
            viewport.completeOperation(requestId);
          }
        }
        break;
      case CHANGE_VP_SUCCESS:
      case DISABLE_VP_SUCCESS:
        if (viewports.has(body.viewPortId)) {
          const viewport = this.viewports.get(body.viewPortId);
          if (viewport) {
            const response = viewport.completeOperation(requestId);
            if (response !== void 0) {
              this.postMessageToClient(response);
              if (debugEnabled4) {
                debug4(\`postMessageToClient \${JSON.stringify(response)}\`);
              }
            }
          }
        }
        break;
      case ENABLE_VP_SUCCESS:
        {
          const viewport = this.viewports.get(body.viewPortId);
          if (viewport) {
            const response = viewport.completeOperation(requestId);
            if (response) {
              this.postMessageToClient(response);
              const [size, rows] = viewport.resume();
              this.postMessageToClient({
                clientViewportId: viewport.clientViewportId,
                mode: "batch",
                rows,
                size,
                type: "viewport-update"
              });
            }
          }
        }
        break;
      case "TABLE_ROW":
        {
          const viewportRowMap = groupRowsByViewport(body.rows);
          if (debugEnabled4) {
            const [firstRow, secondRow] = body.rows;
            if (body.rows.length === 0) {
              debug4("handleMessageFromServer TABLE_ROW 0 rows");
            } else if ((firstRow == null ? void 0 : firstRow.rowIndex) === -1) {
              if (body.rows.length === 1) {
                if (firstRow.updateType === "SIZE") {
                  debug4(
                    \`handleMessageFromServer [\${firstRow.viewPortId}] TABLE_ROW SIZE ONLY \${firstRow.vpSize}\`
                  );
                } else {
                  debug4(
                    \`handleMessageFromServer [\${firstRow.viewPortId}] TABLE_ROW SIZE \${firstRow.vpSize} rowIdx \${firstRow.rowIndex}\`
                  );
                }
              } else {
                debug4(
                  \`handleMessageFromServer TABLE_ROW \${body.rows.length} rows, SIZE \${firstRow.vpSize}, [\${secondRow == null ? void 0 : secondRow.rowIndex}] - [\${(_b = body.rows[body.rows.length - 1]) == null ? void 0 : _b.rowIndex}]\`
                );
              }
            } else {
              debug4(
                \`handleMessageFromServer TABLE_ROW \${body.rows.length} rows [\${firstRow == null ? void 0 : firstRow.rowIndex}] - [\${(_c = body.rows[body.rows.length - 1]) == null ? void 0 : _c.rowIndex}]\`
              );
            }
          }
          for (const [viewportId, rows] of Object.entries(viewportRowMap)) {
            const viewport = viewports.get(viewportId);
            if (viewport) {
              viewport.updateRows(rows);
            } else {
              warn3 == null ? void 0 : warn3(
                \`TABLE_ROW message received for non registered viewport \${viewportId}\`
              );
            }
          }
          this.processUpdates();
        }
        break;
      case "CHANGE_VP_RANGE_SUCCESS":
        {
          const viewport = this.viewports.get(body.viewPortId);
          if (viewport) {
            const { from, to } = body;
            if (true) {
              info3 == null ? void 0 : info3(\`CHANGE_VP_RANGE_SUCCESS \${from} - \${to}\`);
            }
            viewport.completeOperation(requestId, from, to);
          }
        }
        break;
      case OPEN_TREE_SUCCESS:
      case CLOSE_TREE_SUCCESS:
        break;
      case "CREATE_VISUAL_LINK_SUCCESS":
        {
          const viewport = this.viewports.get(body.childVpId);
          const parentViewport = this.viewports.get(body.parentVpId);
          if (viewport && parentViewport) {
            const { childColumnName, parentColumnName } = body;
            const response = viewport.completeOperation(
              requestId,
              childColumnName,
              parentViewport.clientViewportId,
              parentColumnName
            );
            if (response) {
              this.postMessageToClient(response);
            }
          }
        }
        break;
      case "REMOVE_VISUAL_LINK_SUCCESS":
        {
          const viewport = this.viewports.get(body.childVpId);
          if (viewport) {
            const response = viewport.completeOperation(
              requestId
            );
            if (response) {
              this.postMessageToClient(response);
            }
          }
        }
        break;
      case "VP_VISUAL_LINKS_RESP":
        {
          const activeLinkDescriptors = this.getActiveLinks(body.links);
          const viewport = this.viewports.get(body.vpId);
          if (activeLinkDescriptors.length && viewport) {
            const linkDescriptorsWithLabels = addLabelsToLinks(
              activeLinkDescriptors,
              this.viewports
            );
            const [clientMessage, pendingLink] = viewport.setLinks(
              linkDescriptorsWithLabels
            );
            this.postMessageToClient(clientMessage);
            if (pendingLink) {
              const { link, parentClientVpId } = pendingLink;
              const requestId2 = nextRequestId();
              const serverViewportId = this.mapClientToServerViewport.get(parentClientVpId);
              if (serverViewportId) {
                const message2 = viewport.createLink(
                  requestId2,
                  link.fromColumn,
                  serverViewportId,
                  link.toColumn
                );
                this.sendMessageToServer(message2, requestId2);
              }
            }
          }
        }
        break;
      case "VIEW_PORT_MENUS_RESP":
        if (body.menu.name) {
          const viewport = this.viewports.get(body.vpId);
          if (viewport) {
            const clientMessage = viewport.setMenu(body.menu);
            this.postMessageToClient(clientMessage);
          }
        }
        break;
      case "VP_EDIT_RPC_RESPONSE":
        {
          this.postMessageToClient({
            action: body.action,
            requestId,
            rpcName: body.rpcName,
            type: "VP_EDIT_RPC_RESPONSE"
          });
        }
        break;
      case "VP_EDIT_RPC_REJECT":
        {
          const viewport = this.viewports.get(body.vpId);
          if (viewport) {
            this.postMessageToClient({
              requestId,
              type: "VP_EDIT_RPC_REJECT",
              error: body.error
            });
          }
        }
        break;
      case "VIEW_PORT_MENU_REJ": {
        console.log(\`send menu error back to client\`);
        const { error: error4, rpcName, vpId } = body;
        const viewport = this.viewports.get(vpId);
        if (viewport) {
          this.postMessageToClient({
            clientViewportId: viewport.clientViewportId,
            error: error4,
            rpcName,
            type: "VIEW_PORT_MENU_REJ",
            requestId
          });
        }
        break;
      }
      case "VIEW_PORT_MENU_RESP":
        {
          if (isSessionTableActionMessage(body)) {
            const { action, rpcName } = body;
            this.awaitResponseToMessage({
              type: "GET_TABLE_META",
              table: action.table
            }).then((response) => {
              const tableSchema = createSchemaFromTableMetadata(
                response
              );
              this.postMessageToClient({
                rpcName,
                type: "VIEW_PORT_MENU_RESP",
                action: {
                  ...action,
                  tableSchema
                },
                tableAlreadyOpen: this.isTableOpen(action.table),
                requestId
              });
            });
          } else {
            const { action } = body;
            this.postMessageToClient({
              type: "VIEW_PORT_MENU_RESP",
              action: action || NO_ACTION,
              tableAlreadyOpen: action !== null && this.isTableOpen(action.table),
              requestId
            });
          }
        }
        break;
      case "RPC_RESP":
        {
          const { method, result } = body;
          this.postMessageToClient({
            type: "RPC_RESP",
            method,
            result,
            requestId
          });
        }
        break;
      case "VIEW_PORT_RPC_REPONSE":
        {
          const { method, action } = body;
          this.postMessageToClient({
            type: "VIEW_PORT_RPC_RESPONSE",
            rpcName: method,
            action,
            requestId
          });
        }
        break;
      case "ERROR":
        error3(body.msg);
        break;
      default:
        infoEnabled3 && info3(\`handleMessageFromServer \${body["type"]}.\`);
    }
  }
  cacheTableMeta(messageBody) {
    const { module, table } = messageBody.table;
    const key = \`\${module}:\${table}\`;
    let tableSchema = this.cachedTableSchemas.get(key);
    if (!tableSchema) {
      tableSchema = createSchemaFromTableMetadata(messageBody);
      this.cachedTableSchemas.set(key, tableSchema);
    }
    return tableSchema;
  }
  isTableOpen(table) {
    if (table) {
      const tableName = table.table;
      for (const viewport of this.viewports.values()) {
        if (!viewport.suspended && viewport.table.table === tableName) {
          return true;
        }
      }
    }
  }
  // Eliminate links to suspended viewports
  getActiveLinks(linkDescriptors) {
    return linkDescriptors.filter((linkDescriptor) => {
      const viewport = this.viewports.get(linkDescriptor.parentVpId);
      return viewport && !viewport.suspended;
    });
  }
  processUpdates() {
    this.viewports.forEach((viewport) => {
      var _a;
      if (viewport.hasUpdatesToProcess) {
        const result = viewport.getClientRows();
        if (result !== NO_DATA_UPDATE) {
          const [rows, mode] = result;
          const size = viewport.getNewRowCount();
          if (size !== void 0 || rows && rows.length > 0) {
            debugEnabled4 && debug4(
              \`postMessageToClient #\${viewport.clientViewportId} viewport-update \${mode}, \${(_a = rows == null ? void 0 : rows.length) != null ? _a : "no"} rows, size \${size}\`
            );
            if (mode) {
              this.postMessageToClient({
                clientViewportId: viewport.clientViewportId,
                mode,
                rows,
                size,
                type: "viewport-update"
              });
            }
          }
        }
      }
    });
  }
};

// src/worker.ts
var server;
var { info: info4, infoEnabled: infoEnabled4 } = logger("worker");
async function connectToServer(url, protocol, token, username, onConnectionStatusChange, retryLimitDisconnect, retryLimitStartup) {
  const connection = await connect(
    url,
    protocol,
    // if this was called during connect, we would get a ReferenceError, but it will
    // never be called until subscriptions have been made, so this is safe.
    //TODO do we need to listen in to the connection messages here so we can lock back in, in the event of a reconnenct ?
    (msg) => {
      if (isConnectionQualityMetrics(msg)) {
        postMessage({ type: "connection-metrics", messages: msg });
      } else if (isConnectionStatusMessage(msg)) {
        onConnectionStatusChange(msg);
        if (msg.status === "reconnected") {
          server.reconnect();
        }
      } else {
        server.handleMessageFromServer(msg);
      }
    },
    retryLimitDisconnect,
    retryLimitStartup
  );
  server = new ServerProxy(connection, (msg) => sendMessageToClient(msg));
  if (connection.requiresLogin) {
    await server.login(token, username);
  }
}
function sendMessageToClient(message) {
  postMessage(message);
}
var handleMessageFromClient = async ({
  data: message
}) => {
  switch (message.type) {
    case "connect":
      await connectToServer(
        message.url,
        message.protocol,
        message.token,
        message.username,
        postMessage,
        message.retryLimitDisconnect,
        message.retryLimitStartup
      );
      postMessage({ type: "connected" });
      break;
    case "subscribe":
      infoEnabled4 && info4(\`client subscribe: \${JSON.stringify(message)}\`);
      server.subscribe(message);
      break;
    case "unsubscribe":
      infoEnabled4 && info4(\`client unsubscribe: \${JSON.stringify(message)}\`);
      server.unsubscribe(message.viewport);
      break;
    default:
      infoEnabled4 && info4(\`client message: \${JSON.stringify(message)}\`);
      server.handleMessageFromClient(message);
  }
};
self.addEventListener("message", handleMessageFromClient);
postMessage({ type: "ready" });
/*! Bundled license information:

object-assign/index.js:
  (*
  object-assign
  (c) Sindre Sorhus
  @license MIT
  *)

react/cjs/react.development.js:
  (** @license React v17.0.2
   * react.development.js
   *
   * Copyright (c) Facebook, Inc. and its affiliates.
   *
   * This source code is licensed under the MIT license found in the
   * LICENSE file in the root directory of this source tree.
   *)
*/

`;