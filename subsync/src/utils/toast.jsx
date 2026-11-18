import React, { useEffect, useState } from 'react';
import { dynaura, Toaster } from 'dynaura';

/**
 * Format and normalize arguments from legacy react-toastify or standard dynaura calls.
 */
function formatToastOptions(msgOrOpts, maybeOpts) {
  let rawOpts = {};

  if (typeof msgOrOpts === 'string' || typeof msgOrOpts === 'number') {
    rawOpts = { title: String(msgOrOpts) };
    if (maybeOpts && typeof maybeOpts === 'object') {
      Object.assign(rawOpts, maybeOpts);
    }
  } else if (msgOrOpts instanceof Error) {
    const errorTitle = msgOrOpts.name && msgOrOpts.name !== 'Error' 
      ? `${msgOrOpts.name}: ${msgOrOpts.message}` 
      : (msgOrOpts.message || 'An error occurred');
    rawOpts = { title: errorTitle };
    if (maybeOpts && typeof maybeOpts === 'object') {
      Object.assign(rawOpts, maybeOpts);
    }
  } else if (msgOrOpts && typeof msgOrOpts === 'object') {
    // If it's a React element (JSX)
    if (msgOrOpts.$$typeof || msgOrOpts.props) {
      rawOpts = { custom: msgOrOpts, title: '' };
      if (maybeOpts && typeof maybeOpts === 'object') {
        Object.assign(rawOpts, maybeOpts);
      }
    } else {
      rawOpts = { ...msgOrOpts };
      if (!rawOpts.title) {
        if (rawOpts.message) {
          rawOpts.title = String(rawOpts.message);
        } else if (rawOpts.error) {
          rawOpts.title = String(rawOpts.error);
        } else if (rawOpts.data && typeof rawOpts.data === 'string') {
          rawOpts.title = rawOpts.data;
        }
      }
      if (maybeOpts && typeof maybeOpts === 'object') {
        Object.assign(rawOpts, maybeOpts);
      }
    }
  }

  // Ensure title is a string if defined
  if (rawOpts.title !== undefined && rawOpts.title !== null && typeof rawOpts.title !== 'string') {
    rawOpts.title = String(rawOpts.title);
  }

  // Fallback title if missing and not custom
  if (!rawOpts.custom && (rawOpts.title === undefined || rawOpts.title === null)) {
    rawOpts.title = '';
  }

  // Map react-toastify toastId to dynaura id
  if (rawOpts.toastId !== undefined && rawOpts.id === undefined) {
    rawOpts.id = String(rawOpts.toastId);
  }

  // Configure duration: 2 seconds (2000ms) for all toasts
  if (rawOpts.autoClose === false || rawOpts.duration === null) {
    rawOpts.duration = null; // Sticky island
  } else {
    rawOpts.duration = 2000; // 2 seconds only
  }

  // Smart splitting for long text into title & description when description is not provided
  if (typeof rawOpts.title === 'string' && !rawOpts.description && !rawOpts.custom) {
    const text = rawOpts.title.trim();
    if (text.length > 36) {
      // 1. Check for newline
      const nlIdx = text.indexOf('\n');
      if (nlIdx > 0 && nlIdx <= 45) {
        rawOpts.title = text.slice(0, nlIdx).trim();
        rawOpts.description = text.slice(nlIdx + 1).trim();
      } else {
        // 2. Check for ': '
        const colonIdx = text.indexOf(': ');
        if (colonIdx > 0 && colonIdx <= 40) {
          rawOpts.title = text.slice(0, colonIdx).trim();
          rawOpts.description = text.slice(colonIdx + 2).trim();
        } else {
          // 3. Check for sentence ending (. ! ?) followed by whitespace
          const sentMatch = text.match(/^([^.!?]{4,40}[.!?])\s+(.+)$/);
          if (sentMatch) {
            rawOpts.title = sentMatch[1].trim();
            rawOpts.description = sentMatch[2].trim();
          } else if (text.length > 55) {
            // Cut at nearest word boundary before char 36
            const cutIdx = text.lastIndexOf(' ', 36);
            if (cutIdx > 12) {
              rawOpts.title = text.slice(0, cutIdx).trim() + '...';
              rawOpts.description = text.trim();
            }
          }
        }
      }
    }
  }

  // Support action button shortcuts
  if (rawOpts.action && typeof rawOpts.action === 'object') {
    rawOpts.button = rawOpts.action;
  } else if ((rawOpts.actionText || rawOpts.buttonText) && typeof rawOpts.onClick === 'function') {
    rawOpts.button = {
      title: rawOpts.actionText || rawOpts.buttonText,
      onClick: rawOpts.onClick,
    };
  }

  return rawOpts;
}

