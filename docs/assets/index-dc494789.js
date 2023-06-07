(function () {
  const t = document.createElement('link').relList;
  if (t && t.supports && t.supports('modulepreload')) return;
  for (const l of document.querySelectorAll('link[rel="modulepreload"]')) r(l);
  new MutationObserver((l) => {
    for (const o of l) if (o.type === 'childList') for (const i of o.addedNodes) i.tagName === 'LINK' && i.rel === 'modulepreload' && r(i);
  }).observe(document, { childList: !0, subtree: !0 });
  function n(l) {
    const o = {};
    return (
      l.integrity && (o.integrity = l.integrity),
      l.referrerPolicy && (o.referrerPolicy = l.referrerPolicy),
      l.crossOrigin === 'use-credentials'
        ? (o.credentials = 'include')
        : l.crossOrigin === 'anonymous'
        ? (o.credentials = 'omit')
        : (o.credentials = 'same-origin'),
      o
    );
  }
  function r(l) {
    if (l.ep) return;
    l.ep = !0;
    const o = n(l);
    fetch(l.href, o);
  }
})();
function sc(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, 'default') ? e.default : e;
}
var Yu = { exports: {} },
  nl = {},
  Xu = { exports: {} },
  T = {};
/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var Gn = Symbol.for('react.element'),
  ac = Symbol.for('react.portal'),
  cc = Symbol.for('react.fragment'),
  fc = Symbol.for('react.strict_mode'),
  dc = Symbol.for('react.profiler'),
  pc = Symbol.for('react.provider'),
  hc = Symbol.for('react.context'),
  mc = Symbol.for('react.forward_ref'),
  vc = Symbol.for('react.suspense'),
  yc = Symbol.for('react.memo'),
  gc = Symbol.for('react.lazy'),
  Fi = Symbol.iterator;
function wc(e) {
  return e === null || typeof e != 'object' ? null : ((e = (Fi && e[Fi]) || e['@@iterator']), typeof e == 'function' ? e : null);
}
var Gu = {
    isMounted: function () {
      return !1;
    },
    enqueueForceUpdate: function () {},
    enqueueReplaceState: function () {},
    enqueueSetState: function () {},
  },
  Zu = Object.assign,
  Ju = {};
function on(e, t, n) {
  (this.props = e), (this.context = t), (this.refs = Ju), (this.updater = n || Gu);
}
on.prototype.isReactComponent = {};
on.prototype.setState = function (e, t) {
  if (typeof e != 'object' && typeof e != 'function' && e != null)
    throw Error('setState(...): takes an object of state variables to update or a function which returns an object of state variables.');
  this.updater.enqueueSetState(this, e, t, 'setState');
};
on.prototype.forceUpdate = function (e) {
  this.updater.enqueueForceUpdate(this, e, 'forceUpdate');
};
function qu() {}
qu.prototype = on.prototype;
function Vo(e, t, n) {
  (this.props = e), (this.context = t), (this.refs = Ju), (this.updater = n || Gu);
}
var Bo = (Vo.prototype = new qu());
Bo.constructor = Vo;
Zu(Bo, on.prototype);
Bo.isPureReactComponent = !0;
var Ui = Array.isArray,
  bu = Object.prototype.hasOwnProperty,
  Ho = { current: null },
  es = { key: !0, ref: !0, __self: !0, __source: !0 };
function ts(e, t, n) {
  var r,
    l = {},
    o = null,
    i = null;
  if (t != null)
    for (r in (t.ref !== void 0 && (i = t.ref), t.key !== void 0 && (o = '' + t.key), t))
      bu.call(t, r) && !es.hasOwnProperty(r) && (l[r] = t[r]);
  var u = arguments.length - 2;
  if (u === 1) l.children = n;
  else if (1 < u) {
    for (var s = Array(u), a = 0; a < u; a++) s[a] = arguments[a + 2];
    l.children = s;
  }
  if (e && e.defaultProps) for (r in ((u = e.defaultProps), u)) l[r] === void 0 && (l[r] = u[r]);
  return { $$typeof: Gn, type: e, key: o, ref: i, props: l, _owner: Ho.current };
}
function Sc(e, t) {
  return { $$typeof: Gn, type: e.type, key: t, ref: e.ref, props: e.props, _owner: e._owner };
}
function Wo(e) {
  return typeof e == 'object' && e !== null && e.$$typeof === Gn;
}
function kc(e) {
  var t = { '=': '=0', ':': '=2' };
  return (
    '$' +
    e.replace(/[=:]/g, function (n) {
      return t[n];
    })
  );
}
var $i = /\/+/g;
function kl(e, t) {
  return typeof e == 'object' && e !== null && e.key != null ? kc('' + e.key) : t.toString(36);
}
function Sr(e, t, n, r, l) {
  var o = typeof e;
  (o === 'undefined' || o === 'boolean') && (e = null);
  var i = !1;
  if (e === null) i = !0;
  else
    switch (o) {
      case 'string':
      case 'number':
        i = !0;
        break;
      case 'object':
        switch (e.$$typeof) {
          case Gn:
          case ac:
            i = !0;
        }
    }
  if (i)
    return (
      (i = e),
      (l = l(i)),
      (e = r === '' ? '.' + kl(i, 0) : r),
      Ui(l)
        ? ((n = ''),
          e != null && (n = e.replace($i, '$&/') + '/'),
          Sr(l, t, n, '', function (a) {
            return a;
          }))
        : l != null &&
          (Wo(l) && (l = Sc(l, n + (!l.key || (i && i.key === l.key) ? '' : ('' + l.key).replace($i, '$&/') + '/') + e)), t.push(l)),
      1
    );
  if (((i = 0), (r = r === '' ? '.' : r + ':'), Ui(e)))
    for (var u = 0; u < e.length; u++) {
      o = e[u];
      var s = r + kl(o, u);
      i += Sr(o, t, n, s, l);
    }
  else if (((s = wc(e)), typeof s == 'function'))
    for (e = s.call(e), u = 0; !(o = e.next()).done; ) (o = o.value), (s = r + kl(o, u++)), (i += Sr(o, t, n, s, l));
  else if (o === 'object')
    throw (
      ((t = String(e)),
      Error(
        'Objects are not valid as a React child (found: ' +
          (t === '[object Object]' ? 'object with keys {' + Object.keys(e).join(', ') + '}' : t) +
          '). If you meant to render a collection of children, use an array instead.'
      ))
    );
  return i;
}
function rr(e, t, n) {
  if (e == null) return e;
  var r = [],
    l = 0;
  return (
    Sr(e, r, '', '', function (o) {
      return t.call(n, o, l++);
    }),
    r
  );
}
function xc(e) {
  if (e._status === -1) {
    var t = e._result;
    (t = t()),
      t.then(
        function (n) {
          (e._status === 0 || e._status === -1) && ((e._status = 1), (e._result = n));
        },
        function (n) {
          (e._status === 0 || e._status === -1) && ((e._status = 2), (e._result = n));
        }
      ),
      e._status === -1 && ((e._status = 0), (e._result = t));
  }
  if (e._status === 1) return e._result.default;
  throw e._result;
}
var se = { current: null },
  kr = { transition: null },
  Ec = { ReactCurrentDispatcher: se, ReactCurrentBatchConfig: kr, ReactCurrentOwner: Ho };
T.Children = {
  map: rr,
  forEach: function (e, t, n) {
    rr(
      e,
      function () {
        t.apply(this, arguments);
      },
      n
    );
  },
  count: function (e) {
    var t = 0;
    return (
      rr(e, function () {
        t++;
      }),
      t
    );
  },
  toArray: function (e) {
    return (
      rr(e, function (t) {
        return t;
      }) || []
    );
  },
  only: function (e) {
    if (!Wo(e)) throw Error('React.Children.only expected to receive a single React element child.');
    return e;
  },
};
T.Component = on;
T.Fragment = cc;
T.Profiler = dc;
T.PureComponent = Vo;
T.StrictMode = fc;
T.Suspense = vc;
T.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Ec;
T.cloneElement = function (e, t, n) {
  if (e == null) throw Error('React.cloneElement(...): The argument must be a React element, but you passed ' + e + '.');
  var r = Zu({}, e.props),
    l = e.key,
    o = e.ref,
    i = e._owner;
  if (t != null) {
    if ((t.ref !== void 0 && ((o = t.ref), (i = Ho.current)), t.key !== void 0 && (l = '' + t.key), e.type && e.type.defaultProps))
      var u = e.type.defaultProps;
    for (s in t) bu.call(t, s) && !es.hasOwnProperty(s) && (r[s] = t[s] === void 0 && u !== void 0 ? u[s] : t[s]);
  }
  var s = arguments.length - 2;
  if (s === 1) r.children = n;
  else if (1 < s) {
    u = Array(s);
    for (var a = 0; a < s; a++) u[a] = arguments[a + 2];
    r.children = u;
  }
  return { $$typeof: Gn, type: e.type, key: l, ref: o, props: r, _owner: i };
};
T.createContext = function (e) {
  return (
    (e = {
      $$typeof: hc,
      _currentValue: e,
      _currentValue2: e,
      _threadCount: 0,
      Provider: null,
      Consumer: null,
      _defaultValue: null,
      _globalName: null,
    }),
    (e.Provider = { $$typeof: pc, _context: e }),
    (e.Consumer = e)
  );
};
T.createElement = ts;
T.createFactory = function (e) {
  var t = ts.bind(null, e);
  return (t.type = e), t;
};
T.createRef = function () {
  return { current: null };
};
T.forwardRef = function (e) {
  return { $$typeof: mc, render: e };
};
T.isValidElement = Wo;
T.lazy = function (e) {
  return { $$typeof: gc, _payload: { _status: -1, _result: e }, _init: xc };
};
T.memo = function (e, t) {
  return { $$typeof: yc, type: e, compare: t === void 0 ? null : t };
};
T.startTransition = function (e) {
  var t = kr.transition;
  kr.transition = {};
  try {
    e();
  } finally {
    kr.transition = t;
  }
};
T.unstable_act = function () {
  throw Error('act(...) is not supported in production builds of React.');
};
T.useCallback = function (e, t) {
  return se.current.useCallback(e, t);
};
T.useContext = function (e) {
  return se.current.useContext(e);
};
T.useDebugValue = function () {};
T.useDeferredValue = function (e) {
  return se.current.useDeferredValue(e);
};
T.useEffect = function (e, t) {
  return se.current.useEffect(e, t);
};
T.useId = function () {
  return se.current.useId();
};
T.useImperativeHandle = function (e, t, n) {
  return se.current.useImperativeHandle(e, t, n);
};
T.useInsertionEffect = function (e, t) {
  return se.current.useInsertionEffect(e, t);
};
T.useLayoutEffect = function (e, t) {
  return se.current.useLayoutEffect(e, t);
};
T.useMemo = function (e, t) {
  return se.current.useMemo(e, t);
};
T.useReducer = function (e, t, n) {
  return se.current.useReducer(e, t, n);
};
T.useRef = function (e) {
  return se.current.useRef(e);
};
T.useState = function (e) {
  return se.current.useState(e);
};
T.useSyncExternalStore = function (e, t, n) {
  return se.current.useSyncExternalStore(e, t, n);
};
T.useTransition = function () {
  return se.current.useTransition();
};
T.version = '18.2.0';
Xu.exports = T;
var I = Xu.exports;
const Cc = sc(I);
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var _c = I,
  Nc = Symbol.for('react.element'),
  jc = Symbol.for('react.fragment'),
  Pc = Object.prototype.hasOwnProperty,
  zc = _c.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,
  Tc = { key: !0, ref: !0, __self: !0, __source: !0 };
function ns(e, t, n) {
  var r,
    l = {},
    o = null,
    i = null;
  n !== void 0 && (o = '' + n), t.key !== void 0 && (o = '' + t.key), t.ref !== void 0 && (i = t.ref);
  for (r in t) Pc.call(t, r) && !Tc.hasOwnProperty(r) && (l[r] = t[r]);
  if (e && e.defaultProps) for (r in ((t = e.defaultProps), t)) l[r] === void 0 && (l[r] = t[r]);
  return { $$typeof: Nc, type: e, key: o, ref: i, props: l, _owner: zc.current };
}
nl.Fragment = jc;
nl.jsx = ns;
nl.jsxs = ns;
Yu.exports = nl;
var p = Yu.exports,
  Yl = {},
  rs = { exports: {} },
  Se = {},
  ls = { exports: {} },
  os = {};
/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ (function (e) {
  function t(C, P) {
    var z = C.length;
    C.push(P);
    e: for (; 0 < z; ) {
      var Q = (z - 1) >>> 1,
        Z = C[Q];
      if (0 < l(Z, P)) (C[Q] = P), (C[z] = Z), (z = Q);
      else break e;
    }
  }
  function n(C) {
    return C.length === 0 ? null : C[0];
  }
  function r(C) {
    if (C.length === 0) return null;
    var P = C[0],
      z = C.pop();
    if (z !== P) {
      C[0] = z;
      e: for (var Q = 0, Z = C.length, tr = Z >>> 1; Q < tr; ) {
        var yt = 2 * (Q + 1) - 1,
          Sl = C[yt],
          gt = yt + 1,
          nr = C[gt];
        if (0 > l(Sl, z)) gt < Z && 0 > l(nr, Sl) ? ((C[Q] = nr), (C[gt] = z), (Q = gt)) : ((C[Q] = Sl), (C[yt] = z), (Q = yt));
        else if (gt < Z && 0 > l(nr, z)) (C[Q] = nr), (C[gt] = z), (Q = gt);
        else break e;
      }
    }
    return P;
  }
  function l(C, P) {
    var z = C.sortIndex - P.sortIndex;
    return z !== 0 ? z : C.id - P.id;
  }
  if (typeof performance == 'object' && typeof performance.now == 'function') {
    var o = performance;
    e.unstable_now = function () {
      return o.now();
    };
  } else {
    var i = Date,
      u = i.now();
    e.unstable_now = function () {
      return i.now() - u;
    };
  }
  var s = [],
    a = [],
    v = 1,
    h = null,
    m = 3,
    S = !1,
    w = !1,
    k = !1,
    U = typeof setTimeout == 'function' ? setTimeout : null,
    f = typeof clearTimeout == 'function' ? clearTimeout : null,
    c = typeof setImmediate < 'u' ? setImmediate : null;
  typeof navigator < 'u' &&
    navigator.scheduling !== void 0 &&
    navigator.scheduling.isInputPending !== void 0 &&
    navigator.scheduling.isInputPending.bind(navigator.scheduling);
  function d(C) {
    for (var P = n(a); P !== null; ) {
      if (P.callback === null) r(a);
      else if (P.startTime <= C) r(a), (P.sortIndex = P.expirationTime), t(s, P);
      else break;
      P = n(a);
    }
  }
  function y(C) {
    if (((k = !1), d(C), !w))
      if (n(s) !== null) (w = !0), gl(E);
      else {
        var P = n(a);
        P !== null && wl(y, P.startTime - C);
      }
  }
  function E(C, P) {
    (w = !1), k && ((k = !1), f(j), (j = -1)), (S = !0);
    var z = m;
    try {
      for (d(P), h = n(s); h !== null && (!(h.expirationTime > P) || (C && !Pe())); ) {
        var Q = h.callback;
        if (typeof Q == 'function') {
          (h.callback = null), (m = h.priorityLevel);
          var Z = Q(h.expirationTime <= P);
          (P = e.unstable_now()), typeof Z == 'function' ? (h.callback = Z) : h === n(s) && r(s), d(P);
        } else r(s);
        h = n(s);
      }
      if (h !== null) var tr = !0;
      else {
        var yt = n(a);
        yt !== null && wl(y, yt.startTime - P), (tr = !1);
      }
      return tr;
    } finally {
      (h = null), (m = z), (S = !1);
    }
  }
  var _ = !1,
    N = null,
    j = -1,
    W = 5,
    L = -1;
  function Pe() {
    return !(e.unstable_now() - L < W);
  }
  function an() {
    if (N !== null) {
      var C = e.unstable_now();
      L = C;
      var P = !0;
      try {
        P = N(!0, C);
      } finally {
        P ? cn() : ((_ = !1), (N = null));
      }
    } else _ = !1;
  }
  var cn;
  if (typeof c == 'function')
    cn = function () {
      c(an);
    };
  else if (typeof MessageChannel < 'u') {
    var Di = new MessageChannel(),
      uc = Di.port2;
    (Di.port1.onmessage = an),
      (cn = function () {
        uc.postMessage(null);
      });
  } else
    cn = function () {
      U(an, 0);
    };
  function gl(C) {
    (N = C), _ || ((_ = !0), cn());
  }
  function wl(C, P) {
    j = U(function () {
      C(e.unstable_now());
    }, P);
  }
  (e.unstable_IdlePriority = 5),
    (e.unstable_ImmediatePriority = 1),
    (e.unstable_LowPriority = 4),
    (e.unstable_NormalPriority = 3),
    (e.unstable_Profiling = null),
    (e.unstable_UserBlockingPriority = 2),
    (e.unstable_cancelCallback = function (C) {
      C.callback = null;
    }),
    (e.unstable_continueExecution = function () {
      w || S || ((w = !0), gl(E));
    }),
    (e.unstable_forceFrameRate = function (C) {
      0 > C || 125 < C
        ? console.error('forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported')
        : (W = 0 < C ? Math.floor(1e3 / C) : 5);
    }),
    (e.unstable_getCurrentPriorityLevel = function () {
      return m;
    }),
    (e.unstable_getFirstCallbackNode = function () {
      return n(s);
    }),
    (e.unstable_next = function (C) {
      switch (m) {
        case 1:
        case 2:
        case 3:
          var P = 3;
          break;
        default:
          P = m;
      }
      var z = m;
      m = P;
      try {
        return C();
      } finally {
        m = z;
      }
    }),
    (e.unstable_pauseExecution = function () {}),
    (e.unstable_requestPaint = function () {}),
    (e.unstable_runWithPriority = function (C, P) {
      switch (C) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break;
        default:
          C = 3;
      }
      var z = m;
      m = C;
      try {
        return P();
      } finally {
        m = z;
      }
    }),
    (e.unstable_scheduleCallback = function (C, P, z) {
      var Q = e.unstable_now();
      switch ((typeof z == 'object' && z !== null ? ((z = z.delay), (z = typeof z == 'number' && 0 < z ? Q + z : Q)) : (z = Q), C)) {
        case 1:
          var Z = -1;
          break;
        case 2:
          Z = 250;
          break;
        case 5:
          Z = 1073741823;
          break;
        case 4:
          Z = 1e4;
          break;
        default:
          Z = 5e3;
      }
      return (
        (Z = z + Z),
        (C = { id: v++, callback: P, priorityLevel: C, startTime: z, expirationTime: Z, sortIndex: -1 }),
        z > Q
          ? ((C.sortIndex = z), t(a, C), n(s) === null && C === n(a) && (k ? (f(j), (j = -1)) : (k = !0), wl(y, z - Q)))
          : ((C.sortIndex = Z), t(s, C), w || S || ((w = !0), gl(E))),
        C
      );
    }),
    (e.unstable_shouldYield = Pe),
    (e.unstable_wrapCallback = function (C) {
      var P = m;
      return function () {
        var z = m;
        m = P;
        try {
          return C.apply(this, arguments);
        } finally {
          m = z;
        }
      };
    });
})(os);
ls.exports = os;
var Lc = ls.exports;
/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var is = I,
  we = Lc;
function g(e) {
  for (var t = 'https://reactjs.org/docs/error-decoder.html?invariant=' + e, n = 1; n < arguments.length; n++)
    t += '&args[]=' + encodeURIComponent(arguments[n]);
  return (
    'Minified React error #' +
    e +
    '; visit ' +
    t +
    ' for the full message or use the non-minified dev environment for full errors and additional helpful warnings.'
  );
}
var us = new Set(),
  Rn = {};
function Lt(e, t) {
  qt(e, t), qt(e + 'Capture', t);
}
function qt(e, t) {
  for (Rn[e] = t, e = 0; e < t.length; e++) us.add(t[e]);
}
var Ke = !(typeof window > 'u' || typeof window.document > 'u' || typeof window.document.createElement > 'u'),
  Xl = Object.prototype.hasOwnProperty,
  Rc =
    /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,
  Ai = {},
  Vi = {};
function Ic(e) {
  return Xl.call(Vi, e) ? !0 : Xl.call(Ai, e) ? !1 : Rc.test(e) ? (Vi[e] = !0) : ((Ai[e] = !0), !1);
}
function Mc(e, t, n, r) {
  if (n !== null && n.type === 0) return !1;
  switch (typeof t) {
    case 'function':
    case 'symbol':
      return !0;
    case 'boolean':
      return r ? !1 : n !== null ? !n.acceptsBooleans : ((e = e.toLowerCase().slice(0, 5)), e !== 'data-' && e !== 'aria-');
    default:
      return !1;
  }
}
function Oc(e, t, n, r) {
  if (t === null || typeof t > 'u' || Mc(e, t, n, r)) return !0;
  if (r) return !1;
  if (n !== null)
    switch (n.type) {
      case 3:
        return !t;
      case 4:
        return t === !1;
      case 5:
        return isNaN(t);
      case 6:
        return isNaN(t) || 1 > t;
    }
  return !1;
}
function ae(e, t, n, r, l, o, i) {
  (this.acceptsBooleans = t === 2 || t === 3 || t === 4),
    (this.attributeName = r),
    (this.attributeNamespace = l),
    (this.mustUseProperty = n),
    (this.propertyName = e),
    (this.type = t),
    (this.sanitizeURL = o),
    (this.removeEmptyString = i);
}
var te = {};
'children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style'
  .split(' ')
  .forEach(function (e) {
    te[e] = new ae(e, 0, !1, e, null, !1, !1);
  });
[
  ['acceptCharset', 'accept-charset'],
  ['className', 'class'],
  ['htmlFor', 'for'],
  ['httpEquiv', 'http-equiv'],
].forEach(function (e) {
  var t = e[0];
  te[t] = new ae(t, 1, !1, e[1], null, !1, !1);
});
['contentEditable', 'draggable', 'spellCheck', 'value'].forEach(function (e) {
  te[e] = new ae(e, 2, !1, e.toLowerCase(), null, !1, !1);
});
['autoReverse', 'externalResourcesRequired', 'focusable', 'preserveAlpha'].forEach(function (e) {
  te[e] = new ae(e, 2, !1, e, null, !1, !1);
});
'allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope'
  .split(' ')
  .forEach(function (e) {
    te[e] = new ae(e, 3, !1, e.toLowerCase(), null, !1, !1);
  });
['checked', 'multiple', 'muted', 'selected'].forEach(function (e) {
  te[e] = new ae(e, 3, !0, e, null, !1, !1);
});
['capture', 'download'].forEach(function (e) {
  te[e] = new ae(e, 4, !1, e, null, !1, !1);
});
['cols', 'rows', 'size', 'span'].forEach(function (e) {
  te[e] = new ae(e, 6, !1, e, null, !1, !1);
});
['rowSpan', 'start'].forEach(function (e) {
  te[e] = new ae(e, 5, !1, e.toLowerCase(), null, !1, !1);
});
var Qo = /[\-:]([a-z])/g;
function Ko(e) {
  return e[1].toUpperCase();
}
'accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height'
  .split(' ')
  .forEach(function (e) {
    var t = e.replace(Qo, Ko);
    te[t] = new ae(t, 1, !1, e, null, !1, !1);
  });
'xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type'.split(' ').forEach(function (e) {
  var t = e.replace(Qo, Ko);
  te[t] = new ae(t, 1, !1, e, 'http://www.w3.org/1999/xlink', !1, !1);
});
['xml:base', 'xml:lang', 'xml:space'].forEach(function (e) {
  var t = e.replace(Qo, Ko);
  te[t] = new ae(t, 1, !1, e, 'http://www.w3.org/XML/1998/namespace', !1, !1);
});
['tabIndex', 'crossOrigin'].forEach(function (e) {
  te[e] = new ae(e, 1, !1, e.toLowerCase(), null, !1, !1);
});
te.xlinkHref = new ae('xlinkHref', 1, !1, 'xlink:href', 'http://www.w3.org/1999/xlink', !0, !1);
['src', 'href', 'action', 'formAction'].forEach(function (e) {
  te[e] = new ae(e, 1, !1, e.toLowerCase(), null, !0, !0);
});
function Yo(e, t, n, r) {
  var l = te.hasOwnProperty(t) ? te[t] : null;
  (l !== null ? l.type !== 0 : r || !(2 < t.length) || (t[0] !== 'o' && t[0] !== 'O') || (t[1] !== 'n' && t[1] !== 'N')) &&
    (Oc(t, n, l, r) && (n = null),
    r || l === null
      ? Ic(t) && (n === null ? e.removeAttribute(t) : e.setAttribute(t, '' + n))
      : l.mustUseProperty
      ? (e[l.propertyName] = n === null ? (l.type === 3 ? !1 : '') : n)
      : ((t = l.attributeName),
        (r = l.attributeNamespace),
        n === null
          ? e.removeAttribute(t)
          : ((l = l.type), (n = l === 3 || (l === 4 && n === !0) ? '' : '' + n), r ? e.setAttributeNS(r, t, n) : e.setAttribute(t, n))));
}
var Ze = is.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  lr = Symbol.for('react.element'),
  Mt = Symbol.for('react.portal'),
  Ot = Symbol.for('react.fragment'),
  Xo = Symbol.for('react.strict_mode'),
  Gl = Symbol.for('react.profiler'),
  ss = Symbol.for('react.provider'),
  as = Symbol.for('react.context'),
  Go = Symbol.for('react.forward_ref'),
  Zl = Symbol.for('react.suspense'),
  Jl = Symbol.for('react.suspense_list'),
  Zo = Symbol.for('react.memo'),
  qe = Symbol.for('react.lazy'),
  cs = Symbol.for('react.offscreen'),
  Bi = Symbol.iterator;
function fn(e) {
  return e === null || typeof e != 'object' ? null : ((e = (Bi && e[Bi]) || e['@@iterator']), typeof e == 'function' ? e : null);
}
var B = Object.assign,
  xl;
function wn(e) {
  if (xl === void 0)
    try {
      throw Error();
    } catch (n) {
      var t = n.stack.trim().match(/\n( *(at )?)/);
      xl = (t && t[1]) || '';
    }
  return (
    `
` +
    xl +
    e
  );
}
var El = !1;
function Cl(e, t) {
  if (!e || El) return '';
  El = !0;
  var n = Error.prepareStackTrace;
  Error.prepareStackTrace = void 0;
  try {
    if (t)
      if (
        ((t = function () {
          throw Error();
        }),
        Object.defineProperty(t.prototype, 'props', {
          set: function () {
            throw Error();
          },
        }),
        typeof Reflect == 'object' && Reflect.construct)
      ) {
        try {
          Reflect.construct(t, []);
        } catch (a) {
          var r = a;
        }
        Reflect.construct(e, [], t);
      } else {
        try {
          t.call();
        } catch (a) {
          r = a;
        }
        e.call(t.prototype);
      }
    else {
      try {
        throw Error();
      } catch (a) {
        r = a;
      }
      e();
    }
  } catch (a) {
    if (a && r && typeof a.stack == 'string') {
      for (
        var l = a.stack.split(`
`),
          o = r.stack.split(`
`),
          i = l.length - 1,
          u = o.length - 1;
        1 <= i && 0 <= u && l[i] !== o[u];

      )
        u--;
      for (; 1 <= i && 0 <= u; i--, u--)
        if (l[i] !== o[u]) {
          if (i !== 1 || u !== 1)
            do
              if ((i--, u--, 0 > u || l[i] !== o[u])) {
                var s =
                  `
` + l[i].replace(' at new ', ' at ');
                return e.displayName && s.includes('<anonymous>') && (s = s.replace('<anonymous>', e.displayName)), s;
              }
            while (1 <= i && 0 <= u);
          break;
        }
    }
  } finally {
    (El = !1), (Error.prepareStackTrace = n);
  }
  return (e = e ? e.displayName || e.name : '') ? wn(e) : '';
}
function Dc(e) {
  switch (e.tag) {
    case 5:
      return wn(e.type);
    case 16:
      return wn('Lazy');
    case 13:
      return wn('Suspense');
    case 19:
      return wn('SuspenseList');
    case 0:
    case 2:
    case 15:
      return (e = Cl(e.type, !1)), e;
    case 11:
      return (e = Cl(e.type.render, !1)), e;
    case 1:
      return (e = Cl(e.type, !0)), e;
    default:
      return '';
  }
}
function ql(e) {
  if (e == null) return null;
  if (typeof e == 'function') return e.displayName || e.name || null;
  if (typeof e == 'string') return e;
  switch (e) {
    case Ot:
      return 'Fragment';
    case Mt:
      return 'Portal';
    case Gl:
      return 'Profiler';
    case Xo:
      return 'StrictMode';
    case Zl:
      return 'Suspense';
    case Jl:
      return 'SuspenseList';
  }
  if (typeof e == 'object')
    switch (e.$$typeof) {
      case as:
        return (e.displayName || 'Context') + '.Consumer';
      case ss:
        return (e._context.displayName || 'Context') + '.Provider';
      case Go:
        var t = e.render;
        return (e = e.displayName), e || ((e = t.displayName || t.name || ''), (e = e !== '' ? 'ForwardRef(' + e + ')' : 'ForwardRef')), e;
      case Zo:
        return (t = e.displayName || null), t !== null ? t : ql(e.type) || 'Memo';
      case qe:
        (t = e._payload), (e = e._init);
        try {
          return ql(e(t));
        } catch {}
    }
  return null;
}
function Fc(e) {
  var t = e.type;
  switch (e.tag) {
    case 24:
      return 'Cache';
    case 9:
      return (t.displayName || 'Context') + '.Consumer';
    case 10:
      return (t._context.displayName || 'Context') + '.Provider';
    case 18:
      return 'DehydratedFragment';
    case 11:
      return (e = t.render), (e = e.displayName || e.name || ''), t.displayName || (e !== '' ? 'ForwardRef(' + e + ')' : 'ForwardRef');
    case 7:
      return 'Fragment';
    case 5:
      return t;
    case 4:
      return 'Portal';
    case 3:
      return 'Root';
    case 6:
      return 'Text';
    case 16:
      return ql(t);
    case 8:
      return t === Xo ? 'StrictMode' : 'Mode';
    case 22:
      return 'Offscreen';
    case 12:
      return 'Profiler';
    case 21:
      return 'Scope';
    case 13:
      return 'Suspense';
    case 19:
      return 'SuspenseList';
    case 25:
      return 'TracingMarker';
    case 1:
    case 0:
    case 17:
    case 2:
    case 14:
    case 15:
      if (typeof t == 'function') return t.displayName || t.name || null;
      if (typeof t == 'string') return t;
  }
  return null;
}
function dt(e) {
  switch (typeof e) {
    case 'boolean':
    case 'number':
    case 'string':
    case 'undefined':
      return e;
    case 'object':
      return e;
    default:
      return '';
  }
}
function fs(e) {
  var t = e.type;
  return (e = e.nodeName) && e.toLowerCase() === 'input' && (t === 'checkbox' || t === 'radio');
}
function Uc(e) {
  var t = fs(e) ? 'checked' : 'value',
    n = Object.getOwnPropertyDescriptor(e.constructor.prototype, t),
    r = '' + e[t];
  if (!e.hasOwnProperty(t) && typeof n < 'u' && typeof n.get == 'function' && typeof n.set == 'function') {
    var l = n.get,
      o = n.set;
    return (
      Object.defineProperty(e, t, {
        configurable: !0,
        get: function () {
          return l.call(this);
        },
        set: function (i) {
          (r = '' + i), o.call(this, i);
        },
      }),
      Object.defineProperty(e, t, { enumerable: n.enumerable }),
      {
        getValue: function () {
          return r;
        },
        setValue: function (i) {
          r = '' + i;
        },
        stopTracking: function () {
          (e._valueTracker = null), delete e[t];
        },
      }
    );
  }
}
function or(e) {
  e._valueTracker || (e._valueTracker = Uc(e));
}
function ds(e) {
  if (!e) return !1;
  var t = e._valueTracker;
  if (!t) return !0;
  var n = t.getValue(),
    r = '';
  return e && (r = fs(e) ? (e.checked ? 'true' : 'false') : e.value), (e = r), e !== n ? (t.setValue(e), !0) : !1;
}
function Rr(e) {
  if (((e = e || (typeof document < 'u' ? document : void 0)), typeof e > 'u')) return null;
  try {
    return e.activeElement || e.body;
  } catch {
    return e.body;
  }
}
function bl(e, t) {
  var n = t.checked;
  return B({}, t, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: n ?? e._wrapperState.initialChecked });
}
function Hi(e, t) {
  var n = t.defaultValue == null ? '' : t.defaultValue,
    r = t.checked != null ? t.checked : t.defaultChecked;
  (n = dt(t.value != null ? t.value : n)),
    (e._wrapperState = {
      initialChecked: r,
      initialValue: n,
      controlled: t.type === 'checkbox' || t.type === 'radio' ? t.checked != null : t.value != null,
    });
}
function ps(e, t) {
  (t = t.checked), t != null && Yo(e, 'checked', t, !1);
}
function eo(e, t) {
  ps(e, t);
  var n = dt(t.value),
    r = t.type;
  if (n != null)
    r === 'number' ? ((n === 0 && e.value === '') || e.value != n) && (e.value = '' + n) : e.value !== '' + n && (e.value = '' + n);
  else if (r === 'submit' || r === 'reset') {
    e.removeAttribute('value');
    return;
  }
  t.hasOwnProperty('value') ? to(e, t.type, n) : t.hasOwnProperty('defaultValue') && to(e, t.type, dt(t.defaultValue)),
    t.checked == null && t.defaultChecked != null && (e.defaultChecked = !!t.defaultChecked);
}
function Wi(e, t, n) {
  if (t.hasOwnProperty('value') || t.hasOwnProperty('defaultValue')) {
    var r = t.type;
    if (!((r !== 'submit' && r !== 'reset') || (t.value !== void 0 && t.value !== null))) return;
    (t = '' + e._wrapperState.initialValue), n || t === e.value || (e.value = t), (e.defaultValue = t);
  }
  (n = e.name), n !== '' && (e.name = ''), (e.defaultChecked = !!e._wrapperState.initialChecked), n !== '' && (e.name = n);
}
function to(e, t, n) {
  (t !== 'number' || Rr(e.ownerDocument) !== e) &&
    (n == null ? (e.defaultValue = '' + e._wrapperState.initialValue) : e.defaultValue !== '' + n && (e.defaultValue = '' + n));
}
var Sn = Array.isArray;
function Kt(e, t, n, r) {
  if (((e = e.options), t)) {
    t = {};
    for (var l = 0; l < n.length; l++) t['$' + n[l]] = !0;
    for (n = 0; n < e.length; n++)
      (l = t.hasOwnProperty('$' + e[n].value)), e[n].selected !== l && (e[n].selected = l), l && r && (e[n].defaultSelected = !0);
  } else {
    for (n = '' + dt(n), t = null, l = 0; l < e.length; l++) {
      if (e[l].value === n) {
        (e[l].selected = !0), r && (e[l].defaultSelected = !0);
        return;
      }
      t !== null || e[l].disabled || (t = e[l]);
    }
    t !== null && (t.selected = !0);
  }
}
function no(e, t) {
  if (t.dangerouslySetInnerHTML != null) throw Error(g(91));
  return B({}, t, { value: void 0, defaultValue: void 0, children: '' + e._wrapperState.initialValue });
}
function Qi(e, t) {
  var n = t.value;
  if (n == null) {
    if (((n = t.children), (t = t.defaultValue), n != null)) {
      if (t != null) throw Error(g(92));
      if (Sn(n)) {
        if (1 < n.length) throw Error(g(93));
        n = n[0];
      }
      t = n;
    }
    t == null && (t = ''), (n = t);
  }
  e._wrapperState = { initialValue: dt(n) };
}
function hs(e, t) {
  var n = dt(t.value),
    r = dt(t.defaultValue);
  n != null && ((n = '' + n), n !== e.value && (e.value = n), t.defaultValue == null && e.defaultValue !== n && (e.defaultValue = n)),
    r != null && (e.defaultValue = '' + r);
}
function Ki(e) {
  var t = e.textContent;
  t === e._wrapperState.initialValue && t !== '' && t !== null && (e.value = t);
}
function ms(e) {
  switch (e) {
    case 'svg':
      return 'http://www.w3.org/2000/svg';
    case 'math':
      return 'http://www.w3.org/1998/Math/MathML';
    default:
      return 'http://www.w3.org/1999/xhtml';
  }
}
function ro(e, t) {
  return e == null || e === 'http://www.w3.org/1999/xhtml'
    ? ms(t)
    : e === 'http://www.w3.org/2000/svg' && t === 'foreignObject'
    ? 'http://www.w3.org/1999/xhtml'
    : e;
}
var ir,
  vs = (function (e) {
    return typeof MSApp < 'u' && MSApp.execUnsafeLocalFunction
      ? function (t, n, r, l) {
          MSApp.execUnsafeLocalFunction(function () {
            return e(t, n, r, l);
          });
        }
      : e;
  })(function (e, t) {
    if (e.namespaceURI !== 'http://www.w3.org/2000/svg' || 'innerHTML' in e) e.innerHTML = t;
    else {
      for (
        ir = ir || document.createElement('div'), ir.innerHTML = '<svg>' + t.valueOf().toString() + '</svg>', t = ir.firstChild;
        e.firstChild;

      )
        e.removeChild(e.firstChild);
      for (; t.firstChild; ) e.appendChild(t.firstChild);
    }
  });
