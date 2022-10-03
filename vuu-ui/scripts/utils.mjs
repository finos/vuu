import fs from 'fs';

export const readPackageJson = (path = 'package.json') => {
  let rawdata = fs.readFileSync(path);
  let json = JSON.parse(rawdata);
  return json;
};

function frontPad(text, length) {
  const spaces = Array(length).fill(' ').join('');
  return (spaces + text).slice(-length);
}

export const formatBytes = (bytes, decimals = 2, displayLength = 10) => {
  if (bytes === 0) return '0 Bytes';
  const { log, floor, pow } = Math;

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = floor(log(bytes) / log(k));
  return frontPad(parseFloat((bytes / pow(k, i)).toFixed(dm)) + ' ' + sizes[i], displayLength);
};

export const formatDuration = ({ seconds, nanoSeconds }) =>
  `${seconds}s ${Math.round(nanoSeconds / 1_000_000)}ms`;
