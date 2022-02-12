export const getLayoutHistory = async (user) => {
  const history = await fetch(`api/vui/${user.username}`, {})
    .then((response) => {
      return response.ok ? response.json() : null;
    })
    .catch(() => {
      // TODO we should set a layout with a warning here
      console.log(`error getting history`);
    });

  return history;
};