function In(e, t) {
  if (t) {
    var n = e.firstChild;
    if (n && n === e.lastChild && n.nodeType === 3) {
      n.nodeValue = t;
      return;
    }
  }
  e.textContent = t;
}
var En = {
    animationIterationCount: !0,
    aspectRatio: !0,
    borderImageOutset: !0,
    borderImageSlice: !0,
    borderImageWidth: !0,
    boxFlex: !0,
    boxFlexGroup: !0,
    boxOrdinalGroup: !0,
    columnCount: !0,
    columns: !0,
    flex: !0,
    flexGrow: !0,
    flexPositive: !0,
    flexShrink: !0,
    flexNegative: !0,
    flexOrder: !0,
    gridArea: !0,
    gridRow: !0,
    gridRowEnd: !0,
    gridRowSpan: !0,
    gridRowStart: !0,
    gridColumn: !0,
    gridColumnEnd: !0,
    gridColumnSpan: !0,
    gridColumnStart: !0,
    fontWeight: !0,
    lineClamp: !0,
    lineHeight: !0,
    opacity: !0,
    order: !0,
    orphans: !0,
    tabSize: !0,
    widows: !0,
    zIndex: !0,
    zoom: !0,
    fillOpacity: !0,
    floodOpacity: !0,
    stopOpacity: !0,
    strokeDasharray: !0,
    strokeDashoffset: !0,
    strokeMiterlimit: !0,
    strokeOpacity: !0,
    strokeWidth: !0,
  },
  $c = ['Webkit', 'ms', 'Moz', 'O'];
Object.keys(En).forEach(function (e) {
  $c.forEach(function (t) {
    (t = t + e.charAt(0).toUpperCase() + e.substring(1)), (En[t] = En[e]);
  });
});
function ys(e, t, n) {
  return t == null || typeof t == 'boolean' || t === ''
    ? ''
    : n || typeof t != 'number' || t === 0 || (En.hasOwnProperty(e) && En[e])
    ? ('' + t).trim()
    : t + 'px';
}
function gs(e, t) {
  e = e.style;
  for (var n in t)
    if (t.hasOwnProperty(n)) {
      var r = n.indexOf('--') === 0,
        l = ys(n, t[n], r);
      n === 'float' && (n = 'cssFloat'), r ? e.setProperty(n, l) : (e[n] = l);
    }
}
var Ac = B(
  { menuitem: !0 },
  {
    area: !0,
    base: !0,
    br: !0,
    col: !0,
    embed: !0,
    hr: !0,
    img: !0,
    input: !0,
    keygen: !0,
    link: !0,
    meta: !0,
    param: !0,
    source: !0,
    track: !0,
    wbr: !0,
  }
);
function lo(e, t) {
  if (t) {
    if (Ac[e] && (t.children != null || t.dangerouslySetInnerHTML != null)) throw Error(g(137, e));
    if (t.dangerouslySetInnerHTML != null) {
      if (t.children != null) throw Error(g(60));
      if (typeof t.dangerouslySetInnerHTML != 'object' || !('__html' in t.dangerouslySetInnerHTML)) throw Error(g(61));
    }
    if (t.style != null && typeof t.style != 'object') throw Error(g(62));
  }
}
function oo(e, t) {
  if (e.indexOf('-') === -1) return typeof t.is == 'string';
  switch (e) {
    case 'annotation-xml':
    case 'color-profile':
    case 'font-face':
    case 'font-face-src':
    case 'font-face-uri':
    case 'font-face-format':
    case 'font-face-name':
    case 'missing-glyph':
      return !1;
    default:
      return !0;
  }
}
var io = null;
function Jo(e) {
  return (
    (e = e.target || e.srcElement || window),
    e.correspondingUseElement && (e = e.correspondingUseElement),
    e.nodeType === 3 ? e.parentNode : e
  );
}
var uo = null,
  Yt = null,
  Xt = null;
function Yi(e) {
  if ((e = qn(e))) {
    if (typeof uo != 'function') throw Error(g(280));
    var t = e.stateNode;
    t && ((t = ul(t)), uo(e.stateNode, e.type, t));
  }
}
function ws(e) {
  Yt ? (Xt ? Xt.push(e) : (Xt = [e])) : (Yt = e);
}
function Ss() {
  if (Yt) {
    var e = Yt,
      t = Xt;
    if (((Xt = Yt = null), Yi(e), t)) for (e = 0; e < t.length; e++) Yi(t[e]);
  }
}
function ks(e, t) {
  return e(t);
}
function xs() {}
var _l = !1;
function Es(e, t, n) {
  if (_l) return e(t, n);
  _l = !0;
  try {
    return ks(e, t, n);
  } finally {
    (_l = !1), (Yt !== null || Xt !== null) && (xs(), Ss());
  }
}
function Mn(e, t) {
  var n = e.stateNode;
  if (n === null) return null;
  var r = ul(n);
  if (r === null) return null;
  n = r[t];
  e: switch (t) {
    case 'onClick':
    case 'onClickCapture':
    case 'onDoubleClick':
    case 'onDoubleClickCapture':
    case 'onMouseDown':
    case 'onMouseDownCapture':
    case 'onMouseMove':
    case 'onMouseMoveCapture':
    case 'onMouseUp':
    case 'onMouseUpCapture':
    case 'onMouseEnter':
      (r = !r.disabled) || ((e = e.type), (r = !(e === 'button' || e === 'input' || e === 'select' || e === 'textarea'))), (e = !r);
      break e;
    default:
      e = !1;
  }
  if (e) return null;
  if (n && typeof n != 'function') throw Error(g(231, t, typeof n));
  return n;
}
var so = !1;
if (Ke)
  try {
    var dn = {};
    Object.defineProperty(dn, 'passive', {
      get: function () {
        so = !0;
      },
    }),
      window.addEventListener('test', dn, dn),
      window.removeEventListener('test', dn, dn);
  } catch {
    so = !1;
  }
function Vc(e, t, n, r, l, o, i, u, s) {
  var a = Array.prototype.slice.call(arguments, 3);
  try {
    t.apply(n, a);
  } catch (v) {
    this.onError(v);
  }
}
var Cn = !1,
  Ir = null,
  Mr = !1,
  ao = null,
  Bc = {
    onError: function (e) {
      (Cn = !0), (Ir = e);
    },
  };
function Hc(e, t, n, r, l, o, i, u, s) {
  (Cn = !1), (Ir = null), Vc.apply(Bc, arguments);
}
function Wc(e, t, n, r, l, o, i, u, s) {
  if ((Hc.apply(this, arguments), Cn)) {
    if (Cn) {
      var a = Ir;
      (Cn = !1), (Ir = null);
    } else throw Error(g(198));
    Mr || ((Mr = !0), (ao = a));
  }
}
function Rt(e) {
  var t = e,
    n = e;
  if (e.alternate) for (; t.return; ) t = t.return;
  else {
    e = t;
    do (t = e), t.flags & 4098 && (n = t.return), (e = t.return);
    while (e);
  }
  return t.tag === 3 ? n : null;
}
function Cs(e) {
  if (e.tag === 13) {
    var t = e.memoizedState;
    if ((t === null && ((e = e.alternate), e !== null && (t = e.memoizedState)), t !== null)) return t.dehydrated;
  }
  return null;
}
function Xi(e) {
  if (Rt(e) !== e) throw Error(g(188));
}
function Qc(e) {
  var t = e.alternate;
  if (!t) {
    if (((t = Rt(e)), t === null)) throw Error(g(188));
    return t !== e ? null : e;
  }
  for (var n = e, r = t; ; ) {
    var l = n.return;
    if (l === null) break;
    var o = l.alternate;
    if (o === null) {
      if (((r = l.return), r !== null)) {
        n = r;
        continue;
      }
      break;
    }
    if (l.child === o.child) {
      for (o = l.child; o; ) {
        if (o === n) return Xi(l), e;
        if (o === r) return Xi(l), t;
        o = o.sibling;
      }
      throw Error(g(188));
    }
    if (n.return !== r.return) (n = l), (r = o);
    else {
      for (var i = !1, u = l.child; u; ) {
        if (u === n) {
          (i = !0), (n = l), (r = o);
          break;
        }
        if (u === r) {
          (i = !0), (r = l), (n = o);
          break;
        }
        u = u.sibling;
      }
      if (!i) {
        for (u = o.child; u; ) {
          if (u === n) {
            (i = !0), (n = o), (r = l);
            break;
          }
          if (u === r) {
            (i = !0), (r = o), (n = l);
            break;
          }
          u = u.sibling;
        }
        if (!i) throw Error(g(189));
      }
    }
    if (n.alternate !== r) throw Error(g(190));
  }
  if (n.tag !== 3) throw Error(g(188));
  return n.stateNode.current === n ? e : t;
}
function _s(e) {
  return (e = Qc(e)), e !== null ? Ns(e) : null;
}
function Ns(e) {
  if (e.tag === 5 || e.tag === 6) return e;
  for (e = e.child; e !== null; ) {
    var t = Ns(e);
    if (t !== null) return t;
    e = e.sibling;
  }
  return null;
}
var js = we.unstable_scheduleCallback,
  Gi = we.unstable_cancelCallback,
  Kc = we.unstable_shouldYield,
  Yc = we.unstable_requestPaint,
  K = we.unstable_now,
  Xc = we.unstable_getCurrentPriorityLevel,
  qo = we.unstable_ImmediatePriority,
  Ps = we.unstable_UserBlockingPriority,
  Or = we.unstable_NormalPriority,
  Gc = we.unstable_LowPriority,
  zs = we.unstable_IdlePriority,
  rl = null,
  $e = null;
function Zc(e) {
  if ($e && typeof $e.onCommitFiberRoot == 'function')
    try {
      $e.onCommitFiberRoot(rl, e, void 0, (e.current.flags & 128) === 128);
    } catch {}
}
var Ie = Math.clz32 ? Math.clz32 : bc,
  Jc = Math.log,
  qc = Math.LN2;
function bc(e) {
  return (e >>>= 0), e === 0 ? 32 : (31 - ((Jc(e) / qc) | 0)) | 0;
}
var ur = 64,
  sr = 4194304;
function kn(e) {
  switch (e & -e) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 4:
      return 4;
    case 8:
      return 8;
    case 16:
      return 16;
    case 32:
      return 32;
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return e & 4194240;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return e & 130023424;
    case 134217728:
      return 134217728;
    case 268435456:
      return 268435456;
    case 536870912:
      return 536870912;
    case 1073741824:
      return 1073741824;
    default:
      return e;
  }
}
function Dr(e, t) {
  var n = e.pendingLanes;
  if (n === 0) return 0;
  var r = 0,
    l = e.suspendedLanes,
    o = e.pingedLanes,
    i = n & 268435455;
  if (i !== 0) {
    var u = i & ~l;
    u !== 0 ? (r = kn(u)) : ((o &= i), o !== 0 && (r = kn(o)));
  } else (i = n & ~l), i !== 0 ? (r = kn(i)) : o !== 0 && (r = kn(o));
  if (r === 0) return 0;
  if (t !== 0 && t !== r && !(t & l) && ((l = r & -r), (o = t & -t), l >= o || (l === 16 && (o & 4194240) !== 0))) return t;
  if ((r & 4 && (r |= n & 16), (t = e.entangledLanes), t !== 0))
    for (e = e.entanglements, t &= r; 0 < t; ) (n = 31 - Ie(t)), (l = 1 << n), (r |= e[n]), (t &= ~l);
  return r;
}
function ef(e, t) {
  switch (e) {
    case 1:
    case 2:
    case 4:
      return t + 250;
    case 8:
    case 16:
    case 32:
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
      return t + 5e3;
    case 4194304:
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return -1;
    case 134217728:
    case 268435456:
    case 536870912:
    case 1073741824:
      return -1;
    default:
      return -1;
  }
}
function tf(e, t) {
  for (var n = e.suspendedLanes, r = e.pingedLanes, l = e.expirationTimes, o = e.pendingLanes; 0 < o; ) {
    var i = 31 - Ie(o),
      u = 1 << i,
      s = l[i];
    s === -1 ? (!(u & n) || u & r) && (l[i] = ef(u, t)) : s <= t && (e.expiredLanes |= u), (o &= ~u);
  }
}
function co(e) {
  return (e = e.pendingLanes & -1073741825), e !== 0 ? e : e & 1073741824 ? 1073741824 : 0;
}
function Ts() {
  var e = ur;
  return (ur <<= 1), !(ur & 4194240) && (ur = 64), e;
}
function Nl(e) {
  for (var t = [], n = 0; 31 > n; n++) t.push(e);
  return t;
}
function Zn(e, t, n) {
  (e.pendingLanes |= t), t !== 536870912 && ((e.suspendedLanes = 0), (e.pingedLanes = 0)), (e = e.eventTimes), (t = 31 - Ie(t)), (e[t] = n);
}
function nf(e, t) {
  var n = e.pendingLanes & ~t;
  (e.pendingLanes = t),
    (e.suspendedLanes = 0),
    (e.pingedLanes = 0),
    (e.expiredLanes &= t),
    (e.mutableReadLanes &= t),
    (e.entangledLanes &= t),
    (t = e.entanglements);
  var r = e.eventTimes;
  for (e = e.expirationTimes; 0 < n; ) {
    var l = 31 - Ie(n),
      o = 1 << l;
    (t[l] = 0), (r[l] = -1), (e[l] = -1), (n &= ~o);
  }
}
function bo(e, t) {
  var n = (e.entangledLanes |= t);
  for (e = e.entanglements; n; ) {
    var r = 31 - Ie(n),
      l = 1 << r;
    (l & t) | (e[r] & t) && (e[r] |= t), (n &= ~l);
  }
}
var M = 0;
function Ls(e) {
  return (e &= -e), 1 < e ? (4 < e ? (e & 268435455 ? 16 : 536870912) : 4) : 1;
}
var Rs,
  ei,
  Is,
  Ms,
  Os,
  fo = !1,
  ar = [],
  lt = null,
  ot = null,
  it = null,
  On = new Map(),
  Dn = new Map(),
  et = [],
  rf =
    'mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit'.split(
      ' '
    );
function Zi(e, t) {
  switch (e) {
    case 'focusin':
    case 'focusout':
      lt = null;
      break;
    case 'dragenter':
    case 'dragleave':
      ot = null;
      break;
    case 'mouseover':
    case 'mouseout':
      it = null;
      break;
    case 'pointerover':
    case 'pointerout':
      On.delete(t.pointerId);
      break;
    case 'gotpointercapture':
    case 'lostpointercapture':
      Dn.delete(t.pointerId);
  }
}
function pn(e, t, n, r, l, o) {
  return e === null || e.nativeEvent !== o
    ? ((e = { blockedOn: t, domEventName: n, eventSystemFlags: r, nativeEvent: o, targetContainers: [l] }),
      t !== null && ((t = qn(t)), t !== null && ei(t)),
      e)
    : ((e.eventSystemFlags |= r), (t = e.targetContainers), l !== null && t.indexOf(l) === -1 && t.push(l), e);
}
function lf(e, t, n, r, l) {
  switch (t) {
    case 'focusin':
      return (lt = pn(lt, e, t, n, r, l)), !0;
    case 'dragenter':
      return (ot = pn(ot, e, t, n, r, l)), !0;
    case 'mouseover':
      return (it = pn(it, e, t, n, r, l)), !0;
    case 'pointerover':
      var o = l.pointerId;
      return On.set(o, pn(On.get(o) || null, e, t, n, r, l)), !0;
    case 'gotpointercapture':
      return (o = l.pointerId), Dn.set(o, pn(Dn.get(o) || null, e, t, n, r, l)), !0;
  }
  return !1;
}
function Ds(e) {
  var t = kt(e.target);
  if (t !== null) {
    var n = Rt(t);
    if (n !== null) {
      if (((t = n.tag), t === 13)) {
        if (((t = Cs(n)), t !== null)) {
          (e.blockedOn = t),
            Os(e.priority, function () {
              Is(n);
            });
          return;
        }
      } else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
        e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
        return;
      }
    }
  }
  e.blockedOn = null;
}
function xr(e) {
  if (e.blockedOn !== null) return !1;
  for (var t = e.targetContainers; 0 < t.length; ) {
    var n = po(e.domEventName, e.eventSystemFlags, t[0], e.nativeEvent);
    if (n === null) {
      n = e.nativeEvent;
      var r = new n.constructor(n.type, n);
      (io = r), n.target.dispatchEvent(r), (io = null);
    } else return (t = qn(n)), t !== null && ei(t), (e.blockedOn = n), !1;
    t.shift();
  }
  return !0;
}
function Ji(e, t, n) {
  xr(e) && n.delete(t);
}
function of() {
  (fo = !1),
    lt !== null && xr(lt) && (lt = null),
    ot !== null && xr(ot) && (ot = null),
    it !== null && xr(it) && (it = null),
    On.forEach(Ji),
    Dn.forEach(Ji);
}
function hn(e, t) {
  e.blockedOn === t && ((e.blockedOn = null), fo || ((fo = !0), we.unstable_scheduleCallback(we.unstable_NormalPriority, of)));
}
function Fn(e) {
  function t(l) {
    return hn(l, e);
  }
  if (0 < ar.length) {
    hn(ar[0], e);
    for (var n = 1; n < ar.length; n++) {
      var r = ar[n];
      r.blockedOn === e && (r.blockedOn = null);
    }
  }
  for (
    lt !== null && hn(lt, e), ot !== null && hn(ot, e), it !== null && hn(it, e), On.forEach(t), Dn.forEach(t), n = 0;
    n < et.length;
    n++
  )
    (r = et[n]), r.blockedOn === e && (r.blockedOn = null);
  for (; 0 < et.length && ((n = et[0]), n.blockedOn === null); ) Ds(n), n.blockedOn === null && et.shift();
}
var Gt = Ze.ReactCurrentBatchConfig,
  Fr = !0;
function uf(e, t, n, r) {
  var l = M,
    o = Gt.transition;
  Gt.transition = null;
  try {
    (M = 1), ti(e, t, n, r);
  } finally {
    (M = l), (Gt.transition = o);
  }
}
function sf(e, t, n, r) {
  var l = M,
    o = Gt.transition;
  Gt.transition = null;
  try {
    (M = 4), ti(e, t, n, r);
  } finally {
    (M = l), (Gt.transition = o);
  }
}
function ti(e, t, n, r) {
  if (Fr) {
    var l = po(e, t, n, r);
    if (l === null) Dl(e, t, r, Ur, n), Zi(e, r);
    else if (lf(l, e, t, n, r)) r.stopPropagation();
    else if ((Zi(e, r), t & 4 && -1 < rf.indexOf(e))) {
      for (; l !== null; ) {
        var o = qn(l);
        if ((o !== null && Rs(o), (o = po(e, t, n, r)), o === null && Dl(e, t, r, Ur, n), o === l)) break;
        l = o;
      }
      l !== null && r.stopPropagation();
    } else Dl(e, t, r, null, n);
  }
}
var Ur = null;
function po(e, t, n, r) {
  if (((Ur = null), (e = Jo(r)), (e = kt(e)), e !== null))
    if (((t = Rt(e)), t === null)) e = null;
    else if (((n = t.tag), n === 13)) {
      if (((e = Cs(t)), e !== null)) return e;
      e = null;
    } else if (n === 3) {
      if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
      e = null;
    } else t !== e && (e = null);
  return (Ur = e), null;
}
function Fs(e) {
  switch (e) {
    case 'cancel':
    case 'click':
    case 'close':
    case 'contextmenu':
    case 'copy':
    case 'cut':
    case 'auxclick':
    case 'dblclick':
    case 'dragend':
    case 'dragstart':
    case 'drop':
    case 'focusin':
    case 'focusout':
    case 'input':
    case 'invalid':
    case 'keydown':
    case 'keypress':
    case 'keyup':
    case 'mousedown':
    case 'mouseup':
    case 'paste':
    case 'pause':
    case 'play':
    case 'pointercancel':
    case 'pointerdown':
    case 'pointerup':
    case 'ratechange':
    case 'reset':
    case 'resize':
    case 'seeked':
    case 'submit':
    case 'touchcancel':
    case 'touchend':
    case 'touchstart':
    case 'volumechange':
    case 'change':
    case 'selectionchange':
    case 'textInput':
    case 'compositionstart':
    case 'compositionend':
    case 'compositionupdate':
    case 'beforeblur':
    case 'afterblur':
    case 'beforeinput':
    case 'blur':
    case 'fullscreenchange':
    case 'focus':
    case 'hashchange':
    case 'popstate':
    case 'select':
    case 'selectstart':
      return 1;
    case 'drag':
    case 'dragenter':
    case 'dragexit':
    case 'dragleave':
    case 'dragover':
    case 'mousemove':
    case 'mouseout':
    case 'mouseover':
    case 'pointermove':
    case 'pointerout':
    case 'pointerover':
    case 'scroll':
    case 'toggle':
    case 'touchmove':
    case 'wheel':
    case 'mouseenter':
    case 'mouseleave':
    case 'pointerenter':
    case 'pointerleave':
      return 4;
    case 'message':
      switch (Xc()) {
        case qo:
          return 1;
        case Ps:
          return 4;
        case Or:
        case Gc:
          return 16;
        case zs:
          return 536870912;
        default:
          return 16;
      }
    default:
      return 16;
  }
}
var nt = null,
  ni = null,
  Er = null;
function Us() {
  if (Er) return Er;
  var e,
    t = ni,
    n = t.length,
    r,
    l = 'value' in nt ? nt.value : nt.textContent,
    o = l.length;
  for (e = 0; e < n && t[e] === l[e]; e++);
  var i = n - e;
  for (r = 1; r <= i && t[n - r] === l[o - r]; r++);
  return (Er = l.slice(e, 1 < r ? 1 - r : void 0));
}
function Cr(e) {
  var t = e.keyCode;
  return 'charCode' in e ? ((e = e.charCode), e === 0 && t === 13 && (e = 13)) : (e = t), e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
}
function cr() {
  return !0;
}
function qi() {
  return !1;
}
function ke(e) {
  function t(n, r, l, o, i) {
    (this._reactName = n), (this._targetInst = l), (this.type = r), (this.nativeEvent = o), (this.target = i), (this.currentTarget = null);
    for (var u in e) e.hasOwnProperty(u) && ((n = e[u]), (this[u] = n ? n(o) : o[u]));
    return (
      (this.isDefaultPrevented = (o.defaultPrevented != null ? o.defaultPrevented : o.returnValue === !1) ? cr : qi),
      (this.isPropagationStopped = qi),
      this
    );
  }
  return (
    B(t.prototype, {
      preventDefault: function () {
        this.defaultPrevented = !0;
        var n = this.nativeEvent;
        n &&
          (n.preventDefault ? n.preventDefault() : typeof n.returnValue != 'unknown' && (n.returnValue = !1),
          (this.isDefaultPrevented = cr));
      },
      stopPropagation: function () {
        var n = this.nativeEvent;
        n &&
          (n.stopPropagation ? n.stopPropagation() : typeof n.cancelBubble != 'unknown' && (n.cancelBubble = !0),
          (this.isPropagationStopped = cr));
      },
      persist: function () {},
      isPersistent: cr,
    }),
    t
  );
}
var un = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp: function (e) {
      return e.timeStamp || Date.now();
    },
    defaultPrevented: 0,
    isTrusted: 0,
  },
  ri = ke(un),
  Jn = B({}, un, { view: 0, detail: 0 }),
  af = ke(Jn),
  jl,
  Pl,
  mn,
  ll = B({}, Jn, {
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    getModifierState: li,
    button: 0,
    buttons: 0,
    relatedTarget: function (e) {
      return e.relatedTarget === void 0 ? (e.fromElement === e.srcElement ? e.toElement : e.fromElement) : e.relatedTarget;
    },
    movementX: function (e) {
      return 'movementX' in e
        ? e.movementX
        : (e !== mn &&
            (mn && e.type === 'mousemove' ? ((jl = e.screenX - mn.screenX), (Pl = e.screenY - mn.screenY)) : (Pl = jl = 0), (mn = e)),
          jl);
    },
    movementY: function (e) {
      return 'movementY' in e ? e.movementY : Pl;
    },
  }),
  bi = ke(ll),
  cf = B({}, ll, { dataTransfer: 0 }),
  ff = ke(cf),
  df = B({}, Jn, { relatedTarget: 0 }),
  zl = ke(df),
  pf = B({}, un, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }),
  hf = ke(pf),
  mf = B({}, un, {
    clipboardData: function (e) {
      return 'clipboardData' in e ? e.clipboardData : window.clipboardData;
    },
  }),
  vf = ke(mf),
  yf = B({}, un, { data: 0 }),
  eu = ke(yf),
  gf = {
    Esc: 'Escape',
    Spacebar: ' ',
    Left: 'ArrowLeft',
    Up: 'ArrowUp',
    Right: 'ArrowRight',
    Down: 'ArrowDown',
    Del: 'Delete',
    Win: 'OS',
    Menu: 'ContextMenu',
    Apps: 'ContextMenu',
    Scroll: 'ScrollLock',
    MozPrintableKey: 'Unidentified',
  },
  wf = {
    8: 'Backspace',
    9: 'Tab',
    12: 'Clear',
    13: 'Enter',
    16: 'Shift',
    17: 'Control',
    18: 'Alt',
    19: 'Pause',
    20: 'CapsLock',
    27: 'Escape',
    32: ' ',
    33: 'PageUp',
    34: 'PageDown',
    35: 'End',
    36: 'Home',
    37: 'ArrowLeft',
    38: 'ArrowUp',
    39: 'ArrowRight',
    40: 'ArrowDown',
    45: 'Insert',
    46: 'Delete',
    112: 'F1',
    113: 'F2',
    114: 'F3',
    115: 'F4',
    116: 'F5',
    117: 'F6',
    118: 'F7',
    119: 'F8',
    120: 'F9',
    121: 'F10',
    122: 'F11',
    123: 'F12',
    144: 'NumLock',
    145: 'ScrollLock',
    224: 'Meta',
  },
  Sf = { Alt: 'altKey', Control: 'ctrlKey', Meta: 'metaKey', Shift: 'shiftKey' };
