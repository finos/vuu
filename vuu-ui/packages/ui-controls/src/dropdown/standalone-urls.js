const urlMappings = {
  Calendar: 'http://localhost:3000/calendar.html',
  List: 'http://localhost:3000/list.html'
};

export function getUrlForComponent(componentName) {
  return urlMappings[componentName];
}
