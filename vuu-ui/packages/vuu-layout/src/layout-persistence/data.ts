export const warningLayout = {
    type: "View",
    props: {
      style: { height: "calc(100% - 6px)" },
    },
    children: [
      {
        props: {
          className: "vuuShell-warningPlaceholder",
        },
        type: "Placeholder",
      },
    ],
  };