function kf(e) {
  var t = this.nativeEvent;
  return t.getModifierState ? t.getModifierState(e) : (e = Sf[e]) ? !!t[e] : !1;
}
function li() {
  return kf;
}
var xf = B({}, Jn, {
    key: function (e) {
      if (e.key) {
        var t = gf[e.key] || e.key;
        if (t !== 'Unidentified') return t;
      }
      return e.type === 'keypress'
        ? ((e = Cr(e)), e === 13 ? 'Enter' : String.fromCharCode(e))
        : e.type === 'keydown' || e.type === 'keyup'
        ? wf[e.keyCode] || 'Unidentified'
        : '';
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: li,
    charCode: function (e) {
      return e.type === 'keypress' ? Cr(e) : 0;
    },
    keyCode: function (e) {
      return e.type === 'keydown' || e.type === 'keyup' ? e.keyCode : 0;
    },
    which: function (e) {
      return e.type === 'keypress' ? Cr(e) : e.type === 'keydown' || e.type === 'keyup' ? e.keyCode : 0;
    },
  }),
  Ef = ke(xf),
  Cf = B({}, ll, {
    pointerId: 0,
    width: 0,
    height: 0,
    pressure: 0,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    pointerType: 0,
    isPrimary: 0,
  }),
  tu = ke(Cf),
  _f = B({}, Jn, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: li }),
  Nf = ke(_f),
  jf = B({}, un, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }),
  Pf = ke(jf),
  zf = B({}, ll, {
    deltaX: function (e) {
      return 'deltaX' in e ? e.deltaX : 'wheelDeltaX' in e ? -e.wheelDeltaX : 0;
    },
    deltaY: function (e) {
      return 'deltaY' in e ? e.deltaY : 'wheelDeltaY' in e ? -e.wheelDeltaY : 'wheelDelta' in e ? -e.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0,
  }),
  Tf = ke(zf),
  Lf = [9, 13, 27, 32],
  oi = Ke && 'CompositionEvent' in window,
  _n = null;
Ke && 'documentMode' in document && (_n = document.documentMode);
var Rf = Ke && 'TextEvent' in window && !_n,
  $s = Ke && (!oi || (_n && 8 < _n && 11 >= _n)),
  nu = String.fromCharCode(32),
  ru = !1;
function As(e, t) {
  switch (e) {
    case 'keyup':
      return Lf.indexOf(t.keyCode) !== -1;
    case 'keydown':
      return t.keyCode !== 229;
    case 'keypress':
    case 'mousedown':
    case 'focusout':
      return !0;
    default:
      return !1;
  }
}
function Vs(e) {
  return (e = e.detail), typeof e == 'object' && 'data' in e ? e.data : null;
}
var Dt = !1;
function If(e, t) {
  switch (e) {
    case 'compositionend':
      return Vs(t);
    case 'keypress':
      return t.which !== 32 ? null : ((ru = !0), nu);
    case 'textInput':
      return (e = t.data), e === nu && ru ? null : e;
    default:
      return null;
  }
}
function Mf(e, t) {
  if (Dt) return e === 'compositionend' || (!oi && As(e, t)) ? ((e = Us()), (Er = ni = nt = null), (Dt = !1), e) : null;
  switch (e) {
    case 'paste':
      return null;
    case 'keypress':
      if (!(t.ctrlKey || t.altKey || t.metaKey) || (t.ctrlKey && t.altKey)) {
        if (t.char && 1 < t.char.length) return t.char;
        if (t.which) return String.fromCharCode(t.which);
      }
      return null;
    case 'compositionend':
      return $s && t.locale !== 'ko' ? null : t.data;
    default:
      return null;
  }
}
var Of = {
  color: !0,
  date: !0,
  datetime: !0,
  'datetime-local': !0,
  email: !0,
  month: !0,
  number: !0,
  password: !0,
  range: !0,
  search: !0,
  tel: !0,
  text: !0,
  time: !0,
  url: !0,
  week: !0,
};
function lu(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return t === 'input' ? !!Of[e.type] : t === 'textarea';
}
function Bs(e, t, n, r) {
  ws(r), (t = $r(t, 'onChange')), 0 < t.length && ((n = new ri('onChange', 'change', null, n, r)), e.push({ event: n, listeners: t }));
}
var Nn = null,
  Un = null;
function Df(e) {
  bs(e, 0);
}
function ol(e) {
  var t = $t(e);
  if (ds(t)) return e;
}
function Ff(e, t) {
  if (e === 'change') return t;
}
var Hs = !1;
if (Ke) {
  var Tl;
  if (Ke) {
    var Ll = 'oninput' in document;
    if (!Ll) {
      var ou = document.createElement('div');
      ou.setAttribute('oninput', 'return;'), (Ll = typeof ou.oninput == 'function');
    }
    Tl = Ll;
  } else Tl = !1;
  Hs = Tl && (!document.documentMode || 9 < document.documentMode);
}
function iu() {
  Nn && (Nn.detachEvent('onpropertychange', Ws), (Un = Nn = null));
}
function Ws(e) {
  if (e.propertyName === 'value' && ol(Un)) {
    var t = [];
    Bs(t, Un, e, Jo(e)), Es(Df, t);
  }
}
function Uf(e, t, n) {
  e === 'focusin' ? (iu(), (Nn = t), (Un = n), Nn.attachEvent('onpropertychange', Ws)) : e === 'focusout' && iu();
}
function $f(e) {
  if (e === 'selectionchange' || e === 'keyup' || e === 'keydown') return ol(Un);
}
function Af(e, t) {
  if (e === 'click') return ol(t);
}
function Vf(e, t) {
  if (e === 'input' || e === 'change') return ol(t);
}
function Bf(e, t) {
  return (e === t && (e !== 0 || 1 / e === 1 / t)) || (e !== e && t !== t);
}
var Oe = typeof Object.is == 'function' ? Object.is : Bf;
function $n(e, t) {
  if (Oe(e, t)) return !0;
  if (typeof e != 'object' || e === null || typeof t != 'object' || t === null) return !1;
  var n = Object.keys(e),
    r = Object.keys(t);
  if (n.length !== r.length) return !1;
  for (r = 0; r < n.length; r++) {
    var l = n[r];
    if (!Xl.call(t, l) || !Oe(e[l], t[l])) return !1;
  }
  return !0;
}
function uu(e) {
  for (; e && e.firstChild; ) e = e.firstChild;
  return e;
}
function su(e, t) {
  var n = uu(e);
  e = 0;
  for (var r; n; ) {
    if (n.nodeType === 3) {
      if (((r = e + n.textContent.length), e <= t && r >= t)) return { node: n, offset: t - e };
      e = r;
    }
    e: {
      for (; n; ) {
        if (n.nextSibling) {
          n = n.nextSibling;
          break e;
        }
        n = n.parentNode;
      }
      n = void 0;
    }
    n = uu(n);
  }
}
function Qs(e, t) {
  return e && t
    ? e === t
      ? !0
      : e && e.nodeType === 3
      ? !1
      : t && t.nodeType === 3
      ? Qs(e, t.parentNode)
      : 'contains' in e
      ? e.contains(t)
      : e.compareDocumentPosition
      ? !!(e.compareDocumentPosition(t) & 16)
      : !1
    : !1;
}
function Ks() {
  for (var e = window, t = Rr(); t instanceof e.HTMLIFrameElement; ) {
    try {
      var n = typeof t.contentWindow.location.href == 'string';
    } catch {
      n = !1;
    }
    if (n) e = t.contentWindow;
    else break;
    t = Rr(e.document);
  }
  return t;
}
function ii(e) {
  var t = e && e.nodeName && e.nodeName.toLowerCase();
  return (
    t &&
    ((t === 'input' && (e.type === 'text' || e.type === 'search' || e.type === 'tel' || e.type === 'url' || e.type === 'password')) ||
      t === 'textarea' ||
      e.contentEditable === 'true')
  );
}
function Hf(e) {
  var t = Ks(),
    n = e.focusedElem,
    r = e.selectionRange;
  if (t !== n && n && n.ownerDocument && Qs(n.ownerDocument.documentElement, n)) {
    if (r !== null && ii(n)) {
      if (((t = r.start), (e = r.end), e === void 0 && (e = t), 'selectionStart' in n))
        (n.selectionStart = t), (n.selectionEnd = Math.min(e, n.value.length));
      else if (((e = ((t = n.ownerDocument || document) && t.defaultView) || window), e.getSelection)) {
        e = e.getSelection();
        var l = n.textContent.length,
          o = Math.min(r.start, l);
        (r = r.end === void 0 ? o : Math.min(r.end, l)), !e.extend && o > r && ((l = r), (r = o), (o = l)), (l = su(n, o));
        var i = su(n, r);
        l &&
          i &&
          (e.rangeCount !== 1 ||
            e.anchorNode !== l.node ||
            e.anchorOffset !== l.offset ||
            e.focusNode !== i.node ||
            e.focusOffset !== i.offset) &&
          ((t = t.createRange()),
          t.setStart(l.node, l.offset),
          e.removeAllRanges(),
          o > r ? (e.addRange(t), e.extend(i.node, i.offset)) : (t.setEnd(i.node, i.offset), e.addRange(t)));
      }
    }
    for (t = [], e = n; (e = e.parentNode); ) e.nodeType === 1 && t.push({ element: e, left: e.scrollLeft, top: e.scrollTop });
    for (typeof n.focus == 'function' && n.focus(), n = 0; n < t.length; n++)
      (e = t[n]), (e.element.scrollLeft = e.left), (e.element.scrollTop = e.top);
  }
}
var Wf = Ke && 'documentMode' in document && 11 >= document.documentMode,
  Ft = null,
  ho = null,
  jn = null,
  mo = !1;
function au(e, t, n) {
  var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
  mo ||
    Ft == null ||
    Ft !== Rr(r) ||
    ((r = Ft),
    'selectionStart' in r && ii(r)
      ? (r = { start: r.selectionStart, end: r.selectionEnd })
      : ((r = ((r.ownerDocument && r.ownerDocument.defaultView) || window).getSelection()),
        (r = { anchorNode: r.anchorNode, anchorOffset: r.anchorOffset, focusNode: r.focusNode, focusOffset: r.focusOffset })),
    (jn && $n(jn, r)) ||
      ((jn = r),
      (r = $r(ho, 'onSelect')),
      0 < r.length && ((t = new ri('onSelect', 'select', null, t, n)), e.push({ event: t, listeners: r }), (t.target = Ft))));
}
function fr(e, t) {
  var n = {};
  return (n[e.toLowerCase()] = t.toLowerCase()), (n['Webkit' + e] = 'webkit' + t), (n['Moz' + e] = 'moz' + t), n;
}
var Ut = {
    animationend: fr('Animation', 'AnimationEnd'),
    animationiteration: fr('Animation', 'AnimationIteration'),
    animationstart: fr('Animation', 'AnimationStart'),
    transitionend: fr('Transition', 'TransitionEnd'),
  },
  Rl = {},
  Ys = {};
Ke &&
  ((Ys = document.createElement('div').style),
  'AnimationEvent' in window ||
    (delete Ut.animationend.animation, delete Ut.animationiteration.animation, delete Ut.animationstart.animation),
  'TransitionEvent' in window || delete Ut.transitionend.transition);
function il(e) {
  if (Rl[e]) return Rl[e];
  if (!Ut[e]) return e;
  var t = Ut[e],
    n;
  for (n in t) if (t.hasOwnProperty(n) && n in Ys) return (Rl[e] = t[n]);
  return e;
}
var Xs = il('animationend'),
  Gs = il('animationiteration'),
  Zs = il('animationstart'),
  Js = il('transitionend'),
  qs = new Map(),
  cu =
    'abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel'.split(
      ' '
    );
function ht(e, t) {
  qs.set(e, t), Lt(t, [e]);
}
for (var Il = 0; Il < cu.length; Il++) {
  var Ml = cu[Il],
    Qf = Ml.toLowerCase(),
    Kf = Ml[0].toUpperCase() + Ml.slice(1);
  ht(Qf, 'on' + Kf);
}
ht(Xs, 'onAnimationEnd');
ht(Gs, 'onAnimationIteration');
ht(Zs, 'onAnimationStart');
ht('dblclick', 'onDoubleClick');
ht('focusin', 'onFocus');
ht('focusout', 'onBlur');
ht(Js, 'onTransitionEnd');
qt('onMouseEnter', ['mouseout', 'mouseover']);
qt('onMouseLeave', ['mouseout', 'mouseover']);
qt('onPointerEnter', ['pointerout', 'pointerover']);
qt('onPointerLeave', ['pointerout', 'pointerover']);
Lt('onChange', 'change click focusin focusout input keydown keyup selectionchange'.split(' '));
Lt('onSelect', 'focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange'.split(' '));
Lt('onBeforeInput', ['compositionend', 'keypress', 'textInput', 'paste']);
Lt('onCompositionEnd', 'compositionend focusout keydown keypress keyup mousedown'.split(' '));
Lt('onCompositionStart', 'compositionstart focusout keydown keypress keyup mousedown'.split(' '));
Lt('onCompositionUpdate', 'compositionupdate focusout keydown keypress keyup mousedown'.split(' '));
var xn =
    'abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting'.split(
      ' '
    ),
  Yf = new Set('cancel close invalid load scroll toggle'.split(' ').concat(xn));
function fu(e, t, n) {
  var r = e.type || 'unknown-event';
  (e.currentTarget = n), Wc(r, t, void 0, e), (e.currentTarget = null);
}
function bs(e, t) {
  t = (t & 4) !== 0;
  for (var n = 0; n < e.length; n++) {
    var r = e[n],
      l = r.event;
    r = r.listeners;
    e: {
      var o = void 0;
      if (t)
        for (var i = r.length - 1; 0 <= i; i--) {
          var u = r[i],
            s = u.instance,
            a = u.currentTarget;
          if (((u = u.listener), s !== o && l.isPropagationStopped())) break e;
          fu(l, u, a), (o = s);
        }
      else
        for (i = 0; i < r.length; i++) {
          if (((u = r[i]), (s = u.instance), (a = u.currentTarget), (u = u.listener), s !== o && l.isPropagationStopped())) break e;
          fu(l, u, a), (o = s);
        }
    }
  }
  if (Mr) throw ((e = ao), (Mr = !1), (ao = null), e);
}
function D(e, t) {
  var n = t[So];
  n === void 0 && (n = t[So] = new Set());
  var r = e + '__bubble';
  n.has(r) || (ea(t, e, 2, !1), n.add(r));
}
function Ol(e, t, n) {
  var r = 0;
  t && (r |= 4), ea(n, e, r, t);
}
var dr = '_reactListening' + Math.random().toString(36).slice(2);
function An(e) {
  if (!e[dr]) {
    (e[dr] = !0),
      us.forEach(function (n) {
        n !== 'selectionchange' && (Yf.has(n) || Ol(n, !1, e), Ol(n, !0, e));
      });
    var t = e.nodeType === 9 ? e : e.ownerDocument;
    t === null || t[dr] || ((t[dr] = !0), Ol('selectionchange', !1, t));
  }
}
function ea(e, t, n, r) {
  switch (Fs(t)) {
    case 1:
      var l = uf;
      break;
    case 4:
      l = sf;
      break;
    default:
      l = ti;
  }
  (n = l.bind(null, t, n, e)),
    (l = void 0),
    !so || (t !== 'touchstart' && t !== 'touchmove' && t !== 'wheel') || (l = !0),
    r
      ? l !== void 0
        ? e.addEventListener(t, n, { capture: !0, passive: l })
        : e.addEventListener(t, n, !0)
      : l !== void 0
      ? e.addEventListener(t, n, { passive: l })
      : e.addEventListener(t, n, !1);
}
function Dl(e, t, n, r, l) {
  var o = r;
  if (!(t & 1) && !(t & 2) && r !== null)
    e: for (;;) {
      if (r === null) return;
      var i = r.tag;
      if (i === 3 || i === 4) {
        var u = r.stateNode.containerInfo;
        if (u === l || (u.nodeType === 8 && u.parentNode === l)) break;
        if (i === 4)
          for (i = r.return; i !== null; ) {
            var s = i.tag;
            if ((s === 3 || s === 4) && ((s = i.stateNode.containerInfo), s === l || (s.nodeType === 8 && s.parentNode === l))) return;
            i = i.return;
          }
        for (; u !== null; ) {
          if (((i = kt(u)), i === null)) return;
          if (((s = i.tag), s === 5 || s === 6)) {
            r = o = i;
            continue e;
          }
          u = u.parentNode;
        }
      }
      r = r.return;
    }
  Es(function () {
    var a = o,
      v = Jo(n),
      h = [];
    e: {
      var m = qs.get(e);
      if (m !== void 0) {
        var S = ri,
          w = e;
        switch (e) {
          case 'keypress':
            if (Cr(n) === 0) break e;
          case 'keydown':
          case 'keyup':
            S = Ef;
            break;
          case 'focusin':
            (w = 'focus'), (S = zl);
            break;
          case 'focusout':
            (w = 'blur'), (S = zl);
            break;
          case 'beforeblur':
          case 'afterblur':
            S = zl;
            break;
          case 'click':
            if (n.button === 2) break e;
          case 'auxclick':
          case 'dblclick':
          case 'mousedown':
          case 'mousemove':
          case 'mouseup':
          case 'mouseout':
          case 'mouseover':
          case 'contextmenu':
            S = bi;
            break;
          case 'drag':
          case 'dragend':
          case 'dragenter':
          case 'dragexit':
          case 'dragleave':
          case 'dragover':
          case 'dragstart':
          case 'drop':
            S = ff;
            break;
          case 'touchcancel':
          case 'touchend':
          case 'touchmove':
          case 'touchstart':
            S = Nf;
            break;
          case Xs:
          case Gs:
          case Zs:
            S = hf;
            break;
          case Js:
            S = Pf;
            break;
          case 'scroll':
            S = af;
            break;
          case 'wheel':
            S = Tf;
            break;
          case 'copy':
          case 'cut':
          case 'paste':
            S = vf;
            break;
          case 'gotpointercapture':
          case 'lostpointercapture':
          case 'pointercancel':
          case 'pointerdown':
          case 'pointermove':
          case 'pointerout':
          case 'pointerover':
          case 'pointerup':
            S = tu;
        }
        var k = (t & 4) !== 0,
          U = !k && e === 'scroll',
          f = k ? (m !== null ? m + 'Capture' : null) : m;
        k = [];
        for (var c = a, d; c !== null; ) {
          d = c;
          var y = d.stateNode;
          if ((d.tag === 5 && y !== null && ((d = y), f !== null && ((y = Mn(c, f)), y != null && k.push(Vn(c, y, d)))), U)) break;
          c = c.return;
        }
        0 < k.length && ((m = new S(m, w, null, n, v)), h.push({ event: m, listeners: k }));
      }
    }
    if (!(t & 7)) {
      e: {
        if (
          ((m = e === 'mouseover' || e === 'pointerover'),
          (S = e === 'mouseout' || e === 'pointerout'),
          m && n !== io && (w = n.relatedTarget || n.fromElement) && (kt(w) || w[Ye]))
        )
          break e;
        if (
          (S || m) &&
          ((m = v.window === v ? v : (m = v.ownerDocument) ? m.defaultView || m.parentWindow : window),
          S
            ? ((w = n.relatedTarget || n.toElement),
              (S = a),
              (w = w ? kt(w) : null),
              w !== null && ((U = Rt(w)), w !== U || (w.tag !== 5 && w.tag !== 6)) && (w = null))
            : ((S = null), (w = a)),
          S !== w)
        ) {
          if (
            ((k = bi),
            (y = 'onMouseLeave'),
            (f = 'onMouseEnter'),
            (c = 'mouse'),
            (e === 'pointerout' || e === 'pointerover') && ((k = tu), (y = 'onPointerLeave'), (f = 'onPointerEnter'), (c = 'pointer')),
            (U = S == null ? m : $t(S)),
            (d = w == null ? m : $t(w)),
            (m = new k(y, c + 'leave', S, n, v)),
            (m.target = U),
            (m.relatedTarget = d),
            (y = null),
            kt(v) === a && ((k = new k(f, c + 'enter', w, n, v)), (k.target = d), (k.relatedTarget = U), (y = k)),
            (U = y),
            S && w)
          )
            t: {
              for (k = S, f = w, c = 0, d = k; d; d = It(d)) c++;
              for (d = 0, y = f; y; y = It(y)) d++;
              for (; 0 < c - d; ) (k = It(k)), c--;
              for (; 0 < d - c; ) (f = It(f)), d--;
              for (; c--; ) {
                if (k === f || (f !== null && k === f.alternate)) break t;
                (k = It(k)), (f = It(f));
              }
              k = null;
            }
          else k = null;
          S !== null && du(h, m, S, k, !1), w !== null && U !== null && du(h, U, w, k, !0);
        }
      }
      e: {
        if (
          ((m = a ? $t(a) : window), (S = m.nodeName && m.nodeName.toLowerCase()), S === 'select' || (S === 'input' && m.type === 'file'))
        )
          var E = Ff;
        else if (lu(m))
          if (Hs) E = Vf;
          else {
            E = $f;
            var _ = Uf;
          }
        else (S = m.nodeName) && S.toLowerCase() === 'input' && (m.type === 'checkbox' || m.type === 'radio') && (E = Af);
        if (E && (E = E(e, a))) {
          Bs(h, E, n, v);
          break e;
        }
        _ && _(e, m, a), e === 'focusout' && (_ = m._wrapperState) && _.controlled && m.type === 'number' && to(m, 'number', m.value);
      }
      switch (((_ = a ? $t(a) : window), e)) {
        case 'focusin':
          (lu(_) || _.contentEditable === 'true') && ((Ft = _), (ho = a), (jn = null));
          break;
        case 'focusout':
          jn = ho = Ft = null;
          break;
        case 'mousedown':
          mo = !0;
          break;
        case 'contextmenu':
        case 'mouseup':
        case 'dragend':
          (mo = !1), au(h, n, v);
          break;
        case 'selectionchange':
          if (Wf) break;
        case 'keydown':
        case 'keyup':
          au(h, n, v);
      }
      var N;
      if (oi)
        e: {
          switch (e) {
            case 'compositionstart':
              var j = 'onCompositionStart';
              break e;
            case 'compositionend':
              j = 'onCompositionEnd';
              break e;
            case 'compositionupdate':
              j = 'onCompositionUpdate';
              break e;
          }
          j = void 0;
        }
      else Dt ? As(e, n) && (j = 'onCompositionEnd') : e === 'keydown' && n.keyCode === 229 && (j = 'onCompositionStart');
      j &&
        ($s &&
          n.locale !== 'ko' &&
          (Dt || j !== 'onCompositionStart'
            ? j === 'onCompositionEnd' && Dt && (N = Us())
            : ((nt = v), (ni = 'value' in nt ? nt.value : nt.textContent), (Dt = !0))),
        (_ = $r(a, j)),
        0 < _.length &&
          ((j = new eu(j, e, null, n, v)),
          h.push({ event: j, listeners: _ }),
          N ? (j.data = N) : ((N = Vs(n)), N !== null && (j.data = N)))),
        (N = Rf ? If(e, n) : Mf(e, n)) &&
          ((a = $r(a, 'onBeforeInput')),
          0 < a.length && ((v = new eu('onBeforeInput', 'beforeinput', null, n, v)), h.push({ event: v, listeners: a }), (v.data = N)));
    }
    bs(h, t);
  });
}
function Vn(e, t, n) {
  return { instance: e, listener: t, currentTarget: n };
}
function $r(e, t) {
  for (var n = t + 'Capture', r = []; e !== null; ) {
    var l = e,
      o = l.stateNode;
    l.tag === 5 &&
      o !== null &&
      ((l = o), (o = Mn(e, n)), o != null && r.unshift(Vn(e, o, l)), (o = Mn(e, t)), o != null && r.push(Vn(e, o, l))),
      (e = e.return);
  }
  return r;
}
function It(e) {
  if (e === null) return null;
  do e = e.return;
  while (e && e.tag !== 5);
  return e || null;
}
function du(e, t, n, r, l) {
  for (var o = t._reactName, i = []; n !== null && n !== r; ) {
    var u = n,
      s = u.alternate,
      a = u.stateNode;
    if (s !== null && s === r) break;
    u.tag === 5 &&
      a !== null &&
      ((u = a), l ? ((s = Mn(n, o)), s != null && i.unshift(Vn(n, s, u))) : l || ((s = Mn(n, o)), s != null && i.push(Vn(n, s, u)))),
      (n = n.return);
  }
  i.length !== 0 && e.push({ event: t, listeners: i });
}
var Xf = /\r\n?/g,
  Gf = /\u0000|\uFFFD/g;
function pu(e) {
  return (typeof e == 'string' ? e : '' + e)
    .replace(
      Xf,
      `
`
    )
    .replace(Gf, '');
}
function pr(e, t, n) {
  if (((t = pu(t)), pu(e) !== t && n)) throw Error(g(425));
}
function Ar() {}
var vo = null,
  yo = null;
function go(e, t) {
  return (
    e === 'textarea' ||
    e === 'noscript' ||
    typeof t.children == 'string' ||
    typeof t.children == 'number' ||
    (typeof t.dangerouslySetInnerHTML == 'object' && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null)
  );
}
var wo = typeof setTimeout == 'function' ? setTimeout : void 0,
  Zf = typeof clearTimeout == 'function' ? clearTimeout : void 0,
  hu = typeof Promise == 'function' ? Promise : void 0,
  Jf =
    typeof queueMicrotask == 'function'
      ? queueMicrotask
      : typeof hu < 'u'
      ? function (e) {
          return hu.resolve(null).then(e).catch(qf);
        }
      : wo;
function qf(e) {
  setTimeout(function () {
    throw e;
  });
}
function Fl(e, t) {
  var n = t,
    r = 0;
  do {
    var l = n.nextSibling;
    if ((e.removeChild(n), l && l.nodeType === 8))
      if (((n = l.data), n === '/$')) {
        if (r === 0) {
          e.removeChild(l), Fn(t);
          return;
        }
        r--;
      } else (n !== '$' && n !== '$?' && n !== '$!') || r++;
    n = l;
  } while (n);
  Fn(t);
}
function ut(e) {
  for (; e != null; e = e.nextSibling) {
    var t = e.nodeType;
    if (t === 1 || t === 3) break;
    if (t === 8) {
      if (((t = e.data), t === '$' || t === '$!' || t === '$?')) break;
      if (t === '/$') return null;
    }
  }
  return e;
}
function mu(e) {
  e = e.previousSibling;
  for (var t = 0; e; ) {
    if (e.nodeType === 8) {
      var n = e.data;
      if (n === '$' || n === '$!' || n === '$?') {
        if (t === 0) return e;
        t--;
      } else n === '/$' && t++;
    }
    e = e.previousSibling;
  }
  return null;
}
var sn = Math.random().toString(36).slice(2),
  Ue = '__reactFiber$' + sn,
  Bn = '__reactProps$' + sn,
  Ye = '__reactContainer$' + sn,
  So = '__reactEvents$' + sn,
  bf = '__reactListeners$' + sn,
  ed = '__reactHandles$' + sn;
function kt(e) {
  var t = e[Ue];
  if (t) return t;
  for (var n = e.parentNode; n; ) {
    if ((t = n[Ye] || n[Ue])) {
      if (((n = t.alternate), t.child !== null || (n !== null && n.child !== null)))
        for (e = mu(e); e !== null; ) {
          if ((n = e[Ue])) return n;
          e = mu(e);
        }
      return t;
    }
    (e = n), (n = e.parentNode);
  }
  return null;
}
function qn(e) {
  return (e = e[Ue] || e[Ye]), !e || (e.tag !== 5 && e.tag !== 6 && e.tag !== 13 && e.tag !== 3) ? null : e;
}
function $t(e) {
  if (e.tag === 5 || e.tag === 6) return e.stateNode;
  throw Error(g(33));
}
function ul(e) {
  return e[Bn] || null;
}
var ko = [],
  At = -1;
function mt(e) {
  return { current: e };
}
function F(e) {
  0 > At || ((e.current = ko[At]), (ko[At] = null), At--);
}
function O(e, t) {
  At++, (ko[At] = e.current), (e.current = t);
}
var pt = {},
  oe = mt(pt),
  pe = mt(!1),
  Nt = pt;
function bt(e, t) {
  var n = e.type.contextTypes;
  if (!n) return pt;
  var r = e.stateNode;
  if (r && r.__reactInternalMemoizedUnmaskedChildContext === t) return r.__reactInternalMemoizedMaskedChildContext;
  var l = {},
    o;
  for (o in n) l[o] = t[o];
  return (
    r && ((e = e.stateNode), (e.__reactInternalMemoizedUnmaskedChildContext = t), (e.__reactInternalMemoizedMaskedChildContext = l)), l
  );
}
function he(e) {
  return (e = e.childContextTypes), e != null;
}
function Vr() {
  F(pe), F(oe);
}
function vu(e, t, n) {
  if (oe.current !== pt) throw Error(g(168));
  O(oe, t), O(pe, n);
}
function ta(e, t, n) {
  var r = e.stateNode;
  if (((t = t.childContextTypes), typeof r.getChildContext != 'function')) return n;
  r = r.getChildContext();
  for (var l in r) if (!(l in t)) throw Error(g(108, Fc(e) || 'Unknown', l));
  return B({}, n, r);
}
function Br(e) {
  return (e = ((e = e.stateNode) && e.__reactInternalMemoizedMergedChildContext) || pt), (Nt = oe.current), O(oe, e), O(pe, pe.current), !0;
}
function yu(e, t, n) {
  var r = e.stateNode;
  if (!r) throw Error(g(169));
  n ? ((e = ta(e, t, Nt)), (r.__reactInternalMemoizedMergedChildContext = e), F(pe), F(oe), O(oe, e)) : F(pe), O(pe, n);
}
var Be = null,
  sl = !1,
  Ul = !1;
function na(e) {
  Be === null ? (Be = [e]) : Be.push(e);
}
function td(e) {
  (sl = !0), na(e);
}
function vt() {
  if (!Ul && Be !== null) {
    Ul = !0;
    var e = 0,
      t = M;
    try {
      var n = Be;
      for (M = 1; e < n.length; e++) {
        var r = n[e];
        do r = r(!0);
        while (r !== null);
      }
      (Be = null), (sl = !1);
    } catch (l) {
      throw (Be !== null && (Be = Be.slice(e + 1)), js(qo, vt), l);
    } finally {
      (M = t), (Ul = !1);
    }
  }
  return null;
}
var Vt = [],
  Bt = 0,
  Hr = null,
  Wr = 0,
  xe = [],
  Ee = 0,
  jt = null,
  He = 1,
  We = '';
function wt(e, t) {
  (Vt[Bt++] = Wr), (Vt[Bt++] = Hr), (Hr = e), (Wr = t);
}
function ra(e, t, n) {
  (xe[Ee++] = He), (xe[Ee++] = We), (xe[Ee++] = jt), (jt = e);
  var r = He;
  e = We;
  var l = 32 - Ie(r) - 1;
  (r &= ~(1 << l)), (n += 1);
  var o = 32 - Ie(t) + l;
  if (30 < o) {
    var i = l - (l % 5);
    (o = (r & ((1 << i) - 1)).toString(32)), (r >>= i), (l -= i), (He = (1 << (32 - Ie(t) + l)) | (n << l) | r), (We = o + e);
  } else (He = (1 << o) | (n << l) | r), (We = e);
}
function ui(e) {
  e.return !== null && (wt(e, 1), ra(e, 1, 0));
}
function si(e) {
  for (; e === Hr; ) (Hr = Vt[--Bt]), (Vt[Bt] = null), (Wr = Vt[--Bt]), (Vt[Bt] = null);
  for (; e === jt; ) (jt = xe[--Ee]), (xe[Ee] = null), (We = xe[--Ee]), (xe[Ee] = null), (He = xe[--Ee]), (xe[Ee] = null);
}
var ge = null,
  ye = null,
  $ = !1,
  Re = null;
function la(e, t) {
  var n = Ce(5, null, null, 0);
  (n.elementType = 'DELETED'),
    (n.stateNode = t),
    (n.return = e),
    (t = e.deletions),
    t === null ? ((e.deletions = [n]), (e.flags |= 16)) : t.push(n);
}
function gu(e, t) {
  switch (e.tag) {
    case 5:
      var n = e.type;
      return (
        (t = t.nodeType !== 1 || n.toLowerCase() !== t.nodeName.toLowerCase() ? null : t),
        t !== null ? ((e.stateNode = t), (ge = e), (ye = ut(t.firstChild)), !0) : !1
      );
    case 6:
      return (t = e.pendingProps === '' || t.nodeType !== 3 ? null : t), t !== null ? ((e.stateNode = t), (ge = e), (ye = null), !0) : !1;
    case 13:
      return (
        (t = t.nodeType !== 8 ? null : t),
        t !== null
          ? ((n = jt !== null ? { id: He, overflow: We } : null),
            (e.memoizedState = { dehydrated: t, treeContext: n, retryLane: 1073741824 }),
            (n = Ce(18, null, null, 0)),
            (n.stateNode = t),
            (n.return = e),
            (e.child = n),
            (ge = e),
            (ye = null),
            !0)
          : !1
      );
    default:
      return !1;
  }
}
function xo(e) {
  return (e.mode & 1) !== 0 && (e.flags & 128) === 0;
}
function Eo(e) {
  if ($) {
    var t = ye;
    if (t) {
      var n = t;
      if (!gu(e, t)) {
        if (xo(e)) throw Error(g(418));
        t = ut(n.nextSibling);
        var r = ge;
        t && gu(e, t) ? la(r, n) : ((e.flags = (e.flags & -4097) | 2), ($ = !1), (ge = e));
      }
    } else {
      if (xo(e)) throw Error(g(418));
      (e.flags = (e.flags & -4097) | 2), ($ = !1), (ge = e);
    }
  }
}
function wu(e) {
  for (e = e.return; e !== null && e.tag !== 5 && e.tag !== 3 && e.tag !== 13; ) e = e.return;
  ge = e;
}
function hr(e) {
  if (e !== ge) return !1;
  if (!$) return wu(e), ($ = !0), !1;
  var t;
  if (
    ((t = e.tag !== 3) && !(t = e.tag !== 5) && ((t = e.type), (t = t !== 'head' && t !== 'body' && !go(e.type, e.memoizedProps))),
    t && (t = ye))
  ) {
    if (xo(e)) throw (oa(), Error(g(418)));
    for (; t; ) la(e, t), (t = ut(t.nextSibling));
  }
  if ((wu(e), e.tag === 13)) {
    if (((e = e.memoizedState), (e = e !== null ? e.dehydrated : null), !e)) throw Error(g(317));
    e: {
      for (e = e.nextSibling, t = 0; e; ) {
        if (e.nodeType === 8) {
          var n = e.data;
          if (n === '/$') {
            if (t === 0) {
              ye = ut(e.nextSibling);
              break e;
            }
            t--;
          } else (n !== '$' && n !== '$!' && n !== '$?') || t++;
        }
        e = e.nextSibling;
      }
      ye = null;
    }
  } else ye = ge ? ut(e.stateNode.nextSibling) : null;
  return !0;
}
function oa() {
  for (var e = ye; e; ) e = ut(e.nextSibling);
}
function en() {
  (ye = ge = null), ($ = !1);
}
function ai(e) {
  Re === null ? (Re = [e]) : Re.push(e);
}
var nd = Ze.ReactCurrentBatchConfig;
function Te(e, t) {
  if (e && e.defaultProps) {
    (t = B({}, t)), (e = e.defaultProps);
    for (var n in e) t[n] === void 0 && (t[n] = e[n]);
    return t;
  }
  return t;
}
var Qr = mt(null),
  Kr = null,
  Ht = null,
  ci = null;
function fi() {
  ci = Ht = Kr = null;
}
function di(e) {
  var t = Qr.current;
  F(Qr), (e._currentValue = t);
}
function Co(e, t, n) {
  for (; e !== null; ) {
    var r = e.alternate;
    if (
      ((e.childLanes & t) !== t
        ? ((e.childLanes |= t), r !== null && (r.childLanes |= t))
        : r !== null && (r.childLanes & t) !== t && (r.childLanes |= t),
      e === n)
    )
      break;
    e = e.return;
  }
}
function Zt(e, t) {
  (Kr = e),
    (ci = Ht = null),
    (e = e.dependencies),
    e !== null && e.firstContext !== null && (e.lanes & t && (de = !0), (e.firstContext = null));
}
function Ne(e) {
  var t = e._currentValue;
  if (ci !== e)
    if (((e = { context: e, memoizedValue: t, next: null }), Ht === null)) {
      if (Kr === null) throw Error(g(308));
      (Ht = e), (Kr.dependencies = { lanes: 0, firstContext: e });
    } else Ht = Ht.next = e;
  return t;
}
var xt = null;
function pi(e) {
  xt === null ? (xt = [e]) : xt.push(e);
}
function ia(e, t, n, r) {
  var l = t.interleaved;
  return l === null ? ((n.next = n), pi(t)) : ((n.next = l.next), (l.next = n)), (t.interleaved = n), Xe(e, r);
}
function Xe(e, t) {
  e.lanes |= t;
  var n = e.alternate;
  for (n !== null && (n.lanes |= t), n = e, e = e.return; e !== null; )
    (e.childLanes |= t), (n = e.alternate), n !== null && (n.childLanes |= t), (n = e), (e = e.return);
  return n.tag === 3 ? n.stateNode : null;
}
var be = !1;
function hi(e) {
  e.updateQueue = {
    baseState: e.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: { pending: null, interleaved: null, lanes: 0 },
    effects: null,
  };
}
function ua(e, t) {
  (e = e.updateQueue),
    t.updateQueue === e &&
      (t.updateQueue = {
        baseState: e.baseState,
        firstBaseUpdate: e.firstBaseUpdate,
        lastBaseUpdate: e.lastBaseUpdate,
        shared: e.shared,
        effects: e.effects,
      });
}
function Qe(e, t) {
  return { eventTime: e, lane: t, tag: 0, payload: null, callback: null, next: null };
}
function st(e, t, n) {
  var r = e.updateQueue;
  if (r === null) return null;
  if (((r = r.shared), R & 2)) {
    var l = r.pending;
    return l === null ? (t.next = t) : ((t.next = l.next), (l.next = t)), (r.pending = t), Xe(e, n);
  }
  return (l = r.interleaved), l === null ? ((t.next = t), pi(r)) : ((t.next = l.next), (l.next = t)), (r.interleaved = t), Xe(e, n);
}
function _r(e, t, n) {
  if (((t = t.updateQueue), t !== null && ((t = t.shared), (n & 4194240) !== 0))) {
    var r = t.lanes;
    (r &= e.pendingLanes), (n |= r), (t.lanes = n), bo(e, n);
  }
}
function Su(e, t) {
  var n = e.updateQueue,
    r = e.alternate;
  if (r !== null && ((r = r.updateQueue), n === r)) {
    var l = null,
      o = null;
    if (((n = n.firstBaseUpdate), n !== null)) {
      do {
        var i = { eventTime: n.eventTime, lane: n.lane, tag: n.tag, payload: n.payload, callback: n.callback, next: null };
        o === null ? (l = o = i) : (o = o.next = i), (n = n.next);
      } while (n !== null);
      o === null ? (l = o = t) : (o = o.next = t);
    } else l = o = t;
    (n = { baseState: r.baseState, firstBaseUpdate: l, lastBaseUpdate: o, shared: r.shared, effects: r.effects }), (e.updateQueue = n);
    return;
  }
  (e = n.lastBaseUpdate), e === null ? (n.firstBaseUpdate = t) : (e.next = t), (n.lastBaseUpdate = t);
}
function Yr(e, t, n, r) {
  var l = e.updateQueue;
  be = !1;
  var o = l.firstBaseUpdate,
    i = l.lastBaseUpdate,
    u = l.shared.pending;
  if (u !== null) {
    l.shared.pending = null;
    var s = u,
      a = s.next;
    (s.next = null), i === null ? (o = a) : (i.next = a), (i = s);
    var v = e.alternate;
    v !== null &&
      ((v = v.updateQueue),
      (u = v.lastBaseUpdate),
      u !== i && (u === null ? (v.firstBaseUpdate = a) : (u.next = a), (v.lastBaseUpdate = s)));
  }
  if (o !== null) {
    var h = l.baseState;
    (i = 0), (v = a = s = null), (u = o);
    do {
      var m = u.lane,
        S = u.eventTime;
      if ((r & m) === m) {
        v !== null && (v = v.next = { eventTime: S, lane: 0, tag: u.tag, payload: u.payload, callback: u.callback, next: null });
        e: {
          var w = e,
            k = u;
          switch (((m = t), (S = n), k.tag)) {
            case 1:
              if (((w = k.payload), typeof w == 'function')) {
                h = w.call(S, h, m);
                break e;
              }
              h = w;
              break e;
            case 3:
              w.flags = (w.flags & -65537) | 128;
            case 0:
              if (((w = k.payload), (m = typeof w == 'function' ? w.call(S, h, m) : w), m == null)) break e;
              h = B({}, h, m);
              break e;
            case 2:
              be = !0;
          }
        }
        u.callback !== null && u.lane !== 0 && ((e.flags |= 64), (m = l.effects), m === null ? (l.effects = [u]) : m.push(u));
      } else
        (S = { eventTime: S, lane: m, tag: u.tag, payload: u.payload, callback: u.callback, next: null }),
          v === null ? ((a = v = S), (s = h)) : (v = v.next = S),
          (i |= m);
      if (((u = u.next), u === null)) {
        if (((u = l.shared.pending), u === null)) break;
        (m = u), (u = m.next), (m.next = null), (l.lastBaseUpdate = m), (l.shared.pending = null);
      }
    } while (1);
    if (
      (v === null && (s = h), (l.baseState = s), (l.firstBaseUpdate = a), (l.lastBaseUpdate = v), (t = l.shared.interleaved), t !== null)
    ) {
      l = t;
      do (i |= l.lane), (l = l.next);
      while (l !== t);
    } else o === null && (l.shared.lanes = 0);
    (zt |= i), (e.lanes = i), (e.memoizedState = h);
  }
}
function ku(e, t, n) {
  if (((e = t.effects), (t.effects = null), e !== null))
    for (t = 0; t < e.length; t++) {
      var r = e[t],
        l = r.callback;
      if (l !== null) {
        if (((r.callback = null), (r = n), typeof l != 'function')) throw Error(g(191, l));
        l.call(r);
      }
    }
}
var sa = new is.Component().refs;
function _o(e, t, n, r) {
  (t = e.memoizedState),
    (n = n(r, t)),
    (n = n == null ? t : B({}, t, n)),
    (e.memoizedState = n),
    e.lanes === 0 && (e.updateQueue.baseState = n);
}
var al = {
  isMounted: function (e) {
    return (e = e._reactInternals) ? Rt(e) === e : !1;
  },
  enqueueSetState: function (e, t, n) {
    e = e._reactInternals;
    var r = ue(),
      l = ct(e),
      o = Qe(r, l);
    (o.payload = t), n != null && (o.callback = n), (t = st(e, o, l)), t !== null && (Me(t, e, l, r), _r(t, e, l));
  },
  enqueueReplaceState: function (e, t, n) {
    e = e._reactInternals;
    var r = ue(),
      l = ct(e),
      o = Qe(r, l);
    (o.tag = 1), (o.payload = t), n != null && (o.callback = n), (t = st(e, o, l)), t !== null && (Me(t, e, l, r), _r(t, e, l));
  },
  enqueueForceUpdate: function (e, t) {
    e = e._reactInternals;
    var n = ue(),
      r = ct(e),
      l = Qe(n, r);
    (l.tag = 2), t != null && (l.callback = t), (t = st(e, l, r)), t !== null && (Me(t, e, r, n), _r(t, e, r));
  },
};
function xu(e, t, n, r, l, o, i) {
  return (
    (e = e.stateNode),
    typeof e.shouldComponentUpdate == 'function'
      ? e.shouldComponentUpdate(r, o, i)
      : t.prototype && t.prototype.isPureReactComponent
      ? !$n(n, r) || !$n(l, o)
      : !0
  );
}
function aa(e, t, n) {
  var r = !1,
    l = pt,
    o = t.contextType;
  return (
    typeof o == 'object' && o !== null
      ? (o = Ne(o))
      : ((l = he(t) ? Nt : oe.current), (r = t.contextTypes), (o = (r = r != null) ? bt(e, l) : pt)),
    (t = new t(n, o)),
    (e.memoizedState = t.state !== null && t.state !== void 0 ? t.state : null),
    (t.updater = al),
    (e.stateNode = t),
    (t._reactInternals = e),
    r && ((e = e.stateNode), (e.__reactInternalMemoizedUnmaskedChildContext = l), (e.__reactInternalMemoizedMaskedChildContext = o)),
    t
  );
}
function Eu(e, t, n, r) {
  (e = t.state),
    typeof t.componentWillReceiveProps == 'function' && t.componentWillReceiveProps(n, r),
    typeof t.UNSAFE_componentWillReceiveProps == 'function' && t.UNSAFE_componentWillReceiveProps(n, r),
    t.state !== e && al.enqueueReplaceState(t, t.state, null);
}
function No(e, t, n, r) {
  var l = e.stateNode;
  (l.props = n), (l.state = e.memoizedState), (l.refs = sa), hi(e);
  var o = t.contextType;
  typeof o == 'object' && o !== null ? (l.context = Ne(o)) : ((o = he(t) ? Nt : oe.current), (l.context = bt(e, o))),
    (l.state = e.memoizedState),
    (o = t.getDerivedStateFromProps),
    typeof o == 'function' && (_o(e, t, o, n), (l.state = e.memoizedState)),
    typeof t.getDerivedStateFromProps == 'function' ||
      typeof l.getSnapshotBeforeUpdate == 'function' ||
      (typeof l.UNSAFE_componentWillMount != 'function' && typeof l.componentWillMount != 'function') ||
      ((t = l.state),
      typeof l.componentWillMount == 'function' && l.componentWillMount(),
      typeof l.UNSAFE_componentWillMount == 'function' && l.UNSAFE_componentWillMount(),
      t !== l.state && al.enqueueReplaceState(l, l.state, null),
      Yr(e, n, l, r),
      (l.state = e.memoizedState)),
    typeof l.componentDidMount == 'function' && (e.flags |= 4194308);
}
function vn(e, t, n) {
  if (((e = n.ref), e !== null && typeof e != 'function' && typeof e != 'object')) {
    if (n._owner) {
      if (((n = n._owner), n)) {
        if (n.tag !== 1) throw Error(g(309));
        var r = n.stateNode;
      }
      if (!r) throw Error(g(147, e));
      var l = r,
        o = '' + e;
      return t !== null && t.ref !== null && typeof t.ref == 'function' && t.ref._stringRef === o
        ? t.ref
        : ((t = function (i) {
            var u = l.refs;
            u === sa && (u = l.refs = {}), i === null ? delete u[o] : (u[o] = i);
          }),
          (t._stringRef = o),
          t);
    }
    if (typeof e != 'string') throw Error(g(284));
    if (!n._owner) throw Error(g(290, e));
  }
  return e;
}
function mr(e, t) {
  throw (
    ((e = Object.prototype.toString.call(t)),
    Error(g(31, e === '[object Object]' ? 'object with keys {' + Object.keys(t).join(', ') + '}' : e)))
  );
}
function Cu(e) {
  var t = e._init;
  return t(e._payload);
}
function ca(e) {
  function t(f, c) {
    if (e) {
      var d = f.deletions;
      d === null ? ((f.deletions = [c]), (f.flags |= 16)) : d.push(c);
    }
  }
  function n(f, c) {
    if (!e) return null;
    for (; c !== null; ) t(f, c), (c = c.sibling);
    return null;
  }
  function r(f, c) {
    for (f = new Map(); c !== null; ) c.key !== null ? f.set(c.key, c) : f.set(c.index, c), (c = c.sibling);
    return f;
  }
  function l(f, c) {
    return (f = ft(f, c)), (f.index = 0), (f.sibling = null), f;
  }
  function o(f, c, d) {
    return (
      (f.index = d),
      e
        ? ((d = f.alternate), d !== null ? ((d = d.index), d < c ? ((f.flags |= 2), c) : d) : ((f.flags |= 2), c))
        : ((f.flags |= 1048576), c)
    );
  }
  function i(f) {
    return e && f.alternate === null && (f.flags |= 2), f;
  }
  function u(f, c, d, y) {
    return c === null || c.tag !== 6 ? ((c = Ql(d, f.mode, y)), (c.return = f), c) : ((c = l(c, d)), (c.return = f), c);
  }
  function s(f, c, d, y) {
    var E = d.type;
    return E === Ot
      ? v(f, c, d.props.children, y, d.key)
      : c !== null && (c.elementType === E || (typeof E == 'object' && E !== null && E.$$typeof === qe && Cu(E) === c.type))
      ? ((y = l(c, d.props)), (y.ref = vn(f, c, d)), (y.return = f), y)
      : ((y = Lr(d.type, d.key, d.props, null, f.mode, y)), (y.ref = vn(f, c, d)), (y.return = f), y);
  }
  function a(f, c, d, y) {
    return c === null || c.tag !== 4 || c.stateNode.containerInfo !== d.containerInfo || c.stateNode.implementation !== d.implementation
      ? ((c = Kl(d, f.mode, y)), (c.return = f), c)
      : ((c = l(c, d.children || [])), (c.return = f), c);
  }
  function v(f, c, d, y, E) {
    return c === null || c.tag !== 7 ? ((c = _t(d, f.mode, y, E)), (c.return = f), c) : ((c = l(c, d)), (c.return = f), c);
  }
  function h(f, c, d) {
    if ((typeof c == 'string' && c !== '') || typeof c == 'number') return (c = Ql('' + c, f.mode, d)), (c.return = f), c;
    if (typeof c == 'object' && c !== null) {
      switch (c.$$typeof) {
        case lr:
          return (d = Lr(c.type, c.key, c.props, null, f.mode, d)), (d.ref = vn(f, null, c)), (d.return = f), d;
        case Mt:
          return (c = Kl(c, f.mode, d)), (c.return = f), c;
        case qe:
          var y = c._init;
          return h(f, y(c._payload), d);
      }
      if (Sn(c) || fn(c)) return (c = _t(c, f.mode, d, null)), (c.return = f), c;
      mr(f, c);
    }
    return null;
  }
  function m(f, c, d, y) {
    var E = c !== null ? c.key : null;
    if ((typeof d == 'string' && d !== '') || typeof d == 'number') return E !== null ? null : u(f, c, '' + d, y);
    if (typeof d == 'object' && d !== null) {
      switch (d.$$typeof) {
        case lr:
          return d.key === E ? s(f, c, d, y) : null;
        case Mt:
          return d.key === E ? a(f, c, d, y) : null;
        case qe:
          return (E = d._init), m(f, c, E(d._payload), y);
      }
      if (Sn(d) || fn(d)) return E !== null ? null : v(f, c, d, y, null);
      mr(f, d);
    }
    return null;
  }
  function S(f, c, d, y, E) {
    if ((typeof y == 'string' && y !== '') || typeof y == 'number') return (f = f.get(d) || null), u(c, f, '' + y, E);
    if (typeof y == 'object' && y !== null) {
      switch (y.$$typeof) {
        case lr:
          return (f = f.get(y.key === null ? d : y.key) || null), s(c, f, y, E);
        case Mt:
          return (f = f.get(y.key === null ? d : y.key) || null), a(c, f, y, E);
        case qe:
          var _ = y._init;
          return S(f, c, d, _(y._payload), E);
      }
      if (Sn(y) || fn(y)) return (f = f.get(d) || null), v(c, f, y, E, null);
      mr(c, y);
    }
    return null;
  }
  function w(f, c, d, y) {
    for (var E = null, _ = null, N = c, j = (c = 0), W = null; N !== null && j < d.length; j++) {
      N.index > j ? ((W = N), (N = null)) : (W = N.sibling);
      var L = m(f, N, d[j], y);
      if (L === null) {
        N === null && (N = W);
        break;
      }
      e && N && L.alternate === null && t(f, N), (c = o(L, c, j)), _ === null ? (E = L) : (_.sibling = L), (_ = L), (N = W);
    }
    if (j === d.length) return n(f, N), $ && wt(f, j), E;
    if (N === null) {
      for (; j < d.length; j++) (N = h(f, d[j], y)), N !== null && ((c = o(N, c, j)), _ === null ? (E = N) : (_.sibling = N), (_ = N));
      return $ && wt(f, j), E;
    }
    for (N = r(f, N); j < d.length; j++)
      (W = S(N, f, j, d[j], y)),
        W !== null &&
          (e && W.alternate !== null && N.delete(W.key === null ? j : W.key),
          (c = o(W, c, j)),
          _ === null ? (E = W) : (_.sibling = W),
          (_ = W));
    return (
      e &&
        N.forEach(function (Pe) {
          return t(f, Pe);
        }),
      $ && wt(f, j),
      E
    );
  }
  function k(f, c, d, y) {
    var E = fn(d);
    if (typeof E != 'function') throw Error(g(150));
    if (((d = E.call(d)), d == null)) throw Error(g(151));
    for (var _ = (E = null), N = c, j = (c = 0), W = null, L = d.next(); N !== null && !L.done; j++, L = d.next()) {
      N.index > j ? ((W = N), (N = null)) : (W = N.sibling);
      var Pe = m(f, N, L.value, y);
      if (Pe === null) {
        N === null && (N = W);
        break;
      }
      e && N && Pe.alternate === null && t(f, N), (c = o(Pe, c, j)), _ === null ? (E = Pe) : (_.sibling = Pe), (_ = Pe), (N = W);
    }
    if (L.done) return n(f, N), $ && wt(f, j), E;
    if (N === null) {
      for (; !L.done; j++, L = d.next())
        (L = h(f, L.value, y)), L !== null && ((c = o(L, c, j)), _ === null ? (E = L) : (_.sibling = L), (_ = L));
      return $ && wt(f, j), E;
    }
    for (N = r(f, N); !L.done; j++, L = d.next())
      (L = S(N, f, j, L.value, y)),
        L !== null &&
          (e && L.alternate !== null && N.delete(L.key === null ? j : L.key),
          (c = o(L, c, j)),
          _ === null ? (E = L) : (_.sibling = L),
          (_ = L));
    return (
      e &&
        N.forEach(function (an) {
          return t(f, an);
        }),
      $ && wt(f, j),
      E
    );
  }
  function U(f, c, d, y) {
    if (
      (typeof d == 'object' && d !== null && d.type === Ot && d.key === null && (d = d.props.children), typeof d == 'object' && d !== null)
    ) {
      switch (d.$$typeof) {
        case lr:
          e: {
            for (var E = d.key, _ = c; _ !== null; ) {
              if (_.key === E) {
                if (((E = d.type), E === Ot)) {
                  if (_.tag === 7) {
                    n(f, _.sibling), (c = l(_, d.props.children)), (c.return = f), (f = c);
                    break e;
                  }
                } else if (_.elementType === E || (typeof E == 'object' && E !== null && E.$$typeof === qe && Cu(E) === _.type)) {
                  n(f, _.sibling), (c = l(_, d.props)), (c.ref = vn(f, _, d)), (c.return = f), (f = c);
                  break e;
                }
                n(f, _);
                break;
              } else t(f, _);
              _ = _.sibling;
            }
            d.type === Ot
              ? ((c = _t(d.props.children, f.mode, y, d.key)), (c.return = f), (f = c))
              : ((y = Lr(d.type, d.key, d.props, null, f.mode, y)), (y.ref = vn(f, c, d)), (y.return = f), (f = y));
          }
          return i(f);
        case Mt:
          e: {
            for (_ = d.key; c !== null; ) {
              if (c.key === _)
                if (c.tag === 4 && c.stateNode.containerInfo === d.containerInfo && c.stateNode.implementation === d.implementation) {
                  n(f, c.sibling), (c = l(c, d.children || [])), (c.return = f), (f = c);
                  break e;
                } else {
                  n(f, c);
                  break;
                }
              else t(f, c);
              c = c.sibling;
            }
            (c = Kl(d, f.mode, y)), (c.return = f), (f = c);
          }
          return i(f);
        case qe:
          return (_ = d._init), U(f, c, _(d._payload), y);
      }
      if (Sn(d)) return w(f, c, d, y);
      if (fn(d)) return k(f, c, d, y);
      mr(f, d);
    }
    return (typeof d == 'string' && d !== '') || typeof d == 'number'
      ? ((d = '' + d),
        c !== null && c.tag === 6
          ? (n(f, c.sibling), (c = l(c, d)), (c.return = f), (f = c))
          : (n(f, c), (c = Ql(d, f.mode, y)), (c.return = f), (f = c)),
        i(f))
      : n(f, c);
  }
  return U;
}
var tn = ca(!0),
  fa = ca(!1),
  bn = {},
  Ae = mt(bn),
  Hn = mt(bn),
  Wn = mt(bn);
function Et(e) {
  if (e === bn) throw Error(g(174));
  return e;
}
function mi(e, t) {
  switch ((O(Wn, t), O(Hn, e), O(Ae, bn), (e = t.nodeType), e)) {
    case 9:
    case 11:
      t = (t = t.documentElement) ? t.namespaceURI : ro(null, '');
      break;
    default:
      (e = e === 8 ? t.parentNode : t), (t = e.namespaceURI || null), (e = e.tagName), (t = ro(t, e));
  }
  F(Ae), O(Ae, t);
}
function nn() {
  F(Ae), F(Hn), F(Wn);
}
function da(e) {
  Et(Wn.current);
  var t = Et(Ae.current),
    n = ro(t, e.type);
  t !== n && (O(Hn, e), O(Ae, n));
}
function vi(e) {
  Hn.current === e && (F(Ae), F(Hn));
}
var A = mt(0);
function Xr(e) {
  for (var t = e; t !== null; ) {
    if (t.tag === 13) {
      var n = t.memoizedState;
      if (n !== null && ((n = n.dehydrated), n === null || n.data === '$?' || n.data === '$!')) return t;
    } else if (t.tag === 19 && t.memoizedProps.revealOrder !== void 0) {
      if (t.flags & 128) return t;
    } else if (t.child !== null) {
      (t.child.return = t), (t = t.child);
      continue;
    }
    if (t === e) break;
    for (; t.sibling === null; ) {
      if (t.return === null || t.return === e) return null;
      t = t.return;
    }
    (t.sibling.return = t.return), (t = t.sibling);
  }
  return null;
}
var $l = [];
function yi() {
  for (var e = 0; e < $l.length; e++) $l[e]._workInProgressVersionPrimary = null;
  $l.length = 0;
}
var Nr = Ze.ReactCurrentDispatcher,
  Al = Ze.ReactCurrentBatchConfig,
  Pt = 0,
  V = null,
  X = null,
  J = null,
  Gr = !1,
  Pn = !1,
  Qn = 0,
  rd = 0;
function ne() {
  throw Error(g(321));
}
function gi(e, t) {
  if (t === null) return !1;
  for (var n = 0; n < t.length && n < e.length; n++) if (!Oe(e[n], t[n])) return !1;
  return !0;
}
function wi(e, t, n, r, l, o) {
  if (
    ((Pt = o),
    (V = t),
    (t.memoizedState = null),
    (t.updateQueue = null),
    (t.lanes = 0),
    (Nr.current = e === null || e.memoizedState === null ? ud : sd),
    (e = n(r, l)),
    Pn)
  ) {
    o = 0;
    do {
      if (((Pn = !1), (Qn = 0), 25 <= o)) throw Error(g(301));
      (o += 1), (J = X = null), (t.updateQueue = null), (Nr.current = ad), (e = n(r, l));
    } while (Pn);
  }
  if (((Nr.current = Zr), (t = X !== null && X.next !== null), (Pt = 0), (J = X = V = null), (Gr = !1), t)) throw Error(g(300));
  return e;
}
function Si() {
  var e = Qn !== 0;
  return (Qn = 0), e;
}
function Fe() {
  var e = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
  return J === null ? (V.memoizedState = J = e) : (J = J.next = e), J;
}
function je() {
  if (X === null) {
    var e = V.alternate;
    e = e !== null ? e.memoizedState : null;
  } else e = X.next;
  var t = J === null ? V.memoizedState : J.next;
  if (t !== null) (J = t), (X = e);
  else {
    if (e === null) throw Error(g(310));
    (X = e),
      (e = { memoizedState: X.memoizedState, baseState: X.baseState, baseQueue: X.baseQueue, queue: X.queue, next: null }),
      J === null ? (V.memoizedState = J = e) : (J = J.next = e);
  }
  return J;
}
function Kn(e, t) {
  return typeof t == 'function' ? t(e) : t;
}
function Vl(e) {
  var t = je(),
    n = t.queue;
  if (n === null) throw Error(g(311));
  n.lastRenderedReducer = e;
  var r = X,
    l = r.baseQueue,
    o = n.pending;
  if (o !== null) {
    if (l !== null) {
      var i = l.next;
      (l.next = o.next), (o.next = i);
    }
    (r.baseQueue = l = o), (n.pending = null);
  }
  if (l !== null) {
    (o = l.next), (r = r.baseState);
    var u = (i = null),
      s = null,
      a = o;
    do {
      var v = a.lane;
      if ((Pt & v) === v)
        s !== null && (s = s.next = { lane: 0, action: a.action, hasEagerState: a.hasEagerState, eagerState: a.eagerState, next: null }),
          (r = a.hasEagerState ? a.eagerState : e(r, a.action));
      else {
        var h = { lane: v, action: a.action, hasEagerState: a.hasEagerState, eagerState: a.eagerState, next: null };
        s === null ? ((u = s = h), (i = r)) : (s = s.next = h), (V.lanes |= v), (zt |= v);
      }
      a = a.next;
    } while (a !== null && a !== o);
    s === null ? (i = r) : (s.next = u),
      Oe(r, t.memoizedState) || (de = !0),
      (t.memoizedState = r),
      (t.baseState = i),
      (t.baseQueue = s),
      (n.lastRenderedState = r);
  }
  if (((e = n.interleaved), e !== null)) {
    l = e;
    do (o = l.lane), (V.lanes |= o), (zt |= o), (l = l.next);
    while (l !== e);
  } else l === null && (n.lanes = 0);
  return [t.memoizedState, n.dispatch];
}
function Bl(e) {
  var t = je(),
    n = t.queue;
  if (n === null) throw Error(g(311));
  n.lastRenderedReducer = e;
  var r = n.dispatch,
    l = n.pending,
    o = t.memoizedState;
  if (l !== null) {
    n.pending = null;
    var i = (l = l.next);
    do (o = e(o, i.action)), (i = i.next);
    while (i !== l);
    Oe(o, t.memoizedState) || (de = !0), (t.memoizedState = o), t.baseQueue === null && (t.baseState = o), (n.lastRenderedState = o);
  }
  return [o, r];
}
function pa() {}
function ha(e, t) {
  var n = V,
    r = je(),
    l = t(),
    o = !Oe(r.memoizedState, l);
  if (
    (o && ((r.memoizedState = l), (de = !0)),
    (r = r.queue),
    ki(ya.bind(null, n, r, e), [e]),
    r.getSnapshot !== t || o || (J !== null && J.memoizedState.tag & 1))
  ) {
    if (((n.flags |= 2048), Yn(9, va.bind(null, n, r, l, t), void 0, null), q === null)) throw Error(g(349));
    Pt & 30 || ma(n, t, l);
  }
  return l;
}
function ma(e, t, n) {
  (e.flags |= 16384),
    (e = { getSnapshot: t, value: n }),
    (t = V.updateQueue),
    t === null
      ? ((t = { lastEffect: null, stores: null }), (V.updateQueue = t), (t.stores = [e]))
      : ((n = t.stores), n === null ? (t.stores = [e]) : n.push(e));
}
function va(e, t, n, r) {
  (t.value = n), (t.getSnapshot = r), ga(t) && wa(e);
}
function ya(e, t, n) {
  return n(function () {
    ga(t) && wa(e);
  });
}
function ga(e) {
  var t = e.getSnapshot;
  e = e.value;
  try {
    var n = t();
    return !Oe(e, n);
  } catch {
    return !0;
  }
}
function wa(e) {
  var t = Xe(e, 1);
  t !== null && Me(t, e, 1, -1);
}
function _u(e) {
  var t = Fe();
  return (
    typeof e == 'function' && (e = e()),
    (t.memoizedState = t.baseState = e),
    (e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: Kn, lastRenderedState: e }),
    (t.queue = e),
    (e = e.dispatch = id.bind(null, V, e)),
    [t.memoizedState, e]
  );
}
function Yn(e, t, n, r) {
  return (
    (e = { tag: e, create: t, destroy: n, deps: r, next: null }),
    (t = V.updateQueue),
    t === null
      ? ((t = { lastEffect: null, stores: null }), (V.updateQueue = t), (t.lastEffect = e.next = e))
      : ((n = t.lastEffect), n === null ? (t.lastEffect = e.next = e) : ((r = n.next), (n.next = e), (e.next = r), (t.lastEffect = e))),
    e
  );
}
function Sa() {
  return je().memoizedState;
}
function jr(e, t, n, r) {
  var l = Fe();
  (V.flags |= e), (l.memoizedState = Yn(1 | t, n, void 0, r === void 0 ? null : r));
}
function cl(e, t, n, r) {
  var l = je();
  r = r === void 0 ? null : r;
  var o = void 0;
  if (X !== null) {
    var i = X.memoizedState;
    if (((o = i.destroy), r !== null && gi(r, i.deps))) {
      l.memoizedState = Yn(t, n, o, r);
      return;
    }
  }
  (V.flags |= e), (l.memoizedState = Yn(1 | t, n, o, r));
}
function Nu(e, t) {
  return jr(8390656, 8, e, t);
}
function ki(e, t) {
  return cl(2048, 8, e, t);
}
function ka(e, t) {
  return cl(4, 2, e, t);
}
function xa(e, t) {
  return cl(4, 4, e, t);
}
function Ea(e, t) {
  if (typeof t == 'function')
    return (
      (e = e()),
      t(e),
      function () {
        t(null);
      }
    );
  if (t != null)
    return (
      (e = e()),
      (t.current = e),
      function () {
        t.current = null;
      }
    );
}
function Ca(e, t, n) {
  return (n = n != null ? n.concat([e]) : null), cl(4, 4, Ea.bind(null, t, e), n);
}
function xi() {}
function _a(e, t) {
  var n = je();
  t = t === void 0 ? null : t;
  var r = n.memoizedState;
  return r !== null && t !== null && gi(t, r[1]) ? r[0] : ((n.memoizedState = [e, t]), e);
}
function Na(e, t) {
  var n = je();
  t = t === void 0 ? null : t;
  var r = n.memoizedState;
  return r !== null && t !== null && gi(t, r[1]) ? r[0] : ((e = e()), (n.memoizedState = [e, t]), e);
}
function ja(e, t, n) {
  return Pt & 21
    ? (Oe(n, t) || ((n = Ts()), (V.lanes |= n), (zt |= n), (e.baseState = !0)), t)
    : (e.baseState && ((e.baseState = !1), (de = !0)), (e.memoizedState = n));
}
function ld(e, t) {
  var n = M;
  (M = n !== 0 && 4 > n ? n : 4), e(!0);
  var r = Al.transition;
  Al.transition = {};
  try {
    e(!1), t();
  } finally {
    (M = n), (Al.transition = r);
  }
}
function Pa() {
  return je().memoizedState;
}
function od(e, t, n) {
  var r = ct(e);
  if (((n = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null }), za(e))) Ta(t, n);
  else if (((n = ia(e, t, n, r)), n !== null)) {
    var l = ue();
    Me(n, e, r, l), La(n, t, r);
  }
}
function id(e, t, n) {
  var r = ct(e),
    l = { lane: r, action: n, hasEagerState: !1, eagerState: null, next: null };
  if (za(e)) Ta(t, l);
  else {
    var o = e.alternate;
    if (e.lanes === 0 && (o === null || o.lanes === 0) && ((o = t.lastRenderedReducer), o !== null))
      try {
        var i = t.lastRenderedState,
          u = o(i, n);
        if (((l.hasEagerState = !0), (l.eagerState = u), Oe(u, i))) {
          var s = t.interleaved;
          s === null ? ((l.next = l), pi(t)) : ((l.next = s.next), (s.next = l)), (t.interleaved = l);
          return;
        }
      } catch {
      } finally {
      }
    (n = ia(e, t, l, r)), n !== null && ((l = ue()), Me(n, e, r, l), La(n, t, r));
  }
}
function za(e) {
  var t = e.alternate;
  return e === V || (t !== null && t === V);
}
function Ta(e, t) {
  Pn = Gr = !0;
  var n = e.pending;
  n === null ? (t.next = t) : ((t.next = n.next), (n.next = t)), (e.pending = t);
}
function La(e, t, n) {
  if (n & 4194240) {
    var r = t.lanes;
    (r &= e.pendingLanes), (n |= r), (t.lanes = n), bo(e, n);
  }
}
var Zr = {
    readContext: Ne,
    useCallback: ne,
    useContext: ne,
    useEffect: ne,
    useImperativeHandle: ne,
    useInsertionEffect: ne,
    useLayoutEffect: ne,
    useMemo: ne,
    useReducer: ne,
    useRef: ne,
    useState: ne,
    useDebugValue: ne,
    useDeferredValue: ne,
    useTransition: ne,
    useMutableSource: ne,
    useSyncExternalStore: ne,
    useId: ne,
    unstable_isNewReconciler: !1,
  },
  ud = {
    readContext: Ne,
    useCallback: function (e, t) {
      return (Fe().memoizedState = [e, t === void 0 ? null : t]), e;
    },
    useContext: Ne,
    useEffect: Nu,
    useImperativeHandle: function (e, t, n) {
      return (n = n != null ? n.concat([e]) : null), jr(4194308, 4, Ea.bind(null, t, e), n);
    },
    useLayoutEffect: function (e, t) {
      return jr(4194308, 4, e, t);
    },
    useInsertionEffect: function (e, t) {
      return jr(4, 2, e, t);
    },
    useMemo: function (e, t) {
      var n = Fe();
      return (t = t === void 0 ? null : t), (e = e()), (n.memoizedState = [e, t]), e;
    },
    useReducer: function (e, t, n) {
      var r = Fe();
      return (
        (t = n !== void 0 ? n(t) : t),
        (r.memoizedState = r.baseState = t),
        (e = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: e, lastRenderedState: t }),
        (r.queue = e),
        (e = e.dispatch = od.bind(null, V, e)),
        [r.memoizedState, e]
      );
    },
    useRef: function (e) {
      var t = Fe();
      return (e = { current: e }), (t.memoizedState = e);
    },
    useState: _u,
    useDebugValue: xi,
    useDeferredValue: function (e) {
      return (Fe().memoizedState = e);
    },
    useTransition: function () {
      var e = _u(!1),
        t = e[0];
      return (e = ld.bind(null, e[1])), (Fe().memoizedState = e), [t, e];
    },
    useMutableSource: function () {},
    useSyncExternalStore: function (e, t, n) {
      var r = V,
        l = Fe();
      if ($) {
        if (n === void 0) throw Error(g(407));
        n = n();
      } else {
        if (((n = t()), q === null)) throw Error(g(349));
        Pt & 30 || ma(r, t, n);
      }
      l.memoizedState = n;
      var o = { value: n, getSnapshot: t };
      return (l.queue = o), Nu(ya.bind(null, r, o, e), [e]), (r.flags |= 2048), Yn(9, va.bind(null, r, o, n, t), void 0, null), n;
    },
    useId: function () {
      var e = Fe(),
        t = q.identifierPrefix;
      if ($) {
        var n = We,
          r = He;
        (n = (r & ~(1 << (32 - Ie(r) - 1))).toString(32) + n),
          (t = ':' + t + 'R' + n),
          (n = Qn++),
          0 < n && (t += 'H' + n.toString(32)),
          (t += ':');
      } else (n = rd++), (t = ':' + t + 'r' + n.toString(32) + ':');
      return (e.memoizedState = t);
    },
    unstable_isNewReconciler: !1,
  },
  sd = {
    readContext: Ne,
    useCallback: _a,
    useContext: Ne,
    useEffect: ki,
    useImperativeHandle: Ca,
    useInsertionEffect: ka,
    useLayoutEffect: xa,
    useMemo: Na,
    useReducer: Vl,
    useRef: Sa,
    useState: function () {
      return Vl(Kn);
    },
    useDebugValue: xi,
    useDeferredValue: function (e) {
      var t = je();
      return ja(t, X.memoizedState, e);
    },
    useTransition: function () {
      var e = Vl(Kn)[0],
        t = je().memoizedState;
      return [e, t];
    },
    useMutableSource: pa,
    useSyncExternalStore: ha,
    useId: Pa,
    unstable_isNewReconciler: !1,
  },
  ad = {
    readContext: Ne,
    useCallback: _a,
    useContext: Ne,
    useEffect: ki,
    useImperativeHandle: Ca,
    useInsertionEffect: ka,
    useLayoutEffect: xa,
    useMemo: Na,
    useReducer: Bl,
    useRef: Sa,
    useState: function () {
      return Bl(Kn);
    },
    useDebugValue: xi,
    useDeferredValue: function (e) {
      var t = je();
      return X === null ? (t.memoizedState = e) : ja(t, X.memoizedState, e);
    },
    useTransition: function () {
      var e = Bl(Kn)[0],
        t = je().memoizedState;
      return [e, t];
    },
    useMutableSource: pa,
    useSyncExternalStore: ha,
    useId: Pa,
    unstable_isNewReconciler: !1,
  };
