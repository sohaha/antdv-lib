import { single } from './singleBootstrap';
import { log, warn } from '../debug';

const noticeState = {};

export const notice = ({ from }) => {
  log('GetNotice', from);
  return noticeState[from] || [];
};

export const sendNotice = state => {
  const { from, to, data } = state;
  log('SendNotice', to, ':', data);
  if (to === from) {
    warn('不能自己给自己传递数据');
    return;
  }
  const notice = noticeState[to] || [];
  notice.push({ from, data });
  noticeState[to] = notice;
};

export const removeNotice = ({ from }) => {
  if (noticeState[from]) {
    delete noticeState[from];
  }
};

const setHtmlTitle = ({ data: title }) => {
  document.title = title;
};

const goto = state => {
  const { data } = state;
  if (!data?.goCurrent) {
    return Promise.reject(new Error(`单应用无法跳转主应用路由: ${data?.path}`));
  }

  console.log(single.instance);
  return single.instance.$router.push(data).then(to => {
    console.log('路由跳转完毕', to);
    return to;
  });
};

// 客户端需要实现的方法
const methods = {
  goto,
  setHtmlTitle,
  notice,
  sendNotice,
  removeNotice,
};

export default methods;
