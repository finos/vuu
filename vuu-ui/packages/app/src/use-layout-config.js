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
      const json = JSON.stringify(data);

      fetch(`${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: json
      })
        .then((response) => {
          return response.ok ? response.json() : defaultLayout;
        })
        // .then((data) => console.log(data))
        .catch((err) => {
          console.log(`error saving data to server ${JSON.stringify(JSON.parse(json), null, 2)}`);
        });
    },
    [defaultLayout, url]
  );

  return [layout, saveData];
};

export default useLayoutConfig;
