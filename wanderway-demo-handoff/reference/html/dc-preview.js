/*
 * dc-preview.js — tiny standalone runtime for the Wander Way reference screens.
 * Renders the {{ }} holes, <template data-sc-for> / <template data-sc-if> blocks,
 * onClick/onChange handlers and the Component's state so every screen opens
 * and works in a normal browser (double-click the .html file).
 * Reference only — this file is NOT part of the Shopify theme.
 */
(function () {
  'use strict';
  var render = function () {};

  function DCLogic(props) { this.props = props || {}; this.state = this.state || {}; }
  DCLogic.prototype.setState = function (patch) {
    var next = typeof patch === 'function' ? patch(this.state, this.props) : patch;
    this.state = Object.assign({}, this.state, next);
    render();
  };
  DCLogic.prototype.forceUpdate = function () { render(); };
  window.DCLogic = DCLogic;

  var WHOLE = /^\s*\{\{\s*([^{}]+?)\s*\}\}\s*$/;
  var ANY = /\{\{\s*([^{}]+?)\s*\}\}/g;

  function lookup(expr, scope) {
    expr = expr.trim();
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (expr === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);
    if (/^(['"]).*\1$/.test(expr)) return expr.slice(1, -1);
    var parts = expr.split('.'), v = scope;
    for (var i = 0; i < parts.length; i++) { if (v == null) return undefined; v = v[parts[i]]; }
    return v;
  }
  function attrValue(raw, scope) {
    if (raw == null) return undefined;
    var m = raw.match(WHOLE);
    return m ? lookup(m[1], scope) : interp(raw, scope);
  }
  function interp(str, scope) {
    return str.replace(ANY, function (_, e) { var v = lookup(e, scope); return v == null ? '' : String(v); });
  }

  function build(node, scope, parent) {
    if (node.nodeType === 3) { parent.appendChild(document.createTextNode(interp(node.nodeValue, scope))); return; }
    if (node.nodeType !== 1) return;

    if (node.localName === 'template' && node.hasAttribute('data-sc-for')) {
      var list = attrValue(node.getAttribute('list'), scope) || [];
      var as = node.getAttribute('as') || 'item';
      Array.prototype.forEach.call(list, function (item, i) {
        var s = Object.create(scope); s[as] = item; s.$index = i;
        node.content.childNodes.forEach(function (c) { build(c, s, parent); });
      });
      return;
    }
    if (node.localName === 'template' && node.hasAttribute('data-sc-if')) {
      if (attrValue(node.getAttribute('value'), scope)) node.content.childNodes.forEach(function (c) { build(c, scope, parent); });
      return;
    }

    var el = node.cloneNode(false), pendingValue;
    Array.prototype.slice.call(node.attributes).forEach(function (a) {
      var name = a.name, raw = a.value;
      if (/^on[a-z]+$/.test(name)) {
        el.removeAttribute(name);
        var fn = attrValue(raw, scope);
        if (typeof fn === 'function') el.addEventListener(name.slice(2), function (e) { fn(e); });
        return;
      }
      if (raw.indexOf('{{') === -1) return;
      var m = raw.match(WHOLE);
      if (!m) { el.setAttribute(name, interp(raw, scope)); return; }
      var v = lookup(m[1], scope);
      if (name === 'checked') { el.checked = !!v; if (v) el.setAttribute('checked', ''); else el.removeAttribute('checked'); return; }
      if (name === 'value') { pendingValue = v; el.setAttribute('value', v == null ? '' : String(v)); return; }
      if (typeof v === 'boolean' && name.indexOf('aria-') === 0) { el.setAttribute(name, String(v)); return; }
      if (v === false || v == null) { el.removeAttribute(name); return; }
      el.setAttribute(name, String(v));
    });
    node.childNodes.forEach(function (c) { build(c, scope, el); });
    if (pendingValue !== undefined) el.value = pendingValue;
    parent.appendChild(el);
  }

  function boot() {
    var root = document.querySelector('x-dc');
    var script = document.querySelector('script[data-dc-script]');
    if (!root || !script) return;
    var helmet = root.querySelector('helmet');
    if (helmet) { while (helmet.firstChild) document.head.appendChild(helmet.firstChild); helmet.remove(); }
    var tpl = document.createDocumentFragment();
    while (root.firstChild) tpl.appendChild(root.firstChild);

    var props = {};
    try {
      var decl = JSON.parse(script.getAttribute('data-props') || '{}');
      Object.keys(decl).forEach(function (k) { if (k[0] !== '$' && decl[k] && 'default' in decl[k]) props[k] = decl[k]['default']; });
    } catch (e) { console.warn('data-props parse failed', e); }

    var Component = new Function('DCLogic', script.textContent + '\nreturn Component;')(DCLogic);
    var inst = new Component(props);
    if (!inst.props) inst.props = props;
    if (!inst.state) inst.state = {};

    render = function () {
      var vals = inst.renderVals ? inst.renderVals() : {};
      var frag = document.createDocumentFragment();
      tpl.childNodes.forEach(function (c) { build(c, vals, frag); });
      root.replaceChildren(frag);
    };
    render();
    if (inst.componentDidMount) inst.componentDidMount();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
