import { useCallback, useEffect, useState } from 'react';

const useLayoutConfig = (user, defaultLayout) => {
  const [layout, _setLayout] = useState(undefined);

  const setLayout = (layout) => {
    _setLayout(layout);
  };

  useEffect(() => {
    const load = async () => {
      fetch(`api/vui/${user.username}/latest`, {})
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
  }, [defaultLayout, user]);

  const saveData = useCallback(
    (data) => {
      // console.log(JSON.stringify(data,null,2))

      fetch(`api/vui/${user.username}`, {
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
    [defaultLayout, user]
  );

  return [layout, saveData];
};

export default useLayoutConfig;
