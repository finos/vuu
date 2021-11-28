import { useCallback, useEffect, useState } from 'react';

const useLayoutConfig = (url, defaultLayout) => {
  const [layout, _setLayout] = useState(undefined);

  const setLayout = (layout) => {
    _setLayout(layout);
  };

  useEffect(() => {
    const load = async () => {
      fetch(`${url}/latest`, {})
        .then((response) => {
          return response.ok ? response.json() : defaultLayout;
        })
        .then(setLayout)
        .catch(() => {
          // TODO we should set a layout with a warning here
          setLayout(defaultLayout);
        });
    };

    load();
  }, [defaultLayout, url]);

  const saveData = useCallback(
    (data) => {
      // console.log(JSON.stringify(data,null,2))

      fetch(`${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }).then((response) => {
        return response.ok ? response.json() : defaultLayout;
      });
      // .then((data) => console.log(data));
    },
    [defaultLayout, url]
  );

  return [layout, saveData];
};

export default useLayoutConfig;
