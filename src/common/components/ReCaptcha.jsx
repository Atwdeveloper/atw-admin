"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

// Google reCAPTCHA v2 ("I'm not a robot" checkbox), rendered explicitly so no
// extra package is needed. The site key comes from NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
// when it's unset the widget renders nothing (see RECAPTCHA_ENABLED).
//
// The token it produces only proves something once the BACKEND verifies it
// with the secret key (https://www.google.com/recaptcha/api/siteverify).
// Tokens are single-use and expire after ~2 minutes — call reset() after
// every submit attempt.

export const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
export const RECAPTCHA_ENABLED = !!RECAPTCHA_SITE_KEY;

const ONLOAD = "__atwRecaptchaOnload";
let scriptPromise = null;

// Loads Google's script once per page, however many widgets mount.
const loadScript = () => {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.grecaptcha?.render) return Promise.resolve(window.grecaptcha);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    window[ONLOAD] = () => resolve(window.grecaptcha);
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?onload=${ONLOAD}&render=explicit`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      scriptPromise = null; // allow a retry on the next mount
      reject(new Error("Could not load reCAPTCHA"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
};

// onChange(token) fires with the token when solved, and with null when it
// expires or errors. ref.reset() clears it.
const ReCaptcha = forwardRef(({ onChange, className = "" }, ref) => {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!RECAPTCHA_ENABLED) return;
    let cancelled = false;
    loadScript()
      .then((grecaptcha) => {
        if (cancelled || !containerRef.current || widgetIdRef.current !== null) return;
        widgetIdRef.current = grecaptcha.render(containerRef.current, {
          sitekey: RECAPTCHA_SITE_KEY,
          callback: (token) => onChangeRef.current?.(token),
          "expired-callback": () => onChangeRef.current?.(null),
          "error-callback": () => onChangeRef.current?.(null),
        });
      })
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (widgetIdRef.current !== null) window.grecaptcha?.reset(widgetIdRef.current);
      onChangeRef.current?.(null);
    },
  }));

  if (!RECAPTCHA_ENABLED) return null;
  return (
    <div className={className}>
      <div ref={containerRef} />
      {loadError && (
        <p className="text-red-500 text-sm mt-1">
          Couldn&apos;t load the security check. Check your connection and reload the page.
        </p>
      )}
    </div>
  );
});

ReCaptcha.displayName = "ReCaptcha";

export default ReCaptcha;
