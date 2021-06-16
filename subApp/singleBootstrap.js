import globalRegister from './globa';

export const single = {
  store: null,
  instance: null,
  destroy: () => {},
  render: () => {},
};

export function initSingle({ render, store }) {
  single.store = store;
  single.render = render;
  runAloneApp({ render, store });
}

export async function bootstrap() {}
export async function update() {}
// 乾坤挂载
export async function mount(props) {
  globalRegister(props, (props.globalStore && props.globalStore.state) || {});
  const app = single.render(props);
  single.instance = app.instance;
  single.router = app.router;
}
export async function unmount() {
  if (!single.instance) {
    return;
  }
  single.instance.router = null;
  single.instance.$destroy();
  single.instance.$el.innerHTML = '';
  single.instance = null;
}

if (isSingle()) {
  // eslint-disable-next-line no-undef
  __webpack_public_path__ = window['__INJECTED_PUBLIC_PATH_BY_QIANKUN__'];
}

// 是否乾坤启动
export function isSingle() {
  return !!window['__POWERED_BY_QIANKUN__'];
}

// 是否桌面客户端启动
export function isDesktop() {
  // todo 假设客户端会注入一个全局方法：window['AppInteraction']
  return !!window['AppInteraction'];
}

// 获取桌面客户端传递的数据
async function getDesktopState() {
  let state = {};
  // todo 假设是异步方法
  try {
    if (isDesktop()) {
      state = await single.store.commit('globa/emit', { method: 'getState' });
    }
  } catch (err) {
    console.error(err);
  }
  return state;
}

// 获取单独启动时需要的数据
async function getAloneAppState() {
  return {
    account: {
      user: { avatar: '', name: Number(new Date()) },
    },
    token: process.env.VUE_APP_DEV_TOKEN,
  };
}

function runAloneApp({ render, instance }) {
  // 非微应用内直接启动
  if (!isSingle()) {
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible') {
        single.instance.getNoticeState();
      }
    });
    (async () => {
      globalRegister(
        null,
        isDesktop() ? await getDesktopState() : await getAloneAppState()
      );

      const app = render({ appName: isDesktop() ? '客户端应用' : '独立应用' });
      single.instance = app.instance;
      single.router = app.router;
      single.instance.getNoticeState();
    })();
  }
}