function rn(e, t) {
  try {
    var n = '',
      r = t;
    do (n += Dc(r)), (r = r.return);
    while (r);
    var l = n;
  } catch (o) {
    l =
      `
Error generating stack: ` +
      o.message +
      `
` +
      o.stack;
  }
  return { value: e, source: t, stack: l, digest: null };
}
function Hl(e, t, n) {
  return { value: e, source: null, stack: n ?? null, digest: t ?? null };
}
function jo(e, t) {
  try {
    console.error(t.value);
  } catch (n) {
    setTimeout(function () {
      throw n;
    });
  }
}
var cd = typeof WeakMap == 'function' ? WeakMap : Map;
function Ra(e, t, n) {
  (n = Qe(-1, n)), (n.tag = 3), (n.payload = { element: null });
  var r = t.value;
  return (
    (n.callback = function () {
      qr || ((qr = !0), (Fo = r)), jo(e, t);
    }),
    n
  );
}
function Ia(e, t, n) {
  (n = Qe(-1, n)), (n.tag = 3);
  var r = e.type.getDerivedStateFromError;
  if (typeof r == 'function') {
    var l = t.value;
    (n.payload = function () {
      return r(l);
    }),
      (n.callback = function () {
        jo(e, t);
      });
  }
  var o = e.stateNode;
  return (
    o !== null &&
      typeof o.componentDidCatch == 'function' &&
      (n.callback = function () {
        jo(e, t), typeof r != 'function' && (at === null ? (at = new Set([this])) : at.add(this));
        var i = t.stack;
        this.componentDidCatch(t.value, { componentStack: i !== null ? i : '' });
      }),
    n
  );
}
function ju(e, t, n) {
  var r = e.pingCache;
  if (r === null) {
    r = e.pingCache = new cd();
    var l = new Set();
    r.set(t, l);
  } else (l = r.get(t)), l === void 0 && ((l = new Set()), r.set(t, l));
  l.has(n) || (l.add(n), (e = Cd.bind(null, e, t, n)), t.then(e, e));
}
function Pu(e) {
  do {
    var t;
    if (((t = e.tag === 13) && ((t = e.memoizedState), (t = t !== null ? t.dehydrated !== null : !0)), t)) return e;
    e = e.return;
  } while (e !== null);
  return null;
}
function zu(e, t, n, r, l) {
  return e.mode & 1
    ? ((e.flags |= 65536), (e.lanes = l), e)
    : (e === t
        ? (e.flags |= 65536)
        : ((e.flags |= 128),
          (n.flags |= 131072),
          (n.flags &= -52805),
          n.tag === 1 && (n.alternate === null ? (n.tag = 17) : ((t = Qe(-1, 1)), (t.tag = 2), st(n, t, 1))),
          (n.lanes |= 1)),
      e);
}
var fd = Ze.ReactCurrentOwner,
  de = !1;
