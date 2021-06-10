/**
 * 加载 axios 拦截器
 */
export function loadInterceptors(axios, handle, options) {
  const { request, response } = handle;
  if (request && request.length > 0) {
    // 加载请求拦截器
    request.forEach(item => {
      let { onFulfilled, onRejected } = item;
      if (!onFulfilled || typeof onFulfilled !== 'function') {
        onFulfilled = config => config;
      }
      if (!onRejected || typeof onRejected !== 'function') {
        onRejected = error => Promise.reject(error);
      }
      axios.interceptors.request.use(
        config => onFulfilled(config, options),
        error => onRejected(error, options)
      );
    });
  }

  if (response && response.length > 0) {
    // 加载响应拦截器
    response.forEach(item => {
      let { onFulfilled, onRejected } = item;
      if (!onFulfilled || typeof onFulfilled !== 'function') {
        onFulfilled = response => response;
      }
      if (!onRejected || typeof onRejected !== 'function') {
        onRejected = error => Promise.reject(error);
      }
      axios.interceptors.response.use(
        response => onFulfilled(response, options),
        error => onRejected(error, options)
      );
    });
  }
}
