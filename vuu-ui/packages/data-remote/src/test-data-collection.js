const data = [];

const HB = /"HB"/;
const AUTH_SUCCESS = /"AUTH_SUCCESS"/;
const LOGIN_SUCCESS = /"LOGIN_SUCCESS"/;
const TABLE_LIST = /TABLE_LIST/;
const TABLE_META = /TABLE_META/;

export const saveTestData = (message, source) => {
  if (
    source === 'server' &&
    (HB.test(message) ||
      AUTH_SUCCESS.test(message) ||
      LOGIN_SUCCESS.test(message) ||
      TABLE_LIST.test(message) ||
      TABLE_META.test(message))
  ) {
    return;
  } else if (source === 'client') {
    if (message.type.startsWith('GET_TABLE_')) {
      return;
    }

    message = JSON.stringify(message);
  }
  data.push(message);
};

export const getTestMessages = () => {
  const messages = data.slice();
  data.length = 0;
  return messages;
};