function ie(e, t, n, r) {
  t.child = e === null ? fa(t, null, n, r) : tn(t, e.child, n, r);
}
function Tu(e, t, n, r, l) {
  n = n.render;
  var o = t.ref;
  return (
    Zt(t, l),
    (r = wi(e, t, n, r, o, l)),
    (n = Si()),
    e !== null && !de
      ? ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~l), Ge(e, t, l))
      : ($ && n && ui(t), (t.flags |= 1), ie(e, t, r, l), t.child)
  );
}
function Lu(e, t, n, r, l) {
  if (e === null) {
    var o = n.type;
    return typeof o == 'function' && !Ti(o) && o.defaultProps === void 0 && n.compare === null && n.defaultProps === void 0
      ? ((t.tag = 15), (t.type = o), Ma(e, t, o, r, l))
      : ((e = Lr(n.type, null, r, t, t.mode, l)), (e.ref = t.ref), (e.return = t), (t.child = e));
  }
  if (((o = e.child), !(e.lanes & l))) {
    var i = o.memoizedProps;
    if (((n = n.compare), (n = n !== null ? n : $n), n(i, r) && e.ref === t.ref)) return Ge(e, t, l);
  }
  return (t.flags |= 1), (e = ft(o, r)), (e.ref = t.ref), (e.return = t), (t.child = e);
}
function Ma(e, t, n, r, l) {
  if (e !== null) {
    var o = e.memoizedProps;
    if ($n(o, r) && e.ref === t.ref)
      if (((de = !1), (t.pendingProps = r = o), (e.lanes & l) !== 0)) e.flags & 131072 && (de = !0);
      else return (t.lanes = e.lanes), Ge(e, t, l);
  }
  return Po(e, t, n, r, l);
}
function Oa(e, t, n) {
  var r = t.pendingProps,
    l = r.children,
    o = e !== null ? e.memoizedState : null;
  if (r.mode === 'hidden')
    if (!(t.mode & 1)) (t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }), O(Qt, ve), (ve |= n);
    else {
      if (!(n & 1073741824))
        return (
          (e = o !== null ? o.baseLanes | n : n),
          (t.lanes = t.childLanes = 1073741824),
          (t.memoizedState = { baseLanes: e, cachePool: null, transitions: null }),
          (t.updateQueue = null),
          O(Qt, ve),
          (ve |= e),
          null
        );
      (t.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }), (r = o !== null ? o.baseLanes : n), O(Qt, ve), (ve |= r);
    }
  else o !== null ? ((r = o.baseLanes | n), (t.memoizedState = null)) : (r = n), O(Qt, ve), (ve |= r);
  return ie(e, t, l, n), t.child;
}
function Da(e, t) {
  var n = t.ref;
  ((e === null && n !== null) || (e !== null && e.ref !== n)) && ((t.flags |= 512), (t.flags |= 2097152));
}
function Po(e, t, n, r, l) {
  var o = he(n) ? Nt : oe.current;
  return (
    (o = bt(t, o)),
    Zt(t, l),
    (n = wi(e, t, n, r, o, l)),
    (r = Si()),
    e !== null && !de
      ? ((t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~l), Ge(e, t, l))
      : ($ && r && ui(t), (t.flags |= 1), ie(e, t, n, l), t.child)
  );
}
function Ru(e, t, n, r, l) {
  if (he(n)) {
    var o = !0;
    Br(t);
  } else o = !1;
  if ((Zt(t, l), t.stateNode === null)) Pr(e, t), aa(t, n, r), No(t, n, r, l), (r = !0);
  else if (e === null) {
    var i = t.stateNode,
      u = t.memoizedProps;
    i.props = u;
    var s = i.context,
      a = n.contextType;
    typeof a == 'object' && a !== null ? (a = Ne(a)) : ((a = he(n) ? Nt : oe.current), (a = bt(t, a)));
    var v = n.getDerivedStateFromProps,
      h = typeof v == 'function' || typeof i.getSnapshotBeforeUpdate == 'function';
    h ||
      (typeof i.UNSAFE_componentWillReceiveProps != 'function' && typeof i.componentWillReceiveProps != 'function') ||
      ((u !== r || s !== a) && Eu(t, i, r, a)),
      (be = !1);
    var m = t.memoizedState;
    (i.state = m),
      Yr(t, r, i, l),
      (s = t.memoizedState),
      u !== r || m !== s || pe.current || be
        ? (typeof v == 'function' && (_o(t, n, v, r), (s = t.memoizedState)),
          (u = be || xu(t, n, u, r, m, s, a))
            ? (h ||
                (typeof i.UNSAFE_componentWillMount != 'function' && typeof i.componentWillMount != 'function') ||
                (typeof i.componentWillMount == 'function' && i.componentWillMount(),
                typeof i.UNSAFE_componentWillMount == 'function' && i.UNSAFE_componentWillMount()),
              typeof i.componentDidMount == 'function' && (t.flags |= 4194308))
            : (typeof i.componentDidMount == 'function' && (t.flags |= 4194308), (t.memoizedProps = r), (t.memoizedState = s)),
          (i.props = r),
          (i.state = s),
          (i.context = a),
          (r = u))
        : (typeof i.componentDidMount == 'function' && (t.flags |= 4194308), (r = !1));
  } else {
    (i = t.stateNode),
      ua(e, t),
      (u = t.memoizedProps),
      (a = t.type === t.elementType ? u : Te(t.type, u)),
      (i.props = a),
      (h = t.pendingProps),
      (m = i.context),
      (s = n.contextType),
      typeof s == 'object' && s !== null ? (s = Ne(s)) : ((s = he(n) ? Nt : oe.current), (s = bt(t, s)));
    var S = n.getDerivedStateFromProps;
    (v = typeof S == 'function' || typeof i.getSnapshotBeforeUpdate == 'function') ||
      (typeof i.UNSAFE_componentWillReceiveProps != 'function' && typeof i.componentWillReceiveProps != 'function') ||
      ((u !== h || m !== s) && Eu(t, i, r, s)),
      (be = !1),
      (m = t.memoizedState),
      (i.state = m),
      Yr(t, r, i, l);
    var w = t.memoizedState;
    u !== h || m !== w || pe.current || be
      ? (typeof S == 'function' && (_o(t, n, S, r), (w = t.memoizedState)),
        (a = be || xu(t, n, a, r, m, w, s) || !1)
          ? (v ||
              (typeof i.UNSAFE_componentWillUpdate != 'function' && typeof i.componentWillUpdate != 'function') ||
              (typeof i.componentWillUpdate == 'function' && i.componentWillUpdate(r, w, s),
              typeof i.UNSAFE_componentWillUpdate == 'function' && i.UNSAFE_componentWillUpdate(r, w, s)),
            typeof i.componentDidUpdate == 'function' && (t.flags |= 4),
            typeof i.getSnapshotBeforeUpdate == 'function' && (t.flags |= 1024))
          : (typeof i.componentDidUpdate != 'function' || (u === e.memoizedProps && m === e.memoizedState) || (t.flags |= 4),
            typeof i.getSnapshotBeforeUpdate != 'function' || (u === e.memoizedProps && m === e.memoizedState) || (t.flags |= 1024),
            (t.memoizedProps = r),
            (t.memoizedState = w)),
        (i.props = r),
        (i.state = w),
        (i.context = s),
        (r = a))
      : (typeof i.componentDidUpdate != 'function' || (u === e.memoizedProps && m === e.memoizedState) || (t.flags |= 4),
        typeof i.getSnapshotBeforeUpdate != 'function' || (u === e.memoizedProps && m === e.memoizedState) || (t.flags |= 1024),
        (r = !1));
  }
  return zo(e, t, n, r, o, l);
}
function zo(e, t, n, r, l, o) {
  Da(e, t);
  var i = (t.flags & 128) !== 0;
  if (!r && !i) return l && yu(t, n, !1), Ge(e, t, o);
  (r = t.stateNode), (fd.current = t);
  var u = i && typeof n.getDerivedStateFromError != 'function' ? null : r.render();
  return (
    (t.flags |= 1),
    e !== null && i ? ((t.child = tn(t, e.child, null, o)), (t.child = tn(t, null, u, o))) : ie(e, t, u, o),
    (t.memoizedState = r.state),
    l && yu(t, n, !0),
    t.child
  );
}
function Fa(e) {
  var t = e.stateNode;
  t.pendingContext ? vu(e, t.pendingContext, t.pendingContext !== t.context) : t.context && vu(e, t.context, !1), mi(e, t.containerInfo);
}
function Iu(e, t, n, r, l) {
  return en(), ai(l), (t.flags |= 256), ie(e, t, n, r), t.child;
}
var To = { dehydrated: null, treeContext: null, retryLane: 0 };
function Lo(e) {
  return { baseLanes: e, cachePool: null, transitions: null };
}
function Ua(e, t, n) {
  var r = t.pendingProps,
    l = A.current,
    o = !1,
    i = (t.flags & 128) !== 0,
    u;
  if (
    ((u = i) || (u = e !== null && e.memoizedState === null ? !1 : (l & 2) !== 0),
    u ? ((o = !0), (t.flags &= -129)) : (e === null || e.memoizedState !== null) && (l |= 1),
    O(A, l & 1),
    e === null)
  )
    return (
      Eo(t),
      (e = t.memoizedState),
      e !== null && ((e = e.dehydrated), e !== null)
        ? (t.mode & 1 ? (e.data === '$!' ? (t.lanes = 8) : (t.lanes = 1073741824)) : (t.lanes = 1), null)
        : ((i = r.children),
          (e = r.fallback),
          o
            ? ((r = t.mode),
              (o = t.child),
              (i = { mode: 'hidden', children: i }),
              !(r & 1) && o !== null ? ((o.childLanes = 0), (o.pendingProps = i)) : (o = pl(i, r, 0, null)),
              (e = _t(e, r, n, null)),
              (o.return = t),
              (e.return = t),
              (o.sibling = e),
              (t.child = o),
              (t.child.memoizedState = Lo(n)),
              (t.memoizedState = To),
              e)
            : Ei(t, i))
    );
  if (((l = e.memoizedState), l !== null && ((u = l.dehydrated), u !== null))) return dd(e, t, i, r, u, l, n);
  if (o) {
    (o = r.fallback), (i = t.mode), (l = e.child), (u = l.sibling);
    var s = { mode: 'hidden', children: r.children };
    return (
      !(i & 1) && t.child !== l
        ? ((r = t.child), (r.childLanes = 0), (r.pendingProps = s), (t.deletions = null))
        : ((r = ft(l, s)), (r.subtreeFlags = l.subtreeFlags & 14680064)),
      u !== null ? (o = ft(u, o)) : ((o = _t(o, i, n, null)), (o.flags |= 2)),
      (o.return = t),
      (r.return = t),
      (r.sibling = o),
      (t.child = r),
      (r = o),
      (o = t.child),
      (i = e.child.memoizedState),
      (i = i === null ? Lo(n) : { baseLanes: i.baseLanes | n, cachePool: null, transitions: i.transitions }),
      (o.memoizedState = i),
      (o.childLanes = e.childLanes & ~n),
      (t.memoizedState = To),
      r
    );
  }
  return (
    (o = e.child),
    (e = o.sibling),
    (r = ft(o, { mode: 'visible', children: r.children })),
    !(t.mode & 1) && (r.lanes = n),
    (r.return = t),
    (r.sibling = null),
    e !== null && ((n = t.deletions), n === null ? ((t.deletions = [e]), (t.flags |= 16)) : n.push(e)),
    (t.child = r),
    (t.memoizedState = null),
    r
  );
}
function Ei(e, t) {
  return (t = pl({ mode: 'visible', children: t }, e.mode, 0, null)), (t.return = e), (e.child = t);
}
function vr(e, t, n, r) {
  return r !== null && ai(r), tn(t, e.child, null, n), (e = Ei(t, t.pendingProps.children)), (e.flags |= 2), (t.memoizedState = null), e;
}
function dd(e, t, n, r, l, o, i) {
  if (n)
    return t.flags & 256
      ? ((t.flags &= -257), (r = Hl(Error(g(422)))), vr(e, t, i, r))
      : t.memoizedState !== null
      ? ((t.child = e.child), (t.flags |= 128), null)
      : ((o = r.fallback),
        (l = t.mode),
        (r = pl({ mode: 'visible', children: r.children }, l, 0, null)),
        (o = _t(o, l, i, null)),
        (o.flags |= 2),
        (r.return = t),
        (o.return = t),
        (r.sibling = o),
        (t.child = r),
        t.mode & 1 && tn(t, e.child, null, i),
        (t.child.memoizedState = Lo(i)),
        (t.memoizedState = To),
        o);
  if (!(t.mode & 1)) return vr(e, t, i, null);
  if (l.data === '$!') {
    if (((r = l.nextSibling && l.nextSibling.dataset), r)) var u = r.dgst;
    return (r = u), (o = Error(g(419))), (r = Hl(o, r, void 0)), vr(e, t, i, r);
  }
  if (((u = (i & e.childLanes) !== 0), de || u)) {
    if (((r = q), r !== null)) {
      switch (i & -i) {
        case 4:
          l = 2;
          break;
        case 16:
          l = 8;
          break;
        case 64:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
        case 67108864:
          l = 32;
          break;
        case 536870912:
          l = 268435456;
          break;
        default:
          l = 0;
      }
      (l = l & (r.suspendedLanes | i) ? 0 : l), l !== 0 && l !== o.retryLane && ((o.retryLane = l), Xe(e, l), Me(r, e, l, -1));
    }
    return zi(), (r = Hl(Error(g(421)))), vr(e, t, i, r);
  }
  return l.data === '$?'
    ? ((t.flags |= 128), (t.child = e.child), (t = _d.bind(null, e)), (l._reactRetry = t), null)
    : ((e = o.treeContext),
      (ye = ut(l.nextSibling)),
      (ge = t),
      ($ = !0),
      (Re = null),
      e !== null && ((xe[Ee++] = He), (xe[Ee++] = We), (xe[Ee++] = jt), (He = e.id), (We = e.overflow), (jt = t)),
      (t = Ei(t, r.children)),
      (t.flags |= 4096),
      t);
}
function Mu(e, t, n) {
  e.lanes |= t;
  var r = e.alternate;
  r !== null && (r.lanes |= t), Co(e.return, t, n);
}
function Wl(e, t, n, r, l) {
  var o = e.memoizedState;
  o === null
    ? (e.memoizedState = { isBackwards: t, rendering: null, renderingStartTime: 0, last: r, tail: n, tailMode: l })
    : ((o.isBackwards = t), (o.rendering = null), (o.renderingStartTime = 0), (o.last = r), (o.tail = n), (o.tailMode = l));
}
function $a(e, t, n) {
  var r = t.pendingProps,
    l = r.revealOrder,
    o = r.tail;
  if ((ie(e, t, r.children, n), (r = A.current), r & 2)) (r = (r & 1) | 2), (t.flags |= 128);
  else {
    if (e !== null && e.flags & 128)
      e: for (e = t.child; e !== null; ) {
        if (e.tag === 13) e.memoizedState !== null && Mu(e, n, t);
        else if (e.tag === 19) Mu(e, n, t);
        else if (e.child !== null) {
          (e.child.return = e), (e = e.child);
          continue;
        }
        if (e === t) break e;
        for (; e.sibling === null; ) {
          if (e.return === null || e.return === t) break e;
          e = e.return;
        }
        (e.sibling.return = e.return), (e = e.sibling);
      }
    r &= 1;
  }
  if ((O(A, r), !(t.mode & 1))) t.memoizedState = null;
  else
    switch (l) {
      case 'forwards':
        for (n = t.child, l = null; n !== null; ) (e = n.alternate), e !== null && Xr(e) === null && (l = n), (n = n.sibling);
        (n = l), n === null ? ((l = t.child), (t.child = null)) : ((l = n.sibling), (n.sibling = null)), Wl(t, !1, l, n, o);
        break;
      case 'backwards':
        for (n = null, l = t.child, t.child = null; l !== null; ) {
          if (((e = l.alternate), e !== null && Xr(e) === null)) {
            t.child = l;
            break;
          }
          (e = l.sibling), (l.sibling = n), (n = l), (l = e);
        }
        Wl(t, !0, n, null, o);
        break;
      case 'together':
        Wl(t, !1, null, null, void 0);
        break;
      default:
        t.memoizedState = null;
    }
  return t.child;
}
function Pr(e, t) {
  !(t.mode & 1) && e !== null && ((e.alternate = null), (t.alternate = null), (t.flags |= 2));
}
function Ge(e, t, n) {
  if ((e !== null && (t.dependencies = e.dependencies), (zt |= t.lanes), !(n & t.childLanes))) return null;
  if (e !== null && t.child !== e.child) throw Error(g(153));
  if (t.child !== null) {
    for (e = t.child, n = ft(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null; )
      (e = e.sibling), (n = n.sibling = ft(e, e.pendingProps)), (n.return = t);
    n.sibling = null;
  }
  return t.child;
}
function pd(e, t, n) {
  switch (t.tag) {
    case 3:
      Fa(t), en();
      break;
    case 5:
      da(t);
      break;
    case 1:
      he(t.type) && Br(t);
      break;
    case 4:
      mi(t, t.stateNode.containerInfo);
      break;
    case 10:
      var r = t.type._context,
        l = t.memoizedProps.value;
      O(Qr, r._currentValue), (r._currentValue = l);
      break;
    case 13:
      if (((r = t.memoizedState), r !== null))
        return r.dehydrated !== null
          ? (O(A, A.current & 1), (t.flags |= 128), null)
          : n & t.child.childLanes
          ? Ua(e, t, n)
          : (O(A, A.current & 1), (e = Ge(e, t, n)), e !== null ? e.sibling : null);
      O(A, A.current & 1);
      break;
    case 19:
      if (((r = (n & t.childLanes) !== 0), e.flags & 128)) {
        if (r) return $a(e, t, n);
        t.flags |= 128;
      }
      if (((l = t.memoizedState), l !== null && ((l.rendering = null), (l.tail = null), (l.lastEffect = null)), O(A, A.current), r)) break;
      return null;
    case 22:
    case 23:
      return (t.lanes = 0), Oa(e, t, n);
  }
  return Ge(e, t, n);
}
var Aa, Ro, Va, Ba;
Aa = function (e, t) {
  for (var n = t.child; n !== null; ) {
    if (n.tag === 5 || n.tag === 6) e.appendChild(n.stateNode);
    else if (n.tag !== 4 && n.child !== null) {
      (n.child.return = n), (n = n.child);
      continue;
    }
    if (n === t) break;
    for (; n.sibling === null; ) {
      if (n.return === null || n.return === t) return;
      n = n.return;
    }
    (n.sibling.return = n.return), (n = n.sibling);
  }
};
Ro = function () {};
Va = function (e, t, n, r) {
  var l = e.memoizedProps;
  if (l !== r) {
    (e = t.stateNode), Et(Ae.current);
    var o = null;
    switch (n) {
      case 'input':
        (l = bl(e, l)), (r = bl(e, r)), (o = []);
        break;
      case 'select':
        (l = B({}, l, { value: void 0 })), (r = B({}, r, { value: void 0 })), (o = []);
        break;
      case 'textarea':
        (l = no(e, l)), (r = no(e, r)), (o = []);
        break;
      default:
        typeof l.onClick != 'function' && typeof r.onClick == 'function' && (e.onclick = Ar);
    }
    lo(n, r);
    var i;
    n = null;
    for (a in l)
      if (!r.hasOwnProperty(a) && l.hasOwnProperty(a) && l[a] != null)
        if (a === 'style') {
          var u = l[a];
          for (i in u) u.hasOwnProperty(i) && (n || (n = {}), (n[i] = ''));
        } else
          a !== 'dangerouslySetInnerHTML' &&
            a !== 'children' &&
            a !== 'suppressContentEditableWarning' &&
            a !== 'suppressHydrationWarning' &&
            a !== 'autoFocus' &&
            (Rn.hasOwnProperty(a) ? o || (o = []) : (o = o || []).push(a, null));
    for (a in r) {
      var s = r[a];
      if (((u = l != null ? l[a] : void 0), r.hasOwnProperty(a) && s !== u && (s != null || u != null)))
        if (a === 'style')
          if (u) {
            for (i in u) !u.hasOwnProperty(i) || (s && s.hasOwnProperty(i)) || (n || (n = {}), (n[i] = ''));
            for (i in s) s.hasOwnProperty(i) && u[i] !== s[i] && (n || (n = {}), (n[i] = s[i]));
          } else n || (o || (o = []), o.push(a, n)), (n = s);
        else
          a === 'dangerouslySetInnerHTML'
            ? ((s = s ? s.__html : void 0), (u = u ? u.__html : void 0), s != null && u !== s && (o = o || []).push(a, s))
            : a === 'children'
            ? (typeof s != 'string' && typeof s != 'number') || (o = o || []).push(a, '' + s)
            : a !== 'suppressContentEditableWarning' &&
              a !== 'suppressHydrationWarning' &&
              (Rn.hasOwnProperty(a)
                ? (s != null && a === 'onScroll' && D('scroll', e), o || u === s || (o = []))
                : (o = o || []).push(a, s));
    }
    n && (o = o || []).push('style', n);
    var a = o;
    (t.updateQueue = a) && (t.flags |= 4);
  }
};
Ba = function (e, t, n, r) {
  n !== r && (t.flags |= 4);
};
function yn(e, t) {
  if (!$)
    switch (e.tailMode) {
      case 'hidden':
        t = e.tail;
        for (var n = null; t !== null; ) t.alternate !== null && (n = t), (t = t.sibling);
        n === null ? (e.tail = null) : (n.sibling = null);
        break;
      case 'collapsed':
        n = e.tail;
        for (var r = null; n !== null; ) n.alternate !== null && (r = n), (n = n.sibling);
        r === null ? (t || e.tail === null ? (e.tail = null) : (e.tail.sibling = null)) : (r.sibling = null);
    }
}
function re(e) {
  var t = e.alternate !== null && e.alternate.child === e.child,
    n = 0,
    r = 0;
  if (t)
    for (var l = e.child; l !== null; )
      (n |= l.lanes | l.childLanes), (r |= l.subtreeFlags & 14680064), (r |= l.flags & 14680064), (l.return = e), (l = l.sibling);
  else
    for (l = e.child; l !== null; ) (n |= l.lanes | l.childLanes), (r |= l.subtreeFlags), (r |= l.flags), (l.return = e), (l = l.sibling);
  return (e.subtreeFlags |= r), (e.childLanes = n), t;
}
function hd(e, t, n) {
  var r = t.pendingProps;
  switch ((si(t), t.tag)) {
    case 2:
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return re(t), null;
    case 1:
      return he(t.type) && Vr(), re(t), null;
    case 3:
      return (
        (r = t.stateNode),
        nn(),
        F(pe),
        F(oe),
        yi(),
        r.pendingContext && ((r.context = r.pendingContext), (r.pendingContext = null)),
        (e === null || e.child === null) &&
          (hr(t)
            ? (t.flags |= 4)
            : e === null ||
              (e.memoizedState.isDehydrated && !(t.flags & 256)) ||
              ((t.flags |= 1024), Re !== null && (Ao(Re), (Re = null)))),
        Ro(e, t),
        re(t),
        null
      );
    case 5:
      vi(t);
      var l = Et(Wn.current);
      if (((n = t.type), e !== null && t.stateNode != null)) Va(e, t, n, r, l), e.ref !== t.ref && ((t.flags |= 512), (t.flags |= 2097152));
      else {
        if (!r) {
          if (t.stateNode === null) throw Error(g(166));
          return re(t), null;
        }
        if (((e = Et(Ae.current)), hr(t))) {
          (r = t.stateNode), (n = t.type);
          var o = t.memoizedProps;
          switch (((r[Ue] = t), (r[Bn] = o), (e = (t.mode & 1) !== 0), n)) {
            case 'dialog':
              D('cancel', r), D('close', r);
              break;
            case 'iframe':
            case 'object':
            case 'embed':
              D('load', r);
              break;
            case 'video':
            case 'audio':
              for (l = 0; l < xn.length; l++) D(xn[l], r);
              break;
            case 'source':
              D('error', r);
              break;
            case 'img':
            case 'image':
            case 'link':
              D('error', r), D('load', r);
              break;
            case 'details':
              D('toggle', r);
              break;
            case 'input':
              Hi(r, o), D('invalid', r);
              break;
            case 'select':
              (r._wrapperState = { wasMultiple: !!o.multiple }), D('invalid', r);
              break;
            case 'textarea':
              Qi(r, o), D('invalid', r);
          }
          lo(n, o), (l = null);
          for (var i in o)
            if (o.hasOwnProperty(i)) {
              var u = o[i];
              i === 'children'
                ? typeof u == 'string'
                  ? r.textContent !== u && (o.suppressHydrationWarning !== !0 && pr(r.textContent, u, e), (l = ['children', u]))
                  : typeof u == 'number' &&
                    r.textContent !== '' + u &&
                    (o.suppressHydrationWarning !== !0 && pr(r.textContent, u, e), (l = ['children', '' + u]))
                : Rn.hasOwnProperty(i) && u != null && i === 'onScroll' && D('scroll', r);
            }
          switch (n) {
            case 'input':
              or(r), Wi(r, o, !0);
              break;
            case 'textarea':
              or(r), Ki(r);
              break;
            case 'select':
            case 'option':
              break;
            default:
              typeof o.onClick == 'function' && (r.onclick = Ar);
          }
          (r = l), (t.updateQueue = r), r !== null && (t.flags |= 4);
        } else {
          (i = l.nodeType === 9 ? l : l.ownerDocument),
            e === 'http://www.w3.org/1999/xhtml' && (e = ms(n)),
            e === 'http://www.w3.org/1999/xhtml'
              ? n === 'script'
                ? ((e = i.createElement('div')), (e.innerHTML = '<script></script>'), (e = e.removeChild(e.firstChild)))
                : typeof r.is == 'string'
                ? (e = i.createElement(n, { is: r.is }))
                : ((e = i.createElement(n)), n === 'select' && ((i = e), r.multiple ? (i.multiple = !0) : r.size && (i.size = r.size)))
              : (e = i.createElementNS(e, n)),
            (e[Ue] = t),
            (e[Bn] = r),
            Aa(e, t, !1, !1),
            (t.stateNode = e);
          e: {
            switch (((i = oo(n, r)), n)) {
              case 'dialog':
                D('cancel', e), D('close', e), (l = r);
                break;
              case 'iframe':
              case 'object':
              case 'embed':
                D('load', e), (l = r);
                break;
              case 'video':
              case 'audio':
                for (l = 0; l < xn.length; l++) D(xn[l], e);
                l = r;
                break;
              case 'source':
                D('error', e), (l = r);
                break;
              case 'img':
              case 'image':
              case 'link':
                D('error', e), D('load', e), (l = r);
                break;
              case 'details':
                D('toggle', e), (l = r);
                break;
              case 'input':
                Hi(e, r), (l = bl(e, r)), D('invalid', e);
                break;
              case 'option':
                l = r;
                break;
              case 'select':
                (e._wrapperState = { wasMultiple: !!r.multiple }), (l = B({}, r, { value: void 0 })), D('invalid', e);
                break;
              case 'textarea':
                Qi(e, r), (l = no(e, r)), D('invalid', e);
                break;
              default:
                l = r;
            }
            lo(n, l), (u = l);
            for (o in u)
              if (u.hasOwnProperty(o)) {
                var s = u[o];
                o === 'style'
                  ? gs(e, s)
                  : o === 'dangerouslySetInnerHTML'
                  ? ((s = s ? s.__html : void 0), s != null && vs(e, s))
                  : o === 'children'
                  ? typeof s == 'string'
                    ? (n !== 'textarea' || s !== '') && In(e, s)
                    : typeof s == 'number' && In(e, '' + s)
                  : o !== 'suppressContentEditableWarning' &&
                    o !== 'suppressHydrationWarning' &&
                    o !== 'autoFocus' &&
                    (Rn.hasOwnProperty(o) ? s != null && o === 'onScroll' && D('scroll', e) : s != null && Yo(e, o, s, i));
              }
            switch (n) {
              case 'input':
                or(e), Wi(e, r, !1);
                break;
              case 'textarea':
                or(e), Ki(e);
                break;
              case 'option':
                r.value != null && e.setAttribute('value', '' + dt(r.value));
                break;
              case 'select':
                (e.multiple = !!r.multiple),
                  (o = r.value),
                  o != null ? Kt(e, !!r.multiple, o, !1) : r.defaultValue != null && Kt(e, !!r.multiple, r.defaultValue, !0);
                break;
              default:
                typeof l.onClick == 'function' && (e.onclick = Ar);
            }
            switch (n) {
              case 'button':
              case 'input':
              case 'select':
              case 'textarea':
                r = !!r.autoFocus;
                break e;
              case 'img':
                r = !0;
                break e;
              default:
                r = !1;
            }
          }
          r && (t.flags |= 4);
        }
        t.ref !== null && ((t.flags |= 512), (t.flags |= 2097152));
      }
      return re(t), null;
    case 6:
      if (e && t.stateNode != null) Ba(e, t, e.memoizedProps, r);
      else {
        if (typeof r != 'string' && t.stateNode === null) throw Error(g(166));
        if (((n = Et(Wn.current)), Et(Ae.current), hr(t))) {
          if (((r = t.stateNode), (n = t.memoizedProps), (r[Ue] = t), (o = r.nodeValue !== n) && ((e = ge), e !== null)))
            switch (e.tag) {
              case 3:
                pr(r.nodeValue, n, (e.mode & 1) !== 0);
                break;
              case 5:
                e.memoizedProps.suppressHydrationWarning !== !0 && pr(r.nodeValue, n, (e.mode & 1) !== 0);
            }
          o && (t.flags |= 4);
        } else (r = (n.nodeType === 9 ? n : n.ownerDocument).createTextNode(r)), (r[Ue] = t), (t.stateNode = r);
      }
      return re(t), null;
    case 13:
      if ((F(A), (r = t.memoizedState), e === null || (e.memoizedState !== null && e.memoizedState.dehydrated !== null))) {
        if ($ && ye !== null && t.mode & 1 && !(t.flags & 128)) oa(), en(), (t.flags |= 98560), (o = !1);
        else if (((o = hr(t)), r !== null && r.dehydrated !== null)) {
          if (e === null) {
            if (!o) throw Error(g(318));
            if (((o = t.memoizedState), (o = o !== null ? o.dehydrated : null), !o)) throw Error(g(317));
            o[Ue] = t;
          } else en(), !(t.flags & 128) && (t.memoizedState = null), (t.flags |= 4);
          re(t), (o = !1);
        } else Re !== null && (Ao(Re), (Re = null)), (o = !0);
        if (!o) return t.flags & 65536 ? t : null;
      }
      return t.flags & 128
        ? ((t.lanes = n), t)
        : ((r = r !== null),
          r !== (e !== null && e.memoizedState !== null) &&
            r &&
            ((t.child.flags |= 8192), t.mode & 1 && (e === null || A.current & 1 ? G === 0 && (G = 3) : zi())),
          t.updateQueue !== null && (t.flags |= 4),
          re(t),
          null);
    case 4:
      return nn(), Ro(e, t), e === null && An(t.stateNode.containerInfo), re(t), null;
    case 10:
      return di(t.type._context), re(t), null;
    case 17:
      return he(t.type) && Vr(), re(t), null;
    case 19:
      if ((F(A), (o = t.memoizedState), o === null)) return re(t), null;
      if (((r = (t.flags & 128) !== 0), (i = o.rendering), i === null))
        if (r) yn(o, !1);
        else {
          if (G !== 0 || (e !== null && e.flags & 128))
            for (e = t.child; e !== null; ) {
              if (((i = Xr(e)), i !== null)) {
                for (
                  t.flags |= 128,
                    yn(o, !1),
                    r = i.updateQueue,
                    r !== null && ((t.updateQueue = r), (t.flags |= 4)),
                    t.subtreeFlags = 0,
                    r = n,
                    n = t.child;
                  n !== null;

                )
                  (o = n),
                    (e = r),
                    (o.flags &= 14680066),
                    (i = o.alternate),
                    i === null
                      ? ((o.childLanes = 0),
                        (o.lanes = e),
                        (o.child = null),
                        (o.subtreeFlags = 0),
                        (o.memoizedProps = null),
                        (o.memoizedState = null),
                        (o.updateQueue = null),
                        (o.dependencies = null),
                        (o.stateNode = null))
                      : ((o.childLanes = i.childLanes),
                        (o.lanes = i.lanes),
                        (o.child = i.child),
                        (o.subtreeFlags = 0),
                        (o.deletions = null),
                        (o.memoizedProps = i.memoizedProps),
                        (o.memoizedState = i.memoizedState),
                        (o.updateQueue = i.updateQueue),
                        (o.type = i.type),
                        (e = i.dependencies),
                        (o.dependencies = e === null ? null : { lanes: e.lanes, firstContext: e.firstContext })),
                    (n = n.sibling);
                return O(A, (A.current & 1) | 2), t.child;
              }
              e = e.sibling;
            }
          o.tail !== null && K() > ln && ((t.flags |= 128), (r = !0), yn(o, !1), (t.lanes = 4194304));
        }
      else {
        if (!r)
          if (((e = Xr(i)), e !== null)) {
            if (
              ((t.flags |= 128),
              (r = !0),
              (n = e.updateQueue),
              n !== null && ((t.updateQueue = n), (t.flags |= 4)),
              yn(o, !0),
              o.tail === null && o.tailMode === 'hidden' && !i.alternate && !$)
            )
              return re(t), null;
          } else 2 * K() - o.renderingStartTime > ln && n !== 1073741824 && ((t.flags |= 128), (r = !0), yn(o, !1), (t.lanes = 4194304));
        o.isBackwards ? ((i.sibling = t.child), (t.child = i)) : ((n = o.last), n !== null ? (n.sibling = i) : (t.child = i), (o.last = i));
      }
      return o.tail !== null
        ? ((t = o.tail),
          (o.rendering = t),
          (o.tail = t.sibling),
          (o.renderingStartTime = K()),
          (t.sibling = null),
          (n = A.current),
          O(A, r ? (n & 1) | 2 : n & 1),
          t)
        : (re(t), null);
    case 22:
    case 23:
      return (
        Pi(),
        (r = t.memoizedState !== null),
        e !== null && (e.memoizedState !== null) !== r && (t.flags |= 8192),
        r && t.mode & 1 ? ve & 1073741824 && (re(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : re(t),
        null
      );
    case 24:
      return null;
    case 25:
      return null;
  }
  throw Error(g(156, t.tag));
}
function md(e, t) {
  switch ((si(t), t.tag)) {
    case 1:
      return he(t.type) && Vr(), (e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null;
    case 3:
      return nn(), F(pe), F(oe), yi(), (e = t.flags), e & 65536 && !(e & 128) ? ((t.flags = (e & -65537) | 128), t) : null;
    case 5:
      return vi(t), null;
    case 13:
      if ((F(A), (e = t.memoizedState), e !== null && e.dehydrated !== null)) {
        if (t.alternate === null) throw Error(g(340));
        en();
      }
      return (e = t.flags), e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null;
    case 19:
      return F(A), null;
    case 4:
      return nn(), null;
    case 10:
      return di(t.type._context), null;
    case 22:
    case 23:
      return Pi(), null;
    case 24:
      return null;
    default:
      return null;
  }
}
var yr = !1,
  le = !1,
  vd = typeof WeakSet == 'function' ? WeakSet : Set,
  x = null;
function Wt(e, t) {
  var n = e.ref;
  if (n !== null)
    if (typeof n == 'function')
      try {
        n(null);
      } catch (r) {
        H(e, t, r);
      }
    else n.current = null;
}
function Io(e, t, n) {
  try {
    n();
  } catch (r) {
    H(e, t, r);
  }
}
var Ou = !1;
function yd(e, t) {
  if (((vo = Fr), (e = Ks()), ii(e))) {
    if ('selectionStart' in e) var n = { start: e.selectionStart, end: e.selectionEnd };
    else
      e: {
        n = ((n = e.ownerDocument) && n.defaultView) || window;
        var r = n.getSelection && n.getSelection();
        if (r && r.rangeCount !== 0) {
          n = r.anchorNode;
          var l = r.anchorOffset,
            o = r.focusNode;
          r = r.focusOffset;
          try {
            n.nodeType, o.nodeType;
          } catch {
            n = null;
            break e;
          }
          var i = 0,
            u = -1,
            s = -1,
            a = 0,
            v = 0,
            h = e,
            m = null;
          t: for (;;) {
            for (
              var S;
              h !== n || (l !== 0 && h.nodeType !== 3) || (u = i + l),
                h !== o || (r !== 0 && h.nodeType !== 3) || (s = i + r),
                h.nodeType === 3 && (i += h.nodeValue.length),
                (S = h.firstChild) !== null;

            )
              (m = h), (h = S);
            for (;;) {
              if (h === e) break t;
              if ((m === n && ++a === l && (u = i), m === o && ++v === r && (s = i), (S = h.nextSibling) !== null)) break;
              (h = m), (m = h.parentNode);
            }
            h = S;
          }
          n = u === -1 || s === -1 ? null : { start: u, end: s };
        } else n = null;
      }
    n = n || { start: 0, end: 0 };
  } else n = null;
  for (yo = { focusedElem: e, selectionRange: n }, Fr = !1, x = t; x !== null; )
    if (((t = x), (e = t.child), (t.subtreeFlags & 1028) !== 0 && e !== null)) (e.return = t), (x = e);
    else
      for (; x !== null; ) {
        t = x;
        try {
          var w = t.alternate;
          if (t.flags & 1024)
            switch (t.tag) {
              case 0:
              case 11:
              case 15:
                break;
              case 1:
                if (w !== null) {
                  var k = w.memoizedProps,
                    U = w.memoizedState,
                    f = t.stateNode,
                    c = f.getSnapshotBeforeUpdate(t.elementType === t.type ? k : Te(t.type, k), U);
                  f.__reactInternalSnapshotBeforeUpdate = c;
                }
                break;
              case 3:
                var d = t.stateNode.containerInfo;
                d.nodeType === 1 ? (d.textContent = '') : d.nodeType === 9 && d.documentElement && d.removeChild(d.documentElement);
                break;
              case 5:
              case 6:
              case 4:
              case 17:
                break;
              default:
                throw Error(g(163));
            }
        } catch (y) {
          H(t, t.return, y);
        }
        if (((e = t.sibling), e !== null)) {
          (e.return = t.return), (x = e);
          break;
        }
        x = t.return;
      }
  return (w = Ou), (Ou = !1), w;
}
function zn(e, t, n) {
  var r = t.updateQueue;
  if (((r = r !== null ? r.lastEffect : null), r !== null)) {
    var l = (r = r.next);
    do {
      if ((l.tag & e) === e) {
        var o = l.destroy;
        (l.destroy = void 0), o !== void 0 && Io(t, n, o);
      }
      l = l.next;
    } while (l !== r);
  }
}
function fl(e, t) {
  if (((t = t.updateQueue), (t = t !== null ? t.lastEffect : null), t !== null)) {
    var n = (t = t.next);
    do {
      if ((n.tag & e) === e) {
        var r = n.create;
        n.destroy = r();
      }
      n = n.next;
    } while (n !== t);
  }
}
function Mo(e) {
  var t = e.ref;
  if (t !== null) {
    var n = e.stateNode;
    switch (e.tag) {
      case 5:
        e = n;
        break;
      default:
        e = n;
    }
    typeof t == 'function' ? t(e) : (t.current = e);
  }
}
function Ha(e) {
  var t = e.alternate;
  t !== null && ((e.alternate = null), Ha(t)),
    (e.child = null),
    (e.deletions = null),
    (e.sibling = null),
    e.tag === 5 && ((t = e.stateNode), t !== null && (delete t[Ue], delete t[Bn], delete t[So], delete t[bf], delete t[ed])),
    (e.stateNode = null),
    (e.return = null),
    (e.dependencies = null),
    (e.memoizedProps = null),
    (e.memoizedState = null),
    (e.pendingProps = null),
    (e.stateNode = null),
    (e.updateQueue = null);
}
function Wa(e) {
  return e.tag === 5 || e.tag === 3 || e.tag === 4;
}
function Du(e) {
  e: for (;;) {
    for (; e.sibling === null; ) {
      if (e.return === null || Wa(e.return)) return null;
      e = e.return;
    }
    for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
      if (e.flags & 2 || e.child === null || e.tag === 4) continue e;
      (e.child.return = e), (e = e.child);
    }
    if (!(e.flags & 2)) return e.stateNode;
  }
}
function Oo(e, t, n) {
  var r = e.tag;
  if (r === 5 || r === 6)
    (e = e.stateNode),
      t
        ? n.nodeType === 8
          ? n.parentNode.insertBefore(e, t)
          : n.insertBefore(e, t)
        : (n.nodeType === 8 ? ((t = n.parentNode), t.insertBefore(e, n)) : ((t = n), t.appendChild(e)),
          (n = n._reactRootContainer),
          n != null || t.onclick !== null || (t.onclick = Ar));
  else if (r !== 4 && ((e = e.child), e !== null)) for (Oo(e, t, n), e = e.sibling; e !== null; ) Oo(e, t, n), (e = e.sibling);
}
function Do(e, t, n) {
  var r = e.tag;
  if (r === 5 || r === 6) (e = e.stateNode), t ? n.insertBefore(e, t) : n.appendChild(e);
  else if (r !== 4 && ((e = e.child), e !== null)) for (Do(e, t, n), e = e.sibling; e !== null; ) Do(e, t, n), (e = e.sibling);
}
var b = null,
  Le = !1;
function Je(e, t, n) {
  for (n = n.child; n !== null; ) Qa(e, t, n), (n = n.sibling);
}
function Qa(e, t, n) {
  if ($e && typeof $e.onCommitFiberUnmount == 'function')
    try {
      $e.onCommitFiberUnmount(rl, n);
    } catch {}
  switch (n.tag) {
    case 5:
      le || Wt(n, t);
    case 6:
      var r = b,
        l = Le;
      (b = null),
        Je(e, t, n),
        (b = r),
        (Le = l),
        b !== null &&
          (Le
            ? ((e = b), (n = n.stateNode), e.nodeType === 8 ? e.parentNode.removeChild(n) : e.removeChild(n))
            : b.removeChild(n.stateNode));
      break;
    case 18:
      b !== null &&
        (Le
          ? ((e = b), (n = n.stateNode), e.nodeType === 8 ? Fl(e.parentNode, n) : e.nodeType === 1 && Fl(e, n), Fn(e))
          : Fl(b, n.stateNode));
      break;
    case 4:
      (r = b), (l = Le), (b = n.stateNode.containerInfo), (Le = !0), Je(e, t, n), (b = r), (Le = l);
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (!le && ((r = n.updateQueue), r !== null && ((r = r.lastEffect), r !== null))) {
        l = r = r.next;
        do {
          var o = l,
            i = o.destroy;
          (o = o.tag), i !== void 0 && (o & 2 || o & 4) && Io(n, t, i), (l = l.next);
        } while (l !== r);
      }
      Je(e, t, n);
      break;
    case 1:
      if (!le && (Wt(n, t), (r = n.stateNode), typeof r.componentWillUnmount == 'function'))
        try {
          (r.props = n.memoizedProps), (r.state = n.memoizedState), r.componentWillUnmount();
        } catch (u) {
          H(n, t, u);
        }
      Je(e, t, n);
      break;
    case 21:
      Je(e, t, n);
      break;
    case 22:
      n.mode & 1 ? ((le = (r = le) || n.memoizedState !== null), Je(e, t, n), (le = r)) : Je(e, t, n);
      break;
    default:
      Je(e, t, n);
  }
}
function Fu(e) {
  var t = e.updateQueue;
  if (t !== null) {
    e.updateQueue = null;
    var n = e.stateNode;
    n === null && (n = e.stateNode = new vd()),
      t.forEach(function (r) {
        var l = Nd.bind(null, e, r);
        n.has(r) || (n.add(r), r.then(l, l));
      });
  }
}
function ze(e, t) {
  var n = t.deletions;
  if (n !== null)
    for (var r = 0; r < n.length; r++) {
      var l = n[r];
      try {
        var o = e,
          i = t,
          u = i;
        e: for (; u !== null; ) {
          switch (u.tag) {
            case 5:
              (b = u.stateNode), (Le = !1);
              break e;
            case 3:
              (b = u.stateNode.containerInfo), (Le = !0);
              break e;
            case 4:
              (b = u.stateNode.containerInfo), (Le = !0);
              break e;
          }
          u = u.return;
        }
        if (b === null) throw Error(g(160));
        Qa(o, i, l), (b = null), (Le = !1);
        var s = l.alternate;
        s !== null && (s.return = null), (l.return = null);
      } catch (a) {
        H(l, t, a);
      }
    }
  if (t.subtreeFlags & 12854) for (t = t.child; t !== null; ) Ka(t, e), (t = t.sibling);
}
function Ka(e, t) {
  var n = e.alternate,
    r = e.flags;
  switch (e.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      if ((ze(t, e), De(e), r & 4)) {
        try {
          zn(3, e, e.return), fl(3, e);
        } catch (k) {
          H(e, e.return, k);
        }
        try {
          zn(5, e, e.return);
        } catch (k) {
          H(e, e.return, k);
        }
      }
      break;
    case 1:
      ze(t, e), De(e), r & 512 && n !== null && Wt(n, n.return);
      break;
    case 5:
      if ((ze(t, e), De(e), r & 512 && n !== null && Wt(n, n.return), e.flags & 32)) {
        var l = e.stateNode;
        try {
          In(l, '');
        } catch (k) {
          H(e, e.return, k);
        }
      }
      if (r & 4 && ((l = e.stateNode), l != null)) {
        var o = e.memoizedProps,
          i = n !== null ? n.memoizedProps : o,
          u = e.type,
          s = e.updateQueue;
        if (((e.updateQueue = null), s !== null))
          try {
            u === 'input' && o.type === 'radio' && o.name != null && ps(l, o), oo(u, i);
            var a = oo(u, o);
            for (i = 0; i < s.length; i += 2) {
              var v = s[i],
                h = s[i + 1];
              v === 'style' ? gs(l, h) : v === 'dangerouslySetInnerHTML' ? vs(l, h) : v === 'children' ? In(l, h) : Yo(l, v, h, a);
            }
            switch (u) {
              case 'input':
                eo(l, o);
                break;
              case 'textarea':
                hs(l, o);
                break;
              case 'select':
                var m = l._wrapperState.wasMultiple;
                l._wrapperState.wasMultiple = !!o.multiple;
                var S = o.value;
                S != null
                  ? Kt(l, !!o.multiple, S, !1)
                  : m !== !!o.multiple &&
                    (o.defaultValue != null ? Kt(l, !!o.multiple, o.defaultValue, !0) : Kt(l, !!o.multiple, o.multiple ? [] : '', !1));
            }
            l[Bn] = o;
          } catch (k) {
            H(e, e.return, k);
          }
      }
      break;
    case 6:
      if ((ze(t, e), De(e), r & 4)) {
        if (e.stateNode === null) throw Error(g(162));
        (l = e.stateNode), (o = e.memoizedProps);
        try {
          l.nodeValue = o;
        } catch (k) {
          H(e, e.return, k);
        }
      }
      break;
    case 3:
      if ((ze(t, e), De(e), r & 4 && n !== null && n.memoizedState.isDehydrated))
        try {
          Fn(t.containerInfo);
        } catch (k) {
          H(e, e.return, k);
        }
      break;
    case 4:
      ze(t, e), De(e);
      break;
    case 13:
      ze(t, e),
        De(e),
        (l = e.child),
        l.flags & 8192 &&
          ((o = l.memoizedState !== null),
          (l.stateNode.isHidden = o),
          !o || (l.alternate !== null && l.alternate.memoizedState !== null) || (Ni = K())),
        r & 4 && Fu(e);
      break;
    case 22:
      if (
        ((v = n !== null && n.memoizedState !== null), e.mode & 1 ? ((le = (a = le) || v), ze(t, e), (le = a)) : ze(t, e), De(e), r & 8192)
      ) {
        if (((a = e.memoizedState !== null), (e.stateNode.isHidden = a) && !v && e.mode & 1))
          for (x = e, v = e.child; v !== null; ) {
            for (h = x = v; x !== null; ) {
              switch (((m = x), (S = m.child), m.tag)) {
                case 0:
                case 11:
                case 14:
                case 15:
                  zn(4, m, m.return);
                  break;
                case 1:
                  Wt(m, m.return);
                  var w = m.stateNode;
                  if (typeof w.componentWillUnmount == 'function') {
                    (r = m), (n = m.return);
                    try {
                      (t = r), (w.props = t.memoizedProps), (w.state = t.memoizedState), w.componentWillUnmount();
                    } catch (k) {
                      H(r, n, k);
                    }
                  }
                  break;
                case 5:
                  Wt(m, m.return);
                  break;
                case 22:
                  if (m.memoizedState !== null) {
                    $u(h);
                    continue;
                  }
              }
              S !== null ? ((S.return = m), (x = S)) : $u(h);
            }
            v = v.sibling;
          }
        e: for (v = null, h = e; ; ) {
          if (h.tag === 5) {
            if (v === null) {
              v = h;
              try {
                (l = h.stateNode),
                  a
                    ? ((o = l.style),
                      typeof o.setProperty == 'function' ? o.setProperty('display', 'none', 'important') : (o.display = 'none'))
                    : ((u = h.stateNode),
                      (s = h.memoizedProps.style),
                      (i = s != null && s.hasOwnProperty('display') ? s.display : null),
                      (u.style.display = ys('display', i)));
              } catch (k) {
                H(e, e.return, k);
              }
            }
          } else if (h.tag === 6) {
            if (v === null)
              try {
                h.stateNode.nodeValue = a ? '' : h.memoizedProps;
              } catch (k) {
                H(e, e.return, k);
              }
          } else if (((h.tag !== 22 && h.tag !== 23) || h.memoizedState === null || h === e) && h.child !== null) {
            (h.child.return = h), (h = h.child);
            continue;
          }
          if (h === e) break e;
          for (; h.sibling === null; ) {
            if (h.return === null || h.return === e) break e;
            v === h && (v = null), (h = h.return);
          }
          v === h && (v = null), (h.sibling.return = h.return), (h = h.sibling);
        }
      }
      break;
    case 19:
      ze(t, e), De(e), r & 4 && Fu(e);
      break;
    case 21:
      break;
    default:
      ze(t, e), De(e);
  }
}
function De(e) {
  var t = e.flags;
  if (t & 2) {
    try {
      e: {
        for (var n = e.return; n !== null; ) {
          if (Wa(n)) {
            var r = n;
            break e;
          }
          n = n.return;
        }
        throw Error(g(160));
      }
      switch (r.tag) {
        case 5:
          var l = r.stateNode;
          r.flags & 32 && (In(l, ''), (r.flags &= -33));
          var o = Du(e);
          Do(e, o, l);
          break;
        case 3:
        case 4:
          var i = r.stateNode.containerInfo,
            u = Du(e);
          Oo(e, u, i);
          break;
        default:
          throw Error(g(161));
      }
    } catch (s) {
      H(e, e.return, s);
    }
    e.flags &= -3;
  }
  t & 4096 && (e.flags &= -4097);
}
function gd(e, t, n) {
  (x = e), Ya(e);
}
function Ya(e, t, n) {
  for (var r = (e.mode & 1) !== 0; x !== null; ) {
    var l = x,
      o = l.child;
    if (l.tag === 22 && r) {
      var i = l.memoizedState !== null || yr;
      if (!i) {
        var u = l.alternate,
          s = (u !== null && u.memoizedState !== null) || le;
        u = yr;
        var a = le;
        if (((yr = i), (le = s) && !a))
          for (x = l; x !== null; )
            (i = x), (s = i.child), i.tag === 22 && i.memoizedState !== null ? Au(l) : s !== null ? ((s.return = i), (x = s)) : Au(l);
        for (; o !== null; ) (x = o), Ya(o), (o = o.sibling);
        (x = l), (yr = u), (le = a);
      }
      Uu(e);
    } else l.subtreeFlags & 8772 && o !== null ? ((o.return = l), (x = o)) : Uu(e);
  }
}
function Uu(e) {
  for (; x !== null; ) {
    var t = x;
    if (t.flags & 8772) {
      var n = t.alternate;
      try {
        if (t.flags & 8772)
          switch (t.tag) {
            case 0:
            case 11:
            case 15:
              le || fl(5, t);
              break;
            case 1:
              var r = t.stateNode;
              if (t.flags & 4 && !le)
                if (n === null) r.componentDidMount();
                else {
                  var l = t.elementType === t.type ? n.memoizedProps : Te(t.type, n.memoizedProps);
                  r.componentDidUpdate(l, n.memoizedState, r.__reactInternalSnapshotBeforeUpdate);
                }
              var o = t.updateQueue;
              o !== null && ku(t, o, r);
              break;
            case 3:
              var i = t.updateQueue;
              if (i !== null) {
                if (((n = null), t.child !== null))
                  switch (t.child.tag) {
                    case 5:
                      n = t.child.stateNode;
                      break;
                    case 1:
                      n = t.child.stateNode;
                  }
                ku(t, i, n);
              }
              break;
            case 5:
              var u = t.stateNode;
              if (n === null && t.flags & 4) {
                n = u;
                var s = t.memoizedProps;
                switch (t.type) {
                  case 'button':
                  case 'input':
                  case 'select':
                  case 'textarea':
                    s.autoFocus && n.focus();
                    break;
                  case 'img':
                    s.src && (n.src = s.src);
                }
              }
              break;
            case 6:
              break;
            case 4:
              break;
            case 12:
              break;
            case 13:
              if (t.memoizedState === null) {
                var a = t.alternate;
                if (a !== null) {
                  var v = a.memoizedState;
                  if (v !== null) {
                    var h = v.dehydrated;
                    h !== null && Fn(h);
                  }
                }
              }
              break;
            case 19:
            case 17:
            case 21:
            case 22:
            case 23:
            case 25:
              break;
            default:
              throw Error(g(163));
          }
        le || (t.flags & 512 && Mo(t));
      } catch (m) {
        H(t, t.return, m);
      }
    }
    if (t === e) {
      x = null;
      break;
    }
    if (((n = t.sibling), n !== null)) {
      (n.return = t.return), (x = n);
      break;
    }
    x = t.return;
  }
}
function $u(e) {
  for (; x !== null; ) {
    var t = x;
    if (t === e) {
      x = null;
      break;
    }
    var n = t.sibling;
    if (n !== null) {
      (n.return = t.return), (x = n);
      break;
    }
    x = t.return;
  }
}
function Au(e) {
  for (; x !== null; ) {
    var t = x;
    try {
      switch (t.tag) {
        case 0:
        case 11:
        case 15:
          var n = t.return;
          try {
            fl(4, t);
          } catch (s) {
            H(t, n, s);
          }
          break;
        case 1:
          var r = t.stateNode;
          if (typeof r.componentDidMount == 'function') {
            var l = t.return;
            try {
              r.componentDidMount();
            } catch (s) {
              H(t, l, s);
            }
          }
          var o = t.return;
          try {
            Mo(t);
          } catch (s) {
            H(t, o, s);
          }
          break;
        case 5:
          var i = t.return;
          try {
            Mo(t);
          } catch (s) {
            H(t, i, s);
          }
      }
    } catch (s) {
      H(t, t.return, s);
    }
    if (t === e) {
      x = null;
      break;
    }
    var u = t.sibling;
    if (u !== null) {
      (u.return = t.return), (x = u);
      break;
    }
    x = t.return;
  }
}
var wd = Math.ceil,
  Jr = Ze.ReactCurrentDispatcher,
  Ci = Ze.ReactCurrentOwner,
  _e = Ze.ReactCurrentBatchConfig,
  R = 0,
  q = null,
  Y = null,
  ee = 0,
  ve = 0,
  Qt = mt(0),
  G = 0,
  Xn = null,
  zt = 0,
  dl = 0,
  _i = 0,
  Tn = null,
  fe = null,
  Ni = 0,
  ln = 1 / 0,
  Ve = null,
  qr = !1,
  Fo = null,
  at = null,
  gr = !1,
  rt = null,
  br = 0,
  Ln = 0,
  Uo = null,
  zr = -1,
  Tr = 0;
function ue() {
  return R & 6 ? K() : zr !== -1 ? zr : (zr = K());
}
function ct(e) {
  return e.mode & 1
    ? R & 2 && ee !== 0
      ? ee & -ee
      : nd.transition !== null
      ? (Tr === 0 && (Tr = Ts()), Tr)
      : ((e = M), e !== 0 || ((e = window.event), (e = e === void 0 ? 16 : Fs(e.type))), e)
    : 1;
}
function Me(e, t, n, r) {
  if (50 < Ln) throw ((Ln = 0), (Uo = null), Error(g(185)));
  Zn(e, n, r),
    (!(R & 2) || e !== q) &&
      (e === q && (!(R & 2) && (dl |= n), G === 4 && tt(e, ee)),
      me(e, r),
      n === 1 && R === 0 && !(t.mode & 1) && ((ln = K() + 500), sl && vt()));
}
function me(e, t) {
  var n = e.callbackNode;
  tf(e, t);
  var r = Dr(e, e === q ? ee : 0);
  if (r === 0) n !== null && Gi(n), (e.callbackNode = null), (e.callbackPriority = 0);
  else if (((t = r & -r), e.callbackPriority !== t)) {
    if ((n != null && Gi(n), t === 1))
      e.tag === 0 ? td(Vu.bind(null, e)) : na(Vu.bind(null, e)),
        Jf(function () {
          !(R & 6) && vt();
        }),
        (n = null);
    else {
      switch (Ls(r)) {
        case 1:
          n = qo;
          break;
        case 4:
          n = Ps;
          break;
        case 16:
          n = Or;
          break;
        case 536870912:
          n = zs;
          break;
        default:
          n = Or;
      }
      n = tc(n, Xa.bind(null, e));
    }
    (e.callbackPriority = t), (e.callbackNode = n);
  }
}
function Xa(e, t) {
  if (((zr = -1), (Tr = 0), R & 6)) throw Error(g(327));
  var n = e.callbackNode;
  if (Jt() && e.callbackNode !== n) return null;
  var r = Dr(e, e === q ? ee : 0);
  if (r === 0) return null;
  if (r & 30 || r & e.expiredLanes || t) t = el(e, r);
  else {
    t = r;
    var l = R;
    R |= 2;
    var o = Za();
    (q !== e || ee !== t) && ((Ve = null), (ln = K() + 500), Ct(e, t));
    do
      try {
        xd();
        break;
      } catch (u) {
        Ga(e, u);
      }
    while (1);
    fi(), (Jr.current = o), (R = l), Y !== null ? (t = 0) : ((q = null), (ee = 0), (t = G));
  }
  if (t !== 0) {
    if ((t === 2 && ((l = co(e)), l !== 0 && ((r = l), (t = $o(e, l)))), t === 1)) throw ((n = Xn), Ct(e, 0), tt(e, r), me(e, K()), n);
    if (t === 6) tt(e, r);
    else {
      if (
        ((l = e.current.alternate),
        !(r & 30) && !Sd(l) && ((t = el(e, r)), t === 2 && ((o = co(e)), o !== 0 && ((r = o), (t = $o(e, o)))), t === 1))
      )
        throw ((n = Xn), Ct(e, 0), tt(e, r), me(e, K()), n);
      switch (((e.finishedWork = l), (e.finishedLanes = r), t)) {
        case 0:
        case 1:
          throw Error(g(345));
        case 2:
          St(e, fe, Ve);
          break;
        case 3:
          if ((tt(e, r), (r & 130023424) === r && ((t = Ni + 500 - K()), 10 < t))) {
            if (Dr(e, 0) !== 0) break;
            if (((l = e.suspendedLanes), (l & r) !== r)) {
              ue(), (e.pingedLanes |= e.suspendedLanes & l);
              break;
            }
            e.timeoutHandle = wo(St.bind(null, e, fe, Ve), t);
            break;
          }
          St(e, fe, Ve);
          break;
        case 4:
          if ((tt(e, r), (r & 4194240) === r)) break;
          for (t = e.eventTimes, l = -1; 0 < r; ) {
            var i = 31 - Ie(r);
            (o = 1 << i), (i = t[i]), i > l && (l = i), (r &= ~o);
          }
          if (
            ((r = l),
            (r = K() - r),
            (r =
              (120 > r ? 120 : 480 > r ? 480 : 1080 > r ? 1080 : 1920 > r ? 1920 : 3e3 > r ? 3e3 : 4320 > r ? 4320 : 1960 * wd(r / 1960)) -
              r),
            10 < r)
          ) {
            e.timeoutHandle = wo(St.bind(null, e, fe, Ve), r);
            break;
          }
          St(e, fe, Ve);
          break;
        case 5:
          St(e, fe, Ve);
          break;
        default:
          throw Error(g(329));
      }
    }
  }
  return me(e, K()), e.callbackNode === n ? Xa.bind(null, e) : null;
}
function $o(e, t) {
  var n = Tn;
  return (
    e.current.memoizedState.isDehydrated && (Ct(e, t).flags |= 256), (e = el(e, t)), e !== 2 && ((t = fe), (fe = n), t !== null && Ao(t)), e
  );
}
function Ao(e) {
  fe === null ? (fe = e) : fe.push.apply(fe, e);
}
function Sd(e) {
  for (var t = e; ; ) {
    if (t.flags & 16384) {
      var n = t.updateQueue;
      if (n !== null && ((n = n.stores), n !== null))
        for (var r = 0; r < n.length; r++) {
          var l = n[r],
            o = l.getSnapshot;
          l = l.value;
          try {
            if (!Oe(o(), l)) return !1;
          } catch {
            return !1;
          }
        }
    }
    if (((n = t.child), t.subtreeFlags & 16384 && n !== null)) (n.return = t), (t = n);
    else {
      if (t === e) break;
      for (; t.sibling === null; ) {
        if (t.return === null || t.return === e) return !0;
        t = t.return;
      }
      (t.sibling.return = t.return), (t = t.sibling);
    }
  }
  return !0;
}
function tt(e, t) {
  for (t &= ~_i, t &= ~dl, e.suspendedLanes |= t, e.pingedLanes &= ~t, e = e.expirationTimes; 0 < t; ) {
    var n = 31 - Ie(t),
      r = 1 << n;
    (e[n] = -1), (t &= ~r);
  }
}
function Vu(e) {
  if (R & 6) throw Error(g(327));
  Jt();
  var t = Dr(e, 0);
  if (!(t & 1)) return me(e, K()), null;
  var n = el(e, t);
  if (e.tag !== 0 && n === 2) {
    var r = co(e);
    r !== 0 && ((t = r), (n = $o(e, r)));
  }
  if (n === 1) throw ((n = Xn), Ct(e, 0), tt(e, t), me(e, K()), n);
  if (n === 6) throw Error(g(345));
  return (e.finishedWork = e.current.alternate), (e.finishedLanes = t), St(e, fe, Ve), me(e, K()), null;
}
function ji(e, t) {
  var n = R;
  R |= 1;
  try {
    return e(t);
  } finally {
    (R = n), R === 0 && ((ln = K() + 500), sl && vt());
  }
}
function Tt(e) {
  rt !== null && rt.tag === 0 && !(R & 6) && Jt();
  var t = R;
  R |= 1;
  var n = _e.transition,
    r = M;
  try {
    if (((_e.transition = null), (M = 1), e)) return e();
  } finally {
    (M = r), (_e.transition = n), (R = t), !(R & 6) && vt();
  }
}
function Pi() {
  (ve = Qt.current), F(Qt);
}
function Ct(e, t) {
  (e.finishedWork = null), (e.finishedLanes = 0);
  var n = e.timeoutHandle;
  if ((n !== -1 && ((e.timeoutHandle = -1), Zf(n)), Y !== null))
    for (n = Y.return; n !== null; ) {
      var r = n;
      switch ((si(r), r.tag)) {
        case 1:
          (r = r.type.childContextTypes), r != null && Vr();
          break;
        case 3:
          nn(), F(pe), F(oe), yi();
          break;
        case 5:
          vi(r);
          break;
        case 4:
          nn();
          break;
        case 13:
          F(A);
          break;
        case 19:
          F(A);
          break;
        case 10:
          di(r.type._context);
          break;
        case 22:
        case 23:
          Pi();
      }
      n = n.return;
    }
  if (((q = e), (Y = e = ft(e.current, null)), (ee = ve = t), (G = 0), (Xn = null), (_i = dl = zt = 0), (fe = Tn = null), xt !== null)) {
    for (t = 0; t < xt.length; t++)
      if (((n = xt[t]), (r = n.interleaved), r !== null)) {
        n.interleaved = null;
        var l = r.next,
          o = n.pending;
        if (o !== null) {
          var i = o.next;
          (o.next = l), (r.next = i);
        }
        n.pending = r;
      }
    xt = null;
  }
  return e;
}
function Ga(e, t) {
  do {
    var n = Y;
    try {
      if ((fi(), (Nr.current = Zr), Gr)) {
        for (var r = V.memoizedState; r !== null; ) {
          var l = r.queue;
          l !== null && (l.pending = null), (r = r.next);
        }
        Gr = !1;
      }
      if (((Pt = 0), (J = X = V = null), (Pn = !1), (Qn = 0), (Ci.current = null), n === null || n.return === null)) {
        (G = 1), (Xn = t), (Y = null);
        break;
      }
      e: {
        var o = e,
          i = n.return,
          u = n,
          s = t;
        if (((t = ee), (u.flags |= 32768), s !== null && typeof s == 'object' && typeof s.then == 'function')) {
          var a = s,
            v = u,
            h = v.tag;
          if (!(v.mode & 1) && (h === 0 || h === 11 || h === 15)) {
            var m = v.alternate;
            m
              ? ((v.updateQueue = m.updateQueue), (v.memoizedState = m.memoizedState), (v.lanes = m.lanes))
              : ((v.updateQueue = null), (v.memoizedState = null));
          }
          var S = Pu(i);
          if (S !== null) {
            (S.flags &= -257), zu(S, i, u, o, t), S.mode & 1 && ju(o, a, t), (t = S), (s = a);
            var w = t.updateQueue;
            if (w === null) {
              var k = new Set();
              k.add(s), (t.updateQueue = k);
            } else w.add(s);
            break e;
          } else {
            if (!(t & 1)) {
              ju(o, a, t), zi();
              break e;
            }
            s = Error(g(426));
          }
        } else if ($ && u.mode & 1) {
          var U = Pu(i);
          if (U !== null) {
            !(U.flags & 65536) && (U.flags |= 256), zu(U, i, u, o, t), ai(rn(s, u));
            break e;
          }
        }
        (o = s = rn(s, u)), G !== 4 && (G = 2), Tn === null ? (Tn = [o]) : Tn.push(o), (o = i);
        do {
          switch (o.tag) {
            case 3:
              (o.flags |= 65536), (t &= -t), (o.lanes |= t);
              var f = Ra(o, s, t);
              Su(o, f);
              break e;
            case 1:
              u = s;
              var c = o.type,
                d = o.stateNode;
              if (
                !(o.flags & 128) &&
                (typeof c.getDerivedStateFromError == 'function' ||
                  (d !== null && typeof d.componentDidCatch == 'function' && (at === null || !at.has(d))))
              ) {
                (o.flags |= 65536), (t &= -t), (o.lanes |= t);
                var y = Ia(o, u, t);
                Su(o, y);
                break e;
              }
          }
          o = o.return;
        } while (o !== null);
      }
      qa(n);
    } catch (E) {
      (t = E), Y === n && n !== null && (Y = n = n.return);
      continue;
    }
    break;
  } while (1);
}
function Za() {
  var e = Jr.current;
  return (Jr.current = Zr), e === null ? Zr : e;
}
function zi() {
  (G === 0 || G === 3 || G === 2) && (G = 4), q === null || (!(zt & 268435455) && !(dl & 268435455)) || tt(q, ee);
}
function el(e, t) {
  var n = R;
  R |= 2;
  var r = Za();
  (q !== e || ee !== t) && ((Ve = null), Ct(e, t));
  do
    try {
      kd();
      break;
    } catch (l) {
      Ga(e, l);
    }
  while (1);
  if ((fi(), (R = n), (Jr.current = r), Y !== null)) throw Error(g(261));
  return (q = null), (ee = 0), G;
}
function kd() {
  for (; Y !== null; ) Ja(Y);
}
function xd() {
  for (; Y !== null && !Kc(); ) Ja(Y);
}
function Ja(e) {
  var t = ec(e.alternate, e, ve);
  (e.memoizedProps = e.pendingProps), t === null ? qa(e) : (Y = t), (Ci.current = null);
}
function qa(e) {
  var t = e;
  do {
    var n = t.alternate;
    if (((e = t.return), t.flags & 32768)) {
      if (((n = md(n, t)), n !== null)) {
        (n.flags &= 32767), (Y = n);
        return;
      }
      if (e !== null) (e.flags |= 32768), (e.subtreeFlags = 0), (e.deletions = null);
      else {
        (G = 6), (Y = null);
        return;
      }
    } else if (((n = hd(n, t, ve)), n !== null)) {
      Y = n;
      return;
    }
    if (((t = t.sibling), t !== null)) {
      Y = t;
      return;
    }
    Y = t = e;
  } while (t !== null);
  G === 0 && (G = 5);
}
function St(e, t, n) {
  var r = M,
    l = _e.transition;
  try {
    (_e.transition = null), (M = 1), Ed(e, t, n, r);
  } finally {
    (_e.transition = l), (M = r);
  }
  return null;
}
function Ed(e, t, n, r) {
  do Jt();
  while (rt !== null);
  if (R & 6) throw Error(g(327));
  n = e.finishedWork;
  var l = e.finishedLanes;
  if (n === null) return null;
  if (((e.finishedWork = null), (e.finishedLanes = 0), n === e.current)) throw Error(g(177));
  (e.callbackNode = null), (e.callbackPriority = 0);
  var o = n.lanes | n.childLanes;
  if (
    (nf(e, o),
    e === q && ((Y = q = null), (ee = 0)),
    (!(n.subtreeFlags & 2064) && !(n.flags & 2064)) ||
      gr ||
      ((gr = !0),
      tc(Or, function () {
        return Jt(), null;
      })),
    (o = (n.flags & 15990) !== 0),
    n.subtreeFlags & 15990 || o)
  ) {
    (o = _e.transition), (_e.transition = null);
    var i = M;
    M = 1;
    var u = R;
    (R |= 4),
      (Ci.current = null),
      yd(e, n),
      Ka(n, e),
      Hf(yo),
      (Fr = !!vo),
      (yo = vo = null),
      (e.current = n),
      gd(n),
      Yc(),
      (R = u),
      (M = i),
      (_e.transition = o);
  } else e.current = n;
  if ((gr && ((gr = !1), (rt = e), (br = l)), (o = e.pendingLanes), o === 0 && (at = null), Zc(n.stateNode), me(e, K()), t !== null))
    for (r = e.onRecoverableError, n = 0; n < t.length; n++) (l = t[n]), r(l.value, { componentStack: l.stack, digest: l.digest });
  if (qr) throw ((qr = !1), (e = Fo), (Fo = null), e);
  return br & 1 && e.tag !== 0 && Jt(), (o = e.pendingLanes), o & 1 ? (e === Uo ? Ln++ : ((Ln = 0), (Uo = e))) : (Ln = 0), vt(), null;
}
function Jt() {
  if (rt !== null) {
    var e = Ls(br),
      t = _e.transition,
      n = M;
    try {
      if (((_e.transition = null), (M = 16 > e ? 16 : e), rt === null)) var r = !1;
      else {
        if (((e = rt), (rt = null), (br = 0), R & 6)) throw Error(g(331));
        var l = R;
        for (R |= 4, x = e.current; x !== null; ) {
          var o = x,
            i = o.child;
          if (x.flags & 16) {
            var u = o.deletions;
            if (u !== null) {
              for (var s = 0; s < u.length; s++) {
                var a = u[s];
                for (x = a; x !== null; ) {
                  var v = x;
                  switch (v.tag) {
                    case 0:
                    case 11:
                    case 15:
                      zn(8, v, o);
                  }
                  var h = v.child;
                  if (h !== null) (h.return = v), (x = h);
                  else
                    for (; x !== null; ) {
                      v = x;
                      var m = v.sibling,
                        S = v.return;
                      if ((Ha(v), v === a)) {
                        x = null;
                        break;
                      }
                      if (m !== null) {
                        (m.return = S), (x = m);
                        break;
                      }
                      x = S;
                    }
                }
              }
              var w = o.alternate;
              if (w !== null) {
                var k = w.child;
                if (k !== null) {
                  w.child = null;
                  do {
                    var U = k.sibling;
                    (k.sibling = null), (k = U);
                  } while (k !== null);
                }
              }
              x = o;
            }
          }
          if (o.subtreeFlags & 2064 && i !== null) (i.return = o), (x = i);
          else
            e: for (; x !== null; ) {
              if (((o = x), o.flags & 2048))
                switch (o.tag) {
                  case 0:
                  case 11:
                  case 15:
                    zn(9, o, o.return);
                }
              var f = o.sibling;
              if (f !== null) {
                (f.return = o.return), (x = f);
                break e;
              }
              x = o.return;
            }
        }
        var c = e.current;
        for (x = c; x !== null; ) {
          i = x;
          var d = i.child;
          if (i.subtreeFlags & 2064 && d !== null) (d.return = i), (x = d);
          else
            e: for (i = c; x !== null; ) {
              if (((u = x), u.flags & 2048))
                try {
                  switch (u.tag) {
                    case 0:
                    case 11:
                    case 15:
                      fl(9, u);
                  }
                } catch (E) {
                  H(u, u.return, E);
                }
              if (u === i) {
                x = null;
                break e;
              }
              var y = u.sibling;
              if (y !== null) {
                (y.return = u.return), (x = y);
                break e;
              }
              x = u.return;
            }
        }
        if (((R = l), vt(), $e && typeof $e.onPostCommitFiberRoot == 'function'))
          try {
            $e.onPostCommitFiberRoot(rl, e);
          } catch {}
        r = !0;
      }
      return r;
    } finally {
      (M = n), (_e.transition = t);
    }
  }
  return !1;
}
function Bu(e, t, n) {
  (t = rn(n, t)), (t = Ra(e, t, 1)), (e = st(e, t, 1)), (t = ue()), e !== null && (Zn(e, 1, t), me(e, t));
}
function H(e, t, n) {
  if (e.tag === 3) Bu(e, e, n);
  else
    for (; t !== null; ) {
      if (t.tag === 3) {
        Bu(t, e, n);
        break;
      } else if (t.tag === 1) {
        var r = t.stateNode;
        if (
          typeof t.type.getDerivedStateFromError == 'function' ||
          (typeof r.componentDidCatch == 'function' && (at === null || !at.has(r)))
        ) {
          (e = rn(n, e)), (e = Ia(t, e, 1)), (t = st(t, e, 1)), (e = ue()), t !== null && (Zn(t, 1, e), me(t, e));
          break;
        }
      }
      t = t.return;
    }
}
function Cd(e, t, n) {
  var r = e.pingCache;
  r !== null && r.delete(t),
    (t = ue()),
    (e.pingedLanes |= e.suspendedLanes & n),
    q === e && (ee & n) === n && (G === 4 || (G === 3 && (ee & 130023424) === ee && 500 > K() - Ni) ? Ct(e, 0) : (_i |= n)),
    me(e, t);
}
function ba(e, t) {
  t === 0 && (e.mode & 1 ? ((t = sr), (sr <<= 1), !(sr & 130023424) && (sr = 4194304)) : (t = 1));
  var n = ue();
  (e = Xe(e, t)), e !== null && (Zn(e, t, n), me(e, n));
}
function _d(e) {
  var t = e.memoizedState,
    n = 0;
  t !== null && (n = t.retryLane), ba(e, n);
}
function Nd(e, t) {
  var n = 0;
  switch (e.tag) {
    case 13:
      var r = e.stateNode,
        l = e.memoizedState;
      l !== null && (n = l.retryLane);
      break;
    case 19:
      r = e.stateNode;
      break;
    default:
      throw Error(g(314));
  }
  r !== null && r.delete(t), ba(e, n);
}
var ec;
ec = function (e, t, n) {
  if (e !== null)
    if (e.memoizedProps !== t.pendingProps || pe.current) de = !0;
    else {
      if (!(e.lanes & n) && !(t.flags & 128)) return (de = !1), pd(e, t, n);
      de = !!(e.flags & 131072);
    }
  else (de = !1), $ && t.flags & 1048576 && ra(t, Wr, t.index);
  switch (((t.lanes = 0), t.tag)) {
    case 2:
      var r = t.type;
      Pr(e, t), (e = t.pendingProps);
      var l = bt(t, oe.current);
      Zt(t, n), (l = wi(null, t, r, e, l, n));
      var o = Si();
      return (
        (t.flags |= 1),
        typeof l == 'object' && l !== null && typeof l.render == 'function' && l.$$typeof === void 0
          ? ((t.tag = 1),
            (t.memoizedState = null),
            (t.updateQueue = null),
            he(r) ? ((o = !0), Br(t)) : (o = !1),
            (t.memoizedState = l.state !== null && l.state !== void 0 ? l.state : null),
            hi(t),
            (l.updater = al),
            (t.stateNode = l),
            (l._reactInternals = t),
            No(t, r, e, n),
            (t = zo(null, t, r, !0, o, n)))
          : ((t.tag = 0), $ && o && ui(t), ie(null, t, l, n), (t = t.child)),
        t
      );
    case 16:
      r = t.elementType;
      e: {
        switch (
          (Pr(e, t), (e = t.pendingProps), (l = r._init), (r = l(r._payload)), (t.type = r), (l = t.tag = Pd(r)), (e = Te(r, e)), l)
        ) {
          case 0:
            t = Po(null, t, r, e, n);
            break e;
          case 1:
            t = Ru(null, t, r, e, n);
            break e;
          case 11:
            t = Tu(null, t, r, e, n);
            break e;
          case 14:
            t = Lu(null, t, r, Te(r.type, e), n);
            break e;
        }
        throw Error(g(306, r, ''));
      }
      return t;
    case 0:
      return (r = t.type), (l = t.pendingProps), (l = t.elementType === r ? l : Te(r, l)), Po(e, t, r, l, n);
    case 1:
      return (r = t.type), (l = t.pendingProps), (l = t.elementType === r ? l : Te(r, l)), Ru(e, t, r, l, n);
    case 3:
      e: {
        if ((Fa(t), e === null)) throw Error(g(387));
        (r = t.pendingProps), (o = t.memoizedState), (l = o.element), ua(e, t), Yr(t, r, null, n);
        var i = t.memoizedState;
        if (((r = i.element), o.isDehydrated))
          if (
            ((o = {
              element: r,
              isDehydrated: !1,
              cache: i.cache,
              pendingSuspenseBoundaries: i.pendingSuspenseBoundaries,
              transitions: i.transitions,
            }),
            (t.updateQueue.baseState = o),
            (t.memoizedState = o),
            t.flags & 256)
          ) {
            (l = rn(Error(g(423)), t)), (t = Iu(e, t, r, n, l));
            break e;
          } else if (r !== l) {
            (l = rn(Error(g(424)), t)), (t = Iu(e, t, r, n, l));
            break e;
          } else
            for (ye = ut(t.stateNode.containerInfo.firstChild), ge = t, $ = !0, Re = null, n = fa(t, null, r, n), t.child = n; n; )
              (n.flags = (n.flags & -3) | 4096), (n = n.sibling);
        else {
          if ((en(), r === l)) {
            t = Ge(e, t, n);
            break e;
          }
          ie(e, t, r, n);
        }
        t = t.child;
      }
      return t;
    case 5:
      return (
        da(t),
        e === null && Eo(t),
        (r = t.type),
        (l = t.pendingProps),
        (o = e !== null ? e.memoizedProps : null),
        (i = l.children),
        go(r, l) ? (i = null) : o !== null && go(r, o) && (t.flags |= 32),
        Da(e, t),
        ie(e, t, i, n),
        t.child
      );
    case 6:
      return e === null && Eo(t), null;
    case 13:
      return Ua(e, t, n);
    case 4:
      return mi(t, t.stateNode.containerInfo), (r = t.pendingProps), e === null ? (t.child = tn(t, null, r, n)) : ie(e, t, r, n), t.child;
    case 11:
      return (r = t.type), (l = t.pendingProps), (l = t.elementType === r ? l : Te(r, l)), Tu(e, t, r, l, n);
    case 7:
      return ie(e, t, t.pendingProps, n), t.child;
    case 8:
      return ie(e, t, t.pendingProps.children, n), t.child;
    case 12:
      return ie(e, t, t.pendingProps.children, n), t.child;
    case 10:
      e: {
        if (
          ((r = t.type._context),
          (l = t.pendingProps),
          (o = t.memoizedProps),
          (i = l.value),
          O(Qr, r._currentValue),
          (r._currentValue = i),
          o !== null)
        )
          if (Oe(o.value, i)) {
            if (o.children === l.children && !pe.current) {
              t = Ge(e, t, n);
              break e;
            }
          } else
            for (o = t.child, o !== null && (o.return = t); o !== null; ) {
              var u = o.dependencies;
              if (u !== null) {
                i = o.child;
                for (var s = u.firstContext; s !== null; ) {
                  if (s.context === r) {
                    if (o.tag === 1) {
                      (s = Qe(-1, n & -n)), (s.tag = 2);
                      var a = o.updateQueue;
                      if (a !== null) {
                        a = a.shared;
                        var v = a.pending;
                        v === null ? (s.next = s) : ((s.next = v.next), (v.next = s)), (a.pending = s);
                      }
                    }
                    (o.lanes |= n), (s = o.alternate), s !== null && (s.lanes |= n), Co(o.return, n, t), (u.lanes |= n);
                    break;
                  }
                  s = s.next;
                }
              } else if (o.tag === 10) i = o.type === t.type ? null : o.child;
              else if (o.tag === 18) {
                if (((i = o.return), i === null)) throw Error(g(341));
                (i.lanes |= n), (u = i.alternate), u !== null && (u.lanes |= n), Co(i, n, t), (i = o.sibling);
              } else i = o.child;
              if (i !== null) i.return = o;
              else
                for (i = o; i !== null; ) {
                  if (i === t) {
                    i = null;
                    break;
                  }
                  if (((o = i.sibling), o !== null)) {
                    (o.return = i.return), (i = o);
                    break;
                  }
                  i = i.return;
                }
              o = i;
            }
        ie(e, t, l.children, n), (t = t.child);
      }
      return t;
    case 9:
      return (l = t.type), (r = t.pendingProps.children), Zt(t, n), (l = Ne(l)), (r = r(l)), (t.flags |= 1), ie(e, t, r, n), t.child;
    case 14:
      return (r = t.type), (l = Te(r, t.pendingProps)), (l = Te(r.type, l)), Lu(e, t, r, l, n);
    case 15:
      return Ma(e, t, t.type, t.pendingProps, n);
    case 17:
      return (
        (r = t.type),
        (l = t.pendingProps),
        (l = t.elementType === r ? l : Te(r, l)),
        Pr(e, t),
        (t.tag = 1),
        he(r) ? ((e = !0), Br(t)) : (e = !1),
        Zt(t, n),
        aa(t, r, l),
        No(t, r, l, n),
        zo(null, t, r, !0, e, n)
      );
    case 19:
      return $a(e, t, n);
    case 22:
      return Oa(e, t, n);
  }
  throw Error(g(156, t.tag));
};
function tc(e, t) {
  return js(e, t);
}
function jd(e, t, n, r) {
  (this.tag = e),
    (this.key = n),
    (this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null),
    (this.index = 0),
    (this.ref = null),
    (this.pendingProps = t),
    (this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null),
    (this.mode = r),
    (this.subtreeFlags = this.flags = 0),
    (this.deletions = null),
    (this.childLanes = this.lanes = 0),
    (this.alternate = null);
}
function Ce(e, t, n, r) {
  return new jd(e, t, n, r);
}
function Ti(e) {
  return (e = e.prototype), !(!e || !e.isReactComponent);
}
function Pd(e) {
  if (typeof e == 'function') return Ti(e) ? 1 : 0;
  if (e != null) {
    if (((e = e.$$typeof), e === Go)) return 11;
    if (e === Zo) return 14;
  }
  return 2;
}
function ft(e, t) {
  var n = e.alternate;
  return (
    n === null
      ? ((n = Ce(e.tag, t, e.key, e.mode)),
        (n.elementType = e.elementType),
        (n.type = e.type),
        (n.stateNode = e.stateNode),
        (n.alternate = e),
        (e.alternate = n))
      : ((n.pendingProps = t), (n.type = e.type), (n.flags = 0), (n.subtreeFlags = 0), (n.deletions = null)),
    (n.flags = e.flags & 14680064),
    (n.childLanes = e.childLanes),
    (n.lanes = e.lanes),
    (n.child = e.child),
    (n.memoizedProps = e.memoizedProps),
    (n.memoizedState = e.memoizedState),
    (n.updateQueue = e.updateQueue),
    (t = e.dependencies),
    (n.dependencies = t === null ? null : { lanes: t.lanes, firstContext: t.firstContext }),
    (n.sibling = e.sibling),
    (n.index = e.index),
    (n.ref = e.ref),
    n
  );
}
function Lr(e, t, n, r, l, o) {
  var i = 2;
  if (((r = e), typeof e == 'function')) Ti(e) && (i = 1);
  else if (typeof e == 'string') i = 5;
  else
    e: switch (e) {
      case Ot:
        return _t(n.children, l, o, t);
      case Xo:
        (i = 8), (l |= 8);
        break;
      case Gl:
        return (e = Ce(12, n, t, l | 2)), (e.elementType = Gl), (e.lanes = o), e;
      case Zl:
        return (e = Ce(13, n, t, l)), (e.elementType = Zl), (e.lanes = o), e;
      case Jl:
        return (e = Ce(19, n, t, l)), (e.elementType = Jl), (e.lanes = o), e;
      case cs:
        return pl(n, l, o, t);
      default:
        if (typeof e == 'object' && e !== null)
          switch (e.$$typeof) {
            case ss:
              i = 10;
              break e;
            case as:
              i = 9;
              break e;
            case Go:
              i = 11;
              break e;
            case Zo:
              i = 14;
              break e;
            case qe:
              (i = 16), (r = null);
              break e;
          }
        throw Error(g(130, e == null ? e : typeof e, ''));
    }
  return (t = Ce(i, n, t, l)), (t.elementType = e), (t.type = r), (t.lanes = o), t;
}
function _t(e, t, n, r) {
  return (e = Ce(7, e, r, t)), (e.lanes = n), e;
}
function pl(e, t, n, r) {
  return (e = Ce(22, e, r, t)), (e.elementType = cs), (e.lanes = n), (e.stateNode = { isHidden: !1 }), e;
}
function Ql(e, t, n) {
  return (e = Ce(6, e, null, t)), (e.lanes = n), e;
}
function Kl(e, t, n) {
  return (
    (t = Ce(4, e.children !== null ? e.children : [], e.key, t)),
    (t.lanes = n),
    (t.stateNode = { containerInfo: e.containerInfo, pendingChildren: null, implementation: e.implementation }),
    t
  );
}
function zd(e, t, n, r, l) {
  (this.tag = t),
    (this.containerInfo = e),
    (this.finishedWork = this.pingCache = this.current = this.pendingChildren = null),
    (this.timeoutHandle = -1),
    (this.callbackNode = this.pendingContext = this.context = null),
    (this.callbackPriority = 0),
    (this.eventTimes = Nl(0)),
    (this.expirationTimes = Nl(-1)),
    (this.entangledLanes =
      this.finishedLanes =
      this.mutableReadLanes =
      this.expiredLanes =
      this.pingedLanes =
      this.suspendedLanes =
      this.pendingLanes =
        0),
    (this.entanglements = Nl(0)),
    (this.identifierPrefix = r),
    (this.onRecoverableError = l),
    (this.mutableSourceEagerHydrationData = null);
}
function Li(e, t, n, r, l, o, i, u, s) {
  return (
    (e = new zd(e, t, n, u, s)),
    t === 1 ? ((t = 1), o === !0 && (t |= 8)) : (t = 0),
    (o = Ce(3, null, null, t)),
    (e.current = o),
    (o.stateNode = e),
    (o.memoizedState = { element: r, isDehydrated: n, cache: null, transitions: null, pendingSuspenseBoundaries: null }),
    hi(o),
    e
  );
}
function Td(e, t, n) {
  var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
  return { $$typeof: Mt, key: r == null ? null : '' + r, children: e, containerInfo: t, implementation: n };
}
function nc(e) {
  if (!e) return pt;
  e = e._reactInternals;
  e: {
    if (Rt(e) !== e || e.tag !== 1) throw Error(g(170));
    var t = e;
    do {
      switch (t.tag) {
        case 3:
          t = t.stateNode.context;
          break e;
        case 1:
          if (he(t.type)) {
            t = t.stateNode.__reactInternalMemoizedMergedChildContext;
            break e;
          }
      }
      t = t.return;
    } while (t !== null);
    throw Error(g(171));
  }
  if (e.tag === 1) {
    var n = e.type;
    if (he(n)) return ta(e, n, t);
  }
  return t;
}
function rc(e, t, n, r, l, o, i, u, s) {
  return (
    (e = Li(n, r, !0, e, l, o, i, u, s)),
    (e.context = nc(null)),
    (n = e.current),
    (r = ue()),
    (l = ct(n)),
    (o = Qe(r, l)),
    (o.callback = t ?? null),
    st(n, o, l),
    (e.current.lanes = l),
    Zn(e, l, r),
    me(e, r),
    e
  );
}
function hl(e, t, n, r) {
  var l = t.current,
    o = ue(),
    i = ct(l);
  return (
    (n = nc(n)),
    t.context === null ? (t.context = n) : (t.pendingContext = n),
    (t = Qe(o, i)),
    (t.payload = { element: e }),
    (r = r === void 0 ? null : r),
    r !== null && (t.callback = r),
    (e = st(l, t, i)),
    e !== null && (Me(e, l, i, o), _r(e, l, i)),
    i
  );
}
function tl(e) {
  if (((e = e.current), !e.child)) return null;
  switch (e.child.tag) {
    case 5:
      return e.child.stateNode;
    default:
      return e.child.stateNode;
  }
}
function Hu(e, t) {
  if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
    var n = e.retryLane;
    e.retryLane = n !== 0 && n < t ? n : t;
  }
}
function Ri(e, t) {
  Hu(e, t), (e = e.alternate) && Hu(e, t);
}
function Ld() {
  return null;
}
var lc =
  typeof reportError == 'function'
    ? reportError
    : function (e) {
        console.error(e);
      };
function Ii(e) {
  this._internalRoot = e;
}
ml.prototype.render = Ii.prototype.render = function (e) {
  var t = this._internalRoot;
  if (t === null) throw Error(g(409));
  hl(e, t, null, null);
};
ml.prototype.unmount = Ii.prototype.unmount = function () {
  var e = this._internalRoot;
  if (e !== null) {
    this._internalRoot = null;
    var t = e.containerInfo;
    Tt(function () {
      hl(null, e, null, null);
    }),
      (t[Ye] = null);
  }
};
function ml(e) {
  this._internalRoot = e;
}
ml.prototype.unstable_scheduleHydration = function (e) {
  if (e) {
    var t = Ms();
    e = { blockedOn: null, target: e, priority: t };
    for (var n = 0; n < et.length && t !== 0 && t < et[n].priority; n++);
    et.splice(n, 0, e), n === 0 && Ds(e);
  }
};
function Mi(e) {
  return !(!e || (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11));
}
function vl(e) {
  return !(
    !e ||
    (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11 && (e.nodeType !== 8 || e.nodeValue !== ' react-mount-point-unstable '))
  );
}
function Wu() {}
function Rd(e, t, n, r, l) {
  if (l) {
    if (typeof r == 'function') {
      var o = r;
      r = function () {
        var a = tl(i);
        o.call(a);
      };
    }
    var i = rc(t, r, e, 0, null, !1, !1, '', Wu);
    return (e._reactRootContainer = i), (e[Ye] = i.current), An(e.nodeType === 8 ? e.parentNode : e), Tt(), i;
  }
  for (; (l = e.lastChild); ) e.removeChild(l);
  if (typeof r == 'function') {
    var u = r;
    r = function () {
      var a = tl(s);
      u.call(a);
    };
  }
  var s = Li(e, 0, !1, null, null, !1, !1, '', Wu);
  return (
    (e._reactRootContainer = s),
    (e[Ye] = s.current),
    An(e.nodeType === 8 ? e.parentNode : e),
    Tt(function () {
      hl(t, s, n, r);
    }),
    s
  );
}
function yl(e, t, n, r, l) {
  var o = n._reactRootContainer;
  if (o) {
    var i = o;
    if (typeof l == 'function') {
      var u = l;
      l = function () {
        var s = tl(i);
        u.call(s);
      };
    }
    hl(t, i, e, l);
  } else i = Rd(n, t, e, l, r);
  return tl(i);
}
Rs = function (e) {
  switch (e.tag) {
    case 3:
      var t = e.stateNode;
      if (t.current.memoizedState.isDehydrated) {
        var n = kn(t.pendingLanes);
        n !== 0 && (bo(t, n | 1), me(t, K()), !(R & 6) && ((ln = K() + 500), vt()));
      }
      break;
    case 13:
      Tt(function () {
        var r = Xe(e, 1);
        if (r !== null) {
          var l = ue();
          Me(r, e, 1, l);
        }
      }),
        Ri(e, 1);
  }
};
ei = function (e) {
  if (e.tag === 13) {
    var t = Xe(e, 134217728);
    if (t !== null) {
      var n = ue();
      Me(t, e, 134217728, n);
    }
    Ri(e, 134217728);
  }
};
Is = function (e) {
  if (e.tag === 13) {
    var t = ct(e),
      n = Xe(e, t);
    if (n !== null) {
      var r = ue();
      Me(n, e, t, r);
    }
    Ri(e, t);
  }
};
Ms = function () {
  return M;
};
Os = function (e, t) {
  var n = M;
  try {
    return (M = e), t();
  } finally {
    M = n;
  }
};
uo = function (e, t, n) {
  switch (t) {
    case 'input':
      if ((eo(e, n), (t = n.name), n.type === 'radio' && t != null)) {
        for (n = e; n.parentNode; ) n = n.parentNode;
        for (n = n.querySelectorAll('input[name=' + JSON.stringify('' + t) + '][type="radio"]'), t = 0; t < n.length; t++) {
          var r = n[t];
          if (r !== e && r.form === e.form) {
            var l = ul(r);
            if (!l) throw Error(g(90));
            ds(r), eo(r, l);
          }
        }
      }
      break;
    case 'textarea':
      hs(e, n);
      break;
    case 'select':
      (t = n.value), t != null && Kt(e, !!n.multiple, t, !1);
  }
};
ks = ji;
xs = Tt;
var Id = { usingClientEntryPoint: !1, Events: [qn, $t, ul, ws, Ss, ji] },
  gn = { findFiberByHostInstance: kt, bundleType: 0, version: '18.2.0', rendererPackageName: 'react-dom' },
  Md = {
    bundleType: gn.bundleType,
    version: gn.version,
    rendererPackageName: gn.rendererPackageName,
    rendererConfig: gn.rendererConfig,
    overrideHookState: null,
    overrideHookStateDeletePath: null,
    overrideHookStateRenamePath: null,
    overrideProps: null,
    overridePropsDeletePath: null,
    overridePropsRenamePath: null,
    setErrorHandler: null,
    setSuspenseHandler: null,
    scheduleUpdate: null,
    currentDispatcherRef: Ze.ReactCurrentDispatcher,
    findHostInstanceByFiber: function (e) {
      return (e = _s(e)), e === null ? null : e.stateNode;
    },
    findFiberByHostInstance: gn.findFiberByHostInstance || Ld,
    findHostInstancesForRefresh: null,
    scheduleRefresh: null,
    scheduleRoot: null,
    setRefreshHandler: null,
    getCurrentFiber: null,
    reconcilerVersion: '18.2.0-next-9e3b772b8-20220608',
  };
if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < 'u') {
  var wr = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!wr.isDisabled && wr.supportsFiber)
    try {
      (rl = wr.inject(Md)), ($e = wr);
    } catch {}
}
Se.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Id;
Se.createPortal = function (e, t) {
  var n = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
  if (!Mi(t)) throw Error(g(200));
  return Td(e, t, null, n);
};
Se.createRoot = function (e, t) {
  if (!Mi(e)) throw Error(g(299));
  var n = !1,
    r = '',
    l = lc;
  return (
    t != null &&
      (t.unstable_strictMode === !0 && (n = !0),
      t.identifierPrefix !== void 0 && (r = t.identifierPrefix),
      t.onRecoverableError !== void 0 && (l = t.onRecoverableError)),
    (t = Li(e, 1, !1, null, null, n, !1, r, l)),
    (e[Ye] = t.current),
    An(e.nodeType === 8 ? e.parentNode : e),
    new Ii(t)
  );
};
Se.findDOMNode = function (e) {
  if (e == null) return null;
  if (e.nodeType === 1) return e;
  var t = e._reactInternals;
  if (t === void 0) throw typeof e.render == 'function' ? Error(g(188)) : ((e = Object.keys(e).join(',')), Error(g(268, e)));
  return (e = _s(t)), (e = e === null ? null : e.stateNode), e;
};
Se.flushSync = function (e) {
  return Tt(e);
};
Se.hydrate = function (e, t, n) {
  if (!vl(t)) throw Error(g(200));
  return yl(null, e, t, !0, n);
};
Se.hydrateRoot = function (e, t, n) {
  if (!Mi(e)) throw Error(g(405));
  var r = (n != null && n.hydratedSources) || null,
    l = !1,
    o = '',
    i = lc;
  if (
    (n != null &&
      (n.unstable_strictMode === !0 && (l = !0),
      n.identifierPrefix !== void 0 && (o = n.identifierPrefix),
      n.onRecoverableError !== void 0 && (i = n.onRecoverableError)),
    (t = rc(t, null, e, 1, n ?? null, l, !1, o, i)),
    (e[Ye] = t.current),
    An(e),
    r)
  )
    for (e = 0; e < r.length; e++)
      (n = r[e]),
        (l = n._getVersion),
        (l = l(n._source)),
        t.mutableSourceEagerHydrationData == null
          ? (t.mutableSourceEagerHydrationData = [n, l])
          : t.mutableSourceEagerHydrationData.push(n, l);
  return new ml(t);
};
Se.render = function (e, t, n) {
  if (!vl(t)) throw Error(g(200));
  return yl(null, e, t, !1, n);
};
Se.unmountComponentAtNode = function (e) {
  if (!vl(e)) throw Error(g(40));
  return e._reactRootContainer
    ? (Tt(function () {
        yl(null, null, e, !1, function () {
          (e._reactRootContainer = null), (e[Ye] = null);
        });
      }),
      !0)
    : !1;
};
Se.unstable_batchedUpdates = ji;
Se.unstable_renderSubtreeIntoContainer = function (e, t, n, r) {
  if (!vl(n)) throw Error(g(200));
  if (e == null || e._reactInternals === void 0) throw Error(g(38));
  return yl(e, t, n, !1, r);
};
Se.version = '18.2.0-next-9e3b772b8-20220608';
function oc() {
  if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > 'u' || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != 'function'))
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(oc);
    } catch (e) {
      console.error(e);
    }
}
oc(), (rs.exports = Se);
var Od = rs.exports,
  Qu = Od;
