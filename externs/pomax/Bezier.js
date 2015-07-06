// Bezier utility functions
var utils = {
  // Legendre-Gauss abscissae with n=24 (x_i values, defined at i=n as the roots of the nth order Legendre polynomial Pn(x))
  Tvalues: [],

  // Legendre-Gauss weights with n=24 (w_i values, defined by a function linked to in the Bezier primer article)
  Cvalues: [],
  arcfn: function(t, derivativeFn) {},
  length: function(derivativeFn) {},
  map: function(v, ds,de, ts,te) {},
  lerp: function(r, v1, v2) {},
  pointToString: function(p) {},
  pointsToString: function(points) {},
  copy: function(obj) {},
  angle: function(o,v1,v2) {},
  dist: function(p1, p2) {},
  lli8: function(x1,y1,x2,y2,x3,y3,x4,y4) {},
  lli4: function(p1,p2,p3,p4) {},
  lli: function(v1, v2) {},
  makeline: function(p1,p2) {},
  findbbox: function(sections) {},
  shapeintersections: function(s1, bbox1, s2, bbox2) {},
  makeshape: function(forward, back) {},
  getminmax: function(curve, d, list) {},
  align: function(points, line) {},
  roots: function(points, line) {},
  droots: function(p) {},
  bboxoverlap: function(b1,b2) {},
  expandbox: function(bbox, _bbox) {},
  pairiteration: function(c1,c2) {},
  getccenter: function(p1,p2,p3) {}
};

/**
 * @constructor
 * @param {*} curves [description]
 */
function PolyBezier(curves) {}

PolyBezier.prototype = {
  valueOf: function() {},
  toString: function() {},
  addCurve: function(curve) {},
  length: function() {},
  curve: function(idx) {},
  bbox: function() {},
  offset: function(d) {}
};

/**
 * @constructor
 * @param {*} coords [description]
 */
function Bezier(coords) {};

Bezier.fromSVG = function(svgString) {};

Bezier.utils = utils;

Bezier.prototype = {
  valueOf: function() {},
  toString: function() {},
  toSVG: function(relative) {},
  update: function() {},
  computedirection: function() {},
  length: function() {},
  getLUT: function(steps) {},
  get: function(t) {},
  point: function(idx) {},
  compute: function(t) {},
  raise: function() {},
  derivative: function(t) {},
  normal: function(t) {},
  __normal2: function(t) {},
  __normal3: function() {},
  split: function(t1, t2) {},
  inflections: function() {},
  bbox: function() {},
  overlaps: function(curve) {},
  offset: function(t, d) {},
  simple: function() {},
  reduce: function() {},
  scale: function(d) {},
  outline: function(d1, d2, d3, d4) {},
  outlineshapes: function(d1,d2) {},
  intersects: function(curve) {},
  lineIntersects: function(line) {},
  selfintersects: function() {},
  curveintersects: function(c1,c2) {},
  arcs: function(errorThreshold) {},
  _error: function(pc, np1, s, e) {},
  _iterate: function(errorThreshold, circles) {}
};