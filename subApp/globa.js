import Vue from 'vue';
import Vuex from 'vuex';
import store from '@/store';
import singleMethod from '@/singleMethod';
import { isDesktop, isSingle } from './singleBootstrap';

// 给主应用或客户端发送通知
function emit(props) {
  return (method, sendOptions, to = '') => {
    const options = initOptions(sendOptions, to);
    switch (true) {
      case isSingle():
        props.setGlobalState({
          method,
          options,
        });
        return Promise.resolve();
      case isDesktop():
        console.log('给客户端发送');
        // todo 假设客户端会注入一个全局方法：window['AppInteraction']
        return window['AppInteraction'](method, options);
      default:
        if (!singleMethod[method]) {
          return Promise.reject(new Error(`独立应用不存在调用方法: ${method}`));
          // console.warn('独立应用不存在调用方法', method, options);
        }
        return Promise.resolve(singleMethod[method](options));
      // throw new Error(`无法给主应用传递通知: ${method}`);
    }
  };
}

// 获取传递给当前页面的数据
function notice(props) {
  const emitNotice = emit(props);
  return () => {
    const from = fullPath();
    if (isSingle()) {
      // qiankun 需要特殊处理
      return props.notice({ from });
    }
    return emitNotice('notice', { options: { from } });
    // throw new Error(`无法获取其他应用传递的数据`);
  };
}

function setHtmlTitle(props) {
  const emitNotice = emit(props);
  return title => {
    switch (true) {
      case isSingle():
        emitNotice('setHtmlTitle', title);
        break;
      default:
        try {
          if (isDesktop()) {
            console.log('桌面客户端设置 Title 需不需要特殊处理?');
          }
          emitNotice('setHtmlTitle', title);
        } catch (error) {}
    }
  };
}

function goto(methods) {
  return (data, notice, goCurrent) => {
    let options = {};
    const { path } = data;
    if (!path) {
      options = {
        path: data,
        goCurrent,
      };
    }
    options.path = completionCurrentPath(options.path, goCurrent);
    if (notice && notice !== null) {
      methods.$microSendNotice(notice, options.path).catch(err => {
        console.error(err);
      });
    }
    return methods.$microEmit('goto', options);
  };
}

function registerMethods(props) {
  const methods = {
    $microEmit: emit(props),
    $microNotice: notice(props),
    $microSetHtmlTitle: setHtmlTitle(props),
  };

  methods.$microSendNotice = (data, to, isCurrent) => {
    return methods.$microEmit(
      'sendNotice',
      data,
      completionCurrentPath(to, isCurrent)
    );
  };

  methods.$microGoto = goto(methods);

  for (const key in methods) {
    if (Object.hasOwnProperty.call(methods, key)) {
      Vue.prototype[key] = methods[key];
    }
  }
  return methods;
}

// 注册主应用
function globalRegister(props, initState = {}) {
  if (props && props.globalStore) {
    Vue.prototype.$globalStore = Vue.observable(props.globalStore);
  } else {
    Vue.prototype.$globalStore = new Vuex.Store({});
  }

  registerMethods(props);

  if (!store.hasModule('global')) {
    const globalModule = {
      namespaced: true,
      state: initState, // 这里有什么值需要看主应用传递什么了
      getters: {
        getGlobalState: state => () => {
          return props.getGlobalState({ from: fullPath() });
        },
      },
      actions: {
        SET_GLOBAL_STATE({ commit }, payload) {
          commit('setState', payload);
          commit('EmitGlobalState', payload);
        },
        INIT_GLOBAL_STATE({ commit }, payload) {
          commit('setState', payload);
        },
      },
      mutations: {
        setState(state, payload) {
          // eslint-disable-next-line
          Object.assign(state, payload);
        },
      },
    };
    store.registerModule('global', globalModule);
  } else {
    store.dispatch('global/INIT_GLOBAL_STATE', initState);
  }
}

export default globalRegister;

function fullPath() {
  return location.href;
  // const currentRoute = router.currentRoute;
  // const baseRoute = router?.options?.base || '/';
  // return baseRoute.substr(0, baseRoute.length - 1) + currentRoute.fullPath;
}

const a = document.createElement('a');
function toFullPath(to) {
  a.href = to;
  return a.href;
}

function completionCurrentPath(path, isCurrent) {
  if (!isCurrent) {
    return path;
  }
  let routesPrefix = store.state.systems.routesPrefix;
  if (
    path.indexOf('/') === 0 &&
    routesPrefix.substr(routesPrefix.length - 1) === '/'
  ) {
    routesPrefix = routesPrefix.slice(0, routesPrefix.length - 1);
  }
  return `${routesPrefix}${path}`;
}

function initOptions(options, to) {
  const toPath = to ? toFullPath(to) : '';
  return {
    isMicro: true,
    from: fullPath(),
    to: toPath,
    data: options,
  };
}
