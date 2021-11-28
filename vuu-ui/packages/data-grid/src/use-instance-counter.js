const map = new Map();

export default function getInstanceCount(instance) {
  let result;

  if (map.has(instance)) {
    const { count } = map.get(instance);
    result = { newInstance: false, count: count + 1 };
  } else {
    result = { newInstance: true, count: 1 };
  }

  map.set(instance, result);
  return result;
}