(Yl.createRoot = Qu.createRoot), (Yl.hydrateRoot = Qu.hydrateRoot);
const ce = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
  Dd = ({ item: { img: e, title: t, price: n, id: r }, bg: l, fg: o, mode: i }) => {
    const { dispatch: u } = I.useContext(er);
    return p.jsxs('div', {
      className: 'itemCard',
      style: { backgroundColor: i === 'light' ? l : 'var(--grey820)' },
      onClick: () => u({ type: 'ADD', payload: { img: e, title: t, price: n, id: r } }),
      children: [
        p.jsx('img', { src: e }),
        p.jsxs('div', {
          className: 'itemNameAndPrice',
          children: [
            p.jsx('div', { className: 'name', style: { color: o }, children: t }),
            p.jsx('div', { className: 'price money', children: ce.format(n) }),
          ],
        }),
      ],
    });
  };
const Fd = (e, t) => {
    e = e.replace('#', '');
    const n = parseInt(e.substr(0, 2), 16),
      r = parseInt(e.substr(2, 2), 16),
      l = parseInt(e.substr(4, 2), 16);
    let o = 0,
      i = 0,
      u = 0;
    const s = n / 255,
      a = r / 255,
      v = l / 255,
      h = Math.max(s, a, v),
      m = Math.min(s, a, v);
    if (((u = (h + m) / 2), h === m)) o = i = 0;
    else {
      const w = h - m;
      switch (((i = u > 0.5 ? w / (2 - h - m) : w / (h + m)), h)) {
        case s:
          o = ((a - v) / w + (a < v ? 6 : 0)) / 6;
          break;
        case a:
          o = ((v - s) / w + 2) / 6;
          break;
        case v:
          o = ((s - a) / w + 4) / 6;
          break;
      }
    }
    return (u = Math.min(1, u + t)), `hsl(${Math.round(o * 360)}, ${Math.round(i * 100)}%, ${Math.round(u * 100)}%)`;
  },
  Ud = ({ categoryItems: e }) => {
    const [t, n] = I.useState('light'),
      r = (l) => {
        n(l);
      };
    return (
      I.useEffect(
        () => (
          window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (l) => r(l.matches ? 'dark' : 'light')),
          r(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
          () => {
            window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', () => {});
          }
        ),
        []
      ),
      p.jsx('div', {
        className: 'itemSelector',
        children: e.map(({ category: l, palette2: o, palette3: i, items: u }, s) => {
          const a = t === 'light' ? i : Fd(i, 0.1);
          return p.jsxs(
            'div',
            {
              children: [
                p.jsx('div', { className: 'categoryTitle', style: { color: a }, children: l }),
                p.jsx('div', { className: 'itemsGrid', children: u.map((v, h) => p.jsx(Dd, { item: v, bg: o, fg: a, mode: t }, h)) }),
              ],
            },
            s
          );
        }),
      })
    );
  };
