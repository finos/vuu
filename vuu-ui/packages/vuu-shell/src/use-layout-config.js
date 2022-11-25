import { useCallback, useEffect, useState } from "react";

const useLayoutConfig = (user, defaultLayout) => {
  const [layout, _setLayout] = useState(defaultLayout);

  const setLayout = (layout) => {
    _setLayout(layout);
  };

  const load = useCallback(
    async (id = "latest") => {
      fetch(`api/vui/${user.username}/${id}`, {})
        .then((response) => {
          return response.ok ? response.json() : defaultLayout;
        })
        .then(setLayout)
        .catch(() => {
          // TODO we should set a layout with a warning here
          setLayout(defaultLayout);
        });
    },
    [defaultLayout, user.username]
  );

  useEffect(() => {
    load();
  }, [load]);

  const saveData = useCallback(
    (data) => {
      fetch(`api/vui/${user.username}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }).then((response) => {
        return response.ok ? response.json() : defaultLayout;
      });
      // .then((data) => console.log(data));
    },
    [defaultLayout, user]
  );

  const loadLayoutById = useCallback(
    (id) => {
      load(id);
    },
    [load]
  );

  return [layout, saveData, loadLayoutById];
};

export default useLayoutConfig;
