/// <reference types="vite/client" />

// Production-safe global React declarations for shared hosting
declare global {
  interface Window {
    React?: typeof import('react');
    ReactDOM?: typeof import('react-dom');
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: any;
  }
}
