// @bun
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: (newValue) => all[name] = () => newValue
    });
};
var __require = import.meta.require;

// node_modules/ajv/dist/compile/codegen/code.js
var require_code = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.regexpCode = exports.getEsmExportName = exports.getProperty = exports.safeStringify = exports.stringify = exports.strConcat = exports.addCodeArg = exports.str = exports._ = exports.nil = exports._Code = exports.Name = exports.IDENTIFIER = exports._CodeOrName = undefined;

  class _CodeOrName {
  }
  exports._CodeOrName = _CodeOrName;
  exports.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;

  class Name extends _CodeOrName {
    constructor(s) {
      super();
      if (!exports.IDENTIFIER.test(s))
        throw new Error("CodeGen: name must be a valid identifier");
      this.str = s;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      return false;
    }
    get names() {
      return { [this.str]: 1 };
    }
  }
  exports.Name = Name;

  class _Code extends _CodeOrName {
    constructor(code) {
      super();
      this._items = typeof code === "string" ? [code] : code;
    }
    toString() {
      return this.str;
    }
    emptyStr() {
      if (this._items.length > 1)
        return false;
      const item = this._items[0];
      return item === "" || item === '""';
    }
    get str() {
      var _a;
      return (_a = this._str) !== null && _a !== undefined ? _a : this._str = this._items.reduce((s, c) => `${s}${c}`, "");
    }
    get names() {
      var _a;
      return (_a = this._names) !== null && _a !== undefined ? _a : this._names = this._items.reduce((names, c) => {
        if (c instanceof Name)
          names[c.str] = (names[c.str] || 0) + 1;
        return names;
      }, {});
    }
  }
  exports._Code = _Code;
  exports.nil = new _Code("");
  function _(strs, ...args) {
    const code = [strs[0]];
    let i = 0;
    while (i < args.length) {
      addCodeArg(code, args[i]);
      code.push(strs[++i]);
    }
    return new _Code(code);
  }
  exports._ = _;
  var plus = new _Code("+");
  function str(strs, ...args) {
    const expr = [safeStringify(strs[0])];
    let i = 0;
    while (i < args.length) {
      expr.push(plus);
      addCodeArg(expr, args[i]);
      expr.push(plus, safeStringify(strs[++i]));
    }
    optimize(expr);
    return new _Code(expr);
  }
  exports.str = str;
  function addCodeArg(code, arg) {
    if (arg instanceof _Code)
      code.push(...arg._items);
    else if (arg instanceof Name)
      code.push(arg);
    else
      code.push(interpolate(arg));
  }
  exports.addCodeArg = addCodeArg;
  function optimize(expr) {
    let i = 1;
    while (i < expr.length - 1) {
      if (expr[i] === plus) {
        const res = mergeExprItems(expr[i - 1], expr[i + 1]);
        if (res !== undefined) {
          expr.splice(i - 1, 3, res);
          continue;
        }
        expr[i++] = "+";
      }
      i++;
    }
  }
  function mergeExprItems(a, b) {
    if (b === '""')
      return a;
    if (a === '""')
      return b;
    if (typeof a == "string") {
      if (b instanceof Name || a[a.length - 1] !== '"')
        return;
      if (typeof b != "string")
        return `${a.slice(0, -1)}${b}"`;
      if (b[0] === '"')
        return a.slice(0, -1) + b.slice(1);
      return;
    }
    if (typeof b == "string" && b[0] === '"' && !(a instanceof Name))
      return `"${a}${b.slice(1)}`;
    return;
  }
  function strConcat(c1, c2) {
    return c2.emptyStr() ? c1 : c1.emptyStr() ? c2 : str`${c1}${c2}`;
  }
  exports.strConcat = strConcat;
  function interpolate(x) {
    return typeof x == "number" || typeof x == "boolean" || x === null ? x : safeStringify(Array.isArray(x) ? x.join(",") : x);
  }
  function stringify(x) {
    return new _Code(safeStringify(x));
  }
  exports.stringify = stringify;
  function safeStringify(x) {
    return JSON.stringify(x).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
  }
  exports.safeStringify = safeStringify;
  function getProperty(key) {
    return typeof key == "string" && exports.IDENTIFIER.test(key) ? new _Code(`.${key}`) : _`[${key}]`;
  }
  exports.getProperty = getProperty;
  function getEsmExportName(key) {
    if (typeof key == "string" && exports.IDENTIFIER.test(key)) {
      return new _Code(`${key}`);
    }
    throw new Error(`CodeGen: invalid export name: ${key}, use explicit $id name mapping`);
  }
  exports.getEsmExportName = getEsmExportName;
  function regexpCode(rx) {
    return new _Code(rx.toString());
  }
  exports.regexpCode = regexpCode;
});

// node_modules/ajv/dist/compile/codegen/scope.js
var require_scope = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ValueScope = exports.ValueScopeName = exports.Scope = exports.varKinds = exports.UsedValueState = undefined;
  var code_1 = require_code();

  class ValueError extends Error {
    constructor(name) {
      super(`CodeGen: "code" for ${name} not defined`);
      this.value = name.value;
    }
  }
  var UsedValueState;
  (function(UsedValueState2) {
    UsedValueState2[UsedValueState2["Started"] = 0] = "Started";
    UsedValueState2[UsedValueState2["Completed"] = 1] = "Completed";
  })(UsedValueState || (exports.UsedValueState = UsedValueState = {}));
  exports.varKinds = {
    const: new code_1.Name("const"),
    let: new code_1.Name("let"),
    var: new code_1.Name("var")
  };

  class Scope {
    constructor({ prefixes, parent } = {}) {
      this._names = {};
      this._prefixes = prefixes;
      this._parent = parent;
    }
    toName(nameOrPrefix) {
      return nameOrPrefix instanceof code_1.Name ? nameOrPrefix : this.name(nameOrPrefix);
    }
    name(prefix) {
      return new code_1.Name(this._newName(prefix));
    }
    _newName(prefix) {
      const ng = this._names[prefix] || this._nameGroup(prefix);
      return `${prefix}${ng.index++}`;
    }
    _nameGroup(prefix) {
      var _a, _b;
      if (((_b = (_a = this._parent) === null || _a === undefined ? undefined : _a._prefixes) === null || _b === undefined ? undefined : _b.has(prefix)) || this._prefixes && !this._prefixes.has(prefix)) {
        throw new Error(`CodeGen: prefix "${prefix}" is not allowed in this scope`);
      }
      return this._names[prefix] = { prefix, index: 0 };
    }
  }
  exports.Scope = Scope;

  class ValueScopeName extends code_1.Name {
    constructor(prefix, nameStr) {
      super(nameStr);
      this.prefix = prefix;
    }
    setValue(value, { property, itemIndex }) {
      this.value = value;
      this.scopePath = (0, code_1._)`.${new code_1.Name(property)}[${itemIndex}]`;
    }
  }
  exports.ValueScopeName = ValueScopeName;
  var line = (0, code_1._)`\n`;

  class ValueScope extends Scope {
    constructor(opts) {
      super(opts);
      this._values = {};
      this._scope = opts.scope;
      this.opts = { ...opts, _n: opts.lines ? line : code_1.nil };
    }
    get() {
      return this._scope;
    }
    name(prefix) {
      return new ValueScopeName(prefix, this._newName(prefix));
    }
    value(nameOrPrefix, value) {
      var _a;
      if (value.ref === undefined)
        throw new Error("CodeGen: ref must be passed in value");
      const name = this.toName(nameOrPrefix);
      const { prefix } = name;
      const valueKey = (_a = value.key) !== null && _a !== undefined ? _a : value.ref;
      let vs = this._values[prefix];
      if (vs) {
        const _name = vs.get(valueKey);
        if (_name)
          return _name;
      } else {
        vs = this._values[prefix] = new Map;
      }
      vs.set(valueKey, name);
      const s = this._scope[prefix] || (this._scope[prefix] = []);
      const itemIndex = s.length;
      s[itemIndex] = value.ref;
      name.setValue(value, { property: prefix, itemIndex });
      return name;
    }
    getValue(prefix, keyOrRef) {
      const vs = this._values[prefix];
      if (!vs)
        return;
      return vs.get(keyOrRef);
    }
    scopeRefs(scopeName, values = this._values) {
      return this._reduceValues(values, (name) => {
        if (name.scopePath === undefined)
          throw new Error(`CodeGen: name "${name}" has no value`);
        return (0, code_1._)`${scopeName}${name.scopePath}`;
      });
    }
    scopeCode(values = this._values, usedValues, getCode) {
      return this._reduceValues(values, (name) => {
        if (name.value === undefined)
          throw new Error(`CodeGen: name "${name}" has no value`);
        return name.value.code;
      }, usedValues, getCode);
    }
    _reduceValues(values, valueCode, usedValues = {}, getCode) {
      let code = code_1.nil;
      for (const prefix in values) {
        const vs = values[prefix];
        if (!vs)
          continue;
        const nameSet = usedValues[prefix] = usedValues[prefix] || new Map;
        vs.forEach((name) => {
          if (nameSet.has(name))
            return;
          nameSet.set(name, UsedValueState.Started);
          let c = valueCode(name);
          if (c) {
            const def = this.opts.es5 ? exports.varKinds.var : exports.varKinds.const;
            code = (0, code_1._)`${code}${def} ${name} = ${c};${this.opts._n}`;
          } else if (c = getCode === null || getCode === undefined ? undefined : getCode(name)) {
            code = (0, code_1._)`${code}${c}${this.opts._n}`;
          } else {
            throw new ValueError(name);
          }
          nameSet.set(name, UsedValueState.Completed);
        });
      }
      return code;
    }
  }
  exports.ValueScope = ValueScope;
});

// node_modules/ajv/dist/compile/codegen/index.js
var require_codegen = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.or = exports.and = exports.not = exports.CodeGen = exports.operators = exports.varKinds = exports.ValueScopeName = exports.ValueScope = exports.Scope = exports.Name = exports.regexpCode = exports.stringify = exports.getProperty = exports.nil = exports.strConcat = exports.str = exports._ = undefined;
  var code_1 = require_code();
  var scope_1 = require_scope();
  var code_2 = require_code();
  Object.defineProperty(exports, "_", { enumerable: true, get: function() {
    return code_2._;
  } });
  Object.defineProperty(exports, "str", { enumerable: true, get: function() {
    return code_2.str;
  } });
  Object.defineProperty(exports, "strConcat", { enumerable: true, get: function() {
    return code_2.strConcat;
  } });
  Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
    return code_2.nil;
  } });
  Object.defineProperty(exports, "getProperty", { enumerable: true, get: function() {
    return code_2.getProperty;
  } });
  Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
    return code_2.stringify;
  } });
  Object.defineProperty(exports, "regexpCode", { enumerable: true, get: function() {
    return code_2.regexpCode;
  } });
  Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
    return code_2.Name;
  } });
  var scope_2 = require_scope();
  Object.defineProperty(exports, "Scope", { enumerable: true, get: function() {
    return scope_2.Scope;
  } });
  Object.defineProperty(exports, "ValueScope", { enumerable: true, get: function() {
    return scope_2.ValueScope;
  } });
  Object.defineProperty(exports, "ValueScopeName", { enumerable: true, get: function() {
    return scope_2.ValueScopeName;
  } });
  Object.defineProperty(exports, "varKinds", { enumerable: true, get: function() {
    return scope_2.varKinds;
  } });
  exports.operators = {
    GT: new code_1._Code(">"),
    GTE: new code_1._Code(">="),
    LT: new code_1._Code("<"),
    LTE: new code_1._Code("<="),
    EQ: new code_1._Code("==="),
    NEQ: new code_1._Code("!=="),
    NOT: new code_1._Code("!"),
    OR: new code_1._Code("||"),
    AND: new code_1._Code("&&"),
    ADD: new code_1._Code("+")
  };

  class Node {
    optimizeNodes() {
      return this;
    }
    optimizeNames(_names, _constants) {
      return this;
    }
  }

  class Def extends Node {
    constructor(varKind, name, rhs) {
      super();
      this.varKind = varKind;
      this.name = name;
      this.rhs = rhs;
    }
    render({ es5, _n }) {
      const varKind = es5 ? scope_1.varKinds.var : this.varKind;
      const rhs = this.rhs === undefined ? "" : ` = ${this.rhs}`;
      return `${varKind} ${this.name}${rhs};` + _n;
    }
    optimizeNames(names, constants) {
      if (!names[this.name.str])
        return;
      if (this.rhs)
        this.rhs = optimizeExpr(this.rhs, names, constants);
      return this;
    }
    get names() {
      return this.rhs instanceof code_1._CodeOrName ? this.rhs.names : {};
    }
  }

  class Assign extends Node {
    constructor(lhs, rhs, sideEffects) {
      super();
      this.lhs = lhs;
      this.rhs = rhs;
      this.sideEffects = sideEffects;
    }
    render({ _n }) {
      return `${this.lhs} = ${this.rhs};` + _n;
    }
    optimizeNames(names, constants) {
      if (this.lhs instanceof code_1.Name && !names[this.lhs.str] && !this.sideEffects)
        return;
      this.rhs = optimizeExpr(this.rhs, names, constants);
      return this;
    }
    get names() {
      const names = this.lhs instanceof code_1.Name ? {} : { ...this.lhs.names };
      return addExprNames(names, this.rhs);
    }
  }

  class AssignOp extends Assign {
    constructor(lhs, op, rhs, sideEffects) {
      super(lhs, rhs, sideEffects);
      this.op = op;
    }
    render({ _n }) {
      return `${this.lhs} ${this.op}= ${this.rhs};` + _n;
    }
  }

  class Label extends Node {
    constructor(label) {
      super();
      this.label = label;
      this.names = {};
    }
    render({ _n }) {
      return `${this.label}:` + _n;
    }
  }

  class Break extends Node {
    constructor(label) {
      super();
      this.label = label;
      this.names = {};
    }
    render({ _n }) {
      const label = this.label ? ` ${this.label}` : "";
      return `break${label};` + _n;
    }
  }

  class Throw extends Node {
    constructor(error2) {
      super();
      this.error = error2;
    }
    render({ _n }) {
      return `throw ${this.error};` + _n;
    }
    get names() {
      return this.error.names;
    }
  }

  class AnyCode extends Node {
    constructor(code) {
      super();
      this.code = code;
    }
    render({ _n }) {
      return `${this.code};` + _n;
    }
    optimizeNodes() {
      return `${this.code}` ? this : undefined;
    }
    optimizeNames(names, constants) {
      this.code = optimizeExpr(this.code, names, constants);
      return this;
    }
    get names() {
      return this.code instanceof code_1._CodeOrName ? this.code.names : {};
    }
  }

  class ParentNode extends Node {
    constructor(nodes = []) {
      super();
      this.nodes = nodes;
    }
    render(opts) {
      return this.nodes.reduce((code, n) => code + n.render(opts), "");
    }
    optimizeNodes() {
      const { nodes } = this;
      let i = nodes.length;
      while (i--) {
        const n = nodes[i].optimizeNodes();
        if (Array.isArray(n))
          nodes.splice(i, 1, ...n);
        else if (n)
          nodes[i] = n;
        else
          nodes.splice(i, 1);
      }
      return nodes.length > 0 ? this : undefined;
    }
    optimizeNames(names, constants) {
      const { nodes } = this;
      let i = nodes.length;
      while (i--) {
        const n = nodes[i];
        if (n.optimizeNames(names, constants))
          continue;
        subtractNames(names, n.names);
        nodes.splice(i, 1);
      }
      return nodes.length > 0 ? this : undefined;
    }
    get names() {
      return this.nodes.reduce((names, n) => addNames(names, n.names), {});
    }
  }

  class BlockNode extends ParentNode {
    render(opts) {
      return "{" + opts._n + super.render(opts) + "}" + opts._n;
    }
  }

  class Root extends ParentNode {
  }

  class Else extends BlockNode {
  }
  Else.kind = "else";

  class If extends BlockNode {
    constructor(condition, nodes) {
      super(nodes);
      this.condition = condition;
    }
    render(opts) {
      let code = `if(${this.condition})` + super.render(opts);
      if (this.else)
        code += "else " + this.else.render(opts);
      return code;
    }
    optimizeNodes() {
      super.optimizeNodes();
      const cond = this.condition;
      if (cond === true)
        return this.nodes;
      let e = this.else;
      if (e) {
        const ns = e.optimizeNodes();
        e = this.else = Array.isArray(ns) ? new Else(ns) : ns;
      }
      if (e) {
        if (cond === false)
          return e instanceof If ? e : e.nodes;
        if (this.nodes.length)
          return this;
        return new If(not(cond), e instanceof If ? [e] : e.nodes);
      }
      if (cond === false || !this.nodes.length)
        return;
      return this;
    }
    optimizeNames(names, constants) {
      var _a;
      this.else = (_a = this.else) === null || _a === undefined ? undefined : _a.optimizeNames(names, constants);
      if (!(super.optimizeNames(names, constants) || this.else))
        return;
      this.condition = optimizeExpr(this.condition, names, constants);
      return this;
    }
    get names() {
      const names = super.names;
      addExprNames(names, this.condition);
      if (this.else)
        addNames(names, this.else.names);
      return names;
    }
  }
  If.kind = "if";

  class For extends BlockNode {
  }
  For.kind = "for";

  class ForLoop extends For {
    constructor(iteration) {
      super();
      this.iteration = iteration;
    }
    render(opts) {
      return `for(${this.iteration})` + super.render(opts);
    }
    optimizeNames(names, constants) {
      if (!super.optimizeNames(names, constants))
        return;
      this.iteration = optimizeExpr(this.iteration, names, constants);
      return this;
    }
    get names() {
      return addNames(super.names, this.iteration.names);
    }
  }

  class ForRange extends For {
    constructor(varKind, name, from, to) {
      super();
      this.varKind = varKind;
      this.name = name;
      this.from = from;
      this.to = to;
    }
    render(opts) {
      const varKind = opts.es5 ? scope_1.varKinds.var : this.varKind;
      const { name, from, to } = this;
      return `for(${varKind} ${name}=${from}; ${name}<${to}; ${name}++)` + super.render(opts);
    }
    get names() {
      const names = addExprNames(super.names, this.from);
      return addExprNames(names, this.to);
    }
  }

  class ForIter extends For {
    constructor(loop, varKind, name, iterable) {
      super();
      this.loop = loop;
      this.varKind = varKind;
      this.name = name;
      this.iterable = iterable;
    }
    render(opts) {
      return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(opts);
    }
    optimizeNames(names, constants) {
      if (!super.optimizeNames(names, constants))
        return;
      this.iterable = optimizeExpr(this.iterable, names, constants);
      return this;
    }
    get names() {
      return addNames(super.names, this.iterable.names);
    }
  }

  class Func extends BlockNode {
    constructor(name, args, async) {
      super();
      this.name = name;
      this.args = args;
      this.async = async;
    }
    render(opts) {
      const _async = this.async ? "async " : "";
      return `${_async}function ${this.name}(${this.args})` + super.render(opts);
    }
  }
  Func.kind = "func";

  class Return extends ParentNode {
    render(opts) {
      return "return " + super.render(opts);
    }
  }
  Return.kind = "return";

  class Try extends BlockNode {
    render(opts) {
      let code = "try" + super.render(opts);
      if (this.catch)
        code += this.catch.render(opts);
      if (this.finally)
        code += this.finally.render(opts);
      return code;
    }
    optimizeNodes() {
      var _a, _b;
      super.optimizeNodes();
      (_a = this.catch) === null || _a === undefined || _a.optimizeNodes();
      (_b = this.finally) === null || _b === undefined || _b.optimizeNodes();
      return this;
    }
    optimizeNames(names, constants) {
      var _a, _b;
      super.optimizeNames(names, constants);
      (_a = this.catch) === null || _a === undefined || _a.optimizeNames(names, constants);
      (_b = this.finally) === null || _b === undefined || _b.optimizeNames(names, constants);
      return this;
    }
    get names() {
      const names = super.names;
      if (this.catch)
        addNames(names, this.catch.names);
      if (this.finally)
        addNames(names, this.finally.names);
      return names;
    }
  }

  class Catch extends BlockNode {
    constructor(error2) {
      super();
      this.error = error2;
    }
    render(opts) {
      return `catch(${this.error})` + super.render(opts);
    }
  }
  Catch.kind = "catch";

  class Finally extends BlockNode {
    render(opts) {
      return "finally" + super.render(opts);
    }
  }
  Finally.kind = "finally";

  class CodeGen {
    constructor(extScope, opts = {}) {
      this._values = {};
      this._blockStarts = [];
      this._constants = {};
      this.opts = { ...opts, _n: opts.lines ? `
` : "" };
      this._extScope = extScope;
      this._scope = new scope_1.Scope({ parent: extScope });
      this._nodes = [new Root];
    }
    toString() {
      return this._root.render(this.opts);
    }
    name(prefix) {
      return this._scope.name(prefix);
    }
    scopeName(prefix) {
      return this._extScope.name(prefix);
    }
    scopeValue(prefixOrName, value) {
      const name = this._extScope.value(prefixOrName, value);
      const vs = this._values[name.prefix] || (this._values[name.prefix] = new Set);
      vs.add(name);
      return name;
    }
    getScopeValue(prefix, keyOrRef) {
      return this._extScope.getValue(prefix, keyOrRef);
    }
    scopeRefs(scopeName) {
      return this._extScope.scopeRefs(scopeName, this._values);
    }
    scopeCode() {
      return this._extScope.scopeCode(this._values);
    }
    _def(varKind, nameOrPrefix, rhs, constant) {
      const name = this._scope.toName(nameOrPrefix);
      if (rhs !== undefined && constant)
        this._constants[name.str] = rhs;
      this._leafNode(new Def(varKind, name, rhs));
      return name;
    }
    const(nameOrPrefix, rhs, _constant) {
      return this._def(scope_1.varKinds.const, nameOrPrefix, rhs, _constant);
    }
    let(nameOrPrefix, rhs, _constant) {
      return this._def(scope_1.varKinds.let, nameOrPrefix, rhs, _constant);
    }
    var(nameOrPrefix, rhs, _constant) {
      return this._def(scope_1.varKinds.var, nameOrPrefix, rhs, _constant);
    }
    assign(lhs, rhs, sideEffects) {
      return this._leafNode(new Assign(lhs, rhs, sideEffects));
    }
    add(lhs, rhs) {
      return this._leafNode(new AssignOp(lhs, exports.operators.ADD, rhs));
    }
    code(c) {
      if (typeof c == "function")
        c();
      else if (c !== code_1.nil)
        this._leafNode(new AnyCode(c));
      return this;
    }
    object(...keyValues) {
      const code = ["{"];
      for (const [key, value] of keyValues) {
        if (code.length > 1)
          code.push(",");
        code.push(key);
        if (key !== value || this.opts.es5) {
          code.push(":");
          (0, code_1.addCodeArg)(code, value);
        }
      }
      code.push("}");
      return new code_1._Code(code);
    }
    if(condition, thenBody, elseBody) {
      this._blockNode(new If(condition));
      if (thenBody && elseBody) {
        this.code(thenBody).else().code(elseBody).endIf();
      } else if (thenBody) {
        this.code(thenBody).endIf();
      } else if (elseBody) {
        throw new Error('CodeGen: "else" body without "then" body');
      }
      return this;
    }
    elseIf(condition) {
      return this._elseNode(new If(condition));
    }
    else() {
      return this._elseNode(new Else);
    }
    endIf() {
      return this._endBlockNode(If, Else);
    }
    _for(node, forBody) {
      this._blockNode(node);
      if (forBody)
        this.code(forBody).endFor();
      return this;
    }
    for(iteration, forBody) {
      return this._for(new ForLoop(iteration), forBody);
    }
    forRange(nameOrPrefix, from, to, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.let) {
      const name = this._scope.toName(nameOrPrefix);
      return this._for(new ForRange(varKind, name, from, to), () => forBody(name));
    }
    forOf(nameOrPrefix, iterable, forBody, varKind = scope_1.varKinds.const) {
      const name = this._scope.toName(nameOrPrefix);
      if (this.opts.es5) {
        const arr = iterable instanceof code_1.Name ? iterable : this.var("_arr", iterable);
        return this.forRange("_i", 0, (0, code_1._)`${arr}.length`, (i) => {
          this.var(name, (0, code_1._)`${arr}[${i}]`);
          forBody(name);
        });
      }
      return this._for(new ForIter("of", varKind, name, iterable), () => forBody(name));
    }
    forIn(nameOrPrefix, obj, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.const) {
      if (this.opts.ownProperties) {
        return this.forOf(nameOrPrefix, (0, code_1._)`Object.keys(${obj})`, forBody);
      }
      const name = this._scope.toName(nameOrPrefix);
      return this._for(new ForIter("in", varKind, name, obj), () => forBody(name));
    }
    endFor() {
      return this._endBlockNode(For);
    }
    label(label) {
      return this._leafNode(new Label(label));
    }
    break(label) {
      return this._leafNode(new Break(label));
    }
    return(value) {
      const node = new Return;
      this._blockNode(node);
      this.code(value);
      if (node.nodes.length !== 1)
        throw new Error('CodeGen: "return" should have one node');
      return this._endBlockNode(Return);
    }
    try(tryBody, catchCode, finallyCode) {
      if (!catchCode && !finallyCode)
        throw new Error('CodeGen: "try" without "catch" and "finally"');
      const node = new Try;
      this._blockNode(node);
      this.code(tryBody);
      if (catchCode) {
        const error2 = this.name("e");
        this._currNode = node.catch = new Catch(error2);
        catchCode(error2);
      }
      if (finallyCode) {
        this._currNode = node.finally = new Finally;
        this.code(finallyCode);
      }
      return this._endBlockNode(Catch, Finally);
    }
    throw(error2) {
      return this._leafNode(new Throw(error2));
    }
    block(body, nodeCount) {
      this._blockStarts.push(this._nodes.length);
      if (body)
        this.code(body).endBlock(nodeCount);
      return this;
    }
    endBlock(nodeCount) {
      const len = this._blockStarts.pop();
      if (len === undefined)
        throw new Error("CodeGen: not in self-balancing block");
      const toClose = this._nodes.length - len;
      if (toClose < 0 || nodeCount !== undefined && toClose !== nodeCount) {
        throw new Error(`CodeGen: wrong number of nodes: ${toClose} vs ${nodeCount} expected`);
      }
      this._nodes.length = len;
      return this;
    }
    func(name, args = code_1.nil, async, funcBody) {
      this._blockNode(new Func(name, args, async));
      if (funcBody)
        this.code(funcBody).endFunc();
      return this;
    }
    endFunc() {
      return this._endBlockNode(Func);
    }
    optimize(n = 1) {
      while (n-- > 0) {
        this._root.optimizeNodes();
        this._root.optimizeNames(this._root.names, this._constants);
      }
    }
    _leafNode(node) {
      this._currNode.nodes.push(node);
      return this;
    }
    _blockNode(node) {
      this._currNode.nodes.push(node);
      this._nodes.push(node);
    }
    _endBlockNode(N1, N2) {
      const n = this._currNode;
      if (n instanceof N1 || N2 && n instanceof N2) {
        this._nodes.pop();
        return this;
      }
      throw new Error(`CodeGen: not in block "${N2 ? `${N1.kind}/${N2.kind}` : N1.kind}"`);
    }
    _elseNode(node) {
      const n = this._currNode;
      if (!(n instanceof If)) {
        throw new Error('CodeGen: "else" without "if"');
      }
      this._currNode = n.else = node;
      return this;
    }
    get _root() {
      return this._nodes[0];
    }
    get _currNode() {
      const ns = this._nodes;
      return ns[ns.length - 1];
    }
    set _currNode(node) {
      const ns = this._nodes;
      ns[ns.length - 1] = node;
    }
  }
  exports.CodeGen = CodeGen;
  function addNames(names, from) {
    for (const n in from)
      names[n] = (names[n] || 0) + (from[n] || 0);
    return names;
  }
  function addExprNames(names, from) {
    return from instanceof code_1._CodeOrName ? addNames(names, from.names) : names;
  }
  function optimizeExpr(expr, names, constants) {
    if (expr instanceof code_1.Name)
      return replaceName(expr);
    if (!canOptimize(expr))
      return expr;
    return new code_1._Code(expr._items.reduce((items, c) => {
      if (c instanceof code_1.Name)
        c = replaceName(c);
      if (c instanceof code_1._Code)
        items.push(...c._items);
      else
        items.push(c);
      return items;
    }, []));
    function replaceName(n) {
      const c = constants[n.str];
      if (c === undefined || names[n.str] !== 1)
        return n;
      delete names[n.str];
      return c;
    }
    function canOptimize(e) {
      return e instanceof code_1._Code && e._items.some((c) => c instanceof code_1.Name && names[c.str] === 1 && constants[c.str] !== undefined);
    }
  }
  function subtractNames(names, from) {
    for (const n in from)
      names[n] = (names[n] || 0) - (from[n] || 0);
  }
  function not(x) {
    return typeof x == "boolean" || typeof x == "number" || x === null ? !x : (0, code_1._)`!${par(x)}`;
  }
  exports.not = not;
  var andCode = mappend(exports.operators.AND);
  function and(...args) {
    return args.reduce(andCode);
  }
  exports.and = and;
  var orCode = mappend(exports.operators.OR);
  function or(...args) {
    return args.reduce(orCode);
  }
  exports.or = or;
  function mappend(op) {
    return (x, y) => x === code_1.nil ? y : y === code_1.nil ? x : (0, code_1._)`${par(x)} ${op} ${par(y)}`;
  }
  function par(x) {
    return x instanceof code_1.Name ? x : (0, code_1._)`(${x})`;
  }
});

// node_modules/ajv/dist/compile/util.js
var require_util = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.checkStrictMode = exports.getErrorPath = exports.Type = exports.useFunc = exports.setEvaluated = exports.evaluatedPropsToName = exports.mergeEvaluated = exports.eachItem = exports.unescapeJsonPointer = exports.escapeJsonPointer = exports.escapeFragment = exports.unescapeFragment = exports.schemaRefOrVal = exports.schemaHasRulesButRef = exports.schemaHasRules = exports.checkUnknownRules = exports.alwaysValidSchema = exports.toHash = undefined;
  var codegen_1 = require_codegen();
  var code_1 = require_code();
  function toHash(arr) {
    const hash = {};
    for (const item of arr)
      hash[item] = true;
    return hash;
  }
  exports.toHash = toHash;
  function alwaysValidSchema(it, schema) {
    if (typeof schema == "boolean")
      return schema;
    if (Object.keys(schema).length === 0)
      return true;
    checkUnknownRules(it, schema);
    return !schemaHasRules(schema, it.self.RULES.all);
  }
  exports.alwaysValidSchema = alwaysValidSchema;
  function checkUnknownRules(it, schema = it.schema) {
    const { opts, self: self2 } = it;
    if (!opts.strictSchema)
      return;
    if (typeof schema === "boolean")
      return;
    const rules = self2.RULES.keywords;
    for (const key in schema) {
      if (!rules[key])
        checkStrictMode(it, `unknown keyword: "${key}"`);
    }
  }
  exports.checkUnknownRules = checkUnknownRules;
  function schemaHasRules(schema, rules) {
    if (typeof schema == "boolean")
      return !schema;
    for (const key in schema)
      if (rules[key])
        return true;
    return false;
  }
  exports.schemaHasRules = schemaHasRules;
  function schemaHasRulesButRef(schema, RULES) {
    if (typeof schema == "boolean")
      return !schema;
    for (const key in schema)
      if (key !== "$ref" && RULES.all[key])
        return true;
    return false;
  }
  exports.schemaHasRulesButRef = schemaHasRulesButRef;
  function schemaRefOrVal({ topSchemaRef, schemaPath }, schema, keyword, $data) {
    if (!$data) {
      if (typeof schema == "number" || typeof schema == "boolean")
        return schema;
      if (typeof schema == "string")
        return (0, codegen_1._)`${schema}`;
    }
    return (0, codegen_1._)`${topSchemaRef}${schemaPath}${(0, codegen_1.getProperty)(keyword)}`;
  }
  exports.schemaRefOrVal = schemaRefOrVal;
  function unescapeFragment(str) {
    return unescapeJsonPointer(decodeURIComponent(str));
  }
  exports.unescapeFragment = unescapeFragment;
  function escapeFragment(str) {
    return encodeURIComponent(escapeJsonPointer(str));
  }
  exports.escapeFragment = escapeFragment;
  function escapeJsonPointer(str) {
    if (typeof str == "number")
      return `${str}`;
    return str.replace(/~/g, "~0").replace(/\//g, "~1");
  }
  exports.escapeJsonPointer = escapeJsonPointer;
  function unescapeJsonPointer(str) {
    return str.replace(/~1/g, "/").replace(/~0/g, "~");
  }
  exports.unescapeJsonPointer = unescapeJsonPointer;
  function eachItem(xs, f) {
    if (Array.isArray(xs)) {
      for (const x of xs)
        f(x);
    } else {
      f(xs);
    }
  }
  exports.eachItem = eachItem;
  function makeMergeEvaluated({ mergeNames, mergeToName, mergeValues: mergeValues3, resultToName }) {
    return (gen, from, to, toName) => {
      const res = to === undefined ? from : to instanceof codegen_1.Name ? (from instanceof codegen_1.Name ? mergeNames(gen, from, to) : mergeToName(gen, from, to), to) : from instanceof codegen_1.Name ? (mergeToName(gen, to, from), from) : mergeValues3(from, to);
      return toName === codegen_1.Name && !(res instanceof codegen_1.Name) ? resultToName(gen, res) : res;
    };
  }
  exports.mergeEvaluated = {
    props: makeMergeEvaluated({
      mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => {
        gen.if((0, codegen_1._)`${from} === true`, () => gen.assign(to, true), () => gen.assign(to, (0, codegen_1._)`${to} || {}`).code((0, codegen_1._)`Object.assign(${to}, ${from})`));
      }),
      mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => {
        if (from === true) {
          gen.assign(to, true);
        } else {
          gen.assign(to, (0, codegen_1._)`${to} || {}`);
          setEvaluated(gen, to, from);
        }
      }),
      mergeValues: (from, to) => from === true ? true : { ...from, ...to },
      resultToName: evaluatedPropsToName
    }),
    items: makeMergeEvaluated({
      mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => gen.assign(to, (0, codegen_1._)`${from} === true ? true : ${to} > ${from} ? ${to} : ${from}`)),
      mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => gen.assign(to, from === true ? true : (0, codegen_1._)`${to} > ${from} ? ${to} : ${from}`)),
      mergeValues: (from, to) => from === true ? true : Math.max(from, to),
      resultToName: (gen, items) => gen.var("items", items)
    })
  };
  function evaluatedPropsToName(gen, ps) {
    if (ps === true)
      return gen.var("props", true);
    const props = gen.var("props", (0, codegen_1._)`{}`);
    if (ps !== undefined)
      setEvaluated(gen, props, ps);
    return props;
  }
  exports.evaluatedPropsToName = evaluatedPropsToName;
  function setEvaluated(gen, props, ps) {
    Object.keys(ps).forEach((p) => gen.assign((0, codegen_1._)`${props}${(0, codegen_1.getProperty)(p)}`, true));
  }
  exports.setEvaluated = setEvaluated;
  var snippets = {};
  function useFunc(gen, f) {
    return gen.scopeValue("func", {
      ref: f,
      code: snippets[f.code] || (snippets[f.code] = new code_1._Code(f.code))
    });
  }
  exports.useFunc = useFunc;
  var Type;
  (function(Type2) {
    Type2[Type2["Num"] = 0] = "Num";
    Type2[Type2["Str"] = 1] = "Str";
  })(Type || (exports.Type = Type = {}));
  function getErrorPath(dataProp, dataPropType, jsPropertySyntax) {
    if (dataProp instanceof codegen_1.Name) {
      const isNumber = dataPropType === Type.Num;
      return jsPropertySyntax ? isNumber ? (0, codegen_1._)`"[" + ${dataProp} + "]"` : (0, codegen_1._)`"['" + ${dataProp} + "']"` : isNumber ? (0, codegen_1._)`"/" + ${dataProp}` : (0, codegen_1._)`"/" + ${dataProp}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
    }
    return jsPropertySyntax ? (0, codegen_1.getProperty)(dataProp).toString() : "/" + escapeJsonPointer(dataProp);
  }
  exports.getErrorPath = getErrorPath;
  function checkStrictMode(it, msg, mode = it.opts.strictSchema) {
    if (!mode)
      return;
    msg = `strict mode: ${msg}`;
    if (mode === true)
      throw new Error(msg);
    it.self.logger.warn(msg);
  }
  exports.checkStrictMode = checkStrictMode;
});

// node_modules/ajv/dist/compile/names.js
var require_names = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var names = {
    data: new codegen_1.Name("data"),
    valCxt: new codegen_1.Name("valCxt"),
    instancePath: new codegen_1.Name("instancePath"),
    parentData: new codegen_1.Name("parentData"),
    parentDataProperty: new codegen_1.Name("parentDataProperty"),
    rootData: new codegen_1.Name("rootData"),
    dynamicAnchors: new codegen_1.Name("dynamicAnchors"),
    vErrors: new codegen_1.Name("vErrors"),
    errors: new codegen_1.Name("errors"),
    this: new codegen_1.Name("this"),
    self: new codegen_1.Name("self"),
    scope: new codegen_1.Name("scope"),
    json: new codegen_1.Name("json"),
    jsonPos: new codegen_1.Name("jsonPos"),
    jsonLen: new codegen_1.Name("jsonLen"),
    jsonPart: new codegen_1.Name("jsonPart")
  };
  exports.default = names;
});

// node_modules/ajv/dist/compile/errors.js
var require_errors = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.extendErrors = exports.resetErrorsCount = exports.reportExtraError = exports.reportError = exports.keyword$DataError = exports.keywordError = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var names_1 = require_names();
  exports.keywordError = {
    message: ({ keyword }) => (0, codegen_1.str)`must pass "${keyword}" keyword validation`
  };
  exports.keyword$DataError = {
    message: ({ keyword, schemaType }) => schemaType ? (0, codegen_1.str)`"${keyword}" keyword must be ${schemaType} ($data)` : (0, codegen_1.str)`"${keyword}" keyword is invalid ($data)`
  };
  function reportError(cxt, error2 = exports.keywordError, errorPaths, overrideAllErrors) {
    const { it } = cxt;
    const { gen, compositeRule, allErrors } = it;
    const errObj = errorObjectCode(cxt, error2, errorPaths);
    if (overrideAllErrors !== null && overrideAllErrors !== undefined ? overrideAllErrors : compositeRule || allErrors) {
      addError(gen, errObj);
    } else {
      returnErrors(it, (0, codegen_1._)`[${errObj}]`);
    }
  }
  exports.reportError = reportError;
  function reportExtraError(cxt, error2 = exports.keywordError, errorPaths) {
    const { it } = cxt;
    const { gen, compositeRule, allErrors } = it;
    const errObj = errorObjectCode(cxt, error2, errorPaths);
    addError(gen, errObj);
    if (!(compositeRule || allErrors)) {
      returnErrors(it, names_1.default.vErrors);
    }
  }
  exports.reportExtraError = reportExtraError;
  function resetErrorsCount(gen, errsCount) {
    gen.assign(names_1.default.errors, errsCount);
    gen.if((0, codegen_1._)`${names_1.default.vErrors} !== null`, () => gen.if(errsCount, () => gen.assign((0, codegen_1._)`${names_1.default.vErrors}.length`, errsCount), () => gen.assign(names_1.default.vErrors, null)));
  }
  exports.resetErrorsCount = resetErrorsCount;
  function extendErrors({ gen, keyword, schemaValue, data, errsCount, it }) {
    if (errsCount === undefined)
      throw new Error("ajv implementation error");
    const err = gen.name("err");
    gen.forRange("i", errsCount, names_1.default.errors, (i) => {
      gen.const(err, (0, codegen_1._)`${names_1.default.vErrors}[${i}]`);
      gen.if((0, codegen_1._)`${err}.instancePath === undefined`, () => gen.assign((0, codegen_1._)`${err}.instancePath`, (0, codegen_1.strConcat)(names_1.default.instancePath, it.errorPath)));
      gen.assign((0, codegen_1._)`${err}.schemaPath`, (0, codegen_1.str)`${it.errSchemaPath}/${keyword}`);
      if (it.opts.verbose) {
        gen.assign((0, codegen_1._)`${err}.schema`, schemaValue);
        gen.assign((0, codegen_1._)`${err}.data`, data);
      }
    });
  }
  exports.extendErrors = extendErrors;
  function addError(gen, errObj) {
    const err = gen.const("err", errObj);
    gen.if((0, codegen_1._)`${names_1.default.vErrors} === null`, () => gen.assign(names_1.default.vErrors, (0, codegen_1._)`[${err}]`), (0, codegen_1._)`${names_1.default.vErrors}.push(${err})`);
    gen.code((0, codegen_1._)`${names_1.default.errors}++`);
  }
  function returnErrors(it, errs) {
    const { gen, validateName, schemaEnv } = it;
    if (schemaEnv.$async) {
      gen.throw((0, codegen_1._)`new ${it.ValidationError}(${errs})`);
    } else {
      gen.assign((0, codegen_1._)`${validateName}.errors`, errs);
      gen.return(false);
    }
  }
  var E = {
    keyword: new codegen_1.Name("keyword"),
    schemaPath: new codegen_1.Name("schemaPath"),
    params: new codegen_1.Name("params"),
    propertyName: new codegen_1.Name("propertyName"),
    message: new codegen_1.Name("message"),
    schema: new codegen_1.Name("schema"),
    parentSchema: new codegen_1.Name("parentSchema")
  };
  function errorObjectCode(cxt, error2, errorPaths) {
    const { createErrors } = cxt.it;
    if (createErrors === false)
      return (0, codegen_1._)`{}`;
    return errorObject(cxt, error2, errorPaths);
  }
  function errorObject(cxt, error2, errorPaths = {}) {
    const { gen, it } = cxt;
    const keyValues = [
      errorInstancePath(it, errorPaths),
      errorSchemaPath(cxt, errorPaths)
    ];
    extraErrorProps(cxt, error2, keyValues);
    return gen.object(...keyValues);
  }
  function errorInstancePath({ errorPath }, { instancePath }) {
    const instPath = instancePath ? (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(instancePath, util_1.Type.Str)}` : errorPath;
    return [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, instPath)];
  }
  function errorSchemaPath({ keyword, it: { errSchemaPath } }, { schemaPath, parentSchema }) {
    let schPath = parentSchema ? errSchemaPath : (0, codegen_1.str)`${errSchemaPath}/${keyword}`;
    if (schemaPath) {
      schPath = (0, codegen_1.str)`${schPath}${(0, util_1.getErrorPath)(schemaPath, util_1.Type.Str)}`;
    }
    return [E.schemaPath, schPath];
  }
  function extraErrorProps(cxt, { params, message }, keyValues) {
    const { keyword, data, schemaValue, it } = cxt;
    const { opts, propertyName, topSchemaRef, schemaPath } = it;
    keyValues.push([E.keyword, keyword], [E.params, typeof params == "function" ? params(cxt) : params || (0, codegen_1._)`{}`]);
    if (opts.messages) {
      keyValues.push([E.message, typeof message == "function" ? message(cxt) : message]);
    }
    if (opts.verbose) {
      keyValues.push([E.schema, schemaValue], [E.parentSchema, (0, codegen_1._)`${topSchemaRef}${schemaPath}`], [names_1.default.data, data]);
    }
    if (propertyName)
      keyValues.push([E.propertyName, propertyName]);
  }
});

// node_modules/ajv/dist/compile/validate/boolSchema.js
var require_boolSchema = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.boolOrEmptySchema = exports.topBoolOrEmptySchema = undefined;
  var errors_1 = require_errors();
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var boolError = {
    message: "boolean schema is false"
  };
  function topBoolOrEmptySchema(it) {
    const { gen, schema, validateName } = it;
    if (schema === false) {
      falseSchemaError(it, false);
    } else if (typeof schema == "object" && schema.$async === true) {
      gen.return(names_1.default.data);
    } else {
      gen.assign((0, codegen_1._)`${validateName}.errors`, null);
      gen.return(true);
    }
  }
  exports.topBoolOrEmptySchema = topBoolOrEmptySchema;
  function boolOrEmptySchema(it, valid) {
    const { gen, schema } = it;
    if (schema === false) {
      gen.var(valid, false);
      falseSchemaError(it);
    } else {
      gen.var(valid, true);
    }
  }
  exports.boolOrEmptySchema = boolOrEmptySchema;
  function falseSchemaError(it, overrideAllErrors) {
    const { gen, data } = it;
    const cxt = {
      gen,
      keyword: "false schema",
      data,
      schema: false,
      schemaCode: false,
      schemaValue: false,
      params: {},
      it
    };
    (0, errors_1.reportError)(cxt, boolError, undefined, overrideAllErrors);
  }
});

// node_modules/ajv/dist/compile/rules.js
var require_rules = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getRules = exports.isJSONType = undefined;
  var _jsonTypes = ["string", "number", "integer", "boolean", "null", "object", "array"];
  var jsonTypes = new Set(_jsonTypes);
  function isJSONType(x) {
    return typeof x == "string" && jsonTypes.has(x);
  }
  exports.isJSONType = isJSONType;
  function getRules() {
    const groups = {
      number: { type: "number", rules: [] },
      string: { type: "string", rules: [] },
      array: { type: "array", rules: [] },
      object: { type: "object", rules: [] }
    };
    return {
      types: { ...groups, integer: true, boolean: true, null: true },
      rules: [{ rules: [] }, groups.number, groups.string, groups.array, groups.object],
      post: { rules: [] },
      all: {},
      keywords: {}
    };
  }
  exports.getRules = getRules;
});

// node_modules/ajv/dist/compile/validate/applicability.js
var require_applicability = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.shouldUseRule = exports.shouldUseGroup = exports.schemaHasRulesForType = undefined;
  function schemaHasRulesForType({ schema, self: self2 }, type) {
    const group = self2.RULES.types[type];
    return group && group !== true && shouldUseGroup(schema, group);
  }
  exports.schemaHasRulesForType = schemaHasRulesForType;
  function shouldUseGroup(schema, group) {
    return group.rules.some((rule) => shouldUseRule(schema, rule));
  }
  exports.shouldUseGroup = shouldUseGroup;
  function shouldUseRule(schema, rule) {
    var _a;
    return schema[rule.keyword] !== undefined || ((_a = rule.definition.implements) === null || _a === undefined ? undefined : _a.some((kwd) => schema[kwd] !== undefined));
  }
  exports.shouldUseRule = shouldUseRule;
});

// node_modules/ajv/dist/compile/validate/dataType.js
var require_dataType = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.reportTypeError = exports.checkDataTypes = exports.checkDataType = exports.coerceAndCheckDataType = exports.getJSONTypes = exports.getSchemaTypes = exports.DataType = undefined;
  var rules_1 = require_rules();
  var applicability_1 = require_applicability();
  var errors_1 = require_errors();
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var DataType;
  (function(DataType2) {
    DataType2[DataType2["Correct"] = 0] = "Correct";
    DataType2[DataType2["Wrong"] = 1] = "Wrong";
  })(DataType || (exports.DataType = DataType = {}));
  function getSchemaTypes(schema) {
    const types2 = getJSONTypes(schema.type);
    const hasNull = types2.includes("null");
    if (hasNull) {
      if (schema.nullable === false)
        throw new Error("type: null contradicts nullable: false");
    } else {
      if (!types2.length && schema.nullable !== undefined) {
        throw new Error('"nullable" cannot be used without "type"');
      }
      if (schema.nullable === true)
        types2.push("null");
    }
    return types2;
  }
  exports.getSchemaTypes = getSchemaTypes;
  function getJSONTypes(ts) {
    const types2 = Array.isArray(ts) ? ts : ts ? [ts] : [];
    if (types2.every(rules_1.isJSONType))
      return types2;
    throw new Error("type must be JSONType or JSONType[]: " + types2.join(","));
  }
  exports.getJSONTypes = getJSONTypes;
  function coerceAndCheckDataType(it, types2) {
    const { gen, data, opts } = it;
    const coerceTo = coerceToTypes(types2, opts.coerceTypes);
    const checkTypes = types2.length > 0 && !(coerceTo.length === 0 && types2.length === 1 && (0, applicability_1.schemaHasRulesForType)(it, types2[0]));
    if (checkTypes) {
      const wrongType = checkDataTypes(types2, data, opts.strictNumbers, DataType.Wrong);
      gen.if(wrongType, () => {
        if (coerceTo.length)
          coerceData(it, types2, coerceTo);
        else
          reportTypeError(it);
      });
    }
    return checkTypes;
  }
  exports.coerceAndCheckDataType = coerceAndCheckDataType;
  var COERCIBLE = new Set(["string", "number", "integer", "boolean", "null"]);
  function coerceToTypes(types2, coerceTypes) {
    return coerceTypes ? types2.filter((t) => COERCIBLE.has(t) || coerceTypes === "array" && t === "array") : [];
  }
  function coerceData(it, types2, coerceTo) {
    const { gen, data, opts } = it;
    const dataType = gen.let("dataType", (0, codegen_1._)`typeof ${data}`);
    const coerced = gen.let("coerced", (0, codegen_1._)`undefined`);
    if (opts.coerceTypes === "array") {
      gen.if((0, codegen_1._)`${dataType} == 'object' && Array.isArray(${data}) && ${data}.length == 1`, () => gen.assign(data, (0, codegen_1._)`${data}[0]`).assign(dataType, (0, codegen_1._)`typeof ${data}`).if(checkDataTypes(types2, data, opts.strictNumbers), () => gen.assign(coerced, data)));
    }
    gen.if((0, codegen_1._)`${coerced} !== undefined`);
    for (const t of coerceTo) {
      if (COERCIBLE.has(t) || t === "array" && opts.coerceTypes === "array") {
        coerceSpecificType(t);
      }
    }
    gen.else();
    reportTypeError(it);
    gen.endIf();
    gen.if((0, codegen_1._)`${coerced} !== undefined`, () => {
      gen.assign(data, coerced);
      assignParentData(it, coerced);
    });
    function coerceSpecificType(t) {
      switch (t) {
        case "string":
          gen.elseIf((0, codegen_1._)`${dataType} == "number" || ${dataType} == "boolean"`).assign(coerced, (0, codegen_1._)`"" + ${data}`).elseIf((0, codegen_1._)`${data} === null`).assign(coerced, (0, codegen_1._)`""`);
          return;
        case "number":
          gen.elseIf((0, codegen_1._)`${dataType} == "boolean" || ${data} === null
              || (${dataType} == "string" && ${data} && ${data} == +${data})`).assign(coerced, (0, codegen_1._)`+${data}`);
          return;
        case "integer":
          gen.elseIf((0, codegen_1._)`${dataType} === "boolean" || ${data} === null
              || (${dataType} === "string" && ${data} && ${data} == +${data} && !(${data} % 1))`).assign(coerced, (0, codegen_1._)`+${data}`);
          return;
        case "boolean":
          gen.elseIf((0, codegen_1._)`${data} === "false" || ${data} === 0 || ${data} === null`).assign(coerced, false).elseIf((0, codegen_1._)`${data} === "true" || ${data} === 1`).assign(coerced, true);
          return;
        case "null":
          gen.elseIf((0, codegen_1._)`${data} === "" || ${data} === 0 || ${data} === false`);
          gen.assign(coerced, null);
          return;
        case "array":
          gen.elseIf((0, codegen_1._)`${dataType} === "string" || ${dataType} === "number"
              || ${dataType} === "boolean" || ${data} === null`).assign(coerced, (0, codegen_1._)`[${data}]`);
      }
    }
  }
  function assignParentData({ gen, parentData, parentDataProperty }, expr) {
    gen.if((0, codegen_1._)`${parentData} !== undefined`, () => gen.assign((0, codegen_1._)`${parentData}[${parentDataProperty}]`, expr));
  }
  function checkDataType(dataType, data, strictNums, correct = DataType.Correct) {
    const EQ = correct === DataType.Correct ? codegen_1.operators.EQ : codegen_1.operators.NEQ;
    let cond;
    switch (dataType) {
      case "null":
        return (0, codegen_1._)`${data} ${EQ} null`;
      case "array":
        cond = (0, codegen_1._)`Array.isArray(${data})`;
        break;
      case "object":
        cond = (0, codegen_1._)`${data} && typeof ${data} == "object" && !Array.isArray(${data})`;
        break;
      case "integer":
        cond = numCond((0, codegen_1._)`!(${data} % 1) && !isNaN(${data})`);
        break;
      case "number":
        cond = numCond();
        break;
      default:
        return (0, codegen_1._)`typeof ${data} ${EQ} ${dataType}`;
    }
    return correct === DataType.Correct ? cond : (0, codegen_1.not)(cond);
    function numCond(_cond = codegen_1.nil) {
      return (0, codegen_1.and)((0, codegen_1._)`typeof ${data} == "number"`, _cond, strictNums ? (0, codegen_1._)`isFinite(${data})` : codegen_1.nil);
    }
  }
  exports.checkDataType = checkDataType;
  function checkDataTypes(dataTypes, data, strictNums, correct) {
    if (dataTypes.length === 1) {
      return checkDataType(dataTypes[0], data, strictNums, correct);
    }
    let cond;
    const types2 = (0, util_1.toHash)(dataTypes);
    if (types2.array && types2.object) {
      const notObj = (0, codegen_1._)`typeof ${data} != "object"`;
      cond = types2.null ? notObj : (0, codegen_1._)`!${data} || ${notObj}`;
      delete types2.null;
      delete types2.array;
      delete types2.object;
    } else {
      cond = codegen_1.nil;
    }
    if (types2.number)
      delete types2.integer;
    for (const t in types2)
      cond = (0, codegen_1.and)(cond, checkDataType(t, data, strictNums, correct));
    return cond;
  }
  exports.checkDataTypes = checkDataTypes;
  var typeError = {
    message: ({ schema }) => `must be ${schema}`,
    params: ({ schema, schemaValue }) => typeof schema == "string" ? (0, codegen_1._)`{type: ${schema}}` : (0, codegen_1._)`{type: ${schemaValue}}`
  };
  function reportTypeError(it) {
    const cxt = getTypeErrorContext(it);
    (0, errors_1.reportError)(cxt, typeError);
  }
  exports.reportTypeError = reportTypeError;
  function getTypeErrorContext(it) {
    const { gen, data, schema } = it;
    const schemaCode = (0, util_1.schemaRefOrVal)(it, schema, "type");
    return {
      gen,
      keyword: "type",
      data,
      schema: schema.type,
      schemaCode,
      schemaValue: schemaCode,
      parentSchema: schema,
      params: {},
      it
    };
  }
});

// node_modules/ajv/dist/compile/validate/defaults.js
var require_defaults = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.assignDefaults = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  function assignDefaults(it, ty) {
    const { properties, items } = it.schema;
    if (ty === "object" && properties) {
      for (const key in properties) {
        assignDefault(it, key, properties[key].default);
      }
    } else if (ty === "array" && Array.isArray(items)) {
      items.forEach((sch, i) => assignDefault(it, i, sch.default));
    }
  }
  exports.assignDefaults = assignDefaults;
  function assignDefault(it, prop, defaultValue) {
    const { gen, compositeRule, data, opts } = it;
    if (defaultValue === undefined)
      return;
    const childData = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(prop)}`;
    if (compositeRule) {
      (0, util_1.checkStrictMode)(it, `default is ignored for: ${childData}`);
      return;
    }
    let condition = (0, codegen_1._)`${childData} === undefined`;
    if (opts.useDefaults === "empty") {
      condition = (0, codegen_1._)`${condition} || ${childData} === null || ${childData} === ""`;
    }
    gen.if(condition, (0, codegen_1._)`${childData} = ${(0, codegen_1.stringify)(defaultValue)}`);
  }
});

// node_modules/ajv/dist/vocabularies/code.js
var require_code2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateUnion = exports.validateArray = exports.usePattern = exports.callValidateCode = exports.schemaProperties = exports.allSchemaProperties = exports.noPropertyInData = exports.propertyInData = exports.isOwnProperty = exports.hasPropFunc = exports.reportMissingProp = exports.checkMissingProp = exports.checkReportMissingProp = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var names_1 = require_names();
  var util_2 = require_util();
  function checkReportMissingProp(cxt, prop) {
    const { gen, data, it } = cxt;
    gen.if(noPropertyInData(gen, data, prop, it.opts.ownProperties), () => {
      cxt.setParams({ missingProperty: (0, codegen_1._)`${prop}` }, true);
      cxt.error();
    });
  }
  exports.checkReportMissingProp = checkReportMissingProp;
  function checkMissingProp({ gen, data, it: { opts } }, properties, missing) {
    return (0, codegen_1.or)(...properties.map((prop) => (0, codegen_1.and)(noPropertyInData(gen, data, prop, opts.ownProperties), (0, codegen_1._)`${missing} = ${prop}`)));
  }
  exports.checkMissingProp = checkMissingProp;
  function reportMissingProp(cxt, missing) {
    cxt.setParams({ missingProperty: missing }, true);
    cxt.error();
  }
  exports.reportMissingProp = reportMissingProp;
  function hasPropFunc(gen) {
    return gen.scopeValue("func", {
      ref: Object.prototype.hasOwnProperty,
      code: (0, codegen_1._)`Object.prototype.hasOwnProperty`
    });
  }
  exports.hasPropFunc = hasPropFunc;
  function isOwnProperty(gen, data, property) {
    return (0, codegen_1._)`${hasPropFunc(gen)}.call(${data}, ${property})`;
  }
  exports.isOwnProperty = isOwnProperty;
  function propertyInData(gen, data, property, ownProperties) {
    const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} !== undefined`;
    return ownProperties ? (0, codegen_1._)`${cond} && ${isOwnProperty(gen, data, property)}` : cond;
  }
  exports.propertyInData = propertyInData;
  function noPropertyInData(gen, data, property, ownProperties) {
    const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} === undefined`;
    return ownProperties ? (0, codegen_1.or)(cond, (0, codegen_1.not)(isOwnProperty(gen, data, property))) : cond;
  }
  exports.noPropertyInData = noPropertyInData;
  function allSchemaProperties(schemaMap) {
    return schemaMap ? Object.keys(schemaMap).filter((p) => p !== "__proto__") : [];
  }
  exports.allSchemaProperties = allSchemaProperties;
  function schemaProperties(it, schemaMap) {
    return allSchemaProperties(schemaMap).filter((p) => !(0, util_1.alwaysValidSchema)(it, schemaMap[p]));
  }
  exports.schemaProperties = schemaProperties;
  function callValidateCode({ schemaCode, data, it: { gen, topSchemaRef, schemaPath, errorPath }, it }, func, context, passSchema) {
    const dataAndSchema = passSchema ? (0, codegen_1._)`${schemaCode}, ${data}, ${topSchemaRef}${schemaPath}` : data;
    const valCxt = [
      [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, errorPath)],
      [names_1.default.parentData, it.parentData],
      [names_1.default.parentDataProperty, it.parentDataProperty],
      [names_1.default.rootData, names_1.default.rootData]
    ];
    if (it.opts.dynamicRef)
      valCxt.push([names_1.default.dynamicAnchors, names_1.default.dynamicAnchors]);
    const args = (0, codegen_1._)`${dataAndSchema}, ${gen.object(...valCxt)}`;
    return context !== codegen_1.nil ? (0, codegen_1._)`${func}.call(${context}, ${args})` : (0, codegen_1._)`${func}(${args})`;
  }
  exports.callValidateCode = callValidateCode;
  var newRegExp = (0, codegen_1._)`new RegExp`;
  function usePattern({ gen, it: { opts } }, pattern) {
    const u = opts.unicodeRegExp ? "u" : "";
    const { regExp } = opts.code;
    const rx = regExp(pattern, u);
    return gen.scopeValue("pattern", {
      key: rx.toString(),
      ref: rx,
      code: (0, codegen_1._)`${regExp.code === "new RegExp" ? newRegExp : (0, util_2.useFunc)(gen, regExp)}(${pattern}, ${u})`
    });
  }
  exports.usePattern = usePattern;
  function validateArray(cxt) {
    const { gen, data, keyword, it } = cxt;
    const valid = gen.name("valid");
    if (it.allErrors) {
      const validArr = gen.let("valid", true);
      validateItems(() => gen.assign(validArr, false));
      return validArr;
    }
    gen.var(valid, true);
    validateItems(() => gen.break());
    return valid;
    function validateItems(notValid) {
      const len = gen.const("len", (0, codegen_1._)`${data}.length`);
      gen.forRange("i", 0, len, (i) => {
        cxt.subschema({
          keyword,
          dataProp: i,
          dataPropType: util_1.Type.Num
        }, valid);
        gen.if((0, codegen_1.not)(valid), notValid);
      });
    }
  }
  exports.validateArray = validateArray;
  function validateUnion(cxt) {
    const { gen, schema, keyword, it } = cxt;
    if (!Array.isArray(schema))
      throw new Error("ajv implementation error");
    const alwaysValid = schema.some((sch) => (0, util_1.alwaysValidSchema)(it, sch));
    if (alwaysValid && !it.opts.unevaluated)
      return;
    const valid = gen.let("valid", false);
    const schValid = gen.name("_valid");
    gen.block(() => schema.forEach((_sch, i) => {
      const schCxt = cxt.subschema({
        keyword,
        schemaProp: i,
        compositeRule: true
      }, schValid);
      gen.assign(valid, (0, codegen_1._)`${valid} || ${schValid}`);
      const merged = cxt.mergeValidEvaluated(schCxt, schValid);
      if (!merged)
        gen.if((0, codegen_1.not)(valid));
    }));
    cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
  }
  exports.validateUnion = validateUnion;
});

// node_modules/ajv/dist/compile/validate/keyword.js
var require_keyword = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateKeywordUsage = exports.validSchemaType = exports.funcKeywordCode = exports.macroKeywordCode = undefined;
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var code_1 = require_code2();
  var errors_1 = require_errors();
  function macroKeywordCode(cxt, def) {
    const { gen, keyword, schema, parentSchema, it } = cxt;
    const macroSchema = def.macro.call(it.self, schema, parentSchema, it);
    const schemaRef = useKeyword(gen, keyword, macroSchema);
    if (it.opts.validateSchema !== false)
      it.self.validateSchema(macroSchema, true);
    const valid = gen.name("valid");
    cxt.subschema({
      schema: macroSchema,
      schemaPath: codegen_1.nil,
      errSchemaPath: `${it.errSchemaPath}/${keyword}`,
      topSchemaRef: schemaRef,
      compositeRule: true
    }, valid);
    cxt.pass(valid, () => cxt.error(true));
  }
  exports.macroKeywordCode = macroKeywordCode;
  function funcKeywordCode(cxt, def) {
    var _a;
    const { gen, keyword, schema, parentSchema, $data, it } = cxt;
    checkAsyncKeyword(it, def);
    const validate = !$data && def.compile ? def.compile.call(it.self, schema, parentSchema, it) : def.validate;
    const validateRef = useKeyword(gen, keyword, validate);
    const valid = gen.let("valid");
    cxt.block$data(valid, validateKeyword);
    cxt.ok((_a = def.valid) !== null && _a !== undefined ? _a : valid);
    function validateKeyword() {
      if (def.errors === false) {
        assignValid();
        if (def.modifying)
          modifyData(cxt);
        reportErrs(() => cxt.error());
      } else {
        const ruleErrs = def.async ? validateAsync() : validateSync();
        if (def.modifying)
          modifyData(cxt);
        reportErrs(() => addErrs(cxt, ruleErrs));
      }
    }
    function validateAsync() {
      const ruleErrs = gen.let("ruleErrs", null);
      gen.try(() => assignValid((0, codegen_1._)`await `), (e) => gen.assign(valid, false).if((0, codegen_1._)`${e} instanceof ${it.ValidationError}`, () => gen.assign(ruleErrs, (0, codegen_1._)`${e}.errors`), () => gen.throw(e)));
      return ruleErrs;
    }
    function validateSync() {
      const validateErrs = (0, codegen_1._)`${validateRef}.errors`;
      gen.assign(validateErrs, null);
      assignValid(codegen_1.nil);
      return validateErrs;
    }
    function assignValid(_await = def.async ? (0, codegen_1._)`await ` : codegen_1.nil) {
      const passCxt = it.opts.passContext ? names_1.default.this : names_1.default.self;
      const passSchema = !(("compile" in def) && !$data || def.schema === false);
      gen.assign(valid, (0, codegen_1._)`${_await}${(0, code_1.callValidateCode)(cxt, validateRef, passCxt, passSchema)}`, def.modifying);
    }
    function reportErrs(errors4) {
      var _a2;
      gen.if((0, codegen_1.not)((_a2 = def.valid) !== null && _a2 !== undefined ? _a2 : valid), errors4);
    }
  }
  exports.funcKeywordCode = funcKeywordCode;
  function modifyData(cxt) {
    const { gen, data, it } = cxt;
    gen.if(it.parentData, () => gen.assign(data, (0, codegen_1._)`${it.parentData}[${it.parentDataProperty}]`));
  }
  function addErrs(cxt, errs) {
    const { gen } = cxt;
    gen.if((0, codegen_1._)`Array.isArray(${errs})`, () => {
      gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`).assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
      (0, errors_1.extendErrors)(cxt);
    }, () => cxt.error());
  }
  function checkAsyncKeyword({ schemaEnv }, def) {
    if (def.async && !schemaEnv.$async)
      throw new Error("async keyword in sync schema");
  }
  function useKeyword(gen, keyword, result) {
    if (result === undefined)
      throw new Error(`keyword "${keyword}" failed to compile`);
    return gen.scopeValue("keyword", typeof result == "function" ? { ref: result } : { ref: result, code: (0, codegen_1.stringify)(result) });
  }
  function validSchemaType(schema, schemaType, allowUndefined = false) {
    return !schemaType.length || schemaType.some((st) => st === "array" ? Array.isArray(schema) : st === "object" ? schema && typeof schema == "object" && !Array.isArray(schema) : typeof schema == st || allowUndefined && typeof schema == "undefined");
  }
  exports.validSchemaType = validSchemaType;
  function validateKeywordUsage({ schema, opts, self: self2, errSchemaPath }, def, keyword) {
    if (Array.isArray(def.keyword) ? !def.keyword.includes(keyword) : def.keyword !== keyword) {
      throw new Error("ajv implementation error");
    }
    const deps = def.dependencies;
    if (deps === null || deps === undefined ? undefined : deps.some((kwd) => !Object.prototype.hasOwnProperty.call(schema, kwd))) {
      throw new Error(`parent schema must have dependencies of ${keyword}: ${deps.join(",")}`);
    }
    if (def.validateSchema) {
      const valid = def.validateSchema(schema[keyword]);
      if (!valid) {
        const msg = `keyword "${keyword}" value is invalid at path "${errSchemaPath}": ` + self2.errorsText(def.validateSchema.errors);
        if (opts.validateSchema === "log")
          self2.logger.error(msg);
        else
          throw new Error(msg);
      }
    }
  }
  exports.validateKeywordUsage = validateKeywordUsage;
});

// node_modules/ajv/dist/compile/validate/subschema.js
var require_subschema = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.extendSubschemaMode = exports.extendSubschemaData = exports.getSubschema = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  function getSubschema(it, { keyword, schemaProp, schema, schemaPath, errSchemaPath, topSchemaRef }) {
    if (keyword !== undefined && schema !== undefined) {
      throw new Error('both "keyword" and "schema" passed, only one allowed');
    }
    if (keyword !== undefined) {
      const sch = it.schema[keyword];
      return schemaProp === undefined ? {
        schema: sch,
        schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}`,
        errSchemaPath: `${it.errSchemaPath}/${keyword}`
      } : {
        schema: sch[schemaProp],
        schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}${(0, codegen_1.getProperty)(schemaProp)}`,
        errSchemaPath: `${it.errSchemaPath}/${keyword}/${(0, util_1.escapeFragment)(schemaProp)}`
      };
    }
    if (schema !== undefined) {
      if (schemaPath === undefined || errSchemaPath === undefined || topSchemaRef === undefined) {
        throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
      }
      return {
        schema,
        schemaPath,
        topSchemaRef,
        errSchemaPath
      };
    }
    throw new Error('either "keyword" or "schema" must be passed');
  }
  exports.getSubschema = getSubschema;
  function extendSubschemaData(subschema, it, { dataProp, dataPropType: dpType, data, dataTypes, propertyName }) {
    if (data !== undefined && dataProp !== undefined) {
      throw new Error('both "data" and "dataProp" passed, only one allowed');
    }
    const { gen } = it;
    if (dataProp !== undefined) {
      const { errorPath, dataPathArr, opts } = it;
      const nextData = gen.let("data", (0, codegen_1._)`${it.data}${(0, codegen_1.getProperty)(dataProp)}`, true);
      dataContextProps(nextData);
      subschema.errorPath = (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(dataProp, dpType, opts.jsPropertySyntax)}`;
      subschema.parentDataProperty = (0, codegen_1._)`${dataProp}`;
      subschema.dataPathArr = [...dataPathArr, subschema.parentDataProperty];
    }
    if (data !== undefined) {
      const nextData = data instanceof codegen_1.Name ? data : gen.let("data", data, true);
      dataContextProps(nextData);
      if (propertyName !== undefined)
        subschema.propertyName = propertyName;
    }
    if (dataTypes)
      subschema.dataTypes = dataTypes;
    function dataContextProps(_nextData) {
      subschema.data = _nextData;
      subschema.dataLevel = it.dataLevel + 1;
      subschema.dataTypes = [];
      it.definedProperties = new Set;
      subschema.parentData = it.data;
      subschema.dataNames = [...it.dataNames, _nextData];
    }
  }
  exports.extendSubschemaData = extendSubschemaData;
  function extendSubschemaMode(subschema, { jtdDiscriminator, jtdMetadata, compositeRule, createErrors, allErrors }) {
    if (compositeRule !== undefined)
      subschema.compositeRule = compositeRule;
    if (createErrors !== undefined)
      subschema.createErrors = createErrors;
    if (allErrors !== undefined)
      subschema.allErrors = allErrors;
    subschema.jtdDiscriminator = jtdDiscriminator;
    subschema.jtdMetadata = jtdMetadata;
  }
  exports.extendSubschemaMode = extendSubschemaMode;
});

// node_modules/fast-deep-equal/index.js
var require_fast_deep_equal = __commonJS((exports, module) => {
  module.exports = function equal(a, b) {
    if (a === b)
      return true;
    if (a && b && typeof a == "object" && typeof b == "object") {
      if (a.constructor !== b.constructor)
        return false;
      var length, i, keys;
      if (Array.isArray(a)) {
        length = a.length;
        if (length != b.length)
          return false;
        for (i = length;i-- !== 0; )
          if (!equal(a[i], b[i]))
            return false;
        return true;
      }
      if (a.constructor === RegExp)
        return a.source === b.source && a.flags === b.flags;
      if (a.valueOf !== Object.prototype.valueOf)
        return a.valueOf() === b.valueOf();
      if (a.toString !== Object.prototype.toString)
        return a.toString() === b.toString();
      keys = Object.keys(a);
      length = keys.length;
      if (length !== Object.keys(b).length)
        return false;
      for (i = length;i-- !== 0; )
        if (!Object.prototype.hasOwnProperty.call(b, keys[i]))
          return false;
      for (i = length;i-- !== 0; ) {
        var key = keys[i];
        if (!equal(a[key], b[key]))
          return false;
      }
      return true;
    }
    return a !== a && b !== b;
  };
});

// node_modules/json-schema-traverse/index.js
var require_json_schema_traverse = __commonJS((exports, module) => {
  var traverse = module.exports = function(schema, opts, cb) {
    if (typeof opts == "function") {
      cb = opts;
      opts = {};
    }
    cb = opts.cb || cb;
    var pre = typeof cb == "function" ? cb : cb.pre || function() {};
    var post = cb.post || function() {};
    _traverse(opts, pre, post, schema, "", schema);
  };
  traverse.keywords = {
    additionalItems: true,
    items: true,
    contains: true,
    additionalProperties: true,
    propertyNames: true,
    not: true,
    if: true,
    then: true,
    else: true
  };
  traverse.arrayKeywords = {
    items: true,
    allOf: true,
    anyOf: true,
    oneOf: true
  };
  traverse.propsKeywords = {
    $defs: true,
    definitions: true,
    properties: true,
    patternProperties: true,
    dependencies: true
  };
  traverse.skipKeywords = {
    default: true,
    enum: true,
    const: true,
    required: true,
    maximum: true,
    minimum: true,
    exclusiveMaximum: true,
    exclusiveMinimum: true,
    multipleOf: true,
    maxLength: true,
    minLength: true,
    pattern: true,
    format: true,
    maxItems: true,
    minItems: true,
    uniqueItems: true,
    maxProperties: true,
    minProperties: true
  };
  function _traverse(opts, pre, post, schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
    if (schema && typeof schema == "object" && !Array.isArray(schema)) {
      pre(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
      for (var key in schema) {
        var sch = schema[key];
        if (Array.isArray(sch)) {
          if (key in traverse.arrayKeywords) {
            for (var i = 0;i < sch.length; i++)
              _traverse(opts, pre, post, sch[i], jsonPtr + "/" + key + "/" + i, rootSchema, jsonPtr, key, schema, i);
          }
        } else if (key in traverse.propsKeywords) {
          if (sch && typeof sch == "object") {
            for (var prop in sch)
              _traverse(opts, pre, post, sch[prop], jsonPtr + "/" + key + "/" + escapeJsonPtr(prop), rootSchema, jsonPtr, key, schema, prop);
          }
        } else if (key in traverse.keywords || opts.allKeys && !(key in traverse.skipKeywords)) {
          _traverse(opts, pre, post, sch, jsonPtr + "/" + key, rootSchema, jsonPtr, key, schema);
        }
      }
      post(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
    }
  }
  function escapeJsonPtr(str) {
    return str.replace(/~/g, "~0").replace(/\//g, "~1");
  }
});

// node_modules/ajv/dist/compile/resolve.js
var require_resolve = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getSchemaRefs = exports.resolveUrl = exports.normalizeId = exports._getFullPath = exports.getFullPath = exports.inlineRef = undefined;
  var util_1 = require_util();
  var equal = require_fast_deep_equal();
  var traverse = require_json_schema_traverse();
  var SIMPLE_INLINED = new Set([
    "type",
    "format",
    "pattern",
    "maxLength",
    "minLength",
    "maxProperties",
    "minProperties",
    "maxItems",
    "minItems",
    "maximum",
    "minimum",
    "uniqueItems",
    "multipleOf",
    "required",
    "enum",
    "const"
  ]);
  function inlineRef(schema, limit = true) {
    if (typeof schema == "boolean")
      return true;
    if (limit === true)
      return !hasRef(schema);
    if (!limit)
      return false;
    return countKeys(schema) <= limit;
  }
  exports.inlineRef = inlineRef;
  var REF_KEYWORDS = new Set([
    "$ref",
    "$recursiveRef",
    "$recursiveAnchor",
    "$dynamicRef",
    "$dynamicAnchor"
  ]);
  function hasRef(schema) {
    for (const key in schema) {
      if (REF_KEYWORDS.has(key))
        return true;
      const sch = schema[key];
      if (Array.isArray(sch) && sch.some(hasRef))
        return true;
      if (typeof sch == "object" && hasRef(sch))
        return true;
    }
    return false;
  }
  function countKeys(schema) {
    let count = 0;
    for (const key in schema) {
      if (key === "$ref")
        return Infinity;
      count++;
      if (SIMPLE_INLINED.has(key))
        continue;
      if (typeof schema[key] == "object") {
        (0, util_1.eachItem)(schema[key], (sch) => count += countKeys(sch));
      }
      if (count === Infinity)
        return Infinity;
    }
    return count;
  }
  function getFullPath(resolver, id = "", normalize) {
    if (normalize !== false)
      id = normalizeId(id);
    const p = resolver.parse(id);
    return _getFullPath(resolver, p);
  }
  exports.getFullPath = getFullPath;
  function _getFullPath(resolver, p) {
    const serialized = resolver.serialize(p);
    return serialized.split("#")[0] + "#";
  }
  exports._getFullPath = _getFullPath;
  var TRAILING_SLASH_HASH = /#\/?$/;
  function normalizeId(id) {
    return id ? id.replace(TRAILING_SLASH_HASH, "") : "";
  }
  exports.normalizeId = normalizeId;
  function resolveUrl(resolver, baseId, id) {
    id = normalizeId(id);
    return resolver.resolve(baseId, id);
  }
  exports.resolveUrl = resolveUrl;
  var ANCHOR = /^[a-z_][-a-z0-9._]*$/i;
  function getSchemaRefs(schema, baseId) {
    if (typeof schema == "boolean")
      return {};
    const { schemaId, uriResolver } = this.opts;
    const schId = normalizeId(schema[schemaId] || baseId);
    const baseIds = { "": schId };
    const pathPrefix = getFullPath(uriResolver, schId, false);
    const localRefs = {};
    const schemaRefs = new Set;
    traverse(schema, { allKeys: true }, (sch, jsonPtr, _, parentJsonPtr) => {
      if (parentJsonPtr === undefined)
        return;
      const fullPath = pathPrefix + jsonPtr;
      let innerBaseId = baseIds[parentJsonPtr];
      if (typeof sch[schemaId] == "string")
        innerBaseId = addRef.call(this, sch[schemaId]);
      addAnchor.call(this, sch.$anchor);
      addAnchor.call(this, sch.$dynamicAnchor);
      baseIds[jsonPtr] = innerBaseId;
      function addRef(ref) {
        const _resolve = this.opts.uriResolver.resolve;
        ref = normalizeId(innerBaseId ? _resolve(innerBaseId, ref) : ref);
        if (schemaRefs.has(ref))
          throw ambiguos(ref);
        schemaRefs.add(ref);
        let schOrRef = this.refs[ref];
        if (typeof schOrRef == "string")
          schOrRef = this.refs[schOrRef];
        if (typeof schOrRef == "object") {
          checkAmbiguosRef(sch, schOrRef.schema, ref);
        } else if (ref !== normalizeId(fullPath)) {
          if (ref[0] === "#") {
            checkAmbiguosRef(sch, localRefs[ref], ref);
            localRefs[ref] = sch;
          } else {
            this.refs[ref] = fullPath;
          }
        }
        return ref;
      }
      function addAnchor(anchor) {
        if (typeof anchor == "string") {
          if (!ANCHOR.test(anchor))
            throw new Error(`invalid anchor "${anchor}"`);
          addRef.call(this, `#${anchor}`);
        }
      }
    });
    return localRefs;
    function checkAmbiguosRef(sch1, sch2, ref) {
      if (sch2 !== undefined && !equal(sch1, sch2))
        throw ambiguos(ref);
    }
    function ambiguos(ref) {
      return new Error(`reference "${ref}" resolves to more than one schema`);
    }
  }
  exports.getSchemaRefs = getSchemaRefs;
});

// node_modules/ajv/dist/compile/validate/index.js
var require_validate = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getData = exports.KeywordCxt = exports.validateFunctionCode = undefined;
  var boolSchema_1 = require_boolSchema();
  var dataType_1 = require_dataType();
  var applicability_1 = require_applicability();
  var dataType_2 = require_dataType();
  var defaults_1 = require_defaults();
  var keyword_1 = require_keyword();
  var subschema_1 = require_subschema();
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var resolve_1 = require_resolve();
  var util_1 = require_util();
  var errors_1 = require_errors();
  function validateFunctionCode(it) {
    if (isSchemaObj(it)) {
      checkKeywords(it);
      if (schemaCxtHasRules(it)) {
        topSchemaObjCode(it);
        return;
      }
    }
    validateFunction(it, () => (0, boolSchema_1.topBoolOrEmptySchema)(it));
  }
  exports.validateFunctionCode = validateFunctionCode;
  function validateFunction({ gen, validateName, schema, schemaEnv, opts }, body) {
    if (opts.code.es5) {
      gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${names_1.default.valCxt}`, schemaEnv.$async, () => {
        gen.code((0, codegen_1._)`"use strict"; ${funcSourceUrl(schema, opts)}`);
        destructureValCxtES5(gen, opts);
        gen.code(body);
      });
    } else {
      gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${destructureValCxt(opts)}`, schemaEnv.$async, () => gen.code(funcSourceUrl(schema, opts)).code(body));
    }
  }
  function destructureValCxt(opts) {
    return (0, codegen_1._)`{${names_1.default.instancePath}="", ${names_1.default.parentData}, ${names_1.default.parentDataProperty}, ${names_1.default.rootData}=${names_1.default.data}${opts.dynamicRef ? (0, codegen_1._)`, ${names_1.default.dynamicAnchors}={}` : codegen_1.nil}}={}`;
  }
  function destructureValCxtES5(gen, opts) {
    gen.if(names_1.default.valCxt, () => {
      gen.var(names_1.default.instancePath, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.instancePath}`);
      gen.var(names_1.default.parentData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentData}`);
      gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentDataProperty}`);
      gen.var(names_1.default.rootData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.rootData}`);
      if (opts.dynamicRef)
        gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.dynamicAnchors}`);
    }, () => {
      gen.var(names_1.default.instancePath, (0, codegen_1._)`""`);
      gen.var(names_1.default.parentData, (0, codegen_1._)`undefined`);
      gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`undefined`);
      gen.var(names_1.default.rootData, names_1.default.data);
      if (opts.dynamicRef)
        gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`{}`);
    });
  }
  function topSchemaObjCode(it) {
    const { schema, opts, gen } = it;
    validateFunction(it, () => {
      if (opts.$comment && schema.$comment)
        commentKeyword(it);
      checkNoDefault(it);
      gen.let(names_1.default.vErrors, null);
      gen.let(names_1.default.errors, 0);
      if (opts.unevaluated)
        resetEvaluated(it);
      typeAndKeywords(it);
      returnResults(it);
    });
    return;
  }
  function resetEvaluated(it) {
    const { gen, validateName } = it;
    it.evaluated = gen.const("evaluated", (0, codegen_1._)`${validateName}.evaluated`);
    gen.if((0, codegen_1._)`${it.evaluated}.dynamicProps`, () => gen.assign((0, codegen_1._)`${it.evaluated}.props`, (0, codegen_1._)`undefined`));
    gen.if((0, codegen_1._)`${it.evaluated}.dynamicItems`, () => gen.assign((0, codegen_1._)`${it.evaluated}.items`, (0, codegen_1._)`undefined`));
  }
  function funcSourceUrl(schema, opts) {
    const schId = typeof schema == "object" && schema[opts.schemaId];
    return schId && (opts.code.source || opts.code.process) ? (0, codegen_1._)`/*# sourceURL=${schId} */` : codegen_1.nil;
  }
  function subschemaCode(it, valid) {
    if (isSchemaObj(it)) {
      checkKeywords(it);
      if (schemaCxtHasRules(it)) {
        subSchemaObjCode(it, valid);
        return;
      }
    }
    (0, boolSchema_1.boolOrEmptySchema)(it, valid);
  }
  function schemaCxtHasRules({ schema, self: self2 }) {
    if (typeof schema == "boolean")
      return !schema;
    for (const key in schema)
      if (self2.RULES.all[key])
        return true;
    return false;
  }
  function isSchemaObj(it) {
    return typeof it.schema != "boolean";
  }
  function subSchemaObjCode(it, valid) {
    const { schema, gen, opts } = it;
    if (opts.$comment && schema.$comment)
      commentKeyword(it);
    updateContext(it);
    checkAsyncSchema(it);
    const errsCount = gen.const("_errs", names_1.default.errors);
    typeAndKeywords(it, errsCount);
    gen.var(valid, (0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
  }
  function checkKeywords(it) {
    (0, util_1.checkUnknownRules)(it);
    checkRefsAndKeywords(it);
  }
  function typeAndKeywords(it, errsCount) {
    if (it.opts.jtd)
      return schemaKeywords(it, [], false, errsCount);
    const types2 = (0, dataType_1.getSchemaTypes)(it.schema);
    const checkedTypes = (0, dataType_1.coerceAndCheckDataType)(it, types2);
    schemaKeywords(it, types2, !checkedTypes, errsCount);
  }
  function checkRefsAndKeywords(it) {
    const { schema, errSchemaPath, opts, self: self2 } = it;
    if (schema.$ref && opts.ignoreKeywordsWithRef && (0, util_1.schemaHasRulesButRef)(schema, self2.RULES)) {
      self2.logger.warn(`$ref: keywords ignored in schema at path "${errSchemaPath}"`);
    }
  }
  function checkNoDefault(it) {
    const { schema, opts } = it;
    if (schema.default !== undefined && opts.useDefaults && opts.strictSchema) {
      (0, util_1.checkStrictMode)(it, "default is ignored in the schema root");
    }
  }
  function updateContext(it) {
    const schId = it.schema[it.opts.schemaId];
    if (schId)
      it.baseId = (0, resolve_1.resolveUrl)(it.opts.uriResolver, it.baseId, schId);
  }
  function checkAsyncSchema(it) {
    if (it.schema.$async && !it.schemaEnv.$async)
      throw new Error("async schema in sync schema");
  }
  function commentKeyword({ gen, schemaEnv, schema, errSchemaPath, opts }) {
    const msg = schema.$comment;
    if (opts.$comment === true) {
      gen.code((0, codegen_1._)`${names_1.default.self}.logger.log(${msg})`);
    } else if (typeof opts.$comment == "function") {
      const schemaPath = (0, codegen_1.str)`${errSchemaPath}/$comment`;
      const rootName = gen.scopeValue("root", { ref: schemaEnv.root });
      gen.code((0, codegen_1._)`${names_1.default.self}.opts.$comment(${msg}, ${schemaPath}, ${rootName}.schema)`);
    }
  }
  function returnResults(it) {
    const { gen, schemaEnv, validateName, ValidationError, opts } = it;
    if (schemaEnv.$async) {
      gen.if((0, codegen_1._)`${names_1.default.errors} === 0`, () => gen.return(names_1.default.data), () => gen.throw((0, codegen_1._)`new ${ValidationError}(${names_1.default.vErrors})`));
    } else {
      gen.assign((0, codegen_1._)`${validateName}.errors`, names_1.default.vErrors);
      if (opts.unevaluated)
        assignEvaluated(it);
      gen.return((0, codegen_1._)`${names_1.default.errors} === 0`);
    }
  }
  function assignEvaluated({ gen, evaluated, props, items }) {
    if (props instanceof codegen_1.Name)
      gen.assign((0, codegen_1._)`${evaluated}.props`, props);
    if (items instanceof codegen_1.Name)
      gen.assign((0, codegen_1._)`${evaluated}.items`, items);
  }
  function schemaKeywords(it, types2, typeErrors, errsCount) {
    const { gen, schema, data, allErrors, opts, self: self2 } = it;
    const { RULES } = self2;
    if (schema.$ref && (opts.ignoreKeywordsWithRef || !(0, util_1.schemaHasRulesButRef)(schema, RULES))) {
      gen.block(() => keywordCode(it, "$ref", RULES.all.$ref.definition));
      return;
    }
    if (!opts.jtd)
      checkStrictTypes(it, types2);
    gen.block(() => {
      for (const group of RULES.rules)
        groupKeywords(group);
      groupKeywords(RULES.post);
    });
    function groupKeywords(group) {
      if (!(0, applicability_1.shouldUseGroup)(schema, group))
        return;
      if (group.type) {
        gen.if((0, dataType_2.checkDataType)(group.type, data, opts.strictNumbers));
        iterateKeywords(it, group);
        if (types2.length === 1 && types2[0] === group.type && typeErrors) {
          gen.else();
          (0, dataType_2.reportTypeError)(it);
        }
        gen.endIf();
      } else {
        iterateKeywords(it, group);
      }
      if (!allErrors)
        gen.if((0, codegen_1._)`${names_1.default.errors} === ${errsCount || 0}`);
    }
  }
  function iterateKeywords(it, group) {
    const { gen, schema, opts: { useDefaults } } = it;
    if (useDefaults)
      (0, defaults_1.assignDefaults)(it, group.type);
    gen.block(() => {
      for (const rule of group.rules) {
        if ((0, applicability_1.shouldUseRule)(schema, rule)) {
          keywordCode(it, rule.keyword, rule.definition, group.type);
        }
      }
    });
  }
  function checkStrictTypes(it, types2) {
    if (it.schemaEnv.meta || !it.opts.strictTypes)
      return;
    checkContextTypes(it, types2);
    if (!it.opts.allowUnionTypes)
      checkMultipleTypes(it, types2);
    checkKeywordTypes(it, it.dataTypes);
  }
  function checkContextTypes(it, types2) {
    if (!types2.length)
      return;
    if (!it.dataTypes.length) {
      it.dataTypes = types2;
      return;
    }
    types2.forEach((t) => {
      if (!includesType(it.dataTypes, t)) {
        strictTypesError(it, `type "${t}" not allowed by context "${it.dataTypes.join(",")}"`);
      }
    });
    narrowSchemaTypes(it, types2);
  }
  function checkMultipleTypes(it, ts) {
    if (ts.length > 1 && !(ts.length === 2 && ts.includes("null"))) {
      strictTypesError(it, "use allowUnionTypes to allow union type keyword");
    }
  }
  function checkKeywordTypes(it, ts) {
    const rules = it.self.RULES.all;
    for (const keyword in rules) {
      const rule = rules[keyword];
      if (typeof rule == "object" && (0, applicability_1.shouldUseRule)(it.schema, rule)) {
        const { type } = rule.definition;
        if (type.length && !type.some((t) => hasApplicableType(ts, t))) {
          strictTypesError(it, `missing type "${type.join(",")}" for keyword "${keyword}"`);
        }
      }
    }
  }
  function hasApplicableType(schTs, kwdT) {
    return schTs.includes(kwdT) || kwdT === "number" && schTs.includes("integer");
  }
  function includesType(ts, t) {
    return ts.includes(t) || t === "integer" && ts.includes("number");
  }
  function narrowSchemaTypes(it, withTypes) {
    const ts = [];
    for (const t of it.dataTypes) {
      if (includesType(withTypes, t))
        ts.push(t);
      else if (withTypes.includes("integer") && t === "number")
        ts.push("integer");
    }
    it.dataTypes = ts;
  }
  function strictTypesError(it, msg) {
    const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
    msg += ` at "${schemaPath}" (strictTypes)`;
    (0, util_1.checkStrictMode)(it, msg, it.opts.strictTypes);
  }

  class KeywordCxt {
    constructor(it, def, keyword) {
      (0, keyword_1.validateKeywordUsage)(it, def, keyword);
      this.gen = it.gen;
      this.allErrors = it.allErrors;
      this.keyword = keyword;
      this.data = it.data;
      this.schema = it.schema[keyword];
      this.$data = def.$data && it.opts.$data && this.schema && this.schema.$data;
      this.schemaValue = (0, util_1.schemaRefOrVal)(it, this.schema, keyword, this.$data);
      this.schemaType = def.schemaType;
      this.parentSchema = it.schema;
      this.params = {};
      this.it = it;
      this.def = def;
      if (this.$data) {
        this.schemaCode = it.gen.const("vSchema", getData(this.$data, it));
      } else {
        this.schemaCode = this.schemaValue;
        if (!(0, keyword_1.validSchemaType)(this.schema, def.schemaType, def.allowUndefined)) {
          throw new Error(`${keyword} value must be ${JSON.stringify(def.schemaType)}`);
        }
      }
      if ("code" in def ? def.trackErrors : def.errors !== false) {
        this.errsCount = it.gen.const("_errs", names_1.default.errors);
      }
    }
    result(condition, successAction, failAction) {
      this.failResult((0, codegen_1.not)(condition), successAction, failAction);
    }
    failResult(condition, successAction, failAction) {
      this.gen.if(condition);
      if (failAction)
        failAction();
      else
        this.error();
      if (successAction) {
        this.gen.else();
        successAction();
        if (this.allErrors)
          this.gen.endIf();
      } else {
        if (this.allErrors)
          this.gen.endIf();
        else
          this.gen.else();
      }
    }
    pass(condition, failAction) {
      this.failResult((0, codegen_1.not)(condition), undefined, failAction);
    }
    fail(condition) {
      if (condition === undefined) {
        this.error();
        if (!this.allErrors)
          this.gen.if(false);
        return;
      }
      this.gen.if(condition);
      this.error();
      if (this.allErrors)
        this.gen.endIf();
      else
        this.gen.else();
    }
    fail$data(condition) {
      if (!this.$data)
        return this.fail(condition);
      const { schemaCode } = this;
      this.fail((0, codegen_1._)`${schemaCode} !== undefined && (${(0, codegen_1.or)(this.invalid$data(), condition)})`);
    }
    error(append, errorParams, errorPaths) {
      if (errorParams) {
        this.setParams(errorParams);
        this._error(append, errorPaths);
        this.setParams({});
        return;
      }
      this._error(append, errorPaths);
    }
    _error(append, errorPaths) {
      (append ? errors_1.reportExtraError : errors_1.reportError)(this, this.def.error, errorPaths);
    }
    $dataError() {
      (0, errors_1.reportError)(this, this.def.$dataError || errors_1.keyword$DataError);
    }
    reset() {
      if (this.errsCount === undefined)
        throw new Error('add "trackErrors" to keyword definition');
      (0, errors_1.resetErrorsCount)(this.gen, this.errsCount);
    }
    ok(cond) {
      if (!this.allErrors)
        this.gen.if(cond);
    }
    setParams(obj, assign) {
      if (assign)
        Object.assign(this.params, obj);
      else
        this.params = obj;
    }
    block$data(valid, codeBlock, $dataValid = codegen_1.nil) {
      this.gen.block(() => {
        this.check$data(valid, $dataValid);
        codeBlock();
      });
    }
    check$data(valid = codegen_1.nil, $dataValid = codegen_1.nil) {
      if (!this.$data)
        return;
      const { gen, schemaCode, schemaType, def } = this;
      gen.if((0, codegen_1.or)((0, codegen_1._)`${schemaCode} === undefined`, $dataValid));
      if (valid !== codegen_1.nil)
        gen.assign(valid, true);
      if (schemaType.length || def.validateSchema) {
        gen.elseIf(this.invalid$data());
        this.$dataError();
        if (valid !== codegen_1.nil)
          gen.assign(valid, false);
      }
      gen.else();
    }
    invalid$data() {
      const { gen, schemaCode, schemaType, def, it } = this;
      return (0, codegen_1.or)(wrong$DataType(), invalid$DataSchema());
      function wrong$DataType() {
        if (schemaType.length) {
          if (!(schemaCode instanceof codegen_1.Name))
            throw new Error("ajv implementation error");
          const st = Array.isArray(schemaType) ? schemaType : [schemaType];
          return (0, codegen_1._)`${(0, dataType_2.checkDataTypes)(st, schemaCode, it.opts.strictNumbers, dataType_2.DataType.Wrong)}`;
        }
        return codegen_1.nil;
      }
      function invalid$DataSchema() {
        if (def.validateSchema) {
          const validateSchemaRef = gen.scopeValue("validate$data", { ref: def.validateSchema });
          return (0, codegen_1._)`!${validateSchemaRef}(${schemaCode})`;
        }
        return codegen_1.nil;
      }
    }
    subschema(appl, valid) {
      const subschema = (0, subschema_1.getSubschema)(this.it, appl);
      (0, subschema_1.extendSubschemaData)(subschema, this.it, appl);
      (0, subschema_1.extendSubschemaMode)(subschema, appl);
      const nextContext = { ...this.it, ...subschema, items: undefined, props: undefined };
      subschemaCode(nextContext, valid);
      return nextContext;
    }
    mergeEvaluated(schemaCxt, toName) {
      const { it, gen } = this;
      if (!it.opts.unevaluated)
        return;
      if (it.props !== true && schemaCxt.props !== undefined) {
        it.props = util_1.mergeEvaluated.props(gen, schemaCxt.props, it.props, toName);
      }
      if (it.items !== true && schemaCxt.items !== undefined) {
        it.items = util_1.mergeEvaluated.items(gen, schemaCxt.items, it.items, toName);
      }
    }
    mergeValidEvaluated(schemaCxt, valid) {
      const { it, gen } = this;
      if (it.opts.unevaluated && (it.props !== true || it.items !== true)) {
        gen.if(valid, () => this.mergeEvaluated(schemaCxt, codegen_1.Name));
        return true;
      }
    }
  }
  exports.KeywordCxt = KeywordCxt;
  function keywordCode(it, keyword, def, ruleType) {
    const cxt = new KeywordCxt(it, def, keyword);
    if ("code" in def) {
      def.code(cxt, ruleType);
    } else if (cxt.$data && def.validate) {
      (0, keyword_1.funcKeywordCode)(cxt, def);
    } else if ("macro" in def) {
      (0, keyword_1.macroKeywordCode)(cxt, def);
    } else if (def.compile || def.validate) {
      (0, keyword_1.funcKeywordCode)(cxt, def);
    }
  }
  var JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/;
  var RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
  function getData($data, { dataLevel, dataNames, dataPathArr }) {
    let jsonPointer;
    let data;
    if ($data === "")
      return names_1.default.rootData;
    if ($data[0] === "/") {
      if (!JSON_POINTER.test($data))
        throw new Error(`Invalid JSON-pointer: ${$data}`);
      jsonPointer = $data;
      data = names_1.default.rootData;
    } else {
      const matches = RELATIVE_JSON_POINTER.exec($data);
      if (!matches)
        throw new Error(`Invalid JSON-pointer: ${$data}`);
      const up = +matches[1];
      jsonPointer = matches[2];
      if (jsonPointer === "#") {
        if (up >= dataLevel)
          throw new Error(errorMsg("property/index", up));
        return dataPathArr[dataLevel - up];
      }
      if (up > dataLevel)
        throw new Error(errorMsg("data", up));
      data = dataNames[dataLevel - up];
      if (!jsonPointer)
        return data;
    }
    let expr = data;
    const segments = jsonPointer.split("/");
    for (const segment of segments) {
      if (segment) {
        data = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)((0, util_1.unescapeJsonPointer)(segment))}`;
        expr = (0, codegen_1._)`${expr} && ${data}`;
      }
    }
    return expr;
    function errorMsg(pointerType, up) {
      return `Cannot access ${pointerType} ${up} levels up, current level is ${dataLevel}`;
    }
  }
  exports.getData = getData;
});

// node_modules/ajv/dist/runtime/validation_error.js
var require_validation_error = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });

  class ValidationError extends Error {
    constructor(errors4) {
      super("validation failed");
      this.errors = errors4;
      this.ajv = this.validation = true;
    }
  }
  exports.default = ValidationError;
});

// node_modules/ajv/dist/compile/ref_error.js
var require_ref_error = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var resolve_1 = require_resolve();

  class MissingRefError extends Error {
    constructor(resolver, baseId, ref, msg) {
      super(msg || `can't resolve reference ${ref} from id ${baseId}`);
      this.missingRef = (0, resolve_1.resolveUrl)(resolver, baseId, ref);
      this.missingSchema = (0, resolve_1.normalizeId)((0, resolve_1.getFullPath)(resolver, this.missingRef));
    }
  }
  exports.default = MissingRefError;
});

// node_modules/ajv/dist/compile/index.js
var require_compile = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.resolveSchema = exports.getCompilingSchema = exports.resolveRef = exports.compileSchema = exports.SchemaEnv = undefined;
  var codegen_1 = require_codegen();
  var validation_error_1 = require_validation_error();
  var names_1 = require_names();
  var resolve_1 = require_resolve();
  var util_1 = require_util();
  var validate_1 = require_validate();

  class SchemaEnv {
    constructor(env) {
      var _a;
      this.refs = {};
      this.dynamicAnchors = {};
      let schema;
      if (typeof env.schema == "object")
        schema = env.schema;
      this.schema = env.schema;
      this.schemaId = env.schemaId;
      this.root = env.root || this;
      this.baseId = (_a = env.baseId) !== null && _a !== undefined ? _a : (0, resolve_1.normalizeId)(schema === null || schema === undefined ? undefined : schema[env.schemaId || "$id"]);
      this.schemaPath = env.schemaPath;
      this.localRefs = env.localRefs;
      this.meta = env.meta;
      this.$async = schema === null || schema === undefined ? undefined : schema.$async;
      this.refs = {};
    }
  }
  exports.SchemaEnv = SchemaEnv;
  function compileSchema(sch) {
    const _sch = getCompilingSchema.call(this, sch);
    if (_sch)
      return _sch;
    const rootId = (0, resolve_1.getFullPath)(this.opts.uriResolver, sch.root.baseId);
    const { es5, lines } = this.opts.code;
    const { ownProperties } = this.opts;
    const gen = new codegen_1.CodeGen(this.scope, { es5, lines, ownProperties });
    let _ValidationError;
    if (sch.$async) {
      _ValidationError = gen.scopeValue("Error", {
        ref: validation_error_1.default,
        code: (0, codegen_1._)`require("ajv/dist/runtime/validation_error").default`
      });
    }
    const validateName = gen.scopeName("validate");
    sch.validateName = validateName;
    const schemaCxt = {
      gen,
      allErrors: this.opts.allErrors,
      data: names_1.default.data,
      parentData: names_1.default.parentData,
      parentDataProperty: names_1.default.parentDataProperty,
      dataNames: [names_1.default.data],
      dataPathArr: [codegen_1.nil],
      dataLevel: 0,
      dataTypes: [],
      definedProperties: new Set,
      topSchemaRef: gen.scopeValue("schema", this.opts.code.source === true ? { ref: sch.schema, code: (0, codegen_1.stringify)(sch.schema) } : { ref: sch.schema }),
      validateName,
      ValidationError: _ValidationError,
      schema: sch.schema,
      schemaEnv: sch,
      rootId,
      baseId: sch.baseId || rootId,
      schemaPath: codegen_1.nil,
      errSchemaPath: sch.schemaPath || (this.opts.jtd ? "" : "#"),
      errorPath: (0, codegen_1._)`""`,
      opts: this.opts,
      self: this
    };
    let sourceCode;
    try {
      this._compilations.add(sch);
      (0, validate_1.validateFunctionCode)(schemaCxt);
      gen.optimize(this.opts.code.optimize);
      const validateCode = gen.toString();
      sourceCode = `${gen.scopeRefs(names_1.default.scope)}return ${validateCode}`;
      if (this.opts.code.process)
        sourceCode = this.opts.code.process(sourceCode, sch);
      const makeValidate = new Function(`${names_1.default.self}`, `${names_1.default.scope}`, sourceCode);
      const validate = makeValidate(this, this.scope.get());
      this.scope.value(validateName, { ref: validate });
      validate.errors = null;
      validate.schema = sch.schema;
      validate.schemaEnv = sch;
      if (sch.$async)
        validate.$async = true;
      if (this.opts.code.source === true) {
        validate.source = { validateName, validateCode, scopeValues: gen._values };
      }
      if (this.opts.unevaluated) {
        const { props, items } = schemaCxt;
        validate.evaluated = {
          props: props instanceof codegen_1.Name ? undefined : props,
          items: items instanceof codegen_1.Name ? undefined : items,
          dynamicProps: props instanceof codegen_1.Name,
          dynamicItems: items instanceof codegen_1.Name
        };
        if (validate.source)
          validate.source.evaluated = (0, codegen_1.stringify)(validate.evaluated);
      }
      sch.validate = validate;
      return sch;
    } catch (e) {
      delete sch.validate;
      delete sch.validateName;
      if (sourceCode)
        this.logger.error("Error compiling schema, function code:", sourceCode);
      throw e;
    } finally {
      this._compilations.delete(sch);
    }
  }
  exports.compileSchema = compileSchema;
  function resolveRef(root, baseId, ref) {
    var _a;
    ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, ref);
    const schOrFunc = root.refs[ref];
    if (schOrFunc)
      return schOrFunc;
    let _sch = resolve.call(this, root, ref);
    if (_sch === undefined) {
      const schema = (_a = root.localRefs) === null || _a === undefined ? undefined : _a[ref];
      const { schemaId } = this.opts;
      if (schema)
        _sch = new SchemaEnv({ schema, schemaId, root, baseId });
    }
    if (_sch === undefined)
      return;
    return root.refs[ref] = inlineOrCompile.call(this, _sch);
  }
  exports.resolveRef = resolveRef;
  function inlineOrCompile(sch) {
    if ((0, resolve_1.inlineRef)(sch.schema, this.opts.inlineRefs))
      return sch.schema;
    return sch.validate ? sch : compileSchema.call(this, sch);
  }
  function getCompilingSchema(schEnv) {
    for (const sch of this._compilations) {
      if (sameSchemaEnv(sch, schEnv))
        return sch;
    }
  }
  exports.getCompilingSchema = getCompilingSchema;
  function sameSchemaEnv(s1, s2) {
    return s1.schema === s2.schema && s1.root === s2.root && s1.baseId === s2.baseId;
  }
  function resolve(root, ref) {
    let sch;
    while (typeof (sch = this.refs[ref]) == "string")
      ref = sch;
    return sch || this.schemas[ref] || resolveSchema.call(this, root, ref);
  }
  function resolveSchema(root, ref) {
    const p = this.opts.uriResolver.parse(ref);
    const refPath = (0, resolve_1._getFullPath)(this.opts.uriResolver, p);
    let baseId = (0, resolve_1.getFullPath)(this.opts.uriResolver, root.baseId, undefined);
    if (Object.keys(root.schema).length > 0 && refPath === baseId) {
      return getJsonPointer.call(this, p, root);
    }
    const id = (0, resolve_1.normalizeId)(refPath);
    const schOrRef = this.refs[id] || this.schemas[id];
    if (typeof schOrRef == "string") {
      const sch = resolveSchema.call(this, root, schOrRef);
      if (typeof (sch === null || sch === undefined ? undefined : sch.schema) !== "object")
        return;
      return getJsonPointer.call(this, p, sch);
    }
    if (typeof (schOrRef === null || schOrRef === undefined ? undefined : schOrRef.schema) !== "object")
      return;
    if (!schOrRef.validate)
      compileSchema.call(this, schOrRef);
    if (id === (0, resolve_1.normalizeId)(ref)) {
      const { schema } = schOrRef;
      const { schemaId } = this.opts;
      const schId = schema[schemaId];
      if (schId)
        baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
      return new SchemaEnv({ schema, schemaId, root, baseId });
    }
    return getJsonPointer.call(this, p, schOrRef);
  }
  exports.resolveSchema = resolveSchema;
  var PREVENT_SCOPE_CHANGE = new Set([
    "properties",
    "patternProperties",
    "enum",
    "dependencies",
    "definitions"
  ]);
  function getJsonPointer(parsedRef, { baseId, schema, root }) {
    var _a;
    if (((_a = parsedRef.fragment) === null || _a === undefined ? undefined : _a[0]) !== "/")
      return;
    for (const part of parsedRef.fragment.slice(1).split("/")) {
      if (typeof schema === "boolean")
        return;
      const partSchema = schema[(0, util_1.unescapeFragment)(part)];
      if (partSchema === undefined)
        return;
      schema = partSchema;
      const schId = typeof schema === "object" && schema[this.opts.schemaId];
      if (!PREVENT_SCOPE_CHANGE.has(part) && schId) {
        baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
      }
    }
    let env;
    if (typeof schema != "boolean" && schema.$ref && !(0, util_1.schemaHasRulesButRef)(schema, this.RULES)) {
      const $ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schema.$ref);
      env = resolveSchema.call(this, root, $ref);
    }
    const { schemaId } = this.opts;
    env = env || new SchemaEnv({ schema, schemaId, root, baseId });
    if (env.schema !== env.root.schema)
      return env;
    return;
  }
});

// node_modules/ajv/dist/refs/data.json
var require_data = __commonJS((exports, module) => {
  module.exports = {
    $id: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
    description: "Meta-schema for $data reference (JSON AnySchema extension proposal)",
    type: "object",
    required: ["$data"],
    properties: {
      $data: {
        type: "string",
        anyOf: [{ format: "relative-json-pointer" }, { format: "json-pointer" }]
      }
    },
    additionalProperties: false
  };
});

// node_modules/fast-uri/lib/utils.js
var require_utils = __commonJS((exports, module) => {
  var isUUID = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu);
  var isIPv4 = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u);
  function stringArrayToHexStripped(input) {
    let acc = "";
    let code = 0;
    let i = 0;
    for (i = 0;i < input.length; i++) {
      code = input[i].charCodeAt(0);
      if (code === 48) {
        continue;
      }
      if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102)) {
        return "";
      }
      acc += input[i];
      break;
    }
    for (i += 1;i < input.length; i++) {
      code = input[i].charCodeAt(0);
      if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102)) {
        return "";
      }
      acc += input[i];
    }
    return acc;
  }
  var nonSimpleDomain = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
  function consumeIsZone(buffer) {
    buffer.length = 0;
    return true;
  }
  function consumeHextets(buffer, address, output) {
    if (buffer.length) {
      const hex = stringArrayToHexStripped(buffer);
      if (hex !== "") {
        address.push(hex);
      } else {
        output.error = true;
        return false;
      }
      buffer.length = 0;
    }
    return true;
  }
  function getIPV6(input) {
    let tokenCount = 0;
    const output = { error: false, address: "", zone: "" };
    const address = [];
    const buffer = [];
    let endipv6Encountered = false;
    let endIpv6 = false;
    let consume = consumeHextets;
    for (let i = 0;i < input.length; i++) {
      const cursor = input[i];
      if (cursor === "[" || cursor === "]") {
        continue;
      }
      if (cursor === ":") {
        if (endipv6Encountered === true) {
          endIpv6 = true;
        }
        if (!consume(buffer, address, output)) {
          break;
        }
        if (++tokenCount > 7) {
          output.error = true;
          break;
        }
        if (i > 0 && input[i - 1] === ":") {
          endipv6Encountered = true;
        }
        address.push(":");
        continue;
      } else if (cursor === "%") {
        if (!consume(buffer, address, output)) {
          break;
        }
        consume = consumeIsZone;
      } else {
        buffer.push(cursor);
        continue;
      }
    }
    if (buffer.length) {
      if (consume === consumeIsZone) {
        output.zone = buffer.join("");
      } else if (endIpv6) {
        address.push(buffer.join(""));
      } else {
        address.push(stringArrayToHexStripped(buffer));
      }
    }
    output.address = address.join("");
    return output;
  }
  function normalizeIPv6(host) {
    if (findToken(host, ":") < 2) {
      return { host, isIPV6: false };
    }
    const ipv62 = getIPV6(host);
    if (!ipv62.error) {
      let newHost = ipv62.address;
      let escapedHost = ipv62.address;
      if (ipv62.zone) {
        newHost += "%" + ipv62.zone;
        escapedHost += "%25" + ipv62.zone;
      }
      return { host: newHost, isIPV6: true, escapedHost };
    } else {
      return { host, isIPV6: false };
    }
  }
  function findToken(str, token) {
    let ind = 0;
    for (let i = 0;i < str.length; i++) {
      if (str[i] === token)
        ind++;
    }
    return ind;
  }
  function removeDotSegments(path) {
    let input = path;
    const output = [];
    let nextSlash = -1;
    let len = 0;
    while (len = input.length) {
      if (len === 1) {
        if (input === ".") {
          break;
        } else if (input === "/") {
          output.push("/");
          break;
        } else {
          output.push(input);
          break;
        }
      } else if (len === 2) {
        if (input[0] === ".") {
          if (input[1] === ".") {
            break;
          } else if (input[1] === "/") {
            input = input.slice(2);
            continue;
          }
        } else if (input[0] === "/") {
          if (input[1] === "." || input[1] === "/") {
            output.push("/");
            break;
          }
        }
      } else if (len === 3) {
        if (input === "/..") {
          if (output.length !== 0) {
            output.pop();
          }
          output.push("/");
          break;
        }
      }
      if (input[0] === ".") {
        if (input[1] === ".") {
          if (input[2] === "/") {
            input = input.slice(3);
            continue;
          }
        } else if (input[1] === "/") {
          input = input.slice(2);
          continue;
        }
      } else if (input[0] === "/") {
        if (input[1] === ".") {
          if (input[2] === "/") {
            input = input.slice(2);
            continue;
          } else if (input[2] === ".") {
            if (input[3] === "/") {
              input = input.slice(3);
              if (output.length !== 0) {
                output.pop();
              }
              continue;
            }
          }
        }
      }
      if ((nextSlash = input.indexOf("/", 1)) === -1) {
        output.push(input);
        break;
      } else {
        output.push(input.slice(0, nextSlash));
        input = input.slice(nextSlash);
      }
    }
    return output.join("");
  }
  function normalizeComponentEncoding(component, esc2) {
    const func = esc2 !== true ? escape : unescape;
    if (component.scheme !== undefined) {
      component.scheme = func(component.scheme);
    }
    if (component.userinfo !== undefined) {
      component.userinfo = func(component.userinfo);
    }
    if (component.host !== undefined) {
      component.host = func(component.host);
    }
    if (component.path !== undefined) {
      component.path = func(component.path);
    }
    if (component.query !== undefined) {
      component.query = func(component.query);
    }
    if (component.fragment !== undefined) {
      component.fragment = func(component.fragment);
    }
    return component;
  }
  function recomposeAuthority(component) {
    const uriTokens = [];
    if (component.userinfo !== undefined) {
      uriTokens.push(component.userinfo);
      uriTokens.push("@");
    }
    if (component.host !== undefined) {
      let host = unescape(component.host);
      if (!isIPv4(host)) {
        const ipV6res = normalizeIPv6(host);
        if (ipV6res.isIPV6 === true) {
          host = `[${ipV6res.escapedHost}]`;
        } else {
          host = component.host;
        }
      }
      uriTokens.push(host);
    }
    if (typeof component.port === "number" || typeof component.port === "string") {
      uriTokens.push(":");
      uriTokens.push(String(component.port));
    }
    return uriTokens.length ? uriTokens.join("") : undefined;
  }
  module.exports = {
    nonSimpleDomain,
    recomposeAuthority,
    normalizeComponentEncoding,
    removeDotSegments,
    isIPv4,
    isUUID,
    normalizeIPv6,
    stringArrayToHexStripped
  };
});

// node_modules/fast-uri/lib/schemes.js
var require_schemes = __commonJS((exports, module) => {
  var { isUUID } = require_utils();
  var URN_REG = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu;
  var supportedSchemeNames = [
    "http",
    "https",
    "ws",
    "wss",
    "urn",
    "urn:uuid"
  ];
  function isValidSchemeName(name) {
    return supportedSchemeNames.indexOf(name) !== -1;
  }
  function wsIsSecure(wsComponent) {
    if (wsComponent.secure === true) {
      return true;
    } else if (wsComponent.secure === false) {
      return false;
    } else if (wsComponent.scheme) {
      return wsComponent.scheme.length === 3 && (wsComponent.scheme[0] === "w" || wsComponent.scheme[0] === "W") && (wsComponent.scheme[1] === "s" || wsComponent.scheme[1] === "S") && (wsComponent.scheme[2] === "s" || wsComponent.scheme[2] === "S");
    } else {
      return false;
    }
  }
  function httpParse(component) {
    if (!component.host) {
      component.error = component.error || "HTTP URIs must have a host.";
    }
    return component;
  }
  function httpSerialize(component) {
    const secure = String(component.scheme).toLowerCase() === "https";
    if (component.port === (secure ? 443 : 80) || component.port === "") {
      component.port = undefined;
    }
    if (!component.path) {
      component.path = "/";
    }
    return component;
  }
  function wsParse(wsComponent) {
    wsComponent.secure = wsIsSecure(wsComponent);
    wsComponent.resourceName = (wsComponent.path || "/") + (wsComponent.query ? "?" + wsComponent.query : "");
    wsComponent.path = undefined;
    wsComponent.query = undefined;
    return wsComponent;
  }
  function wsSerialize(wsComponent) {
    if (wsComponent.port === (wsIsSecure(wsComponent) ? 443 : 80) || wsComponent.port === "") {
      wsComponent.port = undefined;
    }
    if (typeof wsComponent.secure === "boolean") {
      wsComponent.scheme = wsComponent.secure ? "wss" : "ws";
      wsComponent.secure = undefined;
    }
    if (wsComponent.resourceName) {
      const [path, query] = wsComponent.resourceName.split("?");
      wsComponent.path = path && path !== "/" ? path : undefined;
      wsComponent.query = query;
      wsComponent.resourceName = undefined;
    }
    wsComponent.fragment = undefined;
    return wsComponent;
  }
  function urnParse(urnComponent, options) {
    if (!urnComponent.path) {
      urnComponent.error = "URN can not be parsed";
      return urnComponent;
    }
    const matches = urnComponent.path.match(URN_REG);
    if (matches) {
      const scheme = options.scheme || urnComponent.scheme || "urn";
      urnComponent.nid = matches[1].toLowerCase();
      urnComponent.nss = matches[2];
      const urnScheme = `${scheme}:${options.nid || urnComponent.nid}`;
      const schemeHandler = getSchemeHandler(urnScheme);
      urnComponent.path = undefined;
      if (schemeHandler) {
        urnComponent = schemeHandler.parse(urnComponent, options);
      }
    } else {
      urnComponent.error = urnComponent.error || "URN can not be parsed.";
    }
    return urnComponent;
  }
  function urnSerialize(urnComponent, options) {
    if (urnComponent.nid === undefined) {
      throw new Error("URN without nid cannot be serialized");
    }
    const scheme = options.scheme || urnComponent.scheme || "urn";
    const nid = urnComponent.nid.toLowerCase();
    const urnScheme = `${scheme}:${options.nid || nid}`;
    const schemeHandler = getSchemeHandler(urnScheme);
    if (schemeHandler) {
      urnComponent = schemeHandler.serialize(urnComponent, options);
    }
    const uriComponent = urnComponent;
    const nss = urnComponent.nss;
    uriComponent.path = `${nid || options.nid}:${nss}`;
    options.skipEscape = true;
    return uriComponent;
  }
  function urnuuidParse(urnComponent, options) {
    const uuidComponent = urnComponent;
    uuidComponent.uuid = uuidComponent.nss;
    uuidComponent.nss = undefined;
    if (!options.tolerant && (!uuidComponent.uuid || !isUUID(uuidComponent.uuid))) {
      uuidComponent.error = uuidComponent.error || "UUID is not valid.";
    }
    return uuidComponent;
  }
  function urnuuidSerialize(uuidComponent) {
    const urnComponent = uuidComponent;
    urnComponent.nss = (uuidComponent.uuid || "").toLowerCase();
    return urnComponent;
  }
  var http = {
    scheme: "http",
    domainHost: true,
    parse: httpParse,
    serialize: httpSerialize
  };
  var https = {
    scheme: "https",
    domainHost: http.domainHost,
    parse: httpParse,
    serialize: httpSerialize
  };
  var ws = {
    scheme: "ws",
    domainHost: true,
    parse: wsParse,
    serialize: wsSerialize
  };
  var wss = {
    scheme: "wss",
    domainHost: ws.domainHost,
    parse: ws.parse,
    serialize: ws.serialize
  };
  var urn = {
    scheme: "urn",
    parse: urnParse,
    serialize: urnSerialize,
    skipNormalize: true
  };
  var urnuuid = {
    scheme: "urn:uuid",
    parse: urnuuidParse,
    serialize: urnuuidSerialize,
    skipNormalize: true
  };
  var SCHEMES = {
    http,
    https,
    ws,
    wss,
    urn,
    "urn:uuid": urnuuid
  };
  Object.setPrototypeOf(SCHEMES, null);
  function getSchemeHandler(scheme) {
    return scheme && (SCHEMES[scheme] || SCHEMES[scheme.toLowerCase()]) || undefined;
  }
  module.exports = {
    wsIsSecure,
    SCHEMES,
    isValidSchemeName,
    getSchemeHandler
  };
});

// node_modules/fast-uri/index.js
var require_fast_uri = __commonJS((exports, module) => {
  var { normalizeIPv6, removeDotSegments, recomposeAuthority, normalizeComponentEncoding, isIPv4, nonSimpleDomain } = require_utils();
  var { SCHEMES, getSchemeHandler } = require_schemes();
  function normalize(uri, options) {
    if (typeof uri === "string") {
      uri = serialize(parse6(uri, options), options);
    } else if (typeof uri === "object") {
      uri = parse6(serialize(uri, options), options);
    }
    return uri;
  }
  function resolve(baseURI, relativeURI, options) {
    const schemelessOptions = options ? Object.assign({ scheme: "null" }, options) : { scheme: "null" };
    const resolved = resolveComponent(parse6(baseURI, schemelessOptions), parse6(relativeURI, schemelessOptions), schemelessOptions, true);
    schemelessOptions.skipEscape = true;
    return serialize(resolved, schemelessOptions);
  }
  function resolveComponent(base, relative, options, skipNormalization) {
    const target = {};
    if (!skipNormalization) {
      base = parse6(serialize(base, options), options);
      relative = parse6(serialize(relative, options), options);
    }
    options = options || {};
    if (!options.tolerant && relative.scheme) {
      target.scheme = relative.scheme;
      target.userinfo = relative.userinfo;
      target.host = relative.host;
      target.port = relative.port;
      target.path = removeDotSegments(relative.path || "");
      target.query = relative.query;
    } else {
      if (relative.userinfo !== undefined || relative.host !== undefined || relative.port !== undefined) {
        target.userinfo = relative.userinfo;
        target.host = relative.host;
        target.port = relative.port;
        target.path = removeDotSegments(relative.path || "");
        target.query = relative.query;
      } else {
        if (!relative.path) {
          target.path = base.path;
          if (relative.query !== undefined) {
            target.query = relative.query;
          } else {
            target.query = base.query;
          }
        } else {
          if (relative.path[0] === "/") {
            target.path = removeDotSegments(relative.path);
          } else {
            if ((base.userinfo !== undefined || base.host !== undefined || base.port !== undefined) && !base.path) {
              target.path = "/" + relative.path;
            } else if (!base.path) {
              target.path = relative.path;
            } else {
              target.path = base.path.slice(0, base.path.lastIndexOf("/") + 1) + relative.path;
            }
            target.path = removeDotSegments(target.path);
          }
          target.query = relative.query;
        }
        target.userinfo = base.userinfo;
        target.host = base.host;
        target.port = base.port;
      }
      target.scheme = base.scheme;
    }
    target.fragment = relative.fragment;
    return target;
  }
  function equal(uriA, uriB, options) {
    if (typeof uriA === "string") {
      uriA = unescape(uriA);
      uriA = serialize(normalizeComponentEncoding(parse6(uriA, options), true), { ...options, skipEscape: true });
    } else if (typeof uriA === "object") {
      uriA = serialize(normalizeComponentEncoding(uriA, true), { ...options, skipEscape: true });
    }
    if (typeof uriB === "string") {
      uriB = unescape(uriB);
      uriB = serialize(normalizeComponentEncoding(parse6(uriB, options), true), { ...options, skipEscape: true });
    } else if (typeof uriB === "object") {
      uriB = serialize(normalizeComponentEncoding(uriB, true), { ...options, skipEscape: true });
    }
    return uriA.toLowerCase() === uriB.toLowerCase();
  }
  function serialize(cmpts, opts) {
    const component = {
      host: cmpts.host,
      scheme: cmpts.scheme,
      userinfo: cmpts.userinfo,
      port: cmpts.port,
      path: cmpts.path,
      query: cmpts.query,
      nid: cmpts.nid,
      nss: cmpts.nss,
      uuid: cmpts.uuid,
      fragment: cmpts.fragment,
      reference: cmpts.reference,
      resourceName: cmpts.resourceName,
      secure: cmpts.secure,
      error: ""
    };
    const options = Object.assign({}, opts);
    const uriTokens = [];
    const schemeHandler = getSchemeHandler(options.scheme || component.scheme);
    if (schemeHandler && schemeHandler.serialize)
      schemeHandler.serialize(component, options);
    if (component.path !== undefined) {
      if (!options.skipEscape) {
        component.path = escape(component.path);
        if (component.scheme !== undefined) {
          component.path = component.path.split("%3A").join(":");
        }
      } else {
        component.path = unescape(component.path);
      }
    }
    if (options.reference !== "suffix" && component.scheme) {
      uriTokens.push(component.scheme, ":");
    }
    const authority = recomposeAuthority(component);
    if (authority !== undefined) {
      if (options.reference !== "suffix") {
        uriTokens.push("//");
      }
      uriTokens.push(authority);
      if (component.path && component.path[0] !== "/") {
        uriTokens.push("/");
      }
    }
    if (component.path !== undefined) {
      let s = component.path;
      if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) {
        s = removeDotSegments(s);
      }
      if (authority === undefined && s[0] === "/" && s[1] === "/") {
        s = "/%2F" + s.slice(2);
      }
      uriTokens.push(s);
    }
    if (component.query !== undefined) {
      uriTokens.push("?", component.query);
    }
    if (component.fragment !== undefined) {
      uriTokens.push("#", component.fragment);
    }
    return uriTokens.join("");
  }
  var URI_PARSE = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
  function parse6(uri, opts) {
    const options = Object.assign({}, opts);
    const parsed = {
      scheme: undefined,
      userinfo: undefined,
      host: "",
      port: undefined,
      path: "",
      query: undefined,
      fragment: undefined
    };
    let isIP = false;
    if (options.reference === "suffix") {
      if (options.scheme) {
        uri = options.scheme + ":" + uri;
      } else {
        uri = "//" + uri;
      }
    }
    const matches = uri.match(URI_PARSE);
    if (matches) {
      parsed.scheme = matches[1];
      parsed.userinfo = matches[3];
      parsed.host = matches[4];
      parsed.port = parseInt(matches[5], 10);
      parsed.path = matches[6] || "";
      parsed.query = matches[7];
      parsed.fragment = matches[8];
      if (isNaN(parsed.port)) {
        parsed.port = matches[5];
      }
      if (parsed.host) {
        const ipv4result = isIPv4(parsed.host);
        if (ipv4result === false) {
          const ipv6result = normalizeIPv6(parsed.host);
          parsed.host = ipv6result.host.toLowerCase();
          isIP = ipv6result.isIPV6;
        } else {
          isIP = true;
        }
      }
      if (parsed.scheme === undefined && parsed.userinfo === undefined && parsed.host === undefined && parsed.port === undefined && parsed.query === undefined && !parsed.path) {
        parsed.reference = "same-document";
      } else if (parsed.scheme === undefined) {
        parsed.reference = "relative";
      } else if (parsed.fragment === undefined) {
        parsed.reference = "absolute";
      } else {
        parsed.reference = "uri";
      }
      if (options.reference && options.reference !== "suffix" && options.reference !== parsed.reference) {
        parsed.error = parsed.error || "URI is not a " + options.reference + " reference.";
      }
      const schemeHandler = getSchemeHandler(options.scheme || parsed.scheme);
      if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport)) {
        if (parsed.host && (options.domainHost || schemeHandler && schemeHandler.domainHost) && isIP === false && nonSimpleDomain(parsed.host)) {
          try {
            parsed.host = URL.domainToASCII(parsed.host.toLowerCase());
          } catch (e) {
            parsed.error = parsed.error || "Host's domain name can not be converted to ASCII: " + e;
          }
        }
      }
      if (!schemeHandler || schemeHandler && !schemeHandler.skipNormalize) {
        if (uri.indexOf("%") !== -1) {
          if (parsed.scheme !== undefined) {
            parsed.scheme = unescape(parsed.scheme);
          }
          if (parsed.host !== undefined) {
            parsed.host = unescape(parsed.host);
          }
        }
        if (parsed.path) {
          parsed.path = escape(unescape(parsed.path));
        }
        if (parsed.fragment) {
          parsed.fragment = encodeURI(decodeURIComponent(parsed.fragment));
        }
      }
      if (schemeHandler && schemeHandler.parse) {
        schemeHandler.parse(parsed, options);
      }
    } else {
      parsed.error = parsed.error || "URI can not be parsed.";
    }
    return parsed;
  }
  var fastUri = {
    SCHEMES,
    normalize,
    resolve,
    resolveComponent,
    equal,
    serialize,
    parse: parse6
  };
  module.exports = fastUri;
  module.exports.default = fastUri;
  module.exports.fastUri = fastUri;
});

// node_modules/ajv/dist/runtime/uri.js
var require_uri = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var uri = require_fast_uri();
  uri.code = 'require("ajv/dist/runtime/uri").default';
  exports.default = uri;
});

// node_modules/ajv/dist/core.js
var require_core = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = undefined;
  var validate_1 = require_validate();
  Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function() {
    return validate_1.KeywordCxt;
  } });
  var codegen_1 = require_codegen();
  Object.defineProperty(exports, "_", { enumerable: true, get: function() {
    return codegen_1._;
  } });
  Object.defineProperty(exports, "str", { enumerable: true, get: function() {
    return codegen_1.str;
  } });
  Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
    return codegen_1.stringify;
  } });
  Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
    return codegen_1.nil;
  } });
  Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
    return codegen_1.Name;
  } });
  Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function() {
    return codegen_1.CodeGen;
  } });
  var validation_error_1 = require_validation_error();
  var ref_error_1 = require_ref_error();
  var rules_1 = require_rules();
  var compile_1 = require_compile();
  var codegen_2 = require_codegen();
  var resolve_1 = require_resolve();
  var dataType_1 = require_dataType();
  var util_1 = require_util();
  var $dataRefSchema = require_data();
  var uri_1 = require_uri();
  var defaultRegExp = (str, flags) => new RegExp(str, flags);
  defaultRegExp.code = "new RegExp";
  var META_IGNORE_OPTIONS = ["removeAdditional", "useDefaults", "coerceTypes"];
  var EXT_SCOPE_NAMES = new Set([
    "validate",
    "serialize",
    "parse",
    "wrapper",
    "root",
    "schema",
    "keyword",
    "pattern",
    "formats",
    "validate$data",
    "func",
    "obj",
    "Error"
  ]);
  var removedOptions = {
    errorDataPath: "",
    format: "`validateFormats: false` can be used instead.",
    nullable: '"nullable" keyword is supported by default.',
    jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
    extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
    missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
    processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
    sourceCode: "Use option `code: {source: true}`",
    strictDefaults: "It is default now, see option `strict`.",
    strictKeywords: "It is default now, see option `strict`.",
    uniqueItems: '"uniqueItems" keyword is always validated.',
    unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
    cache: "Map is used as cache, schema object as key.",
    serialize: "Map is used as cache, schema object as key.",
    ajvErrors: "It is default now."
  };
  var deprecatedOptions = {
    ignoreKeywordsWithRef: "",
    jsPropertySyntax: "",
    unicode: '"minLength"/"maxLength" account for unicode characters by default.'
  };
  var MAX_EXPRESSION = 200;
  function requiredOptions(o) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
    const s = o.strict;
    const _optz = (_a = o.code) === null || _a === undefined ? undefined : _a.optimize;
    const optimize = _optz === true || _optz === undefined ? 1 : _optz || 0;
    const regExp = (_c = (_b = o.code) === null || _b === undefined ? undefined : _b.regExp) !== null && _c !== undefined ? _c : defaultRegExp;
    const uriResolver = (_d = o.uriResolver) !== null && _d !== undefined ? _d : uri_1.default;
    return {
      strictSchema: (_f = (_e = o.strictSchema) !== null && _e !== undefined ? _e : s) !== null && _f !== undefined ? _f : true,
      strictNumbers: (_h = (_g = o.strictNumbers) !== null && _g !== undefined ? _g : s) !== null && _h !== undefined ? _h : true,
      strictTypes: (_k = (_j = o.strictTypes) !== null && _j !== undefined ? _j : s) !== null && _k !== undefined ? _k : "log",
      strictTuples: (_m = (_l = o.strictTuples) !== null && _l !== undefined ? _l : s) !== null && _m !== undefined ? _m : "log",
      strictRequired: (_p = (_o = o.strictRequired) !== null && _o !== undefined ? _o : s) !== null && _p !== undefined ? _p : false,
      code: o.code ? { ...o.code, optimize, regExp } : { optimize, regExp },
      loopRequired: (_q = o.loopRequired) !== null && _q !== undefined ? _q : MAX_EXPRESSION,
      loopEnum: (_r = o.loopEnum) !== null && _r !== undefined ? _r : MAX_EXPRESSION,
      meta: (_s = o.meta) !== null && _s !== undefined ? _s : true,
      messages: (_t = o.messages) !== null && _t !== undefined ? _t : true,
      inlineRefs: (_u = o.inlineRefs) !== null && _u !== undefined ? _u : true,
      schemaId: (_v = o.schemaId) !== null && _v !== undefined ? _v : "$id",
      addUsedSchema: (_w = o.addUsedSchema) !== null && _w !== undefined ? _w : true,
      validateSchema: (_x = o.validateSchema) !== null && _x !== undefined ? _x : true,
      validateFormats: (_y = o.validateFormats) !== null && _y !== undefined ? _y : true,
      unicodeRegExp: (_z = o.unicodeRegExp) !== null && _z !== undefined ? _z : true,
      int32range: (_0 = o.int32range) !== null && _0 !== undefined ? _0 : true,
      uriResolver
    };
  }

  class Ajv {
    constructor(opts = {}) {
      this.schemas = {};
      this.refs = {};
      this.formats = {};
      this._compilations = new Set;
      this._loading = {};
      this._cache = new Map;
      opts = this.opts = { ...opts, ...requiredOptions(opts) };
      const { es5, lines } = this.opts.code;
      this.scope = new codegen_2.ValueScope({ scope: {}, prefixes: EXT_SCOPE_NAMES, es5, lines });
      this.logger = getLogger(opts.logger);
      const formatOpt = opts.validateFormats;
      opts.validateFormats = false;
      this.RULES = (0, rules_1.getRules)();
      checkOptions.call(this, removedOptions, opts, "NOT SUPPORTED");
      checkOptions.call(this, deprecatedOptions, opts, "DEPRECATED", "warn");
      this._metaOpts = getMetaSchemaOptions.call(this);
      if (opts.formats)
        addInitialFormats.call(this);
      this._addVocabularies();
      this._addDefaultMetaSchema();
      if (opts.keywords)
        addInitialKeywords.call(this, opts.keywords);
      if (typeof opts.meta == "object")
        this.addMetaSchema(opts.meta);
      addInitialSchemas.call(this);
      opts.validateFormats = formatOpt;
    }
    _addVocabularies() {
      this.addKeyword("$async");
    }
    _addDefaultMetaSchema() {
      const { $data, meta, schemaId } = this.opts;
      let _dataRefSchema = $dataRefSchema;
      if (schemaId === "id") {
        _dataRefSchema = { ...$dataRefSchema };
        _dataRefSchema.id = _dataRefSchema.$id;
        delete _dataRefSchema.$id;
      }
      if (meta && $data)
        this.addMetaSchema(_dataRefSchema, _dataRefSchema[schemaId], false);
    }
    defaultMeta() {
      const { meta, schemaId } = this.opts;
      return this.opts.defaultMeta = typeof meta == "object" ? meta[schemaId] || meta : undefined;
    }
    validate(schemaKeyRef, data) {
      let v;
      if (typeof schemaKeyRef == "string") {
        v = this.getSchema(schemaKeyRef);
        if (!v)
          throw new Error(`no schema with key or ref "${schemaKeyRef}"`);
      } else {
        v = this.compile(schemaKeyRef);
      }
      const valid = v(data);
      if (!("$async" in v))
        this.errors = v.errors;
      return valid;
    }
    compile(schema, _meta) {
      const sch = this._addSchema(schema, _meta);
      return sch.validate || this._compileSchemaEnv(sch);
    }
    compileAsync(schema, meta) {
      if (typeof this.opts.loadSchema != "function") {
        throw new Error("options.loadSchema should be a function");
      }
      const { loadSchema } = this.opts;
      return runCompileAsync.call(this, schema, meta);
      async function runCompileAsync(_schema, _meta) {
        await loadMetaSchema.call(this, _schema.$schema);
        const sch = this._addSchema(_schema, _meta);
        return sch.validate || _compileAsync.call(this, sch);
      }
      async function loadMetaSchema($ref) {
        if ($ref && !this.getSchema($ref)) {
          await runCompileAsync.call(this, { $ref }, true);
        }
      }
      async function _compileAsync(sch) {
        try {
          return this._compileSchemaEnv(sch);
        } catch (e) {
          if (!(e instanceof ref_error_1.default))
            throw e;
          checkLoaded.call(this, e);
          await loadMissingSchema.call(this, e.missingSchema);
          return _compileAsync.call(this, sch);
        }
      }
      function checkLoaded({ missingSchema: ref, missingRef }) {
        if (this.refs[ref]) {
          throw new Error(`AnySchema ${ref} is loaded but ${missingRef} cannot be resolved`);
        }
      }
      async function loadMissingSchema(ref) {
        const _schema = await _loadSchema.call(this, ref);
        if (!this.refs[ref])
          await loadMetaSchema.call(this, _schema.$schema);
        if (!this.refs[ref])
          this.addSchema(_schema, ref, meta);
      }
      async function _loadSchema(ref) {
        const p = this._loading[ref];
        if (p)
          return p;
        try {
          return await (this._loading[ref] = loadSchema(ref));
        } finally {
          delete this._loading[ref];
        }
      }
    }
    addSchema(schema, key, _meta, _validateSchema = this.opts.validateSchema) {
      if (Array.isArray(schema)) {
        for (const sch of schema)
          this.addSchema(sch, undefined, _meta, _validateSchema);
        return this;
      }
      let id;
      if (typeof schema === "object") {
        const { schemaId } = this.opts;
        id = schema[schemaId];
        if (id !== undefined && typeof id != "string") {
          throw new Error(`schema ${schemaId} must be string`);
        }
      }
      key = (0, resolve_1.normalizeId)(key || id);
      this._checkUnique(key);
      this.schemas[key] = this._addSchema(schema, _meta, key, _validateSchema, true);
      return this;
    }
    addMetaSchema(schema, key, _validateSchema = this.opts.validateSchema) {
      this.addSchema(schema, key, true, _validateSchema);
      return this;
    }
    validateSchema(schema, throwOrLogError) {
      if (typeof schema == "boolean")
        return true;
      let $schema;
      $schema = schema.$schema;
      if ($schema !== undefined && typeof $schema != "string") {
        throw new Error("$schema must be a string");
      }
      $schema = $schema || this.opts.defaultMeta || this.defaultMeta();
      if (!$schema) {
        this.logger.warn("meta-schema not available");
        this.errors = null;
        return true;
      }
      const valid = this.validate($schema, schema);
      if (!valid && throwOrLogError) {
        const message = "schema is invalid: " + this.errorsText();
        if (this.opts.validateSchema === "log")
          this.logger.error(message);
        else
          throw new Error(message);
      }
      return valid;
    }
    getSchema(keyRef) {
      let sch;
      while (typeof (sch = getSchEnv.call(this, keyRef)) == "string")
        keyRef = sch;
      if (sch === undefined) {
        const { schemaId } = this.opts;
        const root = new compile_1.SchemaEnv({ schema: {}, schemaId });
        sch = compile_1.resolveSchema.call(this, root, keyRef);
        if (!sch)
          return;
        this.refs[keyRef] = sch;
      }
      return sch.validate || this._compileSchemaEnv(sch);
    }
    removeSchema(schemaKeyRef) {
      if (schemaKeyRef instanceof RegExp) {
        this._removeAllSchemas(this.schemas, schemaKeyRef);
        this._removeAllSchemas(this.refs, schemaKeyRef);
        return this;
      }
      switch (typeof schemaKeyRef) {
        case "undefined":
          this._removeAllSchemas(this.schemas);
          this._removeAllSchemas(this.refs);
          this._cache.clear();
          return this;
        case "string": {
          const sch = getSchEnv.call(this, schemaKeyRef);
          if (typeof sch == "object")
            this._cache.delete(sch.schema);
          delete this.schemas[schemaKeyRef];
          delete this.refs[schemaKeyRef];
          return this;
        }
        case "object": {
          const cacheKey = schemaKeyRef;
          this._cache.delete(cacheKey);
          let id = schemaKeyRef[this.opts.schemaId];
          if (id) {
            id = (0, resolve_1.normalizeId)(id);
            delete this.schemas[id];
            delete this.refs[id];
          }
          return this;
        }
        default:
          throw new Error("ajv.removeSchema: invalid parameter");
      }
    }
    addVocabulary(definitions) {
      for (const def of definitions)
        this.addKeyword(def);
      return this;
    }
    addKeyword(kwdOrDef, def) {
      let keyword;
      if (typeof kwdOrDef == "string") {
        keyword = kwdOrDef;
        if (typeof def == "object") {
          this.logger.warn("these parameters are deprecated, see docs for addKeyword");
          def.keyword = keyword;
        }
      } else if (typeof kwdOrDef == "object" && def === undefined) {
        def = kwdOrDef;
        keyword = def.keyword;
        if (Array.isArray(keyword) && !keyword.length) {
          throw new Error("addKeywords: keyword must be string or non-empty array");
        }
      } else {
        throw new Error("invalid addKeywords parameters");
      }
      checkKeyword.call(this, keyword, def);
      if (!def) {
        (0, util_1.eachItem)(keyword, (kwd) => addRule.call(this, kwd));
        return this;
      }
      keywordMetaschema.call(this, def);
      const definition = {
        ...def,
        type: (0, dataType_1.getJSONTypes)(def.type),
        schemaType: (0, dataType_1.getJSONTypes)(def.schemaType)
      };
      (0, util_1.eachItem)(keyword, definition.type.length === 0 ? (k) => addRule.call(this, k, definition) : (k) => definition.type.forEach((t) => addRule.call(this, k, definition, t)));
      return this;
    }
    getKeyword(keyword) {
      const rule = this.RULES.all[keyword];
      return typeof rule == "object" ? rule.definition : !!rule;
    }
    removeKeyword(keyword) {
      const { RULES } = this;
      delete RULES.keywords[keyword];
      delete RULES.all[keyword];
      for (const group of RULES.rules) {
        const i = group.rules.findIndex((rule) => rule.keyword === keyword);
        if (i >= 0)
          group.rules.splice(i, 1);
      }
      return this;
    }
    addFormat(name, format) {
      if (typeof format == "string")
        format = new RegExp(format);
      this.formats[name] = format;
      return this;
    }
    errorsText(errors4 = this.errors, { separator = ", ", dataVar = "data" } = {}) {
      if (!errors4 || errors4.length === 0)
        return "No errors";
      return errors4.map((e) => `${dataVar}${e.instancePath} ${e.message}`).reduce((text, msg) => text + separator + msg);
    }
    $dataMetaSchema(metaSchema, keywordsJsonPointers) {
      const rules = this.RULES.all;
      metaSchema = JSON.parse(JSON.stringify(metaSchema));
      for (const jsonPointer of keywordsJsonPointers) {
        const segments = jsonPointer.split("/").slice(1);
        let keywords = metaSchema;
        for (const seg of segments)
          keywords = keywords[seg];
        for (const key in rules) {
          const rule = rules[key];
          if (typeof rule != "object")
            continue;
          const { $data } = rule.definition;
          const schema = keywords[key];
          if ($data && schema)
            keywords[key] = schemaOrData(schema);
        }
      }
      return metaSchema;
    }
    _removeAllSchemas(schemas4, regex) {
      for (const keyRef in schemas4) {
        const sch = schemas4[keyRef];
        if (!regex || regex.test(keyRef)) {
          if (typeof sch == "string") {
            delete schemas4[keyRef];
          } else if (sch && !sch.meta) {
            this._cache.delete(sch.schema);
            delete schemas4[keyRef];
          }
        }
      }
    }
    _addSchema(schema, meta, baseId, validateSchema = this.opts.validateSchema, addSchema = this.opts.addUsedSchema) {
      let id;
      const { schemaId } = this.opts;
      if (typeof schema == "object") {
        id = schema[schemaId];
      } else {
        if (this.opts.jtd)
          throw new Error("schema must be object");
        else if (typeof schema != "boolean")
          throw new Error("schema must be object or boolean");
      }
      let sch = this._cache.get(schema);
      if (sch !== undefined)
        return sch;
      baseId = (0, resolve_1.normalizeId)(id || baseId);
      const localRefs = resolve_1.getSchemaRefs.call(this, schema, baseId);
      sch = new compile_1.SchemaEnv({ schema, schemaId, meta, baseId, localRefs });
      this._cache.set(sch.schema, sch);
      if (addSchema && !baseId.startsWith("#")) {
        if (baseId)
          this._checkUnique(baseId);
        this.refs[baseId] = sch;
      }
      if (validateSchema)
        this.validateSchema(schema, true);
      return sch;
    }
    _checkUnique(id) {
      if (this.schemas[id] || this.refs[id]) {
        throw new Error(`schema with key or id "${id}" already exists`);
      }
    }
    _compileSchemaEnv(sch) {
      if (sch.meta)
        this._compileMetaSchema(sch);
      else
        compile_1.compileSchema.call(this, sch);
      if (!sch.validate)
        throw new Error("ajv implementation error");
      return sch.validate;
    }
    _compileMetaSchema(sch) {
      const currentOpts = this.opts;
      this.opts = this._metaOpts;
      try {
        compile_1.compileSchema.call(this, sch);
      } finally {
        this.opts = currentOpts;
      }
    }
  }
  Ajv.ValidationError = validation_error_1.default;
  Ajv.MissingRefError = ref_error_1.default;
  exports.default = Ajv;
  function checkOptions(checkOpts, options, msg, log = "error") {
    for (const key in checkOpts) {
      const opt = key;
      if (opt in options)
        this.logger[log](`${msg}: option ${key}. ${checkOpts[opt]}`);
    }
  }
  function getSchEnv(keyRef) {
    keyRef = (0, resolve_1.normalizeId)(keyRef);
    return this.schemas[keyRef] || this.refs[keyRef];
  }
  function addInitialSchemas() {
    const optsSchemas = this.opts.schemas;
    if (!optsSchemas)
      return;
    if (Array.isArray(optsSchemas))
      this.addSchema(optsSchemas);
    else
      for (const key in optsSchemas)
        this.addSchema(optsSchemas[key], key);
  }
  function addInitialFormats() {
    for (const name in this.opts.formats) {
      const format = this.opts.formats[name];
      if (format)
        this.addFormat(name, format);
    }
  }
  function addInitialKeywords(defs) {
    if (Array.isArray(defs)) {
      this.addVocabulary(defs);
      return;
    }
    this.logger.warn("keywords option as map is deprecated, pass array");
    for (const keyword in defs) {
      const def = defs[keyword];
      if (!def.keyword)
        def.keyword = keyword;
      this.addKeyword(def);
    }
  }
  function getMetaSchemaOptions() {
    const metaOpts = { ...this.opts };
    for (const opt of META_IGNORE_OPTIONS)
      delete metaOpts[opt];
    return metaOpts;
  }
  var noLogs = { log() {}, warn() {}, error() {} };
  function getLogger(logger) {
    if (logger === false)
      return noLogs;
    if (logger === undefined)
      return console;
    if (logger.log && logger.warn && logger.error)
      return logger;
    throw new Error("logger must implement log, warn and error methods");
  }
  var KEYWORD_NAME = /^[a-z_$][a-z0-9_$:-]*$/i;
  function checkKeyword(keyword, def) {
    const { RULES } = this;
    (0, util_1.eachItem)(keyword, (kwd) => {
      if (RULES.keywords[kwd])
        throw new Error(`Keyword ${kwd} is already defined`);
      if (!KEYWORD_NAME.test(kwd))
        throw new Error(`Keyword ${kwd} has invalid name`);
    });
    if (!def)
      return;
    if (def.$data && !(("code" in def) || ("validate" in def))) {
      throw new Error('$data keyword must have "code" or "validate" function');
    }
  }
  function addRule(keyword, definition, dataType) {
    var _a;
    const post = definition === null || definition === undefined ? undefined : definition.post;
    if (dataType && post)
      throw new Error('keyword with "post" flag cannot have "type"');
    const { RULES } = this;
    let ruleGroup = post ? RULES.post : RULES.rules.find(({ type: t }) => t === dataType);
    if (!ruleGroup) {
      ruleGroup = { type: dataType, rules: [] };
      RULES.rules.push(ruleGroup);
    }
    RULES.keywords[keyword] = true;
    if (!definition)
      return;
    const rule = {
      keyword,
      definition: {
        ...definition,
        type: (0, dataType_1.getJSONTypes)(definition.type),
        schemaType: (0, dataType_1.getJSONTypes)(definition.schemaType)
      }
    };
    if (definition.before)
      addBeforeRule.call(this, ruleGroup, rule, definition.before);
    else
      ruleGroup.rules.push(rule);
    RULES.all[keyword] = rule;
    (_a = definition.implements) === null || _a === undefined || _a.forEach((kwd) => this.addKeyword(kwd));
  }
  function addBeforeRule(ruleGroup, rule, before) {
    const i = ruleGroup.rules.findIndex((_rule) => _rule.keyword === before);
    if (i >= 0) {
      ruleGroup.rules.splice(i, 0, rule);
    } else {
      ruleGroup.rules.push(rule);
      this.logger.warn(`rule ${before} is not defined`);
    }
  }
  function keywordMetaschema(def) {
    let { metaSchema } = def;
    if (metaSchema === undefined)
      return;
    if (def.$data && this.opts.$data)
      metaSchema = schemaOrData(metaSchema);
    def.validateSchema = this.compile(metaSchema, true);
  }
  var $dataRef = {
    $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
  };
  function schemaOrData(schema) {
    return { anyOf: [schema, $dataRef] };
  }
});

// node_modules/ajv/dist/vocabularies/core/id.js
var require_id = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var def = {
    keyword: "id",
    code() {
      throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/core/ref.js
var require_ref = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.callRef = exports.getValidate = undefined;
  var ref_error_1 = require_ref_error();
  var code_1 = require_code2();
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var compile_1 = require_compile();
  var util_1 = require_util();
  var def = {
    keyword: "$ref",
    schemaType: "string",
    code(cxt) {
      const { gen, schema: $ref, it } = cxt;
      const { baseId, schemaEnv: env, validateName, opts, self: self2 } = it;
      const { root } = env;
      if (($ref === "#" || $ref === "#/") && baseId === root.baseId)
        return callRootRef();
      const schOrEnv = compile_1.resolveRef.call(self2, root, baseId, $ref);
      if (schOrEnv === undefined)
        throw new ref_error_1.default(it.opts.uriResolver, baseId, $ref);
      if (schOrEnv instanceof compile_1.SchemaEnv)
        return callValidate(schOrEnv);
      return inlineRefSchema(schOrEnv);
      function callRootRef() {
        if (env === root)
          return callRef(cxt, validateName, env, env.$async);
        const rootName = gen.scopeValue("root", { ref: root });
        return callRef(cxt, (0, codegen_1._)`${rootName}.validate`, root, root.$async);
      }
      function callValidate(sch) {
        const v = getValidate(cxt, sch);
        callRef(cxt, v, sch, sch.$async);
      }
      function inlineRefSchema(sch) {
        const schName = gen.scopeValue("schema", opts.code.source === true ? { ref: sch, code: (0, codegen_1.stringify)(sch) } : { ref: sch });
        const valid = gen.name("valid");
        const schCxt = cxt.subschema({
          schema: sch,
          dataTypes: [],
          schemaPath: codegen_1.nil,
          topSchemaRef: schName,
          errSchemaPath: $ref
        }, valid);
        cxt.mergeEvaluated(schCxt);
        cxt.ok(valid);
      }
    }
  };
  function getValidate(cxt, sch) {
    const { gen } = cxt;
    return sch.validate ? gen.scopeValue("validate", { ref: sch.validate }) : (0, codegen_1._)`${gen.scopeValue("wrapper", { ref: sch })}.validate`;
  }
  exports.getValidate = getValidate;
  function callRef(cxt, v, sch, $async) {
    const { gen, it } = cxt;
    const { allErrors, schemaEnv: env, opts } = it;
    const passCxt = opts.passContext ? names_1.default.this : codegen_1.nil;
    if ($async)
      callAsyncRef();
    else
      callSyncRef();
    function callAsyncRef() {
      if (!env.$async)
        throw new Error("async schema referenced by sync schema");
      const valid = gen.let("valid");
      gen.try(() => {
        gen.code((0, codegen_1._)`await ${(0, code_1.callValidateCode)(cxt, v, passCxt)}`);
        addEvaluatedFrom(v);
        if (!allErrors)
          gen.assign(valid, true);
      }, (e) => {
        gen.if((0, codegen_1._)`!(${e} instanceof ${it.ValidationError})`, () => gen.throw(e));
        addErrorsFrom(e);
        if (!allErrors)
          gen.assign(valid, false);
      });
      cxt.ok(valid);
    }
    function callSyncRef() {
      cxt.result((0, code_1.callValidateCode)(cxt, v, passCxt), () => addEvaluatedFrom(v), () => addErrorsFrom(v));
    }
    function addErrorsFrom(source) {
      const errs = (0, codegen_1._)`${source}.errors`;
      gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`);
      gen.assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
    }
    function addEvaluatedFrom(source) {
      var _a;
      if (!it.opts.unevaluated)
        return;
      const schEvaluated = (_a = sch === null || sch === undefined ? undefined : sch.validate) === null || _a === undefined ? undefined : _a.evaluated;
      if (it.props !== true) {
        if (schEvaluated && !schEvaluated.dynamicProps) {
          if (schEvaluated.props !== undefined) {
            it.props = util_1.mergeEvaluated.props(gen, schEvaluated.props, it.props);
          }
        } else {
          const props = gen.var("props", (0, codegen_1._)`${source}.evaluated.props`);
          it.props = util_1.mergeEvaluated.props(gen, props, it.props, codegen_1.Name);
        }
      }
      if (it.items !== true) {
        if (schEvaluated && !schEvaluated.dynamicItems) {
          if (schEvaluated.items !== undefined) {
            it.items = util_1.mergeEvaluated.items(gen, schEvaluated.items, it.items);
          }
        } else {
          const items = gen.var("items", (0, codegen_1._)`${source}.evaluated.items`);
          it.items = util_1.mergeEvaluated.items(gen, items, it.items, codegen_1.Name);
        }
      }
    }
  }
  exports.callRef = callRef;
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/core/index.js
var require_core2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var id_1 = require_id();
  var ref_1 = require_ref();
  var core2 = [
    "$schema",
    "$id",
    "$defs",
    "$vocabulary",
    { keyword: "$comment" },
    "definitions",
    id_1.default,
    ref_1.default
  ];
  exports.default = core2;
});

// node_modules/ajv/dist/vocabularies/validation/limitNumber.js
var require_limitNumber = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var ops = codegen_1.operators;
  var KWDs = {
    maximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
    minimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
    exclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
    exclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE }
  };
  var error2 = {
    message: ({ keyword, schemaCode }) => (0, codegen_1.str)`must be ${KWDs[keyword].okStr} ${schemaCode}`,
    params: ({ keyword, schemaCode }) => (0, codegen_1._)`{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`
  };
  var def = {
    keyword: Object.keys(KWDs),
    type: "number",
    schemaType: "number",
    $data: true,
    error: error2,
    code(cxt) {
      const { keyword, data, schemaCode } = cxt;
      cxt.fail$data((0, codegen_1._)`${data} ${KWDs[keyword].fail} ${schemaCode} || isNaN(${data})`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/multipleOf.js
var require_multipleOf = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var error2 = {
    message: ({ schemaCode }) => (0, codegen_1.str)`must be multiple of ${schemaCode}`,
    params: ({ schemaCode }) => (0, codegen_1._)`{multipleOf: ${schemaCode}}`
  };
  var def = {
    keyword: "multipleOf",
    type: "number",
    schemaType: "number",
    $data: true,
    error: error2,
    code(cxt) {
      const { gen, data, schemaCode, it } = cxt;
      const prec = it.opts.multipleOfPrecision;
      const res = gen.let("res");
      const invalid = prec ? (0, codegen_1._)`Math.abs(Math.round(${res}) - ${res}) > 1e-${prec}` : (0, codegen_1._)`${res} !== parseInt(${res})`;
      cxt.fail$data((0, codegen_1._)`(${schemaCode} === 0 || (${res} = ${data}/${schemaCode}, ${invalid}))`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/runtime/ucs2length.js
var require_ucs2length = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  function ucs2length(str) {
    const len = str.length;
    let length = 0;
    let pos = 0;
    let value;
    while (pos < len) {
      length++;
      value = str.charCodeAt(pos++);
      if (value >= 55296 && value <= 56319 && pos < len) {
        value = str.charCodeAt(pos);
        if ((value & 64512) === 56320)
          pos++;
      }
    }
    return length;
  }
  exports.default = ucs2length;
  ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
});

// node_modules/ajv/dist/vocabularies/validation/limitLength.js
var require_limitLength = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var ucs2length_1 = require_ucs2length();
  var error2 = {
    message({ keyword, schemaCode }) {
      const comp = keyword === "maxLength" ? "more" : "fewer";
      return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} characters`;
    },
    params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
  };
  var def = {
    keyword: ["maxLength", "minLength"],
    type: "string",
    schemaType: "number",
    $data: true,
    error: error2,
    code(cxt) {
      const { keyword, data, schemaCode, it } = cxt;
      const op = keyword === "maxLength" ? codegen_1.operators.GT : codegen_1.operators.LT;
      const len = it.opts.unicode === false ? (0, codegen_1._)`${data}.length` : (0, codegen_1._)`${(0, util_1.useFunc)(cxt.gen, ucs2length_1.default)}(${data})`;
      cxt.fail$data((0, codegen_1._)`${len} ${op} ${schemaCode}`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/pattern.js
var require_pattern = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var util_1 = require_util();
  var codegen_1 = require_codegen();
  var error2 = {
    message: ({ schemaCode }) => (0, codegen_1.str)`must match pattern "${schemaCode}"`,
    params: ({ schemaCode }) => (0, codegen_1._)`{pattern: ${schemaCode}}`
  };
  var def = {
    keyword: "pattern",
    type: "string",
    schemaType: "string",
    $data: true,
    error: error2,
    code(cxt) {
      const { gen, data, $data, schema, schemaCode, it } = cxt;
      const u = it.opts.unicodeRegExp ? "u" : "";
      if ($data) {
        const { regExp } = it.opts.code;
        const regExpCode = regExp.code === "new RegExp" ? (0, codegen_1._)`new RegExp` : (0, util_1.useFunc)(gen, regExp);
        const valid = gen.let("valid");
        gen.try(() => gen.assign(valid, (0, codegen_1._)`${regExpCode}(${schemaCode}, ${u}).test(${data})`), () => gen.assign(valid, false));
        cxt.fail$data((0, codegen_1._)`!${valid}`);
      } else {
        const regExp = (0, code_1.usePattern)(cxt, schema);
        cxt.fail$data((0, codegen_1._)`!${regExp}.test(${data})`);
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/limitProperties.js
var require_limitProperties = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var error2 = {
    message({ keyword, schemaCode }) {
      const comp = keyword === "maxProperties" ? "more" : "fewer";
      return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} properties`;
    },
    params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
  };
  var def = {
    keyword: ["maxProperties", "minProperties"],
    type: "object",
    schemaType: "number",
    $data: true,
    error: error2,
    code(cxt) {
      const { keyword, data, schemaCode } = cxt;
      const op = keyword === "maxProperties" ? codegen_1.operators.GT : codegen_1.operators.LT;
      cxt.fail$data((0, codegen_1._)`Object.keys(${data}).length ${op} ${schemaCode}`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/required.js
var require_required = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error2 = {
    message: ({ params: { missingProperty } }) => (0, codegen_1.str)`must have required property '${missingProperty}'`,
    params: ({ params: { missingProperty } }) => (0, codegen_1._)`{missingProperty: ${missingProperty}}`
  };
  var def = {
    keyword: "required",
    type: "object",
    schemaType: "array",
    $data: true,
    error: error2,
    code(cxt) {
      const { gen, schema, schemaCode, data, $data, it } = cxt;
      const { opts } = it;
      if (!$data && schema.length === 0)
        return;
      const useLoop = schema.length >= opts.loopRequired;
      if (it.allErrors)
        allErrorsMode();
      else
        exitOnErrorMode();
      if (opts.strictRequired) {
        const props = cxt.parentSchema.properties;
        const { definedProperties } = cxt.it;
        for (const requiredKey of schema) {
          if ((props === null || props === undefined ? undefined : props[requiredKey]) === undefined && !definedProperties.has(requiredKey)) {
            const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
            const msg = `required property "${requiredKey}" is not defined at "${schemaPath}" (strictRequired)`;
            (0, util_1.checkStrictMode)(it, msg, it.opts.strictRequired);
          }
        }
      }
      function allErrorsMode() {
        if (useLoop || $data) {
          cxt.block$data(codegen_1.nil, loopAllRequired);
        } else {
          for (const prop of schema) {
            (0, code_1.checkReportMissingProp)(cxt, prop);
          }
        }
      }
      function exitOnErrorMode() {
        const missing = gen.let("missing");
        if (useLoop || $data) {
          const valid = gen.let("valid", true);
          cxt.block$data(valid, () => loopUntilMissing(missing, valid));
          cxt.ok(valid);
        } else {
          gen.if((0, code_1.checkMissingProp)(cxt, schema, missing));
          (0, code_1.reportMissingProp)(cxt, missing);
          gen.else();
        }
      }
      function loopAllRequired() {
        gen.forOf("prop", schemaCode, (prop) => {
          cxt.setParams({ missingProperty: prop });
          gen.if((0, code_1.noPropertyInData)(gen, data, prop, opts.ownProperties), () => cxt.error());
        });
      }
      function loopUntilMissing(missing, valid) {
        cxt.setParams({ missingProperty: missing });
        gen.forOf(missing, schemaCode, () => {
          gen.assign(valid, (0, code_1.propertyInData)(gen, data, missing, opts.ownProperties));
          gen.if((0, codegen_1.not)(valid), () => {
            cxt.error();
            gen.break();
          });
        }, codegen_1.nil);
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/limitItems.js
var require_limitItems = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var error2 = {
    message({ keyword, schemaCode }) {
      const comp = keyword === "maxItems" ? "more" : "fewer";
      return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} items`;
    },
    params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
  };
  var def = {
    keyword: ["maxItems", "minItems"],
    type: "array",
    schemaType: "number",
    $data: true,
    error: error2,
    code(cxt) {
      const { keyword, data, schemaCode } = cxt;
      const op = keyword === "maxItems" ? codegen_1.operators.GT : codegen_1.operators.LT;
      cxt.fail$data((0, codegen_1._)`${data}.length ${op} ${schemaCode}`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/runtime/equal.js
var require_equal = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var equal = require_fast_deep_equal();
  equal.code = 'require("ajv/dist/runtime/equal").default';
  exports.default = equal;
});

// node_modules/ajv/dist/vocabularies/validation/uniqueItems.js
var require_uniqueItems = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var dataType_1 = require_dataType();
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var equal_1 = require_equal();
  var error2 = {
    message: ({ params: { i, j } }) => (0, codegen_1.str)`must NOT have duplicate items (items ## ${j} and ${i} are identical)`,
    params: ({ params: { i, j } }) => (0, codegen_1._)`{i: ${i}, j: ${j}}`
  };
  var def = {
    keyword: "uniqueItems",
    type: "array",
    schemaType: "boolean",
    $data: true,
    error: error2,
    code(cxt) {
      const { gen, data, $data, schema, parentSchema, schemaCode, it } = cxt;
      if (!$data && !schema)
        return;
      const valid = gen.let("valid");
      const itemTypes = parentSchema.items ? (0, dataType_1.getSchemaTypes)(parentSchema.items) : [];
      cxt.block$data(valid, validateUniqueItems, (0, codegen_1._)`${schemaCode} === false`);
      cxt.ok(valid);
      function validateUniqueItems() {
        const i = gen.let("i", (0, codegen_1._)`${data}.length`);
        const j = gen.let("j");
        cxt.setParams({ i, j });
        gen.assign(valid, true);
        gen.if((0, codegen_1._)`${i} > 1`, () => (canOptimize() ? loopN : loopN2)(i, j));
      }
      function canOptimize() {
        return itemTypes.length > 0 && !itemTypes.some((t) => t === "object" || t === "array");
      }
      function loopN(i, j) {
        const item = gen.name("item");
        const wrongType = (0, dataType_1.checkDataTypes)(itemTypes, item, it.opts.strictNumbers, dataType_1.DataType.Wrong);
        const indices = gen.const("indices", (0, codegen_1._)`{}`);
        gen.for((0, codegen_1._)`;${i}--;`, () => {
          gen.let(item, (0, codegen_1._)`${data}[${i}]`);
          gen.if(wrongType, (0, codegen_1._)`continue`);
          if (itemTypes.length > 1)
            gen.if((0, codegen_1._)`typeof ${item} == "string"`, (0, codegen_1._)`${item} += "_"`);
          gen.if((0, codegen_1._)`typeof ${indices}[${item}] == "number"`, () => {
            gen.assign(j, (0, codegen_1._)`${indices}[${item}]`);
            cxt.error();
            gen.assign(valid, false).break();
          }).code((0, codegen_1._)`${indices}[${item}] = ${i}`);
        });
      }
      function loopN2(i, j) {
        const eql = (0, util_1.useFunc)(gen, equal_1.default);
        const outer = gen.name("outer");
        gen.label(outer).for((0, codegen_1._)`;${i}--;`, () => gen.for((0, codegen_1._)`${j} = ${i}; ${j}--;`, () => gen.if((0, codegen_1._)`${eql}(${data}[${i}], ${data}[${j}])`, () => {
          cxt.error();
          gen.assign(valid, false).break(outer);
        })));
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/const.js
var require_const = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var equal_1 = require_equal();
  var error2 = {
    message: "must be equal to constant",
    params: ({ schemaCode }) => (0, codegen_1._)`{allowedValue: ${schemaCode}}`
  };
  var def = {
    keyword: "const",
    $data: true,
    error: error2,
    code(cxt) {
      const { gen, data, $data, schemaCode, schema } = cxt;
      if ($data || schema && typeof schema == "object") {
        cxt.fail$data((0, codegen_1._)`!${(0, util_1.useFunc)(gen, equal_1.default)}(${data}, ${schemaCode})`);
      } else {
        cxt.fail((0, codegen_1._)`${schema} !== ${data}`);
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/enum.js
var require_enum = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var equal_1 = require_equal();
  var error2 = {
    message: "must be equal to one of the allowed values",
    params: ({ schemaCode }) => (0, codegen_1._)`{allowedValues: ${schemaCode}}`
  };
  var def = {
    keyword: "enum",
    schemaType: "array",
    $data: true,
    error: error2,
    code(cxt) {
      const { gen, data, $data, schema, schemaCode, it } = cxt;
      if (!$data && schema.length === 0)
        throw new Error("enum must have non-empty array");
      const useLoop = schema.length >= it.opts.loopEnum;
      let eql;
      const getEql = () => eql !== null && eql !== undefined ? eql : eql = (0, util_1.useFunc)(gen, equal_1.default);
      let valid;
      if (useLoop || $data) {
        valid = gen.let("valid");
        cxt.block$data(valid, loopEnum);
      } else {
        if (!Array.isArray(schema))
          throw new Error("ajv implementation error");
        const vSchema = gen.const("vSchema", schemaCode);
        valid = (0, codegen_1.or)(...schema.map((_x, i) => equalCode(vSchema, i)));
      }
      cxt.pass(valid);
      function loopEnum() {
        gen.assign(valid, false);
        gen.forOf("v", schemaCode, (v) => gen.if((0, codegen_1._)`${getEql()}(${data}, ${v})`, () => gen.assign(valid, true).break()));
      }
      function equalCode(vSchema, i) {
        const sch = schema[i];
        return typeof sch === "object" && sch !== null ? (0, codegen_1._)`${getEql()}(${data}, ${vSchema}[${i}])` : (0, codegen_1._)`${data} === ${sch}`;
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/validation/index.js
var require_validation = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var limitNumber_1 = require_limitNumber();
  var multipleOf_1 = require_multipleOf();
  var limitLength_1 = require_limitLength();
  var pattern_1 = require_pattern();
  var limitProperties_1 = require_limitProperties();
  var required_1 = require_required();
  var limitItems_1 = require_limitItems();
  var uniqueItems_1 = require_uniqueItems();
  var const_1 = require_const();
  var enum_1 = require_enum();
  var validation = [
    limitNumber_1.default,
    multipleOf_1.default,
    limitLength_1.default,
    pattern_1.default,
    limitProperties_1.default,
    required_1.default,
    limitItems_1.default,
    uniqueItems_1.default,
    { keyword: "type", schemaType: ["string", "array"] },
    { keyword: "nullable", schemaType: "boolean" },
    const_1.default,
    enum_1.default
  ];
  exports.default = validation;
});

// node_modules/ajv/dist/vocabularies/applicator/additionalItems.js
var require_additionalItems = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateAdditionalItems = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error2 = {
    message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
    params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
  };
  var def = {
    keyword: "additionalItems",
    type: "array",
    schemaType: ["boolean", "object"],
    before: "uniqueItems",
    error: error2,
    code(cxt) {
      const { parentSchema, it } = cxt;
      const { items } = parentSchema;
      if (!Array.isArray(items)) {
        (0, util_1.checkStrictMode)(it, '"additionalItems" is ignored when "items" is not an array of schemas');
        return;
      }
      validateAdditionalItems(cxt, items);
    }
  };
  function validateAdditionalItems(cxt, items) {
    const { gen, schema, data, keyword, it } = cxt;
    it.items = true;
    const len = gen.const("len", (0, codegen_1._)`${data}.length`);
    if (schema === false) {
      cxt.setParams({ len: items.length });
      cxt.pass((0, codegen_1._)`${len} <= ${items.length}`);
    } else if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
      const valid = gen.var("valid", (0, codegen_1._)`${len} <= ${items.length}`);
      gen.if((0, codegen_1.not)(valid), () => validateItems(valid));
      cxt.ok(valid);
    }
    function validateItems(valid) {
      gen.forRange("i", items.length, len, (i) => {
        cxt.subschema({ keyword, dataProp: i, dataPropType: util_1.Type.Num }, valid);
        if (!it.allErrors)
          gen.if((0, codegen_1.not)(valid), () => gen.break());
      });
    }
  }
  exports.validateAdditionalItems = validateAdditionalItems;
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/items.js
var require_items = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateTuple = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var code_1 = require_code2();
  var def = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "array", "boolean"],
    before: "uniqueItems",
    code(cxt) {
      const { schema, it } = cxt;
      if (Array.isArray(schema))
        return validateTuple(cxt, "additionalItems", schema);
      it.items = true;
      if ((0, util_1.alwaysValidSchema)(it, schema))
        return;
      cxt.ok((0, code_1.validateArray)(cxt));
    }
  };
  function validateTuple(cxt, extraItems, schArr = cxt.schema) {
    const { gen, parentSchema, data, keyword, it } = cxt;
    checkStrictTuple(parentSchema);
    if (it.opts.unevaluated && schArr.length && it.items !== true) {
      it.items = util_1.mergeEvaluated.items(gen, schArr.length, it.items);
    }
    const valid = gen.name("valid");
    const len = gen.const("len", (0, codegen_1._)`${data}.length`);
    schArr.forEach((sch, i) => {
      if ((0, util_1.alwaysValidSchema)(it, sch))
        return;
      gen.if((0, codegen_1._)`${len} > ${i}`, () => cxt.subschema({
        keyword,
        schemaProp: i,
        dataProp: i
      }, valid));
      cxt.ok(valid);
    });
    function checkStrictTuple(sch) {
      const { opts, errSchemaPath } = it;
      const l = schArr.length;
      const fullTuple = l === sch.minItems && (l === sch.maxItems || sch[extraItems] === false);
      if (opts.strictTuples && !fullTuple) {
        const msg = `"${keyword}" is ${l}-tuple, but minItems or maxItems/${extraItems} are not specified or different at path "${errSchemaPath}"`;
        (0, util_1.checkStrictMode)(it, msg, opts.strictTuples);
      }
    }
  }
  exports.validateTuple = validateTuple;
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/prefixItems.js
var require_prefixItems = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var items_1 = require_items();
  var def = {
    keyword: "prefixItems",
    type: "array",
    schemaType: ["array"],
    before: "uniqueItems",
    code: (cxt) => (0, items_1.validateTuple)(cxt, "items")
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/items2020.js
var require_items2020 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var code_1 = require_code2();
  var additionalItems_1 = require_additionalItems();
  var error2 = {
    message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
    params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
  };
  var def = {
    keyword: "items",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    error: error2,
    code(cxt) {
      const { schema, parentSchema, it } = cxt;
      const { prefixItems } = parentSchema;
      it.items = true;
      if ((0, util_1.alwaysValidSchema)(it, schema))
        return;
      if (prefixItems)
        (0, additionalItems_1.validateAdditionalItems)(cxt, prefixItems);
      else
        cxt.ok((0, code_1.validateArray)(cxt));
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/contains.js
var require_contains = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error2 = {
    message: ({ params: { min, max } }) => max === undefined ? (0, codegen_1.str)`must contain at least ${min} valid item(s)` : (0, codegen_1.str)`must contain at least ${min} and no more than ${max} valid item(s)`,
    params: ({ params: { min, max } }) => max === undefined ? (0, codegen_1._)`{minContains: ${min}}` : (0, codegen_1._)`{minContains: ${min}, maxContains: ${max}}`
  };
  var def = {
    keyword: "contains",
    type: "array",
    schemaType: ["object", "boolean"],
    before: "uniqueItems",
    trackErrors: true,
    error: error2,
    code(cxt) {
      const { gen, schema, parentSchema, data, it } = cxt;
      let min;
      let max;
      const { minContains, maxContains } = parentSchema;
      if (it.opts.next) {
        min = minContains === undefined ? 1 : minContains;
        max = maxContains;
      } else {
        min = 1;
      }
      const len = gen.const("len", (0, codegen_1._)`${data}.length`);
      cxt.setParams({ min, max });
      if (max === undefined && min === 0) {
        (0, util_1.checkStrictMode)(it, `"minContains" == 0 without "maxContains": "contains" keyword ignored`);
        return;
      }
      if (max !== undefined && min > max) {
        (0, util_1.checkStrictMode)(it, `"minContains" > "maxContains" is always invalid`);
        cxt.fail();
        return;
      }
      if ((0, util_1.alwaysValidSchema)(it, schema)) {
        let cond = (0, codegen_1._)`${len} >= ${min}`;
        if (max !== undefined)
          cond = (0, codegen_1._)`${cond} && ${len} <= ${max}`;
        cxt.pass(cond);
        return;
      }
      it.items = true;
      const valid = gen.name("valid");
      if (max === undefined && min === 1) {
        validateItems(valid, () => gen.if(valid, () => gen.break()));
      } else if (min === 0) {
        gen.let(valid, true);
        if (max !== undefined)
          gen.if((0, codegen_1._)`${data}.length > 0`, validateItemsWithCount);
      } else {
        gen.let(valid, false);
        validateItemsWithCount();
      }
      cxt.result(valid, () => cxt.reset());
      function validateItemsWithCount() {
        const schValid = gen.name("_valid");
        const count = gen.let("count", 0);
        validateItems(schValid, () => gen.if(schValid, () => checkLimits(count)));
      }
      function validateItems(_valid, block) {
        gen.forRange("i", 0, len, (i) => {
          cxt.subschema({
            keyword: "contains",
            dataProp: i,
            dataPropType: util_1.Type.Num,
            compositeRule: true
          }, _valid);
          block();
        });
      }
      function checkLimits(count) {
        gen.code((0, codegen_1._)`${count}++`);
        if (max === undefined) {
          gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true).break());
        } else {
          gen.if((0, codegen_1._)`${count} > ${max}`, () => gen.assign(valid, false).break());
          if (min === 1)
            gen.assign(valid, true);
          else
            gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true));
        }
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/dependencies.js
var require_dependencies = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.validateSchemaDeps = exports.validatePropertyDeps = exports.error = undefined;
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var code_1 = require_code2();
  exports.error = {
    message: ({ params: { property, depsCount, deps } }) => {
      const property_ies = depsCount === 1 ? "property" : "properties";
      return (0, codegen_1.str)`must have ${property_ies} ${deps} when property ${property} is present`;
    },
    params: ({ params: { property, depsCount, deps, missingProperty } }) => (0, codegen_1._)`{property: ${property},
    missingProperty: ${missingProperty},
    depsCount: ${depsCount},
    deps: ${deps}}`
  };
  var def = {
    keyword: "dependencies",
    type: "object",
    schemaType: "object",
    error: exports.error,
    code(cxt) {
      const [propDeps, schDeps] = splitDependencies(cxt);
      validatePropertyDeps(cxt, propDeps);
      validateSchemaDeps(cxt, schDeps);
    }
  };
  function splitDependencies({ schema }) {
    const propertyDeps = {};
    const schemaDeps = {};
    for (const key in schema) {
      if (key === "__proto__")
        continue;
      const deps = Array.isArray(schema[key]) ? propertyDeps : schemaDeps;
      deps[key] = schema[key];
    }
    return [propertyDeps, schemaDeps];
  }
  function validatePropertyDeps(cxt, propertyDeps = cxt.schema) {
    const { gen, data, it } = cxt;
    if (Object.keys(propertyDeps).length === 0)
      return;
    const missing = gen.let("missing");
    for (const prop in propertyDeps) {
      const deps = propertyDeps[prop];
      if (deps.length === 0)
        continue;
      const hasProperty = (0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties);
      cxt.setParams({
        property: prop,
        depsCount: deps.length,
        deps: deps.join(", ")
      });
      if (it.allErrors) {
        gen.if(hasProperty, () => {
          for (const depProp of deps) {
            (0, code_1.checkReportMissingProp)(cxt, depProp);
          }
        });
      } else {
        gen.if((0, codegen_1._)`${hasProperty} && (${(0, code_1.checkMissingProp)(cxt, deps, missing)})`);
        (0, code_1.reportMissingProp)(cxt, missing);
        gen.else();
      }
    }
  }
  exports.validatePropertyDeps = validatePropertyDeps;
  function validateSchemaDeps(cxt, schemaDeps = cxt.schema) {
    const { gen, data, keyword, it } = cxt;
    const valid = gen.name("valid");
    for (const prop in schemaDeps) {
      if ((0, util_1.alwaysValidSchema)(it, schemaDeps[prop]))
        continue;
      gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties), () => {
        const schCxt = cxt.subschema({ keyword, schemaProp: prop }, valid);
        cxt.mergeValidEvaluated(schCxt, valid);
      }, () => gen.var(valid, true));
      cxt.ok(valid);
    }
  }
  exports.validateSchemaDeps = validateSchemaDeps;
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/propertyNames.js
var require_propertyNames = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error2 = {
    message: "property name must be valid",
    params: ({ params }) => (0, codegen_1._)`{propertyName: ${params.propertyName}}`
  };
  var def = {
    keyword: "propertyNames",
    type: "object",
    schemaType: ["object", "boolean"],
    error: error2,
    code(cxt) {
      const { gen, schema, data, it } = cxt;
      if ((0, util_1.alwaysValidSchema)(it, schema))
        return;
      const valid = gen.name("valid");
      gen.forIn("key", data, (key) => {
        cxt.setParams({ propertyName: key });
        cxt.subschema({
          keyword: "propertyNames",
          data: key,
          dataTypes: ["string"],
          propertyName: key,
          compositeRule: true
        }, valid);
        gen.if((0, codegen_1.not)(valid), () => {
          cxt.error(true);
          if (!it.allErrors)
            gen.break();
        });
      });
      cxt.ok(valid);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/additionalProperties.js
var require_additionalProperties = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var codegen_1 = require_codegen();
  var names_1 = require_names();
  var util_1 = require_util();
  var error2 = {
    message: "must NOT have additional properties",
    params: ({ params }) => (0, codegen_1._)`{additionalProperty: ${params.additionalProperty}}`
  };
  var def = {
    keyword: "additionalProperties",
    type: ["object"],
    schemaType: ["boolean", "object"],
    allowUndefined: true,
    trackErrors: true,
    error: error2,
    code(cxt) {
      const { gen, schema, parentSchema, data, errsCount, it } = cxt;
      if (!errsCount)
        throw new Error("ajv implementation error");
      const { allErrors, opts } = it;
      it.props = true;
      if (opts.removeAdditional !== "all" && (0, util_1.alwaysValidSchema)(it, schema))
        return;
      const props = (0, code_1.allSchemaProperties)(parentSchema.properties);
      const patProps = (0, code_1.allSchemaProperties)(parentSchema.patternProperties);
      checkAdditionalProperties();
      cxt.ok((0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
      function checkAdditionalProperties() {
        gen.forIn("key", data, (key) => {
          if (!props.length && !patProps.length)
            additionalPropertyCode(key);
          else
            gen.if(isAdditional(key), () => additionalPropertyCode(key));
        });
      }
      function isAdditional(key) {
        let definedProp;
        if (props.length > 8) {
          const propsSchema = (0, util_1.schemaRefOrVal)(it, parentSchema.properties, "properties");
          definedProp = (0, code_1.isOwnProperty)(gen, propsSchema, key);
        } else if (props.length) {
          definedProp = (0, codegen_1.or)(...props.map((p) => (0, codegen_1._)`${key} === ${p}`));
        } else {
          definedProp = codegen_1.nil;
        }
        if (patProps.length) {
          definedProp = (0, codegen_1.or)(definedProp, ...patProps.map((p) => (0, codegen_1._)`${(0, code_1.usePattern)(cxt, p)}.test(${key})`));
        }
        return (0, codegen_1.not)(definedProp);
      }
      function deleteAdditional(key) {
        gen.code((0, codegen_1._)`delete ${data}[${key}]`);
      }
      function additionalPropertyCode(key) {
        if (opts.removeAdditional === "all" || opts.removeAdditional && schema === false) {
          deleteAdditional(key);
          return;
        }
        if (schema === false) {
          cxt.setParams({ additionalProperty: key });
          cxt.error();
          if (!allErrors)
            gen.break();
          return;
        }
        if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
          const valid = gen.name("valid");
          if (opts.removeAdditional === "failing") {
            applyAdditionalSchema(key, valid, false);
            gen.if((0, codegen_1.not)(valid), () => {
              cxt.reset();
              deleteAdditional(key);
            });
          } else {
            applyAdditionalSchema(key, valid);
            if (!allErrors)
              gen.if((0, codegen_1.not)(valid), () => gen.break());
          }
        }
      }
      function applyAdditionalSchema(key, valid, errors4) {
        const subschema = {
          keyword: "additionalProperties",
          dataProp: key,
          dataPropType: util_1.Type.Str
        };
        if (errors4 === false) {
          Object.assign(subschema, {
            compositeRule: true,
            createErrors: false,
            allErrors: false
          });
        }
        cxt.subschema(subschema, valid);
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/properties.js
var require_properties = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var validate_1 = require_validate();
  var code_1 = require_code2();
  var util_1 = require_util();
  var additionalProperties_1 = require_additionalProperties();
  var def = {
    keyword: "properties",
    type: "object",
    schemaType: "object",
    code(cxt) {
      const { gen, schema, parentSchema, data, it } = cxt;
      if (it.opts.removeAdditional === "all" && parentSchema.additionalProperties === undefined) {
        additionalProperties_1.default.code(new validate_1.KeywordCxt(it, additionalProperties_1.default, "additionalProperties"));
      }
      const allProps = (0, code_1.allSchemaProperties)(schema);
      for (const prop of allProps) {
        it.definedProperties.add(prop);
      }
      if (it.opts.unevaluated && allProps.length && it.props !== true) {
        it.props = util_1.mergeEvaluated.props(gen, (0, util_1.toHash)(allProps), it.props);
      }
      const properties = allProps.filter((p) => !(0, util_1.alwaysValidSchema)(it, schema[p]));
      if (properties.length === 0)
        return;
      const valid = gen.name("valid");
      for (const prop of properties) {
        if (hasDefault(prop)) {
          applyPropertySchema(prop);
        } else {
          gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties));
          applyPropertySchema(prop);
          if (!it.allErrors)
            gen.else().var(valid, true);
          gen.endIf();
        }
        cxt.it.definedProperties.add(prop);
        cxt.ok(valid);
      }
      function hasDefault(prop) {
        return it.opts.useDefaults && !it.compositeRule && schema[prop].default !== undefined;
      }
      function applyPropertySchema(prop) {
        cxt.subschema({
          keyword: "properties",
          schemaProp: prop,
          dataProp: prop
        }, valid);
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/patternProperties.js
var require_patternProperties = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var util_2 = require_util();
  var def = {
    keyword: "patternProperties",
    type: "object",
    schemaType: "object",
    code(cxt) {
      const { gen, schema, data, parentSchema, it } = cxt;
      const { opts } = it;
      const patterns = (0, code_1.allSchemaProperties)(schema);
      const alwaysValidPatterns = patterns.filter((p) => (0, util_1.alwaysValidSchema)(it, schema[p]));
      if (patterns.length === 0 || alwaysValidPatterns.length === patterns.length && (!it.opts.unevaluated || it.props === true)) {
        return;
      }
      const checkProperties = opts.strictSchema && !opts.allowMatchingProperties && parentSchema.properties;
      const valid = gen.name("valid");
      if (it.props !== true && !(it.props instanceof codegen_1.Name)) {
        it.props = (0, util_2.evaluatedPropsToName)(gen, it.props);
      }
      const { props } = it;
      validatePatternProperties();
      function validatePatternProperties() {
        for (const pat of patterns) {
          if (checkProperties)
            checkMatchingProperties(pat);
          if (it.allErrors) {
            validateProperties(pat);
          } else {
            gen.var(valid, true);
            validateProperties(pat);
            gen.if(valid);
          }
        }
      }
      function checkMatchingProperties(pat) {
        for (const prop in checkProperties) {
          if (new RegExp(pat).test(prop)) {
            (0, util_1.checkStrictMode)(it, `property ${prop} matches pattern ${pat} (use allowMatchingProperties)`);
          }
        }
      }
      function validateProperties(pat) {
        gen.forIn("key", data, (key) => {
          gen.if((0, codegen_1._)`${(0, code_1.usePattern)(cxt, pat)}.test(${key})`, () => {
            const alwaysValid = alwaysValidPatterns.includes(pat);
            if (!alwaysValid) {
              cxt.subschema({
                keyword: "patternProperties",
                schemaProp: pat,
                dataProp: key,
                dataPropType: util_2.Type.Str
              }, valid);
            }
            if (it.opts.unevaluated && props !== true) {
              gen.assign((0, codegen_1._)`${props}[${key}]`, true);
            } else if (!alwaysValid && !it.allErrors) {
              gen.if((0, codegen_1.not)(valid), () => gen.break());
            }
          });
        });
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/not.js
var require_not = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var util_1 = require_util();
  var def = {
    keyword: "not",
    schemaType: ["object", "boolean"],
    trackErrors: true,
    code(cxt) {
      const { gen, schema, it } = cxt;
      if ((0, util_1.alwaysValidSchema)(it, schema)) {
        cxt.fail();
        return;
      }
      const valid = gen.name("valid");
      cxt.subschema({
        keyword: "not",
        compositeRule: true,
        createErrors: false,
        allErrors: false
      }, valid);
      cxt.failResult(valid, () => cxt.reset(), () => cxt.error());
    },
    error: { message: "must NOT be valid" }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/anyOf.js
var require_anyOf = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var code_1 = require_code2();
  var def = {
    keyword: "anyOf",
    schemaType: "array",
    trackErrors: true,
    code: code_1.validateUnion,
    error: { message: "must match a schema in anyOf" }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/oneOf.js
var require_oneOf = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error2 = {
    message: "must match exactly one schema in oneOf",
    params: ({ params }) => (0, codegen_1._)`{passingSchemas: ${params.passing}}`
  };
  var def = {
    keyword: "oneOf",
    schemaType: "array",
    trackErrors: true,
    error: error2,
    code(cxt) {
      const { gen, schema, parentSchema, it } = cxt;
      if (!Array.isArray(schema))
        throw new Error("ajv implementation error");
      if (it.opts.discriminator && parentSchema.discriminator)
        return;
      const schArr = schema;
      const valid = gen.let("valid", false);
      const passing = gen.let("passing", null);
      const schValid = gen.name("_valid");
      cxt.setParams({ passing });
      gen.block(validateOneOf);
      cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
      function validateOneOf() {
        schArr.forEach((sch, i) => {
          let schCxt;
          if ((0, util_1.alwaysValidSchema)(it, sch)) {
            gen.var(schValid, true);
          } else {
            schCxt = cxt.subschema({
              keyword: "oneOf",
              schemaProp: i,
              compositeRule: true
            }, schValid);
          }
          if (i > 0) {
            gen.if((0, codegen_1._)`${schValid} && ${valid}`).assign(valid, false).assign(passing, (0, codegen_1._)`[${passing}, ${i}]`).else();
          }
          gen.if(schValid, () => {
            gen.assign(valid, true);
            gen.assign(passing, i);
            if (schCxt)
              cxt.mergeEvaluated(schCxt, codegen_1.Name);
          });
        });
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/allOf.js
var require_allOf = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var util_1 = require_util();
  var def = {
    keyword: "allOf",
    schemaType: "array",
    code(cxt) {
      const { gen, schema, it } = cxt;
      if (!Array.isArray(schema))
        throw new Error("ajv implementation error");
      const valid = gen.name("valid");
      schema.forEach((sch, i) => {
        if ((0, util_1.alwaysValidSchema)(it, sch))
          return;
        const schCxt = cxt.subschema({ keyword: "allOf", schemaProp: i }, valid);
        cxt.ok(valid);
        cxt.mergeEvaluated(schCxt);
      });
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/if.js
var require_if = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var util_1 = require_util();
  var error2 = {
    message: ({ params }) => (0, codegen_1.str)`must match "${params.ifClause}" schema`,
    params: ({ params }) => (0, codegen_1._)`{failingKeyword: ${params.ifClause}}`
  };
  var def = {
    keyword: "if",
    schemaType: ["object", "boolean"],
    trackErrors: true,
    error: error2,
    code(cxt) {
      const { gen, parentSchema, it } = cxt;
      if (parentSchema.then === undefined && parentSchema.else === undefined) {
        (0, util_1.checkStrictMode)(it, '"if" without "then" and "else" is ignored');
      }
      const hasThen = hasSchema(it, "then");
      const hasElse = hasSchema(it, "else");
      if (!hasThen && !hasElse)
        return;
      const valid = gen.let("valid", true);
      const schValid = gen.name("_valid");
      validateIf();
      cxt.reset();
      if (hasThen && hasElse) {
        const ifClause = gen.let("ifClause");
        cxt.setParams({ ifClause });
        gen.if(schValid, validateClause("then", ifClause), validateClause("else", ifClause));
      } else if (hasThen) {
        gen.if(schValid, validateClause("then"));
      } else {
        gen.if((0, codegen_1.not)(schValid), validateClause("else"));
      }
      cxt.pass(valid, () => cxt.error(true));
      function validateIf() {
        const schCxt = cxt.subschema({
          keyword: "if",
          compositeRule: true,
          createErrors: false,
          allErrors: false
        }, schValid);
        cxt.mergeEvaluated(schCxt);
      }
      function validateClause(keyword, ifClause) {
        return () => {
          const schCxt = cxt.subschema({ keyword }, schValid);
          gen.assign(valid, schValid);
          cxt.mergeValidEvaluated(schCxt, valid);
          if (ifClause)
            gen.assign(ifClause, (0, codegen_1._)`${keyword}`);
          else
            cxt.setParams({ ifClause: keyword });
        };
      }
    }
  };
  function hasSchema(it, keyword) {
    const schema = it.schema[keyword];
    return schema !== undefined && !(0, util_1.alwaysValidSchema)(it, schema);
  }
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/thenElse.js
var require_thenElse = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var util_1 = require_util();
  var def = {
    keyword: ["then", "else"],
    schemaType: ["object", "boolean"],
    code({ keyword, parentSchema, it }) {
      if (parentSchema.if === undefined)
        (0, util_1.checkStrictMode)(it, `"${keyword}" without "if" is ignored`);
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/applicator/index.js
var require_applicator = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var additionalItems_1 = require_additionalItems();
  var prefixItems_1 = require_prefixItems();
  var items_1 = require_items();
  var items2020_1 = require_items2020();
  var contains_1 = require_contains();
  var dependencies_1 = require_dependencies();
  var propertyNames_1 = require_propertyNames();
  var additionalProperties_1 = require_additionalProperties();
  var properties_1 = require_properties();
  var patternProperties_1 = require_patternProperties();
  var not_1 = require_not();
  var anyOf_1 = require_anyOf();
  var oneOf_1 = require_oneOf();
  var allOf_1 = require_allOf();
  var if_1 = require_if();
  var thenElse_1 = require_thenElse();
  function getApplicator(draft2020 = false) {
    const applicator = [
      not_1.default,
      anyOf_1.default,
      oneOf_1.default,
      allOf_1.default,
      if_1.default,
      thenElse_1.default,
      propertyNames_1.default,
      additionalProperties_1.default,
      dependencies_1.default,
      properties_1.default,
      patternProperties_1.default
    ];
    if (draft2020)
      applicator.push(prefixItems_1.default, items2020_1.default);
    else
      applicator.push(additionalItems_1.default, items_1.default);
    applicator.push(contains_1.default);
    return applicator;
  }
  exports.default = getApplicator;
});

// node_modules/ajv/dist/vocabularies/format/format.js
var require_format = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var error2 = {
    message: ({ schemaCode }) => (0, codegen_1.str)`must match format "${schemaCode}"`,
    params: ({ schemaCode }) => (0, codegen_1._)`{format: ${schemaCode}}`
  };
  var def = {
    keyword: "format",
    type: ["number", "string"],
    schemaType: "string",
    $data: true,
    error: error2,
    code(cxt, ruleType) {
      const { gen, data, $data, schema, schemaCode, it } = cxt;
      const { opts, errSchemaPath, schemaEnv, self: self2 } = it;
      if (!opts.validateFormats)
        return;
      if ($data)
        validate$DataFormat();
      else
        validateFormat();
      function validate$DataFormat() {
        const fmts = gen.scopeValue("formats", {
          ref: self2.formats,
          code: opts.code.formats
        });
        const fDef = gen.const("fDef", (0, codegen_1._)`${fmts}[${schemaCode}]`);
        const fType = gen.let("fType");
        const format = gen.let("format");
        gen.if((0, codegen_1._)`typeof ${fDef} == "object" && !(${fDef} instanceof RegExp)`, () => gen.assign(fType, (0, codegen_1._)`${fDef}.type || "string"`).assign(format, (0, codegen_1._)`${fDef}.validate`), () => gen.assign(fType, (0, codegen_1._)`"string"`).assign(format, fDef));
        cxt.fail$data((0, codegen_1.or)(unknownFmt(), invalidFmt()));
        function unknownFmt() {
          if (opts.strictSchema === false)
            return codegen_1.nil;
          return (0, codegen_1._)`${schemaCode} && !${format}`;
        }
        function invalidFmt() {
          const callFormat = schemaEnv.$async ? (0, codegen_1._)`(${fDef}.async ? await ${format}(${data}) : ${format}(${data}))` : (0, codegen_1._)`${format}(${data})`;
          const validData = (0, codegen_1._)`(typeof ${format} == "function" ? ${callFormat} : ${format}.test(${data}))`;
          return (0, codegen_1._)`${format} && ${format} !== true && ${fType} === ${ruleType} && !${validData}`;
        }
      }
      function validateFormat() {
        const formatDef = self2.formats[schema];
        if (!formatDef) {
          unknownFormat();
          return;
        }
        if (formatDef === true)
          return;
        const [fmtType, format, fmtRef] = getFormat(formatDef);
        if (fmtType === ruleType)
          cxt.pass(validCondition());
        function unknownFormat() {
          if (opts.strictSchema === false) {
            self2.logger.warn(unknownMsg());
            return;
          }
          throw new Error(unknownMsg());
          function unknownMsg() {
            return `unknown format "${schema}" ignored in schema at path "${errSchemaPath}"`;
          }
        }
        function getFormat(fmtDef) {
          const code = fmtDef instanceof RegExp ? (0, codegen_1.regexpCode)(fmtDef) : opts.code.formats ? (0, codegen_1._)`${opts.code.formats}${(0, codegen_1.getProperty)(schema)}` : undefined;
          const fmt = gen.scopeValue("formats", { key: schema, ref: fmtDef, code });
          if (typeof fmtDef == "object" && !(fmtDef instanceof RegExp)) {
            return [fmtDef.type || "string", fmtDef.validate, (0, codegen_1._)`${fmt}.validate`];
          }
          return ["string", fmtDef, fmt];
        }
        function validCondition() {
          if (typeof formatDef == "object" && !(formatDef instanceof RegExp) && formatDef.async) {
            if (!schemaEnv.$async)
              throw new Error("async format in sync schema");
            return (0, codegen_1._)`await ${fmtRef}(${data})`;
          }
          return typeof format == "function" ? (0, codegen_1._)`${fmtRef}(${data})` : (0, codegen_1._)`${fmtRef}.test(${data})`;
        }
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/vocabularies/format/index.js
var require_format2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var format_1 = require_format();
  var format = [format_1.default];
  exports.default = format;
});

// node_modules/ajv/dist/vocabularies/metadata.js
var require_metadata = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.contentVocabulary = exports.metadataVocabulary = undefined;
  exports.metadataVocabulary = [
    "title",
    "description",
    "default",
    "deprecated",
    "readOnly",
    "writeOnly",
    "examples"
  ];
  exports.contentVocabulary = [
    "contentMediaType",
    "contentEncoding",
    "contentSchema"
  ];
});

// node_modules/ajv/dist/vocabularies/draft7.js
var require_draft7 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var core_1 = require_core2();
  var validation_1 = require_validation();
  var applicator_1 = require_applicator();
  var format_1 = require_format2();
  var metadata_1 = require_metadata();
  var draft7Vocabularies = [
    core_1.default,
    validation_1.default,
    (0, applicator_1.default)(),
    format_1.default,
    metadata_1.metadataVocabulary,
    metadata_1.contentVocabulary
  ];
  exports.default = draft7Vocabularies;
});

// node_modules/ajv/dist/vocabularies/discriminator/types.js
var require_types = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.DiscrError = undefined;
  var DiscrError;
  (function(DiscrError2) {
    DiscrError2["Tag"] = "tag";
    DiscrError2["Mapping"] = "mapping";
  })(DiscrError || (exports.DiscrError = DiscrError = {}));
});

// node_modules/ajv/dist/vocabularies/discriminator/index.js
var require_discriminator = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var codegen_1 = require_codegen();
  var types_1 = require_types();
  var compile_1 = require_compile();
  var ref_error_1 = require_ref_error();
  var util_1 = require_util();
  var error2 = {
    message: ({ params: { discrError, tagName } }) => discrError === types_1.DiscrError.Tag ? `tag "${tagName}" must be string` : `value of tag "${tagName}" must be in oneOf`,
    params: ({ params: { discrError, tag, tagName } }) => (0, codegen_1._)`{error: ${discrError}, tag: ${tagName}, tagValue: ${tag}}`
  };
  var def = {
    keyword: "discriminator",
    type: "object",
    schemaType: "object",
    error: error2,
    code(cxt) {
      const { gen, data, schema, parentSchema, it } = cxt;
      const { oneOf } = parentSchema;
      if (!it.opts.discriminator) {
        throw new Error("discriminator: requires discriminator option");
      }
      const tagName = schema.propertyName;
      if (typeof tagName != "string")
        throw new Error("discriminator: requires propertyName");
      if (schema.mapping)
        throw new Error("discriminator: mapping is not supported");
      if (!oneOf)
        throw new Error("discriminator: requires oneOf keyword");
      const valid = gen.let("valid", false);
      const tag = gen.const("tag", (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(tagName)}`);
      gen.if((0, codegen_1._)`typeof ${tag} == "string"`, () => validateMapping(), () => cxt.error(false, { discrError: types_1.DiscrError.Tag, tag, tagName }));
      cxt.ok(valid);
      function validateMapping() {
        const mapping = getMapping();
        gen.if(false);
        for (const tagValue in mapping) {
          gen.elseIf((0, codegen_1._)`${tag} === ${tagValue}`);
          gen.assign(valid, applyTagSchema(mapping[tagValue]));
        }
        gen.else();
        cxt.error(false, { discrError: types_1.DiscrError.Mapping, tag, tagName });
        gen.endIf();
      }
      function applyTagSchema(schemaProp) {
        const _valid = gen.name("valid");
        const schCxt = cxt.subschema({ keyword: "oneOf", schemaProp }, _valid);
        cxt.mergeEvaluated(schCxt, codegen_1.Name);
        return _valid;
      }
      function getMapping() {
        var _a;
        const oneOfMapping = {};
        const topRequired = hasRequired(parentSchema);
        let tagRequired = true;
        for (let i = 0;i < oneOf.length; i++) {
          let sch = oneOf[i];
          if ((sch === null || sch === undefined ? undefined : sch.$ref) && !(0, util_1.schemaHasRulesButRef)(sch, it.self.RULES)) {
            const ref = sch.$ref;
            sch = compile_1.resolveRef.call(it.self, it.schemaEnv.root, it.baseId, ref);
            if (sch instanceof compile_1.SchemaEnv)
              sch = sch.schema;
            if (sch === undefined)
              throw new ref_error_1.default(it.opts.uriResolver, it.baseId, ref);
          }
          const propSch = (_a = sch === null || sch === undefined ? undefined : sch.properties) === null || _a === undefined ? undefined : _a[tagName];
          if (typeof propSch != "object") {
            throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${tagName}"`);
          }
          tagRequired = tagRequired && (topRequired || hasRequired(sch));
          addMappings(propSch, i);
        }
        if (!tagRequired)
          throw new Error(`discriminator: "${tagName}" must be required`);
        return oneOfMapping;
        function hasRequired({ required: required2 }) {
          return Array.isArray(required2) && required2.includes(tagName);
        }
        function addMappings(sch, i) {
          if (sch.const) {
            addMapping(sch.const, i);
          } else if (sch.enum) {
            for (const tagValue of sch.enum) {
              addMapping(tagValue, i);
            }
          } else {
            throw new Error(`discriminator: "properties/${tagName}" must have "const" or "enum"`);
          }
        }
        function addMapping(tagValue, i) {
          if (typeof tagValue != "string" || tagValue in oneOfMapping) {
            throw new Error(`discriminator: "${tagName}" values must be unique strings`);
          }
          oneOfMapping[tagValue] = i;
        }
      }
    }
  };
  exports.default = def;
});

// node_modules/ajv/dist/refs/json-schema-draft-07.json
var require_json_schema_draft_07 = __commonJS((exports, module) => {
  module.exports = {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "http://json-schema.org/draft-07/schema#",
    title: "Core schema meta-schema",
    definitions: {
      schemaArray: {
        type: "array",
        minItems: 1,
        items: { $ref: "#" }
      },
      nonNegativeInteger: {
        type: "integer",
        minimum: 0
      },
      nonNegativeIntegerDefault0: {
        allOf: [{ $ref: "#/definitions/nonNegativeInteger" }, { default: 0 }]
      },
      simpleTypes: {
        enum: ["array", "boolean", "integer", "null", "number", "object", "string"]
      },
      stringArray: {
        type: "array",
        items: { type: "string" },
        uniqueItems: true,
        default: []
      }
    },
    type: ["object", "boolean"],
    properties: {
      $id: {
        type: "string",
        format: "uri-reference"
      },
      $schema: {
        type: "string",
        format: "uri"
      },
      $ref: {
        type: "string",
        format: "uri-reference"
      },
      $comment: {
        type: "string"
      },
      title: {
        type: "string"
      },
      description: {
        type: "string"
      },
      default: true,
      readOnly: {
        type: "boolean",
        default: false
      },
      examples: {
        type: "array",
        items: true
      },
      multipleOf: {
        type: "number",
        exclusiveMinimum: 0
      },
      maximum: {
        type: "number"
      },
      exclusiveMaximum: {
        type: "number"
      },
      minimum: {
        type: "number"
      },
      exclusiveMinimum: {
        type: "number"
      },
      maxLength: { $ref: "#/definitions/nonNegativeInteger" },
      minLength: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
      pattern: {
        type: "string",
        format: "regex"
      },
      additionalItems: { $ref: "#" },
      items: {
        anyOf: [{ $ref: "#" }, { $ref: "#/definitions/schemaArray" }],
        default: true
      },
      maxItems: { $ref: "#/definitions/nonNegativeInteger" },
      minItems: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
      uniqueItems: {
        type: "boolean",
        default: false
      },
      contains: { $ref: "#" },
      maxProperties: { $ref: "#/definitions/nonNegativeInteger" },
      minProperties: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
      required: { $ref: "#/definitions/stringArray" },
      additionalProperties: { $ref: "#" },
      definitions: {
        type: "object",
        additionalProperties: { $ref: "#" },
        default: {}
      },
      properties: {
        type: "object",
        additionalProperties: { $ref: "#" },
        default: {}
      },
      patternProperties: {
        type: "object",
        additionalProperties: { $ref: "#" },
        propertyNames: { format: "regex" },
        default: {}
      },
      dependencies: {
        type: "object",
        additionalProperties: {
          anyOf: [{ $ref: "#" }, { $ref: "#/definitions/stringArray" }]
        }
      },
      propertyNames: { $ref: "#" },
      const: true,
      enum: {
        type: "array",
        items: true,
        minItems: 1,
        uniqueItems: true
      },
      type: {
        anyOf: [
          { $ref: "#/definitions/simpleTypes" },
          {
            type: "array",
            items: { $ref: "#/definitions/simpleTypes" },
            minItems: 1,
            uniqueItems: true
          }
        ]
      },
      format: { type: "string" },
      contentMediaType: { type: "string" },
      contentEncoding: { type: "string" },
      if: { $ref: "#" },
      then: { $ref: "#" },
      else: { $ref: "#" },
      allOf: { $ref: "#/definitions/schemaArray" },
      anyOf: { $ref: "#/definitions/schemaArray" },
      oneOf: { $ref: "#/definitions/schemaArray" },
      not: { $ref: "#" }
    },
    default: true
  };
});

// node_modules/ajv/dist/ajv.js
var require_ajv = __commonJS((exports, module) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.MissingRefError = exports.ValidationError = exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = exports.Ajv = undefined;
  var core_1 = require_core();
  var draft7_1 = require_draft7();
  var discriminator_1 = require_discriminator();
  var draft7MetaSchema = require_json_schema_draft_07();
  var META_SUPPORT_DATA = ["/properties"];
  var META_SCHEMA_ID = "http://json-schema.org/draft-07/schema";

  class Ajv extends core_1.default {
    _addVocabularies() {
      super._addVocabularies();
      draft7_1.default.forEach((v) => this.addVocabulary(v));
      if (this.opts.discriminator)
        this.addKeyword(discriminator_1.default);
    }
    _addDefaultMetaSchema() {
      super._addDefaultMetaSchema();
      if (!this.opts.meta)
        return;
      const metaSchema = this.opts.$data ? this.$dataMetaSchema(draft7MetaSchema, META_SUPPORT_DATA) : draft7MetaSchema;
      this.addMetaSchema(metaSchema, META_SCHEMA_ID, false);
      this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
    }
    defaultMeta() {
      return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : undefined);
    }
  }
  exports.Ajv = Ajv;
  module.exports = exports = Ajv;
  module.exports.Ajv = Ajv;
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.default = Ajv;
  var validate_1 = require_validate();
  Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function() {
    return validate_1.KeywordCxt;
  } });
  var codegen_1 = require_codegen();
  Object.defineProperty(exports, "_", { enumerable: true, get: function() {
    return codegen_1._;
  } });
  Object.defineProperty(exports, "str", { enumerable: true, get: function() {
    return codegen_1.str;
  } });
  Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
    return codegen_1.stringify;
  } });
  Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
    return codegen_1.nil;
  } });
  Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
    return codegen_1.Name;
  } });
  Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function() {
    return codegen_1.CodeGen;
  } });
  var validation_error_1 = require_validation_error();
  Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function() {
    return validation_error_1.default;
  } });
  var ref_error_1 = require_ref_error();
  Object.defineProperty(exports, "MissingRefError", { enumerable: true, get: function() {
    return ref_error_1.default;
  } });
});

// node_modules/ajv-formats/dist/formats.js
var require_formats = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.formatNames = exports.fastFormats = exports.fullFormats = undefined;
  function fmtDef(validate, compare) {
    return { validate, compare };
  }
  exports.fullFormats = {
    date: fmtDef(date4, compareDate),
    time: fmtDef(getTime(true), compareTime),
    "date-time": fmtDef(getDateTime(true), compareDateTime),
    "iso-time": fmtDef(getTime(), compareIsoTime),
    "iso-date-time": fmtDef(getDateTime(), compareIsoDateTime),
    duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
    uri,
    "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
    "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
    url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
    email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
    hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
    ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
    ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
    regex,
    uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
    "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
    "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
    "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
    byte,
    int32: { type: "number", validate: validateInt32 },
    int64: { type: "number", validate: validateInt64 },
    float: { type: "number", validate: validateNumber },
    double: { type: "number", validate: validateNumber },
    password: true,
    binary: true
  };
  exports.fastFormats = {
    ...exports.fullFormats,
    date: fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, compareDate),
    time: fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareTime),
    "date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareDateTime),
    "iso-time": fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareIsoTime),
    "iso-date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareIsoDateTime),
    uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
    "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
    email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i
  };
  exports.formatNames = Object.keys(exports.fullFormats);
  function isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  }
  var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
  var DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  function date4(str) {
    const matches = DATE.exec(str);
    if (!matches)
      return false;
    const year = +matches[1];
    const month = +matches[2];
    const day = +matches[3];
    return month >= 1 && month <= 12 && day >= 1 && day <= (month === 2 && isLeapYear(year) ? 29 : DAYS[month]);
  }
  function compareDate(d1, d2) {
    if (!(d1 && d2))
      return;
    if (d1 > d2)
      return 1;
    if (d1 < d2)
      return -1;
    return 0;
  }
  var TIME = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
  function getTime(strictTimeZone) {
    return function time3(str) {
      const matches = TIME.exec(str);
      if (!matches)
        return false;
      const hr = +matches[1];
      const min = +matches[2];
      const sec = +matches[3];
      const tz = matches[4];
      const tzSign = matches[5] === "-" ? -1 : 1;
      const tzH = +(matches[6] || 0);
      const tzM = +(matches[7] || 0);
      if (tzH > 23 || tzM > 59 || strictTimeZone && !tz)
        return false;
      if (hr <= 23 && min <= 59 && sec < 60)
        return true;
      const utcMin = min - tzM * tzSign;
      const utcHr = hr - tzH * tzSign - (utcMin < 0 ? 1 : 0);
      return (utcHr === 23 || utcHr === -1) && (utcMin === 59 || utcMin === -1) && sec < 61;
    };
  }
  function compareTime(s1, s2) {
    if (!(s1 && s2))
      return;
    const t1 = new Date("2020-01-01T" + s1).valueOf();
    const t2 = new Date("2020-01-01T" + s2).valueOf();
    if (!(t1 && t2))
      return;
    return t1 - t2;
  }
  function compareIsoTime(t1, t2) {
    if (!(t1 && t2))
      return;
    const a1 = TIME.exec(t1);
    const a2 = TIME.exec(t2);
    if (!(a1 && a2))
      return;
    t1 = a1[1] + a1[2] + a1[3];
    t2 = a2[1] + a2[2] + a2[3];
    if (t1 > t2)
      return 1;
    if (t1 < t2)
      return -1;
    return 0;
  }
  var DATE_TIME_SEPARATOR = /t|\s/i;
  function getDateTime(strictTimeZone) {
    const time3 = getTime(strictTimeZone);
    return function date_time(str) {
      const dateTime = str.split(DATE_TIME_SEPARATOR);
      return dateTime.length === 2 && date4(dateTime[0]) && time3(dateTime[1]);
    };
  }
  function compareDateTime(dt1, dt2) {
    if (!(dt1 && dt2))
      return;
    const d1 = new Date(dt1).valueOf();
    const d2 = new Date(dt2).valueOf();
    if (!(d1 && d2))
      return;
    return d1 - d2;
  }
  function compareIsoDateTime(dt1, dt2) {
    if (!(dt1 && dt2))
      return;
    const [d1, t1] = dt1.split(DATE_TIME_SEPARATOR);
    const [d2, t2] = dt2.split(DATE_TIME_SEPARATOR);
    const res = compareDate(d1, d2);
    if (res === undefined)
      return;
    return res || compareTime(t1, t2);
  }
  var NOT_URI_FRAGMENT = /\/|:/;
  var URI = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
  function uri(str) {
    return NOT_URI_FRAGMENT.test(str) && URI.test(str);
  }
  var BYTE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
  function byte(str) {
    BYTE.lastIndex = 0;
    return BYTE.test(str);
  }
  var MIN_INT32 = -(2 ** 31);
  var MAX_INT32 = 2 ** 31 - 1;
  function validateInt32(value) {
    return Number.isInteger(value) && value <= MAX_INT32 && value >= MIN_INT32;
  }
  function validateInt64(value) {
    return Number.isInteger(value);
  }
  function validateNumber() {
    return true;
  }
  var Z_ANCHOR = /[^\\]\\Z/;
  function regex(str) {
    if (Z_ANCHOR.test(str))
      return false;
    try {
      new RegExp(str);
      return true;
    } catch (e) {
      return false;
    }
  }
});

// node_modules/ajv-formats/dist/limit.js
var require_limit = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.formatLimitDefinition = undefined;
  var ajv_1 = require_ajv();
  var codegen_1 = require_codegen();
  var ops = codegen_1.operators;
  var KWDs = {
    formatMaximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
    formatMinimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
    formatExclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
    formatExclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE }
  };
  var error2 = {
    message: ({ keyword, schemaCode }) => (0, codegen_1.str)`should be ${KWDs[keyword].okStr} ${schemaCode}`,
    params: ({ keyword, schemaCode }) => (0, codegen_1._)`{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`
  };
  exports.formatLimitDefinition = {
    keyword: Object.keys(KWDs),
    type: "string",
    schemaType: "string",
    $data: true,
    error: error2,
    code(cxt) {
      const { gen, data, schemaCode, keyword, it } = cxt;
      const { opts, self: self2 } = it;
      if (!opts.validateFormats)
        return;
      const fCxt = new ajv_1.KeywordCxt(it, self2.RULES.all.format.definition, "format");
      if (fCxt.$data)
        validate$DataFormat();
      else
        validateFormat();
      function validate$DataFormat() {
        const fmts = gen.scopeValue("formats", {
          ref: self2.formats,
          code: opts.code.formats
        });
        const fmt = gen.const("fmt", (0, codegen_1._)`${fmts}[${fCxt.schemaCode}]`);
        cxt.fail$data((0, codegen_1.or)((0, codegen_1._)`typeof ${fmt} != "object"`, (0, codegen_1._)`${fmt} instanceof RegExp`, (0, codegen_1._)`typeof ${fmt}.compare != "function"`, compareCode(fmt)));
      }
      function validateFormat() {
        const format = fCxt.schema;
        const fmtDef = self2.formats[format];
        if (!fmtDef || fmtDef === true)
          return;
        if (typeof fmtDef != "object" || fmtDef instanceof RegExp || typeof fmtDef.compare != "function") {
          throw new Error(`"${keyword}": format "${format}" does not define "compare" function`);
        }
        const fmt = gen.scopeValue("formats", {
          key: format,
          ref: fmtDef,
          code: opts.code.formats ? (0, codegen_1._)`${opts.code.formats}${(0, codegen_1.getProperty)(format)}` : undefined
        });
        cxt.fail$data(compareCode(fmt));
      }
      function compareCode(fmt) {
        return (0, codegen_1._)`${fmt}.compare(${data}, ${schemaCode}) ${KWDs[keyword].fail} 0`;
      }
    },
    dependencies: ["format"]
  };
  var formatLimitPlugin = (ajv) => {
    ajv.addKeyword(exports.formatLimitDefinition);
    return ajv;
  };
  exports.default = formatLimitPlugin;
});

// node_modules/ajv-formats/dist/index.js
var require_dist = __commonJS((exports, module) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var formats_1 = require_formats();
  var limit_1 = require_limit();
  var codegen_1 = require_codegen();
  var fullName = new codegen_1.Name("fullFormats");
  var fastName = new codegen_1.Name("fastFormats");
  var formatsPlugin = (ajv, opts = { keywords: true }) => {
    if (Array.isArray(opts)) {
      addFormats(ajv, opts, formats_1.fullFormats, fullName);
      return ajv;
    }
    const [formats, exportName] = opts.mode === "fast" ? [formats_1.fastFormats, fastName] : [formats_1.fullFormats, fullName];
    const list = opts.formats || formats_1.formatNames;
    addFormats(ajv, list, formats, exportName);
    if (opts.keywords)
      (0, limit_1.default)(ajv);
    return ajv;
  };
  formatsPlugin.get = (name, mode = "full") => {
    const formats = mode === "fast" ? formats_1.fastFormats : formats_1.fullFormats;
    const f = formats[name];
    if (!f)
      throw new Error(`Unknown format "${name}"`);
    return f;
  };
  function addFormats(ajv, list, fs, exportName) {
    var _a;
    var _b;
    (_a = (_b = ajv.opts.code).formats) !== null && _a !== undefined || (_b.formats = (0, codegen_1._)`require("ajv-formats/dist/formats").${exportName}`);
    for (const f of list)
      ajv.addFormat(f, fs[f]);
  }
  module.exports = exports = formatsPlugin;
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.default = formatsPlugin;
});

// node_modules/@clickhouse/client-common/dist/logger.js
var require_logger = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ClickHouseLogLevel = exports.LogWriter = exports.DefaultLogger = undefined;

  class DefaultLogger {
    trace({ module: module2, message, args }) {
      const params = [
        formatMessage({ module: module2, message, level: "TRACE" })
      ];
      if (args) {
        params.push(`
Arguments:`, args);
      }
      console.debug(...params);
    }
    debug({ module: module2, message, args }) {
      const params = [
        formatMessage({ module: module2, message, level: "DEBUG" })
      ];
      if (args) {
        params.push(`
Arguments:`, args);
      }
      console.debug(...params);
    }
    info({ module: module2, message, args }) {
      const params = [
        formatMessage({ module: module2, message, level: "INFO" })
      ];
      if (args) {
        params.push(`
Arguments:`, args);
      }
      console.info(...params);
    }
    warn({ module: module2, message, args, err }) {
      const params = [
        formatMessage({ module: module2, message, level: "WARN" })
      ];
      if (args) {
        params.push(`
Arguments:`, args);
      }
      if (err) {
        params.push(`
Caused by:`, err);
      }
      console.warn(...params);
    }
    error({ module: module2, message, args, err }) {
      const params = [
        formatMessage({ module: module2, message, level: "ERROR" })
      ];
      if (args) {
        params.push(`
Arguments:`, args);
      }
      params.push(`
Caused by:`, err);
      console.error(...params);
    }
  }
  exports.DefaultLogger = DefaultLogger;

  class LogWriter {
    logger;
    module;
    logLevel;
    constructor(logger, module2, logLevel) {
      this.logger = logger;
      this.module = module2;
      this.logLevel = logLevel;
      this.info({
        message: `Log level is set to ${ClickHouseLogLevel[this.logLevel]}`
      });
    }
    trace(params) {
      if (this.logLevel <= ClickHouseLogLevel.TRACE) {
        this.logger.trace({
          ...params,
          module: params.module ?? this.module
        });
      }
    }
    debug(params) {
      if (this.logLevel <= ClickHouseLogLevel.DEBUG) {
        this.logger.debug({
          ...params,
          module: params.module ?? this.module
        });
      }
    }
    info(params) {
      if (this.logLevel <= ClickHouseLogLevel.INFO) {
        this.logger.info({
          ...params,
          module: params.module ?? this.module
        });
      }
    }
    warn(params) {
      if (this.logLevel <= ClickHouseLogLevel.WARN) {
        this.logger.warn({
          ...params,
          module: params.module ?? this.module
        });
      }
    }
    error(params) {
      if (this.logLevel <= ClickHouseLogLevel.ERROR) {
        this.logger.error({
          ...params,
          module: params.module ?? this.module
        });
      }
    }
  }
  exports.LogWriter = LogWriter;
  var ClickHouseLogLevel;
  (function(ClickHouseLogLevel2) {
    ClickHouseLogLevel2[ClickHouseLogLevel2["TRACE"] = 0] = "TRACE";
    ClickHouseLogLevel2[ClickHouseLogLevel2["DEBUG"] = 1] = "DEBUG";
    ClickHouseLogLevel2[ClickHouseLogLevel2["INFO"] = 2] = "INFO";
    ClickHouseLogLevel2[ClickHouseLogLevel2["WARN"] = 3] = "WARN";
    ClickHouseLogLevel2[ClickHouseLogLevel2["ERROR"] = 4] = "ERROR";
    ClickHouseLogLevel2[ClickHouseLogLevel2["OFF"] = 127] = "OFF";
  })(ClickHouseLogLevel || (exports.ClickHouseLogLevel = ClickHouseLogLevel = {}));
  function formatMessage({ level, module: module2, message }) {
    const ts = new Date().toISOString();
    return `[${ts}][${level}][@clickhouse/client][${module2}] ${message}`;
  }
});

// node_modules/@clickhouse/client-common/dist/parse/json_handling.js
var require_json_handling = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.defaultJSONHandling = undefined;
  exports.defaultJSONHandling = {
    parse: JSON.parse,
    stringify: JSON.stringify
  };
});

// node_modules/@clickhouse/client-common/dist/config.js
var require_config = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.prepareConfigWithURL = prepareConfigWithURL;
  exports.getConnectionParams = getConnectionParams;
  exports.mergeConfigs = mergeConfigs;
  exports.createUrl = createUrl;
  exports.loadConfigOptionsFromURL = loadConfigOptionsFromURL;
  exports.booleanConfigURLValue = booleanConfigURLValue;
  exports.numberConfigURLValue = numberConfigURLValue;
  exports.enumConfigURLValue = enumConfigURLValue;
  var logger_1 = require_logger();
  var json_handling_1 = require_json_handling();
  function prepareConfigWithURL(baseConfigOptions, logger, handleImplURLParams) {
    const baseConfig = { ...baseConfigOptions };
    if (baseConfig.additional_headers !== undefined) {
      logger.warn({
        module: "Config",
        message: '"additional_headers" is deprecated. Use "http_headers" instead.'
      });
      baseConfig.http_headers = baseConfig.additional_headers;
      delete baseConfig.additional_headers;
    }
    let configURL;
    if (baseConfig.host !== undefined) {
      logger.warn({
        module: "Config",
        message: '"host" is deprecated. Use "url" instead.'
      });
      configURL = createUrl(baseConfig.host);
      delete baseConfig.host;
    } else {
      configURL = createUrl(baseConfig.url);
    }
    const [url, configFromURL] = loadConfigOptionsFromURL(configURL, handleImplURLParams);
    const config2 = mergeConfigs(baseConfig, configFromURL, logger);
    if (config2.pathname !== undefined) {
      url.pathname = config2.pathname;
    }
    config2.url = url;
    return config2;
  }
  function getConnectionParams(config2, logger) {
    let auth;
    if (config2.access_token !== undefined) {
      if (config2.username !== undefined || config2.password !== undefined) {
        throw new Error("Both access token and username/password are provided in the configuration. Please use only one authentication method.");
      }
      auth = { access_token: config2.access_token, type: "JWT" };
    } else {
      auth = {
        username: config2.username ?? "default",
        password: config2.password ?? "",
        type: "Credentials"
      };
    }
    const log_level = config2.log?.level ?? logger_1.ClickHouseLogLevel.WARN;
    return {
      auth,
      url: config2.url,
      application_id: config2.application,
      request_timeout: config2.request_timeout ?? 30000,
      max_open_connections: config2.max_open_connections ?? 10,
      compression: {
        decompress_response: config2.compression?.response ?? false,
        compress_request: config2.compression?.request ?? false
      },
      database: config2.database ?? "default",
      log_writer: new logger_1.LogWriter(logger, "Connection", log_level),
      log_level,
      keep_alive: { enabled: config2.keep_alive?.enabled ?? true },
      clickhouse_settings: config2.clickhouse_settings ?? {},
      http_headers: config2.http_headers ?? {},
      json: {
        ...json_handling_1.defaultJSONHandling,
        ...config2.json
      }
    };
  }
  function mergeConfigs(baseConfig, configFromURL, logger) {
    function deepMerge(base, fromURL, path = []) {
      for (const key of Object.keys(fromURL)) {
        if (typeof fromURL[key] === "object") {
          deepMerge(base, fromURL[key], path.concat(key));
        } else {
          let baseAtPath = base;
          for (const key2 of path) {
            if (baseAtPath[key2] === undefined) {
              baseAtPath[key2] = {};
            }
            baseAtPath = baseAtPath[key2];
          }
          const baseAtKey = baseAtPath[key];
          if (baseAtKey !== undefined) {
            const fullPath = path.concat(key).join(".");
            logger.warn({
              module: "Config",
              message: `"${fullPath}" is overridden by a URL parameter.`
            });
          }
          baseAtPath[key] = fromURL[key];
        }
      }
    }
    const config2 = { ...baseConfig };
    deepMerge(config2, configFromURL);
    return config2;
  }
  function createUrl(configURL) {
    let url;
    try {
      if (typeof configURL === "string" || configURL instanceof URL) {
        url = new URL(configURL);
      } else {
        return new URL("http://localhost:8123");
      }
    } catch (err) {
      throw new Error("ClickHouse URL is malformed. Expected format: http[s]://[username:password@]hostname:port[/database][?param1=value1&param2=value2]", { cause: err });
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error(`ClickHouse URL protocol must be either http or https. Got: ${url.protocol}`);
    }
    return url;
  }
  function loadConfigOptionsFromURL(url, handleExtraURLParams) {
    let config2 = {};
    if (url.username !== "") {
      config2.username = decodeURIComponent(url.username);
    }
    if (url.password !== "") {
      config2.password = decodeURIComponent(url.password);
    }
    if (url.pathname.trim().length > 1) {
      config2.database = url.pathname.slice(1);
    }
    const urlSearchParamsKeys = [...url.searchParams.keys()];
    if (urlSearchParamsKeys.length > 0) {
      const unknownParams = new Set;
      const settingPrefix = "clickhouse_setting_";
      const settingShortPrefix = "ch_";
      const httpHeaderPrefix = "http_header_";
      urlSearchParamsKeys.forEach((key) => {
        let paramWasProcessed = true;
        const value = url.searchParams.get(key);
        if (key.startsWith(settingPrefix)) {
          const settingKey = key.slice(settingPrefix.length);
          if (config2.clickhouse_settings === undefined) {
            config2.clickhouse_settings = {};
          }
          config2.clickhouse_settings[settingKey] = value;
        } else if (key.startsWith(settingShortPrefix)) {
          const settingKey = key.slice(settingShortPrefix.length);
          if (config2.clickhouse_settings === undefined) {
            config2.clickhouse_settings = {};
          }
          config2.clickhouse_settings[settingKey] = value;
        } else if (key.startsWith(httpHeaderPrefix)) {
          const headerKey = key.slice(httpHeaderPrefix.length);
          if (config2.http_headers === undefined) {
            config2.http_headers = {};
          }
          config2.http_headers[headerKey] = value;
        } else {
          switch (key) {
            case "application":
              config2.application = value;
              break;
            case "pathname":
              config2.pathname = value;
              break;
            case "session_id":
              config2.session_id = value;
              break;
            case "request_timeout":
              config2.request_timeout = numberConfigURLValue({
                key,
                value,
                min: 0
              });
              break;
            case "max_open_connections":
              config2.max_open_connections = numberConfigURLValue({
                key,
                value,
                min: 1
              });
              break;
            case "compression_request":
              if (config2.compression === undefined) {
                config2.compression = {};
              }
              config2.compression.request = booleanConfigURLValue({ key, value });
              break;
            case "compression_response":
              if (config2.compression === undefined) {
                config2.compression = {};
              }
              config2.compression.response = booleanConfigURLValue({
                key,
                value
              });
              break;
            case "log_level":
              if (config2.log === undefined) {
                config2.log = {};
              }
              config2.log.level = enumConfigURLValue({
                key,
                value,
                enumObject: logger_1.ClickHouseLogLevel
              });
              break;
            case "keep_alive_enabled":
              if (config2.keep_alive === undefined) {
                config2.keep_alive = {};
              }
              config2.keep_alive.enabled = booleanConfigURLValue({ key, value });
              break;
            case "access_token":
              config2.access_token = value;
              break;
            default:
              paramWasProcessed = false;
              unknownParams.add(key);
              break;
          }
        }
        if (paramWasProcessed) {
          url.searchParams.delete(key);
        }
      });
      if (handleExtraURLParams !== null) {
        const res = handleExtraURLParams(config2, url);
        config2 = res.config;
        if (unknownParams.size > 0) {
          res.handled_params.forEach((k) => unknownParams.delete(k));
        }
        if (res.unknown_params.size > 0) {
          res.unknown_params.forEach((k) => unknownParams.add(k));
        }
      }
      if (unknownParams.size > 0) {
        throw new Error(`Unknown URL parameters: ${Array.from(unknownParams).join(", ")}`);
      }
    }
    const clickHouseURL = new URL(`${url.protocol}//${url.host}`);
    return [clickHouseURL, config2];
  }
  function booleanConfigURLValue({ key, value }) {
    const trimmed = value.trim();
    if (trimmed === "true" || trimmed === "1")
      return true;
    if (trimmed === "false" || trimmed === "0")
      return false;
    throw new Error(`"${key}" has invalid boolean value: ${trimmed}. Expected one of: 0, 1, true, false.`);
  }
  function numberConfigURLValue({ key, value, min, max }) {
    const trimmed = value.trim();
    const number4 = Number(trimmed);
    if (isNaN(number4))
      throw new Error(`"${key}" has invalid numeric value: ${trimmed}`);
    if (min !== undefined && number4 < min) {
      throw new Error(`"${key}" value ${trimmed} is less than min allowed ${min}`);
    }
    if (max !== undefined && number4 > max) {
      throw new Error(`"${key}" value ${trimmed} is greater than max allowed ${max}`);
    }
    return number4;
  }
  function enumConfigURLValue({ key, value, enumObject }) {
    const values = Object.keys(enumObject).filter((item) => isNaN(Number(item)));
    const trimmed = value.trim();
    if (!values.includes(trimmed)) {
      const expected = values.join(", ");
      throw new Error(`"${key}" has invalid value: ${trimmed}. Expected one of: ${expected}.`);
    }
    return enumObject[trimmed];
  }
});

// node_modules/@clickhouse/client-common/dist/client.js
var require_client = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ClickHouseClient = undefined;
  var index_1 = require_dist2();
  var config_1 = require_config();

  class ClickHouseClient {
    clientClickHouseSettings;
    connectionParams;
    connection;
    makeResultSet;
    valuesEncoder;
    sessionId;
    role;
    jsonHandling;
    constructor(config2) {
      const logger = config2?.log?.LoggerClass ? new config2.log.LoggerClass : new index_1.DefaultLogger;
      const configWithURL = (0, config_1.prepareConfigWithURL)(config2, logger, config2.impl.handle_specific_url_params ?? null);
      this.connectionParams = (0, config_1.getConnectionParams)(configWithURL, logger);
      this.clientClickHouseSettings = this.connectionParams.clickhouse_settings;
      this.sessionId = config2.session_id;
      this.role = config2.role;
      this.connection = config2.impl.make_connection(configWithURL, this.connectionParams);
      this.makeResultSet = config2.impl.make_result_set;
      this.jsonHandling = {
        ...index_1.defaultJSONHandling,
        ...config2.json
      };
      this.valuesEncoder = config2.impl.values_encoder(this.jsonHandling);
    }
    async query(params) {
      const format = params.format ?? "JSON";
      const query = formatQuery(params.query, format);
      const queryParams = this.withClientQueryParams(params);
      const { stream, query_id, response_headers } = await this.connection.query({
        query,
        ...queryParams
      });
      const { log_writer, log_level } = this.connectionParams;
      return this.makeResultSet(stream, format, query_id, (err) => {
        if (log_level <= index_1.ClickHouseLogLevel.ERROR) {
          log_writer.error({
            err,
            module: "Client",
            message: "Error while processing the ResultSet.",
            args: {
              session_id: queryParams.session_id,
              role: queryParams.role,
              query_id
            }
          });
        }
      }, response_headers, this.jsonHandling);
    }
    async command(params) {
      const query = removeTrailingSemi(params.query.trim());
      const ignore_error_response = params.ignore_error_response ?? false;
      const queryParams = this.withClientQueryParams(params);
      return await this.connection.command({
        query,
        ignore_error_response,
        ...queryParams
      });
    }
    async exec(params) {
      const query = removeTrailingSemi(params.query.trim());
      const values = "values" in params ? params.values : undefined;
      const decompress_response_stream = params.decompress_response_stream ?? true;
      const ignore_error_response = params.ignore_error_response ?? false;
      const queryParams = this.withClientQueryParams(params);
      return await this.connection.exec({
        query,
        values,
        decompress_response_stream,
        ignore_error_response,
        ...queryParams
      });
    }
    async insert(params) {
      if (Array.isArray(params.values) && params.values.length === 0) {
        return { executed: false, query_id: "", response_headers: {} };
      }
      const format = params.format || "JSONCompactEachRow";
      this.valuesEncoder.validateInsertValues(params.values, format);
      const query = getInsertQuery(params, format);
      const queryParams = this.withClientQueryParams(params);
      const result = await this.connection.insert({
        query,
        values: this.valuesEncoder.encodeValues(params.values, format),
        ...queryParams
      });
      return { ...result, executed: true };
    }
    async ping(params) {
      return await this.connection.ping(params ?? { select: false });
    }
    async close() {
      return await this.connection.close();
    }
    async[Symbol.asyncDispose]() {
      await this.close();
    }
    withClientQueryParams(params) {
      return {
        clickhouse_settings: {
          ...this.clientClickHouseSettings,
          ...params.clickhouse_settings
        },
        query_params: params.query_params,
        abort_signal: params.abort_signal,
        query_id: params.query_id,
        session_id: params.session_id ?? this.sessionId,
        role: params.role ?? this.role,
        auth: params.auth,
        http_headers: params.http_headers
      };
    }
  }
  exports.ClickHouseClient = ClickHouseClient;
  function formatQuery(query, format) {
    query = query.trim();
    query = removeTrailingSemi(query);
    return query + ` 
FORMAT ` + format;
  }
  function removeTrailingSemi(query) {
    let lastNonSemiIdx = query.length;
    for (let i = lastNonSemiIdx;i > 0; i--) {
      if (query[i - 1] !== ";") {
        lastNonSemiIdx = i;
        break;
      }
    }
    if (lastNonSemiIdx !== query.length) {
      return query.slice(0, lastNonSemiIdx);
    }
    return query;
  }
  function isInsertColumnsExcept(obj) {
    return obj !== undefined && obj !== null && typeof obj === "object" && Object.prototype.hasOwnProperty.call(obj, "except");
  }
  function getInsertQuery(params, format) {
    let columnsPart = "";
    if (params.columns !== undefined) {
      if (Array.isArray(params.columns) && params.columns.length > 0) {
        columnsPart = ` (${params.columns.join(", ")})`;
      } else if (isInsertColumnsExcept(params.columns) && params.columns.except.length > 0) {
        columnsPart = ` (* EXCEPT (${params.columns.except.join(", ")}))`;
      }
    }
    return `INSERT INTO ${params.table.trim()}${columnsPart} FORMAT ${format}`;
  }
});

// node_modules/@clickhouse/client-common/dist/data_formatter/formatter.js
var require_formatter = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.StreamableFormats = exports.SupportedRawFormats = exports.SupportedJSONFormats = exports.SingleDocumentJSONFormats = exports.RecordsJSONFormats = exports.StreamableJSONFormats = undefined;
  exports.isNotStreamableJSONFamily = isNotStreamableJSONFamily;
  exports.isStreamableJSONFamily = isStreamableJSONFamily;
  exports.isSupportedRawFormat = isSupportedRawFormat;
  exports.validateStreamFormat = validateStreamFormat;
  exports.encodeJSON = encodeJSON;
  exports.StreamableJSONFormats = [
    "JSONEachRow",
    "JSONStringsEachRow",
    "JSONCompactEachRow",
    "JSONCompactStringsEachRow",
    "JSONCompactEachRowWithNames",
    "JSONCompactEachRowWithNamesAndTypes",
    "JSONCompactStringsEachRowWithNames",
    "JSONCompactStringsEachRowWithNamesAndTypes",
    "JSONEachRowWithProgress"
  ];
  exports.RecordsJSONFormats = ["JSONObjectEachRow"];
  exports.SingleDocumentJSONFormats = [
    "JSON",
    "JSONStrings",
    "JSONCompact",
    "JSONCompactStrings",
    "JSONColumnsWithMetadata"
  ];
  exports.SupportedJSONFormats = [
    ...exports.RecordsJSONFormats,
    ...exports.SingleDocumentJSONFormats,
    ...exports.StreamableJSONFormats
  ];
  exports.SupportedRawFormats = [
    "CSV",
    "CSVWithNames",
    "CSVWithNamesAndTypes",
    "TabSeparated",
    "TabSeparatedRaw",
    "TabSeparatedWithNames",
    "TabSeparatedWithNamesAndTypes",
    "CustomSeparated",
    "CustomSeparatedWithNames",
    "CustomSeparatedWithNamesAndTypes",
    "Parquet"
  ];
  exports.StreamableFormats = [
    ...exports.StreamableJSONFormats,
    ...exports.SupportedRawFormats
  ];
  function isNotStreamableJSONFamily(format) {
    return exports.SingleDocumentJSONFormats.includes(format) || exports.RecordsJSONFormats.includes(format);
  }
  function isStreamableJSONFamily(format) {
    return exports.StreamableJSONFormats.includes(format);
  }
  function isSupportedRawFormat(dataFormat) {
    return exports.SupportedRawFormats.includes(dataFormat);
  }
  function validateStreamFormat(format) {
    if (!exports.StreamableFormats.includes(format)) {
      throw new Error(`${format} format is not streamable. Streamable formats: ${exports.StreamableFormats.join(",")}`);
    }
    return true;
  }
  function encodeJSON(value, format, stringifyFn) {
    if (exports.SupportedJSONFormats.includes(format)) {
      return stringifyFn(value) + `
`;
    }
    throw new Error(`The client does not support JSON encoding in [${format}] format.`);
  }
});

// node_modules/@clickhouse/client-common/dist/data_formatter/format_query_params.js
var require_format_query_params = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.TupleParam = undefined;
  exports.formatQueryParams = formatQueryParams;

  class TupleParam {
    values;
    constructor(values) {
      this.values = values;
    }
  }
  exports.TupleParam = TupleParam;
  function formatQueryParams({ value, wrapStringInQuotes, printNullAsKeyword }) {
    return formatQueryParamsInternal({
      value,
      wrapStringInQuotes,
      printNullAsKeyword,
      isInArrayOrTuple: false
    });
  }
  function formatQueryParamsInternal({ value, wrapStringInQuotes, printNullAsKeyword, isInArrayOrTuple }) {
    if (value === null || value === undefined) {
      if (printNullAsKeyword)
        return "NULL";
      return "\\N";
    }
    if (Number.isNaN(value))
      return "nan";
    if (value === Number.POSITIVE_INFINITY)
      return "+inf";
    if (value === Number.NEGATIVE_INFINITY)
      return "-inf";
    if (typeof value === "number" || typeof value === "bigint")
      return String(value);
    if (typeof value === "boolean") {
      if (isInArrayOrTuple) {
        return value ? "TRUE" : "FALSE";
      }
      return value ? "1" : "0";
    }
    if (typeof value === "string") {
      let result = "";
      for (let i = 0;i < value.length; i++) {
        switch (value.charCodeAt(i)) {
          case TabASCII:
            result += "\\t";
            break;
          case NewlineASCII:
            result += "\\n";
            break;
          case CarriageReturnASCII:
            result += "\\r";
            break;
          case SingleQuoteASCII:
            result += `\\'`;
            break;
          case BackslashASCII:
            result += "\\\\";
            break;
          default:
            result += value[i];
        }
      }
      return wrapStringInQuotes ? `'${result}'` : result;
    }
    if (Array.isArray(value)) {
      return `[${value.map((v) => formatQueryParamsInternal({
        value: v,
        wrapStringInQuotes: true,
        printNullAsKeyword: true,
        isInArrayOrTuple: true
      })).join(",")}]`;
    }
    if (value instanceof Date) {
      const unixTimestamp = Math.floor(value.getTime() / 1000).toString().padStart(10, "0");
      const milliseconds = value.getUTCMilliseconds();
      return milliseconds === 0 ? unixTimestamp : `${unixTimestamp}.${milliseconds.toString().padStart(3, "0")}`;
    }
    if (value instanceof TupleParam) {
      return `(${value.values.map((v) => formatQueryParamsInternal({
        value: v,
        wrapStringInQuotes: true,
        printNullAsKeyword: true,
        isInArrayOrTuple: true
      })).join(",")})`;
    }
    if (value instanceof Map) {
      return formatObjectLikeParam(value.entries());
    }
    if (typeof value === "object") {
      return formatObjectLikeParam(Object.entries(value));
    }
    throw new Error(`Unsupported value in query parameters: [${value}].`);
  }
  function formatObjectLikeParam(entries) {
    const formatted = [];
    for (const [key, val] of entries) {
      formatted.push(`${formatQueryParamsInternal({
        value: key,
        wrapStringInQuotes: true,
        printNullAsKeyword: true,
        isInArrayOrTuple: true
      })}:${formatQueryParamsInternal({
        value: val,
        wrapStringInQuotes: true,
        printNullAsKeyword: true,
        isInArrayOrTuple: true
      })}`);
    }
    return `{${formatted.join(",")}}`;
  }
  var TabASCII = 9;
  var NewlineASCII = 10;
  var CarriageReturnASCII = 13;
  var SingleQuoteASCII = 39;
  var BackslashASCII = 92;
});

// node_modules/@clickhouse/client-common/dist/settings.js
var require_settings = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SettingsMap = undefined;

  class SettingsMap {
    record;
    constructor(record3) {
      this.record = record3;
    }
    toString() {
      return `{${Object.entries(this.record).map(([k, v]) => `'${k}':'${v}'`).join(",")}}`;
    }
    static from(record3) {
      return new this(record3);
    }
  }
  exports.SettingsMap = SettingsMap;
});

// node_modules/@clickhouse/client-common/dist/data_formatter/format_query_settings.js
var require_format_query_settings = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.formatQuerySettings = formatQuerySettings;
  var settings_1 = require_settings();
  function formatQuerySettings(value) {
    if (typeof value === "boolean")
      return value ? "1" : "0";
    if (typeof value === "number")
      return String(value);
    if (typeof value === "string")
      return value;
    if (value instanceof settings_1.SettingsMap) {
      return value.toString();
    }
    throw new Error(`Unsupported value in query settings: [${value}].`);
  }
});

// node_modules/@clickhouse/client-common/dist/data_formatter/index.js
var require_data_formatter = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.formatQuerySettings = exports.formatQueryParams = exports.TupleParam = undefined;
  __exportStar(require_formatter(), exports);
  var format_query_params_1 = require_format_query_params();
  Object.defineProperty(exports, "TupleParam", { enumerable: true, get: function() {
    return format_query_params_1.TupleParam;
  } });
  Object.defineProperty(exports, "formatQueryParams", { enumerable: true, get: function() {
    return format_query_params_1.formatQueryParams;
  } });
  var format_query_settings_1 = require_format_query_settings();
  Object.defineProperty(exports, "formatQuerySettings", { enumerable: true, get: function() {
    return format_query_settings_1.formatQuerySettings;
  } });
});

// node_modules/@clickhouse/client-common/dist/error/error.js
var require_error = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ClickHouseError = undefined;
  exports.parseError = parseError;
  exports.getCurrentStackTrace = getCurrentStackTrace;
  exports.enhanceStackTrace = enhanceStackTrace;
  var errorRe = /(Code|Error): (?<code>\d+).*Exception: (?<message>.+)\((?<type>(?=.+[A-Z]{3})[A-Z0-9_]+?)\)/s;

  class ClickHouseError extends Error {
    code;
    type;
    constructor({ message, code, type }) {
      super(message);
      this.code = code;
      this.type = type;
      Object.setPrototypeOf(this, ClickHouseError.prototype);
    }
  }
  exports.ClickHouseError = ClickHouseError;
  function parseError(input) {
    const inputIsError = input instanceof Error;
    const message = inputIsError ? input.message : input;
    const match = message.match(errorRe);
    const groups = match?.groups;
    if (groups) {
      return new ClickHouseError(groups);
    } else {
      return inputIsError ? input : new Error(input);
    }
  }
  function getCurrentStackTrace() {
    const stack = new Error().stack;
    if (!stack)
      return "";
    return stack.split(`
`).slice(3).reverse().join(`
`);
  }
  function enhanceStackTrace(err, stackTrace) {
    if (err.stack && stackTrace) {
      const firstNewlineIndex = err.stack.indexOf(`
`);
      const firstLine = err.stack.substring(0, firstNewlineIndex);
      const errStack = err.stack.substring(firstNewlineIndex + 1);
      err.stack = `${firstLine}
${stackTrace}
${errStack}`;
    }
    return err;
  }
});

// node_modules/@clickhouse/client-common/dist/error/index.js
var require_error2 = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_error(), exports);
});

// node_modules/@clickhouse/client-common/dist/clickhouse_types.js
var require_clickhouse_types = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.isProgressRow = isProgressRow;
  exports.isRow = isRow;
  exports.isException = isException;
  function isProgressRow(row) {
    return row !== null && typeof row === "object" && "progress" in row && Object.keys(row).length === 1;
  }
  function isRow(row) {
    return row !== null && typeof row === "object" && "row" in row && Object.keys(row).length === 1;
  }
  function isException(row) {
    return row !== null && typeof row === "object" && "exception" in row && Object.keys(row).length === 1;
  }
});

// node_modules/@clickhouse/client-common/dist/parse/column_types.js
var require_column_types = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SimpleColumnTypes = exports.ColumnTypeParseError = undefined;
  exports.parseColumnType = parseColumnType;
  exports.parseDecimalType = parseDecimalType;
  exports.parseEnumType = parseEnumType;
  exports.parseMapType = parseMapType;
  exports.parseTupleType = parseTupleType;
  exports.parseArrayType = parseArrayType;
  exports.parseDateTimeType = parseDateTimeType;
  exports.parseDateTime64Type = parseDateTime64Type;
  exports.parseFixedStringType = parseFixedStringType;
  exports.asNullableType = asNullableType;
  exports.getElementsTypes = getElementsTypes;

  class ColumnTypeParseError extends Error {
    args;
    constructor(message, args) {
      super(message);
      this.args = args ?? {};
      Object.setPrototypeOf(this, ColumnTypeParseError.prototype);
    }
  }
  exports.ColumnTypeParseError = ColumnTypeParseError;
  exports.SimpleColumnTypes = [
    "Bool",
    "UInt8",
    "Int8",
    "UInt16",
    "Int16",
    "UInt32",
    "Int32",
    "UInt64",
    "Int64",
    "UInt128",
    "Int128",
    "UInt256",
    "Int256",
    "Float32",
    "Float64",
    "String",
    "UUID",
    "Date",
    "Date32",
    "IPv4",
    "IPv6"
  ];
  function parseColumnType(sourceType) {
    let columnType = sourceType;
    let isNullable = false;
    if (columnType.startsWith(LowCardinalityPrefix)) {
      columnType = columnType.slice(LowCardinalityPrefix.length, -1);
    }
    if (columnType.startsWith(NullablePrefix)) {
      columnType = columnType.slice(NullablePrefix.length, -1);
      isNullable = true;
    }
    let result;
    if (exports.SimpleColumnTypes.includes(columnType)) {
      result = {
        type: "Simple",
        columnType,
        sourceType
      };
    } else if (columnType.startsWith(DecimalPrefix)) {
      result = parseDecimalType({
        sourceType,
        columnType
      });
    } else if (columnType.startsWith(DateTime64Prefix)) {
      result = parseDateTime64Type({ sourceType, columnType });
    } else if (columnType.startsWith(DateTimePrefix)) {
      result = parseDateTimeType({ sourceType, columnType });
    } else if (columnType.startsWith(FixedStringPrefix)) {
      result = parseFixedStringType({ sourceType, columnType });
    } else if (columnType.startsWith(Enum8Prefix) || columnType.startsWith(Enum16Prefix)) {
      result = parseEnumType({ sourceType, columnType });
    } else if (columnType.startsWith(ArrayPrefix)) {
      result = parseArrayType({ sourceType, columnType });
    } else if (columnType.startsWith(MapPrefix)) {
      result = parseMapType({ sourceType, columnType });
    } else if (columnType.startsWith(TuplePrefix)) {
      result = parseTupleType({ sourceType, columnType });
    } else {
      throw new ColumnTypeParseError("Unsupported column type", { columnType });
    }
    if (isNullable) {
      return asNullableType(result, sourceType);
    } else {
      return result;
    }
  }
  function parseDecimalType({ columnType, sourceType }) {
    if (!columnType.startsWith(DecimalPrefix) || columnType.length < DecimalPrefix.length + 5) {
      throw new ColumnTypeParseError("Invalid Decimal type", {
        sourceType,
        columnType
      });
    }
    const split = columnType.slice(DecimalPrefix.length, -1).split(", ");
    if (split.length !== 2) {
      throw new ColumnTypeParseError("Expected Decimal type to have both precision and scale", {
        sourceType,
        columnType,
        split
      });
    }
    let intSize = 32;
    const precision = parseInt(split[0], 10);
    if (Number.isNaN(precision) || precision < 1 || precision > 76) {
      throw new ColumnTypeParseError("Invalid Decimal precision", {
        columnType,
        sourceType,
        precision
      });
    }
    const scale = parseInt(split[1], 10);
    if (Number.isNaN(scale) || scale < 0 || scale > precision) {
      throw new ColumnTypeParseError("Invalid Decimal scale", {
        columnType,
        sourceType,
        precision,
        scale
      });
    }
    if (precision > 38) {
      intSize = 256;
    } else if (precision > 18) {
      intSize = 128;
    } else if (precision > 9) {
      intSize = 64;
    }
    return {
      type: "Decimal",
      params: {
        precision,
        scale,
        intSize
      },
      sourceType
    };
  }
  function parseEnumType({ columnType, sourceType }) {
    let intSize;
    if (columnType.startsWith(Enum8Prefix)) {
      columnType = columnType.slice(Enum8Prefix.length, -1);
      intSize = 8;
    } else if (columnType.startsWith(Enum16Prefix)) {
      columnType = columnType.slice(Enum16Prefix.length, -1);
      intSize = 16;
    } else {
      throw new ColumnTypeParseError("Expected Enum to be either Enum8 or Enum16", {
        columnType,
        sourceType
      });
    }
    if (columnType.length < 6) {
      throw new ColumnTypeParseError("Invalid Enum type values", {
        columnType,
        sourceType
      });
    }
    const names = [];
    const indices = [];
    let parsingName = true;
    let charEscaped = false;
    let startIndex = 1;
    for (let i = 1;i < columnType.length; i++) {
      if (parsingName) {
        if (charEscaped) {
          charEscaped = false;
        } else {
          if (columnType.charCodeAt(i) === BackslashASCII) {
            charEscaped = true;
          } else if (columnType.charCodeAt(i) === SingleQuoteASCII) {
            const name = columnType.slice(startIndex, i);
            if (names.includes(name)) {
              throw new ColumnTypeParseError("Duplicate Enum name", {
                columnType,
                sourceType,
                name,
                names,
                indices
              });
            }
            names.push(name);
            i += 4;
            startIndex = i;
            parsingName = false;
          }
        }
      } else if (columnType.charCodeAt(i) < ZeroASCII || columnType.charCodeAt(i) > NineASCII) {
        pushEnumIndex(startIndex, i);
        i += 2;
        startIndex = i + 1;
        parsingName = true;
        charEscaped = false;
      }
    }
    pushEnumIndex(startIndex, columnType.length);
    if (names.length !== indices.length) {
      throw new ColumnTypeParseError("Expected Enum to have the same number of names and indices", { columnType, sourceType, names, indices });
    }
    const values = {};
    for (let i = 0;i < names.length; i++) {
      values[indices[i]] = names[i];
    }
    return {
      type: "Enum",
      values,
      intSize,
      sourceType
    };
    function pushEnumIndex(start, end) {
      const index = parseInt(columnType.slice(start, end), 10);
      if (Number.isNaN(index) || index < 0) {
        throw new ColumnTypeParseError("Expected Enum index to be a valid number", {
          columnType,
          sourceType,
          names,
          indices,
          index,
          start,
          end
        });
      }
      if (indices.includes(index)) {
        throw new ColumnTypeParseError("Duplicate Enum index", {
          columnType,
          sourceType,
          index,
          names,
          indices
        });
      }
      indices.push(index);
    }
  }
  function parseMapType({ columnType, sourceType }) {
    if (!columnType.startsWith(MapPrefix) || columnType.length < MapPrefix.length + 11) {
      throw new ColumnTypeParseError("Invalid Map type", {
        columnType,
        sourceType
      });
    }
    columnType = columnType.slice(MapPrefix.length, -1);
    const [keyType, valueType] = getElementsTypes({ columnType, sourceType }, 2);
    const key = parseColumnType(keyType);
    if (key.type === "DateTime64" || key.type === "Nullable" || key.type === "Array" || key.type === "Map" || key.type === "Decimal" || key.type === "Tuple") {
      throw new ColumnTypeParseError("Invalid Map key type", {
        key,
        sourceType
      });
    }
    const value = parseColumnType(valueType);
    return {
      type: "Map",
      key,
      value,
      sourceType
    };
  }
  function parseTupleType({ columnType, sourceType }) {
    if (!columnType.startsWith(TuplePrefix) || columnType.length < TuplePrefix.length + 5) {
      throw new ColumnTypeParseError("Invalid Tuple type", {
        columnType,
        sourceType
      });
    }
    columnType = columnType.slice(TuplePrefix.length, -1);
    const elements = getElementsTypes({ columnType, sourceType }, 1).map((type) => parseColumnType(type));
    return {
      type: "Tuple",
      elements,
      sourceType
    };
  }
  function parseArrayType({ columnType, sourceType }) {
    if (!columnType.startsWith(ArrayPrefix) || columnType.length < ArrayPrefix.length + 5) {
      throw new ColumnTypeParseError("Invalid Array type", {
        columnType,
        sourceType
      });
    }
    let dimensions = 0;
    while (columnType.length > 0) {
      if (columnType.startsWith(ArrayPrefix)) {
        columnType = columnType.slice(ArrayPrefix.length, -1);
        dimensions++;
      } else {
        break;
      }
    }
    if (dimensions === 0 || dimensions > 10) {
      throw new ColumnTypeParseError("Expected Array to have between 1 and 10 dimensions", { columnType });
    }
    const value = parseColumnType(columnType);
    if (value.type === "Array") {
      throw new ColumnTypeParseError("Unexpected Array as value type", {
        columnType,
        sourceType
      });
    }
    return {
      type: "Array",
      value,
      dimensions,
      sourceType
    };
  }
  function parseDateTimeType({ columnType, sourceType }) {
    if (columnType.startsWith(DateTimeWithTimezonePrefix) && columnType.length > DateTimeWithTimezonePrefix.length + 4) {
      const timezone = columnType.slice(DateTimeWithTimezonePrefix.length + 1, -2);
      return {
        type: "DateTime",
        timezone,
        sourceType
      };
    } else if (columnType.startsWith(DateTimePrefix) && columnType.length === DateTimePrefix.length) {
      return {
        type: "DateTime",
        timezone: null,
        sourceType
      };
    } else {
      throw new ColumnTypeParseError("Invalid DateTime type", {
        columnType,
        sourceType
      });
    }
  }
  function parseDateTime64Type({ columnType, sourceType }) {
    if (!columnType.startsWith(DateTime64Prefix) || columnType.length < DateTime64Prefix.length + 2) {
      throw new ColumnTypeParseError("Invalid DateTime64 type", {
        columnType,
        sourceType
      });
    }
    const precision = parseInt(columnType[DateTime64Prefix.length], 10);
    if (Number.isNaN(precision) || precision < 0 || precision > 9) {
      throw new ColumnTypeParseError("Invalid DateTime64 precision", {
        columnType,
        sourceType,
        precision
      });
    }
    let timezone = null;
    if (columnType.length > DateTime64Prefix.length + 2) {
      timezone = columnType.slice(DateTime64Prefix.length + 4, -2);
    }
    return {
      type: "DateTime64",
      timezone,
      precision,
      sourceType
    };
  }
  function parseFixedStringType({ columnType, sourceType }) {
    if (!columnType.startsWith(FixedStringPrefix) || columnType.length < FixedStringPrefix.length + 2) {
      throw new ColumnTypeParseError("Invalid FixedString type", {
        columnType,
        sourceType
      });
    }
    const sizeBytes = parseInt(columnType.slice(FixedStringPrefix.length, -1), 10);
    if (Number.isNaN(sizeBytes) || sizeBytes < 1) {
      throw new ColumnTypeParseError("Invalid FixedString size in bytes", {
        columnType,
        sourceType,
        sizeBytes
      });
    }
    return {
      type: "FixedString",
      sizeBytes,
      sourceType
    };
  }
  function asNullableType(value, sourceType) {
    if (value.type === "Array" || value.type === "Map" || value.type === "Tuple" || value.type === "Nullable") {
      throw new ColumnTypeParseError(`${value.type} cannot be Nullable`, {
        sourceType
      });
    }
    if (value.sourceType.startsWith(NullablePrefix)) {
      value.sourceType = value.sourceType.slice(NullablePrefix.length, -1);
    }
    return {
      type: "Nullable",
      sourceType,
      value
    };
  }
  function getElementsTypes({ columnType, sourceType }, minElements) {
    const elements = [];
    let openParens = 0;
    let quoteOpen = false;
    let charEscaped = false;
    let lastElementIndex = 0;
    for (let i = 0;i < columnType.length; i++) {
      if (charEscaped) {
        charEscaped = false;
      } else if (columnType.charCodeAt(i) === BackslashASCII) {
        charEscaped = true;
      } else if (columnType.charCodeAt(i) === SingleQuoteASCII) {
        quoteOpen = !quoteOpen;
      } else {
        if (!quoteOpen) {
          if (columnType.charCodeAt(i) === LeftParenASCII) {
            openParens++;
          } else if (columnType.charCodeAt(i) === RightParenASCII) {
            openParens--;
          } else if (columnType.charCodeAt(i) === CommaASCII) {
            if (openParens === 0) {
              elements.push(columnType.slice(lastElementIndex, i));
              i += 2;
              lastElementIndex = i;
            }
          }
        }
      }
    }
    if (!openParens && lastElementIndex < columnType.length - 1) {
      elements.push(columnType.slice(lastElementIndex));
    }
    if (elements.length < minElements) {
      throw new ColumnTypeParseError("Expected more elements in the type", {
        sourceType,
        columnType,
        elements,
        minElements
      });
    }
    return elements;
  }
  var NullablePrefix = "Nullable(";
  var LowCardinalityPrefix = "LowCardinality(";
  var DecimalPrefix = "Decimal(";
  var ArrayPrefix = "Array(";
  var MapPrefix = "Map(";
  var Enum8Prefix = "Enum8(";
  var Enum16Prefix = "Enum16(";
  var TuplePrefix = "Tuple(";
  var DateTimePrefix = "DateTime";
  var DateTimeWithTimezonePrefix = "DateTime(";
  var DateTime64Prefix = "DateTime64(";
  var FixedStringPrefix = "FixedString(";
  var SingleQuoteASCII = 39;
  var LeftParenASCII = 40;
  var RightParenASCII = 41;
  var CommaASCII = 44;
  var ZeroASCII = 48;
  var NineASCII = 57;
  var BackslashASCII = 92;
});

// node_modules/@clickhouse/client-common/dist/parse/index.js
var require_parse = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_column_types(), exports);
  __exportStar(require_json_handling(), exports);
});

// node_modules/@clickhouse/client-common/dist/utils/connection.js
var require_connection = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.EXCEPTION_TAG_HEADER_NAME = undefined;
  exports.withCompressionHeaders = withCompressionHeaders;
  exports.withHttpSettings = withHttpSettings;
  exports.isSuccessfulResponse = isSuccessfulResponse;
  exports.isJWTAuth = isJWTAuth;
  exports.isCredentialsAuth = isCredentialsAuth;
  function withCompressionHeaders({ headers, enable_request_compression, enable_response_compression }) {
    return {
      ...headers,
      ...enable_response_compression ? { "Accept-Encoding": "gzip" } : {},
      ...enable_request_compression ? { "Content-Encoding": "gzip" } : {}
    };
  }
  function withHttpSettings(clickhouse_settings, compression) {
    return {
      ...compression ? {
        enable_http_compression: 1
      } : {},
      ...clickhouse_settings
    };
  }
  function isSuccessfulResponse(statusCode) {
    return Boolean(statusCode && 200 <= statusCode && statusCode < 300);
  }
  function isJWTAuth(auth) {
    return auth !== null && typeof auth === "object" && "access_token" in auth;
  }
  function isCredentialsAuth(auth) {
    return auth !== null && typeof auth === "object" && "username" in auth && "password" in auth;
  }
  exports.EXCEPTION_TAG_HEADER_NAME = "x-clickhouse-exception-tag";
});

// node_modules/@clickhouse/client-common/dist/utils/sleep.js
var require_sleep = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.sleep = sleep;
  async function sleep(ms) {
    await new Promise((resolve) => setTimeout(() => {
      resolve(undefined);
    }, ms));
  }
});

// node_modules/@clickhouse/client-common/dist/utils/stream.js
var require_stream = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.CARET_RETURN = undefined;
  exports.extractErrorAtTheEndOfChunk = extractErrorAtTheEndOfChunk;
  var error_1 = require_error2();
  var EXCEPTION_MARKER = "__exception__";
  var NEWLINE = 10;
  exports.CARET_RETURN = 13;
  function extractErrorAtTheEndOfChunk(chunk, exceptionTag) {
    try {
      const bytesCountAfterErrLenHint = 1 + EXCEPTION_MARKER.length + 2 + exceptionTag.length + 2;
      let errMsgLenStartIdx = chunk.length - bytesCountAfterErrLenHint;
      if (errMsgLenStartIdx < 1) {
        return new Error("there was an error in the stream, but the last chunk is malformed");
      }
      do {
        --errMsgLenStartIdx;
      } while (chunk[errMsgLenStartIdx] !== NEWLINE);
      const textDecoder = new TextDecoder("utf-8");
      const errMsgLen = parseInt(textDecoder.decode(chunk.subarray(errMsgLenStartIdx, -bytesCountAfterErrLenHint)));
      if (isNaN(errMsgLen) || errMsgLen <= 0) {
        return new Error("there was an error in the stream; failed to parse the message length");
      }
      const errMsg = textDecoder.decode(chunk.subarray(errMsgLenStartIdx - errMsgLen + 1, errMsgLenStartIdx));
      return (0, error_1.parseError)(errMsg);
    } catch (err) {
      return err;
    }
  }
});

// node_modules/@clickhouse/client-common/dist/utils/url.js
var require_url = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.transformUrl = transformUrl;
  exports.toSearchParams = toSearchParams;
  var data_formatter_1 = require_data_formatter();
  function transformUrl({ url, pathname, searchParams }) {
    const newUrl = new URL(url);
    if (pathname) {
      if (newUrl.pathname === "/") {
        newUrl.pathname = pathname;
      } else {
        newUrl.pathname += pathname;
      }
    }
    if (searchParams) {
      newUrl.search = searchParams?.toString();
    }
    return newUrl;
  }
  function toSearchParams({ database, query, query_params, clickhouse_settings, session_id, query_id, role }) {
    const entries = [["query_id", query_id]];
    if (query_params !== undefined) {
      for (const [key, value] of Object.entries(query_params)) {
        const formattedParam = (0, data_formatter_1.formatQueryParams)({ value });
        entries.push([`param_${key}`, formattedParam]);
      }
    }
    if (clickhouse_settings !== undefined) {
      for (const [key, value] of Object.entries(clickhouse_settings)) {
        if (value !== undefined) {
          entries.push([key, (0, data_formatter_1.formatQuerySettings)(value)]);
        }
      }
    }
    if (database !== undefined && database !== "default") {
      entries.push(["database", database]);
    }
    if (query) {
      entries.push(["query", query]);
    }
    if (session_id) {
      entries.push(["session_id", session_id]);
    }
    if (role) {
      if (typeof role === "string") {
        entries.push(["role", role]);
      } else if (Array.isArray(role)) {
        for (const r of role) {
          entries.push(["role", r]);
        }
      }
    }
    return new URLSearchParams(entries);
  }
});

// node_modules/@clickhouse/client-common/dist/utils/index.js
var require_utils2 = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_connection(), exports);
  __exportStar(require_sleep(), exports);
  __exportStar(require_stream(), exports);
  __exportStar(require_url(), exports);
});

// node_modules/@clickhouse/client-common/dist/index.js
var require_dist2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.enhanceStackTrace = exports.getCurrentStackTrace = exports.DefaultLogger = exports.LogWriter = exports.CARET_RETURN = exports.extractErrorAtTheEndOfChunk = exports.isJWTAuth = exports.isCredentialsAuth = exports.withHttpSettings = exports.withCompressionHeaders = exports.transformUrl = exports.toSearchParams = exports.sleep = exports.isSuccessfulResponse = exports.EXCEPTION_TAG_HEADER_NAME = exports.numberConfigURLValue = exports.getConnectionParams = exports.enumConfigURLValue = exports.booleanConfigURLValue = exports.validateStreamFormat = exports.isNotStreamableJSONFamily = exports.isStreamableJSONFamily = exports.isSupportedRawFormat = exports.encodeJSON = exports.formatQueryParams = exports.formatQuerySettings = exports.defaultJSONHandling = exports.parseColumnType = exports.SimpleColumnTypes = exports.SettingsMap = exports.isException = exports.isRow = exports.isProgressRow = exports.ClickHouseLogLevel = exports.parseError = exports.ClickHouseError = exports.TupleParam = exports.RecordsJSONFormats = exports.SingleDocumentJSONFormats = exports.StreamableJSONFormats = exports.StreamableFormats = exports.SupportedRawFormats = exports.SupportedJSONFormats = exports.ClickHouseClient = undefined;
  var client_1 = require_client();
  Object.defineProperty(exports, "ClickHouseClient", { enumerable: true, get: function() {
    return client_1.ClickHouseClient;
  } });
  var data_formatter_1 = require_data_formatter();
  Object.defineProperty(exports, "SupportedJSONFormats", { enumerable: true, get: function() {
    return data_formatter_1.SupportedJSONFormats;
  } });
  Object.defineProperty(exports, "SupportedRawFormats", { enumerable: true, get: function() {
    return data_formatter_1.SupportedRawFormats;
  } });
  Object.defineProperty(exports, "StreamableFormats", { enumerable: true, get: function() {
    return data_formatter_1.StreamableFormats;
  } });
  Object.defineProperty(exports, "StreamableJSONFormats", { enumerable: true, get: function() {
    return data_formatter_1.StreamableJSONFormats;
  } });
  Object.defineProperty(exports, "SingleDocumentJSONFormats", { enumerable: true, get: function() {
    return data_formatter_1.SingleDocumentJSONFormats;
  } });
  Object.defineProperty(exports, "RecordsJSONFormats", { enumerable: true, get: function() {
    return data_formatter_1.RecordsJSONFormats;
  } });
  Object.defineProperty(exports, "TupleParam", { enumerable: true, get: function() {
    return data_formatter_1.TupleParam;
  } });
  var error_1 = require_error2();
  Object.defineProperty(exports, "ClickHouseError", { enumerable: true, get: function() {
    return error_1.ClickHouseError;
  } });
  Object.defineProperty(exports, "parseError", { enumerable: true, get: function() {
    return error_1.parseError;
  } });
  var logger_1 = require_logger();
  Object.defineProperty(exports, "ClickHouseLogLevel", { enumerable: true, get: function() {
    return logger_1.ClickHouseLogLevel;
  } });
  var clickhouse_types_1 = require_clickhouse_types();
  Object.defineProperty(exports, "isProgressRow", { enumerable: true, get: function() {
    return clickhouse_types_1.isProgressRow;
  } });
  Object.defineProperty(exports, "isRow", { enumerable: true, get: function() {
    return clickhouse_types_1.isRow;
  } });
  Object.defineProperty(exports, "isException", { enumerable: true, get: function() {
    return clickhouse_types_1.isException;
  } });
  var settings_1 = require_settings();
  Object.defineProperty(exports, "SettingsMap", { enumerable: true, get: function() {
    return settings_1.SettingsMap;
  } });
  var parse_1 = require_parse();
  Object.defineProperty(exports, "SimpleColumnTypes", { enumerable: true, get: function() {
    return parse_1.SimpleColumnTypes;
  } });
  Object.defineProperty(exports, "parseColumnType", { enumerable: true, get: function() {
    return parse_1.parseColumnType;
  } });
  Object.defineProperty(exports, "defaultJSONHandling", { enumerable: true, get: function() {
    return parse_1.defaultJSONHandling;
  } });
  var data_formatter_2 = require_data_formatter();
  Object.defineProperty(exports, "formatQuerySettings", { enumerable: true, get: function() {
    return data_formatter_2.formatQuerySettings;
  } });
  Object.defineProperty(exports, "formatQueryParams", { enumerable: true, get: function() {
    return data_formatter_2.formatQueryParams;
  } });
  Object.defineProperty(exports, "encodeJSON", { enumerable: true, get: function() {
    return data_formatter_2.encodeJSON;
  } });
  Object.defineProperty(exports, "isSupportedRawFormat", { enumerable: true, get: function() {
    return data_formatter_2.isSupportedRawFormat;
  } });
  Object.defineProperty(exports, "isStreamableJSONFamily", { enumerable: true, get: function() {
    return data_formatter_2.isStreamableJSONFamily;
  } });
  Object.defineProperty(exports, "isNotStreamableJSONFamily", { enumerable: true, get: function() {
    return data_formatter_2.isNotStreamableJSONFamily;
  } });
  Object.defineProperty(exports, "validateStreamFormat", { enumerable: true, get: function() {
    return data_formatter_2.validateStreamFormat;
  } });
  var config_1 = require_config();
  Object.defineProperty(exports, "booleanConfigURLValue", { enumerable: true, get: function() {
    return config_1.booleanConfigURLValue;
  } });
  Object.defineProperty(exports, "enumConfigURLValue", { enumerable: true, get: function() {
    return config_1.enumConfigURLValue;
  } });
  Object.defineProperty(exports, "getConnectionParams", { enumerable: true, get: function() {
    return config_1.getConnectionParams;
  } });
  Object.defineProperty(exports, "numberConfigURLValue", { enumerable: true, get: function() {
    return config_1.numberConfigURLValue;
  } });
  var utils_1 = require_utils2();
  Object.defineProperty(exports, "EXCEPTION_TAG_HEADER_NAME", { enumerable: true, get: function() {
    return utils_1.EXCEPTION_TAG_HEADER_NAME;
  } });
  Object.defineProperty(exports, "isSuccessfulResponse", { enumerable: true, get: function() {
    return utils_1.isSuccessfulResponse;
  } });
  Object.defineProperty(exports, "sleep", { enumerable: true, get: function() {
    return utils_1.sleep;
  } });
  Object.defineProperty(exports, "toSearchParams", { enumerable: true, get: function() {
    return utils_1.toSearchParams;
  } });
  Object.defineProperty(exports, "transformUrl", { enumerable: true, get: function() {
    return utils_1.transformUrl;
  } });
  Object.defineProperty(exports, "withCompressionHeaders", { enumerable: true, get: function() {
    return utils_1.withCompressionHeaders;
  } });
  Object.defineProperty(exports, "withHttpSettings", { enumerable: true, get: function() {
    return utils_1.withHttpSettings;
  } });
  Object.defineProperty(exports, "isCredentialsAuth", { enumerable: true, get: function() {
    return utils_1.isCredentialsAuth;
  } });
  Object.defineProperty(exports, "isJWTAuth", { enumerable: true, get: function() {
    return utils_1.isJWTAuth;
  } });
  Object.defineProperty(exports, "extractErrorAtTheEndOfChunk", { enumerable: true, get: function() {
    return utils_1.extractErrorAtTheEndOfChunk;
  } });
  Object.defineProperty(exports, "CARET_RETURN", { enumerable: true, get: function() {
    return utils_1.CARET_RETURN;
  } });
  var logger_2 = require_logger();
  Object.defineProperty(exports, "LogWriter", { enumerable: true, get: function() {
    return logger_2.LogWriter;
  } });
  Object.defineProperty(exports, "DefaultLogger", { enumerable: true, get: function() {
    return logger_2.DefaultLogger;
  } });
  var error_2 = require_error2();
  Object.defineProperty(exports, "getCurrentStackTrace", { enumerable: true, get: function() {
    return error_2.getCurrentStackTrace;
  } });
  Object.defineProperty(exports, "enhanceStackTrace", { enumerable: true, get: function() {
    return error_2.enhanceStackTrace;
  } });
});

// node_modules/@clickhouse/client/dist/utils/stream.js
var require_stream2 = __commonJS((exports) => {
  var __importDefault = exports && exports.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.isStream = isStream;
  exports.getAsText = getAsText;
  exports.mapStream = mapStream;
  var stream_1 = __importDefault(__require("stream"));
  var buffer_1 = __require("buffer");
  var { MAX_STRING_LENGTH } = buffer_1.constants;
  function isStream(obj) {
    return typeof obj === "object" && obj !== null && "pipe" in obj && typeof obj.pipe === "function" && "on" in obj && typeof obj.on === "function";
  }
  async function getAsText(stream) {
    let text = "";
    const textDecoder = new TextDecoder;
    for await (const chunk of stream) {
      const decoded = textDecoder.decode(chunk, { stream: true });
      if (decoded.length + text.length > MAX_STRING_LENGTH) {
        throw new Error("The response length exceeds the maximum allowed size of V8 String: " + `${MAX_STRING_LENGTH}; consider limiting the amount of requested rows.`);
      }
      text += decoded;
    }
    const last = textDecoder.decode();
    if (last) {
      text += last;
    }
    return text;
  }
  function mapStream(mapper) {
    return new stream_1.default.Transform({
      objectMode: true,
      transform(chunk, encoding, callback) {
        callback(null, mapper(chunk));
      }
    });
  }
});

// node_modules/@clickhouse/client/dist/utils/encoder.js
var require_encoder = __commonJS((exports) => {
  var __importDefault = exports && exports.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.NodeValuesEncoder = undefined;
  var client_common_1 = require_dist2();
  var stream_1 = __importDefault(__require("stream"));
  var stream_2 = require_stream2();

  class NodeValuesEncoder {
    json;
    constructor(customJSONConfig) {
      this.json = customJSONConfig;
    }
    encodeValues(values, format) {
      if ((0, stream_2.isStream)(values)) {
        if (!values.readableObjectMode) {
          return values;
        }
        return stream_1.default.pipeline(values, (0, stream_2.mapStream)((value) => (0, client_common_1.encodeJSON)(value, format, this.json.stringify)), pipelineCb);
      }
      if (Array.isArray(values)) {
        return values.map((value) => (0, client_common_1.encodeJSON)(value, format, this.json.stringify)).join("");
      }
      if (typeof values === "object") {
        return (0, client_common_1.encodeJSON)(values, format, this.json.stringify);
      }
      throw new Error(`Cannot encode values of type ${typeof values} with ${format} format`);
    }
    validateInsertValues(values, format) {
      if (!Array.isArray(values) && !(0, stream_2.isStream)(values) && typeof values !== "object") {
        throw new Error('Insert expected "values" to be an array, a stream of values or a JSON object, ' + `got: ${typeof values}`);
      }
      if ((0, stream_2.isStream)(values)) {
        if ((0, client_common_1.isSupportedRawFormat)(format)) {
          if (values.readableObjectMode) {
            throw new Error(`Insert for ${format} expected Readable Stream with disabled object mode.`);
          }
        } else if (!values.readableObjectMode) {
          throw new Error(`Insert for ${format} expected Readable Stream with enabled object mode.`);
        }
      }
    }
  }
  exports.NodeValuesEncoder = NodeValuesEncoder;
  function pipelineCb(err) {
    if (err) {
      console.error(err);
    }
  }
});

// node_modules/@clickhouse/client/dist/utils/process.js
var require_process = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getProcessVersion = getProcessVersion;
  function getProcessVersion() {
    return process.version;
  }
});

// node_modules/@clickhouse/client/dist/version.js
var require_version = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.default = "1.18.2";
});

// node_modules/@clickhouse/client/dist/utils/runtime.js
var require_runtime = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
  } : function(o, v) {
    o["default"] = v;
  });
  var __importStar = exports && exports.__importStar || function() {
    var ownKeys = function(o) {
      ownKeys = Object.getOwnPropertyNames || function(o2) {
        var ar = [];
        for (var k in o2)
          if (Object.prototype.hasOwnProperty.call(o2, k))
            ar[ar.length] = k;
        return ar;
      };
      return ownKeys(o);
    };
    return function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k = ownKeys(mod), i = 0;i < k.length; i++)
          if (k[i] !== "default")
            __createBinding(result, mod, k[i]);
      }
      __setModuleDefault(result, mod);
      return result;
    };
  }();
  var __importDefault = exports && exports.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Runtime = undefined;
  var os = __importStar(__require("os"));
  var version_1 = __importDefault(require_version());

  class Runtime {
    static package = version_1.default;
    static node = process.version;
    static os = os.platform();
  }
  exports.Runtime = Runtime;
});

// node_modules/@clickhouse/client/dist/utils/user_agent.js
var require_user_agent = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.getUserAgent = getUserAgent;
  var runtime_1 = require_runtime();
  function getUserAgent(application_id) {
    const defaultUserAgent = `clickhouse-js/${runtime_1.Runtime.package} (lv:nodejs/${runtime_1.Runtime.node}; os:${runtime_1.Runtime.os})`;
    return application_id ? `${application_id} ${defaultUserAgent}` : defaultUserAgent;
  }
});

// node_modules/@clickhouse/client/dist/utils/index.js
var require_utils3 = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_stream2(), exports);
  __exportStar(require_encoder(), exports);
  __exportStar(require_process(), exports);
  __exportStar(require_user_agent(), exports);
});

// node_modules/@clickhouse/client/dist/connection/compression.js
var require_compression = __commonJS((exports) => {
  var __importDefault = exports && exports.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.decompressResponse = decompressResponse;
  exports.isDecompressionError = isDecompressionError;
  var client_common_1 = require_dist2();
  var stream_1 = __importDefault(__require("stream"));
  var zlib_1 = __importDefault(__require("zlib"));
  function decompressResponse(response, log_writer, log_level) {
    const encoding = response.headers["content-encoding"];
    if (encoding === "gzip") {
      return {
        response: stream_1.default.pipeline(response, zlib_1.default.createGunzip(), function pipelineCb(err) {
          if (err) {
            if (log_level <= client_common_1.ClickHouseLogLevel.ERROR) {
              log_writer.error({
                message: "An error occurred while decompressing the response",
                err
              });
            }
          }
        })
      };
    } else if (encoding !== undefined) {
      return {
        error: new Error(`Unexpected encoding: ${encoding}`)
      };
    }
    return { response };
  }
  function isDecompressionError(result) {
    return result.error !== undefined;
  }
});

// node_modules/@clickhouse/client/dist/connection/stream.js
var require_stream3 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.drainStream = drainStream;
  exports.drainStreamInternal = drainStreamInternal;
  var client_common_1 = require_dist2();
  async function drainStream(stream) {
    return new Promise((resolve, reject) => {
      if (stream.errored) {
        reject(stream.errored);
        return;
      }
      if (stream.readableEnded) {
        resolve();
        return;
      }
      if (stream.closed) {
        resolve();
        return;
      }
      function dropData() {}
      function onEnd() {
        removeListeners();
        resolve();
      }
      function onError(err) {
        removeListeners();
        reject(err);
      }
      function onClose() {
        removeListeners();
        resolve();
      }
      function removeListeners() {
        stream.removeListener("data", dropData);
        stream.removeListener("end", onEnd);
        stream.removeListener("error", onError);
        stream.removeListener("close", onClose);
      }
      stream.on("data", dropData);
      stream.on("end", onEnd);
      stream.on("error", onError);
      stream.on("close", onClose);
    });
  }
  async function drainStreamInternal(ctx, stream) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let bytesReceived = 0;
      let chunkCount = 0;
      if (ctx.log_level <= client_common_1.ClickHouseLogLevel.TRACE) {
        ctx.log_writer.trace({
          message: `${ctx.op}: starting stream drain`,
          args: {
            query_id: ctx.query_id,
            stream_state: {
              readable: stream.readable,
              readableEnded: stream.readableEnded,
              readableLength: stream.readableLength
            }
          }
        });
      }
      if (stream.errored) {
        if (ctx.log_level <= client_common_1.ClickHouseLogLevel.TRACE) {
          ctx.log_writer.trace({
            message: `${ctx.op}: stream already errored before drain`,
            args: {
              query_id: ctx.query_id,
              chunk_number: chunkCount,
              total_bytes_received: bytesReceived
            }
          });
        }
        reject(stream.errored);
        return;
      }
      if (stream.readableEnded) {
        if (ctx.log_level <= client_common_1.ClickHouseLogLevel.TRACE) {
          ctx.log_writer.trace({
            message: `${ctx.op}: stream already ended before drain`,
            args: {
              query_id: ctx.query_id,
              chunk_number: chunkCount,
              total_bytes_received: bytesReceived
            }
          });
        }
        resolve();
        return;
      }
      if (stream.closed) {
        if (ctx.log_level <= client_common_1.ClickHouseLogLevel.TRACE) {
          ctx.log_writer.trace({
            message: `${ctx.op}: stream already closed before drain`,
            args: {
              query_id: ctx.query_id,
              chunk_number: chunkCount,
              total_bytes_received: bytesReceived
            }
          });
        }
        resolve();
        return;
      }
      function dropData(chunk) {
        if (ctx.log_level <= client_common_1.ClickHouseLogLevel.TRACE) {
          chunkCount++;
          const chunk_size = Buffer.byteLength(chunk);
          bytesReceived += chunk_size;
          ctx.log_writer.trace({
            message: `${ctx.op}: received data chunk during drain`,
            args: {
              query_id: ctx.query_id,
              chunk_number: chunkCount,
              chunk_size,
              total_bytes_received: bytesReceived
            }
          });
        }
      }
      function onEnd() {
        removeListeners();
        if (ctx.log_level <= client_common_1.ClickHouseLogLevel.TRACE) {
          const duration3 = Date.now() - startTime;
          ctx.log_writer.trace({
            message: `${ctx.op}: stream drain completed (end event)`,
            args: {
              query_id: ctx.query_id,
              duration_ms: duration3,
              total_bytes_received: bytesReceived,
              total_chunks: chunkCount
            }
          });
        }
        resolve();
      }
      function onError(err) {
        removeListeners();
        if (ctx.log_level <= client_common_1.ClickHouseLogLevel.TRACE) {
          const duration3 = Date.now() - startTime;
          ctx.log_writer.trace({
            message: `${ctx.op}: stream drain failed (error event)`,
            args: {
              query_id: ctx.query_id,
              duration_ms: duration3,
              total_bytes_received: bytesReceived,
              total_chunks: chunkCount,
              error: err.message
            }
          });
        }
        reject(err);
      }
      function onClose() {
        removeListeners();
        if (ctx.log_level <= client_common_1.ClickHouseLogLevel.TRACE) {
          const duration3 = Date.now() - startTime;
          ctx.log_writer.trace({
            message: `${ctx.op}: stream closed during drain (close event)`,
            args: {
              query_id: ctx.query_id,
              duration_ms: duration3,
              total_bytes_received: bytesReceived,
              total_chunks: chunkCount
            }
          });
        }
        resolve();
      }
      function removeListeners() {
        stream.removeListener("data", dropData);
        stream.removeListener("end", onEnd);
        stream.removeListener("error", onError);
        stream.removeListener("close", onClose);
      }
      stream.on("data", dropData);
      stream.on("end", onEnd);
      stream.on("error", onError);
      stream.on("close", onClose);
    });
  }
});

// node_modules/@clickhouse/client/dist/connection/node_base_connection.js
var require_node_base_connection = __commonJS((exports) => {
  var __importDefault = exports && exports.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.NodeBaseConnection = undefined;
  var client_common_1 = require_dist2();
  var crypto_1 = __importDefault(__require("crypto"));
  var stream_1 = __importDefault(__require("stream"));
  var zlib_1 = __importDefault(__require("zlib"));
  var utils_1 = require_utils3();
  var compression_1 = require_compression();
  var stream_2 = require_stream3();

  class NodeBaseConnection {
    params;
    agent;
    defaultAuthHeader;
    defaultHeaders;
    jsonHandling;
    knownSockets = new WeakMap;
    connectionId = crypto_1.default.randomUUID();
    socketCounter = 0;
    requestCounter = 0;
    getNewSocketId() {
      this.socketCounter += 1;
      return `${this.connectionId}:${this.socketCounter}`;
    }
    getNewRequestId() {
      this.requestCounter += 1;
      return `${this.connectionId}:${this.requestCounter}`;
    }
    constructor(params, agent) {
      this.params = params;
      this.agent = agent;
      if (params.auth.type === "Credentials") {
        this.defaultAuthHeader = `Basic ${Buffer.from(`${params.auth.username}:${params.auth.password}`).toString("base64")}`;
      } else if (params.auth.type === "JWT") {
        this.defaultAuthHeader = `Bearer ${params.auth.access_token}`;
      } else {
        throw new Error(`Unknown auth type: ${params.auth.type}`);
      }
      this.defaultHeaders = {
        Connection: this.params.keep_alive.enabled ? "keep-alive" : "close",
        "User-Agent": (0, utils_1.getUserAgent)(this.params.application_id)
      };
      this.jsonHandling = params.json ?? {
        parse: JSON.parse,
        stringify: JSON.stringify
      };
    }
    async ping(params) {
      const { log_writer, log_level } = this.params;
      const query_id = this.getQueryId(params.query_id);
      const { controller, controllerCleanup } = this.getAbortController(params);
      try {
        let result;
        if (params.select) {
          const searchParams = (0, client_common_1.toSearchParams)({
            database: undefined,
            query: PingQuery,
            query_id
          });
          result = await this.request({
            query: PingQuery,
            method: "GET",
            url: (0, client_common_1.transformUrl)({ url: this.params.url, searchParams }),
            abort_signal: controller.signal,
            headers: this.buildRequestHeaders(),
            query_id,
            log_writer,
            log_level
          }, "Ping");
        } else {
          result = await this.request({
            query: "ping",
            method: "GET",
            url: (0, client_common_1.transformUrl)({ url: this.params.url, pathname: "/ping" }),
            abort_signal: controller.signal,
            headers: this.buildRequestHeaders(),
            query_id,
            log_writer,
            log_level
          }, "Ping");
        }
        await (0, stream_2.drainStreamInternal)({
          op: "Ping",
          log_writer,
          query_id,
          log_level
        }, result.stream);
        return { success: true };
      } catch (error2) {
        controller.abort("Ping failed");
        if (log_level <= client_common_1.ClickHouseLogLevel.WARN) {
          log_writer.warn({
            message: this.httpRequestErrorMessage("Ping"),
            err: error2,
            args: {
              connection_id: this.connectionId,
              query_id
            }
          });
        }
        return {
          success: false,
          error: error2
        };
      } finally {
        controllerCleanup();
      }
    }
    async query(params) {
      const { log_writer, log_level } = this.params;
      const query_id = this.getQueryId(params.query_id);
      const clickhouse_settings = (0, client_common_1.withHttpSettings)(params.clickhouse_settings, this.params.compression.decompress_response);
      const searchParams = (0, client_common_1.toSearchParams)({
        database: this.params.database,
        query_params: params.query_params,
        session_id: params.session_id,
        clickhouse_settings,
        query_id,
        role: params.role
      });
      const { controller, controllerCleanup } = this.getAbortController(params);
      const enableResponseCompression = clickhouse_settings.enable_http_compression === 1;
      try {
        const { response_headers, stream, http_status_code } = await this.request({
          method: "POST",
          url: (0, client_common_1.transformUrl)({ url: this.params.url, searchParams }),
          body: params.query,
          abort_signal: controller.signal,
          enable_response_compression: enableResponseCompression,
          headers: this.buildRequestHeaders(params),
          query: params.query,
          query_id,
          log_writer,
          log_level
        }, "Query");
        return {
          stream,
          response_headers,
          query_id,
          http_status_code
        };
      } catch (err) {
        controller.abort("Query HTTP request failed");
        this.logRequestError({
          op: "Query",
          query_id,
          query_params: params,
          search_params: searchParams,
          err,
          extra_args: {
            decompress_response: enableResponseCompression,
            clickhouse_settings
          }
        });
        throw err;
      } finally {
        controllerCleanup();
      }
    }
    async insert(params) {
      const { log_writer, log_level } = this.params;
      const query_id = this.getQueryId(params.query_id);
      const searchParams = (0, client_common_1.toSearchParams)({
        database: this.params.database,
        clickhouse_settings: params.clickhouse_settings,
        query_params: params.query_params,
        query: params.query,
        session_id: params.session_id,
        role: params.role,
        query_id
      });
      const { controller, controllerCleanup } = this.getAbortController(params);
      try {
        const { stream, summary, response_headers, http_status_code } = await this.request({
          method: "POST",
          url: (0, client_common_1.transformUrl)({ url: this.params.url, searchParams }),
          body: params.values,
          abort_signal: controller.signal,
          enable_request_compression: this.params.compression.compress_request,
          parse_summary: true,
          headers: this.buildRequestHeaders(params),
          query: params.query,
          query_id,
          log_writer,
          log_level
        }, "Insert");
        await (0, stream_2.drainStreamInternal)({
          op: "Insert",
          log_writer,
          query_id,
          log_level
        }, stream);
        return { query_id, summary, response_headers, http_status_code };
      } catch (err) {
        controller.abort("Insert HTTP request failed");
        this.logRequestError({
          op: "Insert",
          query_id,
          query_params: params,
          search_params: searchParams,
          err,
          extra_args: {
            clickhouse_settings: params.clickhouse_settings ?? {}
          }
        });
        throw err;
      } finally {
        controllerCleanup();
      }
    }
    async exec(params) {
      const query_id = this.getQueryId(params.query_id);
      return this.runExec({
        ...params,
        query_id,
        op: "Exec"
      });
    }
    async command(params) {
      const { log_writer, log_level } = this.params;
      const query_id = this.getQueryId(params.query_id);
      const commandStartTime = Date.now();
      if (log_level <= client_common_1.ClickHouseLogLevel.TRACE) {
        log_writer.trace({
          message: "Command: operation started",
          args: {
            operation: "Command",
            connection_id: this.connectionId,
            query_id
          }
        });
      }
      const { stream, summary, response_headers } = await this.runExec({
        ...params,
        query_id,
        op: "Command"
      });
      const runExecDuration = Date.now() - commandStartTime;
      if (log_level <= client_common_1.ClickHouseLogLevel.TRACE) {
        log_writer.trace({
          message: "Command: runExec completed, starting stream drain",
          args: {
            operation: "Command",
            connection_id: this.connectionId,
            query_id,
            runExec_duration_ms: runExecDuration,
            stream_state: {
              readable: stream.readable,
              readableEnded: stream.readableEnded,
              readableLength: stream.readableLength
            }
          }
        });
      }
      const drainStartTime = Date.now();
      await (0, stream_2.drainStreamInternal)({
        op: "Command",
        log_writer,
        query_id,
        log_level
      }, stream);
      if (log_level <= client_common_1.ClickHouseLogLevel.TRACE) {
        const drainDuration = Date.now() - drainStartTime;
        const totalDuration = Date.now() - commandStartTime;
        log_writer.trace({
          message: "Command: operation completed",
          args: {
            operation: "Command",
            connection_id: this.connectionId,
            query_id,
            drain_duration_ms: drainDuration,
            total_duration_ms: totalDuration
          }
        });
      }
      return { query_id, summary, response_headers };
    }
    async close() {
      if (this.agent !== undefined && this.agent.destroy !== undefined) {
        this.agent.destroy();
      }
    }
    defaultHeadersWithOverride(params) {
      return {
        ...this.params.http_headers ?? {},
        ...params?.http_headers ?? {},
        ...this.defaultHeaders
      };
    }
    buildRequestHeaders(params) {
      const headers = this.defaultHeadersWithOverride(params);
      if ((0, client_common_1.isJWTAuth)(params?.auth)) {
        return {
          ...headers,
          Authorization: `Bearer ${params.auth.access_token}`
        };
      }
      if (this.params.set_basic_auth_header) {
        if ((0, client_common_1.isCredentialsAuth)(params?.auth)) {
          return {
            ...headers,
            Authorization: `Basic ${Buffer.from(`${params.auth.username}:${params.auth.password}`).toString("base64")}`
          };
        } else {
          return {
            ...headers,
            Authorization: this.defaultAuthHeader
          };
        }
      }
      return {
        ...headers
      };
    }
    getQueryId(query_id) {
      return query_id || crypto_1.default.randomUUID();
    }
    getAbortController(params) {
      const controller = new AbortController;
      function onAbort() {
        controller.abort();
      }
      params.abort_signal?.addEventListener("abort", onAbort);
      return {
        controller,
        controllerCleanup: () => {
          params.abort_signal?.removeEventListener("abort", onAbort);
        }
      };
    }
    logRequestError({ op, err, query_id, query_params, extra_args }) {
      if (this.params.log_level <= client_common_1.ClickHouseLogLevel.ERROR) {
        this.params.log_writer.error({
          message: this.httpRequestErrorMessage(op),
          err,
          args: {
            operation: op,
            connection_id: this.connectionId,
            query_id,
            with_abort_signal: query_params.abort_signal !== undefined,
            session_id: query_params.session_id,
            ...extra_args
          }
        });
      }
    }
    httpRequestErrorMessage(op) {
      return `${op}: HTTP request error.`;
    }
    parseSummary(op, response) {
      const summaryHeader = response.headers["x-clickhouse-summary"];
      if (typeof summaryHeader === "string") {
        try {
          return this.jsonHandling.parse(summaryHeader);
        } catch (err) {
          if (this.params.log_level <= client_common_1.ClickHouseLogLevel.ERROR) {
            this.params.log_writer.error({
              message: `${op}: failed to parse X-ClickHouse-Summary header.`,
              args: {
                operation: op,
                connection_id: this.connectionId,
                "X-ClickHouse-Summary": summaryHeader
              },
              err
            });
          }
        }
      }
    }
    async runExec(params) {
      const { log_writer, log_level } = this.params;
      const query_id = params.query_id;
      const sendQueryInParams = params.values !== undefined;
      const clickhouse_settings = (0, client_common_1.withHttpSettings)(params.clickhouse_settings, this.params.compression.decompress_response);
      const toSearchParamsOptions = {
        query: sendQueryInParams ? params.query : undefined,
        database: this.params.database,
        query_params: params.query_params,
        session_id: params.session_id,
        role: params.role,
        clickhouse_settings,
        query_id
      };
      const searchParams = (0, client_common_1.toSearchParams)(toSearchParamsOptions);
      const { controller, controllerCleanup } = this.getAbortController(params);
      const tryDecompressResponseStream = params.op === "Exec" ? params.decompress_response_stream ?? this.params.compression.decompress_response : false;
      const ignoreErrorResponse = params.ignore_error_response ?? false;
      try {
        const { stream, summary, response_headers, http_status_code } = await this.request({
          method: "POST",
          url: (0, client_common_1.transformUrl)({ url: this.params.url, searchParams }),
          body: sendQueryInParams ? params.values : params.query,
          abort_signal: controller.signal,
          parse_summary: true,
          enable_request_compression: this.params.compression.compress_request,
          enable_response_compression: this.params.compression.decompress_response,
          try_decompress_response_stream: tryDecompressResponseStream,
          ignore_error_response: ignoreErrorResponse,
          headers: this.buildRequestHeaders(params),
          query: params.query,
          query_id,
          log_writer,
          log_level
        }, params.op);
        return {
          stream,
          query_id,
          summary,
          response_headers,
          http_status_code
        };
      } catch (err) {
        controller.abort(`${params.op} HTTP request failed`);
        this.logRequestError({
          op: params.op,
          query_id,
          query_params: params,
          search_params: searchParams,
          err,
          extra_args: {
            clickhouse_settings: params.clickhouse_settings ?? {}
          }
        });
        throw err;
      } finally {
        controllerCleanup();
      }
    }
    async request(params, op) {
      await (0, client_common_1.sleep)(0);
      const { log_writer, query_id, log_level } = params;
      const currentStackTrace = this.params.capture_enhanced_stack_trace ? (0, client_common_1.getCurrentStackTrace)() : undefined;
      const requestTimeout = this.params.request_timeout;
      return new Promise((resolve, reject) => {
        const start = Date.now();
        const request = this.createClientRequest(params);
        const request_id = this.getNewRequestId();
        const onError = (e) => {
          removeRequestListeners();
          if (e instanceof Error) {
            if (log_level <= client_common_1.ClickHouseLogLevel.TRACE) {
              if (e.code === "ECONNRESET") {
                log_writer.trace({
                  message: `${op}: connection reset by peer`,
                  args: {
                    operation: op,
                    connection_id: this.connectionId,
                    query_id,
                    request_id
                  },
                  module: "HTTP Adapter"
                });
              }
            }
            if (log_level <= client_common_1.ClickHouseLogLevel.WARN) {
              if (this.params.keep_alive.enabled) {
                if (e.code === "ECONNRESET") {
                  const socket = request.socket;
                  if (socket) {
                    const socketInfo = this.knownSockets.get(socket);
                    if (socketInfo) {
                      const serverTimeoutMs = socketInfo.server_keep_alive_timeout_ms;
                      if (serverTimeoutMs !== undefined) {
                        if (this.params.keep_alive.idle_socket_ttl > serverTimeoutMs) {
                          log_writer.warn({
                            message: `${op}: idle socket TTL is greater than server keep-alive timeout, try setting idle socket TTL to a value lower than the server keep-alive timeout to prevent unexpected connection resets, see https://c.house/js_keep_alive_econnreset for more details.`,
                            args: {
                              operation: op,
                              connection_id: this.connectionId,
                              query_id,
                              request_id,
                              socket_id: socketInfo.id,
                              server_keep_alive_timeout_ms: serverTimeoutMs,
                              idle_socket_ttl: this.params.keep_alive.idle_socket_ttl
                            },
                            module: "HTTP Adapter"
                          });
                        }
                      }
                    }
                  }
                }
              }
            }
            const err = (0, client_common_1.enhanceStackTrace)(e, currentStackTrace);
            reject(err);
          } else {
            reject(e);
          }
        };
        let responseStream;
        const onResponse = async (_response) => {
          if (this.params.log_level <= client_common_1.ClickHouseLogLevel.DEBUG) {
            const duration3 = Date.now() - start;
            this.params.log_writer.debug({
              module: "HTTP Adapter",
              message: `${op}: got a response from ClickHouse`,
              args: {
                operation: op,
                connection_id: this.connectionId,
                query_id,
                request_id,
                request_method: params.method,
                request_path: params.url.pathname,
                response_status: _response.statusCode,
                response_time_ms: duration3
              }
            });
          }
          if (this.params.keep_alive.enabled) {
            const keepAliveHeader = _response.headers["keep-alive"];
            if (keepAliveHeader) {
              const [, timeout] = /timeout=(\d+)/i.exec(String(keepAliveHeader)) ?? [];
              if (timeout) {
                const socketInfo = this.knownSockets.get(_response.socket);
                if (socketInfo) {
                  const timeoutMs = Number(timeout) * 1000;
                  socketInfo.server_keep_alive_timeout_ms = timeoutMs;
                  if (log_level <= client_common_1.ClickHouseLogLevel.TRACE) {
                    this.params.log_writer.trace({
                      module: "HTTP Adapter",
                      message: `${op}: updated server sent socket keep-alive timeout`,
                      args: {
                        operation: op,
                        connection_id: this.connectionId,
                        query_id,
                        request_id,
                        socket_id: socketInfo.id,
                        server_keep_alive_timeout_ms: timeoutMs
                      }
                    });
                  }
                }
              }
            }
          }
          const tryDecompressResponseStream = params.try_decompress_response_stream ?? true;
          const ignoreErrorResponse = params.ignore_error_response ?? false;
          const isFailedResponse = !(0, client_common_1.isSuccessfulResponse)(_response.statusCode);
          if (tryDecompressResponseStream || isFailedResponse && !ignoreErrorResponse) {
            const decompressionResult = (0, compression_1.decompressResponse)(_response, log_writer, log_level);
            if ((0, compression_1.isDecompressionError)(decompressionResult)) {
              const err = (0, client_common_1.enhanceStackTrace)(decompressionResult.error, currentStackTrace);
              return reject(err);
            }
            responseStream = decompressionResult.response;
          } else {
            responseStream = _response;
          }
          if (log_level <= client_common_1.ClickHouseLogLevel.TRACE) {
            log_writer.trace({
              message: `${op}: response stream created`,
              args: {
                operation: op,
                connection_id: this.connectionId,
                query_id,
                request_id,
                stream_state: {
                  readable: responseStream.readable,
                  readableEnded: responseStream.readableEnded,
                  readableLength: responseStream.readableLength
                },
                is_failed_response: isFailedResponse,
                will_decompress: tryDecompressResponseStream
              }
            });
          }
          if (isFailedResponse && !ignoreErrorResponse) {
            try {
              const errorMessage = await (0, utils_1.getAsText)(responseStream);
              const err = (0, client_common_1.enhanceStackTrace)((0, client_common_1.parseError)(errorMessage), currentStackTrace);
              reject(err);
            } catch (e) {
              const err = (0, client_common_1.enhanceStackTrace)(e, currentStackTrace);
              reject(err);
            }
          } else {
            return resolve({
              stream: responseStream,
              summary: params.parse_summary ? this.parseSummary(op, _response) : undefined,
              response_headers: { ..._response.headers },
              http_status_code: _response.statusCode ?? undefined
            });
          }
        };
        function onAbort() {
          removeRequestListeners();
          request.once("error", function() {});
          const err = (0, client_common_1.enhanceStackTrace)(new Error("The user aborted a request."), currentStackTrace);
          reject(err);
        }
        function onClose() {
          removeRequestListeners();
        }
        function pipeStream() {
          if (request.writableEnded) {
            return;
          }
          const bodyStream = (0, utils_1.isStream)(params.body) ? params.body : stream_1.default.Readable.from([params.body]);
          const callback = (e) => {
            if (e) {
              removeRequestListeners();
              const err = (0, client_common_1.enhanceStackTrace)(e, currentStackTrace);
              reject(err);
            }
          };
          if (params.enable_request_compression) {
            stream_1.default.pipeline(bodyStream, zlib_1.default.createGzip(), request, callback);
          } else {
            stream_1.default.pipeline(bodyStream, request, callback);
          }
        }
        const onSocket = (socket) => {
          try {
            if (this.params.keep_alive.enabled && this.params.keep_alive.idle_socket_ttl > 0) {
              const socketInfo = this.knownSockets.get(socket);
              if (socketInfo === undefined) {
                const socket_id = this.getNewSocketId();
                if (log_level <= client_common_1.ClickHouseLogLevel.TRACE) {
                  log_writer.trace({
                    message: `${op}: using a fresh socket, setting up a new 'free' listener`,
                    args: {
                      operation: op,
                      connection_id: this.connectionId,
                      query_id,
                      request_id,
                      socket_id
                    }
                  });
                }
                const newSocketInfo = {
                  id: socket_id,
                  idle_timeout_handle: undefined,
                  usage_count: 1
                };
                this.knownSockets.set(socket, newSocketInfo);
                socket.on("free", () => {
                  if (log_level <= client_common_1.ClickHouseLogLevel.TRACE) {
                    log_writer.trace({
                      message: `${op}: socket was released`,
                      args: {
                        operation: op,
                        connection_id: this.connectionId,
                        query_id,
                        request_id,
                        socket_id
                      }
                    });
                  }
                  const idleTimeoutHandle = setTimeout(() => {
                    if (log_level <= client_common_1.ClickHouseLogLevel.TRACE) {
                      log_writer.trace({
                        message: `${op}: removing idle socket`,
                        args: {
                          operation: op,
                          connection_id: this.connectionId,
                          query_id,
                          request_id,
                          socket_id,
                          idle_socket_ttl_ms: this.params.keep_alive.idle_socket_ttl
                        }
                      });
                    }
                    this.knownSockets.delete(socket);
                    socket.destroy();
                  }, this.params.keep_alive.idle_socket_ttl).unref();
                  newSocketInfo.idle_timeout_handle = idleTimeoutHandle;
                });
                const cleanup = (eventName) => () => {
                  const maybeSocketInfo = this.knownSockets.get(socket);
                  if (maybeSocketInfo?.idle_timeout_handle) {
                    clearTimeout(maybeSocketInfo.idle_timeout_handle);
                  }
                  if (log_level <= client_common_1.ClickHouseLogLevel.TRACE) {
                    log_writer.trace({
                      message: `${op}: received '${eventName}' event, 'free' listener removed`,
                      args: {
                        operation: op,
                        connection_id: this.connectionId,
                        query_id,
                        request_id,
                        socket_id,
                        event: eventName
                      }
                    });
                  }
                  if (log_level <= client_common_1.ClickHouseLogLevel.WARN) {
                    if (responseStream && !responseStream.readableEnded) {
                      log_writer.warn({
                        message: `${op}: socket was closed or ended before the response was fully read. ` + "This can potentially result in an uncaught ECONNRESET error! " + "Consider fully consuming, draining, or destroying the response stream.",
                        args: {
                          operation: op,
                          connection_id: this.connectionId,
                          query_id,
                          request_id,
                          socket_id,
                          event: eventName
                        }
                      });
                    }
                  }
                };
                socket.once("end", cleanup("end"));
                socket.once("close", cleanup("close"));
              } else {
                clearTimeout(socketInfo.idle_timeout_handle);
                socketInfo.idle_timeout_handle = undefined;
                if (log_level <= client_common_1.ClickHouseLogLevel.TRACE) {
                  log_writer.trace({
                    message: `${op}: reusing socket`,
                    args: {
                      operation: op,
                      connection_id: this.connectionId,
                      query_id,
                      request_id,
                      socket_id: socketInfo.id,
                      usage_count: socketInfo.usage_count
                    }
                  });
                }
                socketInfo.usage_count++;
              }
            }
          } catch (e) {
            if (log_level <= client_common_1.ClickHouseLogLevel.ERROR) {
              log_writer.error({
                message: `${op}: an error occurred while housekeeping the idle sockets`,
                err: e,
                args: {
                  operation: op,
                  connection_id: this.connectionId,
                  query_id,
                  request_id
                }
              });
            }
          }
          pipeStream();
          if (log_level <= client_common_1.ClickHouseLogLevel.TRACE) {
            const socketInfo = this.knownSockets.get(socket);
            if (socketInfo) {
              log_writer.trace({
                message: `${op}: setting up request timeout`,
                args: {
                  operation: op,
                  connection_id: this.connectionId,
                  query_id,
                  request_id,
                  socket_id: socketInfo.id,
                  timeout_ms: requestTimeout
                }
              });
            } else {
              log_writer.trace({
                message: `${op}: setting up request timeout on a socket`,
                args: {
                  operation: op,
                  connection_id: this.connectionId,
                  query_id,
                  request_id,
                  timeout_ms: requestTimeout
                }
              });
            }
          }
          socket.setTimeout(this.params.request_timeout, onTimeout);
        };
        const onTimeout = () => {
          removeRequestListeners();
          if (log_level <= client_common_1.ClickHouseLogLevel.TRACE) {
            const socket = request.socket;
            const maybeSocketInfo = socket ? this.knownSockets.get(socket) : undefined;
            const socketState = request.socket ? {
              connecting: request.socket.connecting,
              pending: request.socket.pending,
              destroyed: request.socket.destroyed,
              readyState: request.socket.readyState
            } : undefined;
            const responseStreamState = responseStream ? {
              readable: responseStream.readable,
              readableEnded: responseStream.readableEnded,
              readableLength: responseStream.readableLength
            } : undefined;
            log_writer.trace({
              message: `${op}: timeout occurred`,
              args: {
                operation: op,
                connection_id: this.connectionId,
                query_id,
                request_id,
                socket_id: maybeSocketInfo?.id,
                timeout_ms: requestTimeout,
                socket_state: socketState,
                response_stream_state: responseStreamState,
                has_response_stream: responseStream !== undefined
              }
            });
          }
          const err = (0, client_common_1.enhanceStackTrace)(new Error("Timeout error."), currentStackTrace);
          try {
            request.destroy();
          } catch (e) {
            if (log_level <= client_common_1.ClickHouseLogLevel.ERROR) {
              log_writer.error({
                message: `${op}: An error occurred while destroying the request`,
                err: e,
                args: {
                  operation: op,
                  connection_id: this.connectionId,
                  query_id,
                  request_id
                }
              });
            }
          }
          reject(err);
        };
        function removeRequestListeners() {
          if (request.socket) {
            request.socket.setTimeout(0);
            request.socket.removeListener("timeout", onTimeout);
          }
          request.removeListener("socket", onSocket);
          request.removeListener("response", onResponse);
          request.removeListener("error", onError);
          request.removeListener("close", onClose);
          if (params.abort_signal) {
            request.removeListener("abort", onAbort);
          }
        }
        request.on("socket", onSocket);
        request.on("response", onResponse);
        request.on("error", onError);
        request.on("close", onClose);
        if (params.abort_signal) {
          params.abort_signal.addEventListener("abort", onAbort, {
            once: true
          });
        }
        if (!params.body) {
          try {
            return request.end();
          } catch (e) {
            if (log_level <= client_common_1.ClickHouseLogLevel.ERROR) {
              log_writer.error({
                message: `${op}: an error occurred while ending the request without body`,
                err: e,
                args: {
                  operation: op,
                  connection_id: this.connectionId,
                  query_id,
                  request_id
                }
              });
            }
          }
        }
      });
    }
  }
  exports.NodeBaseConnection = NodeBaseConnection;
  var PingQuery = `SELECT 'ping'`;
});

// node_modules/@clickhouse/client/dist/connection/node_http_connection.js
var require_node_http_connection = __commonJS((exports) => {
  var __importDefault = exports && exports.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.NodeHttpConnection = undefined;
  var client_common_1 = require_dist2();
  var http_1 = __importDefault(__require("http"));
  var node_base_connection_1 = require_node_base_connection();

  class NodeHttpConnection extends node_base_connection_1.NodeBaseConnection {
    constructor(params) {
      const agent = new http_1.default.Agent({
        keepAlive: params.keep_alive.enabled,
        maxSockets: params.max_open_connections
      });
      super(params, agent);
    }
    createClientRequest(params) {
      const headers = (0, client_common_1.withCompressionHeaders)({
        headers: params.headers,
        enable_request_compression: params.enable_request_compression,
        enable_response_compression: params.enable_response_compression
      });
      return http_1.default.request(params.url, {
        method: params.method,
        agent: this.agent,
        timeout: this.params.request_timeout,
        signal: params.abort_signal,
        headers
      });
    }
  }
  exports.NodeHttpConnection = NodeHttpConnection;
});

// node_modules/@clickhouse/client/dist/connection/node_https_connection.js
var require_node_https_connection = __commonJS((exports) => {
  var __importDefault = exports && exports.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.NodeHttpsConnection = undefined;
  var client_common_1 = require_dist2();
  var https_1 = __importDefault(__require("https"));
  var node_base_connection_1 = require_node_base_connection();

  class NodeHttpsConnection extends node_base_connection_1.NodeBaseConnection {
    constructor(params) {
      const agent = new https_1.default.Agent({
        keepAlive: params.keep_alive.enabled,
        maxSockets: params.max_open_connections,
        ca: params.tls?.ca_cert,
        key: params.tls?.type === "Mutual" ? params.tls.key : undefined,
        cert: params.tls?.type === "Mutual" ? params.tls.cert : undefined
      });
      super(params, agent);
    }
    buildRequestHeaders(params) {
      if (this.params.tls !== undefined) {
        if (this.params.auth.type === "JWT") {
          throw new Error("JWT auth is not supported with HTTPS connection using custom certificates");
        }
        let headers;
        if ((0, client_common_1.isCredentialsAuth)(params?.auth)) {
          headers = {
            ...this.defaultHeadersWithOverride(params),
            "X-ClickHouse-User": params.auth.username,
            "X-ClickHouse-Key": params.auth.password
          };
        } else {
          headers = {
            ...this.defaultHeadersWithOverride(params),
            "X-ClickHouse-User": this.params.auth.username,
            "X-ClickHouse-Key": this.params.auth.password
          };
        }
        const tlsType = this.params.tls.type;
        switch (tlsType) {
          case "Basic":
            return headers;
          case "Mutual":
            return {
              ...headers,
              "X-ClickHouse-SSL-Certificate-Auth": "on"
            };
          default:
            throw new Error(`Unknown TLS type: ${tlsType}`);
        }
      }
      return super.buildRequestHeaders(params);
    }
    createClientRequest(params) {
      const headers = (0, client_common_1.withCompressionHeaders)({
        headers: params.headers,
        enable_request_compression: params.enable_request_compression,
        enable_response_compression: params.enable_response_compression
      });
      return https_1.default.request(params.url, {
        method: params.method,
        agent: this.agent,
        timeout: this.params.request_timeout,
        signal: params.abort_signal,
        headers
      });
    }
  }
  exports.NodeHttpsConnection = NodeHttpsConnection;
});

// node_modules/@clickhouse/client/dist/connection/node_custom_agent_connection.js
var require_node_custom_agent_connection = __commonJS((exports) => {
  var __importDefault = exports && exports.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.NodeCustomAgentConnection = undefined;
  var http_1 = __importDefault(__require("http"));
  var https_1 = __importDefault(__require("https"));
  var node_base_connection_1 = require_node_base_connection();
  var client_common_1 = require_dist2();

  class NodeCustomAgentConnection extends node_base_connection_1.NodeBaseConnection {
    httpRequestFn;
    constructor(params) {
      if (!params.http_agent) {
        throw new Error("http_agent is required to create NodeCustomAgentConnection");
      }
      super(params, params.http_agent);
      if (params.url.protocol.startsWith("https")) {
        this.httpRequestFn = https_1.default.request;
      } else {
        this.httpRequestFn = http_1.default.request;
      }
    }
    createClientRequest(params) {
      const headers = (0, client_common_1.withCompressionHeaders)({
        headers: params.headers,
        enable_request_compression: params.enable_request_compression,
        enable_response_compression: params.enable_response_compression
      });
      return this.httpRequestFn(params.url, {
        method: params.method,
        agent: this.agent,
        timeout: this.params.request_timeout,
        signal: params.abort_signal,
        headers
      });
    }
  }
  exports.NodeCustomAgentConnection = NodeCustomAgentConnection;
});

// node_modules/@clickhouse/client/dist/connection/create_connection.js
var require_create_connection = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.NodeConnectionFactory = undefined;
  var node_custom_agent_connection_1 = require_node_custom_agent_connection();
  var node_http_connection_1 = require_node_http_connection();
  var node_https_connection_1 = require_node_https_connection();

  class NodeConnectionFactory {
    static create({ connection_params, tls, keep_alive, http_agent, set_basic_auth_header, capture_enhanced_stack_trace }) {
      if (http_agent !== undefined) {
        return new node_custom_agent_connection_1.NodeCustomAgentConnection({
          ...connection_params,
          set_basic_auth_header,
          capture_enhanced_stack_trace,
          keep_alive,
          http_agent
        });
      }
      switch (connection_params.url.protocol) {
        case "http:":
          return new node_http_connection_1.NodeHttpConnection({
            ...connection_params,
            set_basic_auth_header,
            capture_enhanced_stack_trace,
            keep_alive
          });
        case "https:":
          return new node_https_connection_1.NodeHttpsConnection({
            ...connection_params,
            set_basic_auth_header,
            capture_enhanced_stack_trace,
            keep_alive,
            tls
          });
        default:
          throw new Error("Only HTTP and HTTPS protocols are supported");
      }
    }
  }
  exports.NodeConnectionFactory = NodeConnectionFactory;
});

// node_modules/@clickhouse/client/dist/connection/index.js
var require_connection2 = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_node_base_connection(), exports);
  __exportStar(require_node_http_connection(), exports);
  __exportStar(require_node_https_connection(), exports);
  __exportStar(require_create_connection(), exports);
});

// node_modules/@clickhouse/client/dist/result_set.js
var require_result_set = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
  } : function(o, v) {
    o["default"] = v;
  });
  var __importStar = exports && exports.__importStar || function() {
    var ownKeys = function(o) {
      ownKeys = Object.getOwnPropertyNames || function(o2) {
        var ar = [];
        for (var k in o2)
          if (Object.prototype.hasOwnProperty.call(o2, k))
            ar[ar.length] = k;
        return ar;
      };
      return ownKeys(o);
    };
    return function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k = ownKeys(mod), i = 0;i < k.length; i++)
          if (k[i] !== "default")
            __createBinding(result, mod, k[i]);
      }
      __setModuleDefault(result, mod);
      return result;
    };
  }();
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ResultSet = undefined;
  var client_common_1 = require_dist2();
  var client_common_2 = require_dist2();
  var buffer_1 = __require("buffer");
  var stream_1 = __importStar(__require("stream"));
  var utils_1 = require_utils3();
  var NEWLINE = 10;

  class ResultSet {
    _stream;
    format;
    query_id;
    response_headers = {};
    exceptionTag = undefined;
    log_error;
    jsonHandling;
    constructor(_stream, format, query_id, log_error, _response_headers, jsonHandling) {
      this._stream = _stream;
      this.format = format;
      this.query_id = query_id;
      this.jsonHandling = {
        ...client_common_1.defaultJSONHandling,
        ...jsonHandling
      };
      this.log_error = log_error ?? ((err) => console.error(err));
      if (_response_headers !== undefined) {
        this.response_headers = Object.freeze(_response_headers);
        this.exceptionTag = _response_headers[client_common_1.EXCEPTION_TAG_HEADER_NAME];
      }
    }
    async text() {
      if (this._stream.readableEnded) {
        throw Error(streamAlreadyConsumedMessage);
      }
      return (await (0, utils_1.getAsText)(this._stream)).toString();
    }
    async json() {
      if (this._stream.readableEnded) {
        throw Error(streamAlreadyConsumedMessage);
      }
      if ((0, client_common_2.isStreamableJSONFamily)(this.format)) {
        const result = [];
        const stream = this.stream();
        for await (const rows of stream) {
          for (const row of rows) {
            result.push(row.json());
          }
        }
        return result;
      }
      if ((0, client_common_2.isNotStreamableJSONFamily)(this.format)) {
        const text = await (0, utils_1.getAsText)(this._stream);
        return this.jsonHandling.parse(text);
      }
      throw new Error(`Cannot decode ${this.format} as JSON`);
    }
    stream() {
      if (this._stream.readableEnded) {
        throw Error(streamAlreadyConsumedMessage);
      }
      (0, client_common_2.validateStreamFormat)(this.format);
      const incompleteChunks = [];
      const logError = this.log_error;
      const exceptionTag = this.exceptionTag;
      const jsonHandling = this.jsonHandling;
      const toRows = new stream_1.Transform({
        transform(chunk, _encoding, callback) {
          const rows = [];
          let lastIdx = 0;
          let currentChunkPart;
          while (true) {
            const idx = chunk.indexOf(NEWLINE, lastIdx);
            if (idx === -1) {
              incompleteChunks.push(chunk.subarray(lastIdx));
              if (rows.length > 0) {
                this.push(rows);
              }
              break;
            } else {
              if (exceptionTag !== undefined && idx >= 1 && chunk[idx - 1] === client_common_1.CARET_RETURN) {
                return callback((0, client_common_1.extractErrorAtTheEndOfChunk)(chunk, exceptionTag));
              }
              if (incompleteChunks.length > 0) {
                incompleteChunks.push(chunk.subarray(lastIdx, idx));
                currentChunkPart = buffer_1.Buffer.concat(incompleteChunks);
                incompleteChunks.length = 0;
              } else {
                currentChunkPart = chunk.subarray(lastIdx, idx);
              }
              const text = currentChunkPart.toString();
              rows.push({
                text,
                json() {
                  return jsonHandling.parse(text);
                }
              });
              lastIdx = idx + 1;
            }
          }
          callback();
        },
        autoDestroy: true,
        objectMode: true
      });
      const pipeline2 = stream_1.default.pipeline(this._stream, toRows, function pipelineCb(err) {
        if (err && err.name !== "AbortError" && err.message !== resultSetClosedMessage) {
          logError(err);
        }
      });
      return pipeline2;
    }
    close() {
      this._stream.destroy(new Error(resultSetClosedMessage));
    }
    [Symbol.dispose]() {
      this.close();
    }
    static instance({ stream, format, query_id, log_error, response_headers, jsonHandling }) {
      return new ResultSet(stream, format, query_id, log_error, response_headers, jsonHandling);
    }
  }
  exports.ResultSet = ResultSet;
  var streamAlreadyConsumedMessage = "Stream has been already consumed";
  var resultSetClosedMessage = "ResultSet has been closed";
});

// node_modules/@clickhouse/client/dist/config.js
var require_config2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.NodeConfigImpl = undefined;
  var client_common_1 = require_dist2();
  var connection_1 = require_connection2();
  var result_set_1 = require_result_set();
  var utils_1 = require_utils3();
  exports.NodeConfigImpl = {
    handle_specific_url_params: (config2, url) => {
      const nodeConfig = { ...config2 };
      const unknownParams = new Set;
      const handledParams = new Set;
      const urlSearchParamsKeys = [...url.searchParams.keys()];
      if (urlSearchParamsKeys.length > 0) {
        urlSearchParamsKeys.forEach((key) => {
          const value = url.searchParams.get(key);
          switch (key) {
            case "keep_alive_idle_socket_ttl":
              if (nodeConfig.keep_alive === undefined) {
                nodeConfig.keep_alive = {};
              }
              nodeConfig.keep_alive.idle_socket_ttl = (0, client_common_1.numberConfigURLValue)({
                key,
                value,
                min: 0
              });
              handledParams.add(key);
              break;
            default:
              unknownParams.add(key);
          }
        });
      }
      return {
        config: nodeConfig,
        unknown_params: unknownParams,
        handled_params: handledParams
      };
    },
    make_connection: (nodeConfig, params) => {
      let tls = undefined;
      if (nodeConfig.tls !== undefined) {
        if ("cert" in nodeConfig.tls && "key" in nodeConfig.tls) {
          tls = {
            type: "Mutual",
            ...nodeConfig.tls
          };
        } else {
          tls = {
            type: "Basic",
            ...nodeConfig.tls
          };
        }
      }
      const keep_alive = {
        enabled: nodeConfig?.keep_alive?.enabled ?? true,
        idle_socket_ttl: nodeConfig?.keep_alive?.idle_socket_ttl ?? 2500
      };
      return connection_1.NodeConnectionFactory.create({
        connection_params: params,
        set_basic_auth_header: nodeConfig.set_basic_auth_header ?? true,
        capture_enhanced_stack_trace: nodeConfig.capture_enhanced_stack_trace ?? false,
        http_agent: nodeConfig.http_agent,
        keep_alive,
        tls
      });
    },
    values_encoder: (jsonHandling) => new utils_1.NodeValuesEncoder(jsonHandling),
    make_result_set: (stream, format, query_id, log_error, response_headers, jsonHandling) => result_set_1.ResultSet.instance({
      stream,
      format,
      query_id,
      log_error,
      response_headers,
      jsonHandling
    })
  };
});

// node_modules/@clickhouse/client/dist/client.js
var require_client2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.NodeClickHouseClient = undefined;
  exports.createClient = createClient;
  var client_common_1 = require_dist2();
  var config_1 = require_config2();

  class NodeClickHouseClient extends client_common_1.ClickHouseClient {
    query(params) {
      return super.query(params);
    }
  }
  exports.NodeClickHouseClient = NodeClickHouseClient;
  function createClient(config2) {
    return new client_common_1.ClickHouseClient({
      impl: config_1.NodeConfigImpl,
      ...config2 || {}
    });
  }
});

// node_modules/@clickhouse/client/dist/index.js
var require_dist3 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.TupleParam = exports.isException = exports.isRow = exports.isProgressRow = exports.SimpleColumnTypes = exports.parseColumnType = exports.RecordsJSONFormats = exports.SingleDocumentJSONFormats = exports.StreamableJSONFormats = exports.StreamableFormats = exports.SupportedRawFormats = exports.SupportedJSONFormats = exports.SettingsMap = exports.ClickHouseLogLevel = exports.parseError = exports.ClickHouseError = exports.drainStream = exports.ResultSet = exports.createClient = exports.ClickHouseClient = undefined;
  var client_1 = require_client2();
  Object.defineProperty(exports, "ClickHouseClient", { enumerable: true, get: function() {
    return client_1.NodeClickHouseClient;
  } });
  var client_2 = require_client2();
  Object.defineProperty(exports, "createClient", { enumerable: true, get: function() {
    return client_2.createClient;
  } });
  var result_set_1 = require_result_set();
  Object.defineProperty(exports, "ResultSet", { enumerable: true, get: function() {
    return result_set_1.ResultSet;
  } });
  var stream_1 = require_stream3();
  Object.defineProperty(exports, "drainStream", { enumerable: true, get: function() {
    return stream_1.drainStream;
  } });
  var client_common_1 = require_dist2();
  Object.defineProperty(exports, "ClickHouseError", { enumerable: true, get: function() {
    return client_common_1.ClickHouseError;
  } });
  Object.defineProperty(exports, "parseError", { enumerable: true, get: function() {
    return client_common_1.parseError;
  } });
  Object.defineProperty(exports, "ClickHouseLogLevel", { enumerable: true, get: function() {
    return client_common_1.ClickHouseLogLevel;
  } });
  Object.defineProperty(exports, "SettingsMap", { enumerable: true, get: function() {
    return client_common_1.SettingsMap;
  } });
  Object.defineProperty(exports, "SupportedJSONFormats", { enumerable: true, get: function() {
    return client_common_1.SupportedJSONFormats;
  } });
  Object.defineProperty(exports, "SupportedRawFormats", { enumerable: true, get: function() {
    return client_common_1.SupportedRawFormats;
  } });
  Object.defineProperty(exports, "StreamableFormats", { enumerable: true, get: function() {
    return client_common_1.StreamableFormats;
  } });
  Object.defineProperty(exports, "StreamableJSONFormats", { enumerable: true, get: function() {
    return client_common_1.StreamableJSONFormats;
  } });
  Object.defineProperty(exports, "SingleDocumentJSONFormats", { enumerable: true, get: function() {
    return client_common_1.SingleDocumentJSONFormats;
  } });
  Object.defineProperty(exports, "RecordsJSONFormats", { enumerable: true, get: function() {
    return client_common_1.RecordsJSONFormats;
  } });
  Object.defineProperty(exports, "parseColumnType", { enumerable: true, get: function() {
    return client_common_1.parseColumnType;
  } });
  Object.defineProperty(exports, "SimpleColumnTypes", { enumerable: true, get: function() {
    return client_common_1.SimpleColumnTypes;
  } });
  Object.defineProperty(exports, "isProgressRow", { enumerable: true, get: function() {
    return client_common_1.isProgressRow;
  } });
  Object.defineProperty(exports, "isRow", { enumerable: true, get: function() {
    return client_common_1.isRow;
  } });
  Object.defineProperty(exports, "isException", { enumerable: true, get: function() {
    return client_common_1.isException;
  } });
  Object.defineProperty(exports, "TupleParam", { enumerable: true, get: function() {
    return client_common_1.TupleParam;
  } });
});

// node_modules/underscore/underscore-node-f.cjs
var require_underscore_node_f = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var VERSION = "1.13.8";
  var root = typeof self == "object" && self.self === self && self || typeof global == "object" && global.global === global && global || Function("return this")() || {};
  var ArrayProto = Array.prototype;
  var ObjProto = Object.prototype;
  var SymbolProto = typeof Symbol !== "undefined" ? Symbol.prototype : null;
  var push = ArrayProto.push;
  var slice = ArrayProto.slice;
  var toString = ObjProto.toString;
  var hasOwnProperty = ObjProto.hasOwnProperty;
  var supportsArrayBuffer = typeof ArrayBuffer !== "undefined";
  var supportsDataView = typeof DataView !== "undefined";
  var nativeIsArray = Array.isArray;
  var nativeKeys = Object.keys;
  var nativeCreate = Object.create;
  var nativeIsView = supportsArrayBuffer && ArrayBuffer.isView;
  var _isNaN = isNaN;
  var _isFinite = isFinite;
  var hasEnumBug = !{ toString: null }.propertyIsEnumerable("toString");
  var nonEnumerableProps = [
    "valueOf",
    "isPrototypeOf",
    "toString",
    "propertyIsEnumerable",
    "hasOwnProperty",
    "toLocaleString"
  ];
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  function restArguments(func, startIndex) {
    startIndex = startIndex == null ? func.length - 1 : +startIndex;
    return function() {
      var length = Math.max(arguments.length - startIndex, 0), rest2 = Array(length), index = 0;
      for (;index < length; index++) {
        rest2[index] = arguments[index + startIndex];
      }
      switch (startIndex) {
        case 0:
          return func.call(this, rest2);
        case 1:
          return func.call(this, arguments[0], rest2);
        case 2:
          return func.call(this, arguments[0], arguments[1], rest2);
      }
      var args = Array(startIndex + 1);
      for (index = 0;index < startIndex; index++) {
        args[index] = arguments[index];
      }
      args[startIndex] = rest2;
      return func.apply(this, args);
    };
  }
  function isObject2(obj) {
    var type = typeof obj;
    return type === "function" || type === "object" && !!obj;
  }
  function isNull(obj) {
    return obj === null;
  }
  function isUndefined(obj) {
    return obj === undefined;
  }
  function isBoolean(obj) {
    return obj === true || obj === false || toString.call(obj) === "[object Boolean]";
  }
  function isElement(obj) {
    return !!(obj && obj.nodeType === 1);
  }
  function tagTester(name) {
    var tag = "[object " + name + "]";
    return function(obj) {
      return toString.call(obj) === tag;
    };
  }
  var isString = tagTester("String");
  var isNumber = tagTester("Number");
  var isDate = tagTester("Date");
  var isRegExp = tagTester("RegExp");
  var isError = tagTester("Error");
  var isSymbol = tagTester("Symbol");
  var isArrayBuffer = tagTester("ArrayBuffer");
  var isFunction = tagTester("Function");
  var nodelist = root.document && root.document.childNodes;
  if (typeof Int8Array != "object" && typeof nodelist != "function") {
    isFunction = function(obj) {
      return typeof obj == "function" || false;
    };
  }
  var isFunction$1 = isFunction;
  var hasObjectTag = tagTester("Object");
  var hasDataViewBug = supportsDataView && (!/\[native code\]/.test(String(DataView)) || hasObjectTag(new DataView(new ArrayBuffer(8))));
  var isIE11 = typeof Map !== "undefined" && hasObjectTag(new Map);
  var isDataView = tagTester("DataView");
  function alternateIsDataView(obj) {
    return obj != null && isFunction$1(obj.getInt8) && isArrayBuffer(obj.buffer);
  }
  var isDataView$1 = hasDataViewBug ? alternateIsDataView : isDataView;
  var isArray = nativeIsArray || tagTester("Array");
  function has$1(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  }
  var isArguments = tagTester("Arguments");
  (function() {
    if (!isArguments(arguments)) {
      isArguments = function(obj) {
        return has$1(obj, "callee");
      };
    }
  })();
  var isArguments$1 = isArguments;
  function isFinite$1(obj) {
    return !isSymbol(obj) && _isFinite(obj) && !isNaN(parseFloat(obj));
  }
  function isNaN$1(obj) {
    return isNumber(obj) && _isNaN(obj);
  }
  function constant(value) {
    return function() {
      return value;
    };
  }
  function createSizePropertyCheck(getSizeProperty) {
    return function(collection) {
      var sizeProperty = getSizeProperty(collection);
      return typeof sizeProperty == "number" && sizeProperty >= 0 && sizeProperty <= MAX_ARRAY_INDEX;
    };
  }
  function shallowProperty(key) {
    return function(obj) {
      return obj == null ? undefined : obj[key];
    };
  }
  var getByteLength = shallowProperty("byteLength");
  var isBufferLike = createSizePropertyCheck(getByteLength);
  var typedArrayPattern = /\[object ((I|Ui)nt(8|16|32)|Float(32|64)|Uint8Clamped|Big(I|Ui)nt64)Array\]/;
  function isTypedArray(obj) {
    return nativeIsView ? nativeIsView(obj) && !isDataView$1(obj) : isBufferLike(obj) && typedArrayPattern.test(toString.call(obj));
  }
  var isTypedArray$1 = supportsArrayBuffer ? isTypedArray : constant(false);
  var getLength = shallowProperty("length");
  function emulatedSet(keys2) {
    var hash = {};
    for (var l = keys2.length, i = 0;i < l; ++i)
      hash[keys2[i]] = true;
    return {
      contains: function(key) {
        return hash[key] === true;
      },
      push: function(key) {
        hash[key] = true;
        return keys2.push(key);
      }
    };
  }
  function collectNonEnumProps(obj, keys2) {
    keys2 = emulatedSet(keys2);
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = isFunction$1(constructor) && constructor.prototype || ObjProto;
    var prop = "constructor";
    if (has$1(obj, prop) && !keys2.contains(prop))
      keys2.push(prop);
    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !keys2.contains(prop)) {
        keys2.push(prop);
      }
    }
  }
  function keys(obj) {
    if (!isObject2(obj))
      return [];
    if (nativeKeys)
      return nativeKeys(obj);
    var keys2 = [];
    for (var key in obj)
      if (has$1(obj, key))
        keys2.push(key);
    if (hasEnumBug)
      collectNonEnumProps(obj, keys2);
    return keys2;
  }
  function isEmpty(obj) {
    if (obj == null)
      return true;
    var length = getLength(obj);
    if (typeof length == "number" && (isArray(obj) || isString(obj) || isArguments$1(obj)))
      return length === 0;
    return getLength(keys(obj)) === 0;
  }
  function isMatch(object5, attrs) {
    var _keys = keys(attrs), length = _keys.length;
    if (object5 == null)
      return !length;
    var obj = Object(object5);
    for (var i = 0;i < length; i++) {
      var key = _keys[i];
      if (attrs[key] !== obj[key] || !(key in obj))
        return false;
    }
    return true;
  }
  function _$1(obj) {
    if (obj instanceof _$1)
      return obj;
    if (!(this instanceof _$1))
      return new _$1(obj);
    this._wrapped = obj;
  }
  _$1.VERSION = VERSION;
  _$1.prototype.value = function() {
    return this._wrapped;
  };
  _$1.prototype.valueOf = _$1.prototype.toJSON = _$1.prototype.value;
  _$1.prototype.toString = function() {
    return String(this._wrapped);
  };
  function toBufferView(bufferSource) {
    return new Uint8Array(bufferSource.buffer || bufferSource, bufferSource.byteOffset || 0, getByteLength(bufferSource));
  }
  var tagDataView = "[object DataView]";
  function isEqual(a, b) {
    var todo = [{ a, b }];
    var aStack = [], bStack = [];
    while (todo.length) {
      var frame = todo.pop();
      if (frame === true) {
        aStack.pop();
        bStack.pop();
        continue;
      }
      a = frame.a;
      b = frame.b;
      if (a === b) {
        if (a !== 0 || 1 / a === 1 / b)
          continue;
        return false;
      }
      if (a == null || b == null)
        return false;
      if (a !== a) {
        if (b !== b)
          continue;
        return false;
      }
      var type = typeof a;
      if (type !== "function" && type !== "object" && typeof b != "object")
        return false;
      if (a instanceof _$1)
        a = a._wrapped;
      if (b instanceof _$1)
        b = b._wrapped;
      var className = toString.call(a);
      if (className !== toString.call(b))
        return false;
      if (hasDataViewBug && className == "[object Object]" && isDataView$1(a)) {
        if (!isDataView$1(b))
          return false;
        className = tagDataView;
      }
      switch (className) {
        case "[object RegExp]":
        case "[object String]":
          if ("" + a === "" + b)
            continue;
          return false;
        case "[object Number]":
          todo.push({ a: +a, b: +b });
          continue;
        case "[object Date]":
        case "[object Boolean]":
          if (+a === +b)
            continue;
          return false;
        case "[object Symbol]":
          if (SymbolProto.valueOf.call(a) === SymbolProto.valueOf.call(b))
            continue;
          return false;
        case "[object ArrayBuffer]":
        case tagDataView:
          todo.push({ a: toBufferView(a), b: toBufferView(b) });
          continue;
      }
      var areArrays = className === "[object Array]";
      if (!areArrays && isTypedArray$1(a)) {
        var byteLength = getByteLength(a);
        if (byteLength !== getByteLength(b))
          return false;
        if (a.buffer === b.buffer && a.byteOffset === b.byteOffset)
          continue;
        areArrays = true;
      }
      if (!areArrays) {
        if (typeof a != "object" || typeof b != "object")
          return false;
        var aCtor = a.constructor, bCtor = b.constructor;
        if (aCtor !== bCtor && !(isFunction$1(aCtor) && aCtor instanceof aCtor && isFunction$1(bCtor) && bCtor instanceof bCtor) && (("constructor" in a) && ("constructor" in b))) {
          return false;
        }
      }
      var length = aStack.length;
      while (length--) {
        if (aStack[length] === a) {
          if (bStack[length] === b)
            break;
          return false;
        }
      }
      if (length >= 0)
        continue;
      aStack.push(a);
      bStack.push(b);
      todo.push(true);
      if (areArrays) {
        length = a.length;
        if (length !== b.length)
          return false;
        while (length--) {
          todo.push({ a: a[length], b: b[length] });
        }
      } else {
        var _keys = keys(a), key;
        length = _keys.length;
        if (keys(b).length !== length)
          return false;
        while (length--) {
          key = _keys[length];
          if (!has$1(b, key))
            return false;
          todo.push({ a: a[key], b: b[key] });
        }
      }
    }
    return true;
  }
  function allKeys(obj) {
    if (!isObject2(obj))
      return [];
    var keys2 = [];
    for (var key in obj)
      keys2.push(key);
    if (hasEnumBug)
      collectNonEnumProps(obj, keys2);
    return keys2;
  }
  function ie11fingerprint(methods) {
    var length = getLength(methods);
    return function(obj) {
      if (obj == null)
        return false;
      var keys2 = allKeys(obj);
      if (getLength(keys2))
        return false;
      for (var i = 0;i < length; i++) {
        if (!isFunction$1(obj[methods[i]]))
          return false;
      }
      return methods !== weakMapMethods || !isFunction$1(obj[forEachName]);
    };
  }
  var forEachName = "forEach";
  var hasName = "has";
  var commonInit = ["clear", "delete"];
  var mapTail = ["get", hasName, "set"];
  var mapMethods = commonInit.concat(forEachName, mapTail);
  var weakMapMethods = commonInit.concat(mapTail);
  var setMethods = ["add"].concat(commonInit, forEachName, hasName);
  var isMap = isIE11 ? ie11fingerprint(mapMethods) : tagTester("Map");
  var isWeakMap = isIE11 ? ie11fingerprint(weakMapMethods) : tagTester("WeakMap");
  var isSet = isIE11 ? ie11fingerprint(setMethods) : tagTester("Set");
  var isWeakSet = tagTester("WeakSet");
  function values(obj) {
    var _keys = keys(obj);
    var length = _keys.length;
    var values2 = Array(length);
    for (var i = 0;i < length; i++) {
      values2[i] = obj[_keys[i]];
    }
    return values2;
  }
  function pairs(obj) {
    var _keys = keys(obj);
    var length = _keys.length;
    var pairs2 = Array(length);
    for (var i = 0;i < length; i++) {
      pairs2[i] = [_keys[i], obj[_keys[i]]];
    }
    return pairs2;
  }
  function invert(obj) {
    var result2 = {};
    var _keys = keys(obj);
    for (var i = 0, length = _keys.length;i < length; i++) {
      result2[obj[_keys[i]]] = _keys[i];
    }
    return result2;
  }
  function functions(obj) {
    var names = [];
    for (var key in obj) {
      if (isFunction$1(obj[key]))
        names.push(key);
    }
    return names.sort();
  }
  function createAssigner(keysFunc, defaults2) {
    return function(obj) {
      var length = arguments.length;
      if (defaults2)
        obj = Object(obj);
      if (length < 2 || obj == null)
        return obj;
      for (var index = 1;index < length; index++) {
        var source = arguments[index], keys2 = keysFunc(source), l = keys2.length;
        for (var i = 0;i < l; i++) {
          var key = keys2[i];
          if (!defaults2 || obj[key] === undefined)
            obj[key] = source[key];
        }
      }
      return obj;
    };
  }
  var extend2 = createAssigner(allKeys);
  var extendOwn = createAssigner(keys);
  var defaults = createAssigner(allKeys, true);
  function ctor() {
    return function() {};
  }
  function baseCreate(prototype) {
    if (!isObject2(prototype))
      return {};
    if (nativeCreate)
      return nativeCreate(prototype);
    var Ctor = ctor();
    Ctor.prototype = prototype;
    var result2 = new Ctor;
    Ctor.prototype = null;
    return result2;
  }
  function create(prototype, props) {
    var result2 = baseCreate(prototype);
    if (props)
      extendOwn(result2, props);
    return result2;
  }
  function clone2(obj) {
    if (!isObject2(obj))
      return obj;
    return isArray(obj) ? obj.slice() : extend2({}, obj);
  }
  function tap(obj, interceptor) {
    interceptor(obj);
    return obj;
  }
  function toPath$1(path) {
    return isArray(path) ? path : [path];
  }
  _$1.toPath = toPath$1;
  function toPath(path) {
    return _$1.toPath(path);
  }
  function deepGet(obj, path) {
    var length = path.length;
    for (var i = 0;i < length; i++) {
      if (obj == null)
        return;
      obj = obj[path[i]];
    }
    return length ? obj : undefined;
  }
  function get(object5, path, defaultValue) {
    var value = deepGet(object5, toPath(path));
    return isUndefined(value) ? defaultValue : value;
  }
  function has(obj, path) {
    path = toPath(path);
    var length = path.length;
    for (var i = 0;i < length; i++) {
      var key = path[i];
      if (!has$1(obj, key))
        return false;
      obj = obj[key];
    }
    return !!length;
  }
  function identity(value) {
    return value;
  }
  function matcher(attrs) {
    attrs = extendOwn({}, attrs);
    return function(obj) {
      return isMatch(obj, attrs);
    };
  }
  function property(path) {
    path = toPath(path);
    return function(obj) {
      return deepGet(obj, path);
    };
  }
  function optimizeCb(func, context, argCount) {
    if (context === undefined)
      return func;
    switch (argCount == null ? 3 : argCount) {
      case 1:
        return function(value) {
          return func.call(context, value);
        };
      case 3:
        return function(value, index, collection) {
          return func.call(context, value, index, collection);
        };
      case 4:
        return function(accumulator, value, index, collection) {
          return func.call(context, accumulator, value, index, collection);
        };
    }
    return function() {
      return func.apply(context, arguments);
    };
  }
  function baseIteratee(value, context, argCount) {
    if (value == null)
      return identity;
    if (isFunction$1(value))
      return optimizeCb(value, context, argCount);
    if (isObject2(value) && !isArray(value))
      return matcher(value);
    return property(value);
  }
  function iteratee(value, context) {
    return baseIteratee(value, context, Infinity);
  }
  _$1.iteratee = iteratee;
  function cb(value, context, argCount) {
    if (_$1.iteratee !== iteratee)
      return _$1.iteratee(value, context);
    return baseIteratee(value, context, argCount);
  }
  function mapObject(obj, iteratee2, context) {
    iteratee2 = cb(iteratee2, context);
    var _keys = keys(obj), length = _keys.length, results = {};
    for (var index = 0;index < length; index++) {
      var currentKey = _keys[index];
      results[currentKey] = iteratee2(obj[currentKey], currentKey, obj);
    }
    return results;
  }
  function noop() {}
  function propertyOf(obj) {
    if (obj == null)
      return noop;
    return function(path) {
      return get(obj, path);
    };
  }
  function times(n, iteratee2, context) {
    var accum = Array(Math.max(0, n));
    iteratee2 = optimizeCb(iteratee2, context, 1);
    for (var i = 0;i < n; i++)
      accum[i] = iteratee2(i);
    return accum;
  }
  function random(min2, max2) {
    if (max2 == null) {
      max2 = min2;
      min2 = 0;
    }
    return min2 + Math.floor(Math.random() * (max2 - min2 + 1));
  }
  var now = Date.now || function() {
    return new Date().getTime();
  };
  function createEscaper(map3) {
    var escaper = function(match) {
      return map3[match];
    };
    var source = "(?:" + keys(map3).join("|") + ")";
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, "g");
    return function(string4) {
      string4 = string4 == null ? "" : "" + string4;
      return testRegexp.test(string4) ? string4.replace(replaceRegexp, escaper) : string4;
    };
  }
  var escapeMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "`": "&#x60;"
  };
  var _escape = createEscaper(escapeMap);
  var unescapeMap = invert(escapeMap);
  var _unescape = createEscaper(unescapeMap);
  var templateSettings = _$1.templateSettings = {
    evaluate: /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g
  };
  var noMatch = /(.)^/;
  var escapes = {
    "'": "'",
    "\\": "\\",
    "\r": "r",
    "\n": "n",
    "\u2028": "u2028",
    "\u2029": "u2029"
  };
  var escapeRegExp = /\\|'|\r|\n|\u2028|\u2029/g;
  function escapeChar(match) {
    return "\\" + escapes[match];
  }
  var bareIdentifier = /^\s*(\w|\$)+\s*$/;
  function template(text, settings, oldSettings) {
    if (!settings && oldSettings)
      settings = oldSettings;
    settings = defaults({}, settings, _$1.templateSettings);
    var matcher2 = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join("|") + "|$", "g");
    var index = 0;
    var source = "__p+='";
    text.replace(matcher2, function(match, escape2, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escapeRegExp, escapeChar);
      index = offset + match.length;
      if (escape2) {
        source += `'+
((__t=(` + escape2 + `))==null?'':_.escape(__t))+
'`;
      } else if (interpolate) {
        source += `'+
((__t=(` + interpolate + `))==null?'':__t)+
'`;
      } else if (evaluate) {
        source += `';
` + evaluate + `
__p+='`;
      }
      return match;
    });
    source += `';
`;
    var argument = settings.variable;
    if (argument) {
      if (!bareIdentifier.test(argument))
        throw new Error("variable is not a bare identifier: " + argument);
    } else {
      source = `with(obj||{}){
` + source + `}
`;
      argument = "obj";
    }
    source = "var __t,__p='',__j=Array.prototype.join," + `print=function(){__p+=__j.call(arguments,'');};
` + source + `return __p;
`;
    var render;
    try {
      render = new Function(argument, "_", source);
    } catch (e) {
      e.source = source;
      throw e;
    }
    var template2 = function(data) {
      return render.call(this, data, _$1);
    };
    template2.source = "function(" + argument + `){
` + source + "}";
    return template2;
  }
  function result(obj, path, fallback) {
    path = toPath(path);
    var length = path.length;
    if (!length) {
      return isFunction$1(fallback) ? fallback.call(obj) : fallback;
    }
    for (var i = 0;i < length; i++) {
      var prop = obj == null ? undefined : obj[path[i]];
      if (prop === undefined) {
        prop = fallback;
        i = length;
      }
      obj = isFunction$1(prop) ? prop.call(obj) : prop;
    }
    return obj;
  }
  var idCounter = 0;
  function uniqueId(prefix) {
    var id = ++idCounter + "";
    return prefix ? prefix + id : id;
  }
  function chain(obj) {
    var instance = _$1(obj);
    instance._chain = true;
    return instance;
  }
  function executeBound(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc))
      return sourceFunc.apply(context, args);
    var self2 = baseCreate(sourceFunc.prototype);
    var result2 = sourceFunc.apply(self2, args);
    if (isObject2(result2))
      return result2;
    return self2;
  }
  var partial2 = restArguments(function(func, boundArgs) {
    var placeholder = partial2.placeholder;
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0;i < length; i++) {
        args[i] = boundArgs[i] === placeholder ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length)
        args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  });
  partial2.placeholder = _$1;
  var bind = restArguments(function(func, context, args) {
    if (!isFunction$1(func))
      throw new TypeError("Bind must be called on a function");
    var bound = restArguments(function(callArgs) {
      return executeBound(func, bound, context, this, args.concat(callArgs));
    });
    return bound;
  });
  var isArrayLike = createSizePropertyCheck(getLength);
  function flatten$1(input, depth, strict) {
    if (!depth && depth !== 0)
      depth = Infinity;
    var output = [], idx = 0, i = 0, length = getLength(input) || 0, stack = [];
    while (true) {
      if (i >= length) {
        if (!stack.length)
          break;
        var frame = stack.pop();
        i = frame.i;
        input = frame.v;
        length = getLength(input);
        continue;
      }
      var value = input[i++];
      if (stack.length >= depth) {
        output[idx++] = value;
      } else if (isArrayLike(value) && (isArray(value) || isArguments$1(value))) {
        stack.push({ i, v: input });
        i = 0;
        input = value;
        length = getLength(input);
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  }
  var bindAll = restArguments(function(obj, keys2) {
    keys2 = flatten$1(keys2, false, false);
    var index = keys2.length;
    if (index < 1)
      throw new Error("bindAll must be passed function names");
    while (index--) {
      var key = keys2[index];
      obj[key] = bind(obj[key], obj);
    }
    return obj;
  });
  function memoize(func, hasher) {
    var memoize2 = function(key) {
      var cache = memoize2.cache;
      var address = "" + (hasher ? hasher.apply(this, arguments) : key);
      if (!has$1(cache, address))
        cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize2.cache = {};
    return memoize2;
  }
  var delay = restArguments(function(func, wait, args) {
    return setTimeout(function() {
      return func.apply(null, args);
    }, wait);
  });
  var defer = partial2(delay, _$1, 1);
  function throttle(func, wait, options) {
    var timeout, context, args, result2;
    var previous = 0;
    if (!options)
      options = {};
    var later = function() {
      previous = options.leading === false ? 0 : now();
      timeout = null;
      result2 = func.apply(context, args);
      if (!timeout)
        context = args = null;
    };
    var throttled = function() {
      var _now = now();
      if (!previous && options.leading === false)
        previous = _now;
      var remaining = wait - (_now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = _now;
        result2 = func.apply(context, args);
        if (!timeout)
          context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result2;
    };
    throttled.cancel = function() {
      clearTimeout(timeout);
      previous = 0;
      timeout = context = args = null;
    };
    return throttled;
  }
  function debounce(func, wait, immediate) {
    var timeout, previous, args, result2, context;
    var later = function() {
      var passed = now() - previous;
      if (wait > passed) {
        timeout = setTimeout(later, wait - passed);
      } else {
        timeout = null;
        if (!immediate)
          result2 = func.apply(context, args);
        if (!timeout)
          args = context = null;
      }
    };
    var debounced = restArguments(function(_args) {
      context = this;
      args = _args;
      previous = now();
      if (!timeout) {
        timeout = setTimeout(later, wait);
        if (immediate)
          result2 = func.apply(context, args);
      }
      return result2;
    });
    debounced.cancel = function() {
      clearTimeout(timeout);
      timeout = args = context = null;
    };
    return debounced;
  }
  function wrap(func, wrapper) {
    return partial2(wrapper, func);
  }
  function negate(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  }
  function compose() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result2 = args[start].apply(this, arguments);
      while (i--)
        result2 = args[i].call(this, result2);
      return result2;
    };
  }
  function after(times2, func) {
    return function() {
      if (--times2 < 1) {
        return func.apply(this, arguments);
      }
    };
  }
  function before(times2, func) {
    var memo;
    return function() {
      if (--times2 > 0) {
        memo = func.apply(this, arguments);
      }
      if (times2 <= 1)
        func = null;
      return memo;
    };
  }
  var once = partial2(before, 2);
  function findKey(obj, predicate, context) {
    predicate = cb(predicate, context);
    var _keys = keys(obj), key;
    for (var i = 0, length = _keys.length;i < length; i++) {
      key = _keys[i];
      if (predicate(obj[key], key, obj))
        return key;
    }
  }
  function createPredicateIndexFinder(dir) {
    return function(array3, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array3);
      var index = dir > 0 ? 0 : length - 1;
      for (;index >= 0 && index < length; index += dir) {
        if (predicate(array3[index], index, array3))
          return index;
      }
      return -1;
    };
  }
  var findIndex = createPredicateIndexFinder(1);
  var findLastIndex = createPredicateIndexFinder(-1);
  function sortedIndex(array3, obj, iteratee2, context) {
    iteratee2 = cb(iteratee2, context, 1);
    var value = iteratee2(obj);
    var low = 0, high = getLength(array3);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee2(array3[mid]) < value)
        low = mid + 1;
      else
        high = mid;
    }
    return low;
  }
  function createIndexFinder(dir, predicateFind, sortedIndex2) {
    return function(array3, item, idx) {
      var i = 0, length = getLength(array3);
      if (typeof idx == "number") {
        if (dir > 0) {
          i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
          length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex2 && idx && length) {
        idx = sortedIndex2(array3, item);
        return array3[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array3, i, length), isNaN$1);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1;idx >= 0 && idx < length; idx += dir) {
        if (array3[idx] === item)
          return idx;
      }
      return -1;
    };
  }
  var indexOf = createIndexFinder(1, findIndex, sortedIndex);
  var lastIndexOf = createIndexFinder(-1, findLastIndex);
  function find(obj, predicate, context) {
    var keyFinder = isArrayLike(obj) ? findIndex : findKey;
    var key = keyFinder(obj, predicate, context);
    if (key !== undefined && key !== -1)
      return obj[key];
  }
  function findWhere(obj, attrs) {
    return find(obj, matcher(attrs));
  }
  function each(obj, iteratee2, context) {
    iteratee2 = optimizeCb(iteratee2, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length;i < length; i++) {
        iteratee2(obj[i], i, obj);
      }
    } else {
      var _keys = keys(obj);
      for (i = 0, length = _keys.length;i < length; i++) {
        iteratee2(obj[_keys[i]], _keys[i], obj);
      }
    }
    return obj;
  }
  function map2(obj, iteratee2, context) {
    iteratee2 = cb(iteratee2, context);
    var _keys = !isArrayLike(obj) && keys(obj), length = (_keys || obj).length, results = Array(length);
    for (var index = 0;index < length; index++) {
      var currentKey = _keys ? _keys[index] : index;
      results[index] = iteratee2(obj[currentKey], currentKey, obj);
    }
    return results;
  }
  function createReduce(dir) {
    var reducer = function(obj, iteratee2, memo, initial2) {
      var _keys = !isArrayLike(obj) && keys(obj), length = (_keys || obj).length, index = dir > 0 ? 0 : length - 1;
      if (!initial2) {
        memo = obj[_keys ? _keys[index] : index];
        index += dir;
      }
      for (;index >= 0 && index < length; index += dir) {
        var currentKey = _keys ? _keys[index] : index;
        memo = iteratee2(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    };
    return function(obj, iteratee2, memo, context) {
      var initial2 = arguments.length >= 3;
      return reducer(obj, optimizeCb(iteratee2, context, 4), memo, initial2);
    };
  }
  var reduce = createReduce(1);
  var reduceRight = createReduce(-1);
  function filter(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    each(obj, function(value, index, list) {
      if (predicate(value, index, list))
        results.push(value);
    });
    return results;
  }
  function reject(obj, predicate, context) {
    return filter(obj, negate(cb(predicate)), context);
  }
  function every(obj, predicate, context) {
    predicate = cb(predicate, context);
    var _keys = !isArrayLike(obj) && keys(obj), length = (_keys || obj).length;
    for (var index = 0;index < length; index++) {
      var currentKey = _keys ? _keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj))
        return false;
    }
    return true;
  }
  function some(obj, predicate, context) {
    predicate = cb(predicate, context);
    var _keys = !isArrayLike(obj) && keys(obj), length = (_keys || obj).length;
    for (var index = 0;index < length; index++) {
      var currentKey = _keys ? _keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj))
        return true;
    }
    return false;
  }
  function contains(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj))
      obj = values(obj);
    if (typeof fromIndex != "number" || guard)
      fromIndex = 0;
    return indexOf(obj, item, fromIndex) >= 0;
  }
  var invoke = restArguments(function(obj, path, args) {
    var contextPath, func;
    if (isFunction$1(path)) {
      func = path;
    } else {
      path = toPath(path);
      contextPath = path.slice(0, -1);
      path = path[path.length - 1];
    }
    return map2(obj, function(context) {
      var method = func;
      if (!method) {
        if (contextPath && contextPath.length) {
          context = deepGet(context, contextPath);
        }
        if (context == null)
          return;
        method = context[path];
      }
      return method == null ? method : method.apply(context, args);
    });
  });
  function pluck(obj, key) {
    return map2(obj, property(key));
  }
  function where(obj, attrs) {
    return filter(obj, matcher(attrs));
  }
  function max(obj, iteratee2, context) {
    var result2 = -Infinity, lastComputed = -Infinity, value, computed;
    if (iteratee2 == null || typeof iteratee2 == "number" && typeof obj[0] != "object" && obj != null) {
      obj = isArrayLike(obj) ? obj : values(obj);
      for (var i = 0, length = obj.length;i < length; i++) {
        value = obj[i];
        if (value != null && value > result2) {
          result2 = value;
        }
      }
    } else {
      iteratee2 = cb(iteratee2, context);
      each(obj, function(v, index, list) {
        computed = iteratee2(v, index, list);
        if (computed > lastComputed || computed === -Infinity && result2 === -Infinity) {
          result2 = v;
          lastComputed = computed;
        }
      });
    }
    return result2;
  }
  function min(obj, iteratee2, context) {
    var result2 = Infinity, lastComputed = Infinity, value, computed;
    if (iteratee2 == null || typeof iteratee2 == "number" && typeof obj[0] != "object" && obj != null) {
      obj = isArrayLike(obj) ? obj : values(obj);
      for (var i = 0, length = obj.length;i < length; i++) {
        value = obj[i];
        if (value != null && value < result2) {
          result2 = value;
        }
      }
    } else {
      iteratee2 = cb(iteratee2, context);
      each(obj, function(v, index, list) {
        computed = iteratee2(v, index, list);
        if (computed < lastComputed || computed === Infinity && result2 === Infinity) {
          result2 = v;
          lastComputed = computed;
        }
      });
    }
    return result2;
  }
  var reStrSymbol = /[^\ud800-\udfff]|[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;
  function toArray(obj) {
    if (!obj)
      return [];
    if (isArray(obj))
      return slice.call(obj);
    if (isString(obj)) {
      return obj.match(reStrSymbol);
    }
    if (isArrayLike(obj))
      return map2(obj, identity);
    return values(obj);
  }
  function sample(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj))
        obj = values(obj);
      return obj[random(obj.length - 1)];
    }
    var sample2 = toArray(obj);
    var length = getLength(sample2);
    n = Math.max(Math.min(n, length), 0);
    var last2 = length - 1;
    for (var index = 0;index < n; index++) {
      var rand = random(index, last2);
      var temp = sample2[index];
      sample2[index] = sample2[rand];
      sample2[rand] = temp;
    }
    return sample2.slice(0, n);
  }
  function shuffle(obj) {
    return sample(obj, Infinity);
  }
  function sortBy(obj, iteratee2, context) {
    var index = 0;
    iteratee2 = cb(iteratee2, context);
    return pluck(map2(obj, function(value, key, list) {
      return {
        value,
        index: index++,
        criteria: iteratee2(value, key, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === undefined)
          return 1;
        if (a < b || b === undefined)
          return -1;
      }
      return left.index - right.index;
    }), "value");
  }
  function group(behavior, partition2) {
    return function(obj, iteratee2, context) {
      var result2 = partition2 ? [[], []] : {};
      iteratee2 = cb(iteratee2, context);
      each(obj, function(value, index) {
        var key = iteratee2(value, index, obj);
        behavior(result2, value, key);
      });
      return result2;
    };
  }
  var groupBy = group(function(result2, value, key) {
    if (has$1(result2, key))
      result2[key].push(value);
    else
      result2[key] = [value];
  });
  var indexBy = group(function(result2, value, key) {
    result2[key] = value;
  });
  var countBy = group(function(result2, value, key) {
    if (has$1(result2, key))
      result2[key]++;
    else
      result2[key] = 1;
  });
  var partition = group(function(result2, value, pass) {
    result2[pass ? 0 : 1].push(value);
  }, true);
  function size(obj) {
    if (obj == null)
      return 0;
    return isArrayLike(obj) ? obj.length : keys(obj).length;
  }
  function keyInObj(value, key, obj) {
    return key in obj;
  }
  var pick2 = restArguments(function(obj, keys2) {
    var result2 = {}, iteratee2 = keys2[0];
    if (obj == null)
      return result2;
    if (isFunction$1(iteratee2)) {
      if (keys2.length > 1)
        iteratee2 = optimizeCb(iteratee2, keys2[1]);
      keys2 = allKeys(obj);
    } else {
      iteratee2 = keyInObj;
      keys2 = flatten$1(keys2, false, false);
      obj = Object(obj);
    }
    for (var i = 0, length = keys2.length;i < length; i++) {
      var key = keys2[i];
      var value = obj[key];
      if (iteratee2(value, key, obj))
        result2[key] = value;
    }
    return result2;
  });
  var omit2 = restArguments(function(obj, keys2) {
    var iteratee2 = keys2[0], context;
    if (isFunction$1(iteratee2)) {
      iteratee2 = negate(iteratee2);
      if (keys2.length > 1)
        context = keys2[1];
    } else {
      keys2 = map2(flatten$1(keys2, false, false), String);
      iteratee2 = function(value, key) {
        return !contains(keys2, key);
      };
    }
    return pick2(obj, iteratee2, context);
  });
  function initial(array3, n, guard) {
    return slice.call(array3, 0, Math.max(0, array3.length - (n == null || guard ? 1 : n)));
  }
  function first(array3, n, guard) {
    if (array3 == null || array3.length < 1)
      return n == null || guard ? undefined : [];
    if (n == null || guard)
      return array3[0];
    return initial(array3, array3.length - n);
  }
  function rest(array3, n, guard) {
    return slice.call(array3, n == null || guard ? 1 : n);
  }
  function last(array3, n, guard) {
    if (array3 == null || array3.length < 1)
      return n == null || guard ? undefined : [];
    if (n == null || guard)
      return array3[array3.length - 1];
    return rest(array3, Math.max(0, array3.length - n));
  }
  function compact(array3) {
    return filter(array3, Boolean);
  }
  function flatten(array3, depth) {
    return flatten$1(array3, depth, false);
  }
  var difference = restArguments(function(array3, rest2) {
    rest2 = flatten$1(rest2, true, true);
    return filter(array3, function(value) {
      return !contains(rest2, value);
    });
  });
  var without = restArguments(function(array3, otherArrays) {
    return difference(array3, otherArrays);
  });
  function uniq(array3, isSorted, iteratee2, context) {
    if (!isBoolean(isSorted)) {
      context = iteratee2;
      iteratee2 = isSorted;
      isSorted = false;
    }
    if (iteratee2 != null)
      iteratee2 = cb(iteratee2, context);
    var result2 = [];
    var seen = [];
    for (var i = 0, length = getLength(array3);i < length; i++) {
      var value = array3[i], computed = iteratee2 ? iteratee2(value, i, array3) : value;
      if (isSorted && !iteratee2) {
        if (!i || seen !== computed)
          result2.push(value);
        seen = computed;
      } else if (iteratee2) {
        if (!contains(seen, computed)) {
          seen.push(computed);
          result2.push(value);
        }
      } else if (!contains(result2, value)) {
        result2.push(value);
      }
    }
    return result2;
  }
  var union3 = restArguments(function(arrays) {
    return uniq(flatten$1(arrays, true, true));
  });
  function intersection3(array3) {
    var result2 = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array3);i < length; i++) {
      var item = array3[i];
      if (contains(result2, item))
        continue;
      var j;
      for (j = 1;j < argsLength; j++) {
        if (!contains(arguments[j], item))
          break;
      }
      if (j === argsLength)
        result2.push(item);
    }
    return result2;
  }
  function unzip(array3) {
    var length = array3 && max(array3, getLength).length || 0;
    var result2 = Array(length);
    for (var index = 0;index < length; index++) {
      result2[index] = pluck(array3, index);
    }
    return result2;
  }
  var zip = restArguments(unzip);
  function object4(list, values2) {
    var result2 = {};
    for (var i = 0, length = getLength(list);i < length; i++) {
      if (values2) {
        result2[list[i]] = values2[i];
      } else {
        result2[list[i][0]] = list[i][1];
      }
    }
    return result2;
  }
  function range(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    if (!step) {
      step = stop < start ? -1 : 1;
    }
    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range2 = Array(length);
    for (var idx = 0;idx < length; idx++, start += step) {
      range2[idx] = start;
    }
    return range2;
  }
  function chunk(array3, count) {
    if (count == null || count < 1)
      return [];
    var result2 = [];
    var i = 0, length = array3.length;
    while (i < length) {
      result2.push(slice.call(array3, i, i += count));
    }
    return result2;
  }
  function chainResult(instance, obj) {
    return instance._chain ? _$1(obj).chain() : obj;
  }
  function mixin(obj) {
    each(functions(obj), function(name) {
      var func = _$1[name] = obj[name];
      _$1.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return chainResult(this, func.apply(_$1, args));
      };
    });
    return _$1;
  }
  each(["pop", "push", "reverse", "shift", "sort", "splice", "unshift"], function(name) {
    var method = ArrayProto[name];
    _$1.prototype[name] = function() {
      var obj = this._wrapped;
      if (obj != null) {
        method.apply(obj, arguments);
        if ((name === "shift" || name === "splice") && obj.length === 0) {
          delete obj[0];
        }
      }
      return chainResult(this, obj);
    };
  });
  each(["concat", "join", "slice"], function(name) {
    var method = ArrayProto[name];
    _$1.prototype[name] = function() {
      var obj = this._wrapped;
      if (obj != null)
        obj = method.apply(obj, arguments);
      return chainResult(this, obj);
    };
  });
  var allExports = {
    __proto__: null,
    VERSION,
    restArguments,
    isObject: isObject2,
    isNull,
    isUndefined,
    isBoolean,
    isElement,
    isString,
    isNumber,
    isDate,
    isRegExp,
    isError,
    isSymbol,
    isArrayBuffer,
    isDataView: isDataView$1,
    isArray,
    isFunction: isFunction$1,
    isArguments: isArguments$1,
    isFinite: isFinite$1,
    isNaN: isNaN$1,
    isTypedArray: isTypedArray$1,
    isEmpty,
    isMatch,
    isEqual,
    isMap,
    isWeakMap,
    isSet,
    isWeakSet,
    keys,
    allKeys,
    values,
    pairs,
    invert,
    functions,
    methods: functions,
    extend: extend2,
    extendOwn,
    assign: extendOwn,
    defaults,
    create,
    clone: clone2,
    tap,
    get,
    has,
    mapObject,
    identity,
    constant,
    noop,
    toPath: toPath$1,
    property,
    propertyOf,
    matcher,
    matches: matcher,
    times,
    random,
    now,
    escape: _escape,
    unescape: _unescape,
    templateSettings,
    template,
    result,
    uniqueId,
    chain,
    iteratee,
    partial: partial2,
    bind,
    bindAll,
    memoize,
    delay,
    defer,
    throttle,
    debounce,
    wrap,
    negate,
    compose,
    after,
    before,
    once,
    findKey,
    findIndex,
    findLastIndex,
    sortedIndex,
    indexOf,
    lastIndexOf,
    find,
    detect: find,
    findWhere,
    each,
    forEach: each,
    map: map2,
    collect: map2,
    reduce,
    foldl: reduce,
    inject: reduce,
    reduceRight,
    foldr: reduceRight,
    filter,
    select: filter,
    reject,
    every,
    all: every,
    some,
    any: some,
    contains,
    includes: contains,
    include: contains,
    invoke,
    pluck,
    where,
    max,
    min,
    shuffle,
    sample,
    sortBy,
    groupBy,
    indexBy,
    countBy,
    partition,
    toArray,
    size,
    pick: pick2,
    omit: omit2,
    first,
    head: first,
    take: first,
    initial,
    last,
    rest,
    tail: rest,
    drop: rest,
    compact,
    flatten,
    without,
    uniq,
    unique: uniq,
    union: union3,
    intersection: intersection3,
    difference,
    unzip,
    transpose: unzip,
    zip,
    object: object4,
    range,
    chunk,
    mixin,
    default: _$1
  };
  var _ = mixin(allExports);
  _._ = _;
  exports.VERSION = VERSION;
  exports._ = _;
  exports._escape = _escape;
  exports._unescape = _unescape;
  exports.after = after;
  exports.allKeys = allKeys;
  exports.before = before;
  exports.bind = bind;
  exports.bindAll = bindAll;
  exports.chain = chain;
  exports.chunk = chunk;
  exports.clone = clone2;
  exports.compact = compact;
  exports.compose = compose;
  exports.constant = constant;
  exports.contains = contains;
  exports.countBy = countBy;
  exports.create = create;
  exports.debounce = debounce;
  exports.defaults = defaults;
  exports.defer = defer;
  exports.delay = delay;
  exports.difference = difference;
  exports.each = each;
  exports.every = every;
  exports.extend = extend2;
  exports.extendOwn = extendOwn;
  exports.filter = filter;
  exports.find = find;
  exports.findIndex = findIndex;
  exports.findKey = findKey;
  exports.findLastIndex = findLastIndex;
  exports.findWhere = findWhere;
  exports.first = first;
  exports.flatten = flatten;
  exports.functions = functions;
  exports.get = get;
  exports.groupBy = groupBy;
  exports.has = has;
  exports.identity = identity;
  exports.indexBy = indexBy;
  exports.indexOf = indexOf;
  exports.initial = initial;
  exports.intersection = intersection3;
  exports.invert = invert;
  exports.invoke = invoke;
  exports.isArguments = isArguments$1;
  exports.isArray = isArray;
  exports.isArrayBuffer = isArrayBuffer;
  exports.isBoolean = isBoolean;
  exports.isDataView = isDataView$1;
  exports.isDate = isDate;
  exports.isElement = isElement;
  exports.isEmpty = isEmpty;
  exports.isEqual = isEqual;
  exports.isError = isError;
  exports.isFinite = isFinite$1;
  exports.isFunction = isFunction$1;
  exports.isMap = isMap;
  exports.isMatch = isMatch;
  exports.isNaN = isNaN$1;
  exports.isNull = isNull;
  exports.isNumber = isNumber;
  exports.isObject = isObject2;
  exports.isRegExp = isRegExp;
  exports.isSet = isSet;
  exports.isString = isString;
  exports.isSymbol = isSymbol;
  exports.isTypedArray = isTypedArray$1;
  exports.isUndefined = isUndefined;
  exports.isWeakMap = isWeakMap;
  exports.isWeakSet = isWeakSet;
  exports.iteratee = iteratee;
  exports.keys = keys;
  exports.last = last;
  exports.lastIndexOf = lastIndexOf;
  exports.map = map2;
  exports.mapObject = mapObject;
  exports.matcher = matcher;
  exports.max = max;
  exports.memoize = memoize;
  exports.min = min;
  exports.mixin = mixin;
  exports.negate = negate;
  exports.noop = noop;
  exports.now = now;
  exports.object = object4;
  exports.omit = omit2;
  exports.once = once;
  exports.pairs = pairs;
  exports.partial = partial2;
  exports.partition = partition;
  exports.pick = pick2;
  exports.pluck = pluck;
  exports.property = property;
  exports.propertyOf = propertyOf;
  exports.random = random;
  exports.range = range;
  exports.reduce = reduce;
  exports.reduceRight = reduceRight;
  exports.reject = reject;
  exports.rest = rest;
  exports.restArguments = restArguments;
  exports.result = result;
  exports.sample = sample;
  exports.shuffle = shuffle;
  exports.size = size;
  exports.some = some;
  exports.sortBy = sortBy;
  exports.sortedIndex = sortedIndex;
  exports.tap = tap;
  exports.template = template;
  exports.templateSettings = templateSettings;
  exports.throttle = throttle;
  exports.times = times;
  exports.toArray = toArray;
  exports.toPath = toPath$1;
  exports.union = union3;
  exports.uniq = uniq;
  exports.uniqueId = uniqueId;
  exports.unzip = unzip;
  exports.values = values;
  exports.where = where;
  exports.without = without;
  exports.wrap = wrap;
  exports.zip = zip;
});

// node_modules/smart-buffer/build/utils.js
var require_utils4 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var buffer_1 = __require("buffer");
  var ERRORS = {
    INVALID_ENCODING: "Invalid encoding provided. Please specify a valid encoding the internal Node.js Buffer supports.",
    INVALID_SMARTBUFFER_SIZE: "Invalid size provided. Size must be a valid integer greater than zero.",
    INVALID_SMARTBUFFER_BUFFER: "Invalid Buffer provided in SmartBufferOptions.",
    INVALID_SMARTBUFFER_OBJECT: "Invalid SmartBufferOptions object supplied to SmartBuffer constructor or factory methods.",
    INVALID_OFFSET: "An invalid offset value was provided.",
    INVALID_OFFSET_NON_NUMBER: "An invalid offset value was provided. A numeric value is required.",
    INVALID_LENGTH: "An invalid length value was provided.",
    INVALID_LENGTH_NON_NUMBER: "An invalid length value was provived. A numeric value is required.",
    INVALID_TARGET_OFFSET: "Target offset is beyond the bounds of the internal SmartBuffer data.",
    INVALID_TARGET_LENGTH: "Specified length value moves cursor beyong the bounds of the internal SmartBuffer data.",
    INVALID_READ_BEYOND_BOUNDS: "Attempted to read beyond the bounds of the managed data.",
    INVALID_WRITE_BEYOND_BOUNDS: "Attempted to write beyond the bounds of the managed data."
  };
  exports.ERRORS = ERRORS;
  function checkEncoding(encoding) {
    if (!buffer_1.Buffer.isEncoding(encoding)) {
      throw new Error(ERRORS.INVALID_ENCODING);
    }
  }
  exports.checkEncoding = checkEncoding;
  function isFiniteInteger(value) {
    return typeof value === "number" && isFinite(value) && isInteger(value);
  }
  exports.isFiniteInteger = isFiniteInteger;
  function checkOffsetOrLengthValue(value, offset) {
    if (typeof value === "number") {
      if (!isFiniteInteger(value) || value < 0) {
        throw new Error(offset ? ERRORS.INVALID_OFFSET : ERRORS.INVALID_LENGTH);
      }
    } else {
      throw new Error(offset ? ERRORS.INVALID_OFFSET_NON_NUMBER : ERRORS.INVALID_LENGTH_NON_NUMBER);
    }
  }
  function checkLengthValue(length) {
    checkOffsetOrLengthValue(length, false);
  }
  exports.checkLengthValue = checkLengthValue;
  function checkOffsetValue(offset) {
    checkOffsetOrLengthValue(offset, true);
  }
  exports.checkOffsetValue = checkOffsetValue;
  function checkTargetOffset(offset, buff) {
    if (offset < 0 || offset > buff.length) {
      throw new Error(ERRORS.INVALID_TARGET_OFFSET);
    }
  }
  exports.checkTargetOffset = checkTargetOffset;
  function isInteger(value) {
    return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
  }
  function bigIntAndBufferInt64Check(bufferMethod) {
    if (typeof BigInt === "undefined") {
      throw new Error("Platform does not support JS BigInt type.");
    }
    if (typeof buffer_1.Buffer.prototype[bufferMethod] === "undefined") {
      throw new Error(`Platform does not support Buffer.prototype.${bufferMethod}.`);
    }
  }
  exports.bigIntAndBufferInt64Check = bigIntAndBufferInt64Check;
});

// node_modules/smart-buffer/build/smartbuffer.js
var require_smartbuffer = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  var utils_1 = require_utils4();
  var DEFAULT_SMARTBUFFER_SIZE = 4096;
  var DEFAULT_SMARTBUFFER_ENCODING = "utf8";

  class SmartBuffer {
    constructor(options) {
      this.length = 0;
      this._encoding = DEFAULT_SMARTBUFFER_ENCODING;
      this._writeOffset = 0;
      this._readOffset = 0;
      if (SmartBuffer.isSmartBufferOptions(options)) {
        if (options.encoding) {
          utils_1.checkEncoding(options.encoding);
          this._encoding = options.encoding;
        }
        if (options.size) {
          if (utils_1.isFiniteInteger(options.size) && options.size > 0) {
            this._buff = Buffer.allocUnsafe(options.size);
          } else {
            throw new Error(utils_1.ERRORS.INVALID_SMARTBUFFER_SIZE);
          }
        } else if (options.buff) {
          if (Buffer.isBuffer(options.buff)) {
            this._buff = options.buff;
            this.length = options.buff.length;
          } else {
            throw new Error(utils_1.ERRORS.INVALID_SMARTBUFFER_BUFFER);
          }
        } else {
          this._buff = Buffer.allocUnsafe(DEFAULT_SMARTBUFFER_SIZE);
        }
      } else {
        if (typeof options !== "undefined") {
          throw new Error(utils_1.ERRORS.INVALID_SMARTBUFFER_OBJECT);
        }
        this._buff = Buffer.allocUnsafe(DEFAULT_SMARTBUFFER_SIZE);
      }
    }
    static fromSize(size2, encoding) {
      return new this({
        size: size2,
        encoding
      });
    }
    static fromBuffer(buff, encoding) {
      return new this({
        buff,
        encoding
      });
    }
    static fromOptions(options) {
      return new this(options);
    }
    static isSmartBufferOptions(options) {
      const castOptions = options;
      return castOptions && (castOptions.encoding !== undefined || castOptions.size !== undefined || castOptions.buff !== undefined);
    }
    readInt8(offset) {
      return this._readNumberValue(Buffer.prototype.readInt8, 1, offset);
    }
    readInt16BE(offset) {
      return this._readNumberValue(Buffer.prototype.readInt16BE, 2, offset);
    }
    readInt16LE(offset) {
      return this._readNumberValue(Buffer.prototype.readInt16LE, 2, offset);
    }
    readInt32BE(offset) {
      return this._readNumberValue(Buffer.prototype.readInt32BE, 4, offset);
    }
    readInt32LE(offset) {
      return this._readNumberValue(Buffer.prototype.readInt32LE, 4, offset);
    }
    readBigInt64BE(offset) {
      utils_1.bigIntAndBufferInt64Check("readBigInt64BE");
      return this._readNumberValue(Buffer.prototype.readBigInt64BE, 8, offset);
    }
    readBigInt64LE(offset) {
      utils_1.bigIntAndBufferInt64Check("readBigInt64LE");
      return this._readNumberValue(Buffer.prototype.readBigInt64LE, 8, offset);
    }
    writeInt8(value, offset) {
      this._writeNumberValue(Buffer.prototype.writeInt8, 1, value, offset);
      return this;
    }
    insertInt8(value, offset) {
      return this._insertNumberValue(Buffer.prototype.writeInt8, 1, value, offset);
    }
    writeInt16BE(value, offset) {
      return this._writeNumberValue(Buffer.prototype.writeInt16BE, 2, value, offset);
    }
    insertInt16BE(value, offset) {
      return this._insertNumberValue(Buffer.prototype.writeInt16BE, 2, value, offset);
    }
    writeInt16LE(value, offset) {
      return this._writeNumberValue(Buffer.prototype.writeInt16LE, 2, value, offset);
    }
    insertInt16LE(value, offset) {
      return this._insertNumberValue(Buffer.prototype.writeInt16LE, 2, value, offset);
    }
    writeInt32BE(value, offset) {
      return this._writeNumberValue(Buffer.prototype.writeInt32BE, 4, value, offset);
    }
    insertInt32BE(value, offset) {
      return this._insertNumberValue(Buffer.prototype.writeInt32BE, 4, value, offset);
    }
    writeInt32LE(value, offset) {
      return this._writeNumberValue(Buffer.prototype.writeInt32LE, 4, value, offset);
    }
    insertInt32LE(value, offset) {
      return this._insertNumberValue(Buffer.prototype.writeInt32LE, 4, value, offset);
    }
    writeBigInt64BE(value, offset) {
      utils_1.bigIntAndBufferInt64Check("writeBigInt64BE");
      return this._writeNumberValue(Buffer.prototype.writeBigInt64BE, 8, value, offset);
    }
    insertBigInt64BE(value, offset) {
      utils_1.bigIntAndBufferInt64Check("writeBigInt64BE");
      return this._insertNumberValue(Buffer.prototype.writeBigInt64BE, 8, value, offset);
    }
    writeBigInt64LE(value, offset) {
      utils_1.bigIntAndBufferInt64Check("writeBigInt64LE");
      return this._writeNumberValue(Buffer.prototype.writeBigInt64LE, 8, value, offset);
    }
    insertBigInt64LE(value, offset) {
      utils_1.bigIntAndBufferInt64Check("writeBigInt64LE");
      return this._insertNumberValue(Buffer.prototype.writeBigInt64LE, 8, value, offset);
    }
    readUInt8(offset) {
      return this._readNumberValue(Buffer.prototype.readUInt8, 1, offset);
    }
    readUInt16BE(offset) {
      return this._readNumberValue(Buffer.prototype.readUInt16BE, 2, offset);
    }
    readUInt16LE(offset) {
      return this._readNumberValue(Buffer.prototype.readUInt16LE, 2, offset);
    }
    readUInt32BE(offset) {
      return this._readNumberValue(Buffer.prototype.readUInt32BE, 4, offset);
    }
    readUInt32LE(offset) {
      return this._readNumberValue(Buffer.prototype.readUInt32LE, 4, offset);
    }
    readBigUInt64BE(offset) {
      utils_1.bigIntAndBufferInt64Check("readBigUInt64BE");
      return this._readNumberValue(Buffer.prototype.readBigUInt64BE, 8, offset);
    }
    readBigUInt64LE(offset) {
      utils_1.bigIntAndBufferInt64Check("readBigUInt64LE");
      return this._readNumberValue(Buffer.prototype.readBigUInt64LE, 8, offset);
    }
    writeUInt8(value, offset) {
      return this._writeNumberValue(Buffer.prototype.writeUInt8, 1, value, offset);
    }
    insertUInt8(value, offset) {
      return this._insertNumberValue(Buffer.prototype.writeUInt8, 1, value, offset);
    }
    writeUInt16BE(value, offset) {
      return this._writeNumberValue(Buffer.prototype.writeUInt16BE, 2, value, offset);
    }
    insertUInt16BE(value, offset) {
      return this._insertNumberValue(Buffer.prototype.writeUInt16BE, 2, value, offset);
    }
    writeUInt16LE(value, offset) {
      return this._writeNumberValue(Buffer.prototype.writeUInt16LE, 2, value, offset);
    }
    insertUInt16LE(value, offset) {
      return this._insertNumberValue(Buffer.prototype.writeUInt16LE, 2, value, offset);
    }
    writeUInt32BE(value, offset) {
      return this._writeNumberValue(Buffer.prototype.writeUInt32BE, 4, value, offset);
    }
    insertUInt32BE(value, offset) {
      return this._insertNumberValue(Buffer.prototype.writeUInt32BE, 4, value, offset);
    }
    writeUInt32LE(value, offset) {
      return this._writeNumberValue(Buffer.prototype.writeUInt32LE, 4, value, offset);
    }
    insertUInt32LE(value, offset) {
      return this._insertNumberValue(Buffer.prototype.writeUInt32LE, 4, value, offset);
    }
    writeBigUInt64BE(value, offset) {
      utils_1.bigIntAndBufferInt64Check("writeBigUInt64BE");
      return this._writeNumberValue(Buffer.prototype.writeBigUInt64BE, 8, value, offset);
    }
    insertBigUInt64BE(value, offset) {
      utils_1.bigIntAndBufferInt64Check("writeBigUInt64BE");
      return this._insertNumberValue(Buffer.prototype.writeBigUInt64BE, 8, value, offset);
    }
    writeBigUInt64LE(value, offset) {
      utils_1.bigIntAndBufferInt64Check("writeBigUInt64LE");
      return this._writeNumberValue(Buffer.prototype.writeBigUInt64LE, 8, value, offset);
    }
    insertBigUInt64LE(value, offset) {
      utils_1.bigIntAndBufferInt64Check("writeBigUInt64LE");
      return this._insertNumberValue(Buffer.prototype.writeBigUInt64LE, 8, value, offset);
    }
    readFloatBE(offset) {
      return this._readNumberValue(Buffer.prototype.readFloatBE, 4, offset);
    }
    readFloatLE(offset) {
      return this._readNumberValue(Buffer.prototype.readFloatLE, 4, offset);
    }
    writeFloatBE(value, offset) {
      return this._writeNumberValue(Buffer.prototype.writeFloatBE, 4, value, offset);
    }
    insertFloatBE(value, offset) {
      return this._insertNumberValue(Buffer.prototype.writeFloatBE, 4, value, offset);
    }
    writeFloatLE(value, offset) {
      return this._writeNumberValue(Buffer.prototype.writeFloatLE, 4, value, offset);
    }
    insertFloatLE(value, offset) {
      return this._insertNumberValue(Buffer.prototype.writeFloatLE, 4, value, offset);
    }
    readDoubleBE(offset) {
      return this._readNumberValue(Buffer.prototype.readDoubleBE, 8, offset);
    }
    readDoubleLE(offset) {
      return this._readNumberValue(Buffer.prototype.readDoubleLE, 8, offset);
    }
    writeDoubleBE(value, offset) {
      return this._writeNumberValue(Buffer.prototype.writeDoubleBE, 8, value, offset);
    }
    insertDoubleBE(value, offset) {
      return this._insertNumberValue(Buffer.prototype.writeDoubleBE, 8, value, offset);
    }
    writeDoubleLE(value, offset) {
      return this._writeNumberValue(Buffer.prototype.writeDoubleLE, 8, value, offset);
    }
    insertDoubleLE(value, offset) {
      return this._insertNumberValue(Buffer.prototype.writeDoubleLE, 8, value, offset);
    }
    readString(arg1, encoding) {
      let lengthVal;
      if (typeof arg1 === "number") {
        utils_1.checkLengthValue(arg1);
        lengthVal = Math.min(arg1, this.length - this._readOffset);
      } else {
        encoding = arg1;
        lengthVal = this.length - this._readOffset;
      }
      if (typeof encoding !== "undefined") {
        utils_1.checkEncoding(encoding);
      }
      const value = this._buff.slice(this._readOffset, this._readOffset + lengthVal).toString(encoding || this._encoding);
      this._readOffset += lengthVal;
      return value;
    }
    insertString(value, offset, encoding) {
      utils_1.checkOffsetValue(offset);
      return this._handleString(value, true, offset, encoding);
    }
    writeString(value, arg2, encoding) {
      return this._handleString(value, false, arg2, encoding);
    }
    readStringNT(encoding) {
      if (typeof encoding !== "undefined") {
        utils_1.checkEncoding(encoding);
      }
      let nullPos = this.length;
      for (let i = this._readOffset;i < this.length; i++) {
        if (this._buff[i] === 0) {
          nullPos = i;
          break;
        }
      }
      const value = this._buff.slice(this._readOffset, nullPos);
      this._readOffset = nullPos + 1;
      return value.toString(encoding || this._encoding);
    }
    insertStringNT(value, offset, encoding) {
      utils_1.checkOffsetValue(offset);
      this.insertString(value, offset, encoding);
      this.insertUInt8(0, offset + value.length);
      return this;
    }
    writeStringNT(value, arg2, encoding) {
      this.writeString(value, arg2, encoding);
      this.writeUInt8(0, typeof arg2 === "number" ? arg2 + value.length : this.writeOffset);
      return this;
    }
    readBuffer(length) {
      if (typeof length !== "undefined") {
        utils_1.checkLengthValue(length);
      }
      const lengthVal = typeof length === "number" ? length : this.length;
      const endPoint = Math.min(this.length, this._readOffset + lengthVal);
      const value = this._buff.slice(this._readOffset, endPoint);
      this._readOffset = endPoint;
      return value;
    }
    insertBuffer(value, offset) {
      utils_1.checkOffsetValue(offset);
      return this._handleBuffer(value, true, offset);
    }
    writeBuffer(value, offset) {
      return this._handleBuffer(value, false, offset);
    }
    readBufferNT() {
      let nullPos = this.length;
      for (let i = this._readOffset;i < this.length; i++) {
        if (this._buff[i] === 0) {
          nullPos = i;
          break;
        }
      }
      const value = this._buff.slice(this._readOffset, nullPos);
      this._readOffset = nullPos + 1;
      return value;
    }
    insertBufferNT(value, offset) {
      utils_1.checkOffsetValue(offset);
      this.insertBuffer(value, offset);
      this.insertUInt8(0, offset + value.length);
      return this;
    }
    writeBufferNT(value, offset) {
      if (typeof offset !== "undefined") {
        utils_1.checkOffsetValue(offset);
      }
      this.writeBuffer(value, offset);
      this.writeUInt8(0, typeof offset === "number" ? offset + value.length : this._writeOffset);
      return this;
    }
    clear() {
      this._writeOffset = 0;
      this._readOffset = 0;
      this.length = 0;
      return this;
    }
    remaining() {
      return this.length - this._readOffset;
    }
    get readOffset() {
      return this._readOffset;
    }
    set readOffset(offset) {
      utils_1.checkOffsetValue(offset);
      utils_1.checkTargetOffset(offset, this);
      this._readOffset = offset;
    }
    get writeOffset() {
      return this._writeOffset;
    }
    set writeOffset(offset) {
      utils_1.checkOffsetValue(offset);
      utils_1.checkTargetOffset(offset, this);
      this._writeOffset = offset;
    }
    get encoding() {
      return this._encoding;
    }
    set encoding(encoding) {
      utils_1.checkEncoding(encoding);
      this._encoding = encoding;
    }
    get internalBuffer() {
      return this._buff;
    }
    toBuffer() {
      return this._buff.slice(0, this.length);
    }
    toString(encoding) {
      const encodingVal = typeof encoding === "string" ? encoding : this._encoding;
      utils_1.checkEncoding(encodingVal);
      return this._buff.toString(encodingVal, 0, this.length);
    }
    destroy() {
      this.clear();
      return this;
    }
    _handleString(value, isInsert, arg3, encoding) {
      let offsetVal = this._writeOffset;
      let encodingVal = this._encoding;
      if (typeof arg3 === "number") {
        offsetVal = arg3;
      } else if (typeof arg3 === "string") {
        utils_1.checkEncoding(arg3);
        encodingVal = arg3;
      }
      if (typeof encoding === "string") {
        utils_1.checkEncoding(encoding);
        encodingVal = encoding;
      }
      const byteLength = Buffer.byteLength(value, encodingVal);
      if (isInsert) {
        this.ensureInsertable(byteLength, offsetVal);
      } else {
        this._ensureWriteable(byteLength, offsetVal);
      }
      this._buff.write(value, offsetVal, byteLength, encodingVal);
      if (isInsert) {
        this._writeOffset += byteLength;
      } else {
        if (typeof arg3 === "number") {
          this._writeOffset = Math.max(this._writeOffset, offsetVal + byteLength);
        } else {
          this._writeOffset += byteLength;
        }
      }
      return this;
    }
    _handleBuffer(value, isInsert, offset) {
      const offsetVal = typeof offset === "number" ? offset : this._writeOffset;
      if (isInsert) {
        this.ensureInsertable(value.length, offsetVal);
      } else {
        this._ensureWriteable(value.length, offsetVal);
      }
      value.copy(this._buff, offsetVal);
      if (isInsert) {
        this._writeOffset += value.length;
      } else {
        if (typeof offset === "number") {
          this._writeOffset = Math.max(this._writeOffset, offsetVal + value.length);
        } else {
          this._writeOffset += value.length;
        }
      }
      return this;
    }
    ensureReadable(length, offset) {
      let offsetVal = this._readOffset;
      if (typeof offset !== "undefined") {
        utils_1.checkOffsetValue(offset);
        offsetVal = offset;
      }
      if (offsetVal < 0 || offsetVal + length > this.length) {
        throw new Error(utils_1.ERRORS.INVALID_READ_BEYOND_BOUNDS);
      }
    }
    ensureInsertable(dataLength, offset) {
      utils_1.checkOffsetValue(offset);
      this._ensureCapacity(this.length + dataLength);
      if (offset < this.length) {
        this._buff.copy(this._buff, offset + dataLength, offset, this._buff.length);
      }
      if (offset + dataLength > this.length) {
        this.length = offset + dataLength;
      } else {
        this.length += dataLength;
      }
    }
    _ensureWriteable(dataLength, offset) {
      const offsetVal = typeof offset === "number" ? offset : this._writeOffset;
      this._ensureCapacity(offsetVal + dataLength);
      if (offsetVal + dataLength > this.length) {
        this.length = offsetVal + dataLength;
      }
    }
    _ensureCapacity(minLength) {
      const oldLength = this._buff.length;
      if (minLength > oldLength) {
        let data = this._buff;
        let newLength = oldLength * 3 / 2 + 1;
        if (newLength < minLength) {
          newLength = minLength;
        }
        this._buff = Buffer.allocUnsafe(newLength);
        data.copy(this._buff, 0, 0, oldLength);
      }
    }
    _readNumberValue(func, byteSize, offset) {
      this.ensureReadable(byteSize, offset);
      const value = func.call(this._buff, typeof offset === "number" ? offset : this._readOffset);
      if (typeof offset === "undefined") {
        this._readOffset += byteSize;
      }
      return value;
    }
    _insertNumberValue(func, byteSize, value, offset) {
      utils_1.checkOffsetValue(offset);
      this.ensureInsertable(byteSize, offset);
      func.call(this._buff, value, offset);
      this._writeOffset += byteSize;
      return this;
    }
    _writeNumberValue(func, byteSize, value, offset) {
      if (typeof offset === "number") {
        if (offset < 0) {
          throw new Error(utils_1.ERRORS.INVALID_WRITE_BEYOND_BOUNDS);
        }
        utils_1.checkOffsetValue(offset);
      }
      const offsetVal = typeof offset === "number" ? offset : this._writeOffset;
      this._ensureWriteable(byteSize, offsetVal);
      func.call(this._buff, value, offsetVal);
      if (typeof offset === "number") {
        this._writeOffset = Math.max(this._writeOffset, offsetVal + byteSize);
      } else {
        this._writeOffset += byteSize;
      }
      return this;
    }
  }
  exports.SmartBuffer = SmartBuffer;
});

// node_modules/socks/build/common/constants.js
var require_constants = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SOCKS5_NO_ACCEPTABLE_AUTH = exports.SOCKS5_CUSTOM_AUTH_END = exports.SOCKS5_CUSTOM_AUTH_START = exports.SOCKS_INCOMING_PACKET_SIZES = exports.SocksClientState = exports.Socks5Response = exports.Socks5HostType = exports.Socks5Auth = exports.Socks4Response = exports.SocksCommand = exports.ERRORS = exports.DEFAULT_TIMEOUT = undefined;
  var DEFAULT_TIMEOUT = 30000;
  exports.DEFAULT_TIMEOUT = DEFAULT_TIMEOUT;
  var ERRORS = {
    InvalidSocksCommand: "An invalid SOCKS command was provided. Valid options are connect, bind, and associate.",
    InvalidSocksCommandForOperation: "An invalid SOCKS command was provided. Only a subset of commands are supported for this operation.",
    InvalidSocksCommandChain: "An invalid SOCKS command was provided. Chaining currently only supports the connect command.",
    InvalidSocksClientOptionsDestination: "An invalid destination host was provided.",
    InvalidSocksClientOptionsExistingSocket: "An invalid existing socket was provided. This should be an instance of stream.Duplex.",
    InvalidSocksClientOptionsProxy: "Invalid SOCKS proxy details were provided.",
    InvalidSocksClientOptionsTimeout: "An invalid timeout value was provided. Please enter a value above 0 (in ms).",
    InvalidSocksClientOptionsProxiesLength: "At least two socks proxies must be provided for chaining.",
    InvalidSocksClientOptionsCustomAuthRange: "Custom auth must be a value between 0x80 and 0xFE.",
    InvalidSocksClientOptionsCustomAuthOptions: "When a custom_auth_method is provided, custom_auth_request_handler, custom_auth_response_size, and custom_auth_response_handler must also be provided and valid.",
    NegotiationError: "Negotiation error",
    SocketClosed: "Socket closed",
    ProxyConnectionTimedOut: "Proxy connection timed out",
    InternalError: "SocksClient internal error (this should not happen)",
    InvalidSocks4HandshakeResponse: "Received invalid Socks4 handshake response",
    Socks4ProxyRejectedConnection: "Socks4 Proxy rejected connection",
    InvalidSocks4IncomingConnectionResponse: "Socks4 invalid incoming connection response",
    Socks4ProxyRejectedIncomingBoundConnection: "Socks4 Proxy rejected incoming bound connection",
    InvalidSocks5InitialHandshakeResponse: "Received invalid Socks5 initial handshake response",
    InvalidSocks5IntiailHandshakeSocksVersion: "Received invalid Socks5 initial handshake (invalid socks version)",
    InvalidSocks5InitialHandshakeNoAcceptedAuthType: "Received invalid Socks5 initial handshake (no accepted authentication type)",
    InvalidSocks5InitialHandshakeUnknownAuthType: "Received invalid Socks5 initial handshake (unknown authentication type)",
    Socks5AuthenticationFailed: "Socks5 Authentication failed",
    InvalidSocks5FinalHandshake: "Received invalid Socks5 final handshake response",
    InvalidSocks5FinalHandshakeRejected: "Socks5 proxy rejected connection",
    InvalidSocks5IncomingConnectionResponse: "Received invalid Socks5 incoming connection response",
    Socks5ProxyRejectedIncomingBoundConnection: "Socks5 Proxy rejected incoming bound connection"
  };
  exports.ERRORS = ERRORS;
  var SOCKS_INCOMING_PACKET_SIZES = {
    Socks5InitialHandshakeResponse: 2,
    Socks5UserPassAuthenticationResponse: 2,
    Socks5ResponseHeader: 5,
    Socks5ResponseIPv4: 10,
    Socks5ResponseIPv6: 22,
    Socks5ResponseHostname: (hostNameLength) => hostNameLength + 7,
    Socks4Response: 8
  };
  exports.SOCKS_INCOMING_PACKET_SIZES = SOCKS_INCOMING_PACKET_SIZES;
  var SocksCommand;
  (function(SocksCommand2) {
    SocksCommand2[SocksCommand2["connect"] = 1] = "connect";
    SocksCommand2[SocksCommand2["bind"] = 2] = "bind";
    SocksCommand2[SocksCommand2["associate"] = 3] = "associate";
  })(SocksCommand || (exports.SocksCommand = SocksCommand = {}));
  var Socks4Response;
  (function(Socks4Response2) {
    Socks4Response2[Socks4Response2["Granted"] = 90] = "Granted";
    Socks4Response2[Socks4Response2["Failed"] = 91] = "Failed";
    Socks4Response2[Socks4Response2["Rejected"] = 92] = "Rejected";
    Socks4Response2[Socks4Response2["RejectedIdent"] = 93] = "RejectedIdent";
  })(Socks4Response || (exports.Socks4Response = Socks4Response = {}));
  var Socks5Auth;
  (function(Socks5Auth2) {
    Socks5Auth2[Socks5Auth2["NoAuth"] = 0] = "NoAuth";
    Socks5Auth2[Socks5Auth2["GSSApi"] = 1] = "GSSApi";
    Socks5Auth2[Socks5Auth2["UserPass"] = 2] = "UserPass";
  })(Socks5Auth || (exports.Socks5Auth = Socks5Auth = {}));
  var SOCKS5_CUSTOM_AUTH_START = 128;
  exports.SOCKS5_CUSTOM_AUTH_START = SOCKS5_CUSTOM_AUTH_START;
  var SOCKS5_CUSTOM_AUTH_END = 254;
  exports.SOCKS5_CUSTOM_AUTH_END = SOCKS5_CUSTOM_AUTH_END;
  var SOCKS5_NO_ACCEPTABLE_AUTH = 255;
  exports.SOCKS5_NO_ACCEPTABLE_AUTH = SOCKS5_NO_ACCEPTABLE_AUTH;
  var Socks5Response;
  (function(Socks5Response2) {
    Socks5Response2[Socks5Response2["Granted"] = 0] = "Granted";
    Socks5Response2[Socks5Response2["Failure"] = 1] = "Failure";
    Socks5Response2[Socks5Response2["NotAllowed"] = 2] = "NotAllowed";
    Socks5Response2[Socks5Response2["NetworkUnreachable"] = 3] = "NetworkUnreachable";
    Socks5Response2[Socks5Response2["HostUnreachable"] = 4] = "HostUnreachable";
    Socks5Response2[Socks5Response2["ConnectionRefused"] = 5] = "ConnectionRefused";
    Socks5Response2[Socks5Response2["TTLExpired"] = 6] = "TTLExpired";
    Socks5Response2[Socks5Response2["CommandNotSupported"] = 7] = "CommandNotSupported";
    Socks5Response2[Socks5Response2["AddressNotSupported"] = 8] = "AddressNotSupported";
  })(Socks5Response || (exports.Socks5Response = Socks5Response = {}));
  var Socks5HostType;
  (function(Socks5HostType2) {
    Socks5HostType2[Socks5HostType2["IPv4"] = 1] = "IPv4";
    Socks5HostType2[Socks5HostType2["Hostname"] = 3] = "Hostname";
    Socks5HostType2[Socks5HostType2["IPv6"] = 4] = "IPv6";
  })(Socks5HostType || (exports.Socks5HostType = Socks5HostType = {}));
  var SocksClientState;
  (function(SocksClientState2) {
    SocksClientState2[SocksClientState2["Created"] = 0] = "Created";
    SocksClientState2[SocksClientState2["Connecting"] = 1] = "Connecting";
    SocksClientState2[SocksClientState2["Connected"] = 2] = "Connected";
    SocksClientState2[SocksClientState2["SentInitialHandshake"] = 3] = "SentInitialHandshake";
    SocksClientState2[SocksClientState2["ReceivedInitialHandshakeResponse"] = 4] = "ReceivedInitialHandshakeResponse";
    SocksClientState2[SocksClientState2["SentAuthentication"] = 5] = "SentAuthentication";
    SocksClientState2[SocksClientState2["ReceivedAuthenticationResponse"] = 6] = "ReceivedAuthenticationResponse";
    SocksClientState2[SocksClientState2["SentFinalHandshake"] = 7] = "SentFinalHandshake";
    SocksClientState2[SocksClientState2["ReceivedFinalResponse"] = 8] = "ReceivedFinalResponse";
    SocksClientState2[SocksClientState2["BoundWaitingForConnection"] = 9] = "BoundWaitingForConnection";
    SocksClientState2[SocksClientState2["Established"] = 10] = "Established";
    SocksClientState2[SocksClientState2["Disconnected"] = 11] = "Disconnected";
    SocksClientState2[SocksClientState2["Error"] = 99] = "Error";
  })(SocksClientState || (exports.SocksClientState = SocksClientState = {}));
});

// node_modules/socks/build/common/util.js
var require_util2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.shuffleArray = exports.SocksClientError = undefined;

  class SocksClientError extends Error {
    constructor(message, options) {
      super(message);
      this.options = options;
    }
  }
  exports.SocksClientError = SocksClientError;
  function shuffleArray(array3) {
    for (let i = array3.length - 1;i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array3[i], array3[j]] = [array3[j], array3[i]];
    }
  }
  exports.shuffleArray = shuffleArray;
});

// node_modules/ip-address/dist/common.js
var require_common = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.isInSubnet = isInSubnet;
  exports.isCorrect = isCorrect;
  exports.numberToPaddedHex = numberToPaddedHex;
  exports.stringToPaddedHex = stringToPaddedHex;
  exports.testBit = testBit;
  function isInSubnet(address) {
    if (this.subnetMask < address.subnetMask) {
      return false;
    }
    if (this.mask(address.subnetMask) === address.mask()) {
      return true;
    }
    return false;
  }
  function isCorrect(defaultBits) {
    return function() {
      if (this.addressMinusSuffix !== this.correctForm()) {
        return false;
      }
      if (this.subnetMask === defaultBits && !this.parsedSubnet) {
        return true;
      }
      return this.parsedSubnet === String(this.subnetMask);
    };
  }
  function numberToPaddedHex(number4) {
    return number4.toString(16).padStart(2, "0");
  }
  function stringToPaddedHex(numberString) {
    return numberToPaddedHex(parseInt(numberString, 10));
  }
  function testBit(binaryValue, position) {
    const { length } = binaryValue;
    if (position > length) {
      return false;
    }
    const positionInString = length - position;
    return binaryValue.substring(positionInString, positionInString + 1) === "1";
  }
});

// node_modules/ip-address/dist/v4/constants.js
var require_constants2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.RE_SUBNET_STRING = exports.RE_ADDRESS = exports.GROUPS = exports.BITS = undefined;
  exports.BITS = 32;
  exports.GROUPS = 4;
  exports.RE_ADDRESS = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/g;
  exports.RE_SUBNET_STRING = /\/\d{1,2}$/;
});

// node_modules/ip-address/dist/address-error.js
var require_address_error = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.AddressError = undefined;

  class AddressError extends Error {
    constructor(message, parseMessage) {
      super(message);
      this.name = "AddressError";
      this.parseMessage = parseMessage;
    }
  }
  exports.AddressError = AddressError;
});

// node_modules/ip-address/dist/ipv4.js
var require_ipv4 = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
  } : function(o, v) {
    o["default"] = v;
  });
  var __importStar = exports && exports.__importStar || function(mod) {
    if (mod && mod.__esModule)
      return mod;
    var result2 = {};
    if (mod != null) {
      for (var k in mod)
        if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result2, mod, k);
    }
    __setModuleDefault(result2, mod);
    return result2;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Address4 = undefined;
  var common = __importStar(require_common());
  var constants = __importStar(require_constants2());
  var address_error_1 = require_address_error();

  class Address4 {
    constructor(address) {
      this.groups = constants.GROUPS;
      this.parsedAddress = [];
      this.parsedSubnet = "";
      this.subnet = "/32";
      this.subnetMask = 32;
      this.v4 = true;
      this.isCorrect = common.isCorrect(constants.BITS);
      this.isInSubnet = common.isInSubnet;
      this.address = address;
      const subnet = constants.RE_SUBNET_STRING.exec(address);
      if (subnet) {
        this.parsedSubnet = subnet[0].replace("/", "");
        this.subnetMask = parseInt(this.parsedSubnet, 10);
        this.subnet = `/${this.subnetMask}`;
        if (this.subnetMask < 0 || this.subnetMask > constants.BITS) {
          throw new address_error_1.AddressError("Invalid subnet mask.");
        }
        address = address.replace(constants.RE_SUBNET_STRING, "");
      }
      this.addressMinusSuffix = address;
      this.parsedAddress = this.parse(address);
    }
    static isValid(address) {
      try {
        new Address4(address);
        return true;
      } catch (e) {
        return false;
      }
    }
    parse(address) {
      const groups = address.split(".");
      if (!address.match(constants.RE_ADDRESS)) {
        throw new address_error_1.AddressError("Invalid IPv4 address.");
      }
      return groups;
    }
    correctForm() {
      return this.parsedAddress.map((part) => parseInt(part, 10)).join(".");
    }
    static fromHex(hex) {
      const padded = hex.replace(/:/g, "").padStart(8, "0");
      const groups = [];
      let i;
      for (i = 0;i < 8; i += 2) {
        const h = padded.slice(i, i + 2);
        groups.push(parseInt(h, 16));
      }
      return new Address4(groups.join("."));
    }
    static fromInteger(integer2) {
      return Address4.fromHex(integer2.toString(16));
    }
    static fromArpa(arpaFormAddress) {
      const leader = arpaFormAddress.replace(/(\.in-addr\.arpa)?\.$/, "");
      const address = leader.split(".").reverse().join(".");
      return new Address4(address);
    }
    toHex() {
      return this.parsedAddress.map((part) => common.stringToPaddedHex(part)).join(":");
    }
    toArray() {
      return this.parsedAddress.map((part) => parseInt(part, 10));
    }
    toGroup6() {
      const output = [];
      let i;
      for (i = 0;i < constants.GROUPS; i += 2) {
        output.push(`${common.stringToPaddedHex(this.parsedAddress[i])}${common.stringToPaddedHex(this.parsedAddress[i + 1])}`);
      }
      return output.join(":");
    }
    bigInt() {
      return BigInt(`0x${this.parsedAddress.map((n) => common.stringToPaddedHex(n)).join("")}`);
    }
    _startAddress() {
      return BigInt(`0b${this.mask() + "0".repeat(constants.BITS - this.subnetMask)}`);
    }
    startAddress() {
      return Address4.fromBigInt(this._startAddress());
    }
    startAddressExclusive() {
      const adjust = BigInt("1");
      return Address4.fromBigInt(this._startAddress() + adjust);
    }
    _endAddress() {
      return BigInt(`0b${this.mask() + "1".repeat(constants.BITS - this.subnetMask)}`);
    }
    endAddress() {
      return Address4.fromBigInt(this._endAddress());
    }
    endAddressExclusive() {
      const adjust = BigInt("1");
      return Address4.fromBigInt(this._endAddress() - adjust);
    }
    static fromBigInt(bigInt) {
      return Address4.fromHex(bigInt.toString(16));
    }
    static fromByteArray(bytes) {
      if (bytes.length !== 4) {
        throw new address_error_1.AddressError("IPv4 addresses require exactly 4 bytes");
      }
      for (let i = 0;i < bytes.length; i++) {
        if (!Number.isInteger(bytes[i]) || bytes[i] < 0 || bytes[i] > 255) {
          throw new address_error_1.AddressError("All bytes must be integers between 0 and 255");
        }
      }
      return this.fromUnsignedByteArray(bytes);
    }
    static fromUnsignedByteArray(bytes) {
      if (bytes.length !== 4) {
        throw new address_error_1.AddressError("IPv4 addresses require exactly 4 bytes");
      }
      const address = bytes.join(".");
      return new Address4(address);
    }
    mask(mask) {
      if (mask === undefined) {
        mask = this.subnetMask;
      }
      return this.getBitsBase2(0, mask);
    }
    getBitsBase2(start, end) {
      return this.binaryZeroPad().slice(start, end);
    }
    reverseForm(options) {
      if (!options) {
        options = {};
      }
      const reversed = this.correctForm().split(".").reverse().join(".");
      if (options.omitSuffix) {
        return reversed;
      }
      return `${reversed}.in-addr.arpa.`;
    }
    isMulticast() {
      return this.isInSubnet(new Address4("224.0.0.0/4"));
    }
    binaryZeroPad() {
      return this.bigInt().toString(2).padStart(constants.BITS, "0");
    }
    groupForV6() {
      const segments = this.parsedAddress;
      return this.address.replace(constants.RE_ADDRESS, `<span class="hover-group group-v4 group-6">${segments.slice(0, 2).join(".")}</span>.<span class="hover-group group-v4 group-7">${segments.slice(2, 4).join(".")}</span>`);
    }
  }
  exports.Address4 = Address4;
});

// node_modules/ip-address/dist/v6/constants.js
var require_constants3 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.RE_URL_WITH_PORT = exports.RE_URL = exports.RE_ZONE_STRING = exports.RE_SUBNET_STRING = exports.RE_BAD_ADDRESS = exports.RE_BAD_CHARACTERS = exports.TYPES = exports.SCOPES = exports.GROUPS = exports.BITS = undefined;
  exports.BITS = 128;
  exports.GROUPS = 8;
  exports.SCOPES = {
    0: "Reserved",
    1: "Interface local",
    2: "Link local",
    4: "Admin local",
    5: "Site local",
    8: "Organization local",
    14: "Global",
    15: "Reserved"
  };
  exports.TYPES = {
    "ff01::1/128": "Multicast (All nodes on this interface)",
    "ff01::2/128": "Multicast (All routers on this interface)",
    "ff02::1/128": "Multicast (All nodes on this link)",
    "ff02::2/128": "Multicast (All routers on this link)",
    "ff05::2/128": "Multicast (All routers in this site)",
    "ff02::5/128": "Multicast (OSPFv3 AllSPF routers)",
    "ff02::6/128": "Multicast (OSPFv3 AllDR routers)",
    "ff02::9/128": "Multicast (RIP routers)",
    "ff02::a/128": "Multicast (EIGRP routers)",
    "ff02::d/128": "Multicast (PIM routers)",
    "ff02::16/128": "Multicast (MLDv2 reports)",
    "ff01::fb/128": "Multicast (mDNSv6)",
    "ff02::fb/128": "Multicast (mDNSv6)",
    "ff05::fb/128": "Multicast (mDNSv6)",
    "ff02::1:2/128": "Multicast (All DHCP servers and relay agents on this link)",
    "ff05::1:2/128": "Multicast (All DHCP servers and relay agents in this site)",
    "ff02::1:3/128": "Multicast (All DHCP servers on this link)",
    "ff05::1:3/128": "Multicast (All DHCP servers in this site)",
    "::/128": "Unspecified",
    "::1/128": "Loopback",
    "ff00::/8": "Multicast",
    "fe80::/10": "Link-local unicast"
  };
  exports.RE_BAD_CHARACTERS = /([^0-9a-f:/%])/gi;
  exports.RE_BAD_ADDRESS = /([0-9a-f]{5,}|:{3,}|[^:]:$|^:[^:]|\/$)/gi;
  exports.RE_SUBNET_STRING = /\/\d{1,3}(?=%|$)/;
  exports.RE_ZONE_STRING = /%.*$/;
  exports.RE_URL = /^\[{0,1}([0-9a-f:]+)\]{0,1}/;
  exports.RE_URL_WITH_PORT = /\[([0-9a-f:]+)\]:([0-9]{1,5})/;
});

// node_modules/ip-address/dist/v6/helpers.js
var require_helpers = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.spanAllZeroes = spanAllZeroes;
  exports.spanAll = spanAll;
  exports.spanLeadingZeroes = spanLeadingZeroes;
  exports.simpleGroup = simpleGroup;
  function spanAllZeroes(s) {
    return s.replace(/(0+)/g, '<span class="zero">$1</span>');
  }
  function spanAll(s, offset = 0) {
    const letters = s.split("");
    return letters.map((n, i) => `<span class="digit value-${n} position-${i + offset}">${spanAllZeroes(n)}</span>`).join("");
  }
  function spanLeadingZeroesSimple(group) {
    return group.replace(/^(0+)/, '<span class="zero">$1</span>');
  }
  function spanLeadingZeroes(address) {
    const groups = address.split(":");
    return groups.map((g) => spanLeadingZeroesSimple(g)).join(":");
  }
  function simpleGroup(addressString, offset = 0) {
    const groups = addressString.split(":");
    return groups.map((g, i) => {
      if (/group-v4/.test(g)) {
        return g;
      }
      return `<span class="hover-group group-${i + offset}">${spanLeadingZeroesSimple(g)}</span>`;
    });
  }
});

// node_modules/ip-address/dist/v6/regular-expressions.js
var require_regular_expressions = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
  } : function(o, v) {
    o["default"] = v;
  });
  var __importStar = exports && exports.__importStar || function(mod) {
    if (mod && mod.__esModule)
      return mod;
    var result2 = {};
    if (mod != null) {
      for (var k in mod)
        if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result2, mod, k);
    }
    __setModuleDefault(result2, mod);
    return result2;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ADDRESS_BOUNDARY = undefined;
  exports.groupPossibilities = groupPossibilities;
  exports.padGroup = padGroup;
  exports.simpleRegularExpression = simpleRegularExpression;
  exports.possibleElisions = possibleElisions;
  var v6 = __importStar(require_constants3());
  function groupPossibilities(possibilities) {
    return `(${possibilities.join("|")})`;
  }
  function padGroup(group) {
    if (group.length < 4) {
      return `0{0,${4 - group.length}}${group}`;
    }
    return group;
  }
  exports.ADDRESS_BOUNDARY = "[^A-Fa-f0-9:]";
  function simpleRegularExpression(groups) {
    const zeroIndexes = [];
    groups.forEach((group, i) => {
      const groupInteger = parseInt(group, 16);
      if (groupInteger === 0) {
        zeroIndexes.push(i);
      }
    });
    const possibilities = zeroIndexes.map((zeroIndex) => groups.map((group, i) => {
      if (i === zeroIndex) {
        const elision = i === 0 || i === v6.GROUPS - 1 ? ":" : "";
        return groupPossibilities([padGroup(group), elision]);
      }
      return padGroup(group);
    }).join(":"));
    possibilities.push(groups.map(padGroup).join(":"));
    return groupPossibilities(possibilities);
  }
  function possibleElisions(elidedGroups, moreLeft, moreRight) {
    const left = moreLeft ? "" : ":";
    const right = moreRight ? "" : ":";
    const possibilities = [];
    if (!moreLeft && !moreRight) {
      possibilities.push("::");
    }
    if (moreLeft && moreRight) {
      possibilities.push("");
    }
    if (moreRight && !moreLeft || !moreRight && moreLeft) {
      possibilities.push(":");
    }
    possibilities.push(`${left}(:0{1,4}){1,${elidedGroups - 1}}`);
    possibilities.push(`(0{1,4}:){1,${elidedGroups - 1}}${right}`);
    possibilities.push(`(0{1,4}:){${elidedGroups - 1}}0{1,4}`);
    for (let groups = 1;groups < elidedGroups - 1; groups++) {
      for (let position = 1;position < elidedGroups - groups; position++) {
        possibilities.push(`(0{1,4}:){${position}}:(0{1,4}:){${elidedGroups - position - groups - 1}}0{1,4}`);
      }
    }
    return groupPossibilities(possibilities);
  }
});

// node_modules/ip-address/dist/ipv6.js
var require_ipv6 = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
  } : function(o, v) {
    o["default"] = v;
  });
  var __importStar = exports && exports.__importStar || function(mod) {
    if (mod && mod.__esModule)
      return mod;
    var result2 = {};
    if (mod != null) {
      for (var k in mod)
        if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result2, mod, k);
    }
    __setModuleDefault(result2, mod);
    return result2;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.Address6 = undefined;
  var common = __importStar(require_common());
  var constants4 = __importStar(require_constants2());
  var constants6 = __importStar(require_constants3());
  var helpers = __importStar(require_helpers());
  var ipv4_1 = require_ipv4();
  var regular_expressions_1 = require_regular_expressions();
  var address_error_1 = require_address_error();
  var common_1 = require_common();
  function assert2(condition) {
    if (!condition) {
      throw new Error("Assertion failed.");
    }
  }
  function addCommas(number4) {
    const r = /(\d+)(\d{3})/;
    while (r.test(number4)) {
      number4 = number4.replace(r, "$1,$2");
    }
    return number4;
  }
  function spanLeadingZeroes4(n) {
    n = n.replace(/^(0{1,})([1-9]+)$/, '<span class="parse-error">$1</span>$2');
    n = n.replace(/^(0{1,})(0)$/, '<span class="parse-error">$1</span>$2');
    return n;
  }
  function compact2(address, slice) {
    const s1 = [];
    const s2 = [];
    let i;
    for (i = 0;i < address.length; i++) {
      if (i < slice[0]) {
        s1.push(address[i]);
      } else if (i > slice[1]) {
        s2.push(address[i]);
      }
    }
    return s1.concat(["compact"]).concat(s2);
  }
  function paddedHex(octet) {
    return parseInt(octet, 16).toString(16).padStart(4, "0");
  }
  function unsignByte(b) {
    return b & 255;
  }

  class Address6 {
    constructor(address, optionalGroups) {
      this.addressMinusSuffix = "";
      this.parsedSubnet = "";
      this.subnet = "/128";
      this.subnetMask = 128;
      this.v4 = false;
      this.zone = "";
      this.isInSubnet = common.isInSubnet;
      this.isCorrect = common.isCorrect(constants6.BITS);
      if (optionalGroups === undefined) {
        this.groups = constants6.GROUPS;
      } else {
        this.groups = optionalGroups;
      }
      this.address = address;
      const subnet = constants6.RE_SUBNET_STRING.exec(address);
      if (subnet) {
        this.parsedSubnet = subnet[0].replace("/", "");
        this.subnetMask = parseInt(this.parsedSubnet, 10);
        this.subnet = `/${this.subnetMask}`;
        if (Number.isNaN(this.subnetMask) || this.subnetMask < 0 || this.subnetMask > constants6.BITS) {
          throw new address_error_1.AddressError("Invalid subnet mask.");
        }
        address = address.replace(constants6.RE_SUBNET_STRING, "");
      } else if (/\//.test(address)) {
        throw new address_error_1.AddressError("Invalid subnet mask.");
      }
      const zone = constants6.RE_ZONE_STRING.exec(address);
      if (zone) {
        this.zone = zone[0];
        address = address.replace(constants6.RE_ZONE_STRING, "");
      }
      this.addressMinusSuffix = address;
      this.parsedAddress = this.parse(this.addressMinusSuffix);
    }
    static isValid(address) {
      try {
        new Address6(address);
        return true;
      } catch (e) {
        return false;
      }
    }
    static fromBigInt(bigInt) {
      const hex = bigInt.toString(16).padStart(32, "0");
      const groups = [];
      let i;
      for (i = 0;i < constants6.GROUPS; i++) {
        groups.push(hex.slice(i * 4, (i + 1) * 4));
      }
      return new Address6(groups.join(":"));
    }
    static fromURL(url) {
      let host;
      let port = null;
      let result2;
      if (url.indexOf("[") !== -1 && url.indexOf("]:") !== -1) {
        result2 = constants6.RE_URL_WITH_PORT.exec(url);
        if (result2 === null) {
          return {
            error: "failed to parse address with port",
            address: null,
            port: null
          };
        }
        host = result2[1];
        port = result2[2];
      } else if (url.indexOf("/") !== -1) {
        url = url.replace(/^[a-z0-9]+:\/\//, "");
        result2 = constants6.RE_URL.exec(url);
        if (result2 === null) {
          return {
            error: "failed to parse address from URL",
            address: null,
            port: null
          };
        }
        host = result2[1];
      } else {
        host = url;
      }
      if (port) {
        port = parseInt(port, 10);
        if (port < 0 || port > 65536) {
          port = null;
        }
      } else {
        port = null;
      }
      return {
        address: new Address6(host),
        port
      };
    }
    static fromAddress4(address) {
      const address4 = new ipv4_1.Address4(address);
      const mask6 = constants6.BITS - (constants4.BITS - address4.subnetMask);
      return new Address6(`::ffff:${address4.correctForm()}/${mask6}`);
    }
    static fromArpa(arpaFormAddress) {
      let address = arpaFormAddress.replace(/(\.ip6\.arpa)?\.$/, "");
      const semicolonAmount = 7;
      if (address.length !== 63) {
        throw new address_error_1.AddressError("Invalid 'ip6.arpa' form.");
      }
      const parts = address.split(".").reverse();
      for (let i = semicolonAmount;i > 0; i--) {
        const insertIndex = i * 4;
        parts.splice(insertIndex, 0, ":");
      }
      address = parts.join("");
      return new Address6(address);
    }
    microsoftTranscription() {
      return `${this.correctForm().replace(/:/g, "-")}.ipv6-literal.net`;
    }
    mask(mask = this.subnetMask) {
      return this.getBitsBase2(0, mask);
    }
    possibleSubnets(subnetSize = 128) {
      const availableBits = constants6.BITS - this.subnetMask;
      const subnetBits = Math.abs(subnetSize - constants6.BITS);
      const subnetPowers = availableBits - subnetBits;
      if (subnetPowers < 0) {
        return "0";
      }
      return addCommas((BigInt("2") ** BigInt(subnetPowers)).toString(10));
    }
    _startAddress() {
      return BigInt(`0b${this.mask() + "0".repeat(constants6.BITS - this.subnetMask)}`);
    }
    startAddress() {
      return Address6.fromBigInt(this._startAddress());
    }
    startAddressExclusive() {
      const adjust = BigInt("1");
      return Address6.fromBigInt(this._startAddress() + adjust);
    }
    _endAddress() {
      return BigInt(`0b${this.mask() + "1".repeat(constants6.BITS - this.subnetMask)}`);
    }
    endAddress() {
      return Address6.fromBigInt(this._endAddress());
    }
    endAddressExclusive() {
      const adjust = BigInt("1");
      return Address6.fromBigInt(this._endAddress() - adjust);
    }
    getScope() {
      let scope = constants6.SCOPES[parseInt(this.getBits(12, 16).toString(10), 10)];
      if (this.getType() === "Global unicast" && scope !== "Link local") {
        scope = "Global";
      }
      return scope || "Unknown";
    }
    getType() {
      for (const subnet of Object.keys(constants6.TYPES)) {
        if (this.isInSubnet(new Address6(subnet))) {
          return constants6.TYPES[subnet];
        }
      }
      return "Global unicast";
    }
    getBits(start, end) {
      return BigInt(`0b${this.getBitsBase2(start, end)}`);
    }
    getBitsBase2(start, end) {
      return this.binaryZeroPad().slice(start, end);
    }
    getBitsBase16(start, end) {
      const length = end - start;
      if (length % 4 !== 0) {
        throw new Error("Length of bits to retrieve must be divisible by four");
      }
      return this.getBits(start, end).toString(16).padStart(length / 4, "0");
    }
    getBitsPastSubnet() {
      return this.getBitsBase2(this.subnetMask, constants6.BITS);
    }
    reverseForm(options) {
      if (!options) {
        options = {};
      }
      const characters = Math.floor(this.subnetMask / 4);
      const reversed = this.canonicalForm().replace(/:/g, "").split("").slice(0, characters).reverse().join(".");
      if (characters > 0) {
        if (options.omitSuffix) {
          return reversed;
        }
        return `${reversed}.ip6.arpa.`;
      }
      if (options.omitSuffix) {
        return "";
      }
      return "ip6.arpa.";
    }
    correctForm() {
      let i;
      let groups = [];
      let zeroCounter = 0;
      const zeroes = [];
      for (i = 0;i < this.parsedAddress.length; i++) {
        const value = parseInt(this.parsedAddress[i], 16);
        if (value === 0) {
          zeroCounter++;
        }
        if (value !== 0 && zeroCounter > 0) {
          if (zeroCounter > 1) {
            zeroes.push([i - zeroCounter, i - 1]);
          }
          zeroCounter = 0;
        }
      }
      if (zeroCounter > 1) {
        zeroes.push([this.parsedAddress.length - zeroCounter, this.parsedAddress.length - 1]);
      }
      const zeroLengths = zeroes.map((n) => n[1] - n[0] + 1);
      if (zeroes.length > 0) {
        const index = zeroLengths.indexOf(Math.max(...zeroLengths));
        groups = compact2(this.parsedAddress, zeroes[index]);
      } else {
        groups = this.parsedAddress;
      }
      for (i = 0;i < groups.length; i++) {
        if (groups[i] !== "compact") {
          groups[i] = parseInt(groups[i], 16).toString(16);
        }
      }
      let correct = groups.join(":");
      correct = correct.replace(/^compact$/, "::");
      correct = correct.replace(/(^compact)|(compact$)/, ":");
      correct = correct.replace(/compact/, "");
      return correct;
    }
    binaryZeroPad() {
      return this.bigInt().toString(2).padStart(constants6.BITS, "0");
    }
    parse4in6(address) {
      const groups = address.split(":");
      const lastGroup = groups.slice(-1)[0];
      const address4 = lastGroup.match(constants4.RE_ADDRESS);
      if (address4) {
        this.parsedAddress4 = address4[0];
        this.address4 = new ipv4_1.Address4(this.parsedAddress4);
        for (let i = 0;i < this.address4.groups; i++) {
          if (/^0[0-9]+/.test(this.address4.parsedAddress[i])) {
            throw new address_error_1.AddressError("IPv4 addresses can't have leading zeroes.", address.replace(constants4.RE_ADDRESS, this.address4.parsedAddress.map(spanLeadingZeroes4).join(".")));
          }
        }
        this.v4 = true;
        groups[groups.length - 1] = this.address4.toGroup6();
        address = groups.join(":");
      }
      return address;
    }
    parse(address) {
      address = this.parse4in6(address);
      const badCharacters = address.match(constants6.RE_BAD_CHARACTERS);
      if (badCharacters) {
        throw new address_error_1.AddressError(`Bad character${badCharacters.length > 1 ? "s" : ""} detected in address: ${badCharacters.join("")}`, address.replace(constants6.RE_BAD_CHARACTERS, '<span class="parse-error">$1</span>'));
      }
      const badAddress = address.match(constants6.RE_BAD_ADDRESS);
      if (badAddress) {
        throw new address_error_1.AddressError(`Address failed regex: ${badAddress.join("")}`, address.replace(constants6.RE_BAD_ADDRESS, '<span class="parse-error">$1</span>'));
      }
      let groups = [];
      const halves = address.split("::");
      if (halves.length === 2) {
        let first4 = halves[0].split(":");
        let last2 = halves[1].split(":");
        if (first4.length === 1 && first4[0] === "") {
          first4 = [];
        }
        if (last2.length === 1 && last2[0] === "") {
          last2 = [];
        }
        const remaining = this.groups - (first4.length + last2.length);
        if (!remaining) {
          throw new address_error_1.AddressError("Error parsing groups");
        }
        this.elidedGroups = remaining;
        this.elisionBegin = first4.length;
        this.elisionEnd = first4.length + this.elidedGroups;
        groups = groups.concat(first4);
        for (let i = 0;i < remaining; i++) {
          groups.push("0");
        }
        groups = groups.concat(last2);
      } else if (halves.length === 1) {
        groups = address.split(":");
        this.elidedGroups = 0;
      } else {
        throw new address_error_1.AddressError("Too many :: groups found");
      }
      groups = groups.map((group) => parseInt(group, 16).toString(16));
      if (groups.length !== this.groups) {
        throw new address_error_1.AddressError("Incorrect number of groups found");
      }
      return groups;
    }
    canonicalForm() {
      return this.parsedAddress.map(paddedHex).join(":");
    }
    decimal() {
      return this.parsedAddress.map((n) => parseInt(n, 16).toString(10).padStart(5, "0")).join(":");
    }
    bigInt() {
      return BigInt(`0x${this.parsedAddress.map(paddedHex).join("")}`);
    }
    to4() {
      const binary = this.binaryZeroPad().split("");
      return ipv4_1.Address4.fromHex(BigInt(`0b${binary.slice(96, 128).join("")}`).toString(16));
    }
    to4in6() {
      const address4 = this.to4();
      const address6 = new Address6(this.parsedAddress.slice(0, 6).join(":"), 6);
      const correct = address6.correctForm();
      let infix = "";
      if (!/:$/.test(correct)) {
        infix = ":";
      }
      return correct + infix + address4.address;
    }
    inspectTeredo() {
      const prefix = this.getBitsBase16(0, 32);
      const bitsForUdpPort = this.getBits(80, 96);
      const udpPort = (bitsForUdpPort ^ BigInt("0xffff")).toString();
      const server4 = ipv4_1.Address4.fromHex(this.getBitsBase16(32, 64));
      const bitsForClient4 = this.getBits(96, 128);
      const client4 = ipv4_1.Address4.fromHex((bitsForClient4 ^ BigInt("0xffffffff")).toString(16));
      const flagsBase2 = this.getBitsBase2(64, 80);
      const coneNat = (0, common_1.testBit)(flagsBase2, 15);
      const reserved = (0, common_1.testBit)(flagsBase2, 14);
      const groupIndividual = (0, common_1.testBit)(flagsBase2, 8);
      const universalLocal = (0, common_1.testBit)(flagsBase2, 9);
      const nonce = BigInt(`0b${flagsBase2.slice(2, 6) + flagsBase2.slice(8, 16)}`).toString(10);
      return {
        prefix: `${prefix.slice(0, 4)}:${prefix.slice(4, 8)}`,
        server4: server4.address,
        client4: client4.address,
        flags: flagsBase2,
        coneNat,
        microsoft: {
          reserved,
          universalLocal,
          groupIndividual,
          nonce
        },
        udpPort
      };
    }
    inspect6to4() {
      const prefix = this.getBitsBase16(0, 16);
      const gateway = ipv4_1.Address4.fromHex(this.getBitsBase16(16, 48));
      return {
        prefix: prefix.slice(0, 4),
        gateway: gateway.address
      };
    }
    to6to4() {
      if (!this.is4()) {
        return null;
      }
      const addr6to4 = [
        "2002",
        this.getBitsBase16(96, 112),
        this.getBitsBase16(112, 128),
        "",
        "/16"
      ].join(":");
      return new Address6(addr6to4);
    }
    toByteArray() {
      const valueWithoutPadding = this.bigInt().toString(16);
      const leadingPad = "0".repeat(valueWithoutPadding.length % 2);
      const value = `${leadingPad}${valueWithoutPadding}`;
      const bytes = [];
      for (let i = 0, length = value.length;i < length; i += 2) {
        bytes.push(parseInt(value.substring(i, i + 2), 16));
      }
      return bytes;
    }
    toUnsignedByteArray() {
      return this.toByteArray().map(unsignByte);
    }
    static fromByteArray(bytes) {
      return this.fromUnsignedByteArray(bytes.map(unsignByte));
    }
    static fromUnsignedByteArray(bytes) {
      const BYTE_MAX = BigInt("256");
      let result2 = BigInt("0");
      let multiplier = BigInt("1");
      for (let i = bytes.length - 1;i >= 0; i--) {
        result2 += multiplier * BigInt(bytes[i].toString(10));
        multiplier *= BYTE_MAX;
      }
      return Address6.fromBigInt(result2);
    }
    isCanonical() {
      return this.addressMinusSuffix === this.canonicalForm();
    }
    isLinkLocal() {
      if (this.getBitsBase2(0, 64) === "1111111010000000000000000000000000000000000000000000000000000000") {
        return true;
      }
      return false;
    }
    isMulticast() {
      return this.getType() === "Multicast";
    }
    is4() {
      return this.v4;
    }
    isTeredo() {
      return this.isInSubnet(new Address6("2001::/32"));
    }
    is6to4() {
      return this.isInSubnet(new Address6("2002::/16"));
    }
    isLoopback() {
      return this.getType() === "Loopback";
    }
    href(optionalPort) {
      if (optionalPort === undefined) {
        optionalPort = "";
      } else {
        optionalPort = `:${optionalPort}`;
      }
      return `http://[${this.correctForm()}]${optionalPort}/`;
    }
    link(options) {
      if (!options) {
        options = {};
      }
      if (options.className === undefined) {
        options.className = "";
      }
      if (options.prefix === undefined) {
        options.prefix = "/#address=";
      }
      if (options.v4 === undefined) {
        options.v4 = false;
      }
      let formFunction = this.correctForm;
      if (options.v4) {
        formFunction = this.to4in6;
      }
      const form = formFunction.call(this);
      if (options.className) {
        return `<a href="${options.prefix}${form}" class="${options.className}">${form}</a>`;
      }
      return `<a href="${options.prefix}${form}">${form}</a>`;
    }
    group() {
      if (this.elidedGroups === 0) {
        return helpers.simpleGroup(this.address).join(":");
      }
      assert2(typeof this.elidedGroups === "number");
      assert2(typeof this.elisionBegin === "number");
      const output = [];
      const [left, right] = this.address.split("::");
      if (left.length) {
        output.push(...helpers.simpleGroup(left));
      } else {
        output.push("");
      }
      const classes = ["hover-group"];
      for (let i = this.elisionBegin;i < this.elisionBegin + this.elidedGroups; i++) {
        classes.push(`group-${i}`);
      }
      output.push(`<span class="${classes.join(" ")}"></span>`);
      if (right.length) {
        output.push(...helpers.simpleGroup(right, this.elisionEnd));
      } else {
        output.push("");
      }
      if (this.is4()) {
        assert2(this.address4 instanceof ipv4_1.Address4);
        output.pop();
        output.push(this.address4.groupForV6());
      }
      return output.join(":");
    }
    regularExpressionString(substringSearch = false) {
      let output = [];
      const address6 = new Address6(this.correctForm());
      if (address6.elidedGroups === 0) {
        output.push((0, regular_expressions_1.simpleRegularExpression)(address6.parsedAddress));
      } else if (address6.elidedGroups === constants6.GROUPS) {
        output.push((0, regular_expressions_1.possibleElisions)(constants6.GROUPS));
      } else {
        const halves = address6.address.split("::");
        if (halves[0].length) {
          output.push((0, regular_expressions_1.simpleRegularExpression)(halves[0].split(":")));
        }
        assert2(typeof address6.elidedGroups === "number");
        output.push((0, regular_expressions_1.possibleElisions)(address6.elidedGroups, halves[0].length !== 0, halves[1].length !== 0));
        if (halves[1].length) {
          output.push((0, regular_expressions_1.simpleRegularExpression)(halves[1].split(":")));
        }
        output = [output.join(":")];
      }
      if (!substringSearch) {
        output = [
          "(?=^|",
          regular_expressions_1.ADDRESS_BOUNDARY,
          "|[^\\w\\:])(",
          ...output,
          ")(?=[^\\w\\:]|",
          regular_expressions_1.ADDRESS_BOUNDARY,
          "|$)"
        ];
      }
      return output.join("");
    }
    regularExpression(substringSearch = false) {
      return new RegExp(this.regularExpressionString(substringSearch), "i");
    }
  }
  exports.Address6 = Address6;
});

// node_modules/ip-address/dist/ip-address.js
var require_ip_address = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
  } : function(o, v) {
    o["default"] = v;
  });
  var __importStar = exports && exports.__importStar || function(mod) {
    if (mod && mod.__esModule)
      return mod;
    var result2 = {};
    if (mod != null) {
      for (var k in mod)
        if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
          __createBinding(result2, mod, k);
    }
    __setModuleDefault(result2, mod);
    return result2;
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.v6 = exports.AddressError = exports.Address6 = exports.Address4 = undefined;
  var ipv4_1 = require_ipv4();
  Object.defineProperty(exports, "Address4", { enumerable: true, get: function() {
    return ipv4_1.Address4;
  } });
  var ipv6_1 = require_ipv6();
  Object.defineProperty(exports, "Address6", { enumerable: true, get: function() {
    return ipv6_1.Address6;
  } });
  var address_error_1 = require_address_error();
  Object.defineProperty(exports, "AddressError", { enumerable: true, get: function() {
    return address_error_1.AddressError;
  } });
  var helpers = __importStar(require_helpers());
  exports.v6 = { helpers };
});

// node_modules/socks/build/common/helpers.js
var require_helpers2 = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ipToBuffer = exports.int32ToIpv4 = exports.ipv4ToInt32 = exports.validateSocksClientChainOptions = exports.validateSocksClientOptions = undefined;
  var util_1 = require_util2();
  var constants_1 = require_constants();
  var stream = __require("stream");
  var ip_address_1 = require_ip_address();
  var net = __require("net");
  function validateSocksClientOptions(options, acceptedCommands = ["connect", "bind", "associate"]) {
    if (!constants_1.SocksCommand[options.command]) {
      throw new util_1.SocksClientError(constants_1.ERRORS.InvalidSocksCommand, options);
    }
    if (acceptedCommands.indexOf(options.command) === -1) {
      throw new util_1.SocksClientError(constants_1.ERRORS.InvalidSocksCommandForOperation, options);
    }
    if (!isValidSocksRemoteHost(options.destination)) {
      throw new util_1.SocksClientError(constants_1.ERRORS.InvalidSocksClientOptionsDestination, options);
    }
    if (!isValidSocksProxy(options.proxy)) {
      throw new util_1.SocksClientError(constants_1.ERRORS.InvalidSocksClientOptionsProxy, options);
    }
    validateCustomProxyAuth(options.proxy, options);
    if (options.timeout && !isValidTimeoutValue(options.timeout)) {
      throw new util_1.SocksClientError(constants_1.ERRORS.InvalidSocksClientOptionsTimeout, options);
    }
    if (options.existing_socket && !(options.existing_socket instanceof stream.Duplex)) {
      throw new util_1.SocksClientError(constants_1.ERRORS.InvalidSocksClientOptionsExistingSocket, options);
    }
  }
  exports.validateSocksClientOptions = validateSocksClientOptions;
  function validateSocksClientChainOptions(options) {
    if (options.command !== "connect") {
      throw new util_1.SocksClientError(constants_1.ERRORS.InvalidSocksCommandChain, options);
    }
    if (!isValidSocksRemoteHost(options.destination)) {
      throw new util_1.SocksClientError(constants_1.ERRORS.InvalidSocksClientOptionsDestination, options);
    }
    if (!(options.proxies && Array.isArray(options.proxies) && options.proxies.length >= 2)) {
      throw new util_1.SocksClientError(constants_1.ERRORS.InvalidSocksClientOptionsProxiesLength, options);
    }
    options.proxies.forEach((proxy) => {
      if (!isValidSocksProxy(proxy)) {
        throw new util_1.SocksClientError(constants_1.ERRORS.InvalidSocksClientOptionsProxy, options);
      }
      validateCustomProxyAuth(proxy, options);
    });
    if (options.timeout && !isValidTimeoutValue(options.timeout)) {
      throw new util_1.SocksClientError(constants_1.ERRORS.InvalidSocksClientOptionsTimeout, options);
    }
  }
  exports.validateSocksClientChainOptions = validateSocksClientChainOptions;
  function validateCustomProxyAuth(proxy, options) {
    if (proxy.custom_auth_method !== undefined) {
      if (proxy.custom_auth_method < constants_1.SOCKS5_CUSTOM_AUTH_START || proxy.custom_auth_method > constants_1.SOCKS5_CUSTOM_AUTH_END) {
        throw new util_1.SocksClientError(constants_1.ERRORS.InvalidSocksClientOptionsCustomAuthRange, options);
      }
      if (proxy.custom_auth_request_handler === undefined || typeof proxy.custom_auth_request_handler !== "function") {
        throw new util_1.SocksClientError(constants_1.ERRORS.InvalidSocksClientOptionsCustomAuthOptions, options);
      }
      if (proxy.custom_auth_response_size === undefined) {
        throw new util_1.SocksClientError(constants_1.ERRORS.InvalidSocksClientOptionsCustomAuthOptions, options);
      }
      if (proxy.custom_auth_response_handler === undefined || typeof proxy.custom_auth_response_handler !== "function") {
        throw new util_1.SocksClientError(constants_1.ERRORS.InvalidSocksClientOptionsCustomAuthOptions, options);
      }
    }
  }
  function isValidSocksRemoteHost(remoteHost) {
    return remoteHost && typeof remoteHost.host === "string" && Buffer.byteLength(remoteHost.host) < 256 && typeof remoteHost.port === "number" && remoteHost.port >= 0 && remoteHost.port <= 65535;
  }
  function isValidSocksProxy(proxy) {
    return proxy && (typeof proxy.host === "string" || typeof proxy.ipaddress === "string") && typeof proxy.port === "number" && proxy.port >= 0 && proxy.port <= 65535 && (proxy.type === 4 || proxy.type === 5);
  }
  function isValidTimeoutValue(value) {
    return typeof value === "number" && value > 0;
  }
  function ipv4ToInt32(ip) {
    const address = new ip_address_1.Address4(ip);
    return address.toArray().reduce((acc, part) => (acc << 8) + part, 0) >>> 0;
  }
  exports.ipv4ToInt32 = ipv4ToInt32;
  function int32ToIpv4(int32) {
    const octet1 = int32 >>> 24 & 255;
    const octet2 = int32 >>> 16 & 255;
    const octet3 = int32 >>> 8 & 255;
    const octet4 = int32 & 255;
    return [octet1, octet2, octet3, octet4].join(".");
  }
  exports.int32ToIpv4 = int32ToIpv4;
  function ipToBuffer(ip) {
    if (net.isIPv4(ip)) {
      const address = new ip_address_1.Address4(ip);
      return Buffer.from(address.toArray());
    } else if (net.isIPv6(ip)) {
      const address = new ip_address_1.Address6(ip);
      return Buffer.from(address.canonicalForm().split(":").map((segment) => segment.padStart(4, "0")).join(""), "hex");
    } else {
      throw new Error("Invalid IP address format");
    }
  }
  exports.ipToBuffer = ipToBuffer;
});

// node_modules/socks/build/common/receivebuffer.js
var require_receivebuffer = __commonJS((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ReceiveBuffer = undefined;

  class ReceiveBuffer {
    constructor(size2 = 4096) {
      this.buffer = Buffer.allocUnsafe(size2);
      this.offset = 0;
      this.originalSize = size2;
    }
    get length() {
      return this.offset;
    }
    append(data) {
      if (!Buffer.isBuffer(data)) {
        throw new Error("Attempted to append a non-buffer instance to ReceiveBuffer.");
      }
      if (this.offset + data.length >= this.buffer.length) {
        const tmp = this.buffer;
        this.buffer = Buffer.allocUnsafe(Math.max(this.buffer.length + this.originalSize, this.buffer.length + data.length));
        tmp.copy(this.buffer);
      }
      data.copy(this.buffer, this.offset);
      return this.offset += data.length;
    }
    peek(length) {
      if (length > this.offset) {
        throw new Error("Attempted to read beyond the bounds of the managed internal data.");
      }
      return this.buffer.slice(0, length);
    }
    get(length) {
      if (length > this.offset) {
        throw new Error("Attempted to read beyond the bounds of the managed internal data.");
      }
      const value = Buffer.allocUnsafe(length);
      this.buffer.slice(0, length).copy(value);
      this.buffer.copyWithin(0, length, length + this.offset - length);
      this.offset -= length;
      return value;
    }
  }
  exports.ReceiveBuffer = ReceiveBuffer;
});

// node_modules/socks/build/client/socksclient.js
var require_socksclient = __commonJS((exports) => {
  var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P ? value : new P(function(resolve) {
        resolve(value);
      });
    }
    return new (P || (P = Promise))(function(resolve, reject2) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject2(e);
        }
      }
      function rejected(value) {
        try {
          step(generator["throw"](value));
        } catch (e) {
          reject2(e);
        }
      }
      function step(result2) {
        result2.done ? resolve(result2.value) : adopt(result2.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.SocksClientError = exports.SocksClient = undefined;
  var events_1 = __require("events");
  var net = __require("net");
  var smart_buffer_1 = require_smartbuffer();
  var constants_1 = require_constants();
  var helpers_1 = require_helpers2();
  var receivebuffer_1 = require_receivebuffer();
  var util_1 = require_util2();
  Object.defineProperty(exports, "SocksClientError", { enumerable: true, get: function() {
    return util_1.SocksClientError;
  } });
  var ip_address_1 = require_ip_address();

  class SocksClient extends events_1.EventEmitter {
    constructor(options) {
      super();
      this.options = Object.assign({}, options);
      (0, helpers_1.validateSocksClientOptions)(options);
      this.setState(constants_1.SocksClientState.Created);
    }
    static createConnection(options, callback) {
      return new Promise((resolve, reject2) => {
        try {
          (0, helpers_1.validateSocksClientOptions)(options, ["connect"]);
        } catch (err) {
          if (typeof callback === "function") {
            callback(err);
            return resolve(err);
          } else {
            return reject2(err);
          }
        }
        const client = new SocksClient(options);
        client.connect(options.existing_socket);
        client.once("established", (info) => {
          client.removeAllListeners();
          if (typeof callback === "function") {
            callback(null, info);
            resolve(info);
          } else {
            resolve(info);
          }
        });
        client.once("error", (err) => {
          client.removeAllListeners();
          if (typeof callback === "function") {
            callback(err);
            resolve(err);
          } else {
            reject2(err);
          }
        });
      });
    }
    static createConnectionChain(options, callback) {
      return new Promise((resolve, reject2) => __awaiter(this, undefined, undefined, function* () {
        try {
          (0, helpers_1.validateSocksClientChainOptions)(options);
        } catch (err) {
          if (typeof callback === "function") {
            callback(err);
            return resolve(err);
          } else {
            return reject2(err);
          }
        }
        if (options.randomizeChain) {
          (0, util_1.shuffleArray)(options.proxies);
        }
        try {
          let sock;
          for (let i = 0;i < options.proxies.length; i++) {
            const nextProxy = options.proxies[i];
            const nextDestination = i === options.proxies.length - 1 ? options.destination : {
              host: options.proxies[i + 1].host || options.proxies[i + 1].ipaddress,
              port: options.proxies[i + 1].port
            };
            const result2 = yield SocksClient.createConnection({
              command: "connect",
              proxy: nextProxy,
              destination: nextDestination,
              existing_socket: sock
            });
            sock = sock || result2.socket;
          }
          if (typeof callback === "function") {
            callback(null, { socket: sock });
            resolve({ socket: sock });
          } else {
            resolve({ socket: sock });
          }
        } catch (err) {
          if (typeof callback === "function") {
            callback(err);
            resolve(err);
          } else {
            reject2(err);
          }
        }
      }));
    }
    static createUDPFrame(options) {
      const buff = new smart_buffer_1.SmartBuffer;
      buff.writeUInt16BE(0);
      buff.writeUInt8(options.frameNumber || 0);
      if (net.isIPv4(options.remoteHost.host)) {
        buff.writeUInt8(constants_1.Socks5HostType.IPv4);
        buff.writeUInt32BE((0, helpers_1.ipv4ToInt32)(options.remoteHost.host));
      } else if (net.isIPv6(options.remoteHost.host)) {
        buff.writeUInt8(constants_1.Socks5HostType.IPv6);
        buff.writeBuffer((0, helpers_1.ipToBuffer)(options.remoteHost.host));
      } else {
        buff.writeUInt8(constants_1.Socks5HostType.Hostname);
        buff.writeUInt8(Buffer.byteLength(options.remoteHost.host));
        buff.writeString(options.remoteHost.host);
      }
      buff.writeUInt16BE(options.remoteHost.port);
      buff.writeBuffer(options.data);
      return buff.toBuffer();
    }
    static parseUDPFrame(data) {
      const buff = smart_buffer_1.SmartBuffer.fromBuffer(data);
      buff.readOffset = 2;
      const frameNumber = buff.readUInt8();
      const hostType = buff.readUInt8();
      let remoteHost;
      if (hostType === constants_1.Socks5HostType.IPv4) {
        remoteHost = (0, helpers_1.int32ToIpv4)(buff.readUInt32BE());
      } else if (hostType === constants_1.Socks5HostType.IPv6) {
        remoteHost = ip_address_1.Address6.fromByteArray(Array.from(buff.readBuffer(16))).canonicalForm();
      } else {
        remoteHost = buff.readString(buff.readUInt8());
      }
      const remotePort = buff.readUInt16BE();
      return {
        frameNumber,
        remoteHost: {
          host: remoteHost,
          port: remotePort
        },
        data: buff.readBuffer()
      };
    }
    setState(newState) {
      if (this.state !== constants_1.SocksClientState.Error) {
        this.state = newState;
      }
    }
    connect(existingSocket) {
      this.onDataReceived = (data) => this.onDataReceivedHandler(data);
      this.onClose = () => this.onCloseHandler();
      this.onError = (err) => this.onErrorHandler(err);
      this.onConnect = () => this.onConnectHandler();
      const timer = setTimeout(() => this.onEstablishedTimeout(), this.options.timeout || constants_1.DEFAULT_TIMEOUT);
      if (timer.unref && typeof timer.unref === "function") {
        timer.unref();
      }
      if (existingSocket) {
        this.socket = existingSocket;
      } else {
        this.socket = new net.Socket;
      }
      this.socket.once("close", this.onClose);
      this.socket.once("error", this.onError);
      this.socket.once("connect", this.onConnect);
      this.socket.on("data", this.onDataReceived);
      this.setState(constants_1.SocksClientState.Connecting);
      this.receiveBuffer = new receivebuffer_1.ReceiveBuffer;
      if (existingSocket) {
        this.socket.emit("connect");
      } else {
        this.socket.connect(this.getSocketOptions());
        if (this.options.set_tcp_nodelay !== undefined && this.options.set_tcp_nodelay !== null) {
          this.socket.setNoDelay(!!this.options.set_tcp_nodelay);
        }
      }
      this.prependOnceListener("established", (info) => {
        setImmediate(() => {
          if (this.receiveBuffer.length > 0) {
            const excessData = this.receiveBuffer.get(this.receiveBuffer.length);
            info.socket.emit("data", excessData);
          }
          info.socket.resume();
        });
      });
    }
    getSocketOptions() {
      return Object.assign(Object.assign({}, this.options.socket_options), { host: this.options.proxy.host || this.options.proxy.ipaddress, port: this.options.proxy.port });
    }
    onEstablishedTimeout() {
      if (this.state !== constants_1.SocksClientState.Established && this.state !== constants_1.SocksClientState.BoundWaitingForConnection) {
        this.closeSocket(constants_1.ERRORS.ProxyConnectionTimedOut);
      }
    }
    onConnectHandler() {
      this.setState(constants_1.SocksClientState.Connected);
      if (this.options.proxy.type === 4) {
        this.sendSocks4InitialHandshake();
      } else {
        this.sendSocks5InitialHandshake();
      }
      this.setState(constants_1.SocksClientState.SentInitialHandshake);
    }
    onDataReceivedHandler(data) {
      this.receiveBuffer.append(data);
      this.processData();
    }
    processData() {
      while (this.state !== constants_1.SocksClientState.Established && this.state !== constants_1.SocksClientState.Error && this.receiveBuffer.length >= this.nextRequiredPacketBufferSize) {
        if (this.state === constants_1.SocksClientState.SentInitialHandshake) {
          if (this.options.proxy.type === 4) {
            this.handleSocks4FinalHandshakeResponse();
          } else {
            this.handleInitialSocks5HandshakeResponse();
          }
        } else if (this.state === constants_1.SocksClientState.SentAuthentication) {
          this.handleInitialSocks5AuthenticationHandshakeResponse();
        } else if (this.state === constants_1.SocksClientState.SentFinalHandshake) {
          this.handleSocks5FinalHandshakeResponse();
        } else if (this.state === constants_1.SocksClientState.BoundWaitingForConnection) {
          if (this.options.proxy.type === 4) {
            this.handleSocks4IncomingConnectionResponse();
          } else {
            this.handleSocks5IncomingConnectionResponse();
          }
        } else {
          this.closeSocket(constants_1.ERRORS.InternalError);
          break;
        }
      }
    }
    onCloseHandler() {
      this.closeSocket(constants_1.ERRORS.SocketClosed);
    }
    onErrorHandler(err) {
      this.closeSocket(err.message);
    }
    removeInternalSocketHandlers() {
      this.socket.pause();
      this.socket.removeListener("data", this.onDataReceived);
      this.socket.removeListener("close", this.onClose);
      this.socket.removeListener("error", this.onError);
      this.socket.removeListener("connect", this.onConnect);
    }
    closeSocket(err) {
      if (this.state !== constants_1.SocksClientState.Error) {
        this.setState(constants_1.SocksClientState.Error);
        this.socket.destroy();
        this.removeInternalSocketHandlers();
        this.emit("error", new util_1.SocksClientError(err, this.options));
      }
    }
    sendSocks4InitialHandshake() {
      const userId = this.options.proxy.userId || "";
      const buff = new smart_buffer_1.SmartBuffer;
      buff.writeUInt8(4);
      buff.writeUInt8(constants_1.SocksCommand[this.options.command]);
      buff.writeUInt16BE(this.options.destination.port);
      if (net.isIPv4(this.options.destination.host)) {
        buff.writeBuffer((0, helpers_1.ipToBuffer)(this.options.destination.host));
        buff.writeStringNT(userId);
      } else {
        buff.writeUInt8(0);
        buff.writeUInt8(0);
        buff.writeUInt8(0);
        buff.writeUInt8(1);
        buff.writeStringNT(userId);
        buff.writeStringNT(this.options.destination.host);
      }
      this.nextRequiredPacketBufferSize = constants_1.SOCKS_INCOMING_PACKET_SIZES.Socks4Response;
      this.socket.write(buff.toBuffer());
    }
    handleSocks4FinalHandshakeResponse() {
      const data = this.receiveBuffer.get(8);
      if (data[1] !== constants_1.Socks4Response.Granted) {
        this.closeSocket(`${constants_1.ERRORS.Socks4ProxyRejectedConnection} - (${constants_1.Socks4Response[data[1]]})`);
      } else {
        if (constants_1.SocksCommand[this.options.command] === constants_1.SocksCommand.bind) {
          const buff = smart_buffer_1.SmartBuffer.fromBuffer(data);
          buff.readOffset = 2;
          const remoteHost = {
            port: buff.readUInt16BE(),
            host: (0, helpers_1.int32ToIpv4)(buff.readUInt32BE())
          };
          if (remoteHost.host === "0.0.0.0") {
            remoteHost.host = this.options.proxy.ipaddress;
          }
          this.setState(constants_1.SocksClientState.BoundWaitingForConnection);
          this.emit("bound", { remoteHost, socket: this.socket });
        } else {
          this.setState(constants_1.SocksClientState.Established);
          this.removeInternalSocketHandlers();
          this.emit("established", { socket: this.socket });
        }
      }
    }
    handleSocks4IncomingConnectionResponse() {
      const data = this.receiveBuffer.get(8);
      if (data[1] !== constants_1.Socks4Response.Granted) {
        this.closeSocket(`${constants_1.ERRORS.Socks4ProxyRejectedIncomingBoundConnection} - (${constants_1.Socks4Response[data[1]]})`);
      } else {
        const buff = smart_buffer_1.SmartBuffer.fromBuffer(data);
        buff.readOffset = 2;
        const remoteHost = {
          port: buff.readUInt16BE(),
          host: (0, helpers_1.int32ToIpv4)(buff.readUInt32BE())
        };
        this.setState(constants_1.SocksClientState.Established);
        this.removeInternalSocketHandlers();
        this.emit("established", { remoteHost, socket: this.socket });
      }
    }
    sendSocks5InitialHandshake() {
      const buff = new smart_buffer_1.SmartBuffer;
      const supportedAuthMethods = [constants_1.Socks5Auth.NoAuth];
      if (this.options.proxy.userId || this.options.proxy.password) {
        supportedAuthMethods.push(constants_1.Socks5Auth.UserPass);
      }
      if (this.options.proxy.custom_auth_method !== undefined) {
        supportedAuthMethods.push(this.options.proxy.custom_auth_method);
      }
      buff.writeUInt8(5);
      buff.writeUInt8(supportedAuthMethods.length);
      for (const authMethod of supportedAuthMethods) {
        buff.writeUInt8(authMethod);
      }
      this.nextRequiredPacketBufferSize = constants_1.SOCKS_INCOMING_PACKET_SIZES.Socks5InitialHandshakeResponse;
      this.socket.write(buff.toBuffer());
      this.setState(constants_1.SocksClientState.SentInitialHandshake);
    }
    handleInitialSocks5HandshakeResponse() {
      const data = this.receiveBuffer.get(2);
      if (data[0] !== 5) {
        this.closeSocket(constants_1.ERRORS.InvalidSocks5IntiailHandshakeSocksVersion);
      } else if (data[1] === constants_1.SOCKS5_NO_ACCEPTABLE_AUTH) {
        this.closeSocket(constants_1.ERRORS.InvalidSocks5InitialHandshakeNoAcceptedAuthType);
      } else {
        if (data[1] === constants_1.Socks5Auth.NoAuth) {
          this.socks5ChosenAuthType = constants_1.Socks5Auth.NoAuth;
          this.sendSocks5CommandRequest();
        } else if (data[1] === constants_1.Socks5Auth.UserPass) {
          this.socks5ChosenAuthType = constants_1.Socks5Auth.UserPass;
          this.sendSocks5UserPassAuthentication();
        } else if (data[1] === this.options.proxy.custom_auth_method) {
          this.socks5ChosenAuthType = this.options.proxy.custom_auth_method;
          this.sendSocks5CustomAuthentication();
        } else {
          this.closeSocket(constants_1.ERRORS.InvalidSocks5InitialHandshakeUnknownAuthType);
        }
      }
    }
    sendSocks5UserPassAuthentication() {
      const userId = this.options.proxy.userId || "";
      const password = this.options.proxy.password || "";
      const buff = new smart_buffer_1.SmartBuffer;
      buff.writeUInt8(1);
      buff.writeUInt8(Buffer.byteLength(userId));
      buff.writeString(userId);
      buff.writeUInt8(Buffer.byteLength(password));
      buff.writeString(password);
      this.nextRequiredPacketBufferSize = constants_1.SOCKS_INCOMING_PACKET_SIZES.Socks5UserPassAuthenticationResponse;
      this.socket.write(buff.toBuffer());
      this.setState(constants_1.SocksClientState.SentAuthentication);
    }
    sendSocks5CustomAuthentication() {
      return __awaiter(this, undefined, undefined, function* () {
        this.nextRequiredPacketBufferSize = this.options.proxy.custom_auth_response_size;
        this.socket.write(yield this.options.proxy.custom_auth_request_handler());
        this.setState(constants_1.SocksClientState.SentAuthentication);
      });
    }
    handleSocks5CustomAuthHandshakeResponse(data) {
      return __awaiter(this, undefined, undefined, function* () {
        return yield this.options.proxy.custom_auth_response_handler(data);
      });
    }
    handleSocks5AuthenticationNoAuthHandshakeResponse(data) {
      return __awaiter(this, undefined, undefined, function* () {
        return data[1] === 0;
      });
    }
    handleSocks5AuthenticationUserPassHandshakeResponse(data) {
      return __awaiter(this, undefined, undefined, function* () {
        return data[1] === 0;
      });
    }
    handleInitialSocks5AuthenticationHandshakeResponse() {
      return __awaiter(this, undefined, undefined, function* () {
        this.setState(constants_1.SocksClientState.ReceivedAuthenticationResponse);
        let authResult = false;
        if (this.socks5ChosenAuthType === constants_1.Socks5Auth.NoAuth) {
          authResult = yield this.handleSocks5AuthenticationNoAuthHandshakeResponse(this.receiveBuffer.get(2));
        } else if (this.socks5ChosenAuthType === constants_1.Socks5Auth.UserPass) {
          authResult = yield this.handleSocks5AuthenticationUserPassHandshakeResponse(this.receiveBuffer.get(2));
        } else if (this.socks5ChosenAuthType === this.options.proxy.custom_auth_method) {
          authResult = yield this.handleSocks5CustomAuthHandshakeResponse(this.receiveBuffer.get(this.options.proxy.custom_auth_response_size));
        }
        if (!authResult) {
          this.closeSocket(constants_1.ERRORS.Socks5AuthenticationFailed);
        } else {
          this.sendSocks5CommandRequest();
        }
      });
    }
    sendSocks5CommandRequest() {
      const buff = new smart_buffer_1.SmartBuffer;
      buff.writeUInt8(5);
      buff.writeUInt8(constants_1.SocksCommand[this.options.command]);
      buff.writeUInt8(0);
      if (net.isIPv4(this.options.destination.host)) {
        buff.writeUInt8(constants_1.Socks5HostType.IPv4);
        buff.writeBuffer((0, helpers_1.ipToBuffer)(this.options.destination.host));
      } else if (net.isIPv6(this.options.destination.host)) {
        buff.writeUInt8(constants_1.Socks5HostType.IPv6);
        buff.writeBuffer((0, helpers_1.ipToBuffer)(this.options.destination.host));
      } else {
        buff.writeUInt8(constants_1.Socks5HostType.Hostname);
        buff.writeUInt8(this.options.destination.host.length);
        buff.writeString(this.options.destination.host);
      }
      buff.writeUInt16BE(this.options.destination.port);
      this.nextRequiredPacketBufferSize = constants_1.SOCKS_INCOMING_PACKET_SIZES.Socks5ResponseHeader;
      this.socket.write(buff.toBuffer());
      this.setState(constants_1.SocksClientState.SentFinalHandshake);
    }
    handleSocks5FinalHandshakeResponse() {
      const header = this.receiveBuffer.peek(5);
      if (header[0] !== 5 || header[1] !== constants_1.Socks5Response.Granted) {
        this.closeSocket(`${constants_1.ERRORS.InvalidSocks5FinalHandshakeRejected} - ${constants_1.Socks5Response[header[1]]}`);
      } else {
        const addressType = header[3];
        let remoteHost;
        let buff;
        if (addressType === constants_1.Socks5HostType.IPv4) {
          const dataNeeded = constants_1.SOCKS_INCOMING_PACKET_SIZES.Socks5ResponseIPv4;
          if (this.receiveBuffer.length < dataNeeded) {
            this.nextRequiredPacketBufferSize = dataNeeded;
            return;
          }
          buff = smart_buffer_1.SmartBuffer.fromBuffer(this.receiveBuffer.get(dataNeeded).slice(4));
          remoteHost = {
            host: (0, helpers_1.int32ToIpv4)(buff.readUInt32BE()),
            port: buff.readUInt16BE()
          };
          if (remoteHost.host === "0.0.0.0") {
            remoteHost.host = this.options.proxy.ipaddress;
          }
        } else if (addressType === constants_1.Socks5HostType.Hostname) {
          const hostLength = header[4];
          const dataNeeded = constants_1.SOCKS_INCOMING_PACKET_SIZES.Socks5ResponseHostname(hostLength);
          if (this.receiveBuffer.length < dataNeeded) {
            this.nextRequiredPacketBufferSize = dataNeeded;
            return;
          }
          buff = smart_buffer_1.SmartBuffer.fromBuffer(this.receiveBuffer.get(dataNeeded).slice(5));
          remoteHost = {
            host: buff.readString(hostLength),
            port: buff.readUInt16BE()
          };
        } else if (addressType === constants_1.Socks5HostType.IPv6) {
          const dataNeeded = constants_1.SOCKS_INCOMING_PACKET_SIZES.Socks5ResponseIPv6;
          if (this.receiveBuffer.length < dataNeeded) {
            this.nextRequiredPacketBufferSize = dataNeeded;
            return;
          }
          buff = smart_buffer_1.SmartBuffer.fromBuffer(this.receiveBuffer.get(dataNeeded).slice(4));
          remoteHost = {
            host: ip_address_1.Address6.fromByteArray(Array.from(buff.readBuffer(16))).canonicalForm(),
            port: buff.readUInt16BE()
          };
        }
        this.setState(constants_1.SocksClientState.ReceivedFinalResponse);
        if (constants_1.SocksCommand[this.options.command] === constants_1.SocksCommand.connect) {
          this.setState(constants_1.SocksClientState.Established);
          this.removeInternalSocketHandlers();
          this.emit("established", { remoteHost, socket: this.socket });
        } else if (constants_1.SocksCommand[this.options.command] === constants_1.SocksCommand.bind) {
          this.setState(constants_1.SocksClientState.BoundWaitingForConnection);
          this.nextRequiredPacketBufferSize = constants_1.SOCKS_INCOMING_PACKET_SIZES.Socks5ResponseHeader;
          this.emit("bound", { remoteHost, socket: this.socket });
        } else if (constants_1.SocksCommand[this.options.command] === constants_1.SocksCommand.associate) {
          this.setState(constants_1.SocksClientState.Established);
          this.removeInternalSocketHandlers();
          this.emit("established", {
            remoteHost,
            socket: this.socket
          });
        }
      }
    }
    handleSocks5IncomingConnectionResponse() {
      const header = this.receiveBuffer.peek(5);
      if (header[0] !== 5 || header[1] !== constants_1.Socks5Response.Granted) {
        this.closeSocket(`${constants_1.ERRORS.Socks5ProxyRejectedIncomingBoundConnection} - ${constants_1.Socks5Response[header[1]]}`);
      } else {
        const addressType = header[3];
        let remoteHost;
        let buff;
        if (addressType === constants_1.Socks5HostType.IPv4) {
          const dataNeeded = constants_1.SOCKS_INCOMING_PACKET_SIZES.Socks5ResponseIPv4;
          if (this.receiveBuffer.length < dataNeeded) {
            this.nextRequiredPacketBufferSize = dataNeeded;
            return;
          }
          buff = smart_buffer_1.SmartBuffer.fromBuffer(this.receiveBuffer.get(dataNeeded).slice(4));
          remoteHost = {
            host: (0, helpers_1.int32ToIpv4)(buff.readUInt32BE()),
            port: buff.readUInt16BE()
          };
          if (remoteHost.host === "0.0.0.0") {
            remoteHost.host = this.options.proxy.ipaddress;
          }
        } else if (addressType === constants_1.Socks5HostType.Hostname) {
          const hostLength = header[4];
          const dataNeeded = constants_1.SOCKS_INCOMING_PACKET_SIZES.Socks5ResponseHostname(hostLength);
          if (this.receiveBuffer.length < dataNeeded) {
            this.nextRequiredPacketBufferSize = dataNeeded;
            return;
          }
          buff = smart_buffer_1.SmartBuffer.fromBuffer(this.receiveBuffer.get(dataNeeded).slice(5));
          remoteHost = {
            host: buff.readString(hostLength),
            port: buff.readUInt16BE()
          };
        } else if (addressType === constants_1.Socks5HostType.IPv6) {
          const dataNeeded = constants_1.SOCKS_INCOMING_PACKET_SIZES.Socks5ResponseIPv6;
          if (this.receiveBuffer.length < dataNeeded) {
            this.nextRequiredPacketBufferSize = dataNeeded;
            return;
          }
          buff = smart_buffer_1.SmartBuffer.fromBuffer(this.receiveBuffer.get(dataNeeded).slice(4));
          remoteHost = {
            host: ip_address_1.Address6.fromByteArray(Array.from(buff.readBuffer(16))).canonicalForm(),
            port: buff.readUInt16BE()
          };
        }
        this.setState(constants_1.SocksClientState.Established);
        this.removeInternalSocketHandlers();
        this.emit("established", { remoteHost, socket: this.socket });
      }
    }
    get socksClientOptions() {
      return Object.assign({}, this.options);
    }
  }
  exports.SocksClient = SocksClient;
});

// node_modules/socks/build/index.js
var require_build = __commonJS((exports) => {
  var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() {
        return m[k];
      } };
    }
    Object.defineProperty(o, k2, desc);
  } : function(o, m, k, k2) {
    if (k2 === undefined)
      k2 = k;
    o[k2] = m[k];
  });
  var __exportStar = exports && exports.__exportStar || function(m, exports2) {
    for (var p in m)
      if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p))
        __createBinding(exports2, m, p);
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  __exportStar(require_socksclient(), exports);
});

// node_modules/zod/v3/external.js
var exports_external = {};
__export(exports_external, {
  void: () => voidType,
  util: () => util,
  unknown: () => unknownType,
  union: () => unionType,
  undefined: () => undefinedType,
  tuple: () => tupleType,
  transformer: () => effectsType,
  symbol: () => symbolType,
  string: () => stringType,
  strictObject: () => strictObjectType,
  setErrorMap: () => setErrorMap,
  set: () => setType,
  record: () => recordType,
  quotelessJson: () => quotelessJson,
  promise: () => promiseType,
  preprocess: () => preprocessType,
  pipeline: () => pipelineType,
  ostring: () => ostring,
  optional: () => optionalType,
  onumber: () => onumber,
  oboolean: () => oboolean,
  objectUtil: () => objectUtil,
  object: () => objectType,
  number: () => numberType,
  nullable: () => nullableType,
  null: () => nullType,
  never: () => neverType,
  nativeEnum: () => nativeEnumType,
  nan: () => nanType,
  map: () => mapType,
  makeIssue: () => makeIssue,
  literal: () => literalType,
  lazy: () => lazyType,
  late: () => late,
  isValid: () => isValid,
  isDirty: () => isDirty,
  isAsync: () => isAsync,
  isAborted: () => isAborted,
  intersection: () => intersectionType,
  instanceof: () => instanceOfType,
  getParsedType: () => getParsedType,
  getErrorMap: () => getErrorMap,
  function: () => functionType,
  enum: () => enumType,
  effect: () => effectsType,
  discriminatedUnion: () => discriminatedUnionType,
  defaultErrorMap: () => en_default,
  datetimeRegex: () => datetimeRegex,
  date: () => dateType,
  custom: () => custom,
  coerce: () => coerce,
  boolean: () => booleanType,
  bigint: () => bigIntType,
  array: () => arrayType,
  any: () => anyType,
  addIssueToContext: () => addIssueToContext,
  ZodVoid: () => ZodVoid,
  ZodUnknown: () => ZodUnknown,
  ZodUnion: () => ZodUnion,
  ZodUndefined: () => ZodUndefined,
  ZodType: () => ZodType,
  ZodTuple: () => ZodTuple,
  ZodTransformer: () => ZodEffects,
  ZodSymbol: () => ZodSymbol,
  ZodString: () => ZodString,
  ZodSet: () => ZodSet,
  ZodSchema: () => ZodType,
  ZodRecord: () => ZodRecord,
  ZodReadonly: () => ZodReadonly,
  ZodPromise: () => ZodPromise,
  ZodPipeline: () => ZodPipeline,
  ZodParsedType: () => ZodParsedType,
  ZodOptional: () => ZodOptional,
  ZodObject: () => ZodObject,
  ZodNumber: () => ZodNumber,
  ZodNullable: () => ZodNullable,
  ZodNull: () => ZodNull,
  ZodNever: () => ZodNever,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNaN: () => ZodNaN,
  ZodMap: () => ZodMap,
  ZodLiteral: () => ZodLiteral,
  ZodLazy: () => ZodLazy,
  ZodIssueCode: () => ZodIssueCode,
  ZodIntersection: () => ZodIntersection,
  ZodFunction: () => ZodFunction,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodError: () => ZodError,
  ZodEnum: () => ZodEnum,
  ZodEffects: () => ZodEffects,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodDefault: () => ZodDefault,
  ZodDate: () => ZodDate,
  ZodCatch: () => ZodCatch,
  ZodBranded: () => ZodBranded,
  ZodBoolean: () => ZodBoolean,
  ZodBigInt: () => ZodBigInt,
  ZodArray: () => ZodArray,
  ZodAny: () => ZodAny,
  Schema: () => ZodType,
  ParseStatus: () => ParseStatus,
  OK: () => OK,
  NEVER: () => NEVER,
  INVALID: () => INVALID,
  EMPTY_PATH: () => EMPTY_PATH,
  DIRTY: () => DIRTY,
  BRAND: () => BRAND
});

// node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {};
  function assertIs(_arg) {}
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error;
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};

class ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
}
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}
// node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== undefined) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      ctx.schemaErrorMap,
      overrideMap,
      overrideMap === en_default ? undefined : en_default
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}

class ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
}
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
// node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/zod/v3/types.js
class ParseInputLazyPath {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
}
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}

class ZodType {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus,
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(undefined).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}

class ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus;
    let ctx = undefined;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
}
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}

class ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = undefined;
    const status = new ParseStatus;
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
}
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};

class ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = undefined;
    const status = new ParseStatus;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
}
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};

class ZodBoolean extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};

class ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus;
    let ctx = undefined;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
}
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};

class ZodSymbol extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};

class ZodUndefined extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};

class ZodNull extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};

class ZodAny extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
}
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};

class ZodUnknown extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
}
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};

class ZodNever extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
}
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};

class ZodVoid extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};

class ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : undefined,
          maximum: tooBig ? def.exactLength.value : undefined,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
}
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}

class ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {} else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== undefined ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  extend(augmentation) {
    return new ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  merge(merging) {
    const merged = new ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  catchall(index) {
    return new ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
}
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};

class ZodUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = undefined;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
}
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [undefined];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [undefined, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};

class ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  static create(discriminator, options, params) {
    const optionsMap = new Map;
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
}
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0;index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}

class ZodIntersection extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
}
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};

class ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new ZodTuple({
      ...this._def,
      rest
    });
  }
}
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};

class ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
}

class ZodMap extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = new Map;
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = new Map;
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
}
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};

class ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = new Set;
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
}
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};

class ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
}

class ZodLazy extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
}
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};

class ZodLiteral extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
}
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}

class ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
}
ZodEnum.create = createZodEnum;

class ZodNativeEnum extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
}
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};

class ZodPromise extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
}
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};

class ZodEffects extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
}
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
class ZodOptional extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(undefined);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};

class ZodNullable extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};

class ZodDefault extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
}
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};

class ZodCatch extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
}
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};

class ZodNaN extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
}
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");

class ZodBranded extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
}

class ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
}

class ZodReadonly extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: (arg) => ZodString.create({ ...arg, coerce: true }),
  number: (arg) => ZodNumber.create({ ...arg, coerce: true }),
  boolean: (arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  }),
  bigint: (arg) => ZodBigInt.create({ ...arg, coerce: true }),
  date: (arg) => ZodDate.create({ ...arg, coerce: true })
};
var NEVER = INVALID;
// node_modules/zod/v4/core/core.js
var NEVER2 = Object.freeze({
  status: "aborted"
});
function $constructor(name, initializer, params) {
  function init(inst, def) {
    var _a;
    Object.defineProperty(inst, "_zod", {
      value: inst._zod ?? {},
      enumerable: false
    });
    (_a = inst._zod).traits ?? (_a.traits = new Set);
    inst._zod.traits.add(name);
    initializer(inst, def);
    for (const k in _.prototype) {
      if (!(k in inst))
        Object.defineProperty(inst, k, { value: _.prototype[k].bind(inst) });
    }
    inst._zod.constr = _;
    inst._zod.def = def;
  }
  const Parent = params?.Parent ?? Object;

  class Definition extends Parent {
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _(def) {
    var _a;
    const inst = params?.Parent ? new Definition : this;
    init(inst, def);
    (_a = inst._zod).deferred ?? (_a.deferred = []);
    for (const fn of inst._zod.deferred) {
      fn();
    }
    return inst;
  }
  Object.defineProperty(_, "init", { value: init });
  Object.defineProperty(_, Symbol.hasInstance, {
    value: (inst) => {
      if (params?.Parent && inst instanceof params.Parent)
        return true;
      return inst?._zod?.traits?.has(name);
    }
  });
  Object.defineProperty(_, "name", { value: name });
  return _;
}
var $brand = Symbol("zod_brand");

class $ZodAsyncError extends Error {
  constructor() {
    super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
  }
}
var globalConfig = {};
function config(newConfig) {
  if (newConfig)
    Object.assign(globalConfig, newConfig);
  return globalConfig;
}
// node_modules/zod/v4/core/util.js
var exports_util = {};
__export(exports_util, {
  unwrapMessage: () => unwrapMessage,
  stringifyPrimitive: () => stringifyPrimitive,
  required: () => required,
  randomString: () => randomString,
  propertyKeyTypes: () => propertyKeyTypes,
  promiseAllObject: () => promiseAllObject,
  primitiveTypes: () => primitiveTypes,
  prefixIssues: () => prefixIssues,
  pick: () => pick,
  partial: () => partial,
  optionalKeys: () => optionalKeys,
  omit: () => omit,
  numKeys: () => numKeys,
  nullish: () => nullish,
  normalizeParams: () => normalizeParams,
  merge: () => merge,
  jsonStringifyReplacer: () => jsonStringifyReplacer,
  joinValues: () => joinValues,
  issue: () => issue,
  isPlainObject: () => isPlainObject,
  isObject: () => isObject,
  getSizableOrigin: () => getSizableOrigin,
  getParsedType: () => getParsedType2,
  getLengthableOrigin: () => getLengthableOrigin,
  getEnumValues: () => getEnumValues,
  getElementAtPath: () => getElementAtPath,
  floatSafeRemainder: () => floatSafeRemainder2,
  finalizeIssue: () => finalizeIssue,
  extend: () => extend,
  escapeRegex: () => escapeRegex,
  esc: () => esc,
  defineLazy: () => defineLazy,
  createTransparentProxy: () => createTransparentProxy,
  clone: () => clone,
  cleanRegex: () => cleanRegex,
  cleanEnum: () => cleanEnum,
  captureStackTrace: () => captureStackTrace,
  cached: () => cached,
  assignProp: () => assignProp,
  assertNotEqual: () => assertNotEqual,
  assertNever: () => assertNever,
  assertIs: () => assertIs,
  assertEqual: () => assertEqual,
  assert: () => assert,
  allowsEval: () => allowsEval,
  aborted: () => aborted,
  NUMBER_FORMAT_RANGES: () => NUMBER_FORMAT_RANGES,
  Class: () => Class,
  BIGINT_FORMAT_RANGES: () => BIGINT_FORMAT_RANGES
});
function assertEqual(val) {
  return val;
}
function assertNotEqual(val) {
  return val;
}
function assertIs(_arg) {}
function assertNever(_x) {
  throw new Error;
}
function assert(_) {}
function getEnumValues(entries) {
  const numericValues = Object.values(entries).filter((v) => typeof v === "number");
  const values = Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
  return values;
}
function joinValues(array, separator = "|") {
  return array.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
  if (typeof value === "bigint")
    return value.toString();
  return value;
}
function cached(getter) {
  const set = false;
  return {
    get value() {
      if (!set) {
        const value = getter();
        Object.defineProperty(this, "value", { value });
        return value;
      }
      throw new Error("cached value already set");
    }
  };
}
function nullish(input) {
  return input === null || input === undefined;
}
function cleanRegex(source) {
  const start = source.startsWith("^") ? 1 : 0;
  const end = source.endsWith("$") ? source.length - 1 : source.length;
  return source.slice(start, end);
}
function floatSafeRemainder2(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
function defineLazy(object, key, getter) {
  const set = false;
  Object.defineProperty(object, key, {
    get() {
      if (!set) {
        const value = getter();
        object[key] = value;
        return value;
      }
      throw new Error("cached value already set");
    },
    set(v) {
      Object.defineProperty(object, key, {
        value: v
      });
    },
    configurable: true
  });
}
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}
function getElementAtPath(obj, path) {
  if (!path)
    return obj;
  return path.reduce((acc, key) => acc?.[key], obj);
}
function promiseAllObject(promisesObj) {
  const keys = Object.keys(promisesObj);
  const promises = keys.map((key) => promisesObj[key]);
  return Promise.all(promises).then((results) => {
    const resolvedObj = {};
    for (let i = 0;i < keys.length; i++) {
      resolvedObj[keys[i]] = results[i];
    }
    return resolvedObj;
  });
}
function randomString(length = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let str = "";
  for (let i = 0;i < length; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}
function esc(str) {
  return JSON.stringify(str);
}
var captureStackTrace = Error.captureStackTrace ? Error.captureStackTrace : (..._args) => {};
function isObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
var allowsEval = cached(() => {
  if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) {
    return false;
  }
  try {
    const F = Function;
    new F("");
    return true;
  } catch (_) {
    return false;
  }
});
function isPlainObject(o) {
  if (isObject(o) === false)
    return false;
  const ctor = o.constructor;
  if (ctor === undefined)
    return true;
  const prot = ctor.prototype;
  if (isObject(prot) === false)
    return false;
  if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
    return false;
  }
  return true;
}
function numKeys(data) {
  let keyCount = 0;
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      keyCount++;
    }
  }
  return keyCount;
}
var getParsedType2 = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return "undefined";
    case "string":
      return "string";
    case "number":
      return Number.isNaN(data) ? "nan" : "number";
    case "boolean":
      return "boolean";
    case "function":
      return "function";
    case "bigint":
      return "bigint";
    case "symbol":
      return "symbol";
    case "object":
      if (Array.isArray(data)) {
        return "array";
      }
      if (data === null) {
        return "null";
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return "promise";
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return "map";
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return "set";
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return "date";
      }
      if (typeof File !== "undefined" && data instanceof File) {
        return "file";
      }
      return "object";
    default:
      throw new Error(`Unknown data type: ${t}`);
  }
};
var propertyKeyTypes = new Set(["string", "number", "symbol"]);
var primitiveTypes = new Set(["string", "number", "bigint", "boolean", "symbol", "undefined"]);
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || params?.parent)
    cl._zod.parent = inst;
  return cl;
}
function normalizeParams(_params) {
  const params = _params;
  if (!params)
    return {};
  if (typeof params === "string")
    return { error: () => params };
  if (params?.message !== undefined) {
    if (params?.error !== undefined)
      throw new Error("Cannot specify both `message` and `error` params");
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string")
    return { ...params, error: () => params.error };
  return params;
}
function createTransparentProxy(getter) {
  let target;
  return new Proxy({}, {
    get(_, prop, receiver) {
      target ?? (target = getter());
      return Reflect.get(target, prop, receiver);
    },
    set(_, prop, value, receiver) {
      target ?? (target = getter());
      return Reflect.set(target, prop, value, receiver);
    },
    has(_, prop) {
      target ?? (target = getter());
      return Reflect.has(target, prop);
    },
    deleteProperty(_, prop) {
      target ?? (target = getter());
      return Reflect.deleteProperty(target, prop);
    },
    ownKeys(_) {
      target ?? (target = getter());
      return Reflect.ownKeys(target);
    },
    getOwnPropertyDescriptor(_, prop) {
      target ?? (target = getter());
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    defineProperty(_, prop, descriptor) {
      target ?? (target = getter());
      return Reflect.defineProperty(target, prop, descriptor);
    }
  });
}
function stringifyPrimitive(value) {
  if (typeof value === "bigint")
    return value.toString() + "n";
  if (typeof value === "string")
    return `"${value}"`;
  return `${value}`;
}
function optionalKeys(shape) {
  return Object.keys(shape).filter((k) => {
    return shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional";
  });
}
var NUMBER_FORMAT_RANGES = {
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-340282346638528860000000000000000000000, 340282346638528860000000000000000000000],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
};
var BIGINT_FORMAT_RANGES = {
  int64: [/* @__PURE__ */ BigInt("-9223372036854775808"), /* @__PURE__ */ BigInt("9223372036854775807")],
  uint64: [/* @__PURE__ */ BigInt(0), /* @__PURE__ */ BigInt("18446744073709551615")]
};
function pick(schema, mask) {
  const newShape = {};
  const currDef = schema._zod.def;
  for (const key in mask) {
    if (!(key in currDef.shape)) {
      throw new Error(`Unrecognized key: "${key}"`);
    }
    if (!mask[key])
      continue;
    newShape[key] = currDef.shape[key];
  }
  return clone(schema, {
    ...schema._zod.def,
    shape: newShape,
    checks: []
  });
}
function omit(schema, mask) {
  const newShape = { ...schema._zod.def.shape };
  const currDef = schema._zod.def;
  for (const key in mask) {
    if (!(key in currDef.shape)) {
      throw new Error(`Unrecognized key: "${key}"`);
    }
    if (!mask[key])
      continue;
    delete newShape[key];
  }
  return clone(schema, {
    ...schema._zod.def,
    shape: newShape,
    checks: []
  });
}
function extend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to extend: expected a plain object");
  }
  const def = {
    ...schema._zod.def,
    get shape() {
      const _shape = { ...schema._zod.def.shape, ...shape };
      assignProp(this, "shape", _shape);
      return _shape;
    },
    checks: []
  };
  return clone(schema, def);
}
function merge(a, b) {
  return clone(a, {
    ...a._zod.def,
    get shape() {
      const _shape = { ...a._zod.def.shape, ...b._zod.def.shape };
      assignProp(this, "shape", _shape);
      return _shape;
    },
    catchall: b._zod.def.catchall,
    checks: []
  });
}
function partial(Class, schema, mask) {
  const oldShape = schema._zod.def.shape;
  const shape = { ...oldShape };
  if (mask) {
    for (const key in mask) {
      if (!(key in oldShape)) {
        throw new Error(`Unrecognized key: "${key}"`);
      }
      if (!mask[key])
        continue;
      shape[key] = Class ? new Class({
        type: "optional",
        innerType: oldShape[key]
      }) : oldShape[key];
    }
  } else {
    for (const key in oldShape) {
      shape[key] = Class ? new Class({
        type: "optional",
        innerType: oldShape[key]
      }) : oldShape[key];
    }
  }
  return clone(schema, {
    ...schema._zod.def,
    shape,
    checks: []
  });
}
function required(Class, schema, mask) {
  const oldShape = schema._zod.def.shape;
  const shape = { ...oldShape };
  if (mask) {
    for (const key in mask) {
      if (!(key in shape)) {
        throw new Error(`Unrecognized key: "${key}"`);
      }
      if (!mask[key])
        continue;
      shape[key] = new Class({
        type: "nonoptional",
        innerType: oldShape[key]
      });
    }
  } else {
    for (const key in oldShape) {
      shape[key] = new Class({
        type: "nonoptional",
        innerType: oldShape[key]
      });
    }
  }
  return clone(schema, {
    ...schema._zod.def,
    shape,
    checks: []
  });
}
function aborted(x, startIndex = 0) {
  for (let i = startIndex;i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true)
      return true;
  }
  return false;
}
function prefixIssues(path, issues) {
  return issues.map((iss) => {
    var _a;
    (_a = iss).path ?? (_a.path = []);
    iss.path.unshift(path);
    return iss;
  });
}
function unwrapMessage(message) {
  return typeof message === "string" ? message : message?.message;
}
function finalizeIssue(iss, ctx, config2) {
  const full = { ...iss, path: iss.path ?? [] };
  if (!iss.message) {
    const message = unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config2.customError?.(iss)) ?? unwrapMessage(config2.localeError?.(iss)) ?? "Invalid input";
    full.message = message;
  }
  delete full.inst;
  delete full.continue;
  if (!ctx?.reportInput) {
    delete full.input;
  }
  return full;
}
function getSizableOrigin(input) {
  if (input instanceof Set)
    return "set";
  if (input instanceof Map)
    return "map";
  if (input instanceof File)
    return "file";
  return "unknown";
}
function getLengthableOrigin(input) {
  if (Array.isArray(input))
    return "array";
  if (typeof input === "string")
    return "string";
  return "unknown";
}
function issue(...args) {
  const [iss, input, inst] = args;
  if (typeof iss === "string") {
    return {
      message: iss,
      code: "custom",
      input,
      inst
    };
  }
  return { ...iss };
}
function cleanEnum(obj) {
  return Object.entries(obj).filter(([k, _]) => {
    return Number.isNaN(Number.parseInt(k, 10));
  }).map((el) => el[1]);
}

class Class {
  constructor(..._args) {}
}

// node_modules/zod/v4/core/errors.js
var initializer = (inst, def) => {
  inst.name = "$ZodError";
  Object.defineProperty(inst, "_zod", {
    value: inst._zod,
    enumerable: false
  });
  Object.defineProperty(inst, "issues", {
    value: def,
    enumerable: false
  });
  Object.defineProperty(inst, "message", {
    get() {
      return JSON.stringify(def, jsonStringifyReplacer, 2);
    },
    enumerable: true
  });
  Object.defineProperty(inst, "toString", {
    value: () => inst.message,
    enumerable: false
  });
};
var $ZodError = $constructor("$ZodError", initializer);
var $ZodRealError = $constructor("$ZodError", initializer, { Parent: Error });
function flattenError(error, mapper = (issue2) => issue2.message) {
  const fieldErrors = {};
  const formErrors = [];
  for (const sub of error.issues) {
    if (sub.path.length > 0) {
      fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
      fieldErrors[sub.path[0]].push(mapper(sub));
    } else {
      formErrors.push(mapper(sub));
    }
  }
  return { formErrors, fieldErrors };
}
function formatError(error, _mapper) {
  const mapper = _mapper || function(issue2) {
    return issue2.message;
  };
  const fieldErrors = { _errors: [] };
  const processError = (error2) => {
    for (const issue2 of error2.issues) {
      if (issue2.code === "invalid_union" && issue2.errors.length) {
        issue2.errors.map((issues) => processError({ issues }));
      } else if (issue2.code === "invalid_key") {
        processError({ issues: issue2.issues });
      } else if (issue2.code === "invalid_element") {
        processError({ issues: issue2.issues });
      } else if (issue2.path.length === 0) {
        fieldErrors._errors.push(mapper(issue2));
      } else {
        let curr = fieldErrors;
        let i = 0;
        while (i < issue2.path.length) {
          const el = issue2.path[i];
          const terminal = i === issue2.path.length - 1;
          if (!terminal) {
            curr[el] = curr[el] || { _errors: [] };
          } else {
            curr[el] = curr[el] || { _errors: [] };
            curr[el]._errors.push(mapper(issue2));
          }
          curr = curr[el];
          i++;
        }
      }
    }
  };
  processError(error);
  return fieldErrors;
}

// node_modules/zod/v4/core/parse.js
var _parse = (_Err) => (schema, value, _ctx, _params) => {
  const ctx = _ctx ? Object.assign(_ctx, { async: false }) : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError;
  }
  if (result.issues.length) {
    const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
    captureStackTrace(e, _params?.callee);
    throw e;
  }
  return result.value;
};
var parse = /* @__PURE__ */ _parse($ZodRealError);
var _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
  const ctx = _ctx ? Object.assign(_ctx, { async: true }) : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  if (result.issues.length) {
    const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
    captureStackTrace(e, params?.callee);
    throw e;
  }
  return result.value;
};
var parseAsync = /* @__PURE__ */ _parseAsync($ZodRealError);
var _safeParse = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError;
  }
  return result.issues.length ? {
    success: false,
    error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  } : { success: true, data: result.value };
};
var safeParse = /* @__PURE__ */ _safeParse($ZodRealError);
var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? Object.assign(_ctx, { async: true }) : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length ? {
    success: false,
    error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  } : { success: true, data: result.value };
};
var safeParseAsync = /* @__PURE__ */ _safeParseAsync($ZodRealError);
// node_modules/zod/v4/core/regexes.js
var cuid = /^[cC][^\s-]{8,}$/;
var cuid2 = /^[0-9a-z]+$/;
var ulid = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;
var xid = /^[0-9a-vA-V]{20}$/;
var ksuid = /^[A-Za-z0-9]{27}$/;
var nanoid = /^[a-zA-Z0-9_-]{21}$/;
var duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
var guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
var uuid = (version) => {
  if (!version)
    return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000)$/;
  return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
var email = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
var _emoji = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
function emoji() {
  return new RegExp(_emoji, "u");
}
var ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})$/;
var cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
var cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
var base64url = /^[A-Za-z0-9_-]*$/;
var hostname = /^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+$/;
var e164 = /^\+(?:[0-9]){6,14}[0-9]$/;
var dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
var date = /* @__PURE__ */ new RegExp(`^${dateSource}$`);
function timeSource(args) {
  const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
  const regex = typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
  return regex;
}
function time(args) {
  return new RegExp(`^${timeSource(args)}$`);
}
function datetime(args) {
  const time2 = timeSource({ precision: args.precision });
  const opts = ["Z"];
  if (args.local)
    opts.push("");
  if (args.offset)
    opts.push(`([+-]\\d{2}:\\d{2})`);
  const timeRegex2 = `${time2}(?:${opts.join("|")})`;
  return new RegExp(`^${dateSource}T(?:${timeRegex2})$`);
}
var string = (params) => {
  const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
  return new RegExp(`^${regex}$`);
};
var integer = /^\d+$/;
var number = /^-?\d+(?:\.\d+)?/i;
var boolean = /true|false/i;
var _null = /null/i;
var lowercase = /^[^A-Z]*$/;
var uppercase = /^[^a-z]*$/;

// node_modules/zod/v4/core/checks.js
var $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
  var _a;
  inst._zod ?? (inst._zod = {});
  inst._zod.def = def;
  (_a = inst._zod).onattach ?? (_a.onattach = []);
});
var numericOriginMap = {
  number: "number",
  bigint: "bigint",
  object: "date"
};
var $ZodCheckLessThan = /* @__PURE__ */ $constructor("$ZodCheckLessThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    const curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
    if (def.value < curr) {
      if (def.inclusive)
        bag.maximum = def.value;
      else
        bag.exclusiveMaximum = def.value;
    }
  });
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
      return;
    }
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    const curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
    if (def.value > curr) {
      if (def.inclusive)
        bag.minimum = def.value;
      else
        bag.exclusiveMinimum = def.value;
    }
  });
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
      return;
    }
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMultipleOf = /* @__PURE__ */ $constructor("$ZodCheckMultipleOf", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    var _a;
    (_a = inst2._zod.bag).multipleOf ?? (_a.multipleOf = def.value);
  });
  inst._zod.check = (payload) => {
    if (typeof payload.value !== typeof def.value)
      throw new Error("Cannot mix number and bigint in multiple_of check.");
    const isMultiple = typeof payload.value === "bigint" ? payload.value % def.value === BigInt(0) : floatSafeRemainder2(payload.value, def.value) === 0;
    if (isMultiple)
      return;
    payload.issues.push({
      origin: typeof payload.value,
      code: "not_multiple_of",
      divisor: def.value,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
  $ZodCheck.init(inst, def);
  def.format = def.format || "float64";
  const isInt = def.format?.includes("int");
  const origin = isInt ? "int" : "number";
  const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = def.format;
    bag.minimum = minimum;
    bag.maximum = maximum;
    if (isInt)
      bag.pattern = integer;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    if (isInt) {
      if (!Number.isInteger(input)) {
        payload.issues.push({
          expected: origin,
          format: def.format,
          code: "invalid_type",
          input,
          inst
        });
        return;
      }
      if (!Number.isSafeInteger(input)) {
        if (input > 0) {
          payload.issues.push({
            input,
            code: "too_big",
            maximum: Number.MAX_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            continue: !def.abort
          });
        } else {
          payload.issues.push({
            input,
            code: "too_small",
            minimum: Number.MIN_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            continue: !def.abort
          });
        }
        return;
      }
    }
    if (input < minimum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_small",
        minimum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
    if (input > maximum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_big",
        maximum,
        inst
      });
    }
  };
});
var $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== undefined;
  });
  inst._zod.onattach.push((inst2) => {
    const curr = inst2._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
    if (def.maximum < curr)
      inst2._zod.bag.maximum = def.maximum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length <= def.maximum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.maximum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== undefined;
  });
  inst._zod.onattach.push((inst2) => {
    const curr = inst2._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
    if (def.minimum > curr)
      inst2._zod.bag.minimum = def.minimum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length >= def.minimum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.minimum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLengthEquals = /* @__PURE__ */ $constructor("$ZodCheckLengthEquals", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== undefined;
  });
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.minimum = def.length;
    bag.maximum = def.length;
    bag.length = def.length;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length === def.length)
      return;
    const origin = getLengthableOrigin(input);
    const tooBig = length > def.length;
    payload.issues.push({
      origin,
      ...tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length },
      inclusive: true,
      exact: true,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
  var _a, _b;
  $ZodCheck.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = def.format;
    if (def.pattern) {
      bag.patterns ?? (bag.patterns = new Set);
      bag.patterns.add(def.pattern);
    }
  });
  if (def.pattern)
    (_a = inst._zod).check ?? (_a.check = (payload) => {
      def.pattern.lastIndex = 0;
      if (def.pattern.test(payload.value))
        return;
      payload.issues.push({
        origin: "string",
        code: "invalid_format",
        format: def.format,
        input: payload.value,
        ...def.pattern ? { pattern: def.pattern.toString() } : {},
        inst,
        continue: !def.abort
      });
    });
  else
    (_b = inst._zod).check ?? (_b.check = () => {});
});
var $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    def.pattern.lastIndex = 0;
    if (def.pattern.test(payload.value))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "regex",
      input: payload.value,
      pattern: def.pattern.toString(),
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLowerCase = /* @__PURE__ */ $constructor("$ZodCheckLowerCase", (inst, def) => {
  def.pattern ?? (def.pattern = lowercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckUpperCase = /* @__PURE__ */ $constructor("$ZodCheckUpperCase", (inst, def) => {
  def.pattern ?? (def.pattern = uppercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckIncludes = /* @__PURE__ */ $constructor("$ZodCheckIncludes", (inst, def) => {
  $ZodCheck.init(inst, def);
  const escapedRegex = escapeRegex(def.includes);
  const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position}}${escapedRegex}` : escapedRegex);
  def.pattern = pattern;
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = new Set);
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.includes(def.includes, def.position))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "includes",
      includes: def.includes,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStartsWith = /* @__PURE__ */ $constructor("$ZodCheckStartsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = new Set);
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.startsWith(def.prefix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "starts_with",
      prefix: def.prefix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckEndsWith = /* @__PURE__ */ $constructor("$ZodCheckEndsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = new Set);
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.endsWith(def.suffix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "ends_with",
      suffix: def.suffix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckOverwrite = /* @__PURE__ */ $constructor("$ZodCheckOverwrite", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    payload.value = def.tx(payload.value);
  };
});

// node_modules/zod/v4/core/doc.js
class Doc {
  constructor(args = []) {
    this.content = [];
    this.indent = 0;
    if (this)
      this.args = args;
  }
  indented(fn) {
    this.indent += 1;
    fn(this);
    this.indent -= 1;
  }
  write(arg) {
    if (typeof arg === "function") {
      arg(this, { execution: "sync" });
      arg(this, { execution: "async" });
      return;
    }
    const content = arg;
    const lines = content.split(`
`).filter((x) => x);
    const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
    const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
    for (const line of dedented) {
      this.content.push(line);
    }
  }
  compile() {
    const F = Function;
    const args = this?.args;
    const content = this?.content ?? [``];
    const lines = [...content.map((x) => `  ${x}`)];
    return new F(...args, lines.join(`
`));
  }
}

// node_modules/zod/v4/core/versions.js
var version = {
  major: 4,
  minor: 0,
  patch: 0
};

// node_modules/zod/v4/core/schemas.js
var $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
  var _a;
  inst ?? (inst = {});
  inst._zod.def = def;
  inst._zod.bag = inst._zod.bag || {};
  inst._zod.version = version;
  const checks = [...inst._zod.def.checks ?? []];
  if (inst._zod.traits.has("$ZodCheck")) {
    checks.unshift(inst);
  }
  for (const ch of checks) {
    for (const fn of ch._zod.onattach) {
      fn(inst);
    }
  }
  if (checks.length === 0) {
    (_a = inst._zod).deferred ?? (_a.deferred = []);
    inst._zod.deferred?.push(() => {
      inst._zod.run = inst._zod.parse;
    });
  } else {
    const runChecks = (payload, checks2, ctx) => {
      let isAborted2 = aborted(payload);
      let asyncResult;
      for (const ch of checks2) {
        if (ch._zod.def.when) {
          const shouldRun = ch._zod.def.when(payload);
          if (!shouldRun)
            continue;
        } else if (isAborted2) {
          continue;
        }
        const currLen = payload.issues.length;
        const _ = ch._zod.check(payload);
        if (_ instanceof Promise && ctx?.async === false) {
          throw new $ZodAsyncError;
        }
        if (asyncResult || _ instanceof Promise) {
          asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
            await _;
            const nextLen = payload.issues.length;
            if (nextLen === currLen)
              return;
            if (!isAborted2)
              isAborted2 = aborted(payload, currLen);
          });
        } else {
          const nextLen = payload.issues.length;
          if (nextLen === currLen)
            continue;
          if (!isAborted2)
            isAborted2 = aborted(payload, currLen);
        }
      }
      if (asyncResult) {
        return asyncResult.then(() => {
          return payload;
        });
      }
      return payload;
    };
    inst._zod.run = (payload, ctx) => {
      const result = inst._zod.parse(payload, ctx);
      if (result instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError;
        return result.then((result2) => runChecks(result2, checks, ctx));
      }
      return runChecks(result, checks, ctx);
    };
  }
  inst["~standard"] = {
    validate: (value) => {
      try {
        const r = safeParse(inst, value);
        return r.success ? { value: r.data } : { issues: r.error?.issues };
      } catch (_) {
        return safeParseAsync(inst, value).then((r) => r.success ? { value: r.data } : { issues: r.error?.issues });
      }
    },
    vendor: "zod",
    version: 1
  };
});
var $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = [...inst?._zod.bag?.patterns ?? []].pop() ?? string(inst._zod.bag);
  inst._zod.parse = (payload, _) => {
    if (def.coerce)
      try {
        payload.value = String(payload.value);
      } catch (_2) {}
    if (typeof payload.value === "string")
      return payload;
    payload.issues.push({
      expected: "string",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  $ZodString.init(inst, def);
});
var $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
  def.pattern ?? (def.pattern = guid);
  $ZodStringFormat.init(inst, def);
});
var $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
  if (def.version) {
    const versionMap = {
      v1: 1,
      v2: 2,
      v3: 3,
      v4: 4,
      v5: 5,
      v6: 6,
      v7: 7,
      v8: 8
    };
    const v = versionMap[def.version];
    if (v === undefined)
      throw new Error(`Invalid UUID version: "${def.version}"`);
    def.pattern ?? (def.pattern = uuid(v));
  } else
    def.pattern ?? (def.pattern = uuid());
  $ZodStringFormat.init(inst, def);
});
var $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
  def.pattern ?? (def.pattern = email);
  $ZodStringFormat.init(inst, def);
});
var $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    try {
      const orig = payload.value;
      const url = new URL(orig);
      const href = url.href;
      if (def.hostname) {
        def.hostname.lastIndex = 0;
        if (!def.hostname.test(url.hostname)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid hostname",
            pattern: hostname.source,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      }
      if (def.protocol) {
        def.protocol.lastIndex = 0;
        if (!def.protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid protocol",
            pattern: def.protocol.source,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      }
      if (!orig.endsWith("/") && href.endsWith("/")) {
        payload.value = href.slice(0, -1);
      } else {
        payload.value = href;
      }
      return;
    } catch (_) {
      payload.issues.push({
        code: "invalid_format",
        format: "url",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
  def.pattern ?? (def.pattern = emoji());
  $ZodStringFormat.init(inst, def);
});
var $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
  def.pattern ?? (def.pattern = nanoid);
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
  def.pattern ?? (def.pattern = cuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
  def.pattern ?? (def.pattern = cuid2);
  $ZodStringFormat.init(inst, def);
});
var $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
  def.pattern ?? (def.pattern = ulid);
  $ZodStringFormat.init(inst, def);
});
var $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
  def.pattern ?? (def.pattern = xid);
  $ZodStringFormat.init(inst, def);
});
var $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
  def.pattern ?? (def.pattern = ksuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
  def.pattern ?? (def.pattern = datetime(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
  def.pattern ?? (def.pattern = date);
  $ZodStringFormat.init(inst, def);
});
var $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
  def.pattern ?? (def.pattern = time(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
  def.pattern ?? (def.pattern = duration);
  $ZodStringFormat.init(inst, def);
});
var $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
  def.pattern ?? (def.pattern = ipv4);
  $ZodStringFormat.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = `ipv4`;
  });
});
var $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
  def.pattern ?? (def.pattern = ipv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = `ipv6`;
  });
  inst._zod.check = (payload) => {
    try {
      new URL(`http://[${payload.value}]`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "ipv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv4);
  $ZodStringFormat.init(inst, def);
});
var $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    const [address, prefix] = payload.value.split("/");
    try {
      if (!prefix)
        throw new Error;
      const prefixNum = Number(prefix);
      if (`${prefixNum}` !== prefix)
        throw new Error;
      if (prefixNum < 0 || prefixNum > 128)
        throw new Error;
      new URL(`http://[${address}]`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "cidrv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
function isValidBase64(data) {
  if (data === "")
    return true;
  if (data.length % 4 !== 0)
    return false;
  try {
    atob(data);
    return true;
  } catch {
    return false;
  }
}
var $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
  def.pattern ?? (def.pattern = base64);
  $ZodStringFormat.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    inst2._zod.bag.contentEncoding = "base64";
  });
  inst._zod.check = (payload) => {
    if (isValidBase64(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
function isValidBase64URL(data) {
  if (!base64url.test(data))
    return false;
  const base642 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
  const padded = base642.padEnd(Math.ceil(base642.length / 4) * 4, "=");
  return isValidBase64(padded);
}
var $ZodBase64URL = /* @__PURE__ */ $constructor("$ZodBase64URL", (inst, def) => {
  def.pattern ?? (def.pattern = base64url);
  $ZodStringFormat.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    inst2._zod.bag.contentEncoding = "base64url";
  });
  inst._zod.check = (payload) => {
    if (isValidBase64URL(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64url",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
  def.pattern ?? (def.pattern = e164);
  $ZodStringFormat.init(inst, def);
});
function isValidJWT2(token, algorithm = null) {
  try {
    const tokensParts = token.split(".");
    if (tokensParts.length !== 3)
      return false;
    const [header] = tokensParts;
    if (!header)
      return false;
    const parsedHeader = JSON.parse(atob(header));
    if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT")
      return false;
    if (!parsedHeader.alg)
      return false;
    if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm))
      return false;
    return true;
  } catch {
    return false;
  }
}
var $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidJWT2(payload.value, def.alg))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "jwt",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = inst._zod.bag.pattern ?? number;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Number(payload.value);
      } catch (_) {}
    const input = payload.value;
    if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
      return payload;
    }
    const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? "Infinity" : undefined : undefined;
    payload.issues.push({
      expected: "number",
      code: "invalid_type",
      input,
      inst,
      ...received ? { received } : {}
    });
    return payload;
  };
});
var $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodCheckNumberFormat.init(inst, def);
  $ZodNumber.init(inst, def);
});
var $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = boolean;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Boolean(payload.value);
      } catch (_) {}
    const input = payload.value;
    if (typeof input === "boolean")
      return payload;
    payload.issues.push({
      expected: "boolean",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodNull = /* @__PURE__ */ $constructor("$ZodNull", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = _null;
  inst._zod.values = new Set([null]);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (input === null)
      return payload;
    payload.issues.push({
      expected: "null",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
var $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    payload.issues.push({
      expected: "never",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
function handleArrayResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
var $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        expected: "array",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = Array(input.length);
    const proms = [];
    for (let i = 0;i < input.length; i++) {
      const item = input[i];
      const result = def.element._zod.run({
        value: item,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result2) => handleArrayResult(result2, payload, i)));
      } else {
        handleArrayResult(result, payload, i);
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
function handleObjectResult(result, final, key) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(key, result.issues));
  }
  final.value[key] = result.value;
}
function handleOptionalObjectResult(result, final, key, input) {
  if (result.issues.length) {
    if (input[key] === undefined) {
      if (key in input) {
        final.value[key] = undefined;
      } else {
        final.value[key] = result.value;
      }
    } else {
      final.issues.push(...prefixIssues(key, result.issues));
    }
  } else if (result.value === undefined) {
    if (key in input)
      final.value[key] = undefined;
  } else {
    final.value[key] = result.value;
  }
}
var $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
  $ZodType.init(inst, def);
  const _normalized = cached(() => {
    const keys = Object.keys(def.shape);
    for (const k of keys) {
      if (!(def.shape[k] instanceof $ZodType)) {
        throw new Error(`Invalid element at key "${k}": expected a Zod schema`);
      }
    }
    const okeys = optionalKeys(def.shape);
    return {
      shape: def.shape,
      keys,
      keySet: new Set(keys),
      numKeys: keys.length,
      optionalKeys: new Set(okeys)
    };
  });
  defineLazy(inst._zod, "propValues", () => {
    const shape = def.shape;
    const propValues = {};
    for (const key in shape) {
      const field = shape[key]._zod;
      if (field.values) {
        propValues[key] ?? (propValues[key] = new Set);
        for (const v of field.values)
          propValues[key].add(v);
      }
    }
    return propValues;
  });
  const generateFastpass = (shape) => {
    const doc = new Doc(["shape", "payload", "ctx"]);
    const normalized = _normalized.value;
    const parseStr = (key) => {
      const k = esc(key);
      return `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
    };
    doc.write(`const input = payload.value;`);
    const ids = Object.create(null);
    let counter = 0;
    for (const key of normalized.keys) {
      ids[key] = `key_${counter++}`;
    }
    doc.write(`const newResult = {}`);
    for (const key of normalized.keys) {
      if (normalized.optionalKeys.has(key)) {
        const id = ids[key];
        doc.write(`const ${id} = ${parseStr(key)};`);
        const k = esc(key);
        doc.write(`
        if (${id}.issues.length) {
          if (input[${k}] === undefined) {
            if (${k} in input) {
              newResult[${k}] = undefined;
            }
          } else {
            payload.issues = payload.issues.concat(
              ${id}.issues.map((iss) => ({
                ...iss,
                path: iss.path ? [${k}, ...iss.path] : [${k}],
              }))
            );
          }
        } else if (${id}.value === undefined) {
          if (${k} in input) newResult[${k}] = undefined;
        } else {
          newResult[${k}] = ${id}.value;
        }
        `);
      } else {
        const id = ids[key];
        doc.write(`const ${id} = ${parseStr(key)};`);
        doc.write(`
          if (${id}.issues.length) payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${esc(key)}, ...iss.path] : [${esc(key)}]
          })));`);
        doc.write(`newResult[${esc(key)}] = ${id}.value`);
      }
    }
    doc.write(`payload.value = newResult;`);
    doc.write(`return payload;`);
    const fn = doc.compile();
    return (payload, ctx) => fn(shape, payload, ctx);
  };
  let fastpass;
  const isObject2 = isObject;
  const jit = !globalConfig.jitless;
  const allowsEval2 = allowsEval;
  const fastEnabled = jit && allowsEval2.value;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    const proms = [];
    if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
      if (!fastpass)
        fastpass = generateFastpass(def.shape);
      payload = fastpass(payload, ctx);
    } else {
      payload.value = {};
      const shape = value.shape;
      for (const key of value.keys) {
        const el = shape[key];
        const r = el._zod.run({ value: input[key], issues: [] }, ctx);
        const isOptional = el._zod.optin === "optional" && el._zod.optout === "optional";
        if (r instanceof Promise) {
          proms.push(r.then((r2) => isOptional ? handleOptionalObjectResult(r2, payload, key, input) : handleObjectResult(r2, payload, key)));
        } else if (isOptional) {
          handleOptionalObjectResult(r, payload, key, input);
        } else {
          handleObjectResult(r, payload, key);
        }
      }
    }
    if (!catchall) {
      return proms.length ? Promise.all(proms).then(() => payload) : payload;
    }
    const unrecognized = [];
    const keySet = value.keySet;
    const _catchall = catchall._zod;
    const t = _catchall.def.type;
    for (const key of Object.keys(input)) {
      if (keySet.has(key))
        continue;
      if (t === "never") {
        unrecognized.push(key);
        continue;
      }
      const r = _catchall.run({ value: input[key], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((r2) => handleObjectResult(r2, payload, key)));
      } else {
        handleObjectResult(r, payload, key);
      }
    }
    if (unrecognized.length) {
      payload.issues.push({
        code: "unrecognized_keys",
        keys: unrecognized,
        input,
        inst
      });
    }
    if (!proms.length)
      return payload;
    return Promise.all(proms).then(() => {
      return payload;
    });
  };
});
function handleUnionResults(results, final, inst, ctx) {
  for (const result of results) {
    if (result.issues.length === 0) {
      final.value = result.value;
      return final;
    }
  }
  final.issues.push({
    code: "invalid_union",
    input: final.value,
    inst,
    errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  });
  return final;
}
var $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : undefined);
  defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : undefined);
  defineLazy(inst._zod, "values", () => {
    if (def.options.every((o) => o._zod.values)) {
      return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
    }
    return;
  });
  defineLazy(inst._zod, "pattern", () => {
    if (def.options.every((o) => o._zod.pattern)) {
      const patterns = def.options.map((o) => o._zod.pattern);
      return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
    }
    return;
  });
  inst._zod.parse = (payload, ctx) => {
    let async = false;
    const results = [];
    for (const option of def.options) {
      const result = option._zod.run({
        value: payload.value,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        if (result.issues.length === 0)
          return result;
        results.push(result);
      }
    }
    if (!async)
      return handleUnionResults(results, payload, inst, ctx);
    return Promise.all(results).then((results2) => {
      return handleUnionResults(results2, payload, inst, ctx);
    });
  };
});
var $ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("$ZodDiscriminatedUnion", (inst, def) => {
  $ZodUnion.init(inst, def);
  const _super = inst._zod.parse;
  defineLazy(inst._zod, "propValues", () => {
    const propValues = {};
    for (const option of def.options) {
      const pv = option._zod.propValues;
      if (!pv || Object.keys(pv).length === 0)
        throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(option)}"`);
      for (const [k, v] of Object.entries(pv)) {
        if (!propValues[k])
          propValues[k] = new Set;
        for (const val of v) {
          propValues[k].add(val);
        }
      }
    }
    return propValues;
  });
  const disc = cached(() => {
    const opts = def.options;
    const map = new Map;
    for (const o of opts) {
      const values = o._zod.propValues[def.discriminator];
      if (!values || values.size === 0)
        throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(o)}"`);
      for (const v of values) {
        if (map.has(v)) {
          throw new Error(`Duplicate discriminator value "${String(v)}"`);
        }
        map.set(v, o);
      }
    }
    return map;
  });
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isObject(input)) {
      payload.issues.push({
        code: "invalid_type",
        expected: "object",
        input,
        inst
      });
      return payload;
    }
    const opt = disc.value.get(input?.[def.discriminator]);
    if (opt) {
      return opt._zod.run(payload, ctx);
    }
    if (def.unionFallback) {
      return _super(payload, ctx);
    }
    payload.issues.push({
      code: "invalid_union",
      errors: [],
      note: "No matching discriminator",
      input,
      path: [def.discriminator],
      inst
    });
    return payload;
  };
});
var $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    const left = def.left._zod.run({ value: input, issues: [] }, ctx);
    const right = def.right._zod.run({ value: input, issues: [] }, ctx);
    const async = left instanceof Promise || right instanceof Promise;
    if (async) {
      return Promise.all([left, right]).then(([left2, right2]) => {
        return handleIntersectionResults(payload, left2, right2);
      });
    }
    return handleIntersectionResults(payload, left, right);
  };
});
function mergeValues2(a, b) {
  if (a === b) {
    return { valid: true, data: a };
  }
  if (a instanceof Date && b instanceof Date && +a === +b) {
    return { valid: true, data: a };
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const bKeys = Object.keys(b);
    const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues2(a[key], b[key]);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
        };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return { valid: false, mergeErrorPath: [] };
    }
    const newArray = [];
    for (let index = 0;index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues2(itemA, itemB);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
        };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  }
  return { valid: false, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
  if (left.issues.length) {
    result.issues.push(...left.issues);
  }
  if (right.issues.length) {
    result.issues.push(...right.issues);
  }
  if (aborted(result))
    return result;
  const merged = mergeValues2(left.value, right.value);
  if (!merged.valid) {
    throw new Error(`Unmergable intersection. Error path: ` + `${JSON.stringify(merged.mergeErrorPath)}`);
  }
  result.value = merged.data;
  return result;
}
var $ZodRecord = /* @__PURE__ */ $constructor("$ZodRecord", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!isPlainObject(input)) {
      payload.issues.push({
        expected: "record",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    const proms = [];
    if (def.keyType._zod.values) {
      const values = def.keyType._zod.values;
      payload.value = {};
      for (const key of values) {
        if (typeof key === "string" || typeof key === "number" || typeof key === "symbol") {
          const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
          if (result instanceof Promise) {
            proms.push(result.then((result2) => {
              if (result2.issues.length) {
                payload.issues.push(...prefixIssues(key, result2.issues));
              }
              payload.value[key] = result2.value;
            }));
          } else {
            if (result.issues.length) {
              payload.issues.push(...prefixIssues(key, result.issues));
            }
            payload.value[key] = result.value;
          }
        }
      }
      let unrecognized;
      for (const key in input) {
        if (!values.has(key)) {
          unrecognized = unrecognized ?? [];
          unrecognized.push(key);
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized
        });
      }
    } else {
      payload.value = {};
      for (const key of Reflect.ownKeys(input)) {
        if (key === "__proto__")
          continue;
        const keyResult = def.keyType._zod.run({ value: key, issues: [] }, ctx);
        if (keyResult instanceof Promise) {
          throw new Error("Async schemas not supported in object keys currently");
        }
        if (keyResult.issues.length) {
          payload.issues.push({
            origin: "record",
            code: "invalid_key",
            issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx, config())),
            input: key,
            path: [key],
            inst
          });
          payload.value[keyResult.value] = keyResult.value;
          continue;
        }
        const result = def.valueType._zod.run({ value: input[key], issues: [] }, ctx);
        if (result instanceof Promise) {
          proms.push(result.then((result2) => {
            if (result2.issues.length) {
              payload.issues.push(...prefixIssues(key, result2.issues));
            }
            payload.value[keyResult.value] = result2.value;
          }));
        } else {
          if (result.issues.length) {
            payload.issues.push(...prefixIssues(key, result.issues));
          }
          payload.value[keyResult.value] = result.value;
        }
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
var $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
  $ZodType.init(inst, def);
  const values = getEnumValues(def.entries);
  inst._zod.values = new Set(values);
  inst._zod.pattern = new RegExp(`^(${values.filter((k) => propertyKeyTypes.has(typeof k)).map((o) => typeof o === "string" ? escapeRegex(o) : o.toString()).join("|")})$`);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (inst._zod.values.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.values = new Set(def.values);
  inst._zod.pattern = new RegExp(`^(${def.values.map((o) => typeof o === "string" ? escapeRegex(o) : o ? o.toString() : String(o)).join("|")})$`);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (inst._zod.values.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values: def.values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    const _out = def.transform(payload.value, payload);
    if (_ctx.async) {
      const output = _out instanceof Promise ? _out : Promise.resolve(_out);
      return output.then((output2) => {
        payload.value = output2;
        return payload;
      });
    }
    if (_out instanceof Promise) {
      throw new $ZodAsyncError;
    }
    payload.value = _out;
    return payload;
  };
});
var $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  inst._zod.optout = "optional";
  defineLazy(inst._zod, "values", () => {
    return def.innerType._zod.values ? new Set([...def.innerType._zod.values, undefined]) : undefined;
  });
  defineLazy(inst._zod, "pattern", () => {
    const pattern = def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : undefined;
  });
  inst._zod.parse = (payload, ctx) => {
    if (def.innerType._zod.optin === "optional") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === undefined) {
      return payload;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  defineLazy(inst._zod, "pattern", () => {
    const pattern = def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : undefined;
  });
  defineLazy(inst._zod, "values", () => {
    return def.innerType._zod.values ? new Set([...def.innerType._zod.values, null]) : undefined;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === null)
      return payload;
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === undefined) {
      payload.value = def.defaultValue;
      return payload;
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleDefaultResult(result2, def));
    }
    return handleDefaultResult(result, def);
  };
});
function handleDefaultResult(payload, def) {
  if (payload.value === undefined) {
    payload.value = def.defaultValue;
  }
  return payload;
}
var $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === undefined) {
      payload.value = def.defaultValue;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNonOptional = /* @__PURE__ */ $constructor("$ZodNonOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => {
    const v = def.innerType._zod.values;
    return v ? new Set([...v].filter((x) => x !== undefined)) : undefined;
  });
  inst._zod.parse = (payload, ctx) => {
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => handleNonOptionalResult(result2, inst));
    }
    return handleNonOptionalResult(result, inst);
  };
});
function handleNonOptionalResult(payload, inst) {
  if (!payload.issues.length && payload.value === undefined) {
    payload.issues.push({
      code: "invalid_type",
      expected: "nonoptional",
      input: payload.value,
      inst
    });
  }
  return payload;
}
var $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result2) => {
        payload.value = result2.value;
        if (result2.issues.length) {
          payload.value = def.catchValue({
            ...payload,
            error: {
              issues: result2.issues.map((iss) => finalizeIssue(iss, ctx, config()))
            },
            input: payload.value
          });
          payload.issues = [];
        }
        return payload;
      });
    }
    payload.value = result.value;
    if (result.issues.length) {
      payload.value = def.catchValue({
        ...payload,
        error: {
          issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config()))
        },
        input: payload.value
      });
      payload.issues = [];
    }
    return payload;
  };
});
var $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => def.in._zod.values);
  defineLazy(inst._zod, "optin", () => def.in._zod.optin);
  defineLazy(inst._zod, "optout", () => def.out._zod.optout);
  inst._zod.parse = (payload, ctx) => {
    const left = def.in._zod.run(payload, ctx);
    if (left instanceof Promise) {
      return left.then((left2) => handlePipeResult(left2, def, ctx));
    }
    return handlePipeResult(left, def, ctx);
  };
});
function handlePipeResult(left, def, ctx) {
  if (aborted(left)) {
    return left;
  }
  return def.out._zod.run({ value: left.value, issues: left.issues }, ctx);
}
var $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  inst._zod.parse = (payload, ctx) => {
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then(handleReadonlyResult);
    }
    return handleReadonlyResult(result);
  };
});
function handleReadonlyResult(payload) {
  payload.value = Object.freeze(payload.value);
  return payload;
}
var $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
  $ZodCheck.init(inst, def);
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _) => {
    return payload;
  };
  inst._zod.check = (payload) => {
    const input = payload.value;
    const r = def.fn(input);
    if (r instanceof Promise) {
      return r.then((r2) => handleRefineResult(r2, payload, input, inst));
    }
    handleRefineResult(r, payload, input, inst);
    return;
  };
});
function handleRefineResult(result, payload, input, inst) {
  if (!result) {
    const _iss = {
      code: "custom",
      input,
      inst,
      path: [...inst._zod.def.path ?? []],
      continue: !inst._zod.def.abort
    };
    if (inst._zod.def.params)
      _iss.params = inst._zod.def.params;
    payload.issues.push(issue(_iss));
  }
}
// node_modules/zod/v4/locales/en.js
var parsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "number": {
      return Number.isNaN(data) ? "NaN" : "number";
    }
    case "object": {
      if (Array.isArray(data)) {
        return "array";
      }
      if (data === null) {
        return "null";
      }
      if (Object.getPrototypeOf(data) !== Object.prototype && data.constructor) {
        return data.constructor.name;
      }
    }
  }
  return t;
};
var error = () => {
  const Sizable = {
    string: { unit: "characters", verb: "to have" },
    file: { unit: "bytes", verb: "to have" },
    array: { unit: "items", verb: "to have" },
    set: { unit: "items", verb: "to have" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const Nouns = {
    regex: "input",
    email: "email address",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO datetime",
    date: "ISO date",
    time: "ISO time",
    duration: "ISO duration",
    ipv4: "IPv4 address",
    ipv6: "IPv6 address",
    cidrv4: "IPv4 range",
    cidrv6: "IPv6 range",
    base64: "base64-encoded string",
    base64url: "base64url-encoded string",
    json_string: "JSON string",
    e164: "E.164 number",
    jwt: "JWT",
    template_literal: "input"
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type":
        return `Invalid input: expected ${issue2.expected}, received ${parsedType(issue2.input)}`;
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Invalid input: expected ${stringifyPrimitive(issue2.values[0])}`;
        return `Invalid option: expected one of ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Too big: expected ${issue2.origin ?? "value"} to have ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elements"}`;
        return `Too big: expected ${issue2.origin ?? "value"} to be ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Too small: expected ${issue2.origin} to have ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Too small: expected ${issue2.origin} to be ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Invalid string: must start with "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `Invalid string: must end with "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Invalid string: must include "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Invalid string: must match pattern ${_issue.pattern}`;
        return `Invalid ${Nouns[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Invalid number: must be a multiple of ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Unrecognized key${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Invalid key in ${issue2.origin}`;
      case "invalid_union":
        return "Invalid input";
      case "invalid_element":
        return `Invalid value in ${issue2.origin}`;
      default:
        return `Invalid input`;
    }
  };
};
function en_default2() {
  return {
    localeError: error()
  };
}
// node_modules/zod/v4/core/registries.js
var $output = Symbol("ZodOutput");
var $input = Symbol("ZodInput");

class $ZodRegistry {
  constructor() {
    this._map = new Map;
    this._idmap = new Map;
  }
  add(schema, ..._meta) {
    const meta = _meta[0];
    this._map.set(schema, meta);
    if (meta && typeof meta === "object" && "id" in meta) {
      if (this._idmap.has(meta.id)) {
        throw new Error(`ID ${meta.id} already exists in the registry`);
      }
      this._idmap.set(meta.id, schema);
    }
    return this;
  }
  clear() {
    this._map = new Map;
    this._idmap = new Map;
    return this;
  }
  remove(schema) {
    const meta = this._map.get(schema);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.delete(meta.id);
    }
    this._map.delete(schema);
    return this;
  }
  get(schema) {
    const p = schema._zod.parent;
    if (p) {
      const pm = { ...this.get(p) ?? {} };
      delete pm.id;
      return { ...pm, ...this._map.get(schema) };
    }
    return this._map.get(schema);
  }
  has(schema) {
    return this._map.has(schema);
  }
}
function registry() {
  return new $ZodRegistry;
}
var globalRegistry = /* @__PURE__ */ registry();
// node_modules/zod/v4/core/api.js
function _string(Class2, params) {
  return new Class2({
    type: "string",
    ...normalizeParams(params)
  });
}
function _email(Class2, params) {
  return new Class2({
    type: "string",
    format: "email",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _guid(Class2, params) {
  return new Class2({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _uuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _uuidv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v4",
    ...normalizeParams(params)
  });
}
function _uuidv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v6",
    ...normalizeParams(params)
  });
}
function _uuidv7(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v7",
    ...normalizeParams(params)
  });
}
function _url(Class2, params) {
  return new Class2({
    type: "string",
    format: "url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _emoji2(Class2, params) {
  return new Class2({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _nanoid(Class2, params) {
  return new Class2({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cuid2(Class2, params) {
  return new Class2({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ulid(Class2, params) {
  return new Class2({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _xid(Class2, params) {
  return new Class2({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ksuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ipv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ipv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cidrv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cidrv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _base64(Class2, params) {
  return new Class2({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _base64url(Class2, params) {
  return new Class2({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _e164(Class2, params) {
  return new Class2({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _jwt(Class2, params) {
  return new Class2({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _isoDateTime(Class2, params) {
  return new Class2({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: false,
    local: false,
    precision: null,
    ...normalizeParams(params)
  });
}
function _isoDate(Class2, params) {
  return new Class2({
    type: "string",
    format: "date",
    check: "string_format",
    ...normalizeParams(params)
  });
}
function _isoTime(Class2, params) {
  return new Class2({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...normalizeParams(params)
  });
}
function _isoDuration(Class2, params) {
  return new Class2({
    type: "string",
    format: "duration",
    check: "string_format",
    ...normalizeParams(params)
  });
}
function _number(Class2, params) {
  return new Class2({
    type: "number",
    checks: [],
    ...normalizeParams(params)
  });
}
function _int(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "safeint",
    ...normalizeParams(params)
  });
}
function _boolean(Class2, params) {
  return new Class2({
    type: "boolean",
    ...normalizeParams(params)
  });
}
function _null2(Class2, params) {
  return new Class2({
    type: "null",
    ...normalizeParams(params)
  });
}
function _unknown(Class2) {
  return new Class2({
    type: "unknown"
  });
}
function _never(Class2, params) {
  return new Class2({
    type: "never",
    ...normalizeParams(params)
  });
}
function _lt(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
function _lte(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
function _gt(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
function _gte(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
function _multipleOf(value, params) {
  return new $ZodCheckMultipleOf({
    check: "multiple_of",
    ...normalizeParams(params),
    value
  });
}
function _maxLength(maximum, params) {
  const ch = new $ZodCheckMaxLength({
    check: "max_length",
    ...normalizeParams(params),
    maximum
  });
  return ch;
}
function _minLength(minimum, params) {
  return new $ZodCheckMinLength({
    check: "min_length",
    ...normalizeParams(params),
    minimum
  });
}
function _length(length, params) {
  return new $ZodCheckLengthEquals({
    check: "length_equals",
    ...normalizeParams(params),
    length
  });
}
function _regex(pattern, params) {
  return new $ZodCheckRegex({
    check: "string_format",
    format: "regex",
    ...normalizeParams(params),
    pattern
  });
}
function _lowercase(params) {
  return new $ZodCheckLowerCase({
    check: "string_format",
    format: "lowercase",
    ...normalizeParams(params)
  });
}
function _uppercase(params) {
  return new $ZodCheckUpperCase({
    check: "string_format",
    format: "uppercase",
    ...normalizeParams(params)
  });
}
function _includes(includes, params) {
  return new $ZodCheckIncludes({
    check: "string_format",
    format: "includes",
    ...normalizeParams(params),
    includes
  });
}
function _startsWith(prefix, params) {
  return new $ZodCheckStartsWith({
    check: "string_format",
    format: "starts_with",
    ...normalizeParams(params),
    prefix
  });
}
function _endsWith(suffix, params) {
  return new $ZodCheckEndsWith({
    check: "string_format",
    format: "ends_with",
    ...normalizeParams(params),
    suffix
  });
}
function _overwrite(tx) {
  return new $ZodCheckOverwrite({
    check: "overwrite",
    tx
  });
}
function _normalize(form) {
  return _overwrite((input) => input.normalize(form));
}
function _trim() {
  return _overwrite((input) => input.trim());
}
function _toLowerCase() {
  return _overwrite((input) => input.toLowerCase());
}
function _toUpperCase() {
  return _overwrite((input) => input.toUpperCase());
}
function _array(Class2, element, params) {
  return new Class2({
    type: "array",
    element,
    ...normalizeParams(params)
  });
}
function _custom(Class2, fn, _params) {
  const norm = normalizeParams(_params);
  norm.abort ?? (norm.abort = true);
  const schema = new Class2({
    type: "custom",
    check: "custom",
    fn,
    ...norm
  });
  return schema;
}
function _refine(Class2, fn, _params) {
  const schema = new Class2({
    type: "custom",
    check: "custom",
    fn,
    ...normalizeParams(_params)
  });
  return schema;
}
// node_modules/zod/v4/core/to-json-schema.js
class JSONSchemaGenerator {
  constructor(params) {
    this.counter = 0;
    this.metadataRegistry = params?.metadata ?? globalRegistry;
    this.target = params?.target ?? "draft-2020-12";
    this.unrepresentable = params?.unrepresentable ?? "throw";
    this.override = params?.override ?? (() => {});
    this.io = params?.io ?? "output";
    this.seen = new Map;
  }
  process(schema, _params = { path: [], schemaPath: [] }) {
    var _a;
    const def = schema._zod.def;
    const formatMap = {
      guid: "uuid",
      url: "uri",
      datetime: "date-time",
      json_string: "json-string",
      regex: ""
    };
    const seen = this.seen.get(schema);
    if (seen) {
      seen.count++;
      const isCycle = _params.schemaPath.includes(schema);
      if (isCycle) {
        seen.cycle = _params.path;
      }
      return seen.schema;
    }
    const result = { schema: {}, count: 1, cycle: undefined, path: _params.path };
    this.seen.set(schema, result);
    const overrideSchema = schema._zod.toJSONSchema?.();
    if (overrideSchema) {
      result.schema = overrideSchema;
    } else {
      const params = {
        ..._params,
        schemaPath: [..._params.schemaPath, schema],
        path: _params.path
      };
      const parent = schema._zod.parent;
      if (parent) {
        result.ref = parent;
        this.process(parent, params);
        this.seen.get(parent).isParent = true;
      } else {
        const _json = result.schema;
        switch (def.type) {
          case "string": {
            const json = _json;
            json.type = "string";
            const { minimum, maximum, format, patterns, contentEncoding } = schema._zod.bag;
            if (typeof minimum === "number")
              json.minLength = minimum;
            if (typeof maximum === "number")
              json.maxLength = maximum;
            if (format) {
              json.format = formatMap[format] ?? format;
              if (json.format === "")
                delete json.format;
            }
            if (contentEncoding)
              json.contentEncoding = contentEncoding;
            if (patterns && patterns.size > 0) {
              const regexes = [...patterns];
              if (regexes.length === 1)
                json.pattern = regexes[0].source;
              else if (regexes.length > 1) {
                result.schema.allOf = [
                  ...regexes.map((regex) => ({
                    ...this.target === "draft-7" ? { type: "string" } : {},
                    pattern: regex.source
                  }))
                ];
              }
            }
            break;
          }
          case "number": {
            const json = _json;
            const { minimum, maximum, format, multipleOf, exclusiveMaximum, exclusiveMinimum } = schema._zod.bag;
            if (typeof format === "string" && format.includes("int"))
              json.type = "integer";
            else
              json.type = "number";
            if (typeof exclusiveMinimum === "number")
              json.exclusiveMinimum = exclusiveMinimum;
            if (typeof minimum === "number") {
              json.minimum = minimum;
              if (typeof exclusiveMinimum === "number") {
                if (exclusiveMinimum >= minimum)
                  delete json.minimum;
                else
                  delete json.exclusiveMinimum;
              }
            }
            if (typeof exclusiveMaximum === "number")
              json.exclusiveMaximum = exclusiveMaximum;
            if (typeof maximum === "number") {
              json.maximum = maximum;
              if (typeof exclusiveMaximum === "number") {
                if (exclusiveMaximum <= maximum)
                  delete json.maximum;
                else
                  delete json.exclusiveMaximum;
              }
            }
            if (typeof multipleOf === "number")
              json.multipleOf = multipleOf;
            break;
          }
          case "boolean": {
            const json = _json;
            json.type = "boolean";
            break;
          }
          case "bigint": {
            if (this.unrepresentable === "throw") {
              throw new Error("BigInt cannot be represented in JSON Schema");
            }
            break;
          }
          case "symbol": {
            if (this.unrepresentable === "throw") {
              throw new Error("Symbols cannot be represented in JSON Schema");
            }
            break;
          }
          case "null": {
            _json.type = "null";
            break;
          }
          case "any": {
            break;
          }
          case "unknown": {
            break;
          }
          case "undefined": {
            if (this.unrepresentable === "throw") {
              throw new Error("Undefined cannot be represented in JSON Schema");
            }
            break;
          }
          case "void": {
            if (this.unrepresentable === "throw") {
              throw new Error("Void cannot be represented in JSON Schema");
            }
            break;
          }
          case "never": {
            _json.not = {};
            break;
          }
          case "date": {
            if (this.unrepresentable === "throw") {
              throw new Error("Date cannot be represented in JSON Schema");
            }
            break;
          }
          case "array": {
            const json = _json;
            const { minimum, maximum } = schema._zod.bag;
            if (typeof minimum === "number")
              json.minItems = minimum;
            if (typeof maximum === "number")
              json.maxItems = maximum;
            json.type = "array";
            json.items = this.process(def.element, { ...params, path: [...params.path, "items"] });
            break;
          }
          case "object": {
            const json = _json;
            json.type = "object";
            json.properties = {};
            const shape = def.shape;
            for (const key in shape) {
              json.properties[key] = this.process(shape[key], {
                ...params,
                path: [...params.path, "properties", key]
              });
            }
            const allKeys = new Set(Object.keys(shape));
            const requiredKeys = new Set([...allKeys].filter((key) => {
              const v = def.shape[key]._zod;
              if (this.io === "input") {
                return v.optin === undefined;
              } else {
                return v.optout === undefined;
              }
            }));
            if (requiredKeys.size > 0) {
              json.required = Array.from(requiredKeys);
            }
            if (def.catchall?._zod.def.type === "never") {
              json.additionalProperties = false;
            } else if (!def.catchall) {
              if (this.io === "output")
                json.additionalProperties = false;
            } else if (def.catchall) {
              json.additionalProperties = this.process(def.catchall, {
                ...params,
                path: [...params.path, "additionalProperties"]
              });
            }
            break;
          }
          case "union": {
            const json = _json;
            json.anyOf = def.options.map((x, i) => this.process(x, {
              ...params,
              path: [...params.path, "anyOf", i]
            }));
            break;
          }
          case "intersection": {
            const json = _json;
            const a = this.process(def.left, {
              ...params,
              path: [...params.path, "allOf", 0]
            });
            const b = this.process(def.right, {
              ...params,
              path: [...params.path, "allOf", 1]
            });
            const isSimpleIntersection = (val) => ("allOf" in val) && Object.keys(val).length === 1;
            const allOf = [
              ...isSimpleIntersection(a) ? a.allOf : [a],
              ...isSimpleIntersection(b) ? b.allOf : [b]
            ];
            json.allOf = allOf;
            break;
          }
          case "tuple": {
            const json = _json;
            json.type = "array";
            const prefixItems = def.items.map((x, i) => this.process(x, { ...params, path: [...params.path, "prefixItems", i] }));
            if (this.target === "draft-2020-12") {
              json.prefixItems = prefixItems;
            } else {
              json.items = prefixItems;
            }
            if (def.rest) {
              const rest = this.process(def.rest, {
                ...params,
                path: [...params.path, "items"]
              });
              if (this.target === "draft-2020-12") {
                json.items = rest;
              } else {
                json.additionalItems = rest;
              }
            }
            if (def.rest) {
              json.items = this.process(def.rest, {
                ...params,
                path: [...params.path, "items"]
              });
            }
            const { minimum, maximum } = schema._zod.bag;
            if (typeof minimum === "number")
              json.minItems = minimum;
            if (typeof maximum === "number")
              json.maxItems = maximum;
            break;
          }
          case "record": {
            const json = _json;
            json.type = "object";
            json.propertyNames = this.process(def.keyType, { ...params, path: [...params.path, "propertyNames"] });
            json.additionalProperties = this.process(def.valueType, {
              ...params,
              path: [...params.path, "additionalProperties"]
            });
            break;
          }
          case "map": {
            if (this.unrepresentable === "throw") {
              throw new Error("Map cannot be represented in JSON Schema");
            }
            break;
          }
          case "set": {
            if (this.unrepresentable === "throw") {
              throw new Error("Set cannot be represented in JSON Schema");
            }
            break;
          }
          case "enum": {
            const json = _json;
            const values = getEnumValues(def.entries);
            if (values.every((v) => typeof v === "number"))
              json.type = "number";
            if (values.every((v) => typeof v === "string"))
              json.type = "string";
            json.enum = values;
            break;
          }
          case "literal": {
            const json = _json;
            const vals = [];
            for (const val of def.values) {
              if (val === undefined) {
                if (this.unrepresentable === "throw") {
                  throw new Error("Literal `undefined` cannot be represented in JSON Schema");
                } else {}
              } else if (typeof val === "bigint") {
                if (this.unrepresentable === "throw") {
                  throw new Error("BigInt literals cannot be represented in JSON Schema");
                } else {
                  vals.push(Number(val));
                }
              } else {
                vals.push(val);
              }
            }
            if (vals.length === 0) {} else if (vals.length === 1) {
              const val = vals[0];
              json.type = val === null ? "null" : typeof val;
              json.const = val;
            } else {
              if (vals.every((v) => typeof v === "number"))
                json.type = "number";
              if (vals.every((v) => typeof v === "string"))
                json.type = "string";
              if (vals.every((v) => typeof v === "boolean"))
                json.type = "string";
              if (vals.every((v) => v === null))
                json.type = "null";
              json.enum = vals;
            }
            break;
          }
          case "file": {
            const json = _json;
            const file = {
              type: "string",
              format: "binary",
              contentEncoding: "binary"
            };
            const { minimum, maximum, mime } = schema._zod.bag;
            if (minimum !== undefined)
              file.minLength = minimum;
            if (maximum !== undefined)
              file.maxLength = maximum;
            if (mime) {
              if (mime.length === 1) {
                file.contentMediaType = mime[0];
                Object.assign(json, file);
              } else {
                json.anyOf = mime.map((m) => {
                  const mFile = { ...file, contentMediaType: m };
                  return mFile;
                });
              }
            } else {
              Object.assign(json, file);
            }
            break;
          }
          case "transform": {
            if (this.unrepresentable === "throw") {
              throw new Error("Transforms cannot be represented in JSON Schema");
            }
            break;
          }
          case "nullable": {
            const inner = this.process(def.innerType, params);
            _json.anyOf = [inner, { type: "null" }];
            break;
          }
          case "nonoptional": {
            this.process(def.innerType, params);
            result.ref = def.innerType;
            break;
          }
          case "success": {
            const json = _json;
            json.type = "boolean";
            break;
          }
          case "default": {
            this.process(def.innerType, params);
            result.ref = def.innerType;
            _json.default = JSON.parse(JSON.stringify(def.defaultValue));
            break;
          }
          case "prefault": {
            this.process(def.innerType, params);
            result.ref = def.innerType;
            if (this.io === "input")
              _json._prefault = JSON.parse(JSON.stringify(def.defaultValue));
            break;
          }
          case "catch": {
            this.process(def.innerType, params);
            result.ref = def.innerType;
            let catchValue;
            try {
              catchValue = def.catchValue(undefined);
            } catch {
              throw new Error("Dynamic catch values are not supported in JSON Schema");
            }
            _json.default = catchValue;
            break;
          }
          case "nan": {
            if (this.unrepresentable === "throw") {
              throw new Error("NaN cannot be represented in JSON Schema");
            }
            break;
          }
          case "template_literal": {
            const json = _json;
            const pattern = schema._zod.pattern;
            if (!pattern)
              throw new Error("Pattern not found in template literal");
            json.type = "string";
            json.pattern = pattern.source;
            break;
          }
          case "pipe": {
            const innerType = this.io === "input" ? def.in._zod.def.type === "transform" ? def.out : def.in : def.out;
            this.process(innerType, params);
            result.ref = innerType;
            break;
          }
          case "readonly": {
            this.process(def.innerType, params);
            result.ref = def.innerType;
            _json.readOnly = true;
            break;
          }
          case "promise": {
            this.process(def.innerType, params);
            result.ref = def.innerType;
            break;
          }
          case "optional": {
            this.process(def.innerType, params);
            result.ref = def.innerType;
            break;
          }
          case "lazy": {
            const innerType = schema._zod.innerType;
            this.process(innerType, params);
            result.ref = innerType;
            break;
          }
          case "custom": {
            if (this.unrepresentable === "throw") {
              throw new Error("Custom types cannot be represented in JSON Schema");
            }
            break;
          }
          default: {}
        }
      }
    }
    const meta = this.metadataRegistry.get(schema);
    if (meta)
      Object.assign(result.schema, meta);
    if (this.io === "input" && isTransforming(schema)) {
      delete result.schema.examples;
      delete result.schema.default;
    }
    if (this.io === "input" && result.schema._prefault)
      (_a = result.schema).default ?? (_a.default = result.schema._prefault);
    delete result.schema._prefault;
    const _result = this.seen.get(schema);
    return _result.schema;
  }
  emit(schema, _params) {
    const params = {
      cycles: _params?.cycles ?? "ref",
      reused: _params?.reused ?? "inline",
      external: _params?.external ?? undefined
    };
    const root = this.seen.get(schema);
    if (!root)
      throw new Error("Unprocessed schema. This is a bug in Zod.");
    const makeURI = (entry) => {
      const defsSegment = this.target === "draft-2020-12" ? "$defs" : "definitions";
      if (params.external) {
        const externalId = params.external.registry.get(entry[0])?.id;
        const uriGenerator = params.external.uri ?? ((id2) => id2);
        if (externalId) {
          return { ref: uriGenerator(externalId) };
        }
        const id = entry[1].defId ?? entry[1].schema.id ?? `schema${this.counter++}`;
        entry[1].defId = id;
        return { defId: id, ref: `${uriGenerator("__shared")}#/${defsSegment}/${id}` };
      }
      if (entry[1] === root) {
        return { ref: "#" };
      }
      const uriPrefix = `#`;
      const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
      const defId = entry[1].schema.id ?? `__schema${this.counter++}`;
      return { defId, ref: defUriPrefix + defId };
    };
    const extractToDef = (entry) => {
      if (entry[1].schema.$ref) {
        return;
      }
      const seen = entry[1];
      const { ref, defId } = makeURI(entry);
      seen.def = { ...seen.schema };
      if (defId)
        seen.defId = defId;
      const schema2 = seen.schema;
      for (const key in schema2) {
        delete schema2[key];
      }
      schema2.$ref = ref;
    };
    if (params.cycles === "throw") {
      for (const entry of this.seen.entries()) {
        const seen = entry[1];
        if (seen.cycle) {
          throw new Error("Cycle detected: " + `#/${seen.cycle?.join("/")}/<root>` + '\n\nSet the `cycles` parameter to `"ref"` to resolve cyclical schemas with defs.');
        }
      }
    }
    for (const entry of this.seen.entries()) {
      const seen = entry[1];
      if (schema === entry[0]) {
        extractToDef(entry);
        continue;
      }
      if (params.external) {
        const ext = params.external.registry.get(entry[0])?.id;
        if (schema !== entry[0] && ext) {
          extractToDef(entry);
          continue;
        }
      }
      const id = this.metadataRegistry.get(entry[0])?.id;
      if (id) {
        extractToDef(entry);
        continue;
      }
      if (seen.cycle) {
        extractToDef(entry);
        continue;
      }
      if (seen.count > 1) {
        if (params.reused === "ref") {
          extractToDef(entry);
          continue;
        }
      }
    }
    const flattenRef = (zodSchema, params2) => {
      const seen = this.seen.get(zodSchema);
      const schema2 = seen.def ?? seen.schema;
      const _cached = { ...schema2 };
      if (seen.ref === null) {
        return;
      }
      const ref = seen.ref;
      seen.ref = null;
      if (ref) {
        flattenRef(ref, params2);
        const refSchema = this.seen.get(ref).schema;
        if (refSchema.$ref && params2.target === "draft-7") {
          schema2.allOf = schema2.allOf ?? [];
          schema2.allOf.push(refSchema);
        } else {
          Object.assign(schema2, refSchema);
          Object.assign(schema2, _cached);
        }
      }
      if (!seen.isParent)
        this.override({
          zodSchema,
          jsonSchema: schema2,
          path: seen.path ?? []
        });
    };
    for (const entry of [...this.seen.entries()].reverse()) {
      flattenRef(entry[0], { target: this.target });
    }
    const result = {};
    if (this.target === "draft-2020-12") {
      result.$schema = "https://json-schema.org/draft/2020-12/schema";
    } else if (this.target === "draft-7") {
      result.$schema = "http://json-schema.org/draft-07/schema#";
    } else {
      console.warn(`Invalid target: ${this.target}`);
    }
    if (params.external?.uri) {
      const id = params.external.registry.get(schema)?.id;
      if (!id)
        throw new Error("Schema is missing an `id` property");
      result.$id = params.external.uri(id);
    }
    Object.assign(result, root.def);
    const defs = params.external?.defs ?? {};
    for (const entry of this.seen.entries()) {
      const seen = entry[1];
      if (seen.def && seen.defId) {
        defs[seen.defId] = seen.def;
      }
    }
    if (params.external) {} else {
      if (Object.keys(defs).length > 0) {
        if (this.target === "draft-2020-12") {
          result.$defs = defs;
        } else {
          result.definitions = defs;
        }
      }
    }
    try {
      return JSON.parse(JSON.stringify(result));
    } catch (_err) {
      throw new Error("Error converting schema to JSON.");
    }
  }
}
function toJSONSchema(input, _params) {
  if (input instanceof $ZodRegistry) {
    const gen2 = new JSONSchemaGenerator(_params);
    const defs = {};
    for (const entry of input._idmap.entries()) {
      const [_, schema] = entry;
      gen2.process(schema);
    }
    const schemas = {};
    const external = {
      registry: input,
      uri: _params?.uri,
      defs
    };
    for (const entry of input._idmap.entries()) {
      const [key, schema] = entry;
      schemas[key] = gen2.emit(schema, {
        ..._params,
        external
      });
    }
    if (Object.keys(defs).length > 0) {
      const defsSegment = gen2.target === "draft-2020-12" ? "$defs" : "definitions";
      schemas.__shared = {
        [defsSegment]: defs
      };
    }
    return { schemas };
  }
  const gen = new JSONSchemaGenerator(_params);
  gen.process(input);
  return gen.emit(input, _params);
}
function isTransforming(_schema, _ctx) {
  const ctx = _ctx ?? { seen: new Set };
  if (ctx.seen.has(_schema))
    return false;
  ctx.seen.add(_schema);
  const schema = _schema;
  const def = schema._zod.def;
  switch (def.type) {
    case "string":
    case "number":
    case "bigint":
    case "boolean":
    case "date":
    case "symbol":
    case "undefined":
    case "null":
    case "any":
    case "unknown":
    case "never":
    case "void":
    case "literal":
    case "enum":
    case "nan":
    case "file":
    case "template_literal":
      return false;
    case "array": {
      return isTransforming(def.element, ctx);
    }
    case "object": {
      for (const key in def.shape) {
        if (isTransforming(def.shape[key], ctx))
          return true;
      }
      return false;
    }
    case "union": {
      for (const option of def.options) {
        if (isTransforming(option, ctx))
          return true;
      }
      return false;
    }
    case "intersection": {
      return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
    }
    case "tuple": {
      for (const item of def.items) {
        if (isTransforming(item, ctx))
          return true;
      }
      if (def.rest && isTransforming(def.rest, ctx))
        return true;
      return false;
    }
    case "record": {
      return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
    }
    case "map": {
      return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
    }
    case "set": {
      return isTransforming(def.valueType, ctx);
    }
    case "promise":
    case "optional":
    case "nonoptional":
    case "nullable":
    case "readonly":
      return isTransforming(def.innerType, ctx);
    case "lazy":
      return isTransforming(def.getter(), ctx);
    case "default": {
      return isTransforming(def.innerType, ctx);
    }
    case "prefault": {
      return isTransforming(def.innerType, ctx);
    }
    case "custom": {
      return false;
    }
    case "transform": {
      return true;
    }
    case "pipe": {
      return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
    }
    case "success": {
      return false;
    }
    case "catch": {
      return false;
    }
    default:
  }
  throw new Error(`Unknown schema type: ${def.type}`);
}
// node_modules/zod/v4/mini/schemas.js
var ZodMiniType = /* @__PURE__ */ $constructor("ZodMiniType", (inst, def) => {
  if (!inst._zod)
    throw new Error("Uninitialized schema in ZodMiniType.");
  $ZodType.init(inst, def);
  inst.def = def;
  inst.parse = (data, params) => parse(inst, data, params, { callee: inst.parse });
  inst.safeParse = (data, params) => safeParse(inst, data, params);
  inst.parseAsync = async (data, params) => parseAsync(inst, data, params, { callee: inst.parseAsync });
  inst.safeParseAsync = async (data, params) => safeParseAsync(inst, data, params);
  inst.check = (...checks2) => {
    return inst.clone({
      ...def,
      checks: [
        ...def.checks ?? [],
        ...checks2.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
      ]
    });
  };
  inst.clone = (_def, params) => clone(inst, _def, params);
  inst.brand = () => inst;
  inst.register = (reg, meta) => {
    reg.add(inst, meta);
    return inst;
  };
});
var ZodMiniObject = /* @__PURE__ */ $constructor("ZodMiniObject", (inst, def) => {
  $ZodObject.init(inst, def);
  ZodMiniType.init(inst, def);
  exports_util.defineLazy(inst, "shape", () => def.shape);
});
function object(shape, params) {
  const def = {
    type: "object",
    get shape() {
      exports_util.assignProp(this, "shape", { ...shape });
      return this.shape;
    },
    ...exports_util.normalizeParams(params)
  };
  return new ZodMiniObject(def);
}
// node_modules/@modelcontextprotocol/sdk/dist/esm/server/zod-compat.js
function isZ4Schema(s) {
  const schema = s;
  return !!schema._zod;
}
function objectFromShape(shape) {
  const values = Object.values(shape);
  if (values.length === 0)
    return object({});
  const allV4 = values.every(isZ4Schema);
  const allV3 = values.every((s) => !isZ4Schema(s));
  if (allV4)
    return object(shape);
  if (allV3)
    return objectType(shape);
  throw new Error("Mixed Zod versions detected in object shape.");
}
function safeParse2(schema, data) {
  if (isZ4Schema(schema)) {
    const result2 = safeParse(schema, data);
    return result2;
  }
  const v3Schema = schema;
  const result = v3Schema.safeParse(data);
  return result;
}
async function safeParseAsync2(schema, data) {
  if (isZ4Schema(schema)) {
    const result2 = await safeParseAsync(schema, data);
    return result2;
  }
  const v3Schema = schema;
  const result = await v3Schema.safeParseAsync(data);
  return result;
}
function getObjectShape(schema) {
  if (!schema)
    return;
  let rawShape;
  if (isZ4Schema(schema)) {
    const v4Schema = schema;
    rawShape = v4Schema._zod?.def?.shape;
  } else {
    const v3Schema = schema;
    rawShape = v3Schema.shape;
  }
  if (!rawShape)
    return;
  if (typeof rawShape === "function") {
    try {
      return rawShape();
    } catch {
      return;
    }
  }
  return rawShape;
}
function normalizeObjectSchema(schema) {
  if (!schema)
    return;
  if (typeof schema === "object") {
    const asV3 = schema;
    const asV4 = schema;
    if (!asV3._def && !asV4._zod) {
      const values = Object.values(schema);
      if (values.length > 0 && values.every((v) => typeof v === "object" && v !== null && (v._def !== undefined || v._zod !== undefined || typeof v.parse === "function"))) {
        return objectFromShape(schema);
      }
    }
  }
  if (isZ4Schema(schema)) {
    const v4Schema = schema;
    const def = v4Schema._zod?.def;
    if (def && (def.type === "object" || def.shape !== undefined)) {
      return schema;
    }
  } else {
    const v3Schema = schema;
    if (v3Schema.shape !== undefined) {
      return schema;
    }
  }
  return;
}
function getParseErrorMessage(error2) {
  if (error2 && typeof error2 === "object") {
    if ("message" in error2 && typeof error2.message === "string") {
      return error2.message;
    }
    if ("issues" in error2 && Array.isArray(error2.issues) && error2.issues.length > 0) {
      const firstIssue = error2.issues[0];
      if (firstIssue && typeof firstIssue === "object" && "message" in firstIssue) {
        return String(firstIssue.message);
      }
    }
    try {
      return JSON.stringify(error2);
    } catch {
      return String(error2);
    }
  }
  return String(error2);
}
function getSchemaDescription(schema) {
  return schema.description;
}
function isSchemaOptional(schema) {
  if (isZ4Schema(schema)) {
    const v4Schema = schema;
    return v4Schema._zod?.def?.type === "optional";
  }
  const v3Schema = schema;
  if (typeof schema.isOptional === "function") {
    return schema.isOptional();
  }
  return v3Schema._def?.typeName === "ZodOptional";
}
function getLiteralValue(schema) {
  if (isZ4Schema(schema)) {
    const v4Schema = schema;
    const def2 = v4Schema._zod?.def;
    if (def2) {
      if (def2.value !== undefined)
        return def2.value;
      if (Array.isArray(def2.values) && def2.values.length > 0) {
        return def2.values[0];
      }
    }
  }
  const v3Schema = schema;
  const def = v3Schema._def;
  if (def) {
    if (def.value !== undefined)
      return def.value;
    if (Array.isArray(def.values) && def.values.length > 0) {
      return def.values[0];
    }
  }
  const directValue = schema.value;
  if (directValue !== undefined)
    return directValue;
  return;
}
// node_modules/zod/v4/classic/iso.js
var exports_iso2 = {};
__export(exports_iso2, {
  time: () => time2,
  duration: () => duration2,
  datetime: () => datetime2,
  date: () => date2,
  ZodISOTime: () => ZodISOTime,
  ZodISODuration: () => ZodISODuration,
  ZodISODateTime: () => ZodISODateTime,
  ZodISODate: () => ZodISODate
});
var ZodISODateTime = /* @__PURE__ */ $constructor("ZodISODateTime", (inst, def) => {
  $ZodISODateTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function datetime2(params) {
  return _isoDateTime(ZodISODateTime, params);
}
var ZodISODate = /* @__PURE__ */ $constructor("ZodISODate", (inst, def) => {
  $ZodISODate.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function date2(params) {
  return _isoDate(ZodISODate, params);
}
var ZodISOTime = /* @__PURE__ */ $constructor("ZodISOTime", (inst, def) => {
  $ZodISOTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function time2(params) {
  return _isoTime(ZodISOTime, params);
}
var ZodISODuration = /* @__PURE__ */ $constructor("ZodISODuration", (inst, def) => {
  $ZodISODuration.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function duration2(params) {
  return _isoDuration(ZodISODuration, params);
}

// node_modules/zod/v4/classic/errors.js
var initializer2 = (inst, issues) => {
  $ZodError.init(inst, issues);
  inst.name = "ZodError";
  Object.defineProperties(inst, {
    format: {
      value: (mapper) => formatError(inst, mapper)
    },
    flatten: {
      value: (mapper) => flattenError(inst, mapper)
    },
    addIssue: {
      value: (issue2) => inst.issues.push(issue2)
    },
    addIssues: {
      value: (issues2) => inst.issues.push(...issues2)
    },
    isEmpty: {
      get() {
        return inst.issues.length === 0;
      }
    }
  });
};
var ZodError3 = $constructor("ZodError", initializer2);
var ZodRealError = $constructor("ZodError", initializer2, {
  Parent: Error
});

// node_modules/zod/v4/classic/parse.js
var parse4 = /* @__PURE__ */ _parse(ZodRealError);
var parseAsync2 = /* @__PURE__ */ _parseAsync(ZodRealError);
var safeParse3 = /* @__PURE__ */ _safeParse(ZodRealError);
var safeParseAsync3 = /* @__PURE__ */ _safeParseAsync(ZodRealError);

// node_modules/zod/v4/classic/schemas.js
var ZodType2 = /* @__PURE__ */ $constructor("ZodType", (inst, def) => {
  $ZodType.init(inst, def);
  inst.def = def;
  Object.defineProperty(inst, "_def", { value: def });
  inst.check = (...checks3) => {
    return inst.clone({
      ...def,
      checks: [
        ...def.checks ?? [],
        ...checks3.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
      ]
    });
  };
  inst.clone = (def2, params) => clone(inst, def2, params);
  inst.brand = () => inst;
  inst.register = (reg, meta) => {
    reg.add(inst, meta);
    return inst;
  };
  inst.parse = (data, params) => parse4(inst, data, params, { callee: inst.parse });
  inst.safeParse = (data, params) => safeParse3(inst, data, params);
  inst.parseAsync = async (data, params) => parseAsync2(inst, data, params, { callee: inst.parseAsync });
  inst.safeParseAsync = async (data, params) => safeParseAsync3(inst, data, params);
  inst.spa = inst.safeParseAsync;
  inst.refine = (check, params) => inst.check(refine(check, params));
  inst.superRefine = (refinement) => inst.check(superRefine(refinement));
  inst.overwrite = (fn) => inst.check(_overwrite(fn));
  inst.optional = () => optional(inst);
  inst.nullable = () => nullable(inst);
  inst.nullish = () => optional(nullable(inst));
  inst.nonoptional = (params) => nonoptional(inst, params);
  inst.array = () => array(inst);
  inst.or = (arg) => union([inst, arg]);
  inst.and = (arg) => intersection(inst, arg);
  inst.transform = (tx) => pipe(inst, transform(tx));
  inst.default = (def2) => _default(inst, def2);
  inst.prefault = (def2) => prefault(inst, def2);
  inst.catch = (params) => _catch(inst, params);
  inst.pipe = (target) => pipe(inst, target);
  inst.readonly = () => readonly(inst);
  inst.describe = (description) => {
    const cl = inst.clone();
    globalRegistry.add(cl, { description });
    return cl;
  };
  Object.defineProperty(inst, "description", {
    get() {
      return globalRegistry.get(inst)?.description;
    },
    configurable: true
  });
  inst.meta = (...args) => {
    if (args.length === 0) {
      return globalRegistry.get(inst);
    }
    const cl = inst.clone();
    globalRegistry.add(cl, args[0]);
    return cl;
  };
  inst.isOptional = () => inst.safeParse(undefined).success;
  inst.isNullable = () => inst.safeParse(null).success;
  return inst;
});
var _ZodString = /* @__PURE__ */ $constructor("_ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  ZodType2.init(inst, def);
  const bag = inst._zod.bag;
  inst.format = bag.format ?? null;
  inst.minLength = bag.minimum ?? null;
  inst.maxLength = bag.maximum ?? null;
  inst.regex = (...args) => inst.check(_regex(...args));
  inst.includes = (...args) => inst.check(_includes(...args));
  inst.startsWith = (...args) => inst.check(_startsWith(...args));
  inst.endsWith = (...args) => inst.check(_endsWith(...args));
  inst.min = (...args) => inst.check(_minLength(...args));
  inst.max = (...args) => inst.check(_maxLength(...args));
  inst.length = (...args) => inst.check(_length(...args));
  inst.nonempty = (...args) => inst.check(_minLength(1, ...args));
  inst.lowercase = (params) => inst.check(_lowercase(params));
  inst.uppercase = (params) => inst.check(_uppercase(params));
  inst.trim = () => inst.check(_trim());
  inst.normalize = (...args) => inst.check(_normalize(...args));
  inst.toLowerCase = () => inst.check(_toLowerCase());
  inst.toUpperCase = () => inst.check(_toUpperCase());
});
var ZodString2 = /* @__PURE__ */ $constructor("ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  _ZodString.init(inst, def);
  inst.email = (params) => inst.check(_email(ZodEmail, params));
  inst.url = (params) => inst.check(_url(ZodURL, params));
  inst.jwt = (params) => inst.check(_jwt(ZodJWT, params));
  inst.emoji = (params) => inst.check(_emoji2(ZodEmoji, params));
  inst.guid = (params) => inst.check(_guid(ZodGUID, params));
  inst.uuid = (params) => inst.check(_uuid(ZodUUID, params));
  inst.uuidv4 = (params) => inst.check(_uuidv4(ZodUUID, params));
  inst.uuidv6 = (params) => inst.check(_uuidv6(ZodUUID, params));
  inst.uuidv7 = (params) => inst.check(_uuidv7(ZodUUID, params));
  inst.nanoid = (params) => inst.check(_nanoid(ZodNanoID, params));
  inst.guid = (params) => inst.check(_guid(ZodGUID, params));
  inst.cuid = (params) => inst.check(_cuid(ZodCUID, params));
  inst.cuid2 = (params) => inst.check(_cuid2(ZodCUID2, params));
  inst.ulid = (params) => inst.check(_ulid(ZodULID, params));
  inst.base64 = (params) => inst.check(_base64(ZodBase64, params));
  inst.base64url = (params) => inst.check(_base64url(ZodBase64URL, params));
  inst.xid = (params) => inst.check(_xid(ZodXID, params));
  inst.ksuid = (params) => inst.check(_ksuid(ZodKSUID, params));
  inst.ipv4 = (params) => inst.check(_ipv4(ZodIPv4, params));
  inst.ipv6 = (params) => inst.check(_ipv6(ZodIPv6, params));
  inst.cidrv4 = (params) => inst.check(_cidrv4(ZodCIDRv4, params));
  inst.cidrv6 = (params) => inst.check(_cidrv6(ZodCIDRv6, params));
  inst.e164 = (params) => inst.check(_e164(ZodE164, params));
  inst.datetime = (params) => inst.check(datetime2(params));
  inst.date = (params) => inst.check(date2(params));
  inst.time = (params) => inst.check(time2(params));
  inst.duration = (params) => inst.check(duration2(params));
});
function string2(params) {
  return _string(ZodString2, params);
}
var ZodStringFormat = /* @__PURE__ */ $constructor("ZodStringFormat", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  _ZodString.init(inst, def);
});
var ZodEmail = /* @__PURE__ */ $constructor("ZodEmail", (inst, def) => {
  $ZodEmail.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodGUID = /* @__PURE__ */ $constructor("ZodGUID", (inst, def) => {
  $ZodGUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodUUID = /* @__PURE__ */ $constructor("ZodUUID", (inst, def) => {
  $ZodUUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodURL = /* @__PURE__ */ $constructor("ZodURL", (inst, def) => {
  $ZodURL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodEmoji = /* @__PURE__ */ $constructor("ZodEmoji", (inst, def) => {
  $ZodEmoji.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodNanoID = /* @__PURE__ */ $constructor("ZodNanoID", (inst, def) => {
  $ZodNanoID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCUID = /* @__PURE__ */ $constructor("ZodCUID", (inst, def) => {
  $ZodCUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCUID2 = /* @__PURE__ */ $constructor("ZodCUID2", (inst, def) => {
  $ZodCUID2.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodULID = /* @__PURE__ */ $constructor("ZodULID", (inst, def) => {
  $ZodULID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodXID = /* @__PURE__ */ $constructor("ZodXID", (inst, def) => {
  $ZodXID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodKSUID = /* @__PURE__ */ $constructor("ZodKSUID", (inst, def) => {
  $ZodKSUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodIPv4 = /* @__PURE__ */ $constructor("ZodIPv4", (inst, def) => {
  $ZodIPv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodIPv6 = /* @__PURE__ */ $constructor("ZodIPv6", (inst, def) => {
  $ZodIPv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCIDRv4 = /* @__PURE__ */ $constructor("ZodCIDRv4", (inst, def) => {
  $ZodCIDRv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCIDRv6 = /* @__PURE__ */ $constructor("ZodCIDRv6", (inst, def) => {
  $ZodCIDRv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodBase64 = /* @__PURE__ */ $constructor("ZodBase64", (inst, def) => {
  $ZodBase64.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodBase64URL = /* @__PURE__ */ $constructor("ZodBase64URL", (inst, def) => {
  $ZodBase64URL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodE164 = /* @__PURE__ */ $constructor("ZodE164", (inst, def) => {
  $ZodE164.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodJWT = /* @__PURE__ */ $constructor("ZodJWT", (inst, def) => {
  $ZodJWT.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodNumber2 = /* @__PURE__ */ $constructor("ZodNumber", (inst, def) => {
  $ZodNumber.init(inst, def);
  ZodType2.init(inst, def);
  inst.gt = (value, params) => inst.check(_gt(value, params));
  inst.gte = (value, params) => inst.check(_gte(value, params));
  inst.min = (value, params) => inst.check(_gte(value, params));
  inst.lt = (value, params) => inst.check(_lt(value, params));
  inst.lte = (value, params) => inst.check(_lte(value, params));
  inst.max = (value, params) => inst.check(_lte(value, params));
  inst.int = (params) => inst.check(int(params));
  inst.safe = (params) => inst.check(int(params));
  inst.positive = (params) => inst.check(_gt(0, params));
  inst.nonnegative = (params) => inst.check(_gte(0, params));
  inst.negative = (params) => inst.check(_lt(0, params));
  inst.nonpositive = (params) => inst.check(_lte(0, params));
  inst.multipleOf = (value, params) => inst.check(_multipleOf(value, params));
  inst.step = (value, params) => inst.check(_multipleOf(value, params));
  inst.finite = () => inst;
  const bag = inst._zod.bag;
  inst.minValue = Math.max(bag.minimum ?? Number.NEGATIVE_INFINITY, bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null;
  inst.maxValue = Math.min(bag.maximum ?? Number.POSITIVE_INFINITY, bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null;
  inst.isInt = (bag.format ?? "").includes("int") || Number.isSafeInteger(bag.multipleOf ?? 0.5);
  inst.isFinite = true;
  inst.format = bag.format ?? null;
});
function number2(params) {
  return _number(ZodNumber2, params);
}
var ZodNumberFormat = /* @__PURE__ */ $constructor("ZodNumberFormat", (inst, def) => {
  $ZodNumberFormat.init(inst, def);
  ZodNumber2.init(inst, def);
});
function int(params) {
  return _int(ZodNumberFormat, params);
}
var ZodBoolean2 = /* @__PURE__ */ $constructor("ZodBoolean", (inst, def) => {
  $ZodBoolean.init(inst, def);
  ZodType2.init(inst, def);
});
function boolean2(params) {
  return _boolean(ZodBoolean2, params);
}
var ZodNull2 = /* @__PURE__ */ $constructor("ZodNull", (inst, def) => {
  $ZodNull.init(inst, def);
  ZodType2.init(inst, def);
});
function _null3(params) {
  return _null2(ZodNull2, params);
}
var ZodUnknown2 = /* @__PURE__ */ $constructor("ZodUnknown", (inst, def) => {
  $ZodUnknown.init(inst, def);
  ZodType2.init(inst, def);
});
function unknown() {
  return _unknown(ZodUnknown2);
}
var ZodNever2 = /* @__PURE__ */ $constructor("ZodNever", (inst, def) => {
  $ZodNever.init(inst, def);
  ZodType2.init(inst, def);
});
function never(params) {
  return _never(ZodNever2, params);
}
var ZodArray2 = /* @__PURE__ */ $constructor("ZodArray", (inst, def) => {
  $ZodArray.init(inst, def);
  ZodType2.init(inst, def);
  inst.element = def.element;
  inst.min = (minLength, params) => inst.check(_minLength(minLength, params));
  inst.nonempty = (params) => inst.check(_minLength(1, params));
  inst.max = (maxLength, params) => inst.check(_maxLength(maxLength, params));
  inst.length = (len, params) => inst.check(_length(len, params));
  inst.unwrap = () => inst.element;
});
function array(element, params) {
  return _array(ZodArray2, element, params);
}
var ZodObject2 = /* @__PURE__ */ $constructor("ZodObject", (inst, def) => {
  $ZodObject.init(inst, def);
  ZodType2.init(inst, def);
  exports_util.defineLazy(inst, "shape", () => def.shape);
  inst.keyof = () => _enum(Object.keys(inst._zod.def.shape));
  inst.catchall = (catchall) => inst.clone({ ...inst._zod.def, catchall });
  inst.passthrough = () => inst.clone({ ...inst._zod.def, catchall: unknown() });
  inst.loose = () => inst.clone({ ...inst._zod.def, catchall: unknown() });
  inst.strict = () => inst.clone({ ...inst._zod.def, catchall: never() });
  inst.strip = () => inst.clone({ ...inst._zod.def, catchall: undefined });
  inst.extend = (incoming) => {
    return exports_util.extend(inst, incoming);
  };
  inst.merge = (other) => exports_util.merge(inst, other);
  inst.pick = (mask) => exports_util.pick(inst, mask);
  inst.omit = (mask) => exports_util.omit(inst, mask);
  inst.partial = (...args) => exports_util.partial(ZodOptional2, inst, args[0]);
  inst.required = (...args) => exports_util.required(ZodNonOptional, inst, args[0]);
});
function object2(shape, params) {
  const def = {
    type: "object",
    get shape() {
      exports_util.assignProp(this, "shape", { ...shape });
      return this.shape;
    },
    ...exports_util.normalizeParams(params)
  };
  return new ZodObject2(def);
}
function looseObject(shape, params) {
  return new ZodObject2({
    type: "object",
    get shape() {
      exports_util.assignProp(this, "shape", { ...shape });
      return this.shape;
    },
    catchall: unknown(),
    ...exports_util.normalizeParams(params)
  });
}
var ZodUnion2 = /* @__PURE__ */ $constructor("ZodUnion", (inst, def) => {
  $ZodUnion.init(inst, def);
  ZodType2.init(inst, def);
  inst.options = def.options;
});
function union(options, params) {
  return new ZodUnion2({
    type: "union",
    options,
    ...exports_util.normalizeParams(params)
  });
}
var ZodDiscriminatedUnion2 = /* @__PURE__ */ $constructor("ZodDiscriminatedUnion", (inst, def) => {
  ZodUnion2.init(inst, def);
  $ZodDiscriminatedUnion.init(inst, def);
});
function discriminatedUnion(discriminator, options, params) {
  return new ZodDiscriminatedUnion2({
    type: "union",
    options,
    discriminator,
    ...exports_util.normalizeParams(params)
  });
}
var ZodIntersection2 = /* @__PURE__ */ $constructor("ZodIntersection", (inst, def) => {
  $ZodIntersection.init(inst, def);
  ZodType2.init(inst, def);
});
function intersection(left, right) {
  return new ZodIntersection2({
    type: "intersection",
    left,
    right
  });
}
var ZodRecord2 = /* @__PURE__ */ $constructor("ZodRecord", (inst, def) => {
  $ZodRecord.init(inst, def);
  ZodType2.init(inst, def);
  inst.keyType = def.keyType;
  inst.valueType = def.valueType;
});
function record(keyType, valueType, params) {
  return new ZodRecord2({
    type: "record",
    keyType,
    valueType,
    ...exports_util.normalizeParams(params)
  });
}
var ZodEnum2 = /* @__PURE__ */ $constructor("ZodEnum", (inst, def) => {
  $ZodEnum.init(inst, def);
  ZodType2.init(inst, def);
  inst.enum = def.entries;
  inst.options = Object.values(def.entries);
  const keys = new Set(Object.keys(def.entries));
  inst.extract = (values, params) => {
    const newEntries = {};
    for (const value of values) {
      if (keys.has(value)) {
        newEntries[value] = def.entries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum2({
      ...def,
      checks: [],
      ...exports_util.normalizeParams(params),
      entries: newEntries
    });
  };
  inst.exclude = (values, params) => {
    const newEntries = { ...def.entries };
    for (const value of values) {
      if (keys.has(value)) {
        delete newEntries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum2({
      ...def,
      checks: [],
      ...exports_util.normalizeParams(params),
      entries: newEntries
    });
  };
});
function _enum(values, params) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new ZodEnum2({
    type: "enum",
    entries,
    ...exports_util.normalizeParams(params)
  });
}
var ZodLiteral2 = /* @__PURE__ */ $constructor("ZodLiteral", (inst, def) => {
  $ZodLiteral.init(inst, def);
  ZodType2.init(inst, def);
  inst.values = new Set(def.values);
  Object.defineProperty(inst, "value", {
    get() {
      if (def.values.length > 1) {
        throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
      }
      return def.values[0];
    }
  });
});
function literal(value, params) {
  return new ZodLiteral2({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...exports_util.normalizeParams(params)
  });
}
var ZodTransform = /* @__PURE__ */ $constructor("ZodTransform", (inst, def) => {
  $ZodTransform.init(inst, def);
  ZodType2.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(exports_util.issue(issue2, payload.value, def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = inst);
        _issue.continue ?? (_issue.continue = true);
        payload.issues.push(exports_util.issue(_issue));
      }
    };
    const output = def.transform(payload.value, payload);
    if (output instanceof Promise) {
      return output.then((output2) => {
        payload.value = output2;
        return payload;
      });
    }
    payload.value = output;
    return payload;
  };
});
function transform(fn) {
  return new ZodTransform({
    type: "transform",
    transform: fn
  });
}
var ZodOptional2 = /* @__PURE__ */ $constructor("ZodOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  ZodType2.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
  return new ZodOptional2({
    type: "optional",
    innerType
  });
}
var ZodNullable2 = /* @__PURE__ */ $constructor("ZodNullable", (inst, def) => {
  $ZodNullable.init(inst, def);
  ZodType2.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
  return new ZodNullable2({
    type: "nullable",
    innerType
  });
}
var ZodDefault2 = /* @__PURE__ */ $constructor("ZodDefault", (inst, def) => {
  $ZodDefault.init(inst, def);
  ZodType2.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
  return new ZodDefault2({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : defaultValue;
    }
  });
}
var ZodPrefault = /* @__PURE__ */ $constructor("ZodPrefault", (inst, def) => {
  $ZodPrefault.init(inst, def);
  ZodType2.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
  return new ZodPrefault({
    type: "prefault",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : defaultValue;
    }
  });
}
var ZodNonOptional = /* @__PURE__ */ $constructor("ZodNonOptional", (inst, def) => {
  $ZodNonOptional.init(inst, def);
  ZodType2.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
  return new ZodNonOptional({
    type: "nonoptional",
    innerType,
    ...exports_util.normalizeParams(params)
  });
}
var ZodCatch2 = /* @__PURE__ */ $constructor("ZodCatch", (inst, def) => {
  $ZodCatch.init(inst, def);
  ZodType2.init(inst, def);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
  return new ZodCatch2({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
  });
}
var ZodPipe = /* @__PURE__ */ $constructor("ZodPipe", (inst, def) => {
  $ZodPipe.init(inst, def);
  ZodType2.init(inst, def);
  inst.in = def.in;
  inst.out = def.out;
});
function pipe(in_, out) {
  return new ZodPipe({
    type: "pipe",
    in: in_,
    out
  });
}
var ZodReadonly2 = /* @__PURE__ */ $constructor("ZodReadonly", (inst, def) => {
  $ZodReadonly.init(inst, def);
  ZodType2.init(inst, def);
});
function readonly(innerType) {
  return new ZodReadonly2({
    type: "readonly",
    innerType
  });
}
var ZodCustom = /* @__PURE__ */ $constructor("ZodCustom", (inst, def) => {
  $ZodCustom.init(inst, def);
  ZodType2.init(inst, def);
});
function check(fn) {
  const ch = new $ZodCheck({
    check: "custom"
  });
  ch._zod.check = fn;
  return ch;
}
function custom2(fn, _params) {
  return _custom(ZodCustom, fn ?? (() => true), _params);
}
function refine(fn, _params = {}) {
  return _refine(ZodCustom, fn, _params);
}
function superRefine(fn) {
  const ch = check((payload) => {
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(exports_util.issue(issue2, payload.value, ch._zod.def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = ch);
        _issue.continue ?? (_issue.continue = !ch._zod.def.abort);
        payload.issues.push(exports_util.issue(_issue));
      }
    };
    return fn(payload.value, payload);
  });
  return ch;
}
function preprocess(fn, schema) {
  return pipe(transform(fn), schema);
}
// node_modules/zod/v4/classic/external.js
config(en_default2());

// node_modules/@modelcontextprotocol/sdk/dist/esm/types.js
var LATEST_PROTOCOL_VERSION = "2025-11-25";
var SUPPORTED_PROTOCOL_VERSIONS = [LATEST_PROTOCOL_VERSION, "2025-06-18", "2025-03-26", "2024-11-05", "2024-10-07"];
var RELATED_TASK_META_KEY = "io.modelcontextprotocol/related-task";
var JSONRPC_VERSION = "2.0";
var AssertObjectSchema = custom2((v) => v !== null && (typeof v === "object" || typeof v === "function"));
var ProgressTokenSchema = union([string2(), number2().int()]);
var CursorSchema = string2();
var TaskCreationParamsSchema = looseObject({
  ttl: union([number2(), _null3()]).optional(),
  pollInterval: number2().optional()
});
var TaskMetadataSchema = object2({
  ttl: number2().optional()
});
var RelatedTaskMetadataSchema = object2({
  taskId: string2()
});
var RequestMetaSchema = looseObject({
  progressToken: ProgressTokenSchema.optional(),
  [RELATED_TASK_META_KEY]: RelatedTaskMetadataSchema.optional()
});
var BaseRequestParamsSchema = object2({
  _meta: RequestMetaSchema.optional()
});
var TaskAugmentedRequestParamsSchema = BaseRequestParamsSchema.extend({
  task: TaskMetadataSchema.optional()
});
var isTaskAugmentedRequestParams = (value) => TaskAugmentedRequestParamsSchema.safeParse(value).success;
var RequestSchema = object2({
  method: string2(),
  params: BaseRequestParamsSchema.loose().optional()
});
var NotificationsParamsSchema = object2({
  _meta: RequestMetaSchema.optional()
});
var NotificationSchema = object2({
  method: string2(),
  params: NotificationsParamsSchema.loose().optional()
});
var ResultSchema = looseObject({
  _meta: RequestMetaSchema.optional()
});
var RequestIdSchema = union([string2(), number2().int()]);
var JSONRPCRequestSchema = object2({
  jsonrpc: literal(JSONRPC_VERSION),
  id: RequestIdSchema,
  ...RequestSchema.shape
}).strict();
var isJSONRPCRequest = (value) => JSONRPCRequestSchema.safeParse(value).success;
var JSONRPCNotificationSchema = object2({
  jsonrpc: literal(JSONRPC_VERSION),
  ...NotificationSchema.shape
}).strict();
var isJSONRPCNotification = (value) => JSONRPCNotificationSchema.safeParse(value).success;
var JSONRPCResultResponseSchema = object2({
  jsonrpc: literal(JSONRPC_VERSION),
  id: RequestIdSchema,
  result: ResultSchema
}).strict();
var isJSONRPCResultResponse = (value) => JSONRPCResultResponseSchema.safeParse(value).success;
var ErrorCode;
(function(ErrorCode2) {
  ErrorCode2[ErrorCode2["ConnectionClosed"] = -32000] = "ConnectionClosed";
  ErrorCode2[ErrorCode2["RequestTimeout"] = -32001] = "RequestTimeout";
  ErrorCode2[ErrorCode2["ParseError"] = -32700] = "ParseError";
  ErrorCode2[ErrorCode2["InvalidRequest"] = -32600] = "InvalidRequest";
  ErrorCode2[ErrorCode2["MethodNotFound"] = -32601] = "MethodNotFound";
  ErrorCode2[ErrorCode2["InvalidParams"] = -32602] = "InvalidParams";
  ErrorCode2[ErrorCode2["InternalError"] = -32603] = "InternalError";
  ErrorCode2[ErrorCode2["UrlElicitationRequired"] = -32042] = "UrlElicitationRequired";
})(ErrorCode || (ErrorCode = {}));
var JSONRPCErrorResponseSchema = object2({
  jsonrpc: literal(JSONRPC_VERSION),
  id: RequestIdSchema.optional(),
  error: object2({
    code: number2().int(),
    message: string2(),
    data: unknown().optional()
  })
}).strict();
var isJSONRPCErrorResponse = (value) => JSONRPCErrorResponseSchema.safeParse(value).success;
var JSONRPCMessageSchema = union([
  JSONRPCRequestSchema,
  JSONRPCNotificationSchema,
  JSONRPCResultResponseSchema,
  JSONRPCErrorResponseSchema
]);
var JSONRPCResponseSchema = union([JSONRPCResultResponseSchema, JSONRPCErrorResponseSchema]);
var EmptyResultSchema = ResultSchema.strict();
var CancelledNotificationParamsSchema = NotificationsParamsSchema.extend({
  requestId: RequestIdSchema.optional(),
  reason: string2().optional()
});
var CancelledNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/cancelled"),
  params: CancelledNotificationParamsSchema
});
var IconSchema = object2({
  src: string2(),
  mimeType: string2().optional(),
  sizes: array(string2()).optional(),
  theme: _enum(["light", "dark"]).optional()
});
var IconsSchema = object2({
  icons: array(IconSchema).optional()
});
var BaseMetadataSchema = object2({
  name: string2(),
  title: string2().optional()
});
var ImplementationSchema = BaseMetadataSchema.extend({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  version: string2(),
  websiteUrl: string2().optional(),
  description: string2().optional()
});
var FormElicitationCapabilitySchema = intersection(object2({
  applyDefaults: boolean2().optional()
}), record(string2(), unknown()));
var ElicitationCapabilitySchema = preprocess((value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    if (Object.keys(value).length === 0) {
      return { form: {} };
    }
  }
  return value;
}, intersection(object2({
  form: FormElicitationCapabilitySchema.optional(),
  url: AssertObjectSchema.optional()
}), record(string2(), unknown()).optional()));
var ClientTasksCapabilitySchema = looseObject({
  list: AssertObjectSchema.optional(),
  cancel: AssertObjectSchema.optional(),
  requests: looseObject({
    sampling: looseObject({
      createMessage: AssertObjectSchema.optional()
    }).optional(),
    elicitation: looseObject({
      create: AssertObjectSchema.optional()
    }).optional()
  }).optional()
});
var ServerTasksCapabilitySchema = looseObject({
  list: AssertObjectSchema.optional(),
  cancel: AssertObjectSchema.optional(),
  requests: looseObject({
    tools: looseObject({
      call: AssertObjectSchema.optional()
    }).optional()
  }).optional()
});
var ClientCapabilitiesSchema = object2({
  experimental: record(string2(), AssertObjectSchema).optional(),
  sampling: object2({
    context: AssertObjectSchema.optional(),
    tools: AssertObjectSchema.optional()
  }).optional(),
  elicitation: ElicitationCapabilitySchema.optional(),
  roots: object2({
    listChanged: boolean2().optional()
  }).optional(),
  tasks: ClientTasksCapabilitySchema.optional()
});
var InitializeRequestParamsSchema = BaseRequestParamsSchema.extend({
  protocolVersion: string2(),
  capabilities: ClientCapabilitiesSchema,
  clientInfo: ImplementationSchema
});
var InitializeRequestSchema = RequestSchema.extend({
  method: literal("initialize"),
  params: InitializeRequestParamsSchema
});
var ServerCapabilitiesSchema = object2({
  experimental: record(string2(), AssertObjectSchema).optional(),
  logging: AssertObjectSchema.optional(),
  completions: AssertObjectSchema.optional(),
  prompts: object2({
    listChanged: boolean2().optional()
  }).optional(),
  resources: object2({
    subscribe: boolean2().optional(),
    listChanged: boolean2().optional()
  }).optional(),
  tools: object2({
    listChanged: boolean2().optional()
  }).optional(),
  tasks: ServerTasksCapabilitySchema.optional()
});
var InitializeResultSchema = ResultSchema.extend({
  protocolVersion: string2(),
  capabilities: ServerCapabilitiesSchema,
  serverInfo: ImplementationSchema,
  instructions: string2().optional()
});
var InitializedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/initialized"),
  params: NotificationsParamsSchema.optional()
});
var PingRequestSchema = RequestSchema.extend({
  method: literal("ping"),
  params: BaseRequestParamsSchema.optional()
});
var ProgressSchema = object2({
  progress: number2(),
  total: optional(number2()),
  message: optional(string2())
});
var ProgressNotificationParamsSchema = object2({
  ...NotificationsParamsSchema.shape,
  ...ProgressSchema.shape,
  progressToken: ProgressTokenSchema
});
var ProgressNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/progress"),
  params: ProgressNotificationParamsSchema
});
var PaginatedRequestParamsSchema = BaseRequestParamsSchema.extend({
  cursor: CursorSchema.optional()
});
var PaginatedRequestSchema = RequestSchema.extend({
  params: PaginatedRequestParamsSchema.optional()
});
var PaginatedResultSchema = ResultSchema.extend({
  nextCursor: CursorSchema.optional()
});
var TaskStatusSchema = _enum(["working", "input_required", "completed", "failed", "cancelled"]);
var TaskSchema = object2({
  taskId: string2(),
  status: TaskStatusSchema,
  ttl: union([number2(), _null3()]),
  createdAt: string2(),
  lastUpdatedAt: string2(),
  pollInterval: optional(number2()),
  statusMessage: optional(string2())
});
var CreateTaskResultSchema = ResultSchema.extend({
  task: TaskSchema
});
var TaskStatusNotificationParamsSchema = NotificationsParamsSchema.merge(TaskSchema);
var TaskStatusNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/tasks/status"),
  params: TaskStatusNotificationParamsSchema
});
var GetTaskRequestSchema = RequestSchema.extend({
  method: literal("tasks/get"),
  params: BaseRequestParamsSchema.extend({
    taskId: string2()
  })
});
var GetTaskResultSchema = ResultSchema.merge(TaskSchema);
var GetTaskPayloadRequestSchema = RequestSchema.extend({
  method: literal("tasks/result"),
  params: BaseRequestParamsSchema.extend({
    taskId: string2()
  })
});
var GetTaskPayloadResultSchema = ResultSchema.loose();
var ListTasksRequestSchema = PaginatedRequestSchema.extend({
  method: literal("tasks/list")
});
var ListTasksResultSchema = PaginatedResultSchema.extend({
  tasks: array(TaskSchema)
});
var CancelTaskRequestSchema = RequestSchema.extend({
  method: literal("tasks/cancel"),
  params: BaseRequestParamsSchema.extend({
    taskId: string2()
  })
});
var CancelTaskResultSchema = ResultSchema.merge(TaskSchema);
var ResourceContentsSchema = object2({
  uri: string2(),
  mimeType: optional(string2()),
  _meta: record(string2(), unknown()).optional()
});
var TextResourceContentsSchema = ResourceContentsSchema.extend({
  text: string2()
});
var Base64Schema = string2().refine((val) => {
  try {
    atob(val);
    return true;
  } catch {
    return false;
  }
}, { message: "Invalid Base64 string" });
var BlobResourceContentsSchema = ResourceContentsSchema.extend({
  blob: Base64Schema
});
var RoleSchema = _enum(["user", "assistant"]);
var AnnotationsSchema = object2({
  audience: array(RoleSchema).optional(),
  priority: number2().min(0).max(1).optional(),
  lastModified: exports_iso2.datetime({ offset: true }).optional()
});
var ResourceSchema = object2({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  uri: string2(),
  description: optional(string2()),
  mimeType: optional(string2()),
  annotations: AnnotationsSchema.optional(),
  _meta: optional(looseObject({}))
});
var ResourceTemplateSchema = object2({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  uriTemplate: string2(),
  description: optional(string2()),
  mimeType: optional(string2()),
  annotations: AnnotationsSchema.optional(),
  _meta: optional(looseObject({}))
});
var ListResourcesRequestSchema = PaginatedRequestSchema.extend({
  method: literal("resources/list")
});
var ListResourcesResultSchema = PaginatedResultSchema.extend({
  resources: array(ResourceSchema)
});
var ListResourceTemplatesRequestSchema = PaginatedRequestSchema.extend({
  method: literal("resources/templates/list")
});
var ListResourceTemplatesResultSchema = PaginatedResultSchema.extend({
  resourceTemplates: array(ResourceTemplateSchema)
});
var ResourceRequestParamsSchema = BaseRequestParamsSchema.extend({
  uri: string2()
});
var ReadResourceRequestParamsSchema = ResourceRequestParamsSchema;
var ReadResourceRequestSchema = RequestSchema.extend({
  method: literal("resources/read"),
  params: ReadResourceRequestParamsSchema
});
var ReadResourceResultSchema = ResultSchema.extend({
  contents: array(union([TextResourceContentsSchema, BlobResourceContentsSchema]))
});
var ResourceListChangedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/resources/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var SubscribeRequestParamsSchema = ResourceRequestParamsSchema;
var SubscribeRequestSchema = RequestSchema.extend({
  method: literal("resources/subscribe"),
  params: SubscribeRequestParamsSchema
});
var UnsubscribeRequestParamsSchema = ResourceRequestParamsSchema;
var UnsubscribeRequestSchema = RequestSchema.extend({
  method: literal("resources/unsubscribe"),
  params: UnsubscribeRequestParamsSchema
});
var ResourceUpdatedNotificationParamsSchema = NotificationsParamsSchema.extend({
  uri: string2()
});
var ResourceUpdatedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/resources/updated"),
  params: ResourceUpdatedNotificationParamsSchema
});
var PromptArgumentSchema = object2({
  name: string2(),
  description: optional(string2()),
  required: optional(boolean2())
});
var PromptSchema = object2({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  description: optional(string2()),
  arguments: optional(array(PromptArgumentSchema)),
  _meta: optional(looseObject({}))
});
var ListPromptsRequestSchema = PaginatedRequestSchema.extend({
  method: literal("prompts/list")
});
var ListPromptsResultSchema = PaginatedResultSchema.extend({
  prompts: array(PromptSchema)
});
var GetPromptRequestParamsSchema = BaseRequestParamsSchema.extend({
  name: string2(),
  arguments: record(string2(), string2()).optional()
});
var GetPromptRequestSchema = RequestSchema.extend({
  method: literal("prompts/get"),
  params: GetPromptRequestParamsSchema
});
var TextContentSchema = object2({
  type: literal("text"),
  text: string2(),
  annotations: AnnotationsSchema.optional(),
  _meta: record(string2(), unknown()).optional()
});
var ImageContentSchema = object2({
  type: literal("image"),
  data: Base64Schema,
  mimeType: string2(),
  annotations: AnnotationsSchema.optional(),
  _meta: record(string2(), unknown()).optional()
});
var AudioContentSchema = object2({
  type: literal("audio"),
  data: Base64Schema,
  mimeType: string2(),
  annotations: AnnotationsSchema.optional(),
  _meta: record(string2(), unknown()).optional()
});
var ToolUseContentSchema = object2({
  type: literal("tool_use"),
  name: string2(),
  id: string2(),
  input: record(string2(), unknown()),
  _meta: record(string2(), unknown()).optional()
});
var EmbeddedResourceSchema = object2({
  type: literal("resource"),
  resource: union([TextResourceContentsSchema, BlobResourceContentsSchema]),
  annotations: AnnotationsSchema.optional(),
  _meta: record(string2(), unknown()).optional()
});
var ResourceLinkSchema = ResourceSchema.extend({
  type: literal("resource_link")
});
var ContentBlockSchema = union([
  TextContentSchema,
  ImageContentSchema,
  AudioContentSchema,
  ResourceLinkSchema,
  EmbeddedResourceSchema
]);
var PromptMessageSchema = object2({
  role: RoleSchema,
  content: ContentBlockSchema
});
var GetPromptResultSchema = ResultSchema.extend({
  description: string2().optional(),
  messages: array(PromptMessageSchema)
});
var PromptListChangedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/prompts/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var ToolAnnotationsSchema = object2({
  title: string2().optional(),
  readOnlyHint: boolean2().optional(),
  destructiveHint: boolean2().optional(),
  idempotentHint: boolean2().optional(),
  openWorldHint: boolean2().optional()
});
var ToolExecutionSchema = object2({
  taskSupport: _enum(["required", "optional", "forbidden"]).optional()
});
var ToolSchema = object2({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  description: string2().optional(),
  inputSchema: object2({
    type: literal("object"),
    properties: record(string2(), AssertObjectSchema).optional(),
    required: array(string2()).optional()
  }).catchall(unknown()),
  outputSchema: object2({
    type: literal("object"),
    properties: record(string2(), AssertObjectSchema).optional(),
    required: array(string2()).optional()
  }).catchall(unknown()).optional(),
  annotations: ToolAnnotationsSchema.optional(),
  execution: ToolExecutionSchema.optional(),
  _meta: record(string2(), unknown()).optional()
});
var ListToolsRequestSchema = PaginatedRequestSchema.extend({
  method: literal("tools/list")
});
var ListToolsResultSchema = PaginatedResultSchema.extend({
  tools: array(ToolSchema)
});
var CallToolResultSchema = ResultSchema.extend({
  content: array(ContentBlockSchema).default([]),
  structuredContent: record(string2(), unknown()).optional(),
  isError: boolean2().optional()
});
var CompatibilityCallToolResultSchema = CallToolResultSchema.or(ResultSchema.extend({
  toolResult: unknown()
}));
var CallToolRequestParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  name: string2(),
  arguments: record(string2(), unknown()).optional()
});
var CallToolRequestSchema = RequestSchema.extend({
  method: literal("tools/call"),
  params: CallToolRequestParamsSchema
});
var ToolListChangedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/tools/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var ListChangedOptionsBaseSchema = object2({
  autoRefresh: boolean2().default(true),
  debounceMs: number2().int().nonnegative().default(300)
});
var LoggingLevelSchema = _enum(["debug", "info", "notice", "warning", "error", "critical", "alert", "emergency"]);
var SetLevelRequestParamsSchema = BaseRequestParamsSchema.extend({
  level: LoggingLevelSchema
});
var SetLevelRequestSchema = RequestSchema.extend({
  method: literal("logging/setLevel"),
  params: SetLevelRequestParamsSchema
});
var LoggingMessageNotificationParamsSchema = NotificationsParamsSchema.extend({
  level: LoggingLevelSchema,
  logger: string2().optional(),
  data: unknown()
});
var LoggingMessageNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/message"),
  params: LoggingMessageNotificationParamsSchema
});
var ModelHintSchema = object2({
  name: string2().optional()
});
var ModelPreferencesSchema = object2({
  hints: array(ModelHintSchema).optional(),
  costPriority: number2().min(0).max(1).optional(),
  speedPriority: number2().min(0).max(1).optional(),
  intelligencePriority: number2().min(0).max(1).optional()
});
var ToolChoiceSchema = object2({
  mode: _enum(["auto", "required", "none"]).optional()
});
var ToolResultContentSchema = object2({
  type: literal("tool_result"),
  toolUseId: string2().describe("The unique identifier for the corresponding tool call."),
  content: array(ContentBlockSchema).default([]),
  structuredContent: object2({}).loose().optional(),
  isError: boolean2().optional(),
  _meta: record(string2(), unknown()).optional()
});
var SamplingContentSchema = discriminatedUnion("type", [TextContentSchema, ImageContentSchema, AudioContentSchema]);
var SamplingMessageContentBlockSchema = discriminatedUnion("type", [
  TextContentSchema,
  ImageContentSchema,
  AudioContentSchema,
  ToolUseContentSchema,
  ToolResultContentSchema
]);
var SamplingMessageSchema = object2({
  role: RoleSchema,
  content: union([SamplingMessageContentBlockSchema, array(SamplingMessageContentBlockSchema)]),
  _meta: record(string2(), unknown()).optional()
});
var CreateMessageRequestParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  messages: array(SamplingMessageSchema),
  modelPreferences: ModelPreferencesSchema.optional(),
  systemPrompt: string2().optional(),
  includeContext: _enum(["none", "thisServer", "allServers"]).optional(),
  temperature: number2().optional(),
  maxTokens: number2().int(),
  stopSequences: array(string2()).optional(),
  metadata: AssertObjectSchema.optional(),
  tools: array(ToolSchema).optional(),
  toolChoice: ToolChoiceSchema.optional()
});
var CreateMessageRequestSchema = RequestSchema.extend({
  method: literal("sampling/createMessage"),
  params: CreateMessageRequestParamsSchema
});
var CreateMessageResultSchema = ResultSchema.extend({
  model: string2(),
  stopReason: optional(_enum(["endTurn", "stopSequence", "maxTokens"]).or(string2())),
  role: RoleSchema,
  content: SamplingContentSchema
});
var CreateMessageResultWithToolsSchema = ResultSchema.extend({
  model: string2(),
  stopReason: optional(_enum(["endTurn", "stopSequence", "maxTokens", "toolUse"]).or(string2())),
  role: RoleSchema,
  content: union([SamplingMessageContentBlockSchema, array(SamplingMessageContentBlockSchema)])
});
var BooleanSchemaSchema = object2({
  type: literal("boolean"),
  title: string2().optional(),
  description: string2().optional(),
  default: boolean2().optional()
});
var StringSchemaSchema = object2({
  type: literal("string"),
  title: string2().optional(),
  description: string2().optional(),
  minLength: number2().optional(),
  maxLength: number2().optional(),
  format: _enum(["email", "uri", "date", "date-time"]).optional(),
  default: string2().optional()
});
var NumberSchemaSchema = object2({
  type: _enum(["number", "integer"]),
  title: string2().optional(),
  description: string2().optional(),
  minimum: number2().optional(),
  maximum: number2().optional(),
  default: number2().optional()
});
var UntitledSingleSelectEnumSchemaSchema = object2({
  type: literal("string"),
  title: string2().optional(),
  description: string2().optional(),
  enum: array(string2()),
  default: string2().optional()
});
var TitledSingleSelectEnumSchemaSchema = object2({
  type: literal("string"),
  title: string2().optional(),
  description: string2().optional(),
  oneOf: array(object2({
    const: string2(),
    title: string2()
  })),
  default: string2().optional()
});
var LegacyTitledEnumSchemaSchema = object2({
  type: literal("string"),
  title: string2().optional(),
  description: string2().optional(),
  enum: array(string2()),
  enumNames: array(string2()).optional(),
  default: string2().optional()
});
var SingleSelectEnumSchemaSchema = union([UntitledSingleSelectEnumSchemaSchema, TitledSingleSelectEnumSchemaSchema]);
var UntitledMultiSelectEnumSchemaSchema = object2({
  type: literal("array"),
  title: string2().optional(),
  description: string2().optional(),
  minItems: number2().optional(),
  maxItems: number2().optional(),
  items: object2({
    type: literal("string"),
    enum: array(string2())
  }),
  default: array(string2()).optional()
});
var TitledMultiSelectEnumSchemaSchema = object2({
  type: literal("array"),
  title: string2().optional(),
  description: string2().optional(),
  minItems: number2().optional(),
  maxItems: number2().optional(),
  items: object2({
    anyOf: array(object2({
      const: string2(),
      title: string2()
    }))
  }),
  default: array(string2()).optional()
});
var MultiSelectEnumSchemaSchema = union([UntitledMultiSelectEnumSchemaSchema, TitledMultiSelectEnumSchemaSchema]);
var EnumSchemaSchema = union([LegacyTitledEnumSchemaSchema, SingleSelectEnumSchemaSchema, MultiSelectEnumSchemaSchema]);
var PrimitiveSchemaDefinitionSchema = union([EnumSchemaSchema, BooleanSchemaSchema, StringSchemaSchema, NumberSchemaSchema]);
var ElicitRequestFormParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  mode: literal("form").optional(),
  message: string2(),
  requestedSchema: object2({
    type: literal("object"),
    properties: record(string2(), PrimitiveSchemaDefinitionSchema),
    required: array(string2()).optional()
  })
});
var ElicitRequestURLParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  mode: literal("url"),
  message: string2(),
  elicitationId: string2(),
  url: string2().url()
});
var ElicitRequestParamsSchema = union([ElicitRequestFormParamsSchema, ElicitRequestURLParamsSchema]);
var ElicitRequestSchema = RequestSchema.extend({
  method: literal("elicitation/create"),
  params: ElicitRequestParamsSchema
});
var ElicitationCompleteNotificationParamsSchema = NotificationsParamsSchema.extend({
  elicitationId: string2()
});
var ElicitationCompleteNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/elicitation/complete"),
  params: ElicitationCompleteNotificationParamsSchema
});
var ElicitResultSchema = ResultSchema.extend({
  action: _enum(["accept", "decline", "cancel"]),
  content: preprocess((val) => val === null ? undefined : val, record(string2(), union([string2(), number2(), boolean2(), array(string2())])).optional())
});
var ResourceTemplateReferenceSchema = object2({
  type: literal("ref/resource"),
  uri: string2()
});
var PromptReferenceSchema = object2({
  type: literal("ref/prompt"),
  name: string2()
});
var CompleteRequestParamsSchema = BaseRequestParamsSchema.extend({
  ref: union([PromptReferenceSchema, ResourceTemplateReferenceSchema]),
  argument: object2({
    name: string2(),
    value: string2()
  }),
  context: object2({
    arguments: record(string2(), string2()).optional()
  }).optional()
});
var CompleteRequestSchema = RequestSchema.extend({
  method: literal("completion/complete"),
  params: CompleteRequestParamsSchema
});
function assertCompleteRequestPrompt(request) {
  if (request.params.ref.type !== "ref/prompt") {
    throw new TypeError(`Expected CompleteRequestPrompt, but got ${request.params.ref.type}`);
  }
}
function assertCompleteRequestResourceTemplate(request) {
  if (request.params.ref.type !== "ref/resource") {
    throw new TypeError(`Expected CompleteRequestResourceTemplate, but got ${request.params.ref.type}`);
  }
}
var CompleteResultSchema = ResultSchema.extend({
  completion: looseObject({
    values: array(string2()).max(100),
    total: optional(number2().int()),
    hasMore: optional(boolean2())
  })
});
var RootSchema = object2({
  uri: string2().startsWith("file://"),
  name: string2().optional(),
  _meta: record(string2(), unknown()).optional()
});
var ListRootsRequestSchema = RequestSchema.extend({
  method: literal("roots/list"),
  params: BaseRequestParamsSchema.optional()
});
var ListRootsResultSchema = ResultSchema.extend({
  roots: array(RootSchema)
});
var RootsListChangedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/roots/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var ClientRequestSchema = union([
  PingRequestSchema,
  InitializeRequestSchema,
  CompleteRequestSchema,
  SetLevelRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
  SubscribeRequestSchema,
  UnsubscribeRequestSchema,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  GetTaskRequestSchema,
  GetTaskPayloadRequestSchema,
  ListTasksRequestSchema,
  CancelTaskRequestSchema
]);
var ClientNotificationSchema = union([
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  InitializedNotificationSchema,
  RootsListChangedNotificationSchema,
  TaskStatusNotificationSchema
]);
var ClientResultSchema = union([
  EmptyResultSchema,
  CreateMessageResultSchema,
  CreateMessageResultWithToolsSchema,
  ElicitResultSchema,
  ListRootsResultSchema,
  GetTaskResultSchema,
  ListTasksResultSchema,
  CreateTaskResultSchema
]);
var ServerRequestSchema = union([
  PingRequestSchema,
  CreateMessageRequestSchema,
  ElicitRequestSchema,
  ListRootsRequestSchema,
  GetTaskRequestSchema,
  GetTaskPayloadRequestSchema,
  ListTasksRequestSchema,
  CancelTaskRequestSchema
]);
var ServerNotificationSchema = union([
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  LoggingMessageNotificationSchema,
  ResourceUpdatedNotificationSchema,
  ResourceListChangedNotificationSchema,
  ToolListChangedNotificationSchema,
  PromptListChangedNotificationSchema,
  TaskStatusNotificationSchema,
  ElicitationCompleteNotificationSchema
]);
var ServerResultSchema = union([
  EmptyResultSchema,
  InitializeResultSchema,
  CompleteResultSchema,
  GetPromptResultSchema,
  ListPromptsResultSchema,
  ListResourcesResultSchema,
  ListResourceTemplatesResultSchema,
  ReadResourceResultSchema,
  CallToolResultSchema,
  ListToolsResultSchema,
  GetTaskResultSchema,
  ListTasksResultSchema,
  CreateTaskResultSchema
]);

class McpError extends Error {
  constructor(code, message, data) {
    super(`MCP error ${code}: ${message}`);
    this.code = code;
    this.data = data;
    this.name = "McpError";
  }
  static fromError(code, message, data) {
    if (code === ErrorCode.UrlElicitationRequired && data) {
      const errorData = data;
      if (errorData.elicitations) {
        return new UrlElicitationRequiredError(errorData.elicitations, message);
      }
    }
    return new McpError(code, message, data);
  }
}

class UrlElicitationRequiredError extends McpError {
  constructor(elicitations, message = `URL elicitation${elicitations.length > 1 ? "s" : ""} required`) {
    super(ErrorCode.UrlElicitationRequired, message, {
      elicitations
    });
  }
  get elicitations() {
    return this.data?.elicitations ?? [];
  }
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/experimental/tasks/interfaces.js
function isTerminal(status) {
  return status === "completed" || status === "failed" || status === "cancelled";
}

// node_modules/zod-to-json-schema/dist/esm/Options.js
var ignoreOverride = Symbol("Let zodToJsonSchema decide on which parser to use");
var defaultOptions = {
  name: undefined,
  $refStrategy: "root",
  basePath: ["#"],
  effectStrategy: "input",
  pipeStrategy: "all",
  dateStrategy: "format:date-time",
  mapStrategy: "entries",
  removeAdditionalStrategy: "passthrough",
  allowedAdditionalProperties: true,
  rejectedAdditionalProperties: false,
  definitionPath: "definitions",
  target: "jsonSchema7",
  strictUnions: false,
  definitions: {},
  errorMessages: false,
  markdownDescription: false,
  patternStrategy: "escape",
  applyRegexFlags: false,
  emailStrategy: "format:email",
  base64Strategy: "contentEncoding:base64",
  nameStrategy: "ref",
  openAiAnyTypeName: "OpenAiAnyType"
};
var getDefaultOptions = (options) => typeof options === "string" ? {
  ...defaultOptions,
  name: options
} : {
  ...defaultOptions,
  ...options
};
// node_modules/zod-to-json-schema/dist/esm/Refs.js
var getRefs = (options) => {
  const _options = getDefaultOptions(options);
  const currentPath = _options.name !== undefined ? [..._options.basePath, _options.definitionPath, _options.name] : _options.basePath;
  return {
    ..._options,
    flags: { hasReferencedOpenAiAnyType: false },
    currentPath,
    propertyPath: undefined,
    seen: new Map(Object.entries(_options.definitions).map(([name, def]) => [
      def._def,
      {
        def: def._def,
        path: [..._options.basePath, _options.definitionPath, name],
        jsonSchema: undefined
      }
    ]))
  };
};
// node_modules/zod-to-json-schema/dist/esm/errorMessages.js
function addErrorMessage(res, key, errorMessage, refs) {
  if (!refs?.errorMessages)
    return;
  if (errorMessage) {
    res.errorMessage = {
      ...res.errorMessage,
      [key]: errorMessage
    };
  }
}
function setResponseValueAndErrors(res, key, value, errorMessage, refs) {
  res[key] = value;
  addErrorMessage(res, key, errorMessage, refs);
}
// node_modules/zod-to-json-schema/dist/esm/getRelativePath.js
var getRelativePath = (pathA, pathB) => {
  let i = 0;
  for (;i < pathA.length && i < pathB.length; i++) {
    if (pathA[i] !== pathB[i])
      break;
  }
  return [(pathA.length - i).toString(), ...pathB.slice(i)].join("/");
};
// node_modules/zod-to-json-schema/dist/esm/parsers/any.js
function parseAnyDef(refs) {
  if (refs.target !== "openAi") {
    return {};
  }
  const anyDefinitionPath = [
    ...refs.basePath,
    refs.definitionPath,
    refs.openAiAnyTypeName
  ];
  refs.flags.hasReferencedOpenAiAnyType = true;
  return {
    $ref: refs.$refStrategy === "relative" ? getRelativePath(anyDefinitionPath, refs.currentPath) : anyDefinitionPath.join("/")
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/array.js
function parseArrayDef(def, refs) {
  const res = {
    type: "array"
  };
  if (def.type?._def && def.type?._def?.typeName !== ZodFirstPartyTypeKind.ZodAny) {
    res.items = parseDef(def.type._def, {
      ...refs,
      currentPath: [...refs.currentPath, "items"]
    });
  }
  if (def.minLength) {
    setResponseValueAndErrors(res, "minItems", def.minLength.value, def.minLength.message, refs);
  }
  if (def.maxLength) {
    setResponseValueAndErrors(res, "maxItems", def.maxLength.value, def.maxLength.message, refs);
  }
  if (def.exactLength) {
    setResponseValueAndErrors(res, "minItems", def.exactLength.value, def.exactLength.message, refs);
    setResponseValueAndErrors(res, "maxItems", def.exactLength.value, def.exactLength.message, refs);
  }
  return res;
}

// node_modules/zod-to-json-schema/dist/esm/parsers/bigint.js
function parseBigintDef(def, refs) {
  const res = {
    type: "integer",
    format: "int64"
  };
  if (!def.checks)
    return res;
  for (const check2 of def.checks) {
    switch (check2.kind) {
      case "min":
        if (refs.target === "jsonSchema7") {
          if (check2.inclusive) {
            setResponseValueAndErrors(res, "minimum", check2.value, check2.message, refs);
          } else {
            setResponseValueAndErrors(res, "exclusiveMinimum", check2.value, check2.message, refs);
          }
        } else {
          if (!check2.inclusive) {
            res.exclusiveMinimum = true;
          }
          setResponseValueAndErrors(res, "minimum", check2.value, check2.message, refs);
        }
        break;
      case "max":
        if (refs.target === "jsonSchema7") {
          if (check2.inclusive) {
            setResponseValueAndErrors(res, "maximum", check2.value, check2.message, refs);
          } else {
            setResponseValueAndErrors(res, "exclusiveMaximum", check2.value, check2.message, refs);
          }
        } else {
          if (!check2.inclusive) {
            res.exclusiveMaximum = true;
          }
          setResponseValueAndErrors(res, "maximum", check2.value, check2.message, refs);
        }
        break;
      case "multipleOf":
        setResponseValueAndErrors(res, "multipleOf", check2.value, check2.message, refs);
        break;
    }
  }
  return res;
}

// node_modules/zod-to-json-schema/dist/esm/parsers/boolean.js
function parseBooleanDef() {
  return {
    type: "boolean"
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/branded.js
function parseBrandedDef(_def, refs) {
  return parseDef(_def.type._def, refs);
}

// node_modules/zod-to-json-schema/dist/esm/parsers/catch.js
var parseCatchDef = (def, refs) => {
  return parseDef(def.innerType._def, refs);
};

// node_modules/zod-to-json-schema/dist/esm/parsers/date.js
function parseDateDef(def, refs, overrideDateStrategy) {
  const strategy = overrideDateStrategy ?? refs.dateStrategy;
  if (Array.isArray(strategy)) {
    return {
      anyOf: strategy.map((item, i) => parseDateDef(def, refs, item))
    };
  }
  switch (strategy) {
    case "string":
    case "format:date-time":
      return {
        type: "string",
        format: "date-time"
      };
    case "format:date":
      return {
        type: "string",
        format: "date"
      };
    case "integer":
      return integerDateParser(def, refs);
  }
}
var integerDateParser = (def, refs) => {
  const res = {
    type: "integer",
    format: "unix-time"
  };
  if (refs.target === "openApi3") {
    return res;
  }
  for (const check2 of def.checks) {
    switch (check2.kind) {
      case "min":
        setResponseValueAndErrors(res, "minimum", check2.value, check2.message, refs);
        break;
      case "max":
        setResponseValueAndErrors(res, "maximum", check2.value, check2.message, refs);
        break;
    }
  }
  return res;
};

// node_modules/zod-to-json-schema/dist/esm/parsers/default.js
function parseDefaultDef(_def, refs) {
  return {
    ...parseDef(_def.innerType._def, refs),
    default: _def.defaultValue()
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/effects.js
function parseEffectsDef(_def, refs) {
  return refs.effectStrategy === "input" ? parseDef(_def.schema._def, refs) : parseAnyDef(refs);
}

// node_modules/zod-to-json-schema/dist/esm/parsers/enum.js
function parseEnumDef(def) {
  return {
    type: "string",
    enum: Array.from(def.values)
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/intersection.js
var isJsonSchema7AllOfType = (type) => {
  if ("type" in type && type.type === "string")
    return false;
  return "allOf" in type;
};
function parseIntersectionDef(def, refs) {
  const allOf = [
    parseDef(def.left._def, {
      ...refs,
      currentPath: [...refs.currentPath, "allOf", "0"]
    }),
    parseDef(def.right._def, {
      ...refs,
      currentPath: [...refs.currentPath, "allOf", "1"]
    })
  ].filter((x) => !!x);
  let unevaluatedProperties = refs.target === "jsonSchema2019-09" ? { unevaluatedProperties: false } : undefined;
  const mergedAllOf = [];
  allOf.forEach((schema) => {
    if (isJsonSchema7AllOfType(schema)) {
      mergedAllOf.push(...schema.allOf);
      if (schema.unevaluatedProperties === undefined) {
        unevaluatedProperties = undefined;
      }
    } else {
      let nestedSchema = schema;
      if ("additionalProperties" in schema && schema.additionalProperties === false) {
        const { additionalProperties, ...rest } = schema;
        nestedSchema = rest;
      } else {
        unevaluatedProperties = undefined;
      }
      mergedAllOf.push(nestedSchema);
    }
  });
  return mergedAllOf.length ? {
    allOf: mergedAllOf,
    ...unevaluatedProperties
  } : undefined;
}

// node_modules/zod-to-json-schema/dist/esm/parsers/literal.js
function parseLiteralDef(def, refs) {
  const parsedType2 = typeof def.value;
  if (parsedType2 !== "bigint" && parsedType2 !== "number" && parsedType2 !== "boolean" && parsedType2 !== "string") {
    return {
      type: Array.isArray(def.value) ? "array" : "object"
    };
  }
  if (refs.target === "openApi3") {
    return {
      type: parsedType2 === "bigint" ? "integer" : parsedType2,
      enum: [def.value]
    };
  }
  return {
    type: parsedType2 === "bigint" ? "integer" : parsedType2,
    const: def.value
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/string.js
var emojiRegex2 = undefined;
var zodPatterns = {
  cuid: /^[cC][^\s-]{8,}$/,
  cuid2: /^[0-9a-z]+$/,
  ulid: /^[0-9A-HJKMNP-TV-Z]{26}$/,
  email: /^(?!\.)(?!.*\.\.)([a-zA-Z0-9_'+\-\.]*)[a-zA-Z0-9_+-]@([a-zA-Z0-9][a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,}$/,
  emoji: () => {
    if (emojiRegex2 === undefined) {
      emojiRegex2 = RegExp("^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$", "u");
    }
    return emojiRegex2;
  },
  uuid: /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/,
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
  ipv4Cidr: /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/,
  ipv6: /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/,
  ipv6Cidr: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
  base64: /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/,
  base64url: /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/,
  nanoid: /^[a-zA-Z0-9_-]{21}$/,
  jwt: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/
};
function parseStringDef(def, refs) {
  const res = {
    type: "string"
  };
  if (def.checks) {
    for (const check2 of def.checks) {
      switch (check2.kind) {
        case "min":
          setResponseValueAndErrors(res, "minLength", typeof res.minLength === "number" ? Math.max(res.minLength, check2.value) : check2.value, check2.message, refs);
          break;
        case "max":
          setResponseValueAndErrors(res, "maxLength", typeof res.maxLength === "number" ? Math.min(res.maxLength, check2.value) : check2.value, check2.message, refs);
          break;
        case "email":
          switch (refs.emailStrategy) {
            case "format:email":
              addFormat(res, "email", check2.message, refs);
              break;
            case "format:idn-email":
              addFormat(res, "idn-email", check2.message, refs);
              break;
            case "pattern:zod":
              addPattern(res, zodPatterns.email, check2.message, refs);
              break;
          }
          break;
        case "url":
          addFormat(res, "uri", check2.message, refs);
          break;
        case "uuid":
          addFormat(res, "uuid", check2.message, refs);
          break;
        case "regex":
          addPattern(res, check2.regex, check2.message, refs);
          break;
        case "cuid":
          addPattern(res, zodPatterns.cuid, check2.message, refs);
          break;
        case "cuid2":
          addPattern(res, zodPatterns.cuid2, check2.message, refs);
          break;
        case "startsWith":
          addPattern(res, RegExp(`^${escapeLiteralCheckValue(check2.value, refs)}`), check2.message, refs);
          break;
        case "endsWith":
          addPattern(res, RegExp(`${escapeLiteralCheckValue(check2.value, refs)}$`), check2.message, refs);
          break;
        case "datetime":
          addFormat(res, "date-time", check2.message, refs);
          break;
        case "date":
          addFormat(res, "date", check2.message, refs);
          break;
        case "time":
          addFormat(res, "time", check2.message, refs);
          break;
        case "duration":
          addFormat(res, "duration", check2.message, refs);
          break;
        case "length":
          setResponseValueAndErrors(res, "minLength", typeof res.minLength === "number" ? Math.max(res.minLength, check2.value) : check2.value, check2.message, refs);
          setResponseValueAndErrors(res, "maxLength", typeof res.maxLength === "number" ? Math.min(res.maxLength, check2.value) : check2.value, check2.message, refs);
          break;
        case "includes": {
          addPattern(res, RegExp(escapeLiteralCheckValue(check2.value, refs)), check2.message, refs);
          break;
        }
        case "ip": {
          if (check2.version !== "v6") {
            addFormat(res, "ipv4", check2.message, refs);
          }
          if (check2.version !== "v4") {
            addFormat(res, "ipv6", check2.message, refs);
          }
          break;
        }
        case "base64url":
          addPattern(res, zodPatterns.base64url, check2.message, refs);
          break;
        case "jwt":
          addPattern(res, zodPatterns.jwt, check2.message, refs);
          break;
        case "cidr": {
          if (check2.version !== "v6") {
            addPattern(res, zodPatterns.ipv4Cidr, check2.message, refs);
          }
          if (check2.version !== "v4") {
            addPattern(res, zodPatterns.ipv6Cidr, check2.message, refs);
          }
          break;
        }
        case "emoji":
          addPattern(res, zodPatterns.emoji(), check2.message, refs);
          break;
        case "ulid": {
          addPattern(res, zodPatterns.ulid, check2.message, refs);
          break;
        }
        case "base64": {
          switch (refs.base64Strategy) {
            case "format:binary": {
              addFormat(res, "binary", check2.message, refs);
              break;
            }
            case "contentEncoding:base64": {
              setResponseValueAndErrors(res, "contentEncoding", "base64", check2.message, refs);
              break;
            }
            case "pattern:zod": {
              addPattern(res, zodPatterns.base64, check2.message, refs);
              break;
            }
          }
          break;
        }
        case "nanoid": {
          addPattern(res, zodPatterns.nanoid, check2.message, refs);
        }
        case "toLowerCase":
        case "toUpperCase":
        case "trim":
          break;
        default:
          ((_) => {})(check2);
      }
    }
  }
  return res;
}
function escapeLiteralCheckValue(literal2, refs) {
  return refs.patternStrategy === "escape" ? escapeNonAlphaNumeric(literal2) : literal2;
}
var ALPHA_NUMERIC = new Set("ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789");
function escapeNonAlphaNumeric(source) {
  let result = "";
  for (let i = 0;i < source.length; i++) {
    if (!ALPHA_NUMERIC.has(source[i])) {
      result += "\\";
    }
    result += source[i];
  }
  return result;
}
function addFormat(schema, value, message, refs) {
  if (schema.format || schema.anyOf?.some((x) => x.format)) {
    if (!schema.anyOf) {
      schema.anyOf = [];
    }
    if (schema.format) {
      schema.anyOf.push({
        format: schema.format,
        ...schema.errorMessage && refs.errorMessages && {
          errorMessage: { format: schema.errorMessage.format }
        }
      });
      delete schema.format;
      if (schema.errorMessage) {
        delete schema.errorMessage.format;
        if (Object.keys(schema.errorMessage).length === 0) {
          delete schema.errorMessage;
        }
      }
    }
    schema.anyOf.push({
      format: value,
      ...message && refs.errorMessages && { errorMessage: { format: message } }
    });
  } else {
    setResponseValueAndErrors(schema, "format", value, message, refs);
  }
}
function addPattern(schema, regex, message, refs) {
  if (schema.pattern || schema.allOf?.some((x) => x.pattern)) {
    if (!schema.allOf) {
      schema.allOf = [];
    }
    if (schema.pattern) {
      schema.allOf.push({
        pattern: schema.pattern,
        ...schema.errorMessage && refs.errorMessages && {
          errorMessage: { pattern: schema.errorMessage.pattern }
        }
      });
      delete schema.pattern;
      if (schema.errorMessage) {
        delete schema.errorMessage.pattern;
        if (Object.keys(schema.errorMessage).length === 0) {
          delete schema.errorMessage;
        }
      }
    }
    schema.allOf.push({
      pattern: stringifyRegExpWithFlags(regex, refs),
      ...message && refs.errorMessages && { errorMessage: { pattern: message } }
    });
  } else {
    setResponseValueAndErrors(schema, "pattern", stringifyRegExpWithFlags(regex, refs), message, refs);
  }
}
function stringifyRegExpWithFlags(regex, refs) {
  if (!refs.applyRegexFlags || !regex.flags) {
    return regex.source;
  }
  const flags = {
    i: regex.flags.includes("i"),
    m: regex.flags.includes("m"),
    s: regex.flags.includes("s")
  };
  const source = flags.i ? regex.source.toLowerCase() : regex.source;
  let pattern = "";
  let isEscaped = false;
  let inCharGroup = false;
  let inCharRange = false;
  for (let i = 0;i < source.length; i++) {
    if (isEscaped) {
      pattern += source[i];
      isEscaped = false;
      continue;
    }
    if (flags.i) {
      if (inCharGroup) {
        if (source[i].match(/[a-z]/)) {
          if (inCharRange) {
            pattern += source[i];
            pattern += `${source[i - 2]}-${source[i]}`.toUpperCase();
            inCharRange = false;
          } else if (source[i + 1] === "-" && source[i + 2]?.match(/[a-z]/)) {
            pattern += source[i];
            inCharRange = true;
          } else {
            pattern += `${source[i]}${source[i].toUpperCase()}`;
          }
          continue;
        }
      } else if (source[i].match(/[a-z]/)) {
        pattern += `[${source[i]}${source[i].toUpperCase()}]`;
        continue;
      }
    }
    if (flags.m) {
      if (source[i] === "^") {
        pattern += `(^|(?<=[\r
]))`;
        continue;
      } else if (source[i] === "$") {
        pattern += `($|(?=[\r
]))`;
        continue;
      }
    }
    if (flags.s && source[i] === ".") {
      pattern += inCharGroup ? `${source[i]}\r
` : `[${source[i]}\r
]`;
      continue;
    }
    pattern += source[i];
    if (source[i] === "\\") {
      isEscaped = true;
    } else if (inCharGroup && source[i] === "]") {
      inCharGroup = false;
    } else if (!inCharGroup && source[i] === "[") {
      inCharGroup = true;
    }
  }
  try {
    new RegExp(pattern);
  } catch {
    console.warn(`Could not convert regex pattern at ${refs.currentPath.join("/")} to a flag-independent form! Falling back to the flag-ignorant source`);
    return regex.source;
  }
  return pattern;
}

// node_modules/zod-to-json-schema/dist/esm/parsers/record.js
function parseRecordDef(def, refs) {
  if (refs.target === "openAi") {
    console.warn("Warning: OpenAI may not support records in schemas! Try an array of key-value pairs instead.");
  }
  if (refs.target === "openApi3" && def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodEnum) {
    return {
      type: "object",
      required: def.keyType._def.values,
      properties: def.keyType._def.values.reduce((acc, key) => ({
        ...acc,
        [key]: parseDef(def.valueType._def, {
          ...refs,
          currentPath: [...refs.currentPath, "properties", key]
        }) ?? parseAnyDef(refs)
      }), {}),
      additionalProperties: refs.rejectedAdditionalProperties
    };
  }
  const schema = {
    type: "object",
    additionalProperties: parseDef(def.valueType._def, {
      ...refs,
      currentPath: [...refs.currentPath, "additionalProperties"]
    }) ?? refs.allowedAdditionalProperties
  };
  if (refs.target === "openApi3") {
    return schema;
  }
  if (def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodString && def.keyType._def.checks?.length) {
    const { type, ...keyType } = parseStringDef(def.keyType._def, refs);
    return {
      ...schema,
      propertyNames: keyType
    };
  } else if (def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodEnum) {
    return {
      ...schema,
      propertyNames: {
        enum: def.keyType._def.values
      }
    };
  } else if (def.keyType?._def.typeName === ZodFirstPartyTypeKind.ZodBranded && def.keyType._def.type._def.typeName === ZodFirstPartyTypeKind.ZodString && def.keyType._def.type._def.checks?.length) {
    const { type, ...keyType } = parseBrandedDef(def.keyType._def, refs);
    return {
      ...schema,
      propertyNames: keyType
    };
  }
  return schema;
}

// node_modules/zod-to-json-schema/dist/esm/parsers/map.js
function parseMapDef(def, refs) {
  if (refs.mapStrategy === "record") {
    return parseRecordDef(def, refs);
  }
  const keys = parseDef(def.keyType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items", "items", "0"]
  }) || parseAnyDef(refs);
  const values = parseDef(def.valueType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items", "items", "1"]
  }) || parseAnyDef(refs);
  return {
    type: "array",
    maxItems: 125,
    items: {
      type: "array",
      items: [keys, values],
      minItems: 2,
      maxItems: 2
    }
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/nativeEnum.js
function parseNativeEnumDef(def) {
  const object3 = def.values;
  const actualKeys = Object.keys(def.values).filter((key) => {
    return typeof object3[object3[key]] !== "number";
  });
  const actualValues = actualKeys.map((key) => object3[key]);
  const parsedTypes = Array.from(new Set(actualValues.map((values) => typeof values)));
  return {
    type: parsedTypes.length === 1 ? parsedTypes[0] === "string" ? "string" : "number" : ["string", "number"],
    enum: actualValues
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/never.js
function parseNeverDef(refs) {
  return refs.target === "openAi" ? undefined : {
    not: parseAnyDef({
      ...refs,
      currentPath: [...refs.currentPath, "not"]
    })
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/null.js
function parseNullDef(refs) {
  return refs.target === "openApi3" ? {
    enum: ["null"],
    nullable: true
  } : {
    type: "null"
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/union.js
var primitiveMappings = {
  ZodString: "string",
  ZodNumber: "number",
  ZodBigInt: "integer",
  ZodBoolean: "boolean",
  ZodNull: "null"
};
function parseUnionDef(def, refs) {
  if (refs.target === "openApi3")
    return asAnyOf(def, refs);
  const options = def.options instanceof Map ? Array.from(def.options.values()) : def.options;
  if (options.every((x) => (x._def.typeName in primitiveMappings) && (!x._def.checks || !x._def.checks.length))) {
    const types2 = options.reduce((types3, x) => {
      const type = primitiveMappings[x._def.typeName];
      return type && !types3.includes(type) ? [...types3, type] : types3;
    }, []);
    return {
      type: types2.length > 1 ? types2 : types2[0]
    };
  } else if (options.every((x) => x._def.typeName === "ZodLiteral" && !x.description)) {
    const types2 = options.reduce((acc, x) => {
      const type = typeof x._def.value;
      switch (type) {
        case "string":
        case "number":
        case "boolean":
          return [...acc, type];
        case "bigint":
          return [...acc, "integer"];
        case "object":
          if (x._def.value === null)
            return [...acc, "null"];
        case "symbol":
        case "undefined":
        case "function":
        default:
          return acc;
      }
    }, []);
    if (types2.length === options.length) {
      const uniqueTypes = types2.filter((x, i, a) => a.indexOf(x) === i);
      return {
        type: uniqueTypes.length > 1 ? uniqueTypes : uniqueTypes[0],
        enum: options.reduce((acc, x) => {
          return acc.includes(x._def.value) ? acc : [...acc, x._def.value];
        }, [])
      };
    }
  } else if (options.every((x) => x._def.typeName === "ZodEnum")) {
    return {
      type: "string",
      enum: options.reduce((acc, x) => [
        ...acc,
        ...x._def.values.filter((x2) => !acc.includes(x2))
      ], [])
    };
  }
  return asAnyOf(def, refs);
}
var asAnyOf = (def, refs) => {
  const anyOf = (def.options instanceof Map ? Array.from(def.options.values()) : def.options).map((x, i) => parseDef(x._def, {
    ...refs,
    currentPath: [...refs.currentPath, "anyOf", `${i}`]
  })).filter((x) => !!x && (!refs.strictUnions || typeof x === "object" && Object.keys(x).length > 0));
  return anyOf.length ? { anyOf } : undefined;
};

// node_modules/zod-to-json-schema/dist/esm/parsers/nullable.js
function parseNullableDef(def, refs) {
  if (["ZodString", "ZodNumber", "ZodBigInt", "ZodBoolean", "ZodNull"].includes(def.innerType._def.typeName) && (!def.innerType._def.checks || !def.innerType._def.checks.length)) {
    if (refs.target === "openApi3") {
      return {
        type: primitiveMappings[def.innerType._def.typeName],
        nullable: true
      };
    }
    return {
      type: [
        primitiveMappings[def.innerType._def.typeName],
        "null"
      ]
    };
  }
  if (refs.target === "openApi3") {
    const base2 = parseDef(def.innerType._def, {
      ...refs,
      currentPath: [...refs.currentPath]
    });
    if (base2 && "$ref" in base2)
      return { allOf: [base2], nullable: true };
    return base2 && { ...base2, nullable: true };
  }
  const base = parseDef(def.innerType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "anyOf", "0"]
  });
  return base && { anyOf: [base, { type: "null" }] };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/number.js
function parseNumberDef(def, refs) {
  const res = {
    type: "number"
  };
  if (!def.checks)
    return res;
  for (const check2 of def.checks) {
    switch (check2.kind) {
      case "int":
        res.type = "integer";
        addErrorMessage(res, "type", check2.message, refs);
        break;
      case "min":
        if (refs.target === "jsonSchema7") {
          if (check2.inclusive) {
            setResponseValueAndErrors(res, "minimum", check2.value, check2.message, refs);
          } else {
            setResponseValueAndErrors(res, "exclusiveMinimum", check2.value, check2.message, refs);
          }
        } else {
          if (!check2.inclusive) {
            res.exclusiveMinimum = true;
          }
          setResponseValueAndErrors(res, "minimum", check2.value, check2.message, refs);
        }
        break;
      case "max":
        if (refs.target === "jsonSchema7") {
          if (check2.inclusive) {
            setResponseValueAndErrors(res, "maximum", check2.value, check2.message, refs);
          } else {
            setResponseValueAndErrors(res, "exclusiveMaximum", check2.value, check2.message, refs);
          }
        } else {
          if (!check2.inclusive) {
            res.exclusiveMaximum = true;
          }
          setResponseValueAndErrors(res, "maximum", check2.value, check2.message, refs);
        }
        break;
      case "multipleOf":
        setResponseValueAndErrors(res, "multipleOf", check2.value, check2.message, refs);
        break;
    }
  }
  return res;
}

// node_modules/zod-to-json-schema/dist/esm/parsers/object.js
function parseObjectDef(def, refs) {
  const forceOptionalIntoNullable = refs.target === "openAi";
  const result = {
    type: "object",
    properties: {}
  };
  const required2 = [];
  const shape = def.shape();
  for (const propName in shape) {
    let propDef = shape[propName];
    if (propDef === undefined || propDef._def === undefined) {
      continue;
    }
    let propOptional = safeIsOptional(propDef);
    if (propOptional && forceOptionalIntoNullable) {
      if (propDef._def.typeName === "ZodOptional") {
        propDef = propDef._def.innerType;
      }
      if (!propDef.isNullable()) {
        propDef = propDef.nullable();
      }
      propOptional = false;
    }
    const parsedDef = parseDef(propDef._def, {
      ...refs,
      currentPath: [...refs.currentPath, "properties", propName],
      propertyPath: [...refs.currentPath, "properties", propName]
    });
    if (parsedDef === undefined) {
      continue;
    }
    result.properties[propName] = parsedDef;
    if (!propOptional) {
      required2.push(propName);
    }
  }
  if (required2.length) {
    result.required = required2;
  }
  const additionalProperties = decideAdditionalProperties(def, refs);
  if (additionalProperties !== undefined) {
    result.additionalProperties = additionalProperties;
  }
  return result;
}
function decideAdditionalProperties(def, refs) {
  if (def.catchall._def.typeName !== "ZodNever") {
    return parseDef(def.catchall._def, {
      ...refs,
      currentPath: [...refs.currentPath, "additionalProperties"]
    });
  }
  switch (def.unknownKeys) {
    case "passthrough":
      return refs.allowedAdditionalProperties;
    case "strict":
      return refs.rejectedAdditionalProperties;
    case "strip":
      return refs.removeAdditionalStrategy === "strict" ? refs.allowedAdditionalProperties : refs.rejectedAdditionalProperties;
  }
}
function safeIsOptional(schema) {
  try {
    return schema.isOptional();
  } catch {
    return true;
  }
}

// node_modules/zod-to-json-schema/dist/esm/parsers/optional.js
var parseOptionalDef = (def, refs) => {
  if (refs.currentPath.toString() === refs.propertyPath?.toString()) {
    return parseDef(def.innerType._def, refs);
  }
  const innerSchema = parseDef(def.innerType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "anyOf", "1"]
  });
  return innerSchema ? {
    anyOf: [
      {
        not: parseAnyDef(refs)
      },
      innerSchema
    ]
  } : parseAnyDef(refs);
};

// node_modules/zod-to-json-schema/dist/esm/parsers/pipeline.js
var parsePipelineDef = (def, refs) => {
  if (refs.pipeStrategy === "input") {
    return parseDef(def.in._def, refs);
  } else if (refs.pipeStrategy === "output") {
    return parseDef(def.out._def, refs);
  }
  const a = parseDef(def.in._def, {
    ...refs,
    currentPath: [...refs.currentPath, "allOf", "0"]
  });
  const b = parseDef(def.out._def, {
    ...refs,
    currentPath: [...refs.currentPath, "allOf", a ? "1" : "0"]
  });
  return {
    allOf: [a, b].filter((x) => x !== undefined)
  };
};

// node_modules/zod-to-json-schema/dist/esm/parsers/promise.js
function parsePromiseDef(def, refs) {
  return parseDef(def.type._def, refs);
}

// node_modules/zod-to-json-schema/dist/esm/parsers/set.js
function parseSetDef(def, refs) {
  const items = parseDef(def.valueType._def, {
    ...refs,
    currentPath: [...refs.currentPath, "items"]
  });
  const schema = {
    type: "array",
    uniqueItems: true,
    items
  };
  if (def.minSize) {
    setResponseValueAndErrors(schema, "minItems", def.minSize.value, def.minSize.message, refs);
  }
  if (def.maxSize) {
    setResponseValueAndErrors(schema, "maxItems", def.maxSize.value, def.maxSize.message, refs);
  }
  return schema;
}

// node_modules/zod-to-json-schema/dist/esm/parsers/tuple.js
function parseTupleDef(def, refs) {
  if (def.rest) {
    return {
      type: "array",
      minItems: def.items.length,
      items: def.items.map((x, i) => parseDef(x._def, {
        ...refs,
        currentPath: [...refs.currentPath, "items", `${i}`]
      })).reduce((acc, x) => x === undefined ? acc : [...acc, x], []),
      additionalItems: parseDef(def.rest._def, {
        ...refs,
        currentPath: [...refs.currentPath, "additionalItems"]
      })
    };
  } else {
    return {
      type: "array",
      minItems: def.items.length,
      maxItems: def.items.length,
      items: def.items.map((x, i) => parseDef(x._def, {
        ...refs,
        currentPath: [...refs.currentPath, "items", `${i}`]
      })).reduce((acc, x) => x === undefined ? acc : [...acc, x], [])
    };
  }
}

// node_modules/zod-to-json-schema/dist/esm/parsers/undefined.js
function parseUndefinedDef(refs) {
  return {
    not: parseAnyDef(refs)
  };
}

// node_modules/zod-to-json-schema/dist/esm/parsers/unknown.js
function parseUnknownDef(refs) {
  return parseAnyDef(refs);
}

// node_modules/zod-to-json-schema/dist/esm/parsers/readonly.js
var parseReadonlyDef = (def, refs) => {
  return parseDef(def.innerType._def, refs);
};

// node_modules/zod-to-json-schema/dist/esm/selectParser.js
var selectParser = (def, typeName, refs) => {
  switch (typeName) {
    case ZodFirstPartyTypeKind.ZodString:
      return parseStringDef(def, refs);
    case ZodFirstPartyTypeKind.ZodNumber:
      return parseNumberDef(def, refs);
    case ZodFirstPartyTypeKind.ZodObject:
      return parseObjectDef(def, refs);
    case ZodFirstPartyTypeKind.ZodBigInt:
      return parseBigintDef(def, refs);
    case ZodFirstPartyTypeKind.ZodBoolean:
      return parseBooleanDef();
    case ZodFirstPartyTypeKind.ZodDate:
      return parseDateDef(def, refs);
    case ZodFirstPartyTypeKind.ZodUndefined:
      return parseUndefinedDef(refs);
    case ZodFirstPartyTypeKind.ZodNull:
      return parseNullDef(refs);
    case ZodFirstPartyTypeKind.ZodArray:
      return parseArrayDef(def, refs);
    case ZodFirstPartyTypeKind.ZodUnion:
    case ZodFirstPartyTypeKind.ZodDiscriminatedUnion:
      return parseUnionDef(def, refs);
    case ZodFirstPartyTypeKind.ZodIntersection:
      return parseIntersectionDef(def, refs);
    case ZodFirstPartyTypeKind.ZodTuple:
      return parseTupleDef(def, refs);
    case ZodFirstPartyTypeKind.ZodRecord:
      return parseRecordDef(def, refs);
    case ZodFirstPartyTypeKind.ZodLiteral:
      return parseLiteralDef(def, refs);
    case ZodFirstPartyTypeKind.ZodEnum:
      return parseEnumDef(def);
    case ZodFirstPartyTypeKind.ZodNativeEnum:
      return parseNativeEnumDef(def);
    case ZodFirstPartyTypeKind.ZodNullable:
      return parseNullableDef(def, refs);
    case ZodFirstPartyTypeKind.ZodOptional:
      return parseOptionalDef(def, refs);
    case ZodFirstPartyTypeKind.ZodMap:
      return parseMapDef(def, refs);
    case ZodFirstPartyTypeKind.ZodSet:
      return parseSetDef(def, refs);
    case ZodFirstPartyTypeKind.ZodLazy:
      return () => def.getter()._def;
    case ZodFirstPartyTypeKind.ZodPromise:
      return parsePromiseDef(def, refs);
    case ZodFirstPartyTypeKind.ZodNaN:
    case ZodFirstPartyTypeKind.ZodNever:
      return parseNeverDef(refs);
    case ZodFirstPartyTypeKind.ZodEffects:
      return parseEffectsDef(def, refs);
    case ZodFirstPartyTypeKind.ZodAny:
      return parseAnyDef(refs);
    case ZodFirstPartyTypeKind.ZodUnknown:
      return parseUnknownDef(refs);
    case ZodFirstPartyTypeKind.ZodDefault:
      return parseDefaultDef(def, refs);
    case ZodFirstPartyTypeKind.ZodBranded:
      return parseBrandedDef(def, refs);
    case ZodFirstPartyTypeKind.ZodReadonly:
      return parseReadonlyDef(def, refs);
    case ZodFirstPartyTypeKind.ZodCatch:
      return parseCatchDef(def, refs);
    case ZodFirstPartyTypeKind.ZodPipeline:
      return parsePipelineDef(def, refs);
    case ZodFirstPartyTypeKind.ZodFunction:
    case ZodFirstPartyTypeKind.ZodVoid:
    case ZodFirstPartyTypeKind.ZodSymbol:
      return;
    default:
      return ((_) => {
        return;
      })(typeName);
  }
};

// node_modules/zod-to-json-schema/dist/esm/parseDef.js
function parseDef(def, refs, forceResolution = false) {
  const seenItem = refs.seen.get(def);
  if (refs.override) {
    const overrideResult = refs.override?.(def, refs, seenItem, forceResolution);
    if (overrideResult !== ignoreOverride) {
      return overrideResult;
    }
  }
  if (seenItem && !forceResolution) {
    const seenSchema = get$ref(seenItem, refs);
    if (seenSchema !== undefined) {
      return seenSchema;
    }
  }
  const newItem = { def, path: refs.currentPath, jsonSchema: undefined };
  refs.seen.set(def, newItem);
  const jsonSchemaOrGetter = selectParser(def, def.typeName, refs);
  const jsonSchema = typeof jsonSchemaOrGetter === "function" ? parseDef(jsonSchemaOrGetter(), refs) : jsonSchemaOrGetter;
  if (jsonSchema) {
    addMeta(def, refs, jsonSchema);
  }
  if (refs.postProcess) {
    const postProcessResult = refs.postProcess(jsonSchema, def, refs);
    newItem.jsonSchema = jsonSchema;
    return postProcessResult;
  }
  newItem.jsonSchema = jsonSchema;
  return jsonSchema;
}
var get$ref = (item, refs) => {
  switch (refs.$refStrategy) {
    case "root":
      return { $ref: item.path.join("/") };
    case "relative":
      return { $ref: getRelativePath(refs.currentPath, item.path) };
    case "none":
    case "seen": {
      if (item.path.length < refs.currentPath.length && item.path.every((value, index) => refs.currentPath[index] === value)) {
        console.warn(`Recursive reference detected at ${refs.currentPath.join("/")}! Defaulting to any`);
        return parseAnyDef(refs);
      }
      return refs.$refStrategy === "seen" ? parseAnyDef(refs) : undefined;
    }
  }
};
var addMeta = (def, refs, jsonSchema) => {
  if (def.description) {
    jsonSchema.description = def.description;
    if (refs.markdownDescription) {
      jsonSchema.markdownDescription = def.description;
    }
  }
  return jsonSchema;
};
// node_modules/zod-to-json-schema/dist/esm/zodToJsonSchema.js
var zodToJsonSchema = (schema, options) => {
  const refs = getRefs(options);
  let definitions = typeof options === "object" && options.definitions ? Object.entries(options.definitions).reduce((acc, [name2, schema2]) => ({
    ...acc,
    [name2]: parseDef(schema2._def, {
      ...refs,
      currentPath: [...refs.basePath, refs.definitionPath, name2]
    }, true) ?? parseAnyDef(refs)
  }), {}) : undefined;
  const name = typeof options === "string" ? options : options?.nameStrategy === "title" ? undefined : options?.name;
  const main = parseDef(schema._def, name === undefined ? refs : {
    ...refs,
    currentPath: [...refs.basePath, refs.definitionPath, name]
  }, false) ?? parseAnyDef(refs);
  const title = typeof options === "object" && options.name !== undefined && options.nameStrategy === "title" ? options.name : undefined;
  if (title !== undefined) {
    main.title = title;
  }
  if (refs.flags.hasReferencedOpenAiAnyType) {
    if (!definitions) {
      definitions = {};
    }
    if (!definitions[refs.openAiAnyTypeName]) {
      definitions[refs.openAiAnyTypeName] = {
        type: ["string", "number", "integer", "boolean", "array", "null"],
        items: {
          $ref: refs.$refStrategy === "relative" ? "1" : [
            ...refs.basePath,
            refs.definitionPath,
            refs.openAiAnyTypeName
          ].join("/")
        }
      };
    }
  }
  const combined = name === undefined ? definitions ? {
    ...main,
    [refs.definitionPath]: definitions
  } : main : {
    $ref: [
      ...refs.$refStrategy === "relative" ? [] : refs.basePath,
      refs.definitionPath,
      name
    ].join("/"),
    [refs.definitionPath]: {
      ...definitions,
      [name]: main
    }
  };
  if (refs.target === "jsonSchema7") {
    combined.$schema = "http://json-schema.org/draft-07/schema#";
  } else if (refs.target === "jsonSchema2019-09" || refs.target === "openAi") {
    combined.$schema = "https://json-schema.org/draft/2019-09/schema#";
  }
  if (refs.target === "openAi" && (("anyOf" in combined) || ("oneOf" in combined) || ("allOf" in combined) || ("type" in combined) && Array.isArray(combined.type))) {
    console.warn("Warning: OpenAI may not support schemas with unions as roots! Try wrapping it in an object property.");
  }
  return combined;
};
// node_modules/@modelcontextprotocol/sdk/dist/esm/server/zod-json-schema-compat.js
function mapMiniTarget(t) {
  if (!t)
    return "draft-7";
  if (t === "jsonSchema7" || t === "draft-7")
    return "draft-7";
  if (t === "jsonSchema2019-09" || t === "draft-2020-12")
    return "draft-2020-12";
  return "draft-7";
}
function toJsonSchemaCompat(schema, opts) {
  if (isZ4Schema(schema)) {
    return toJSONSchema(schema, {
      target: mapMiniTarget(opts?.target),
      io: opts?.pipeStrategy ?? "input"
    });
  }
  return zodToJsonSchema(schema, {
    strictUnions: opts?.strictUnions ?? true,
    pipeStrategy: opts?.pipeStrategy ?? "input"
  });
}
function getMethodLiteral(schema) {
  const shape = getObjectShape(schema);
  const methodSchema = shape?.method;
  if (!methodSchema) {
    throw new Error("Schema is missing a method literal");
  }
  const value = getLiteralValue(methodSchema);
  if (typeof value !== "string") {
    throw new Error("Schema method literal must be a string");
  }
  return value;
}
function parseWithCompat(schema, data) {
  const result = safeParse2(schema, data);
  if (!result.success) {
    throw result.error;
  }
  return result.data;
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/shared/protocol.js
var DEFAULT_REQUEST_TIMEOUT_MSEC = 60000;

class Protocol {
  constructor(_options) {
    this._options = _options;
    this._requestMessageId = 0;
    this._requestHandlers = new Map;
    this._requestHandlerAbortControllers = new Map;
    this._notificationHandlers = new Map;
    this._responseHandlers = new Map;
    this._progressHandlers = new Map;
    this._timeoutInfo = new Map;
    this._pendingDebouncedNotifications = new Set;
    this._taskProgressTokens = new Map;
    this._requestResolvers = new Map;
    this.setNotificationHandler(CancelledNotificationSchema, (notification) => {
      this._oncancel(notification);
    });
    this.setNotificationHandler(ProgressNotificationSchema, (notification) => {
      this._onprogress(notification);
    });
    this.setRequestHandler(PingRequestSchema, (_request) => ({}));
    this._taskStore = _options?.taskStore;
    this._taskMessageQueue = _options?.taskMessageQueue;
    if (this._taskStore) {
      this.setRequestHandler(GetTaskRequestSchema, async (request, extra) => {
        const task = await this._taskStore.getTask(request.params.taskId, extra.sessionId);
        if (!task) {
          throw new McpError(ErrorCode.InvalidParams, "Failed to retrieve task: Task not found");
        }
        return {
          ...task
        };
      });
      this.setRequestHandler(GetTaskPayloadRequestSchema, async (request, extra) => {
        const handleTaskResult = async () => {
          const taskId = request.params.taskId;
          if (this._taskMessageQueue) {
            let queuedMessage;
            while (queuedMessage = await this._taskMessageQueue.dequeue(taskId, extra.sessionId)) {
              if (queuedMessage.type === "response" || queuedMessage.type === "error") {
                const message = queuedMessage.message;
                const requestId = message.id;
                const resolver = this._requestResolvers.get(requestId);
                if (resolver) {
                  this._requestResolvers.delete(requestId);
                  if (queuedMessage.type === "response") {
                    resolver(message);
                  } else {
                    const errorMessage = message;
                    const error2 = new McpError(errorMessage.error.code, errorMessage.error.message, errorMessage.error.data);
                    resolver(error2);
                  }
                } else {
                  const messageType = queuedMessage.type === "response" ? "Response" : "Error";
                  this._onerror(new Error(`${messageType} handler missing for request ${requestId}`));
                }
                continue;
              }
              await this._transport?.send(queuedMessage.message, { relatedRequestId: extra.requestId });
            }
          }
          const task = await this._taskStore.getTask(taskId, extra.sessionId);
          if (!task) {
            throw new McpError(ErrorCode.InvalidParams, `Task not found: ${taskId}`);
          }
          if (!isTerminal(task.status)) {
            await this._waitForTaskUpdate(taskId, extra.signal);
            return await handleTaskResult();
          }
          if (isTerminal(task.status)) {
            const result = await this._taskStore.getTaskResult(taskId, extra.sessionId);
            this._clearTaskQueue(taskId);
            return {
              ...result,
              _meta: {
                ...result._meta,
                [RELATED_TASK_META_KEY]: {
                  taskId
                }
              }
            };
          }
          return await handleTaskResult();
        };
        return await handleTaskResult();
      });
      this.setRequestHandler(ListTasksRequestSchema, async (request, extra) => {
        try {
          const { tasks, nextCursor } = await this._taskStore.listTasks(request.params?.cursor, extra.sessionId);
          return {
            tasks,
            nextCursor,
            _meta: {}
          };
        } catch (error2) {
          throw new McpError(ErrorCode.InvalidParams, `Failed to list tasks: ${error2 instanceof Error ? error2.message : String(error2)}`);
        }
      });
      this.setRequestHandler(CancelTaskRequestSchema, async (request, extra) => {
        try {
          const task = await this._taskStore.getTask(request.params.taskId, extra.sessionId);
          if (!task) {
            throw new McpError(ErrorCode.InvalidParams, `Task not found: ${request.params.taskId}`);
          }
          if (isTerminal(task.status)) {
            throw new McpError(ErrorCode.InvalidParams, `Cannot cancel task in terminal status: ${task.status}`);
          }
          await this._taskStore.updateTaskStatus(request.params.taskId, "cancelled", "Client cancelled task execution.", extra.sessionId);
          this._clearTaskQueue(request.params.taskId);
          const cancelledTask = await this._taskStore.getTask(request.params.taskId, extra.sessionId);
          if (!cancelledTask) {
            throw new McpError(ErrorCode.InvalidParams, `Task not found after cancellation: ${request.params.taskId}`);
          }
          return {
            _meta: {},
            ...cancelledTask
          };
        } catch (error2) {
          if (error2 instanceof McpError) {
            throw error2;
          }
          throw new McpError(ErrorCode.InvalidRequest, `Failed to cancel task: ${error2 instanceof Error ? error2.message : String(error2)}`);
        }
      });
    }
  }
  async _oncancel(notification) {
    if (!notification.params.requestId) {
      return;
    }
    const controller = this._requestHandlerAbortControllers.get(notification.params.requestId);
    controller?.abort(notification.params.reason);
  }
  _setupTimeout(messageId, timeout, maxTotalTimeout, onTimeout, resetTimeoutOnProgress = false) {
    this._timeoutInfo.set(messageId, {
      timeoutId: setTimeout(onTimeout, timeout),
      startTime: Date.now(),
      timeout,
      maxTotalTimeout,
      resetTimeoutOnProgress,
      onTimeout
    });
  }
  _resetTimeout(messageId) {
    const info = this._timeoutInfo.get(messageId);
    if (!info)
      return false;
    const totalElapsed = Date.now() - info.startTime;
    if (info.maxTotalTimeout && totalElapsed >= info.maxTotalTimeout) {
      this._timeoutInfo.delete(messageId);
      throw McpError.fromError(ErrorCode.RequestTimeout, "Maximum total timeout exceeded", {
        maxTotalTimeout: info.maxTotalTimeout,
        totalElapsed
      });
    }
    clearTimeout(info.timeoutId);
    info.timeoutId = setTimeout(info.onTimeout, info.timeout);
    return true;
  }
  _cleanupTimeout(messageId) {
    const info = this._timeoutInfo.get(messageId);
    if (info) {
      clearTimeout(info.timeoutId);
      this._timeoutInfo.delete(messageId);
    }
  }
  async connect(transport) {
    if (this._transport) {
      throw new Error("Already connected to a transport. Call close() before connecting to a new transport, or use a separate Protocol instance per connection.");
    }
    this._transport = transport;
    const _onclose = this.transport?.onclose;
    this._transport.onclose = () => {
      _onclose?.();
      this._onclose();
    };
    const _onerror = this.transport?.onerror;
    this._transport.onerror = (error2) => {
      _onerror?.(error2);
      this._onerror(error2);
    };
    const _onmessage = this._transport?.onmessage;
    this._transport.onmessage = (message, extra) => {
      _onmessage?.(message, extra);
      if (isJSONRPCResultResponse(message) || isJSONRPCErrorResponse(message)) {
        this._onresponse(message);
      } else if (isJSONRPCRequest(message)) {
        this._onrequest(message, extra);
      } else if (isJSONRPCNotification(message)) {
        this._onnotification(message);
      } else {
        this._onerror(new Error(`Unknown message type: ${JSON.stringify(message)}`));
      }
    };
    await this._transport.start();
  }
  _onclose() {
    const responseHandlers = this._responseHandlers;
    this._responseHandlers = new Map;
    this._progressHandlers.clear();
    this._taskProgressTokens.clear();
    this._pendingDebouncedNotifications.clear();
    for (const controller of this._requestHandlerAbortControllers.values()) {
      controller.abort();
    }
    this._requestHandlerAbortControllers.clear();
    const error2 = McpError.fromError(ErrorCode.ConnectionClosed, "Connection closed");
    this._transport = undefined;
    this.onclose?.();
    for (const handler of responseHandlers.values()) {
      handler(error2);
    }
  }
  _onerror(error2) {
    this.onerror?.(error2);
  }
  _onnotification(notification) {
    const handler = this._notificationHandlers.get(notification.method) ?? this.fallbackNotificationHandler;
    if (handler === undefined) {
      return;
    }
    Promise.resolve().then(() => handler(notification)).catch((error2) => this._onerror(new Error(`Uncaught error in notification handler: ${error2}`)));
  }
  _onrequest(request, extra) {
    const handler = this._requestHandlers.get(request.method) ?? this.fallbackRequestHandler;
    const capturedTransport = this._transport;
    const relatedTaskId = request.params?._meta?.[RELATED_TASK_META_KEY]?.taskId;
    if (handler === undefined) {
      const errorResponse = {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: ErrorCode.MethodNotFound,
          message: "Method not found"
        }
      };
      if (relatedTaskId && this._taskMessageQueue) {
        this._enqueueTaskMessage(relatedTaskId, {
          type: "error",
          message: errorResponse,
          timestamp: Date.now()
        }, capturedTransport?.sessionId).catch((error2) => this._onerror(new Error(`Failed to enqueue error response: ${error2}`)));
      } else {
        capturedTransport?.send(errorResponse).catch((error2) => this._onerror(new Error(`Failed to send an error response: ${error2}`)));
      }
      return;
    }
    const abortController = new AbortController;
    this._requestHandlerAbortControllers.set(request.id, abortController);
    const taskCreationParams = isTaskAugmentedRequestParams(request.params) ? request.params.task : undefined;
    const taskStore = this._taskStore ? this.requestTaskStore(request, capturedTransport?.sessionId) : undefined;
    const fullExtra = {
      signal: abortController.signal,
      sessionId: capturedTransport?.sessionId,
      _meta: request.params?._meta,
      sendNotification: async (notification) => {
        if (abortController.signal.aborted)
          return;
        const notificationOptions = { relatedRequestId: request.id };
        if (relatedTaskId) {
          notificationOptions.relatedTask = { taskId: relatedTaskId };
        }
        await this.notification(notification, notificationOptions);
      },
      sendRequest: async (r, resultSchema, options) => {
        if (abortController.signal.aborted) {
          throw new McpError(ErrorCode.ConnectionClosed, "Request was cancelled");
        }
        const requestOptions = { ...options, relatedRequestId: request.id };
        if (relatedTaskId && !requestOptions.relatedTask) {
          requestOptions.relatedTask = { taskId: relatedTaskId };
        }
        const effectiveTaskId = requestOptions.relatedTask?.taskId ?? relatedTaskId;
        if (effectiveTaskId && taskStore) {
          await taskStore.updateTaskStatus(effectiveTaskId, "input_required");
        }
        return await this.request(r, resultSchema, requestOptions);
      },
      authInfo: extra?.authInfo,
      requestId: request.id,
      requestInfo: extra?.requestInfo,
      taskId: relatedTaskId,
      taskStore,
      taskRequestedTtl: taskCreationParams?.ttl,
      closeSSEStream: extra?.closeSSEStream,
      closeStandaloneSSEStream: extra?.closeStandaloneSSEStream
    };
    Promise.resolve().then(() => {
      if (taskCreationParams) {
        this.assertTaskHandlerCapability(request.method);
      }
    }).then(() => handler(request, fullExtra)).then(async (result) => {
      if (abortController.signal.aborted) {
        return;
      }
      const response = {
        result,
        jsonrpc: "2.0",
        id: request.id
      };
      if (relatedTaskId && this._taskMessageQueue) {
        await this._enqueueTaskMessage(relatedTaskId, {
          type: "response",
          message: response,
          timestamp: Date.now()
        }, capturedTransport?.sessionId);
      } else {
        await capturedTransport?.send(response);
      }
    }, async (error2) => {
      if (abortController.signal.aborted) {
        return;
      }
      const errorResponse = {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: Number.isSafeInteger(error2["code"]) ? error2["code"] : ErrorCode.InternalError,
          message: error2.message ?? "Internal error",
          ...error2["data"] !== undefined && { data: error2["data"] }
        }
      };
      if (relatedTaskId && this._taskMessageQueue) {
        await this._enqueueTaskMessage(relatedTaskId, {
          type: "error",
          message: errorResponse,
          timestamp: Date.now()
        }, capturedTransport?.sessionId);
      } else {
        await capturedTransport?.send(errorResponse);
      }
    }).catch((error2) => this._onerror(new Error(`Failed to send response: ${error2}`))).finally(() => {
      this._requestHandlerAbortControllers.delete(request.id);
    });
  }
  _onprogress(notification) {
    const { progressToken, ...params } = notification.params;
    const messageId = Number(progressToken);
    const handler = this._progressHandlers.get(messageId);
    if (!handler) {
      this._onerror(new Error(`Received a progress notification for an unknown token: ${JSON.stringify(notification)}`));
      return;
    }
    const responseHandler = this._responseHandlers.get(messageId);
    const timeoutInfo = this._timeoutInfo.get(messageId);
    if (timeoutInfo && responseHandler && timeoutInfo.resetTimeoutOnProgress) {
      try {
        this._resetTimeout(messageId);
      } catch (error2) {
        this._responseHandlers.delete(messageId);
        this._progressHandlers.delete(messageId);
        this._cleanupTimeout(messageId);
        responseHandler(error2);
        return;
      }
    }
    handler(params);
  }
  _onresponse(response) {
    const messageId = Number(response.id);
    const resolver = this._requestResolvers.get(messageId);
    if (resolver) {
      this._requestResolvers.delete(messageId);
      if (isJSONRPCResultResponse(response)) {
        resolver(response);
      } else {
        const error2 = new McpError(response.error.code, response.error.message, response.error.data);
        resolver(error2);
      }
      return;
    }
    const handler = this._responseHandlers.get(messageId);
    if (handler === undefined) {
      this._onerror(new Error(`Received a response for an unknown message ID: ${JSON.stringify(response)}`));
      return;
    }
    this._responseHandlers.delete(messageId);
    this._cleanupTimeout(messageId);
    let isTaskResponse = false;
    if (isJSONRPCResultResponse(response) && response.result && typeof response.result === "object") {
      const result = response.result;
      if (result.task && typeof result.task === "object") {
        const task = result.task;
        if (typeof task.taskId === "string") {
          isTaskResponse = true;
          this._taskProgressTokens.set(task.taskId, messageId);
        }
      }
    }
    if (!isTaskResponse) {
      this._progressHandlers.delete(messageId);
    }
    if (isJSONRPCResultResponse(response)) {
      handler(response);
    } else {
      const error2 = McpError.fromError(response.error.code, response.error.message, response.error.data);
      handler(error2);
    }
  }
  get transport() {
    return this._transport;
  }
  async close() {
    await this._transport?.close();
  }
  async* requestStream(request, resultSchema, options) {
    const { task } = options ?? {};
    if (!task) {
      try {
        const result = await this.request(request, resultSchema, options);
        yield { type: "result", result };
      } catch (error2) {
        yield {
          type: "error",
          error: error2 instanceof McpError ? error2 : new McpError(ErrorCode.InternalError, String(error2))
        };
      }
      return;
    }
    let taskId;
    try {
      const createResult = await this.request(request, CreateTaskResultSchema, options);
      if (createResult.task) {
        taskId = createResult.task.taskId;
        yield { type: "taskCreated", task: createResult.task };
      } else {
        throw new McpError(ErrorCode.InternalError, "Task creation did not return a task");
      }
      while (true) {
        const task2 = await this.getTask({ taskId }, options);
        yield { type: "taskStatus", task: task2 };
        if (isTerminal(task2.status)) {
          if (task2.status === "completed") {
            const result = await this.getTaskResult({ taskId }, resultSchema, options);
            yield { type: "result", result };
          } else if (task2.status === "failed") {
            yield {
              type: "error",
              error: new McpError(ErrorCode.InternalError, `Task ${taskId} failed`)
            };
          } else if (task2.status === "cancelled") {
            yield {
              type: "error",
              error: new McpError(ErrorCode.InternalError, `Task ${taskId} was cancelled`)
            };
          }
          return;
        }
        if (task2.status === "input_required") {
          const result = await this.getTaskResult({ taskId }, resultSchema, options);
          yield { type: "result", result };
          return;
        }
        const pollInterval = task2.pollInterval ?? this._options?.defaultTaskPollInterval ?? 1000;
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
        options?.signal?.throwIfAborted();
      }
    } catch (error2) {
      yield {
        type: "error",
        error: error2 instanceof McpError ? error2 : new McpError(ErrorCode.InternalError, String(error2))
      };
    }
  }
  request(request, resultSchema, options) {
    const { relatedRequestId, resumptionToken, onresumptiontoken, task, relatedTask } = options ?? {};
    return new Promise((resolve, reject) => {
      const earlyReject = (error2) => {
        reject(error2);
      };
      if (!this._transport) {
        earlyReject(new Error("Not connected"));
        return;
      }
      if (this._options?.enforceStrictCapabilities === true) {
        try {
          this.assertCapabilityForMethod(request.method);
          if (task) {
            this.assertTaskCapability(request.method);
          }
        } catch (e) {
          earlyReject(e);
          return;
        }
      }
      options?.signal?.throwIfAborted();
      const messageId = this._requestMessageId++;
      const jsonrpcRequest = {
        ...request,
        jsonrpc: "2.0",
        id: messageId
      };
      if (options?.onprogress) {
        this._progressHandlers.set(messageId, options.onprogress);
        jsonrpcRequest.params = {
          ...request.params,
          _meta: {
            ...request.params?._meta || {},
            progressToken: messageId
          }
        };
      }
      if (task) {
        jsonrpcRequest.params = {
          ...jsonrpcRequest.params,
          task
        };
      }
      if (relatedTask) {
        jsonrpcRequest.params = {
          ...jsonrpcRequest.params,
          _meta: {
            ...jsonrpcRequest.params?._meta || {},
            [RELATED_TASK_META_KEY]: relatedTask
          }
        };
      }
      const cancel = (reason) => {
        this._responseHandlers.delete(messageId);
        this._progressHandlers.delete(messageId);
        this._cleanupTimeout(messageId);
        this._transport?.send({
          jsonrpc: "2.0",
          method: "notifications/cancelled",
          params: {
            requestId: messageId,
            reason: String(reason)
          }
        }, { relatedRequestId, resumptionToken, onresumptiontoken }).catch((error3) => this._onerror(new Error(`Failed to send cancellation: ${error3}`)));
        const error2 = reason instanceof McpError ? reason : new McpError(ErrorCode.RequestTimeout, String(reason));
        reject(error2);
      };
      this._responseHandlers.set(messageId, (response) => {
        if (options?.signal?.aborted) {
          return;
        }
        if (response instanceof Error) {
          return reject(response);
        }
        try {
          const parseResult = safeParse2(resultSchema, response.result);
          if (!parseResult.success) {
            reject(parseResult.error);
          } else {
            resolve(parseResult.data);
          }
        } catch (error2) {
          reject(error2);
        }
      });
      options?.signal?.addEventListener("abort", () => {
        cancel(options?.signal?.reason);
      });
      const timeout = options?.timeout ?? DEFAULT_REQUEST_TIMEOUT_MSEC;
      const timeoutHandler = () => cancel(McpError.fromError(ErrorCode.RequestTimeout, "Request timed out", { timeout }));
      this._setupTimeout(messageId, timeout, options?.maxTotalTimeout, timeoutHandler, options?.resetTimeoutOnProgress ?? false);
      const relatedTaskId = relatedTask?.taskId;
      if (relatedTaskId) {
        const responseResolver = (response) => {
          const handler = this._responseHandlers.get(messageId);
          if (handler) {
            handler(response);
          } else {
            this._onerror(new Error(`Response handler missing for side-channeled request ${messageId}`));
          }
        };
        this._requestResolvers.set(messageId, responseResolver);
        this._enqueueTaskMessage(relatedTaskId, {
          type: "request",
          message: jsonrpcRequest,
          timestamp: Date.now()
        }).catch((error2) => {
          this._cleanupTimeout(messageId);
          reject(error2);
        });
      } else {
        this._transport.send(jsonrpcRequest, { relatedRequestId, resumptionToken, onresumptiontoken }).catch((error2) => {
          this._cleanupTimeout(messageId);
          reject(error2);
        });
      }
    });
  }
  async getTask(params, options) {
    return this.request({ method: "tasks/get", params }, GetTaskResultSchema, options);
  }
  async getTaskResult(params, resultSchema, options) {
    return this.request({ method: "tasks/result", params }, resultSchema, options);
  }
  async listTasks(params, options) {
    return this.request({ method: "tasks/list", params }, ListTasksResultSchema, options);
  }
  async cancelTask(params, options) {
    return this.request({ method: "tasks/cancel", params }, CancelTaskResultSchema, options);
  }
  async notification(notification, options) {
    if (!this._transport) {
      throw new Error("Not connected");
    }
    this.assertNotificationCapability(notification.method);
    const relatedTaskId = options?.relatedTask?.taskId;
    if (relatedTaskId) {
      const jsonrpcNotification2 = {
        ...notification,
        jsonrpc: "2.0",
        params: {
          ...notification.params,
          _meta: {
            ...notification.params?._meta || {},
            [RELATED_TASK_META_KEY]: options.relatedTask
          }
        }
      };
      await this._enqueueTaskMessage(relatedTaskId, {
        type: "notification",
        message: jsonrpcNotification2,
        timestamp: Date.now()
      });
      return;
    }
    const debouncedMethods = this._options?.debouncedNotificationMethods ?? [];
    const canDebounce = debouncedMethods.includes(notification.method) && !notification.params && !options?.relatedRequestId && !options?.relatedTask;
    if (canDebounce) {
      if (this._pendingDebouncedNotifications.has(notification.method)) {
        return;
      }
      this._pendingDebouncedNotifications.add(notification.method);
      Promise.resolve().then(() => {
        this._pendingDebouncedNotifications.delete(notification.method);
        if (!this._transport) {
          return;
        }
        let jsonrpcNotification2 = {
          ...notification,
          jsonrpc: "2.0"
        };
        if (options?.relatedTask) {
          jsonrpcNotification2 = {
            ...jsonrpcNotification2,
            params: {
              ...jsonrpcNotification2.params,
              _meta: {
                ...jsonrpcNotification2.params?._meta || {},
                [RELATED_TASK_META_KEY]: options.relatedTask
              }
            }
          };
        }
        this._transport?.send(jsonrpcNotification2, options).catch((error2) => this._onerror(error2));
      });
      return;
    }
    let jsonrpcNotification = {
      ...notification,
      jsonrpc: "2.0"
    };
    if (options?.relatedTask) {
      jsonrpcNotification = {
        ...jsonrpcNotification,
        params: {
          ...jsonrpcNotification.params,
          _meta: {
            ...jsonrpcNotification.params?._meta || {},
            [RELATED_TASK_META_KEY]: options.relatedTask
          }
        }
      };
    }
    await this._transport.send(jsonrpcNotification, options);
  }
  setRequestHandler(requestSchema, handler) {
    const method = getMethodLiteral(requestSchema);
    this.assertRequestHandlerCapability(method);
    this._requestHandlers.set(method, (request, extra) => {
      const parsed = parseWithCompat(requestSchema, request);
      return Promise.resolve(handler(parsed, extra));
    });
  }
  removeRequestHandler(method) {
    this._requestHandlers.delete(method);
  }
  assertCanSetRequestHandler(method) {
    if (this._requestHandlers.has(method)) {
      throw new Error(`A request handler for ${method} already exists, which would be overridden`);
    }
  }
  setNotificationHandler(notificationSchema, handler) {
    const method = getMethodLiteral(notificationSchema);
    this._notificationHandlers.set(method, (notification) => {
      const parsed = parseWithCompat(notificationSchema, notification);
      return Promise.resolve(handler(parsed));
    });
  }
  removeNotificationHandler(method) {
    this._notificationHandlers.delete(method);
  }
  _cleanupTaskProgressHandler(taskId) {
    const progressToken = this._taskProgressTokens.get(taskId);
    if (progressToken !== undefined) {
      this._progressHandlers.delete(progressToken);
      this._taskProgressTokens.delete(taskId);
    }
  }
  async _enqueueTaskMessage(taskId, message, sessionId) {
    if (!this._taskStore || !this._taskMessageQueue) {
      throw new Error("Cannot enqueue task message: taskStore and taskMessageQueue are not configured");
    }
    const maxQueueSize = this._options?.maxTaskQueueSize;
    await this._taskMessageQueue.enqueue(taskId, message, sessionId, maxQueueSize);
  }
  async _clearTaskQueue(taskId, sessionId) {
    if (this._taskMessageQueue) {
      const messages = await this._taskMessageQueue.dequeueAll(taskId, sessionId);
      for (const message of messages) {
        if (message.type === "request" && isJSONRPCRequest(message.message)) {
          const requestId = message.message.id;
          const resolver = this._requestResolvers.get(requestId);
          if (resolver) {
            resolver(new McpError(ErrorCode.InternalError, "Task cancelled or completed"));
            this._requestResolvers.delete(requestId);
          } else {
            this._onerror(new Error(`Resolver missing for request ${requestId} during task ${taskId} cleanup`));
          }
        }
      }
    }
  }
  async _waitForTaskUpdate(taskId, signal) {
    let interval = this._options?.defaultTaskPollInterval ?? 1000;
    try {
      const task = await this._taskStore?.getTask(taskId);
      if (task?.pollInterval) {
        interval = task.pollInterval;
      }
    } catch {}
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new McpError(ErrorCode.InvalidRequest, "Request cancelled"));
        return;
      }
      const timeoutId = setTimeout(resolve, interval);
      signal.addEventListener("abort", () => {
        clearTimeout(timeoutId);
        reject(new McpError(ErrorCode.InvalidRequest, "Request cancelled"));
      }, { once: true });
    });
  }
  requestTaskStore(request, sessionId) {
    const taskStore = this._taskStore;
    if (!taskStore) {
      throw new Error("No task store configured");
    }
    return {
      createTask: async (taskParams) => {
        if (!request) {
          throw new Error("No request provided");
        }
        return await taskStore.createTask(taskParams, request.id, {
          method: request.method,
          params: request.params
        }, sessionId);
      },
      getTask: async (taskId) => {
        const task = await taskStore.getTask(taskId, sessionId);
        if (!task) {
          throw new McpError(ErrorCode.InvalidParams, "Failed to retrieve task: Task not found");
        }
        return task;
      },
      storeTaskResult: async (taskId, status, result) => {
        await taskStore.storeTaskResult(taskId, status, result, sessionId);
        const task = await taskStore.getTask(taskId, sessionId);
        if (task) {
          const notification = TaskStatusNotificationSchema.parse({
            method: "notifications/tasks/status",
            params: task
          });
          await this.notification(notification);
          if (isTerminal(task.status)) {
            this._cleanupTaskProgressHandler(taskId);
          }
        }
      },
      getTaskResult: (taskId) => {
        return taskStore.getTaskResult(taskId, sessionId);
      },
      updateTaskStatus: async (taskId, status, statusMessage) => {
        const task = await taskStore.getTask(taskId, sessionId);
        if (!task) {
          throw new McpError(ErrorCode.InvalidParams, `Task "${taskId}" not found - it may have been cleaned up`);
        }
        if (isTerminal(task.status)) {
          throw new McpError(ErrorCode.InvalidParams, `Cannot update task "${taskId}" from terminal status "${task.status}" to "${status}". Terminal states (completed, failed, cancelled) cannot transition to other states.`);
        }
        await taskStore.updateTaskStatus(taskId, status, statusMessage, sessionId);
        const updatedTask = await taskStore.getTask(taskId, sessionId);
        if (updatedTask) {
          const notification = TaskStatusNotificationSchema.parse({
            method: "notifications/tasks/status",
            params: updatedTask
          });
          await this.notification(notification);
          if (isTerminal(updatedTask.status)) {
            this._cleanupTaskProgressHandler(taskId);
          }
        }
      },
      listTasks: (cursor) => {
        return taskStore.listTasks(cursor, sessionId);
      }
    };
  }
}
function isPlainObject2(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function mergeCapabilities(base, additional) {
  const result = { ...base };
  for (const key in additional) {
    const k = key;
    const addValue = additional[k];
    if (addValue === undefined)
      continue;
    const baseValue = result[k];
    if (isPlainObject2(baseValue) && isPlainObject2(addValue)) {
      result[k] = { ...baseValue, ...addValue };
    } else {
      result[k] = addValue;
    }
  }
  return result;
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/validation/ajv-provider.js
var import_ajv = __toESM(require_ajv(), 1);
var import_ajv_formats = __toESM(require_dist(), 1);
function createDefaultAjvInstance() {
  const ajv = new import_ajv.default({
    strict: false,
    validateFormats: true,
    validateSchema: false,
    allErrors: true
  });
  const addFormats = import_ajv_formats.default;
  addFormats(ajv);
  return ajv;
}

class AjvJsonSchemaValidator {
  constructor(ajv) {
    this._ajv = ajv ?? createDefaultAjvInstance();
  }
  getValidator(schema) {
    const ajvValidator = "$id" in schema && typeof schema.$id === "string" ? this._ajv.getSchema(schema.$id) ?? this._ajv.compile(schema) : this._ajv.compile(schema);
    return (input) => {
      const valid = ajvValidator(input);
      if (valid) {
        return {
          valid: true,
          data: input,
          errorMessage: undefined
        };
      } else {
        return {
          valid: false,
          data: undefined,
          errorMessage: this._ajv.errorsText(ajvValidator.errors)
        };
      }
    };
  }
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/experimental/tasks/server.js
class ExperimentalServerTasks {
  constructor(_server) {
    this._server = _server;
  }
  requestStream(request, resultSchema, options) {
    return this._server.requestStream(request, resultSchema, options);
  }
  createMessageStream(params, options) {
    const clientCapabilities = this._server.getClientCapabilities();
    if ((params.tools || params.toolChoice) && !clientCapabilities?.sampling?.tools) {
      throw new Error("Client does not support sampling tools capability.");
    }
    if (params.messages.length > 0) {
      const lastMessage = params.messages[params.messages.length - 1];
      const lastContent = Array.isArray(lastMessage.content) ? lastMessage.content : [lastMessage.content];
      const hasToolResults = lastContent.some((c) => c.type === "tool_result");
      const previousMessage = params.messages.length > 1 ? params.messages[params.messages.length - 2] : undefined;
      const previousContent = previousMessage ? Array.isArray(previousMessage.content) ? previousMessage.content : [previousMessage.content] : [];
      const hasPreviousToolUse = previousContent.some((c) => c.type === "tool_use");
      if (hasToolResults) {
        if (lastContent.some((c) => c.type !== "tool_result")) {
          throw new Error("The last message must contain only tool_result content if any is present");
        }
        if (!hasPreviousToolUse) {
          throw new Error("tool_result blocks are not matching any tool_use from the previous message");
        }
      }
      if (hasPreviousToolUse) {
        const toolUseIds = new Set(previousContent.filter((c) => c.type === "tool_use").map((c) => c.id));
        const toolResultIds = new Set(lastContent.filter((c) => c.type === "tool_result").map((c) => c.toolUseId));
        if (toolUseIds.size !== toolResultIds.size || ![...toolUseIds].every((id) => toolResultIds.has(id))) {
          throw new Error("ids of tool_result blocks and tool_use blocks from previous message do not match");
        }
      }
    }
    return this.requestStream({
      method: "sampling/createMessage",
      params
    }, CreateMessageResultSchema, options);
  }
  elicitInputStream(params, options) {
    const clientCapabilities = this._server.getClientCapabilities();
    const mode = params.mode ?? "form";
    switch (mode) {
      case "url": {
        if (!clientCapabilities?.elicitation?.url) {
          throw new Error("Client does not support url elicitation.");
        }
        break;
      }
      case "form": {
        if (!clientCapabilities?.elicitation?.form) {
          throw new Error("Client does not support form elicitation.");
        }
        break;
      }
    }
    const normalizedParams = mode === "form" && params.mode === undefined ? { ...params, mode: "form" } : params;
    return this.requestStream({
      method: "elicitation/create",
      params: normalizedParams
    }, ElicitResultSchema, options);
  }
  async getTask(taskId, options) {
    return this._server.getTask({ taskId }, options);
  }
  async getTaskResult(taskId, resultSchema, options) {
    return this._server.getTaskResult({ taskId }, resultSchema, options);
  }
  async listTasks(cursor, options) {
    return this._server.listTasks(cursor ? { cursor } : undefined, options);
  }
  async cancelTask(taskId, options) {
    return this._server.cancelTask({ taskId }, options);
  }
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/experimental/tasks/helpers.js
function assertToolsCallTaskCapability(requests, method, entityName) {
  if (!requests) {
    throw new Error(`${entityName} does not support task creation (required for ${method})`);
  }
  switch (method) {
    case "tools/call":
      if (!requests.tools?.call) {
        throw new Error(`${entityName} does not support task creation for tools/call (required for ${method})`);
      }
      break;
    default:
      break;
  }
}
function assertClientRequestTaskCapability(requests, method, entityName) {
  if (!requests) {
    throw new Error(`${entityName} does not support task creation (required for ${method})`);
  }
  switch (method) {
    case "sampling/createMessage":
      if (!requests.sampling?.createMessage) {
        throw new Error(`${entityName} does not support task creation for sampling/createMessage (required for ${method})`);
      }
      break;
    case "elicitation/create":
      if (!requests.elicitation?.create) {
        throw new Error(`${entityName} does not support task creation for elicitation/create (required for ${method})`);
      }
      break;
    default:
      break;
  }
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/server/index.js
class Server extends Protocol {
  constructor(_serverInfo, options) {
    super(options);
    this._serverInfo = _serverInfo;
    this._loggingLevels = new Map;
    this.LOG_LEVEL_SEVERITY = new Map(LoggingLevelSchema.options.map((level, index) => [level, index]));
    this.isMessageIgnored = (level, sessionId) => {
      const currentLevel = this._loggingLevels.get(sessionId);
      return currentLevel ? this.LOG_LEVEL_SEVERITY.get(level) < this.LOG_LEVEL_SEVERITY.get(currentLevel) : false;
    };
    this._capabilities = options?.capabilities ?? {};
    this._instructions = options?.instructions;
    this._jsonSchemaValidator = options?.jsonSchemaValidator ?? new AjvJsonSchemaValidator;
    this.setRequestHandler(InitializeRequestSchema, (request) => this._oninitialize(request));
    this.setNotificationHandler(InitializedNotificationSchema, () => this.oninitialized?.());
    if (this._capabilities.logging) {
      this.setRequestHandler(SetLevelRequestSchema, async (request, extra) => {
        const transportSessionId = extra.sessionId || extra.requestInfo?.headers["mcp-session-id"] || undefined;
        const { level } = request.params;
        const parseResult = LoggingLevelSchema.safeParse(level);
        if (parseResult.success) {
          this._loggingLevels.set(transportSessionId, parseResult.data);
        }
        return {};
      });
    }
  }
  get experimental() {
    if (!this._experimental) {
      this._experimental = {
        tasks: new ExperimentalServerTasks(this)
      };
    }
    return this._experimental;
  }
  registerCapabilities(capabilities) {
    if (this.transport) {
      throw new Error("Cannot register capabilities after connecting to transport");
    }
    this._capabilities = mergeCapabilities(this._capabilities, capabilities);
  }
  setRequestHandler(requestSchema, handler) {
    const shape = getObjectShape(requestSchema);
    const methodSchema = shape?.method;
    if (!methodSchema) {
      throw new Error("Schema is missing a method literal");
    }
    let methodValue;
    if (isZ4Schema(methodSchema)) {
      const v4Schema = methodSchema;
      const v4Def = v4Schema._zod?.def;
      methodValue = v4Def?.value ?? v4Schema.value;
    } else {
      const v3Schema = methodSchema;
      const legacyDef = v3Schema._def;
      methodValue = legacyDef?.value ?? v3Schema.value;
    }
    if (typeof methodValue !== "string") {
      throw new Error("Schema method literal must be a string");
    }
    const method = methodValue;
    if (method === "tools/call") {
      const wrappedHandler = async (request, extra) => {
        const validatedRequest = safeParse2(CallToolRequestSchema, request);
        if (!validatedRequest.success) {
          const errorMessage = validatedRequest.error instanceof Error ? validatedRequest.error.message : String(validatedRequest.error);
          throw new McpError(ErrorCode.InvalidParams, `Invalid tools/call request: ${errorMessage}`);
        }
        const { params } = validatedRequest.data;
        const result = await Promise.resolve(handler(request, extra));
        if (params.task) {
          const taskValidationResult = safeParse2(CreateTaskResultSchema, result);
          if (!taskValidationResult.success) {
            const errorMessage = taskValidationResult.error instanceof Error ? taskValidationResult.error.message : String(taskValidationResult.error);
            throw new McpError(ErrorCode.InvalidParams, `Invalid task creation result: ${errorMessage}`);
          }
          return taskValidationResult.data;
        }
        const validationResult = safeParse2(CallToolResultSchema, result);
        if (!validationResult.success) {
          const errorMessage = validationResult.error instanceof Error ? validationResult.error.message : String(validationResult.error);
          throw new McpError(ErrorCode.InvalidParams, `Invalid tools/call result: ${errorMessage}`);
        }
        return validationResult.data;
      };
      return super.setRequestHandler(requestSchema, wrappedHandler);
    }
    return super.setRequestHandler(requestSchema, handler);
  }
  assertCapabilityForMethod(method) {
    switch (method) {
      case "sampling/createMessage":
        if (!this._clientCapabilities?.sampling) {
          throw new Error(`Client does not support sampling (required for ${method})`);
        }
        break;
      case "elicitation/create":
        if (!this._clientCapabilities?.elicitation) {
          throw new Error(`Client does not support elicitation (required for ${method})`);
        }
        break;
      case "roots/list":
        if (!this._clientCapabilities?.roots) {
          throw new Error(`Client does not support listing roots (required for ${method})`);
        }
        break;
      case "ping":
        break;
    }
  }
  assertNotificationCapability(method) {
    switch (method) {
      case "notifications/message":
        if (!this._capabilities.logging) {
          throw new Error(`Server does not support logging (required for ${method})`);
        }
        break;
      case "notifications/resources/updated":
      case "notifications/resources/list_changed":
        if (!this._capabilities.resources) {
          throw new Error(`Server does not support notifying about resources (required for ${method})`);
        }
        break;
      case "notifications/tools/list_changed":
        if (!this._capabilities.tools) {
          throw new Error(`Server does not support notifying of tool list changes (required for ${method})`);
        }
        break;
      case "notifications/prompts/list_changed":
        if (!this._capabilities.prompts) {
          throw new Error(`Server does not support notifying of prompt list changes (required for ${method})`);
        }
        break;
      case "notifications/elicitation/complete":
        if (!this._clientCapabilities?.elicitation?.url) {
          throw new Error(`Client does not support URL elicitation (required for ${method})`);
        }
        break;
      case "notifications/cancelled":
        break;
      case "notifications/progress":
        break;
    }
  }
  assertRequestHandlerCapability(method) {
    if (!this._capabilities) {
      return;
    }
    switch (method) {
      case "completion/complete":
        if (!this._capabilities.completions) {
          throw new Error(`Server does not support completions (required for ${method})`);
        }
        break;
      case "logging/setLevel":
        if (!this._capabilities.logging) {
          throw new Error(`Server does not support logging (required for ${method})`);
        }
        break;
      case "prompts/get":
      case "prompts/list":
        if (!this._capabilities.prompts) {
          throw new Error(`Server does not support prompts (required for ${method})`);
        }
        break;
      case "resources/list":
      case "resources/templates/list":
      case "resources/read":
        if (!this._capabilities.resources) {
          throw new Error(`Server does not support resources (required for ${method})`);
        }
        break;
      case "tools/call":
      case "tools/list":
        if (!this._capabilities.tools) {
          throw new Error(`Server does not support tools (required for ${method})`);
        }
        break;
      case "tasks/get":
      case "tasks/list":
      case "tasks/result":
      case "tasks/cancel":
        if (!this._capabilities.tasks) {
          throw new Error(`Server does not support tasks capability (required for ${method})`);
        }
        break;
      case "ping":
      case "initialize":
        break;
    }
  }
  assertTaskCapability(method) {
    assertClientRequestTaskCapability(this._clientCapabilities?.tasks?.requests, method, "Client");
  }
  assertTaskHandlerCapability(method) {
    if (!this._capabilities) {
      return;
    }
    assertToolsCallTaskCapability(this._capabilities.tasks?.requests, method, "Server");
  }
  async _oninitialize(request) {
    const requestedVersion = request.params.protocolVersion;
    this._clientCapabilities = request.params.capabilities;
    this._clientVersion = request.params.clientInfo;
    const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requestedVersion) ? requestedVersion : LATEST_PROTOCOL_VERSION;
    return {
      protocolVersion,
      capabilities: this.getCapabilities(),
      serverInfo: this._serverInfo,
      ...this._instructions && { instructions: this._instructions }
    };
  }
  getClientCapabilities() {
    return this._clientCapabilities;
  }
  getClientVersion() {
    return this._clientVersion;
  }
  getCapabilities() {
    return this._capabilities;
  }
  async ping() {
    return this.request({ method: "ping" }, EmptyResultSchema);
  }
  async createMessage(params, options) {
    if (params.tools || params.toolChoice) {
      if (!this._clientCapabilities?.sampling?.tools) {
        throw new Error("Client does not support sampling tools capability.");
      }
    }
    if (params.messages.length > 0) {
      const lastMessage = params.messages[params.messages.length - 1];
      const lastContent = Array.isArray(lastMessage.content) ? lastMessage.content : [lastMessage.content];
      const hasToolResults = lastContent.some((c) => c.type === "tool_result");
      const previousMessage = params.messages.length > 1 ? params.messages[params.messages.length - 2] : undefined;
      const previousContent = previousMessage ? Array.isArray(previousMessage.content) ? previousMessage.content : [previousMessage.content] : [];
      const hasPreviousToolUse = previousContent.some((c) => c.type === "tool_use");
      if (hasToolResults) {
        if (lastContent.some((c) => c.type !== "tool_result")) {
          throw new Error("The last message must contain only tool_result content if any is present");
        }
        if (!hasPreviousToolUse) {
          throw new Error("tool_result blocks are not matching any tool_use from the previous message");
        }
      }
      if (hasPreviousToolUse) {
        const toolUseIds = new Set(previousContent.filter((c) => c.type === "tool_use").map((c) => c.id));
        const toolResultIds = new Set(lastContent.filter((c) => c.type === "tool_result").map((c) => c.toolUseId));
        if (toolUseIds.size !== toolResultIds.size || ![...toolUseIds].every((id) => toolResultIds.has(id))) {
          throw new Error("ids of tool_result blocks and tool_use blocks from previous message do not match");
        }
      }
    }
    if (params.tools) {
      return this.request({ method: "sampling/createMessage", params }, CreateMessageResultWithToolsSchema, options);
    }
    return this.request({ method: "sampling/createMessage", params }, CreateMessageResultSchema, options);
  }
  async elicitInput(params, options) {
    const mode = params.mode ?? "form";
    switch (mode) {
      case "url": {
        if (!this._clientCapabilities?.elicitation?.url) {
          throw new Error("Client does not support url elicitation.");
        }
        const urlParams = params;
        return this.request({ method: "elicitation/create", params: urlParams }, ElicitResultSchema, options);
      }
      case "form": {
        if (!this._clientCapabilities?.elicitation?.form) {
          throw new Error("Client does not support form elicitation.");
        }
        const formParams = params.mode === "form" ? params : { ...params, mode: "form" };
        const result = await this.request({ method: "elicitation/create", params: formParams }, ElicitResultSchema, options);
        if (result.action === "accept" && result.content && formParams.requestedSchema) {
          try {
            const validator = this._jsonSchemaValidator.getValidator(formParams.requestedSchema);
            const validationResult = validator(result.content);
            if (!validationResult.valid) {
              throw new McpError(ErrorCode.InvalidParams, `Elicitation response content does not match requested schema: ${validationResult.errorMessage}`);
            }
          } catch (error2) {
            if (error2 instanceof McpError) {
              throw error2;
            }
            throw new McpError(ErrorCode.InternalError, `Error validating elicitation response: ${error2 instanceof Error ? error2.message : String(error2)}`);
          }
        }
        return result;
      }
    }
  }
  createElicitationCompletionNotifier(elicitationId, options) {
    if (!this._clientCapabilities?.elicitation?.url) {
      throw new Error("Client does not support URL elicitation (required for notifications/elicitation/complete)");
    }
    return () => this.notification({
      method: "notifications/elicitation/complete",
      params: {
        elicitationId
      }
    }, options);
  }
  async listRoots(params, options) {
    return this.request({ method: "roots/list", params }, ListRootsResultSchema, options);
  }
  async sendLoggingMessage(params, sessionId) {
    if (this._capabilities.logging) {
      if (!this.isMessageIgnored(params.level, sessionId)) {
        return this.notification({ method: "notifications/message", params });
      }
    }
  }
  async sendResourceUpdated(params) {
    return this.notification({
      method: "notifications/resources/updated",
      params
    });
  }
  async sendResourceListChanged() {
    return this.notification({
      method: "notifications/resources/list_changed"
    });
  }
  async sendToolListChanged() {
    return this.notification({ method: "notifications/tools/list_changed" });
  }
  async sendPromptListChanged() {
    return this.notification({ method: "notifications/prompts/list_changed" });
  }
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/server/completable.js
var COMPLETABLE_SYMBOL = Symbol.for("mcp.completable");
function isCompletable(schema) {
  return !!schema && typeof schema === "object" && COMPLETABLE_SYMBOL in schema;
}
function getCompleter(schema) {
  const meta = schema[COMPLETABLE_SYMBOL];
  return meta?.complete;
}
var McpZodTypeKind;
(function(McpZodTypeKind2) {
  McpZodTypeKind2["Completable"] = "McpCompletable";
})(McpZodTypeKind || (McpZodTypeKind = {}));

// node_modules/@modelcontextprotocol/sdk/dist/esm/shared/toolNameValidation.js
var TOOL_NAME_REGEX = /^[A-Za-z0-9._-]{1,128}$/;
function validateToolName(name) {
  const warnings = [];
  if (name.length === 0) {
    return {
      isValid: false,
      warnings: ["Tool name cannot be empty"]
    };
  }
  if (name.length > 128) {
    return {
      isValid: false,
      warnings: [`Tool name exceeds maximum length of 128 characters (current: ${name.length})`]
    };
  }
  if (name.includes(" ")) {
    warnings.push("Tool name contains spaces, which may cause parsing issues");
  }
  if (name.includes(",")) {
    warnings.push("Tool name contains commas, which may cause parsing issues");
  }
  if (name.startsWith("-") || name.endsWith("-")) {
    warnings.push("Tool name starts or ends with a dash, which may cause parsing issues in some contexts");
  }
  if (name.startsWith(".") || name.endsWith(".")) {
    warnings.push("Tool name starts or ends with a dot, which may cause parsing issues in some contexts");
  }
  if (!TOOL_NAME_REGEX.test(name)) {
    const invalidChars = name.split("").filter((char) => !/[A-Za-z0-9._-]/.test(char)).filter((char, index, arr) => arr.indexOf(char) === index);
    warnings.push(`Tool name contains invalid characters: ${invalidChars.map((c) => `"${c}"`).join(", ")}`, "Allowed characters are: A-Z, a-z, 0-9, underscore (_), dash (-), and dot (.)");
    return {
      isValid: false,
      warnings
    };
  }
  return {
    isValid: true,
    warnings
  };
}
function issueToolNameWarning(name, warnings) {
  if (warnings.length > 0) {
    console.warn(`Tool name validation warning for "${name}":`);
    for (const warning of warnings) {
      console.warn(`  - ${warning}`);
    }
    console.warn("Tool registration will proceed, but this may cause compatibility issues.");
    console.warn("Consider updating the tool name to conform to the MCP tool naming standard.");
    console.warn("See SEP: Specify Format for Tool Names (https://github.com/modelcontextprotocol/modelcontextprotocol/issues/986) for more details.");
  }
}
function validateAndWarnToolName(name) {
  const result = validateToolName(name);
  issueToolNameWarning(name, result.warnings);
  return result.isValid;
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/experimental/tasks/mcp-server.js
class ExperimentalMcpServerTasks {
  constructor(_mcpServer) {
    this._mcpServer = _mcpServer;
  }
  registerToolTask(name, config2, handler) {
    const execution = { taskSupport: "required", ...config2.execution };
    if (execution.taskSupport === "forbidden") {
      throw new Error(`Cannot register task-based tool '${name}' with taskSupport 'forbidden'. Use registerTool() instead.`);
    }
    const mcpServerInternal = this._mcpServer;
    return mcpServerInternal._createRegisteredTool(name, config2.title, config2.description, config2.inputSchema, config2.outputSchema, config2.annotations, execution, config2._meta, handler);
  }
}
// node_modules/@modelcontextprotocol/sdk/dist/esm/server/mcp.js
class McpServer {
  constructor(serverInfo, options) {
    this._registeredResources = {};
    this._registeredResourceTemplates = {};
    this._registeredTools = {};
    this._registeredPrompts = {};
    this._toolHandlersInitialized = false;
    this._completionHandlerInitialized = false;
    this._resourceHandlersInitialized = false;
    this._promptHandlersInitialized = false;
    this.server = new Server(serverInfo, options);
  }
  get experimental() {
    if (!this._experimental) {
      this._experimental = {
        tasks: new ExperimentalMcpServerTasks(this)
      };
    }
    return this._experimental;
  }
  async connect(transport) {
    return await this.server.connect(transport);
  }
  async close() {
    await this.server.close();
  }
  setToolRequestHandlers() {
    if (this._toolHandlersInitialized) {
      return;
    }
    this.server.assertCanSetRequestHandler(getMethodValue(ListToolsRequestSchema));
    this.server.assertCanSetRequestHandler(getMethodValue(CallToolRequestSchema));
    this.server.registerCapabilities({
      tools: {
        listChanged: true
      }
    });
    this.server.setRequestHandler(ListToolsRequestSchema, () => ({
      tools: Object.entries(this._registeredTools).filter(([, tool]) => tool.enabled).map(([name, tool]) => {
        const toolDefinition = {
          name,
          title: tool.title,
          description: tool.description,
          inputSchema: (() => {
            const obj = normalizeObjectSchema(tool.inputSchema);
            return obj ? toJsonSchemaCompat(obj, {
              strictUnions: true,
              pipeStrategy: "input"
            }) : EMPTY_OBJECT_JSON_SCHEMA;
          })(),
          annotations: tool.annotations,
          execution: tool.execution,
          _meta: tool._meta
        };
        if (tool.outputSchema) {
          const obj = normalizeObjectSchema(tool.outputSchema);
          if (obj) {
            toolDefinition.outputSchema = toJsonSchemaCompat(obj, {
              strictUnions: true,
              pipeStrategy: "output"
            });
          }
        }
        return toolDefinition;
      })
    }));
    this.server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
      try {
        const tool = this._registeredTools[request.params.name];
        if (!tool) {
          throw new McpError(ErrorCode.InvalidParams, `Tool ${request.params.name} not found`);
        }
        if (!tool.enabled) {
          throw new McpError(ErrorCode.InvalidParams, `Tool ${request.params.name} disabled`);
        }
        const isTaskRequest = !!request.params.task;
        const taskSupport = tool.execution?.taskSupport;
        const isTaskHandler = "createTask" in tool.handler;
        if ((taskSupport === "required" || taskSupport === "optional") && !isTaskHandler) {
          throw new McpError(ErrorCode.InternalError, `Tool ${request.params.name} has taskSupport '${taskSupport}' but was not registered with registerToolTask`);
        }
        if (taskSupport === "required" && !isTaskRequest) {
          throw new McpError(ErrorCode.MethodNotFound, `Tool ${request.params.name} requires task augmentation (taskSupport: 'required')`);
        }
        if (taskSupport === "optional" && !isTaskRequest && isTaskHandler) {
          return await this.handleAutomaticTaskPolling(tool, request, extra);
        }
        const args = await this.validateToolInput(tool, request.params.arguments, request.params.name);
        const result = await this.executeToolHandler(tool, args, extra);
        if (isTaskRequest) {
          return result;
        }
        await this.validateToolOutput(tool, result, request.params.name);
        return result;
      } catch (error2) {
        if (error2 instanceof McpError) {
          if (error2.code === ErrorCode.UrlElicitationRequired) {
            throw error2;
          }
        }
        return this.createToolError(error2 instanceof Error ? error2.message : String(error2));
      }
    });
    this._toolHandlersInitialized = true;
  }
  createToolError(errorMessage) {
    return {
      content: [
        {
          type: "text",
          text: errorMessage
        }
      ],
      isError: true
    };
  }
  async validateToolInput(tool, args, toolName) {
    if (!tool.inputSchema) {
      return;
    }
    const inputObj = normalizeObjectSchema(tool.inputSchema);
    const schemaToParse = inputObj ?? tool.inputSchema;
    const parseResult = await safeParseAsync2(schemaToParse, args);
    if (!parseResult.success) {
      const error2 = "error" in parseResult ? parseResult.error : "Unknown error";
      const errorMessage = getParseErrorMessage(error2);
      throw new McpError(ErrorCode.InvalidParams, `Input validation error: Invalid arguments for tool ${toolName}: ${errorMessage}`);
    }
    return parseResult.data;
  }
  async validateToolOutput(tool, result, toolName) {
    if (!tool.outputSchema) {
      return;
    }
    if (!("content" in result)) {
      return;
    }
    if (result.isError) {
      return;
    }
    if (!result.structuredContent) {
      throw new McpError(ErrorCode.InvalidParams, `Output validation error: Tool ${toolName} has an output schema but no structured content was provided`);
    }
    const outputObj = normalizeObjectSchema(tool.outputSchema);
    const parseResult = await safeParseAsync2(outputObj, result.structuredContent);
    if (!parseResult.success) {
      const error2 = "error" in parseResult ? parseResult.error : "Unknown error";
      const errorMessage = getParseErrorMessage(error2);
      throw new McpError(ErrorCode.InvalidParams, `Output validation error: Invalid structured content for tool ${toolName}: ${errorMessage}`);
    }
  }
  async executeToolHandler(tool, args, extra) {
    const handler = tool.handler;
    const isTaskHandler = "createTask" in handler;
    if (isTaskHandler) {
      if (!extra.taskStore) {
        throw new Error("No task store provided.");
      }
      const taskExtra = { ...extra, taskStore: extra.taskStore };
      if (tool.inputSchema) {
        const typedHandler = handler;
        return await Promise.resolve(typedHandler.createTask(args, taskExtra));
      } else {
        const typedHandler = handler;
        return await Promise.resolve(typedHandler.createTask(taskExtra));
      }
    }
    if (tool.inputSchema) {
      const typedHandler = handler;
      return await Promise.resolve(typedHandler(args, extra));
    } else {
      const typedHandler = handler;
      return await Promise.resolve(typedHandler(extra));
    }
  }
  async handleAutomaticTaskPolling(tool, request, extra) {
    if (!extra.taskStore) {
      throw new Error("No task store provided for task-capable tool.");
    }
    const args = await this.validateToolInput(tool, request.params.arguments, request.params.name);
    const handler = tool.handler;
    const taskExtra = { ...extra, taskStore: extra.taskStore };
    const createTaskResult = args ? await Promise.resolve(handler.createTask(args, taskExtra)) : await Promise.resolve(handler.createTask(taskExtra));
    const taskId = createTaskResult.task.taskId;
    let task = createTaskResult.task;
    const pollInterval = task.pollInterval ?? 5000;
    while (task.status !== "completed" && task.status !== "failed" && task.status !== "cancelled") {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
      const updatedTask = await extra.taskStore.getTask(taskId);
      if (!updatedTask) {
        throw new McpError(ErrorCode.InternalError, `Task ${taskId} not found during polling`);
      }
      task = updatedTask;
    }
    return await extra.taskStore.getTaskResult(taskId);
  }
  setCompletionRequestHandler() {
    if (this._completionHandlerInitialized) {
      return;
    }
    this.server.assertCanSetRequestHandler(getMethodValue(CompleteRequestSchema));
    this.server.registerCapabilities({
      completions: {}
    });
    this.server.setRequestHandler(CompleteRequestSchema, async (request) => {
      switch (request.params.ref.type) {
        case "ref/prompt":
          assertCompleteRequestPrompt(request);
          return this.handlePromptCompletion(request, request.params.ref);
        case "ref/resource":
          assertCompleteRequestResourceTemplate(request);
          return this.handleResourceCompletion(request, request.params.ref);
        default:
          throw new McpError(ErrorCode.InvalidParams, `Invalid completion reference: ${request.params.ref}`);
      }
    });
    this._completionHandlerInitialized = true;
  }
  async handlePromptCompletion(request, ref) {
    const prompt = this._registeredPrompts[ref.name];
    if (!prompt) {
      throw new McpError(ErrorCode.InvalidParams, `Prompt ${ref.name} not found`);
    }
    if (!prompt.enabled) {
      throw new McpError(ErrorCode.InvalidParams, `Prompt ${ref.name} disabled`);
    }
    if (!prompt.argsSchema) {
      return EMPTY_COMPLETION_RESULT;
    }
    const promptShape = getObjectShape(prompt.argsSchema);
    const field = promptShape?.[request.params.argument.name];
    if (!isCompletable(field)) {
      return EMPTY_COMPLETION_RESULT;
    }
    const completer = getCompleter(field);
    if (!completer) {
      return EMPTY_COMPLETION_RESULT;
    }
    const suggestions = await completer(request.params.argument.value, request.params.context);
    return createCompletionResult(suggestions);
  }
  async handleResourceCompletion(request, ref) {
    const template = Object.values(this._registeredResourceTemplates).find((t) => t.resourceTemplate.uriTemplate.toString() === ref.uri);
    if (!template) {
      if (this._registeredResources[ref.uri]) {
        return EMPTY_COMPLETION_RESULT;
      }
      throw new McpError(ErrorCode.InvalidParams, `Resource template ${request.params.ref.uri} not found`);
    }
    const completer = template.resourceTemplate.completeCallback(request.params.argument.name);
    if (!completer) {
      return EMPTY_COMPLETION_RESULT;
    }
    const suggestions = await completer(request.params.argument.value, request.params.context);
    return createCompletionResult(suggestions);
  }
  setResourceRequestHandlers() {
    if (this._resourceHandlersInitialized) {
      return;
    }
    this.server.assertCanSetRequestHandler(getMethodValue(ListResourcesRequestSchema));
    this.server.assertCanSetRequestHandler(getMethodValue(ListResourceTemplatesRequestSchema));
    this.server.assertCanSetRequestHandler(getMethodValue(ReadResourceRequestSchema));
    this.server.registerCapabilities({
      resources: {
        listChanged: true
      }
    });
    this.server.setRequestHandler(ListResourcesRequestSchema, async (request, extra) => {
      const resources = Object.entries(this._registeredResources).filter(([_, resource]) => resource.enabled).map(([uri, resource]) => ({
        uri,
        name: resource.name,
        ...resource.metadata
      }));
      const templateResources = [];
      for (const template of Object.values(this._registeredResourceTemplates)) {
        if (!template.resourceTemplate.listCallback) {
          continue;
        }
        const result = await template.resourceTemplate.listCallback(extra);
        for (const resource of result.resources) {
          templateResources.push({
            ...template.metadata,
            ...resource
          });
        }
      }
      return { resources: [...resources, ...templateResources] };
    });
    this.server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
      const resourceTemplates = Object.entries(this._registeredResourceTemplates).map(([name, template]) => ({
        name,
        uriTemplate: template.resourceTemplate.uriTemplate.toString(),
        ...template.metadata
      }));
      return { resourceTemplates };
    });
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request, extra) => {
      const uri = new URL(request.params.uri);
      const resource = this._registeredResources[uri.toString()];
      if (resource) {
        if (!resource.enabled) {
          throw new McpError(ErrorCode.InvalidParams, `Resource ${uri} disabled`);
        }
        return resource.readCallback(uri, extra);
      }
      for (const template of Object.values(this._registeredResourceTemplates)) {
        const variables = template.resourceTemplate.uriTemplate.match(uri.toString());
        if (variables) {
          return template.readCallback(uri, variables, extra);
        }
      }
      throw new McpError(ErrorCode.InvalidParams, `Resource ${uri} not found`);
    });
    this._resourceHandlersInitialized = true;
  }
  setPromptRequestHandlers() {
    if (this._promptHandlersInitialized) {
      return;
    }
    this.server.assertCanSetRequestHandler(getMethodValue(ListPromptsRequestSchema));
    this.server.assertCanSetRequestHandler(getMethodValue(GetPromptRequestSchema));
    this.server.registerCapabilities({
      prompts: {
        listChanged: true
      }
    });
    this.server.setRequestHandler(ListPromptsRequestSchema, () => ({
      prompts: Object.entries(this._registeredPrompts).filter(([, prompt]) => prompt.enabled).map(([name, prompt]) => {
        return {
          name,
          title: prompt.title,
          description: prompt.description,
          arguments: prompt.argsSchema ? promptArgumentsFromSchema(prompt.argsSchema) : undefined
        };
      })
    }));
    this.server.setRequestHandler(GetPromptRequestSchema, async (request, extra) => {
      const prompt = this._registeredPrompts[request.params.name];
      if (!prompt) {
        throw new McpError(ErrorCode.InvalidParams, `Prompt ${request.params.name} not found`);
      }
      if (!prompt.enabled) {
        throw new McpError(ErrorCode.InvalidParams, `Prompt ${request.params.name} disabled`);
      }
      if (prompt.argsSchema) {
        const argsObj = normalizeObjectSchema(prompt.argsSchema);
        const parseResult = await safeParseAsync2(argsObj, request.params.arguments);
        if (!parseResult.success) {
          const error2 = "error" in parseResult ? parseResult.error : "Unknown error";
          const errorMessage = getParseErrorMessage(error2);
          throw new McpError(ErrorCode.InvalidParams, `Invalid arguments for prompt ${request.params.name}: ${errorMessage}`);
        }
        const args = parseResult.data;
        const cb = prompt.callback;
        return await Promise.resolve(cb(args, extra));
      } else {
        const cb = prompt.callback;
        return await Promise.resolve(cb(extra));
      }
    });
    this._promptHandlersInitialized = true;
  }
  resource(name, uriOrTemplate, ...rest) {
    let metadata;
    if (typeof rest[0] === "object") {
      metadata = rest.shift();
    }
    const readCallback = rest[0];
    if (typeof uriOrTemplate === "string") {
      if (this._registeredResources[uriOrTemplate]) {
        throw new Error(`Resource ${uriOrTemplate} is already registered`);
      }
      const registeredResource = this._createRegisteredResource(name, undefined, uriOrTemplate, metadata, readCallback);
      this.setResourceRequestHandlers();
      this.sendResourceListChanged();
      return registeredResource;
    } else {
      if (this._registeredResourceTemplates[name]) {
        throw new Error(`Resource template ${name} is already registered`);
      }
      const registeredResourceTemplate = this._createRegisteredResourceTemplate(name, undefined, uriOrTemplate, metadata, readCallback);
      this.setResourceRequestHandlers();
      this.sendResourceListChanged();
      return registeredResourceTemplate;
    }
  }
  registerResource(name, uriOrTemplate, config2, readCallback) {
    if (typeof uriOrTemplate === "string") {
      if (this._registeredResources[uriOrTemplate]) {
        throw new Error(`Resource ${uriOrTemplate} is already registered`);
      }
      const registeredResource = this._createRegisteredResource(name, config2.title, uriOrTemplate, config2, readCallback);
      this.setResourceRequestHandlers();
      this.sendResourceListChanged();
      return registeredResource;
    } else {
      if (this._registeredResourceTemplates[name]) {
        throw new Error(`Resource template ${name} is already registered`);
      }
      const registeredResourceTemplate = this._createRegisteredResourceTemplate(name, config2.title, uriOrTemplate, config2, readCallback);
      this.setResourceRequestHandlers();
      this.sendResourceListChanged();
      return registeredResourceTemplate;
    }
  }
  _createRegisteredResource(name, title, uri, metadata, readCallback) {
    const registeredResource = {
      name,
      title,
      metadata,
      readCallback,
      enabled: true,
      disable: () => registeredResource.update({ enabled: false }),
      enable: () => registeredResource.update({ enabled: true }),
      remove: () => registeredResource.update({ uri: null }),
      update: (updates) => {
        if (typeof updates.uri !== "undefined" && updates.uri !== uri) {
          delete this._registeredResources[uri];
          if (updates.uri)
            this._registeredResources[updates.uri] = registeredResource;
        }
        if (typeof updates.name !== "undefined")
          registeredResource.name = updates.name;
        if (typeof updates.title !== "undefined")
          registeredResource.title = updates.title;
        if (typeof updates.metadata !== "undefined")
          registeredResource.metadata = updates.metadata;
        if (typeof updates.callback !== "undefined")
          registeredResource.readCallback = updates.callback;
        if (typeof updates.enabled !== "undefined")
          registeredResource.enabled = updates.enabled;
        this.sendResourceListChanged();
      }
    };
    this._registeredResources[uri] = registeredResource;
    return registeredResource;
  }
  _createRegisteredResourceTemplate(name, title, template, metadata, readCallback) {
    const registeredResourceTemplate = {
      resourceTemplate: template,
      title,
      metadata,
      readCallback,
      enabled: true,
      disable: () => registeredResourceTemplate.update({ enabled: false }),
      enable: () => registeredResourceTemplate.update({ enabled: true }),
      remove: () => registeredResourceTemplate.update({ name: null }),
      update: (updates) => {
        if (typeof updates.name !== "undefined" && updates.name !== name) {
          delete this._registeredResourceTemplates[name];
          if (updates.name)
            this._registeredResourceTemplates[updates.name] = registeredResourceTemplate;
        }
        if (typeof updates.title !== "undefined")
          registeredResourceTemplate.title = updates.title;
        if (typeof updates.template !== "undefined")
          registeredResourceTemplate.resourceTemplate = updates.template;
        if (typeof updates.metadata !== "undefined")
          registeredResourceTemplate.metadata = updates.metadata;
        if (typeof updates.callback !== "undefined")
          registeredResourceTemplate.readCallback = updates.callback;
        if (typeof updates.enabled !== "undefined")
          registeredResourceTemplate.enabled = updates.enabled;
        this.sendResourceListChanged();
      }
    };
    this._registeredResourceTemplates[name] = registeredResourceTemplate;
    const variableNames = template.uriTemplate.variableNames;
    const hasCompleter = Array.isArray(variableNames) && variableNames.some((v) => !!template.completeCallback(v));
    if (hasCompleter) {
      this.setCompletionRequestHandler();
    }
    return registeredResourceTemplate;
  }
  _createRegisteredPrompt(name, title, description, argsSchema, callback) {
    const registeredPrompt = {
      title,
      description,
      argsSchema: argsSchema === undefined ? undefined : objectFromShape(argsSchema),
      callback,
      enabled: true,
      disable: () => registeredPrompt.update({ enabled: false }),
      enable: () => registeredPrompt.update({ enabled: true }),
      remove: () => registeredPrompt.update({ name: null }),
      update: (updates) => {
        if (typeof updates.name !== "undefined" && updates.name !== name) {
          delete this._registeredPrompts[name];
          if (updates.name)
            this._registeredPrompts[updates.name] = registeredPrompt;
        }
        if (typeof updates.title !== "undefined")
          registeredPrompt.title = updates.title;
        if (typeof updates.description !== "undefined")
          registeredPrompt.description = updates.description;
        if (typeof updates.argsSchema !== "undefined")
          registeredPrompt.argsSchema = objectFromShape(updates.argsSchema);
        if (typeof updates.callback !== "undefined")
          registeredPrompt.callback = updates.callback;
        if (typeof updates.enabled !== "undefined")
          registeredPrompt.enabled = updates.enabled;
        this.sendPromptListChanged();
      }
    };
    this._registeredPrompts[name] = registeredPrompt;
    if (argsSchema) {
      const hasCompletable = Object.values(argsSchema).some((field) => {
        const inner = field instanceof ZodOptional ? field._def?.innerType : field;
        return isCompletable(inner);
      });
      if (hasCompletable) {
        this.setCompletionRequestHandler();
      }
    }
    return registeredPrompt;
  }
  _createRegisteredTool(name, title, description, inputSchema, outputSchema, annotations, execution, _meta, handler) {
    validateAndWarnToolName(name);
    const registeredTool = {
      title,
      description,
      inputSchema: getZodSchemaObject(inputSchema),
      outputSchema: getZodSchemaObject(outputSchema),
      annotations,
      execution,
      _meta,
      handler,
      enabled: true,
      disable: () => registeredTool.update({ enabled: false }),
      enable: () => registeredTool.update({ enabled: true }),
      remove: () => registeredTool.update({ name: null }),
      update: (updates) => {
        if (typeof updates.name !== "undefined" && updates.name !== name) {
          if (typeof updates.name === "string") {
            validateAndWarnToolName(updates.name);
          }
          delete this._registeredTools[name];
          if (updates.name)
            this._registeredTools[updates.name] = registeredTool;
        }
        if (typeof updates.title !== "undefined")
          registeredTool.title = updates.title;
        if (typeof updates.description !== "undefined")
          registeredTool.description = updates.description;
        if (typeof updates.paramsSchema !== "undefined")
          registeredTool.inputSchema = objectFromShape(updates.paramsSchema);
        if (typeof updates.outputSchema !== "undefined")
          registeredTool.outputSchema = objectFromShape(updates.outputSchema);
        if (typeof updates.callback !== "undefined")
          registeredTool.handler = updates.callback;
        if (typeof updates.annotations !== "undefined")
          registeredTool.annotations = updates.annotations;
        if (typeof updates._meta !== "undefined")
          registeredTool._meta = updates._meta;
        if (typeof updates.enabled !== "undefined")
          registeredTool.enabled = updates.enabled;
        this.sendToolListChanged();
      }
    };
    this._registeredTools[name] = registeredTool;
    this.setToolRequestHandlers();
    this.sendToolListChanged();
    return registeredTool;
  }
  tool(name, ...rest) {
    if (this._registeredTools[name]) {
      throw new Error(`Tool ${name} is already registered`);
    }
    let description;
    let inputSchema;
    let outputSchema;
    let annotations;
    if (typeof rest[0] === "string") {
      description = rest.shift();
    }
    if (rest.length > 1) {
      const firstArg = rest[0];
      if (isZodRawShapeCompat(firstArg)) {
        inputSchema = rest.shift();
        if (rest.length > 1 && typeof rest[0] === "object" && rest[0] !== null && !isZodRawShapeCompat(rest[0])) {
          annotations = rest.shift();
        }
      } else if (typeof firstArg === "object" && firstArg !== null) {
        annotations = rest.shift();
      }
    }
    const callback = rest[0];
    return this._createRegisteredTool(name, undefined, description, inputSchema, outputSchema, annotations, { taskSupport: "forbidden" }, undefined, callback);
  }
  registerTool(name, config2, cb) {
    if (this._registeredTools[name]) {
      throw new Error(`Tool ${name} is already registered`);
    }
    const { title, description, inputSchema, outputSchema, annotations, _meta } = config2;
    return this._createRegisteredTool(name, title, description, inputSchema, outputSchema, annotations, { taskSupport: "forbidden" }, _meta, cb);
  }
  prompt(name, ...rest) {
    if (this._registeredPrompts[name]) {
      throw new Error(`Prompt ${name} is already registered`);
    }
    let description;
    if (typeof rest[0] === "string") {
      description = rest.shift();
    }
    let argsSchema;
    if (rest.length > 1) {
      argsSchema = rest.shift();
    }
    const cb = rest[0];
    const registeredPrompt = this._createRegisteredPrompt(name, undefined, description, argsSchema, cb);
    this.setPromptRequestHandlers();
    this.sendPromptListChanged();
    return registeredPrompt;
  }
  registerPrompt(name, config2, cb) {
    if (this._registeredPrompts[name]) {
      throw new Error(`Prompt ${name} is already registered`);
    }
    const { title, description, argsSchema } = config2;
    const registeredPrompt = this._createRegisteredPrompt(name, title, description, argsSchema, cb);
    this.setPromptRequestHandlers();
    this.sendPromptListChanged();
    return registeredPrompt;
  }
  isConnected() {
    return this.server.transport !== undefined;
  }
  async sendLoggingMessage(params, sessionId) {
    return this.server.sendLoggingMessage(params, sessionId);
  }
  sendResourceListChanged() {
    if (this.isConnected()) {
      this.server.sendResourceListChanged();
    }
  }
  sendToolListChanged() {
    if (this.isConnected()) {
      this.server.sendToolListChanged();
    }
  }
  sendPromptListChanged() {
    if (this.isConnected()) {
      this.server.sendPromptListChanged();
    }
  }
}
var EMPTY_OBJECT_JSON_SCHEMA = {
  type: "object",
  properties: {}
};
function isZodTypeLike(value) {
  return value !== null && typeof value === "object" && "parse" in value && typeof value.parse === "function" && "safeParse" in value && typeof value.safeParse === "function";
}
function isZodSchemaInstance(obj) {
  return "_def" in obj || "_zod" in obj || isZodTypeLike(obj);
}
function isZodRawShapeCompat(obj) {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }
  if (isZodSchemaInstance(obj)) {
    return false;
  }
  if (Object.keys(obj).length === 0) {
    return true;
  }
  return Object.values(obj).some(isZodTypeLike);
}
function getZodSchemaObject(schema) {
  if (!schema) {
    return;
  }
  if (isZodRawShapeCompat(schema)) {
    return objectFromShape(schema);
  }
  return schema;
}
function promptArgumentsFromSchema(schema) {
  const shape = getObjectShape(schema);
  if (!shape)
    return [];
  return Object.entries(shape).map(([name, field]) => {
    const description = getSchemaDescription(field);
    const isOptional = isSchemaOptional(field);
    return {
      name,
      description,
      required: !isOptional
    };
  });
}
function getMethodValue(schema) {
  const shape = getObjectShape(schema);
  const methodSchema = shape?.method;
  if (!methodSchema) {
    throw new Error("Schema is missing a method literal");
  }
  const value = getLiteralValue(methodSchema);
  if (typeof value === "string") {
    return value;
  }
  throw new Error("Schema method literal must be a string");
}
function createCompletionResult(suggestions) {
  return {
    completion: {
      values: suggestions.slice(0, 100),
      total: suggestions.length,
      hasMore: suggestions.length > 100
    }
  };
}
var EMPTY_COMPLETION_RESULT = {
  completion: {
    values: [],
    hasMore: false
  }
};

// node_modules/@modelcontextprotocol/sdk/dist/esm/server/stdio.js
import process2 from "process";

// node_modules/@modelcontextprotocol/sdk/dist/esm/shared/stdio.js
class ReadBuffer {
  append(chunk) {
    this._buffer = this._buffer ? Buffer.concat([this._buffer, chunk]) : chunk;
  }
  readMessage() {
    if (!this._buffer) {
      return null;
    }
    const index = this._buffer.indexOf(`
`);
    if (index === -1) {
      return null;
    }
    const line = this._buffer.toString("utf8", 0, index).replace(/\r$/, "");
    this._buffer = this._buffer.subarray(index + 1);
    return deserializeMessage(line);
  }
  clear() {
    this._buffer = undefined;
  }
}
function deserializeMessage(line) {
  return JSONRPCMessageSchema.parse(JSON.parse(line));
}
function serializeMessage(message) {
  return JSON.stringify(message) + `
`;
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/server/stdio.js
class StdioServerTransport {
  constructor(_stdin = process2.stdin, _stdout = process2.stdout) {
    this._stdin = _stdin;
    this._stdout = _stdout;
    this._readBuffer = new ReadBuffer;
    this._started = false;
    this._ondata = (chunk) => {
      this._readBuffer.append(chunk);
      this.processReadBuffer();
    };
    this._onerror = (error2) => {
      this.onerror?.(error2);
    };
  }
  async start() {
    if (this._started) {
      throw new Error("StdioServerTransport already started! If using Server class, note that connect() calls start() automatically.");
    }
    this._started = true;
    this._stdin.on("data", this._ondata);
    this._stdin.on("error", this._onerror);
  }
  processReadBuffer() {
    while (true) {
      try {
        const message = this._readBuffer.readMessage();
        if (message === null) {
          break;
        }
        this.onmessage?.(message);
      } catch (error2) {
        this.onerror?.(error2);
      }
    }
  }
  async close() {
    this._stdin.off("data", this._ondata);
    this._stdin.off("error", this._onerror);
    const remainingDataListeners = this._stdin.listenerCount("data");
    if (remainingDataListeners === 0) {
      this._stdin.pause();
    }
    this._readBuffer.clear();
    this.onclose?.();
  }
  send(message) {
    return new Promise((resolve) => {
      const json = serializeMessage(message);
      if (this._stdout.write(json)) {
        resolve();
      } else {
        this._stdout.once("drain", resolve);
      }
    });
  }
}

// src/lib/clickhouse-client.ts
var import_client = __toESM(require_dist3(), 1);

// src/lib/sql-validation.ts
function validateQuery(sql) {
  const trimmed = sql.trim();
  if (trimmed.length === 0) {
    return { valid: false, reason: "Query cannot be empty" };
  }
  const normalized = trimmed.replace(/\s+/g, " ");
  const tokens = normalized.split(/\s+/);
  const firstToken = tokens[0];
  if (!firstToken) {
    return { valid: false, reason: "Query cannot be empty" };
  }
  if (firstToken.toUpperCase() !== "SELECT") {
    return {
      valid: false,
      reason: `Only SELECT queries are allowed. Query starts with '${firstToken}'`
    };
  }
  const upperNormalized = normalized.toUpperCase();
  if (!/\bLIMIT\s+\d+\b/.test(upperNormalized)) {
    return {
      valid: false,
      reason: "Query must contain a LIMIT clause with a numeric value (e.g., LIMIT 10)"
    };
  }
  if (/;/.test(upperNormalized)) {
    return {
      valid: false,
      reason: "Query cannot contain semicolons (multi-statement execution not allowed)"
    };
  }
  if (/\bUNION\b/i.test(upperNormalized)) {
    return {
      valid: false,
      reason: "Query cannot contain UNION keyword (cross-table access not allowed)"
    };
  }
  if (/\bJOIN\b/i.test(upperNormalized)) {
    return {
      valid: false,
      reason: "Query cannot contain JOIN keyword (table joining not allowed)"
    };
  }
  if (/\bINTO\b/i.test(upperNormalized)) {
    return {
      valid: false,
      reason: "Query cannot contain INTO keyword (data export not allowed)"
    };
  }
  const fromMatch = upperNormalized.match(/\bFROM\s+(\S+)/);
  if (!fromMatch || !fromMatch[1]) {
    return {
      valid: false,
      reason: "Query must contain a FROM clause"
    };
  }
  const tableRef = fromMatch[1];
  const validTables = ["OSPREY_EXECUTION_RESULTS", "DEFAULT.OSPREY_EXECUTION_RESULTS"];
  if (!validTables.includes(tableRef)) {
    return {
      valid: false,
      reason: `Query can only target 'osprey_execution_results' or 'default.osprey_execution_results', but targets '${tableRef}'`
    };
  }
  return { valid: true, normalized };
}

// src/lib/ssh-output-parser.ts
function parseSshOutput(stdout) {
  if (!stdout || typeof stdout !== "string") {
    return { success: false, reason: "Output is empty or not a string" };
  }
  const lines = stdout.split(`
`).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return {
      success: false,
      reason: "Output must have at least 2 lines (column names and types)"
    };
  }
  const columnNames = [];
  const columnTypes = [];
  try {
    const firstLine = lines[0];
    const secondLine = lines[1];
    if (!firstLine || !secondLine) {
      return {
        success: false,
        reason: "Column headers are missing or malformed"
      };
    }
    const namesLine = JSON.parse(firstLine);
    const typesLine = JSON.parse(secondLine);
    if (!Array.isArray(namesLine) || !Array.isArray(typesLine)) {
      return {
        success: false,
        reason: "Column headers must be JSON arrays"
      };
    }
    columnNames.push(...namesLine.map((name) => String(name)));
    columnTypes.push(...typesLine.map((type) => String(type)));
  } catch (error2) {
    return {
      success: false,
      reason: `Failed to parse column headers: ${error2 instanceof Error ? error2.message : String(error2)}`
    };
  }
  const columns = columnNames.map((name, index) => {
    const colType = columnTypes[index];
    return {
      name,
      type: colType ? String(colType) : ""
    };
  });
  const rows = [];
  for (let i = 2;i < lines.length; i++) {
    const currentLine = lines[i];
    if (!currentLine)
      continue;
    try {
      const values = JSON.parse(currentLine);
      if (!Array.isArray(values)) {
        continue;
      }
      const row = {};
      for (const [index, name] of columnNames.entries()) {
        const value = values[index];
        row[name] = value;
      }
      rows.push(row);
    } catch {
      continue;
    }
  }
  return { success: true, data: { columns, rows } };
}

// src/lib/ssh-client.ts
function createSshClient(config2) {
  function escapeShellArg(str) {
    return str.replace(/[\\"$`]/g, "\\$&");
  }
  async function executeCommand(sql) {
    const escapedSql = escapeShellArg(sql);
    const escapedContainer = escapeShellArg(config2.dockerContainer);
    const escapedDatabase = escapeShellArg(config2.database);
    const remoteCommand = `docker exec ${escapedContainer} clickhouse-client --database ${escapedDatabase} --format JSONCompactEachRowWithNamesAndTypes --query "${escapedSql}"`;
    const controller = new AbortController;
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const proc = Bun.spawn(["ssh", `${config2.sshUser}@${config2.sshHost}`, remoteCommand], {
        stdout: "pipe",
        stderr: "pipe",
        signal: controller.signal
      });
      const exitCode = await proc.exited;
      if (exitCode !== 0) {
        const stderr = await new Response(proc.stderr).text();
        throw new Error(`SSH command failed with exit code ${exitCode}: ${stderr}`);
      }
      const stdout = await new Response(proc.stdout).text();
      const parseResult = parseSshOutput(stdout);
      if (parseResult.success === false) {
        throw new Error(`Failed to parse SSH output: ${parseResult.reason}`);
      }
      return parseResult.data;
    } finally {
      clearTimeout(timeout);
    }
  }
  return {
    async query(sql) {
      const validation = validateQuery(sql);
      if (validation.valid === false) {
        throw new Error(`Query validation failed: ${validation.reason}`);
      }
      return executeCommand(validation.normalized);
    },
    async getSchema() {
      const describeQuery = "DESCRIBE TABLE default.osprey_execution_results";
      return executeCommand(describeQuery);
    }
  };
}

// src/lib/clickhouse-client.ts
function createDirectClient(config2) {
  const url = `${config2.host}:${config2.port}`;
  const client = import_client.createClient({
    url,
    username: config2.username,
    password: config2.password,
    database: config2.database
  });
  return {
    async query(sql) {
      const validation = validateQuery(sql);
      if (validation.valid === false) {
        throw new Error(`Query validation failed: ${validation.reason}`);
      }
      const response = await client.query({
        query: validation.normalized,
        format: "JSONEachRow",
        clickhouse_settings: {
          max_execution_time: 60
        }
      });
      const text = await response.text();
      const parsed = JSON.parse(text);
      let columns = [];
      let rows = [];
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        const obj = parsed;
        if (Array.isArray(obj["meta"])) {
          columns = obj["meta"].map((col) => {
            if (typeof col === "object" && col !== null && "name" in col && "type" in col) {
              return {
                name: String(col["name"]),
                type: String(col["type"])
              };
            }
            return { name: "", type: "" };
          });
        }
        if (Array.isArray(obj["data"])) {
          rows = obj["data"];
        }
      }
      return { columns, rows };
    },
    async getSchema() {
      const response = await client.query({
        query: "DESCRIBE TABLE default.osprey_execution_results",
        format: "JSONEachRow"
      });
      const text = await response.text();
      const parsed = JSON.parse(text);
      let rows = [];
      if (Array.isArray(parsed)) {
        rows = parsed;
      }
      const schemaColumns = rows.map((row) => {
        if (typeof row === "object" && row !== null) {
          const r = row;
          return {
            name: String(r["name"] || ""),
            type: String(r["type"] || "")
          };
        }
        return { name: "", type: "" };
      });
      return {
        columns: schemaColumns,
        rows
      };
    }
  };
}
function createClickHouseClient(config2) {
  switch (config2.mode) {
    case "direct":
      if (!config2.host || !config2.database || config2.port === undefined) {
        throw new Error("Direct mode requires host, port, and database configuration");
      }
      return createDirectClient({
        host: config2.host,
        port: config2.port,
        username: config2.username ?? "default",
        password: config2.password ?? "",
        database: config2.database
      });
    case "ssh":
      if (!config2.sshHost || !config2.sshUser || !config2.dockerContainer || !config2.database) {
        throw new Error("SSH mode requires sshHost, sshUser, dockerContainer, and database configuration");
      }
      return createSshClient({
        sshHost: config2.sshHost,
        sshUser: config2.sshUser,
        dockerContainer: config2.dockerContainer,
        database: config2.database
      });
    default:
      const exhaustiveCheck = config2.mode;
      throw new Error(`Unknown ClickHouse mode: ${exhaustiveCheck}`);
  }
}

// src/tools/clickhouse.ts
async function registerClickHouseTools(server, client) {
  server.tool("clickhouse_query", "Execute a read-only SQL query against the Osprey ClickHouse database. Only SELECT queries with LIMIT against osprey_execution_results are allowed.", {
    sql: exports_external.string().describe("SQL SELECT query with LIMIT clause")
  }, async (args) => {
    try {
      const result = await client.query(args.sql);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error2) {
      const errorMessage = error2 instanceof Error ? error2.message : String(error2);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: errorMessage
          }
        ]
      };
    }
  });
  server.tool("clickhouse_schema", "Get the column definitions (names and types) for the osprey_execution_results table.", {}, async () => {
    try {
      const result = await client.getSchema();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error2) {
      const errorMessage = error2 instanceof Error ? error2.message : String(error2);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: errorMessage
          }
        ]
      };
    }
  });
}

// src/tools/domain.ts
import { promises as dns } from "dns";
async function resolveDnsRecords(domain) {
  const results = await Promise.allSettled([
    dns.resolve4(domain),
    dns.resolve6(domain),
    dns.resolveNs(domain),
    dns.resolveMx(domain),
    dns.resolveTxt(domain),
    dns.resolveCname(domain),
    dns.resolveSoa(domain)
  ]);
  const a = results[0].status === "fulfilled" ? results[0].value : [];
  const aaaa = results[1].status === "fulfilled" ? results[1].value : [];
  const ns = results[2].status === "fulfilled" ? results[2].value : [];
  const mx = results[3].status === "fulfilled" ? results[3].value : [];
  const txt = results[4].status === "fulfilled" ? results[4].value : [];
  const cname = results[5].status === "fulfilled" ? results[5].value : [];
  const soa = results[6].status === "fulfilled" ? results[6].value : null;
  return {
    a,
    aaaa,
    ns,
    mx,
    txt,
    cname,
    soa
  };
}
async function checkHttpStatus(domain) {
  try {
    const controller = new AbortController;
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`https://${domain}`, {
      method: "HEAD",
      signal: controller.signal
    }).catch(() => null);
    clearTimeout(timeoutId);
    if (!response) {
      return null;
    }
    return {
      status: response.status,
      statusText: response.statusText
    };
  } catch {
    return null;
  }
}
async function registerDomainTool(server) {
  server.tool("domain_check", "Check DNS records and HTTP status for a domain. Returns A, AAAA, NS, MX, TXT, CNAME, SOA records and whether the domain resolves.", {
    domain: exports_external.string().describe("Domain name to check (e.g., example.com)")
  }, async (args) => {
    const { domain } = args;
    try {
      const records = await resolveDnsRecords(domain);
      const http = await checkHttpStatus(domain);
      const resolves = records.a.length > 0 || records.aaaa.length > 0;
      const result = {
        domain,
        resolves,
        records,
        http
      };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error2) {
      const errorMessage = error2 instanceof Error ? error2.message : String(error2);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: errorMessage
          }
        ]
      };
    }
  });
}

// src/tools/ip.ts
function validateIpAddress(ip) {
  const ipv4Regex2 = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/;
  const ipv4Match = ip.match(ipv4Regex2);
  if (ipv4Match && ipv4Match[1] && ipv4Match[2] && ipv4Match[3] && ipv4Match[4]) {
    const octets = [ipv4Match[1], ipv4Match[2], ipv4Match[3], ipv4Match[4]];
    for (const octet of octets) {
      const num = parseInt(octet, 10);
      if (num < 0 || num > 255) {
        return false;
      }
    }
    return true;
  }
  if (!ip.includes(":")) {
    return false;
  }
  const colonCount = ip.split("").filter((c) => c === ":").length;
  if (colonCount < 2) {
    return false;
  }
  if (ip.includes(":::")) {
    return false;
  }
  if (!/^[0-9a-fA-F:.]+$/.test(ip)) {
    return false;
  }
  return true;
}
async function registerIpTool(server) {
  server.tool("ip_lookup", "Look up geographic location and network information for an IP address using ip-api.com.", {
    ip: exports_external.string().describe("IPv4 or IPv6 address to look up")
  }, async (args) => {
    const { ip } = args;
    if (!validateIpAddress(ip)) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Invalid IP address format: ${ip}`
          }
        ]
      };
    }
    try {
      const controller = new AbortController;
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,query,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,mobile,proxy,hosting`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      if (data["status"] === "fail") {
        const message = typeof data["message"] === "string" ? data["message"] : "Unknown API error";
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: message
            }
          ]
        };
      }
      const result = {
        ip: typeof data["query"] === "string" ? data["query"] : ip,
        geo: {
          country: String(data["country"] ?? ""),
          countryCode: String(data["countryCode"] ?? ""),
          region: String(data["region"] ?? ""),
          city: String(data["city"] ?? ""),
          zip: String(data["zip"] ?? ""),
          lat: Number(data["lat"] ?? 0),
          lon: Number(data["lon"] ?? 0),
          timezone: String(data["timezone"] ?? "")
        },
        network: {
          isp: String(data["isp"] ?? ""),
          org: String(data["org"] ?? ""),
          asn: String(data["as"] ?? ""),
          asname: String(data["asname"] ?? "")
        },
        flags: {
          mobile: Boolean(data["mobile"]),
          proxy: Boolean(data["proxy"]),
          hosting: Boolean(data["hosting"])
        }
      };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error2) {
      const errorMessage = error2 instanceof Error ? error2.message : String(error2);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: errorMessage
          }
        ]
      };
    }
  });
}

// src/lib/url-shorteners.ts
var KNOWN_SHORTENERS = new Set([
  "bit.ly",
  "bitly.com",
  "t.co",
  "goo.gl",
  "tinyurl.com",
  "ow.ly",
  "is.gd",
  "v.gd",
  "buff.ly",
  "amzn.to",
  "youtu.be",
  "rb.gy",
  "shorturl.at",
  "tiny.cc",
  "cutt.ly"
]);
function isKnownShortener(hostname2) {
  return KNOWN_SHORTENERS.has(hostname2.toLowerCase());
}

// src/tools/url.ts
async function followRedirects(startUrl, maxHops = 15) {
  const hops = [];
  let currentUrl = startUrl;
  let finalUrl = startUrl;
  for (let i = 0;i < maxHops; i++) {
    try {
      const controller = new AbortController;
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(currentUrl, {
        redirect: "manual",
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      const currentHostname = new URL(currentUrl).hostname;
      const isShortener = isKnownShortener(currentHostname);
      const locationHeader = response.headers.get("location");
      let nextUrl = null;
      if (locationHeader && response.status >= 300 && response.status < 400) {
        try {
          nextUrl = new URL(locationHeader, currentUrl).href;
        } catch {
          nextUrl = null;
        }
      }
      hops.push({
        url: currentUrl,
        statusCode: response.status,
        location: nextUrl,
        isShortener
      });
      if (!nextUrl || response.status < 300 || response.status >= 400) {
        finalUrl = currentUrl;
        break;
      }
      currentUrl = nextUrl;
      finalUrl = nextUrl;
    } catch (error2) {
      const currentHostname = new URL(currentUrl).hostname;
      const isShortener = isKnownShortener(currentHostname);
      hops.push({
        url: currentUrl,
        statusCode: 0,
        location: null,
        isShortener
      });
      break;
    }
  }
  const result = hops.length >= maxHops ? {
    originalUrl: startUrl,
    finalUrl,
    hops,
    hopCount: hops.length,
    error: "Max redirects exceeded"
  } : {
    originalUrl: startUrl,
    finalUrl,
    hops,
    hopCount: hops.length
  };
  return result;
}
async function registerUrlTool(server) {
  server.tool("url_expand", "Follow a URL's redirect chain and report each hop with status code. Identifies known URL shorteners.", {
    url: exports_external.string().url().describe("URL to expand (follow redirects)")
  }, async (args) => {
    const { url } = args;
    try {
      const result = await followRedirects(url);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    } catch (error2) {
      const errorMessage = error2 instanceof Error ? error2.message : String(error2);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: errorMessage
          }
        ]
      };
    }
  });
}

// node_modules/whois/index.js
var exports_whois = {};
__export(exports_whois, {
  lookup: () => lookup,
  exportedForTesting: () => exportedForTesting,
  SERVERS: () => servers_default
});
import net from "net";
import url from "url";

// node_modules/underscore/underscore-node.mjs
var import_underscore_node_f = __toESM(require_underscore_node_f(), 1);

// node_modules/whois/index.js
var import_socks = __toESM(require_build(), 1);
// node_modules/whois/servers.json
var servers_default = {
  "br.com": "whois.centralnic.net",
  "cn.com": "whois.centralnic.net",
  "de.com": "whois.centralnic.net",
  "eu.com": "whois.centralnic.net",
  "gb.com": "whois.centralnic.net",
  "gb.net": "whois.centralnic.net",
  "gr.com": "whois.centralnic.net",
  "hu.com": "whois.centralnic.net",
  "in.net": "whois.centralnic.net",
  "jpn.com": "whois.centralnic.net",
  "no.com": "whois.centralnic.net",
  "qc.com": "whois.centralnic.net",
  "ru.com": "whois.centralnic.net",
  "sa.com": "whois.centralnic.net",
  "se.com": "whois.centralnic.net",
  "se.net": "whois.centralnic.net",
  "uk.com": "whois.centralnic.net",
  "uk.net": "whois.centralnic.net",
  "us.com": "whois.centralnic.net",
  "uy.com": "whois.centralnic.net",
  "web.com": "whois.centralnic.net",
  "za.com": "whois.centralnic.net",
  com: {
    host: "whois.verisign-grs.com",
    query: `DOMAIN $addr\r
`
  },
  "za.net": "whois.za.net",
  net: {
    host: "whois.verisign-grs.com",
    query: `DOMAIN $addr\r
`
  },
  "eu.org": "whois.eu.org",
  "za.org": "whois.za.org",
  org: "whois.pir.org",
  edu: "whois.educause.edu",
  gov: "whois.dotgov.gov",
  int: "whois.iana.org",
  mil: null,
  "e164.arpa": "whois.ripe.net",
  "in-addr.arpa": null,
  arpa: "whois.iana.org",
  aero: "whois.aero",
  asia: "whois.nic.asia",
  biz: "whois.biz",
  cat: "whois.cat",
  coop: "whois.nic.coop",
  info: "whois.afilias.net",
  jobs: "jobswhois.verisign-grs.com",
  mobi: "whois.nic.mobi",
  museum: "whois.museum",
  name: "whois.nic.name",
  post: "whois.dotpostregistry.net",
  pro: "whois.afilias.net",
  tel: "whois.nic.tel",
  travel: "whois.nic.travel",
  xxx: "whois.nic.xxx",
  academy: "whois.nic.academy",
  accountants: "whois.nic.accountants",
  actor: "whois.nic.actor",
  agency: "whois.nic.agency",
  airforce: "whois.nic.airforce",
  apartments: "whois.nic.apartments",
  app: "whois.nic.google",
  archi: "whois.nic.archi",
  army: "whois.nic.army",
  associates: "whois.nic.associates",
  attorney: "whois.nic.attorney",
  auction: "whois.nic.auction",
  audio: "whois.nic.audio",
  autos: "whois.nic.autos",
  axa: "whois.nic.axa",
  band: "whois.nic.band",
  bar: "whois.nic.bar",
  bargains: "whois.nic.bargains",
  bayern: "whois.nic.bayern",
  beer: "whois.nic.beer",
  berlin: "whois.nic.berlin",
  best: "whois.nic.best",
  bid: "whois.nic.bid",
  bike: "whois.nic.bike",
  bingo: "whois.nic.bingo",
  black: "whois.nic.black",
  blackfriday: "whois.nic.blackfriday",
  blog: "whois.nic.blog",
  blue: "whois.nic.blue",
  boutique: "whois.nic.boutique",
  build: "whois.nic.build",
  builders: "whois.nic.builders",
  business: "whois.nic.business",
  buzz: "whois.nic.buzz",
  cab: "whois.nic.cab",
  cafe: "whois.nic.cafe",
  camera: "whois.nic.camera",
  camp: "whois.nic.camp",
  capital: "whois.nic.capital",
  cards: "whois.nic.cards",
  care: "whois.nic.care",
  career: "whois.nic.career",
  careers: "whois.nic.careers",
  cash: "whois.nic.cash",
  casino: "whois.nic.casino",
  catering: "whois.nic.catering",
  center: "whois.nic.center",
  ceo: "whois.nic.ceo",
  charity: "whois.nic.charity",
  chat: "whois.nic.chat",
  cheap: "whois.nic.cheap",
  christmas: "whois.nic.christmas",
  church: "whois.nic.church",
  citic: "whois.nic.citic",
  city: "whois.nic.city",
  claims: "whois.nic.claims",
  cleaning: "whois.nic.cleaning",
  clinic: "whois.nic.clinic",
  clothing: "whois.nic.clothing",
  cloud: "whois.nic.cloud",
  club: "whois.nic.club",
  coach: "whois.nic.coach",
  codes: "whois.nic.codes",
  coffee: "whois.nic.coffee",
  college: "whois.nic.college",
  cologne: "whois.nic.cologne",
  community: "whois.nic.community",
  company: "whois.nic.company",
  computer: "whois.nic.computer",
  condos: "whois.nic.condos",
  construction: "whois.nic.construction",
  consulting: "whois.nic.consulting",
  contractors: "whois.nic.contractors",
  cooking: "whois.nic.cooking",
  cool: "whois.nic.cool",
  country: "whois.nic.country",
  coupons: "whois.nic.coupons",
  credit: "whois.nic.credit",
  creditcard: "whois.nic.creditcard",
  cruises: "whois.nic.cruises",
  dance: "whois.nic.dance",
  dating: "whois.nic.dating",
  deals: "whois.nic.deals",
  degree: "whois.nic.degree",
  delivery: "whois.nic.delivery",
  democrat: "whois.nic.democrat",
  dental: "whois.nic.dental",
  dentist: "whois.nic.dentist",
  desi: "whois.nic.desi",
  dev: "whois.nic.google",
  diamonds: "whois.nic.diamonds",
  digital: "whois.donuts.co",
  direct: "whois.nic.direct",
  directory: "whois.nic.directory",
  discount: "whois.nic.discount",
  dnp: "whois.nic.dnp",
  doctor: "whois.nic.doctor",
  dog: "whois.nic.dog",
  domains: "whois.nic.domains",
  education: "whois.nic.education",
  email: "whois.nic.email",
  energy: "whois.nic.energy",
  engineer: "whois.nic.engineer",
  engineering: "whois.nic.engineering",
  enterprises: "whois.nic.enterprises",
  equipment: "whois.nic.equipment",
  estate: "whois.nic.estate",
  eus: "whois.nic.eus",
  events: "whois.nic.events",
  exchange: "whois.nic.exchange",
  expert: "whois.nic.expert",
  exposed: "whois.nic.exposed",
  express: "whois.nic.express",
  fail: "whois.nic.fail",
  family: "whois.nic.family",
  fan: "whois.nic.fan",
  farm: "whois.nic.farm",
  feedback: "whois.nic.feedback",
  finance: "whois.nic.finance",
  financial: "whois.nic.financial",
  fish: "whois.nic.fish",
  fishing: "whois.nic.fishing",
  fitness: "whois.nic.fitness",
  flights: "whois.nic.flights",
  florist: "whois.nic.florist",
  foo: "whois.nic.foo",
  football: "whois.nic.football",
  forsale: "whois.nic.forsale",
  foundation: "whois.nic.foundation",
  frogans: "whois.nic.frogans",
  fun: "whois.nic.fun",
  fund: "whois.nic.fund",
  furniture: "whois.nic.furniture",
  futbol: "whois.nic.futbol",
  fyi: "whois.nic.fyi",
  gal: "whois.nic.gal",
  gallery: "whois.nic.gallery",
  games: "whois.nic.games",
  gift: "whois.nic.gift",
  gifts: "whois.nic.gifts",
  gives: "whois.nic.gives",
  glass: "whois.nic.glass",
  global: "whois.nic.global",
  globo: "whois.nic.globo",
  gmbh: "whois.nic.gmbh",
  gmo: "whois.nic.gmo",
  gold: "whois.nic.gold",
  golf: "whois.nic.golf",
  gop: "whois.nic.gop",
  graphics: "whois.nic.graphics",
  gratis: "whois.nic.gratis",
  gripe: "whois.nic.gripe",
  group: "whois.nic.group",
  guide: "whois.nic.guide",
  guitars: "whois.nic.guitars",
  guru: "whois.nic.guru",
  haus: "whois.nic.haus",
  healthcare: "whois.nic.healthcare",
  hiphop: "whois.nic.hiphop",
  hockey: "whois.nic.hockey",
  holdings: "whois.nic.holdings",
  holiday: "whois.nic.holiday",
  homes: "whois.nic.homes",
  horse: "whois.nic.horse",
  hospital: "whois.nic.hospital",
  host: "whois.nic.host",
  house: "whois.nic.house",
  immo: "whois.nic.immo",
  immobilien: "whois.nic.immobilien",
  industries: "whois.nic.industries",
  ink: "whois.nic.ink",
  institute: "whois.nic.institute",
  insure: "whois.nic.insure",
  international: "whois.nic.international",
  investments: "whois.nic.investments",
  irish: "whois.nic.irish",
  jetzt: "whois.nic.jetzt",
  jewelry: "whois.nic.jewelry",
  juegos: "whois.nic.juegos",
  kaufen: "whois.nic.kaufen",
  kim: "whois.nic.kim",
  kitchen: "whois.nic.kitchen",
  kiwi: "whois.nic.kiwi",
  koeln: "whois.nic.koeln",
  kred: "whois.nic.kred",
  land: "whois.nic.land",
  lawyer: "whois.nic.lawyer",
  lease: "whois.nic.lease",
  legal: "whois.nic.legal",
  life: "whois.nic.life",
  lighting: "whois.nic.lighting",
  limited: "whois.nic.limited",
  limo: "whois.nic.limo",
  link: "whois.nic.link",
  live: "whois.nic.live",
  loans: "whois.nic.loans",
  london: "whois.nic.london",
  love: "whois.nic.love",
  ltd: "whois.nic.ltd",
  luxe: "whois.nic.luxe",
  luxury: "whois.nic.luxury",
  maison: "whois.nic.maison",
  management: "whois.nic.management",
  mango: "whois.nic.mango",
  market: "whois.nic.market",
  marketing: "whois.nic.marketing",
  mba: "whois.nic.mba",
  media: "whois.nic.media",
  meet: "whois.nic.meet",
  memorial: "whois.nic.memorial",
  menu: "whois.nic.menu",
  miami: "whois.nic.miami",
  moda: "whois.nic.moda",
  moe: "whois.nic.moe",
  monash: "whois.nic.monash",
  money: "whois.nic.money",
  mortgage: "whois.nic.mortgage",
  moscow: "whois.nic.moscow",
  motorcycles: "whois.nic.motorcycles",
  movie: "whois.nic.movie",
  nagoya: "whois.nic.nagoya",
  navy: "whois.nic.navy",
  network: "whois.nic.network",
  neustar: "whois.nic.neustar",
  news: "whois.nic.news",
  ninja: "whois.nic.ninja",
  nyc: "whois.nic.nyc",
  okinawa: "whois.nic.okinawa",
  one: "whois.nic.one",
  onl: "whois.nic.onl",
  online: "whois.centralnic.net",
  paris: "whois.nic.paris",
  partners: "whois.nic.partners",
  parts: "whois.nic.parts",
  photo: "whois.nic.photo",
  photography: "whois.nic.photography",
  photos: "whois.nic.photos",
  pics: "whois.nic.pics",
  pictures: "whois.nic.pictures",
  pink: "whois.nic.pink",
  pizza: "whois.nic.pizza",
  place: "whois.nic.place",
  plumbing: "whois.nic.plumbing",
  plus: "whois.nic.plus",
  press: "whois.nic.press",
  productions: "whois.nic.productions",
  properties: "whois.nic.properties",
  pub: "whois.nic.pub",
  qpon: "whois.nic.qpon",
  quebec: "whois.nic.quebec",
  recipes: "whois.nic.recipes",
  red: "whois.nic.red",
  rehab: "whois.nic.rehab",
  reise: "whois.nic.reise",
  reisen: "whois.nic.reisen",
  ren: "whois.nic.ren",
  rentals: "whois.nic.rentals",
  repair: "whois.nic.repair",
  report: "whois.nic.report",
  republican: "whois.nic.republican",
  rest: "whois.nic.rest",
  restaurant: "whois.nic.restaurant",
  reviews: "whois.nic.reviews",
  rich: "whois.nic.rich",
  rio: "whois.nic.rio",
  rip: "whois.nic.rip",
  rocks: "whois.nic.rocks",
  rodeo: "whois.nic.rodeo",
  ruhr: "whois.nic.ruhr",
  run: "whois.nic.run",
  ryukyu: "whois.nic.ryukyu",
  saarland: "whois.nic.saarland",
  sale: "whois.nic.sale",
  salon: "whois.nic.salon",
  sarl: "whois.nic.sarl",
  school: "whois.nic.school",
  schule: "whois.nic.schule",
  services: "whois.nic.services",
  sexy: "whois.nic.sexy",
  shiksha: "whois.nic.shiksha",
  shoes: "whois.nic.shoes",
  shopping: "whois.nic.shopping",
  show: "whois.nic.show",
  singles: "whois.nic.singles",
  site: "whois.nic.site",
  soccer: "whois.nic.soccer",
  social: "whois.nic.social",
  software: "whois.nic.software",
  sohu: "whois.nic.sohu",
  solar: "whois.nic.solar",
  solutions: "whois.nic.solutions",
  soy: "whois.nic.soy",
  space: "whois.nic.space",
  sport: "whois.nic.sport",
  store: "whois.nic.store",
  studio: "whois.nic.studio",
  style: "whois.nic.style",
  supplies: "whois.nic.supplies",
  supply: "whois.nic.supply",
  support: "whois.nic.support",
  surgery: "whois.nic.surgery",
  systems: "whois.nic.systems",
  tattoo: "whois.nic.tattoo",
  tax: "whois.nic.tax",
  taxi: "whois.nic.taxi",
  team: "whois.nic.team",
  tech: "whois.nic.tech",
  technology: "whois.nic.technology",
  tennis: "whois.nic.tennis",
  theater: "whois.nic.theater",
  tienda: "whois.nic.tienda",
  tips: "whois.nic.tips",
  tires: "whois.nic.tires",
  today: "whois.nic.today",
  tokyo: "whois.nic.tokyo",
  tools: "whois.nic.tools",
  top: "whois.nic.top",
  tours: "whois.nic.tours",
  town: "whois.nic.town",
  toys: "whois.nic.toys",
  trade: "whois.nic.trade",
  training: "whois.nic.training",
  university: "whois.nic.university",
  uno: "whois.nic.uno",
  vacations: "whois.nic.vacations",
  vegas: "whois.nic.vegas",
  ventures: "whois.nic.ventures",
  versicherung: "whois.nic.versicherung",
  vet: "whois.nic.vet",
  viajes: "whois.nic.viajes",
  video: "whois.nic.video",
  villas: "whois.nic.villas",
  vin: "whois.nic.vin",
  vip: "whois.nic.vip",
  vision: "whois.nic.vision",
  vodka: "whois.nic.vodka",
  vote: "whois.nic.vote",
  voting: "whois.nic.voting",
  voto: "whois.nic.voto",
  voyage: "whois.nic.voyage",
  wang: "whois.nic.wang",
  watch: "whois.nic.watch",
  webcam: "whois.nic.webcam",
  website: "whois.nic.website",
  wed: "whois.nic.wed",
  wien: "whois.nic.wien",
  wiki: "whois.nic.wiki",
  wine: "whois.nic.wine",
  works: "whois.nic.works",
  world: "whois.nic.world",
  wtc: "whois.nic.wtc",
  wtf: "whois.nic.wtf",
  "xn--3bst00m": "whois.nic.xn--3bst00m",
  "xn--3ds443g": "whois.nic.xn--3ds443g",
  "xn--55qw42g": "whois.nic.xn--55qw42g",
  "xn--55qx5d": "whois.nic.xn--55qx5d",
  "xn--6frz82g": "whois.nic.xn--6frz82g",
  "xn--6qq986b3xl": "whois.nic.xn--6qq986b3xl",
  "xn--80adxhks": "whois.nic.xn--80adxhks",
  "xn--80asehdb": "whois.nic.xn--80asehdb",
  "xn--80aswg": "whois.nic.xn--80aswg",
  "xn--c1avg": "whois.nic.xn--c1avg",
  "xn--cg4bki": "whois.nic.xn--cg4bki",
  "xn--czrs0t": "whois.nic.xn--czrs0t",
  "xn--czr694b": "whois.nic.xn--czr694b",
  "xn--czru2d": "whois.nic.xn--czru2d",
  "xn--d1acj3b": "whois.nic.xn--d1acj3b",
  "xn--fiq228c5hs": "whois.nic.xn--fiq228c5hs",
  "xn--fiq64b": "whois.nic.xn--fiq64b",
  "xn--i1b6b1a6a2e": "whois.nic.xn--i1b6b1a6a2e",
  "xn--io0a7i": "whois.nic.xn--io0a7i",
  "xn--mgbab2bd": "whois.nic.xn--mgbab2bd",
  "xn--ngbc5azd": "whois.nic.xn--ngbc5azd",
  "xn--nqv7f": "whois.nic.xn--nqv7f",
  "xn--nqv7fs00ema": "whois.nic.xn--nqv7fs00ema",
  "xn--q9jyb4c": "whois.nic.xn--q9jyb4c",
  "xn--rhqv96g": "whois.nic.xn--rhqv96g",
  "xn--ses554g": "whois.nic.xn--ses554g",
  "xn--unup4y": "whois.nic.xn--unup4y",
  "xn--vhquv": "whois.nic.xn--vhquv",
  "xn--zfr164b": "whois.nic.xn--zfr164b",
  xyz: "whois.nic.xyz",
  yachts: "whois.nic.yachts",
  yokohama: "whois.nic.yokohama",
  zone: "whois.nic.zone",
  ac: "whois.nic.ac",
  ad: null,
  ae: "whois.aeda.net.ae",
  af: "whois.nic.af",
  ag: "whois.nic.ag",
  ai: "whois.nic.ai",
  al: null,
  am: "whois.amnic.net",
  an: null,
  ao: null,
  aq: null,
  ar: null,
  as: "whois.nic.as",
  "priv.at": "whois.nic.priv.at",
  at: "whois.nic.at",
  au: "whois.auda.org.au",
  aw: "whois.nic.aw",
  ax: "whois.ax",
  az: null,
  ba: null,
  bb: null,
  bd: null,
  be: "whois.dns.be",
  bf: null,
  bg: "whois.register.bg",
  bh: null,
  bi: "whois1.nic.bi",
  bj: "whois.nic.bj",
  bl: null,
  bm: "whois.afilias-srs.net",
  bn: "whois.bn",
  bo: "whois.nic.bo",
  bq: null,
  br: "whois.registro.br",
  bs: null,
  bt: null,
  bv: null,
  by: "whois.cctld.by",
  bw: "whois.nic.net.bw",
  bz: "whois.afilias-grs.info",
  "co.ca": "whois.co.ca",
  ca: "whois.cira.ca",
  cc: "ccwhois.verisign-grs.com",
  cd: "whois.nic.cd",
  cf: "whois.dot.cf",
  cg: null,
  ch: "whois.nic.ch",
  ci: "whois.nic.ci",
  ck: null,
  cl: "whois.nic.cl",
  cm: "whois.netcom.cm",
  "edu.cn": "whois.edu.cn",
  cn: "whois.cnnic.cn",
  "uk.co": "whois.uk.co",
  co: "whois.registry.co",
  cr: "whois.nic.cr",
  cu: null,
  cv: null,
  cw: null,
  cx: "whois.nic.cx",
  cy: null,
  cz: "whois.nic.cz",
  de: {
    host: "whois.denic.de",
    query: `-T dn $addr\r
`,
    punycode: false
  },
  dj: null,
  dk: {
    host: "whois.dk-hostmaster.dk",
    query: `--charset=utf-8 --show-handles $addr\r
`
  },
  dm: "whois.nic.dm",
  do: "whois.nic.do",
  dz: "whois.nic.dz",
  ec: "whois.nic.ec",
  ee: "whois.tld.ee",
  eg: null,
  eh: null,
  er: null,
  es: null,
  et: null,
  eu: "whois.eu",
  fi: "whois.fi",
  fj: "whois.usp.ac.fj",
  fk: null,
  fm: "whois.nic.fm",
  fo: "whois.nic.fo",
  fr: "whois.nic.fr",
  ga: "whois.dot.ga",
  gb: null,
  gd: "whois.nic.gd",
  ge: "whois.nic.ge",
  gf: "whois.mediaserv.net",
  gg: "whois.gg",
  gh: "whois.nic.gh",
  gi: "whois.afilias-grs.info",
  gl: "whois.nic.gl",
  gm: null,
  gn: null,
  gp: "whois.nic.gp",
  gq: "whois.dominio.gq",
  gr: null,
  gs: "whois.nic.gs",
  gt: null,
  gu: null,
  gw: null,
  gy: "whois.registry.gy",
  hk: "whois.hkirc.hk",
  hm: "whois.registry.hm",
  hn: "whois.nic.hn",
  hr: "whois.dns.hr",
  ht: "whois.nic.ht",
  hu: "whois.nic.hu",
  id: "whois.pandi.or.id",
  ie: "whois.domainregistry.ie",
  il: "whois.isoc.org.il",
  im: "whois.nic.im",
  in: "whois.registry.in",
  io: "whois.nic.io",
  iq: "whois.cmc.iq",
  ir: "whois.nic.ir",
  is: "whois.isnic.is",
  it: "whois.nic.it",
  je: "whois.je",
  jm: null,
  jo: null,
  jp: {
    host: "whois.jprs.jp",
    query: `$addr/e\r
`
  },
  ke: "whois.kenic.or.ke",
  kg: "whois.domain.kg",
  kh: null,
  ki: "whois.nic.ki",
  km: null,
  kn: "whois.nic.kn",
  kp: null,
  kr: "whois.kr",
  kw: null,
  ky: "whois.kyregistry.ky",
  kz: "whois.nic.kz",
  la: "whois.nic.la",
  lb: null,
  lc: "whois.afilias-grs.info",
  li: "whois.nic.li",
  lk: "whois.nic.lk",
  lr: null,
  ls: "whois.nic.ls",
  lt: "whois.domreg.lt",
  lu: "whois.dns.lu",
  lv: "whois.nic.lv",
  ly: "whois.nic.ly",
  ma: "whois.iam.net.ma",
  mc: null,
  md: "whois.nic.md",
  me: "whois.nic.me",
  mf: null,
  mg: "whois.nic.mg",
  mh: null,
  mk: "whois.marnet.mk",
  ml: "whois.dot.ml",
  mm: null,
  mn: "whois.nic.mn",
  mo: null,
  mp: null,
  mq: "whois.mediaserv.net",
  mr: "whois.nic.mr",
  ms: "whois.nic.ms",
  mt: null,
  mu: "whois.nic.mu",
  mv: null,
  mw: "whois.nic.mw",
  mx: "whois.mx",
  my: "whois.domainregistry.my",
  mz: "whois.nic.mz",
  na: "whois.na-nic.com.na",
  nc: "whois.nc",
  ne: null,
  nf: "whois.nic.nf",
  ng: "whois.nic.net.ng",
  ni: null,
  nl: "whois.domain-registry.nl",
  no: {
    host: "whois.norid.no",
    query: `-c utf-8 $addr\r
`
  },
  np: null,
  nr: null,
  nu: "whois.iis.nu",
  nz: "whois.irs.net.nz",
  om: "whois.registry.om",
  pa: null,
  pe: "kero.yachay.pe",
  pf: "whois.registry.pf",
  pg: null,
  ph: null,
  pk: null,
  "co.pl": "whois.co.pl",
  pl: "whois.dns.pl",
  pm: "whois.nic.pm",
  pn: null,
  pr: "whois.nic.pr",
  ps: "whois.pnina.ps",
  pt: "whois.dns.pt",
  pw: "whois.nic.pw",
  py: null,
  qa: "whois.registry.qa",
  re: "whois.nic.re",
  ro: "whois.rotld.ro",
  rs: "whois.rnids.rs",
  "edu.ru": "whois.informika.ru",
  ru: "whois.tcinet.ru",
  rw: "whois.ricta.org.rw",
  sa: "whois.nic.net.sa",
  sb: "whois.nic.sb",
  sc: "whois.afilias-grs.info",
  sd: null,
  se: "whois.iis.se",
  sg: "whois.sgnic.sg",
  sh: "whois.nic.sh",
  si: "whois.arnes.si",
  sj: null,
  sk: "whois.sk-nic.sk",
  sl: "whois.nic.sl",
  sm: "whois.nic.sm",
  sn: "whois.nic.sn",
  so: "whois.nic.so",
  sr: null,
  ss: "whois.nic.ss",
  st: "whois.nic.st",
  su: "whois.tcinet.ru",
  sv: null,
  sx: "whois.sx",
  sy: "whois.tld.sy",
  sz: null,
  tc: "whois.nic.tc",
  td: "whois.nic.td",
  tf: "whois.nic.tf",
  tg: "whois.nic.tg",
  th: "whois.thnic.co.th",
  tj: null,
  tk: "whois.dot.tk",
  tl: "whois.nic.tl",
  tm: "whois.nic.tm",
  tn: "whois.ati.tn",
  to: "whois.tonic.to",
  tp: null,
  tr: "whois.nic.tr",
  tt: null,
  tv: "tvwhois.verisign-grs.com",
  tw: "whois.twnic.net.tw",
  tz: "whois.tznic.or.tz",
  "biz.ua": "whois.biz.ua",
  "co.ua": "whois.co.ua",
  "pp.ua": "whois.pp.ua",
  ua: "whois.ua",
  ug: "whois.co.ug",
  "ac.uk": "whois.ja.net",
  "bl.uk": null,
  "british-library.uk": null,
  "gov.uk": "whois.ja.net",
  "icnet.uk": null,
  "jet.uk": null,
  "mod.uk": null,
  "nhs.uk": null,
  "nls.uk": null,
  "parliament.uk": null,
  "police.uk": null,
  uk: "whois.nic.uk",
  um: null,
  "fed.us": "whois.nic.gov",
  us: "whois.nic.us",
  "com.uy": null,
  uy: "whois.nic.org.uy",
  uz: "whois.cctld.uz",
  va: null,
  vc: "whois.afilias-grs.info",
  ve: "whois.nic.ve",
  vg: "whois.nic.vg",
  vi: null,
  vn: null,
  vu: "vunic.vu",
  wf: "whois.nic.wf",
  ws: "whois.website.ws",
  ye: null,
  yt: "whois.nic.yt",
  "ac.za": "whois.ac.za",
  "alt.za": "whois.alt.za",
  "co.za": "whois.registry.net.za",
  "gov.za": "whois.gov.za",
  "net.za": "whois.net.za",
  "org.za": null,
  "web.za": "whois.web.za",
  za: null,
  zm: "whois.nic.zm",
  zw: null,
  "xn--3e0b707e": "whois.kr",
  "xn--45brj9c": "whois.inregistry.net",
  "xn--80ao21a": "whois.nic.kz",
  "xn--90a3ac": "whois.rnids.rs",
  "xn--clchc0ea0b2g2a9gcd": "whois.sgnic.sg",
  "xn--fiqs8s": "cwhois.cnnic.cn",
  "xn--fiqz9s": "cwhois.cnnic.cn",
  "xn--fpcrj9c3d": "whois.inregistry.net",
  "xn--fzc2c9e2c": "whois.nic.lk",
  "xn--gecrj9c": "whois.inregistry.net",
  "xn--h2brj9c": "whois.inregistry.net",
  "xn--j1amh": "whois.dotukr.com",
  "xn--j6w193g": "whois.hkirc.hk",
  "xn--kprw13d": "whois.twnic.net.tw",
  "xn--kpry57d": "whois.twnic.net.tw",
  "xn--l1acc": "whois.nic.mn",
  "xn--lgbbat1ad8j": "whois.nic.dz",
  "xn--mgb9awbf": "whois.registry.om",
  "xn--mgba3a4f16a": "whois.nic.ir",
  "xn--mgbaam7a8h": "whois.aeda.net.ae",
  "xn--mgbayh7gpa": null,
  "xn--mgbbh1a71e": "whois.inregistry.net",
  "xn--mgbc0a9azcg": null,
  "xn--mgberp4a5d4ar": "whois.nic.net.sa",
  "xn--mgbx4cd0ab": "whois.domainregistry.my",
  "xn--o3cw4h": "whois.thnic.co.th",
  "xn--ogbpf8fl": "whois.tld.sy",
  "xn--p1ai": "whois.tcinet.ru",
  "xn--pgbs0dh": null,
  "xn--s9brj9c": "whois.inregistry.net",
  "xn--wgbh1c": "whois.dotmasr.eg",
  "xn--wgbl6a": "whois.registry.qa",
  "xn--xkc2al3hye2a": "whois.nic.lk",
  "xn--xkc2dl3a5ee0h": "whois.inregistry.net",
  "xn--yfro4i67o": "whois.sgnic.sg",
  "xn--ygbi2ammx": "whois.pnina.ps",
  "": "whois.iana.org",
  _: {
    ip: {
      host: "whois.arin.net",
      query: `n + $addr\r
`
    }
  }
};

// node_modules/whois/index.js
var lookup = (addr, options, done) => {
  if (typeof done === "undefined" && typeof options === "function") {
    done = options;
    options = {};
    if (addr === "__proto__") {
      done(new Error("lookup: __proto__ is not allowed to lookup"));
      return;
    }
  }
  import_underscore_node_f._.defaults(options, {
    follow: 2,
    timeout: 60000
  });
  done = import_underscore_node_f._.once(done);
  let { server, proxy } = options;
  server = parseServer(server);
  proxy = parseProxy(proxy);
  if (!server) {
    switch (true) {
      case import_underscore_node_f._.contains(addr, "@"):
        done(new Error("lookup: email addresses not supported"));
        return;
      case net.isIP(addr) !== 0:
        server = { ...parseServer(servers_default["_"]["ip"]), punycode: false };
        options.punycode = false;
        break;
      default:
        let tld = url.domainToASCII(addr);
        while (tld && !server) {
          if (!servers_default[tld]) {
            tld = tld.replace(/^.+?(\.|$)/, "");
            continue;
          }
          server = { ...parseServer(servers_default[tld]) };
        }
        break;
    }
  }
  if (!server) {
    done(new Error("lookup: no whois server is known for this kind of object"));
    return;
  }
  server = withServerDefaults(server);
  if (proxy)
    proxy = withProxyDefaults(proxy);
  const _lookup = (socket, done2) => {
    let idn = addr;
    if (server.punycode !== false && options.punycode !== false)
      idn = url.domainToASCII(addr);
    if (options.encoding)
      socket.setEncoding(options.encoding);
    socket.write(server.query.replace("$addr", idn));
    let data = "";
    socket.on("data", (chunk2) => {
      data += chunk2;
    });
    socket.on("timeout", () => {
      socket.destroy();
      done2(new Error("lookup: timeout"));
    });
    socket.on("error", (err) => {
      done2(err);
    });
    return socket.on("close", (err) => {
      if (options.follow > 0) {
        const referralServer = extractReferralServer(data, server);
        if (referralServer) {
          lookup(addr, {
            ...options,
            follow: options.follow - 1,
            server: referralServer
          }, (err2, parts) => {
            if (options.verbose) {
              parts = [
                {
                  server: server.host.trim(),
                  data
                }
              ].concat(parts || []);
            }
            return done2(err2, parts);
          });
          return;
        }
      }
      return done2(null, options.verbose ? [
        {
          server: server.host.trim(),
          data
        }
      ] : data);
    });
  };
  makeSocket(server, proxy, options, (err, socket) => {
    if (err !== null) {
      done(err);
      return;
    }
    _lookup(socket, done);
  });
};
var parseServer = (server) => {
  if (typeof server !== "string")
    return server;
  const [host, port] = server.split(":");
  server = {
    host
  };
  if (port)
    server.port = parseInt(port);
  return server;
};
var withServerDefaults = (server) => {
  if (!Number.isInteger(server.port))
    delete server.port;
  return {
    port: 43,
    query: `$addr\r
`,
    ...server
  };
};
var parseProxy = (proxy) => {
  if (typeof proxy !== "string")
    return proxy;
  const [host, port] = proxy.split(":");
  return {
    host,
    port: parseInt(port)
  };
};
var withProxyDefaults = (proxy) => {
  return {
    type: 5,
    ...proxy
  };
};
var extractReferralServer = (data, currentServer) => {
  const match = data.replace(/\r/gm, "").match(/(ReferralServer|Registrar Whois|Whois Server|WHOIS Server|Registrar WHOIS Server|refer):[^\S\n]*((?:r?whois|https?):\/\/)?([0-9A-Za-z\.\-_]*(:\d+)?)/);
  if (!match)
    return null;
  const value = (match[3] || "").replace(/^[:\s]+/, "").replace(/^https?[:\/]+/, "");
  if (value === currentServer?.host)
    return null;
  return parseServer(value);
};
var makeSocket = (server, proxy, options, done) => {
  if (proxy) {
    return import_socks.SocksClient.createConnection({
      proxy,
      destination: {
        host: server.host,
        port: server.port
      },
      command: "connect",
      timeout: options.timeout
    }, (err, { socket: socket2 }) => {
      if (err !== null) {
        done(err);
        return;
      }
      if (options.timeout)
        socket2.setTimeout(options.timeout);
      done(null, socket2);
      socket2.resume();
    });
    return;
  }
  const sockOpts = {
    host: server.host,
    port: server.port
  };
  if (options.bind)
    sockOpts.localAddress = options.bind;
  const socket = net.connect(sockOpts);
  if (options.timeout)
    socket.setTimeout(options.timeout);
  done(null, socket);
};
var exportedForTesting = {
  extractReferralServer
};

// src/lib/whois-parser.ts
function extractField(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}
function extractNameservers(text) {
  const nsPattern = /Name\s+Server:\s*(.+)/gi;
  const matches = text.matchAll(nsPattern);
  const nameservers = [];
  for (const match of matches) {
    if (match[1]) {
      nameservers.push(match[1].trim());
    }
  }
  return nameservers;
}
function calculateDomainAge(creationDateStr) {
  if (!creationDateStr) {
    return null;
  }
  try {
    const creationDate = new Date(creationDateStr);
    if (Number.isNaN(creationDate.getTime())) {
      return null;
    }
    const now2 = new Date;
    const ageMs = now2.getTime() - creationDate.getTime();
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    return ageDays;
  } catch {
    return null;
  }
}
function parseWhoisResponse(rawText) {
  const registrar = extractField(rawText, [/Registrar:\s*(.+)/i]);
  const creationDate = extractField(rawText, [
    /Creation\s+Date:\s*(.+)/i,
    /Created:\s*(.+)/i,
    /created:\s*(.+)/i
  ]);
  const expirationDate = extractField(rawText, [
    /Registry\s+Expiry\s+Date:\s*(.+)/i,
    /Expiration\s+Date:\s*(.+)/i,
    /expires:\s*(.+)/i
  ]);
  const nameservers = extractNameservers(rawText);
  const domainAge = calculateDomainAge(creationDate);
  return {
    registrar,
    creationDate,
    expirationDate,
    nameservers,
    domainAge,
    rawText
  };
}

// src/tools/whois.ts
var whois = exports_whois;
function whoisLookup(domain) {
  return new Promise((resolve, reject2) => {
    whois.lookup(domain, (err, data) => {
      if (err) {
        reject2(err);
      } else {
        resolve(data);
      }
    });
  });
}
async function registerWhoisTool(server) {
  server.tool("whois_lookup", "Look up WHOIS registration data for a domain. Returns registrar, creation/expiration dates, nameservers, and domain age.", {
    domain: exports_external.string().describe("Domain name to look up (e.g., example.com)")
  }, async (args) => {
    const { domain } = args;
    try {
      const rawText = await whoisLookup(domain);
      const result2 = parseWhoisResponse(rawText);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result2, null, 2)
          }
        ]
      };
    } catch (error2) {
      const errorMessage = error2 instanceof Error ? error2.message : String(error2);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: errorMessage
          }
        ]
      };
    }
  });
}

// src/tools/content.ts
function escapeClickhouseSql(text) {
  return text.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}
function buildSimilarityQuery(escapedText, threshold, limit) {
  return `SELECT
    did as user,
    handle,
    content as text,
    ngramDistance(content, '${escapedText}') as score,
    created_at
  FROM default.osprey_execution_results
  WHERE ngramDistance(content, '${escapedText}') < ${threshold}
  ORDER BY score ASC
  LIMIT ${limit}`;
}
async function registerContentTool(server, client) {
  server.tool("content_similarity", "Find posts with similar text content using ClickHouse ngramDistance. Useful for detecting copypasta and coordinated posting.", {
    text: exports_external.string().describe("Text to search for similar content"),
    threshold: exports_external.number().min(0).max(1).default(0.4).describe("Distance threshold (0=identical, 1=completely different). Lower values find more similar content. Default 0.4"),
    limit: exports_external.number().min(1).max(100).default(20).describe("Maximum number of results. Default 20")
  }, async (args) => {
    try {
      const { text, threshold, limit } = args;
      const escapedText = escapeClickhouseSql(text);
      const query = buildSimilarityQuery(escapedText, threshold, limit);
      const result2 = await client.query(query);
      const results = result2.rows.map((row) => ({
        user: String(row["user"] ?? ""),
        handle: String(row["handle"] ?? ""),
        text: String(row["text"] ?? ""),
        score: Number(row["score"] ?? 0),
        created_at: String(row["created_at"] ?? "")
      }));
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2)
          }
        ]
      };
    } catch (error2) {
      const errorMessage = error2 instanceof Error ? error2.message : String(error2);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: errorMessage
          }
        ]
      };
    }
  });
}

// src/tools/ozone.ts
function buildOzoneRequest(subject, label, action, createdBy) {
  if (subject.startsWith("did:")) {
    const subjectRef = {
      $type: "com.atproto.admin.defs#repoRef",
      did: subject
    };
    return {
      ok: true,
      request: {
        event: {
          $type: "tools.ozone.moderation.defs#modEventLabel",
          createLabelVals: action === "apply" ? [label] : [],
          negateLabelVals: action === "remove" ? [label] : []
        },
        subject: subjectRef,
        createdBy
      }
    };
  } else if (subject.startsWith("at://")) {
    const subjectRef = {
      $type: "com.atproto.repo.strongRef",
      uri: subject
    };
    return {
      ok: true,
      request: {
        event: {
          $type: "tools.ozone.moderation.defs#modEventLabel",
          createLabelVals: action === "apply" ? [label] : [],
          negateLabelVals: action === "remove" ? [label] : []
        },
        subject: subjectRef,
        createdBy
      }
    };
  } else {
    return {
      ok: false,
      error: "Subject must be a DID (did:plc:...) or AT-URI (at://...). Got: " + subject
    };
  }
}
function encodeBasicAuth(username, password) {
  const credentials = `${username}:${password}`;
  return Buffer.from(credentials).toString("base64");
}
async function registerOzoneTool(server, config2) {
  server.tool("ozone_label", "Apply or remove a moderation label on a subject (DID or AT-URI) via the Ozone moderation service.", {
    subject: exports_external.string().describe("Subject to label \u2014 a DID (did:plc:...) or AT-URI (at://...)"),
    label: exports_external.string().describe("Label value to apply or remove"),
    action: exports_external.enum(["apply", "remove"]).describe("Whether to apply or remove the label")
  }, async (args) => {
    try {
      if (!config2.serviceUrl || !config2.adminPassword || !config2.did) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: "Ozone is not configured. Set OZONE_SERVICE_URL, OZONE_ADMIN_PASSWORD, and OZONE_DID environment variables."
            }
          ]
        };
      }
      const { subject, label, action } = args;
      const result2 = buildOzoneRequest(subject, label, action, config2.did);
      if (!result2.ok) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: result2.error
            }
          ]
        };
      }
      const request = result2.request;
      const authHeader = encodeBasicAuth("admin", config2.adminPassword);
      const response = await fetch(`${config2.serviceUrl}/xrpc/tools.ozone.moderation.emitEvent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authHeader}`
        },
        body: JSON.stringify(request)
      });
      const responseBody = await response.text();
      if (!response.ok) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Ozone API error (${response.status}): ${responseBody}`
            }
          ]
        };
      }
      const responseResult = {
        success: true,
        action,
        subject,
        label,
        response: responseBody ? JSON.parse(responseBody) : null
      };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(responseResult, null, 2)
          }
        ]
      };
    } catch (error2) {
      const errorMessage = error2 instanceof Error ? error2.message : String(error2);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: errorMessage
          }
        ]
      };
    }
  });
}

// src/index.ts
function getEnv(key, defaultValue) {
  return process.env[key] ?? defaultValue;
}
var mode = getEnv("CLICKHOUSE_MODE", "ssh");
var clickhouseConfig = mode === "ssh" ? {
  mode: "ssh",
  database: getEnv("CLICKHOUSE_DATABASE", "default"),
  sshHost: getEnv("SSH_HOST", "localhost"),
  sshUser: getEnv("SSH_USER", "default"),
  dockerContainer: getEnv("SSH_DOCKER_CONTAINER", "clickhouse")
} : {
  mode: "direct",
  host: getEnv("CLICKHOUSE_HOST", "http://localhost"),
  port: Number(getEnv("CLICKHOUSE_PORT", "8123")),
  username: getEnv("CLICKHOUSE_USER", "default"),
  password: getEnv("CLICKHOUSE_PASSWORD", ""),
  database: getEnv("CLICKHOUSE_DATABASE", "default")
};
var client = createClickHouseClient(clickhouseConfig);
var server = new McpServer({
  name: "skywatch-mcp",
  version: "0.1.0"
});
await registerClickHouseTools(server, client);
await registerDomainTool(server);
await registerIpTool(server);
await registerUrlTool(server);
await registerWhoisTool(server);
await registerContentTool(server, client);
var ozoneConfig = {
  serviceUrl: process.env["OZONE_SERVICE_URL"] ?? null,
  adminPassword: process.env["OZONE_ADMIN_PASSWORD"] ?? null,
  did: process.env["OZONE_DID"] ?? null
};
await registerOzoneTool(server, ozoneConfig);
var transport = new StdioServerTransport;
await server.connect(transport);
console.error("skywatch-mcp server started");
