"use client";

// The react-router-dom API the admin screens were written against, implemented
// on top of the Next.js App Router. Screens import from "@/lib/navigation"
// instead of "react-router-dom" and otherwise stay unchanged.
//
// Next has no history "state", so navigate(to, { state }) keeps the state in
// sessionStorage under the target URL; useLocation().state reads it back for
// the current URL (it survives a reload, like react-router's history state).

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import NextLink from "next/link";
import {
  useParams as useNextParams,
  usePathname,
  useRouter,
  useSearchParams as useNextSearchParams,
} from "next/navigation";

// ---- Location state -------------------------------------------------------
const STATE_PREFIX = "nav-state:";
const stateListeners = new Set();

const toHref = (to) => {
  if (typeof to === "string") return to;
  if (!to) return "";
  return `${to.pathname || ""}${to.search || ""}${to.hash || ""}`;
};

// Key without the hash, resolved against the current page for relative paths.
const stateKey = (href) => {
  const url = new URL(href, window.location.href);
  return STATE_PREFIX + url.pathname + url.search;
};

const saveState = (href, state) => {
  try {
    const key = stateKey(href);
    if (state === undefined) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(state));
  } catch {
    // Storage unavailable (private mode) — the screen gets no state.
  }
  stateListeners.forEach((listener) => listener());
};

const subscribeState = (listener) => {
  stateListeners.add(listener);
  return () => stateListeners.delete(listener);
};

// Raw JSON string, so useSyncExternalStore sees a stable snapshot.
const readRawState = (pathname, search) => {
  try {
    return sessionStorage.getItem(STATE_PREFIX + pathname + search);
  } catch {
    return null;
  }
};

// ---- Blockers (useBlocker) ------------------------------------------------
// Only navigations made through navigate()/<Link> can be blocked; browser
// back/forward can't be intercepted in the App Router. Reloads and tab closes
// are covered by the beforeunload listener in useUnsavedChangesWarning.
const blockers = new Set();

const runBlockers = (nextHref, go) => {
  const current = { pathname: window.location.pathname, search: window.location.search };
  const nextUrl = new URL(nextHref, window.location.href);
  const next = { pathname: nextUrl.pathname, search: nextUrl.search };
  for (const blocker of blockers) {
    if (blocker.shouldBlock({ currentLocation: current, nextLocation: next })) {
      blocker.block(go);
      return true;
    }
  }
  return false;
};

export function useBlocker(shouldBlock) {
  const [pending, setPending] = useState(null);
  const shouldBlockRef = useRef(shouldBlock);
  shouldBlockRef.current = shouldBlock;

  useEffect(() => {
    const entry = {
      shouldBlock: (args) =>
        typeof shouldBlockRef.current === "function" ? shouldBlockRef.current(args) : !!shouldBlockRef.current,
      block: (go) => setPending(() => go),
    };
    blockers.add(entry);
    return () => blockers.delete(entry);
  }, []);

  return useMemo(
    () => ({
      state: pending ? "blocked" : "unblocked",
      proceed: () => {
        const go = pending;
        setPending(null);
        go?.();
      },
      reset: () => setPending(null),
    }),
    [pending],
  );
}

// ---- Hooks ----------------------------------------------------------------
export function useNavigate() {
  const router = useRouter();

  return useCallback(
    (to, options = {}) => {
      if (typeof to === "number") {
        if (to < 0) router.back();
        else router.forward();
        return;
      }
      const href = toHref(to);
      const go = () => {
        saveState(href, options.state);
        if (options.replace) router.replace(href);
        else router.push(href);
      };
      if (!runBlockers(href, go)) go();
    },
    [router],
  );
}

export function useLocation() {
  const pathname = usePathname();
  const searchParams = useNextSearchParams();
  const query = searchParams.toString();
  const search = query ? `?${query}` : "";

  const raw = useSyncExternalStore(
    subscribeState,
    () => readRawState(pathname, search),
    () => null,
  );

  return useMemo(() => {
    let state = null;
    try {
      state = raw ? JSON.parse(raw) : null;
    } catch {
      state = null;
    }
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    return { pathname, search, hash, state, key: pathname + search };
  }, [pathname, search, raw]);
}

export function useParams() {
  return useNextParams() || {};
}

// react-router returns [searchParams, setSearchParams].
export function useSearchParams() {
  const searchParams = useNextSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const setSearchParams = useCallback(
    (next, options = {}) => {
      const value = typeof next === "function" ? next(new URLSearchParams(searchParams.toString())) : next;
      const query = new URLSearchParams(value).toString();
      const href = query ? `${pathname}?${query}` : pathname;
      if (options.replace) router.replace(href);
      else router.push(href);
    },
    [searchParams, router, pathname],
  );

  return [searchParams, setSearchParams];
}

// ---- Components -----------------------------------------------------------
export function Link({ to, state, replace, onClick, ...props }) {
  const href = toHref(to);
  const router = useRouter();

  const handleClick = (event) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    // Let the browser handle new-tab / modified clicks.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (props.target && props.target !== "_self") return;

    // Take the navigation over from next/link so state is stored and blockers run.
    event.preventDefault();
    const go = () => {
      saveState(href, state);
      if (replace) router.replace(href);
      else router.push(href);
    };
    if (!runBlockers(href, go)) go();
  };

  return <NextLink href={href} replace={replace} onClick={handleClick} {...props} />;
}

export function Navigate({ to, replace, state }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace, state });
    // Navigate once on mount, like react-router's <Navigate>.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

// generatePath("/admin/company/edit/:id", { id: 5 }) -> "/admin/company/edit/5"
export function generatePath(pattern, params = {}) {
  return pattern
    .replace(/:(\w+)(\?)?/g, (_, name, optional) => {
      const value = params[name];
      if (value == null) {
        if (optional) return "";
        throw new Error(`Missing ":${name}" param for path "${pattern}"`);
      }
      return encodeURIComponent(String(value));
    })
    .replace(/\/{2,}/g, "/");
}
