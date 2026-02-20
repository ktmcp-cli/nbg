import Conf from 'conf';

const config = new Conf({
  projectName: 'ktmcp-nbg'
});

export function getConfig(key) {
  return config.get(key);
}

export function setConfig(key, value) {
  config.set(key, value);
}

export function isConfigured() {
  return !!getConfig('baseUrl');
}
