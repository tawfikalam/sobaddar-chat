"use client";
import { i as __toESM, t as require_react } from "./react-B35R_oEX.js";
import { t as require_jsx_runtime } from "./react_jsx-runtime.js";
//#region node_modules/@shadcn/react/dist/chunk-HBS6WEDP.js
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
function S({ defaultTagName: a, props: r, render: t, state: n = {}, stateAttributesMapping: e }) {
	let o = d(R(n, e), r);
	if (!t) return import_react.createElement(a, o);
	if (typeof t == "function") return t(o, n);
	if (!import_react.isValidElement(t)) return null;
	let s = t.props, u = {
		...d(o, s),
		ref: f(o.ref, s.ref)
	};
	return import_react.cloneElement(t, u);
}
function d(...a) {
	let r = {};
	for (let t of a) {
		if (!t) continue;
		let n = t;
		for (let e of Object.keys(n)) {
			let o = n[e];
			if (o === void 0) continue;
			let s = r[e];
			e === "className" ? r[e] = [s, o].filter(Boolean).join(" ") : e === "style" ? r[e] = {
				...s,
				...o
			} : e === "ref" ? r[e] = f(s, o) : l(e) && typeof s == "function" && typeof o == "function" ? r[e] = p(o, s) : r[e] = o;
		}
	}
	return r;
}
function R(a, r) {
	let t = {};
	for (let n of Object.keys(a)) {
		let e = a[n], o = r?.[n]?.(e);
		if (o) {
			Object.assign(t, o);
			continue;
		}
		if (n === "slot") {
			t["data-slot"] = e;
			continue;
		}
		let s = `data-${String(n).replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
		typeof e == "boolean" ? t[s] = e ? "" : void 0 : e != null && (t[s] = String(e));
	}
	return t;
}
function p(a, r) {
	return function(n) {
		a(n), n.defaultPrevented || r(n);
	};
}
function l(a) {
	return /^on[A-Z]/.test(a);
}
function f(...a) {
	let r = a.filter(Boolean);
	if (r.length !== 0) return (t) => {
		for (let n of r) typeof n == "function" ? n(t) : n && (n.current = t);
	};
}
//#endregion
//#region node_modules/@shadcn/react/dist/message-scroller/index.js
var import_jsx_runtime = require_jsx_runtime();
var _e = 8, Be = 64, Fe = 0, J = .5, je = 180, Ge = new Set([
	"ArrowDown",
	"ArrowUp",
	"End",
	"Home",
	"PageDown",
	"PageUp",
	" "
]), ge = {
	start: false,
	end: false
}, Q = {
	currentAnchorId: null,
	visibleMessageIds: []
};
function Ne({ content: e, scrollEdgeThreshold: t, spacer: r, viewport: n }) {
	if (!n || !e) return ge;
	let l = Re({
		content: e,
		spacer: r,
		viewport: n
	});
	return {
		start: n.scrollTop > t,
		end: l - n.scrollTop - n.clientHeight > t
	};
}
function Ue({ content: e, scrollMargin: t, scrollPreviousItemPeek: r, spacer: n, viewport: l, visibleMessageIds: c }) {
	if (!e || !l) return Q;
	let S = l.getBoundingClientRect(), o = S.top + t + r, b = typeof IntersectionObserver > "u", v = [], m = null;
	for (let L of ee(e, n)) {
		let R = L.dataset.messageId;
		if (!R) continue;
		let E = L.dataset.scrollAnchor === "true", h = E || b ? L.getBoundingClientRect() : null;
		(b && h ? h.bottom > o && h.top < S.bottom : c.has(R)) && v.push(R), E && h && h.top <= o + J && (m = R);
	}
	return v.length === 0 && m === null ? Q : {
		currentAnchorId: m,
		visibleMessageIds: v
	};
}
function ee(e, t) {
	return Array.from(e.children).filter((r) => r instanceof HTMLElement && r !== t);
}
function Ye(e, t) {
	for (let r = t; r < e.length; r++) {
		let n = e[r];
		if (n?.dataset.scrollAnchor === "true") return n;
	}
	return null;
}
function ze(e, t) {
	for (let r of e) if (r.dataset.scrollAnchor === "true" && !t.has(r)) return r;
	return null;
}
function qe(e, t) {
	let r = 0;
	for (let n = t; n < e.length; n++) if (e[n]?.dataset.scrollAnchor === "true" && (r += 1, r > 1)) return true;
	return false;
}
function Ke(e) {
	for (let t = e.length - 1; t >= 0; t--) {
		let r = e[t];
		if (r?.dataset.scrollAnchor === "true") return r;
	}
	return null;
}
function We({ content: e, spacer: t, viewport: r }) {
	let n = r.getBoundingClientRect();
	for (let l of ee(e, t)) {
		if (!l.dataset.messageId) continue;
		let c = l.getBoundingClientRect();
		if (c.bottom > n.top && c.top < n.bottom) return l;
	}
	return null;
}
function $e({ align: e, element: t, scrollMargin: r, spacer: n, viewport: l }) {
	let c = me(t, l), S = t.getBoundingClientRect().height, o = ht(n);
	if (e === "center") {
		let b = Math.max(0, l.clientHeight - o.start - o.end);
		return c - o.start - (b - S) / 2 - r;
	}
	if (e === "end") return c - l.clientHeight + S + o.end + r;
	if (e === "nearest") {
		let b = c + S, v = l.scrollTop + o.start, m = l.scrollTop + l.clientHeight - o.end;
		return c >= v && b <= m ? l.scrollTop : c < v ? c - o.start - r : b - l.clientHeight + o.end + r;
	}
	return c - o.start - r;
}
function me(e, t) {
	let r = e.getBoundingClientRect(), n = t.getBoundingClientRect();
	return r.top - n.top + t.scrollTop;
}
function te(e, t) {
	return e.getBoundingClientRect().top - t.getBoundingClientRect().top;
}
function Je({ content: e, scrollTop: t, spacer: r, viewport: n }) {
	let l = Re({
		content: e,
		spacer: r,
		viewport: n
	});
	return t + n.clientHeight - l;
}
function Re({ content: e, spacer: t, viewport: r }) {
	let n = ee(e, t), l = Xe(e), c = r.getBoundingClientRect(), S = r.scrollTop, o = l.start + l.end;
	for (let b of n) {
		let v = b.getBoundingClientRect();
		o = Math.max(o, v.bottom - c.top + S + l.end);
	}
	return o;
}
function Qe(e) {
	return Math.max(0, e.scrollHeight - e.clientHeight);
}
function Xe(e) {
	let t = window.getComputedStyle(e);
	return {
		end: pe(t.paddingBlockEnd || t.paddingBottom),
		start: pe(t.paddingBlockStart || t.paddingTop)
	};
}
function ht(e) {
	let t = e?.parentElement;
	return t ? Xe(t) : {
		end: 0,
		start: 0
	};
}
function Ze(e) {
	if (!e) return 0;
	let t = window.getComputedStyle(e);
	return pe(t.rowGap === "normal" ? t.gap : t.rowGap);
}
function pe(e) {
	if (!e) return 0;
	let t = Number.parseFloat(e);
	return Number.isFinite(t) ? t : 0;
}
function et(e, t) {
	let r = e, n = /* @__PURE__ */ new Set();
	return {
		getSnapshot: () => r,
		hasListeners: () => n.size > 0,
		setSnapshot: (l) => {
			t(r, l) || (r = l, n.forEach((c) => c()));
		},
		subscribe: (l, c, S) => {
			let o = n.size === 0;
			return n.add(l), o && c?.(), () => {
				n.delete(l), n.size === 0 && S?.();
			};
		}
	};
}
function de(e, t) {
	return et(e, t);
}
function tt() {
	return et(Q, Lt);
}
function rt(e, t) {
	return e.start === t.start && e.end === t.end;
}
function Lt(e, t) {
	return e.currentAnchorId !== t.currentAnchorId || e.visibleMessageIds.length !== t.visibleMessageIds.length ? false : e.visibleMessageIds.every((r, n) => r === t.visibleMessageIds[n]);
}
function nt({ autoScroll: e, defaultScrollPosition: t, scrollEdgeThreshold: r, scrollMargin: n, scrollPreviousItemPeek: l }) {
	let c = import_react.useRef(e), S = import_react.useRef(false), o = import_react.useRef(null), b = import_react.useRef(false), v = import_react.useRef(r), m = import_react.useRef(0), L = import_react.useRef(null), R = import_react.useRef(0), E = import_react.useRef(e ? "following-bottom" : "free-scrolling"), h = import_react.useRef(/* @__PURE__ */ new Map()), I = import_react.useRef(null), u = import_react.useRef(null), k = import_react.useRef(null), j = import_react.useRef(l), _ = import_react.useRef(true), Y = import_react.useRef(null), x = import_react.useRef(n), V = import_react.useRef(null), P = import_react.useRef(0), G = import_react.useRef(0), A = import_react.useRef(null), le = import_react.useRef(null), z = import_react.useRef(null), B = import_react.useRef(null), i = import_react.useRef(null), d = import_react.useRef(null), T = import_react.useRef(null), w = import_react.useRef(null), C = import_react.useRef(null), y = import_react.useRef(/* @__PURE__ */ new Set()), F = import_react.useRef(/* @__PURE__ */ new WeakSet());
	return z.current === null && (z.current = de(t === "end" || t === "last-anchor", (q, X) => q === X)), B.current === null && (B.current = de(ge, rt)), C.current === null && (C.current = tt()), c.current = e, v.current = r, x.current = n, j.current = l, {
		autoScrollRef: c,
		autoscrollingRef: S,
		autoscrollingTimeoutRef: i,
		streamingTurnRef: k,
		contentRef: o,
		defaultScrollPositionAppliedRef: b,
		firstItemRef: L,
		itemCountRef: m,
		lastScrollTopRef: R,
		messageElementsRef: h,
		modeRef: E,
		pendingScrollFrameRef: V,
		pendingScrollToMessageRef: I,
		prependRestoreRef: u,
		preserveScrollOnPrependRef: _,
		pendingDefaultScrollStore: z.current,
		rootRef: Y,
		scrollEdgeThresholdRef: v,
		scrollMarginRef: x,
		scrollPreviousItemPeekRef: j,
		spacerGapRef: P,
		spacerHeightRef: G,
		spacerRef: A,
		stateFrameRef: le,
		stateStore: B.current,
		viewportRef: d,
		visibilityFrameRef: T,
		visibilityObserverRef: w,
		visibilityStore: C.current,
		visibleMessageIdsRef: y,
		handledScrollAnchorsRef: F
	};
}
function Me(e) {
	e.pendingDefaultScrollStore.setSnapshot(false);
}
function re(e) {
	e.defaultScrollPositionAppliedRef.current = true, Me(e);
}
function lt({ refs: e, commitScrollState: t, scheduleStateCommit: r, scheduleVisibilitySync: n }) {
	let { streamingTurnRef: l, autoScrollRef: c, autoscrollingRef: S, autoscrollingTimeoutRef: o, contentRef: b, itemCountRef: v, messageElementsRef: m, modeRef: L, pendingScrollToMessageRef: R, prependRestoreRef: E, scrollMarginRef: h, scrollPreviousItemPeekRef: I, spacerGapRef: u, spacerHeightRef: k, spacerRef: j, viewportRef: _ } = e, Y = import_react.useCallback((i) => {
		o.current !== null && (window.clearTimeout(o.current), o.current = null), S.current !== i && (S.current = i, t()), i && (o.current = window.setTimeout(() => {
			o.current = null, S.current = false, t();
		}, je));
	}, [t]), x = import_react.useCallback((i) => {
		let d = j.current;
		if (!d) return;
		let T = Math.max(0, Math.ceil(i));
		k.current !== T && (k.current = T, d.hidden = T === 0, d.style.height = `${T}px`, d.style.marginTop = T > 0 ? `${-u.current}px` : "");
	}, []), V = import_react.useCallback((i, { behavior: d = "auto", autoscrolling: T = false } = {}) => {
		let w = _.current;
		if (!w) return;
		let C = Math.max(0, i);
		if (Math.abs(w.scrollTop - C) <= J) {
			w.scrollTop = C, t();
			return;
		}
		T && Y(true), w.scrollTo({
			top: C,
			behavior: d
		}), r();
	}, [
		t,
		r,
		Y
	]), P = import_react.useCallback(({ behavior: i = "auto" } = {}) => _.current ? (x(0), l.current = null, L.current = "free-scrolling", V(0, { behavior: i }), n(), true) : false, [
		n,
		V,
		x
	]), G = import_react.useCallback(({ behavior: i = "auto" } = {}) => {
		let d = _.current;
		return d ? (x(0), l.current = null, L.current = c.current ? "following-bottom" : "free-scrolling", V(Qe(d), {
			autoscrolling: true,
			behavior: i
		}), n(), true) : false;
	}, [
		n,
		V,
		x
	]), A = import_react.useCallback((i, { align: d = "start", behavior: T = "auto", scrollMargin: w = h.current } = {}, { keepPreviousPeek: C = false } = {}) => {
		let y = b.current, F = _.current;
		if (!y || !F || !y.contains(i)) return false;
		let q = $e({
			align: d,
			element: i,
			scrollMargin: C ? w + I.current : w,
			spacer: j.current,
			viewport: F
		});
		return x(Je({
			content: y,
			scrollTop: q,
			spacer: j.current,
			viewport: F
		})), E.current = {
			element: i,
			viewportTop: te(i, F)
		}, L.current = C ? "anchored-to-message" : "settling-jump", l.current = C ? i : null, V(q, { behavior: T }), n(), true;
	}, [
		n,
		V,
		x
	]), le = import_react.useCallback(() => {
		let i = l.current;
		return !i || !i.isConnected || L.current !== "anchored-to-message" ? false : A(i, { align: "start" }, { keepPreviousPeek: true });
	}, [A]), z = import_react.useCallback((i, d) => {
		let T = m.current.get(i);
		return T ? (re(e), A(T, d) ? (R.current = null, true) : (R.current = {
			messageId: i,
			options: d
		}, true)) : v.current === 0 ? (R.current = {
			messageId: i,
			options: d
		}, re(e), true) : false;
	}, [A]);
	return {
		flushPendingScrollToMessage: import_react.useCallback(() => {
			let i = R.current;
			if (!i) return false;
			let d = m.current.get(i.messageId);
			return !d || !A(d, i.options) ? false : (R.current = null, re(e), true);
		}, [A]),
		reanchorToAnchoredMessage: le,
		scrollToElement: A,
		scrollToEnd: G,
		scrollToMessage: z,
		scrollToStart: P
	};
}
function ot(e, t) {
	return import_react.useCallback((r) => {
		e.current = r, r && t();
	}, [e, t]);
}
function st({ autoScroll: e = false, defaultScrollPosition: t = "end", scrollEdgeThreshold: r = _e, scrollPreviousItemPeek: n = Be, scrollMargin: l = Fe }) {
	let c = nt({
		autoScroll: e,
		defaultScrollPosition: t,
		scrollEdgeThreshold: r,
		scrollMargin: l,
		scrollPreviousItemPeek: n
	}), { streamingTurnRef: S, autoScrollRef: o, autoscrollingRef: b, autoscrollingTimeoutRef: v, contentRef: m, defaultScrollPositionAppliedRef: L, firstItemRef: R, itemCountRef: E, lastScrollTopRef: h, messageElementsRef: I, modeRef: u, pendingScrollFrameRef: k, pendingScrollToMessageRef: j, prependRestoreRef: _, preserveScrollOnPrependRef: Y, pendingDefaultScrollStore: x, rootRef: V, scrollEdgeThresholdRef: P, scrollMarginRef: G, scrollPreviousItemPeekRef: A, spacerGapRef: le, spacerHeightRef: z, spacerRef: B, stateFrameRef: i, stateStore: d, viewportRef: T, visibilityFrameRef: w, visibilityObserverRef: C, visibilityStore: y, visibleMessageIdsRef: F, handledScrollAnchorsRef: q } = c, X = import_react.useRef(t);
	X.current !== t && (X.current = t, L.current = false);
	let ce = import_react.useCallback((s) => {
		let a = V.current, M = T.current, H = [s.start && "start", s.end && "end"].filter(Boolean).join(" "), fe = b.current;
		for (let W of [a, M]) W && (H ? W.setAttribute("data-scrollable", H) : W.removeAttribute("data-scrollable"), W.toggleAttribute("data-autoscrolling", fe));
	}, []), be = import_react.useCallback((s) => {
		let a = T.current?.scrollTop ?? 0, M = a < h.current - J;
		h.current = a, o.current && !s.end && u.current !== "settling-jump" && u.current !== "anchored-to-message" ? u.current = "following-bottom" : u.current === "following-bottom" && s.end && M && !b.current && (u.current = "free-scrolling");
	}, []), N = import_react.useCallback(() => {
		let s = Ne({
			content: m.current,
			scrollEdgeThreshold: P.current,
			spacer: B.current,
			viewport: T.current
		});
		be(s);
		let a = u.current === "following-bottom" ? {
			...s,
			end: false
		} : s;
		ce(a), d.setSnapshot(a);
	}, [
		be,
		d,
		ce
	]), oe = import_react.useCallback(() => {
		i.current === null && (i.current = window.requestAnimationFrame(() => {
			i.current = null, N();
		}));
	}, [N]), O = import_react.useCallback(() => {
		y.hasListeners() && w.current === null && (w.current = window.requestAnimationFrame(() => {
			w.current = null, y.hasListeners() && y.setSnapshot(Ue({
				content: m.current,
				scrollMargin: G.current,
				scrollPreviousItemPeek: A.current,
				spacer: B.current,
				viewport: T.current,
				visibleMessageIds: F.current
			}));
		}));
	}, [y]), { flushPendingScrollToMessage: ae, reanchorToAnchoredMessage: Te, scrollToElement: se, scrollToEnd: D, scrollToMessage: Ee, scrollToStart: ie } = lt({
		refs: c,
		commitScrollState: N,
		scheduleStateCommit: oe,
		scheduleVisibilitySync: O
	}), ve = import_react.useCallback(() => {
		let s = _.current, a = T.current;
		if (!s || !a || !s.element.isConnected) return false;
		let H = te(s.element, a) - s.viewportTop;
		return Math.abs(H) <= J ? false : (a.scrollTop += H, s.viewportTop = te(s.element, a), oe(), O(), true);
	}, [oe, O]), Z = import_react.useCallback(() => {
		let s = m.current, a = T.current;
		if (!s || !a) {
			_.current = null;
			return;
		}
		let M = We({
			content: s,
			spacer: B.current,
			viewport: a
		});
		_.current = M ? {
			element: M,
			viewportTop: te(M, a)
		} : null;
	}, []), he = import_react.useCallback(() => {
		k.current === null && (k.current = window.requestAnimationFrame(() => {
			k.current = null, ae() && Z();
		}));
	}, [Z, ae]), ue = import_react.useCallback(() => {
		if (!t || L.current || E.current === 0) return false;
		let s = false;
		if (t === "last-anchor") {
			let a = m.current, M = T.current, H = a && M ? Ke(ee(a, B.current)) : null;
			if (!a || !M || !H) s = D({ behavior: "auto" });
			else {
				let fe = me(H, M);
				s = Re({
					content: a,
					spacer: B.current,
					viewport: M
				}) - fe <= M.clientHeight ? D({ behavior: "auto" }) : se(H, { align: "start" }, { keepPreviousPeek: true });
			}
		} else s = t === "end" ? D({ behavior: "auto" }) : ie({ behavior: "auto" });
		return s ? (re(c), true) : false;
	}, [
		t,
		se,
		D,
		ie
	]), Le = import_react.useCallback(() => {
		let s = m.current;
		if (!s) return;
		let a = ee(s, B.current), M = E.current, H = R.current;
		E.current = a.length, R.current = a[0] ?? null, (() => {
			if (ae()) return;
			if (M === 0) {
				if (ue() || a.length > 0 && o.current && D({ behavior: "auto" })) return;
				N(), O();
				return;
			}
			let W = H ? a.indexOf(H) : -1;
			if (Y.current && W > 0) {
				ve();
				return;
			}
			if (a.length > M) {
				let $ = Ye(a, M);
				if ($) {
					if (o.current && u.current === "following-bottom" && qe(a, M)) {
						D({ behavior: "auto" });
						return;
					}
					se($, { align: "start" }, { keepPreviousPeek: true }), q.current.add($);
					return;
				}
			}
			if (a.length === M) {
				let $ = ze(a, q.current);
				if ($) {
					se($, { align: "start" }, { keepPreviousPeek: true }), q.current.add($);
					return;
				}
			}
			u.current === "following-bottom" && o.current ? D({ behavior: "auto" }) : (N(), O());
		})(), Z();
	}, [
		ue,
		Z,
		N,
		ae,
		ve,
		O,
		se,
		D
	]), Ce = import_react.useCallback(() => {
		if (u.current === "following-bottom" && o.current) {
			D({ behavior: "auto" });
			return;
		}
		let s = z.current;
		if (Te()) {
			o.current && s > 0 && z.current === 0 && D({ behavior: "auto" });
			return;
		}
		oe(), O();
	}, [
		Te,
		oe,
		O,
		D
	]), Pe = import_react.useCallback(() => {
		let s = T.current;
		if (!(!s || !y.hasListeners())) {
			if (typeof IntersectionObserver > "u") {
				O();
				return;
			}
			C.current || (C.current = new IntersectionObserver((a) => {
				for (let M of a) {
					let H = M.target.dataset.messageId;
					H && (M.isIntersecting ? F.current.add(H) : F.current.delete(H));
				}
				O();
			}, {
				root: s,
				rootMargin: `${-(G.current + A.current)}px 0px 0px 0px`,
				threshold: [
					0,
					.01,
					.5,
					1
				]
			})), I.current.forEach((a) => {
				C.current?.observe(a);
			}), O();
		}
	}, [O, y]), we = import_react.useCallback(() => {
		w.current !== null && (window.cancelAnimationFrame(w.current), w.current = null), C.current?.disconnect(), C.current = null, F.current.clear(), y.setSnapshot(Q);
	}, [y]), bt = import_react.useCallback((s, a, M) => {
		if (a) {
			I.current.set(s, a), C.current?.observe(a), O(), j.current?.messageId === s && he();
			return;
		}
		M && I.current.get(s) === M && (I.current.delete(s), F.current.delete(s), C.current?.unobserve(M), O());
	}, [he, O]), Oe = import_react.useCallback(() => {
		(u.current === "following-bottom" || u.current === "anchored-to-message" || u.current === "settling-jump") && (S.current = null, u.current = "free-scrolling");
	}, []), ye = import_react.useCallback(() => ce(d.getSnapshot()), [d, ce]), He = ot(V, ye), Ie = ot(T, ye), Ae = import_react.useCallback((s) => {
		m.current = s;
	}, []), De = import_react.useCallback((s) => {
		B.current = s, le.current = Ze(s?.parentElement ?? null);
	}, []), xe = import_react.useCallback(() => {
		N(), O(), Z();
	}, [
		Z,
		N,
		O
	]), Tt = import_react.useMemo(() => ({
		handleContentChange: Le,
		handleResize: Ce,
		observeVisibility: Pe,
		pendingDefaultScrollStore: x,
		preserveScrollOnPrependRef: Y,
		scrollToEnd: D,
		scrollToMessage: Ee,
		scrollToStart: ie,
		setContentElement: Ae,
		setRootElement: He,
		setSpacerElement: De,
		setViewportElement: Ie,
		stateStore: d,
		syncAfterScroll: xe,
		unobserveVisibility: we,
		userScrollIntent: Oe,
		viewportRef: T,
		visibilityStore: y
	}), [
		Le,
		Ce,
		Pe,
		x,
		D,
		Ee,
		ie,
		Ae,
		He,
		De,
		Ie,
		d,
		xe,
		we,
		Oe,
		y
	]);
	return import_react.useLayoutEffect(() => {
		ue() || E.current === 0 && Me(c);
	}, [ue]), import_react.useEffect(() => () => {
		i.current !== null && (window.cancelAnimationFrame(i.current), i.current = null), w.current !== null && (window.cancelAnimationFrame(w.current), w.current = null), v.current !== null && (window.clearTimeout(v.current), v.current = null), k.current !== null && (window.cancelAnimationFrame(k.current), k.current = null), C.current?.disconnect(), C.current = null;
	}, []), import_react.useLayoutEffect(() => {
		if (e && u.current === "following-bottom" && E.current > 0) {
			D({ behavior: "auto" });
			return;
		}
		N();
	}, [
		e,
		N,
		D
	]), {
		context: Tt,
		registerMessage: bt
	};
}
function at(e) {
	let t = import_react.useRef(e);
	return t.current = e, t;
}
var it = import_react.createContext(null), ut = import_react.createContext(null);
function K() {
	let e = import_react.useContext(it);
	if (!e) throw new Error("useMessageScroller must be used within a MessageScroller.");
	return e;
}
function Ct() {
	let e = import_react.useContext(ut);
	if (!e) throw new Error("MessageScrollerItem must be used within a MessageScroller.");
	return e;
}
function Pt() {
	let { scrollToEnd: e, scrollToMessage: t, scrollToStart: r } = K();
	return import_react.useMemo(() => ({
		scrollToEnd: e,
		scrollToMessage: t,
		scrollToStart: r
	}), [
		e,
		t,
		r
	]);
}
function wt() {
	let { stateStore: e } = K();
	return import_react.useSyncExternalStore(e.subscribe, e.getSnapshot, e.getSnapshot);
}
function Ot() {
	let { observeVisibility: e, unobserveVisibility: t, visibilityStore: r } = K(), n = import_react.useCallback((l) => r.subscribe(l, e, t), [
		e,
		t,
		r
	]);
	return import_react.useSyncExternalStore(n, r.getSnapshot, r.getSnapshot);
}
function ft({ autoScroll: e = false, children: t, defaultScrollPosition: r = "end", scrollEdgeThreshold: n, scrollPreviousItemPeek: l, scrollMargin: c }) {
	let { context: S, registerMessage: o } = st({
		autoScroll: e,
		defaultScrollPosition: r,
		scrollEdgeThreshold: n,
		scrollPreviousItemPeek: l,
		scrollMargin: c
	});
	return (0, import_jsx_runtime.jsx)(it.Provider, {
		value: S,
		children: (0, import_jsx_runtime.jsx)(ut.Provider, {
			value: o,
			children: t
		})
	});
}
function St() {
	let { pendingDefaultScrollStore: e } = K();
	return import_react.useSyncExternalStore(e.subscribe, e.getSnapshot, e.getSnapshot);
}
function gt({ children: e, ...t }) {
	let { setRootElement: r } = K(), n = St();
	return (0, import_jsx_runtime.jsx)("div", {
		ref: r,
		...t,
		...n ? { "data-pending-scroll": "" } : null,
		children: e
	});
}
function Rt({ "aria-label": e, children: t, onKeyDown: r, onScroll: n, onTouchMove: l, onWheel: c$1, preserveScrollOnPrepend: S = true, ref: o, role: b, tabIndex: v, ...m }) {
	let { handleResize: L, preserveScrollOnPrependRef: R, setViewportElement: E, syncAfterScroll: h, userScrollIntent: I, viewportRef: u } = K(), k = St();
	R.current = S;
	let j = import_react.useCallback((P) => {
		E(P), f(o)?.(P);
	}, [o, E]);
	function _(P) {
		h(), n?.(P);
	}
	function Y(P) {
		I(), c$1?.(P);
	}
	function x(P) {
		I(), l?.(P);
	}
	function V(P) {
		Ge.has(P.key) && I(), r?.(P);
	}
	return import_react.useEffect(() => {
		let P = u.current;
		if (!P || typeof ResizeObserver > "u") return;
		let G = 0, A = new ResizeObserver(() => {
			window.cancelAnimationFrame(G), G = window.requestAnimationFrame(L);
		});
		return A.observe(P), () => {
			window.cancelAnimationFrame(G), A.disconnect();
		};
	}, [L, u]), (0, import_jsx_runtime.jsx)("div", {
		ref: j,
		role: b ?? "region",
		"aria-label": e ?? "Messages",
		tabIndex: v ?? 0,
		onKeyDown: V,
		onScroll: _,
		onTouchMove: x,
		onWheel: Y,
		...m,
		...k ? { "data-pending-scroll": "" } : null,
		children: t
	});
}
function pt({ "aria-relevant": e, children: t, ref: r, role: n, spacerClassName: l, ...c$1 }) {
	let { handleContentChange: S, handleResize: o, setContentElement: b, setSpacerElement: v } = K(), m = import_react.useRef(null), L = import_react.useCallback((R) => {
		m.current = R, b(R), f(r)?.(R);
	}, [r, b]);
	return import_react.useLayoutEffect(() => {
		let R = m.current;
		if (!R || (S(), typeof MutationObserver > "u")) return;
		let E = new MutationObserver(() => {
			S();
		});
		return E.observe(R, { childList: true }), () => E.disconnect();
	}, [S]), import_react.useEffect(() => {
		let R = m.current;
		if (!R || typeof ResizeObserver > "u") return;
		let E = 0, h = new ResizeObserver(() => {
			window.cancelAnimationFrame(E), E = window.requestAnimationFrame(o);
		});
		return h.observe(R), () => {
			window.cancelAnimationFrame(E), h.disconnect();
		};
	}, [o]), (0, import_jsx_runtime.jsxs)("div", {
		ref: L,
		role: n ?? "log",
		"aria-relevant": e ?? "additions",
		...c$1,
		children: [t, (0, import_jsx_runtime.jsx)("div", {
			ref: v,
			"aria-hidden": "true",
			"data-message-scroller-spacer": "",
			hidden: true,
			className: l
		})]
	});
}
function mt({ messageId: e, ref: t, scrollAnchor: r = false, ...n }) {
	let l = Ct(), c$1 = import_react.useRef(null);
	return (0, import_jsx_runtime.jsx)("div", {
		ref: import_react.useCallback((o) => {
			let b = c$1.current;
			c$1.current = o, e && l(e, o, b), f(t)?.(o);
		}, [
			e,
			t,
			l
		]),
		"data-message-id": e,
		"data-scroll-anchor": r ? "true" : "false",
		...n
	});
}
function dt({ behavior: e = "smooth", children: t, direction: r = "end", onClick: n, render: l, tabIndex: c, type: S$1 = "button", ...o }) {
	let { scrollToEnd: b$1, scrollToStart: v, stateStore: m } = K(), L = at(n), R = import_react.useCallback((u) => m.subscribe(u), [m]), E = import_react.useCallback(() => {
		let u = m.getSnapshot();
		return r === "start" ? u.start : u.end;
	}, [r, m]), h = import_react.useSyncExternalStore(R, E, E), I = import_react.useCallback((u) => {
		h && (L.current?.(u), u.defaultPrevented || (u.currentTarget.blur(), r === "start" ? v({ behavior: e }) : b$1({ behavior: e })));
	}, [
		e,
		r,
		h,
		L,
		b$1,
		v
	]);
	return S({
		defaultTagName: "button",
		props: d({
			type: S$1,
			inert: !h,
			tabIndex: h ? c : -1,
			children: t ?? (0, import_jsx_runtime.jsxs)("span", { children: ["Scroll to ", r] }),
			onClick: I
		}, o),
		render: l,
		state: {
			active: h,
			direction: r
		},
		stateAttributesMapping: { active: (u) => ({ "data-active": u ? "true" : "false" }) }
	});
}
var er = {
	Provider: ft,
	Root: gt,
	Viewport: Rt,
	Content: pt,
	Item: mt,
	Button: dt
};
//#endregion
export { er as MessageScroller, Pt as useMessageScroller, wt as useMessageScrollerScrollable, Ot as useMessageScrollerVisibility };

//# sourceMappingURL=@shadcn_react_message-scroller.js.map