export function warn(...logs) {
  console.log('%c Warn ', 'background:#FCCB33;color:#FFF', ...logs);
}

export function log(...logs) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('%c Log ', 'background:#68B6F3;color:#fff', ...logs);
  }
}
