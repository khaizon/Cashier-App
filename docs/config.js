// Default runtime configuration for local dev/preview.
// In the cluster this file is supplied by the cashier-app ConfigMap.
//
// `basePath` is intentionally omitted. It is derived at load time from the URL
// of the built asset the page loaded, so the same bundle works both at the root
// and under a prefix like /Cashier-App/. Set it explicitly only when the app is
// served somewhere the asset URL cannot express — for example behind a proxy
// that rewrites paths.
window.__CASHIER_CONFIG__ = window.__CASHIER_CONFIG__ || {
  // Same-origin: the ingress routes /api to the backend service.
  apiBaseUrl: '/',
};