/**
 * Toast controller object compatible with both react-toastify and dynaura APIs.
 */
export const toast = function(msgOrOpts, maybeOpts) {
  return dynaura.info(formatToastOptions(msgOrOpts, maybeOpts));
};

toast.success = (msgOrOpts, maybeOpts) => {
  return dynaura.success(formatToastOptions(msgOrOpts, maybeOpts));
};

toast.error = (msgOrOpts, maybeOpts) => {
  return dynaura.error(formatToastOptions(msgOrOpts, maybeOpts));
};

toast.warning = (msgOrOpts, maybeOpts) => {
  return dynaura.warning(formatToastOptions(msgOrOpts, maybeOpts));
};

toast.warn = (msgOrOpts, maybeOpts) => {
  return dynaura.warning(formatToastOptions(msgOrOpts, maybeOpts));
};

toast.info = (msgOrOpts, maybeOpts) => {
  return dynaura.info(formatToastOptions(msgOrOpts, maybeOpts));
};

toast.loading = (msgOrOpts, maybeOpts) => {
  return dynaura.loading(formatToastOptions(msgOrOpts, maybeOpts));
};

toast.live = (msgOrOpts, maybeOpts) => {
  return dynaura.live(formatToastOptions(msgOrOpts, maybeOpts));
};

toast.custom = (content, opts) => {
  return dynaura.custom(content, opts);
};

toast.dismiss = (id) => {
  if (id !== undefined && id !== null) {
    dynaura.dismiss(String(id));
  } else {
    dynaura.dismiss();
  }
};

toast.clear = () => {
  dynaura.clear();
};

toast.pause = () => {
  dynaura.pause();
};

toast.resume = () => {
  dynaura.resume();
};

toast.update = (id, patch = {}) => {
  const normPatch = { ...patch };
  if (normPatch.render !== undefined && normPatch.title === undefined) {
    normPatch.title = String(normPatch.render);
  }
  if (normPatch.autoClose === false || normPatch.duration === null) {
    normPatch.duration = null;
  } else {
    normPatch.duration = 2000;
  }
  if (normPatch.isLoading === false && !normPatch.type) {
    normPatch.type = 'success';
  }
  dynaura.update(String(id), normPatch);
};

toast.promise = function(promise, options = {}) {
  const loading = options.loading || options.pending || 'Loading...';
  const successOption = options.success || 'Success';
  const errorOption = options.error || 'Something went wrong';

  const formatResolve = (opt) => {
    if (typeof opt === 'function') {
      return (val) => {
        const res = opt(val);
        const resolved = typeof res === 'string' ? { title: res } : formatToastOptions(res);
        if (resolved.duration !== null) resolved.duration = 2000;
        return resolved;
      };
    }
    if (typeof opt === 'string') {
      return { title: opt, duration: 2000 };
    }
    const resolved = formatToastOptions(opt);
    if (resolved.duration !== null) resolved.duration = 2000;
    return resolved;
  };

  return dynaura.promise(promise, {
    loading: typeof loading === 'string' ? { title: loading } : formatToastOptions(loading),
    success: formatResolve(successOption),
    error: formatResolve(errorOption),
  });
};

/**
 * Responsive & theme-aware Toaster wrapper component.
 * Automatically synchronizes with light / dark theme.
 */
export function AppToaster({ position = "top-center", ...props }) {
  const [theme, setTheme] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };

    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });

    return () => observer.disconnect();
  }, []);

  return (
    <Toaster
      position={position}
      theme={theme}
      timer={true}
      queue={true}
      swipe="edge"
      {...props}
    />
  );
}

// React-toastify backwards-compatibility aliases
export const ToastContainer = AppToaster;
export const Bounce = 'bounce';
export const Slide = 'slide';
export const Zoom = 'zoom';
export const Flip = 'flip';

// Re-export dynaura & native Toaster
export { dynaura, Toaster };

export default toast;