function Ku({ visible: e, setVisible: t, children: n }) {
  const r = I.useRef(null);
  return p.jsx(p.Fragment, {
    children: e
      ? p.jsx('div', {
          className: 'modal',
          dir: 'row',
          onClick: (l) => {
            if (r.current) {
              if (r.current.contains(l.target)) return;
            } else return;
            t(!1);
          },
          children: p.jsx('div', { ref: r, className: 'modalChild', children: n }),
        })
      : p.jsx(p.Fragment, {}),
  });
}
function $d(e) {
  const t = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let n = ' ';
  const r = t.length;
  for (let l = 0; l < e; l++) n += t.charAt(Math.floor(Math.random() * r));
  return n;
}
const Ad = () => {
  const {
      state: { items: e, total: t },
    } = I.useContext(er),
    [n, r] = I.useState(0),
    [l, o] = I.useState('record'),
    [i, u] = I.useState(''),
    s = I.useContext(Oi),
    a = I.useContext(ic),
    v = () => {
      const h = {
          spreadsheetId: '1e94IfiaKPi7ULUjk29yAKcFm_Xt8U3SWNK5UhBo-VDk',
          range: `${s}-records!A:E`,
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
        },
        m = $d(4),
        S = {
          values: e.map((k) => [
            m,
            new Date().toLocaleString(),
            k.id,
            k.title,
            k.price,
            k.quantity,
            k.subtotal,
            n === 0 ? 'cash' : 'credit',
          ]),
        };
      window.gapi.client.sheets.spreadsheets.values.append(h, S).then(
        function () {
          u(''), o('success');
        },
        function () {
          u('Please try again!'), o('record'), a.requestAccessToken();
        }
      );
    };
  return p.jsxs('div', {
    className: 'confirmRecordContainer',
    children: [
      'Items Purchased',
      p.jsx('div', {
        className: 'denseTable',
        children: p.jsxs('table', {
          children: [
            p.jsx('thead', {
              children: p.jsxs('tr', {
                children: [
                  p.jsx('th', { children: 'S/N' }),
                  p.jsx('th', { align: 'left', children: 'Name' }),
                  p.jsx('th', { children: 'Price' }),
                  p.jsx('th', { children: 'Qty' }),
                  p.jsx('th', { children: 'Subtotal' }),
                ],
              }),
            }),
            p.jsx('tbody', {
              children: e.map(({ title: h, quantity: m, price: S, subtotal: w }, k) =>
                p.jsxs(
                  'tr',
                  {
                    children: [
                      p.jsx('td', { children: k + 1 }),
                      p.jsx('td', { align: 'left', children: h }),
                      p.jsx('td', { align: 'right', className: 'money', children: p.jsx('div', { children: ce.format(S) }) }),
                      p.jsx('td', { children: m }),
                      p.jsx('td', { align: 'right', className: 'money', children: p.jsx('div', { children: ce.format(w) }) }),
                    ],
                  },
                  k
                )
              ),
            }),
            p.jsx('tfoot', {
              children: p.jsxs('tr', {
                children: [
                  p.jsxs('td', { colSpan: 4, align: 'right', children: ['Total:', ' '] }),
                  p.jsx('td', { className: 'money', children: ce.format(t) }),
                ],
              }),
            }),
          ],
        }),
      }),
      p.jsxs('div', {
        children: [
          'Select Payment Type : ',
          n === 0 ? 'Cash' : 'Paynow',
          p.jsxs('div', {
            children: [
              p.jsx('button', { onClick: () => r(0), children: 'Cash' }),
              p.jsx('button', { onClick: () => r(1), children: 'Paynow' }),
            ],
          }),
        ],
      }),
      p.jsxs('div', {
        children: [
          'Confirm Record',
          i && p.jsx('div', { children: i }),
          p.jsx('div', {
            children: p.jsxs('button', {
              onClick: () => {
                o('recording'), v();
              },
              disabled: l === 'recording',
              className: l,
              children: [l, '!'],
            }),
          }),
        ],
      }),
    ],
  });
};
const Vd = [50, 10, 5, 2, 1, 0.5],
  Bd = () => {
    const {
        state: { items: e, total: t },
      } = I.useContext(er),
      [n, r] = I.useState(0);
    return p.jsxs('div', {
      className: 'computeChangeContainer',
      children: [
        'Items Purchased',
        p.jsx('div', {
          className: 'denseTable',
          children: p.jsxs('table', {
            children: [
              p.jsx('thead', {
                children: p.jsxs('tr', {
                  children: [
                    p.jsx('th', { children: 'S/N' }),
                    p.jsx('th', { align: 'left', children: 'Name' }),
                    p.jsx('th', { children: 'Price' }),
                    p.jsx('th', { children: 'Qty' }),
                    p.jsx('th', { children: 'Subtotal' }),
                  ],
                }),
              }),
              p.jsx('tbody', {
                children: e.map(({ title: l, quantity: o, price: i, subtotal: u }, s) =>
                  p.jsxs(
                    'tr',
                    {
                      children: [
                        p.jsx('td', { children: s + 1 }),
                        p.jsx('td', { align: 'left', children: l }),
                        p.jsx('td', { align: 'right', className: 'money', children: p.jsx('div', { children: ce.format(i) }) }),
                        p.jsx('td', { children: o }),
                        p.jsxs('td', { align: 'right', className: 'money', children: [' ', p.jsx('div', { children: ce.format(u) })] }),
                      ],
                    },
                    s
                  )
                ),
              }),
              p.jsxs('tfoot', {
                children: [
                  p.jsxs('tr', {
                    children: [
                      p.jsx('td', { colSpan: 4, align: 'right', children: 'Total:' }),
                      p.jsxs('td', { className: 'money', children: ['(', ce.format(t), ')'] }),
                    ],
                  }),
                  p.jsxs('tr', {
                    style: { fontSize: '1.5em' },
                    children: [
                      p.jsx('td', { colSpan: 4, align: 'right', children: 'Cash Received:' }),
                      p.jsx('td', { className: 'cashReceived money', children: ce.format(n) }),
                    ],
                  }),
                  p.jsxs('tr', {
                    children: [
                      p.jsx('td', { colSpan: 4, align: 'right', children: 'Balance:' }),
                      p.jsx('td', { className: 'money', children: n - t < 0 ? `(${ce.format(t - n)})` : ce.format(n - t) }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
        p.jsx('div', {
          className: 'denomsGrid',
          children: Vd.map((l, o) =>
            p.jsxs(
              'div',
              {
                className: 'notesAdder',
                children: [
                  p.jsx('button', { onClick: () => r(n - l), children: '-' }),
                  ce.format(l),
                  p.jsx('button', { onClick: () => r(n + l), children: '+' }),
                ],
              },
              o
            )
          ),
        }),
      ],
    });
  },
  Hd = () =>
    p.jsx('div', {
      className: 'iconContainer',
      children: p.jsx('svg', {
        clipRule: 'evenodd',
        fillRule: 'evenodd',
        strokeLinejoin: 'round',
        strokeMiterlimit: '2',
        viewBox: '0 0 24 24',
        xmlns: 'http://www.w3.org/2000/svg',
        children: p.jsx('path', {
          d: 'm12.002 2.005c5.518 0 9.998 4.48 9.998 9.997 0 5.518-4.48 9.998-9.998 9.998-5.517 0-9.997-4.48-9.997-9.998 0-5.517 4.48-9.997 9.997-9.997zm0 8.933-2.721-2.722c-.146-.146-.339-.219-.531-.219-.404 0-.75.324-.75.749 0 .193.073.384.219.531l2.722 2.722-2.728 2.728c-.147.147-.22.34-.22.531 0 .427.35.75.751.75.192 0 .384-.073.53-.219l2.728-2.728 2.729 2.728c.146.146.338.219.53.219.401 0 .75-.323.75-.75 0-.191-.073-.384-.22-.531l-2.727-2.728 2.717-2.717c.146-.147.219-.338.219-.531 0-.425-.346-.75-.75-.75-.192 0-.385.073-.531.22z',
          fillRule: 'nonzero',
        }),
      }),
    }),
  Wd = () =>
    p.jsxs('div', {
      className: 'iconContainer',
      children: [
        p.jsx('svg', {
          width: '24',
          height: '24',
          xmlns: 'http://www.w3.org/2000/svg',
          fillRule: 'evenodd',
          clipRule: 'evenodd',
          viewBox: '0 0 24 24',
          children: p.jsx('path', {
            d: 'M19 24h-14c-1.104 0-2-.896-2-2v-16h18v16c0 1.104-.896 2-2 2zm-7-10.414l3.293-3.293 1.414 1.414-3.293 3.293 3.293 3.293-1.414 1.414-3.293-3.293-3.293 3.293-1.414-1.414 3.293-3.293-3.293-3.293 1.414-1.414 3.293 3.293zm10-8.586h-20v-2h6v-1.5c0-.827.673-1.5 1.5-1.5h5c.825 0 1.5.671 1.5 1.5v1.5h6v2zm-8-3h-4v1h4v-1z',
          }),
        }),
        '  RESET',
      ],
    }),
  Qd = () =>
    p.jsxs('div', {
      className: 'iconContainer',
      children: [
        p.jsx('svg', {
          clipRule: 'evenodd',
          fillRule: 'evenodd',
          strokeLinejoin: 'round',
          strokeMiterlimit: '2',
          viewBox: '0 0 24 24',
          xmlns: 'http://www.w3.org/2000/svg',
          children: p.jsx('path', {
            d: 'm11.25 6c.398 0 .75.352.75.75 0 .414-.336.75-.75.75-1.505 0-7.75 0-7.75 0v12h17v-8.75c0-.414.336-.75.75-.75s.75.336.75.75v9.25c0 .621-.522 1-1 1h-18c-.48 0-1-.379-1-1v-13c0-.481.38-1 1-1zm-2.011 6.526c-1.045 3.003-1.238 3.45-1.238 3.84 0 .441.385.626.627.626.272 0 1.108-.301 3.829-1.249zm.888-.889 3.22 3.22 8.408-8.4c.163-.163.245-.377.245-.592 0-.213-.082-.427-.245-.591-.58-.578-1.458-1.457-2.039-2.036-.163-.163-.377-.245-.591-.245-.213 0-.428.082-.592.245z',
            fillRule: 'nonzero',
          }),
        }),
        '  RECORD',
      ],
    }),
  Kd = () =>
    p.jsxs('div', {
      className: 'iconContainer',
      children: [
        p.jsx('svg', {
          xmlns: 'http://www.w3.org/2000/svg',
          width: '24',
          height: '24',
          viewBox: '0 0 24 24',
          children: p.jsx('path', {
            d: 'M13 24h6c2.762 0 5-2.239 5-5v-6h-11v11zm3-7h5v1h-5v-1zm0 2h5v1h-5v-1zm-16 0c0 2.761 2.239 5 5 5h6v-11h-11v6zm3-1h2v-2h1v2h2v1h-2v2h-1v-2h-2v-1zm16-18h-6v11h11v-6c0-2.761-2.238-5-5-5zm-.5 3c.276 0 .5.224.5.5s-.224.5-.5.5-.5-.224-.5-.5.224-.5.5-.5zm0 5c-.276 0-.5-.224-.5-.5s.224-.5.5-.5.5.224.5.5-.224.5-.5.5zm2.5-2h-5v-1h5v1zm-21-1v6h11v-11h-6c-2.761 0-5 2.239-5 5zm6.914-1.622l.708.708-1.415 1.414 1.414 1.414-.707.707-1.414-1.414-1.414 1.414-.708-.707 1.414-1.414-1.414-1.414.707-.707 1.415 1.414 1.414-1.415z',
          }),
        }),
        '  CHANGE',
      ],
    }),
  Yd = () => {
    const {
        state: { items: e, total: t },
        dispatch: n,
      } = I.useContext(er),
      [r, l] = I.useState(!1),
      [o, i] = I.useState(!1);
    return p.jsxs('div', {
      className: 'selectedItemsContainer',
      children: [
        p.jsx('div', {
          className: 'tableContainer',
          children: p.jsxs('table', {
            className: 'cashierStateTable',
            children: [
              p.jsx('thead', {
                children: p.jsxs('tr', {
                  children: [
                    p.jsx('th', { children: 'Icon' }),
                    p.jsx('th', { align: 'left', children: 'Name' }),
                    p.jsx('th', { children: 'Price' }),
                    p.jsx('th', { children: 'Qty' }),
                    p.jsx('th', { children: 'Less' }),
                    p.jsx('th', { children: 'Sub' }),
                  ],
                }),
              }),
              p.jsxs('tbody', {
                children: [
                  e.length > 0 &&
                    e.map(({ id: u, img: s, price: a, title: v, quantity: h, subtotal: m }) =>
                      p.jsxs(
                        'tr',
                        {
                          children: [
                            p.jsx('td', { children: p.jsx('img', { className: 'cashierStateItemImg', src: s, width: '30px' }) }),
                            p.jsx('td', { align: 'left', children: v }),
                            p.jsx('td', { className: 'price money', children: ce.format(a) }),
                            p.jsx('td', { children: h > 1 ? p.jsx('div', { className: 'qty', children: h }) : h }),
                            p.jsx('td', {
                              children: p.jsx('button', {
                                onClick: () => n({ type: 'REMOVE', payload: { id: u, price: a } }),
                                children: p.jsx(Hd, {}),
                              }),
                            }),
                            p.jsx('td', {
                              align: 'right',
                              className: 'subtotal money',
                              children: p.jsx('div', { children: ce.format(m) }),
                            }),
                          ],
                        },
                        u
                      )
                    ),
                  e.length === 0 &&
                    p.jsx('tr', { children: p.jsx('td', { colSpan: 6, style: { padding: '1rem' }, children: 'no items in cart' }) }),
                ],
              }),
              e.length > 0 &&
                p.jsx('tfoot', {
                  children: p.jsxs('tr', {
                    children: [
                      p.jsx('td', { colSpan: 4, align: 'right', children: 'Total:' }),
                      p.jsx('td', { colSpan: 2, className: 'money', children: ce.format(t) }),
                    ],
                  }),
                }),
            ],
          }),
        }),
        p.jsxs('div', {
          className: 'resultContainer',
          children: [
            p.jsx('button', { onClick: () => n({ type: 'RESET', payload: {} }), children: p.jsx(Wd, {}) }),
            p.jsx('button', { onClick: () => l(!0), children: p.jsx(Qd, {}) }),
            p.jsx('button', { onClick: () => i(!0), children: p.jsx(Kd, {}) }),
          ],
        }),
        p.jsx(Ku, { visible: r, setVisible: l, children: p.jsx(Ad, {}) }),
        p.jsx(Ku, { visible: o, setVisible: i, children: p.jsx(Bd, {}) }),
      ],
    });
  },
  Xd = (e, { type: t, payload: n }) => {
    if (t === 'ADD') {
      const r = e.total + n.price;
      let l = !1;
      const o = e.items.map((i) => (i.id === n.id ? ((l = !0), { ...i, quantity: i.quantity + 1, subtotal: i.subtotal + n.price }) : i));
      return l || o.push({ ...n, quantity: 1, subtotal: n.price }), { items: o, total: r };
    } else if (t === 'REMOVE') {
      const r = e.total - n.price;
      return {
        items: e.items.reduce(
          (o, i) =>
            i.id === n.id ? (i.quantity > 1 ? [...o, { ...i, quantity: i.quantity - 1, subtotal: i.subtotal - n.price }] : o) : [...o, i],
          []
        ),
        total: r,
      };
    } else if (t === 'RESET') return { items: [], total: 0 };
    return e;
  },
  er = I.createContext({ state: {}, dispatch: () => null }),
  Gd = ({ categoryItems: e }) => {
    const [t, n] = I.useReducer(Xd, { items: [], total: 0 });
    return p.jsx(er.Provider, {
      value: { state: t, dispatch: n },
      children: p.jsxs('div', { className: 'cashierGrid', children: [p.jsx(Ud, { categoryItems: e }), p.jsx(Yd, {})] }),
    });
  };
const Zd = (e) => {
    const t = e[0];
    return e
      .slice(1)
      .map((l) =>
        t.reduce((i, u, s) => {
          let a = l[s];
          return u === 'price' && (a = parseFloat(a)), (i[u] = a), i;
        }, {})
      )
      .reduce((l, o) => {
        const { category: i, palette1: u, palette2: s, palette3: a, ...v } = o,
          h = l.find((m) => m.category === i);
        if (h) h.items.push(v);
        else {
          const m = { category: i, palette1: u, palette2: s, palette3: a, items: [v] };
          l.push(m);
        }
        return l;
      }, []);
  },
  Jd = async (e, t) => {
    let n;
    try {
      n = await gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: '1e94IfiaKPi7ULUjk29yAKcFm_Xt8U3SWNK5UhBo-VDk',
        range: `${e}!A:H`,
      });
    } catch (l) {
      console.log(l);
      return;
    }
    const r = n.result;
    if (!r || !r.values || r.values.length === 0) {
      console.log('empty result');
      return;
    }
    t(Zd(r.values));
  },
  qd = 'https://sheets.googleapis.com/$discovery/rest?version=v4',
  bd = 'https://www.googleapis.com/auth/spreadsheets',
  ep = ({ setCategoryItems: e, setTokenClient: t, setSheetName: n }) => {
    const [r, l] = I.useState(!1),
      [o, i] = I.useState(!1),
      u = I.useContext(Oi),
      s = () => {
        const a = google.accounts.oauth2.initTokenClient({
          client_id: '891693805973-8ad6a0dv13n9g6nu6ktj7qi0bum9oqr3.apps.googleusercontent.com',
          scope: bd,
          callback: async (v) => {
            if (v.error !== void 0) throw v;
            Jd(u, (h) => e(h));
          },
        });
        t(a), a.requestAccessToken({ prompt: '' });
      };
    return (
      I.useEffect(() => {
        async function a() {
          await gapi.client.init({ apiKey: 'AIzaSyA4h2Wnm3i8dMEukuc3KX83MX-UqmqUdl4', discoveryDocs: [qd] }), l(!0);
        }
        const v = document.createElement('script');
        (v.src = 'https://accounts.google.com/gsi/client'), (v.async = !0), (v.onload = () => i(!0)), document.body.appendChild(v);
        const h = document.createElement('script');
        (h.src = 'https://apis.google.com/js/api.js'),
          (h.async = !0),
          (h.onload = () => gapi.load('client', a)),
          document.body.appendChild(h);
      }, [e, t]),
      p.jsxs('form', {
        id: 'loginCard',
        onSubmit: (a) => {
          a.preventDefault(), o && r && s();
        },
        children: [
          'enter sheet name ↓',
          p.jsx('input', { type: 'text', placeholder: 'maomao', value: u, autoFocus: !0, onChange: (a) => n(a.target.value) }),
          p.jsx('button', { children: 'weee!' }),
        ],
      })
    );
  },
  Oi = I.createContext('maomao'),
  ic = I.createContext({});
function tp() {
  const [e, t] = I.useState('maomao'),
    [n, r] = I.useState(),
    [l, o] = I.useState([]);
  return p.jsx(p.Fragment, {
    children: p.jsx(Oi.Provider, {
      value: e,
      children: p.jsxs(ic.Provider, {
        value: n,
        children: [!n && p.jsx(ep, { setCategoryItems: o, setSheetName: t, setTokenClient: r }), p.jsx(Gd, { categoryItems: l })],
      }),
    }),
  });
}
Yl.createRoot(document.getElementById('root')).render(p.jsx(Cc.StrictMode, { children: p.jsx(tp, {}) }));
