const reactVersion = "19.2.3";
const vuuVersion = "3.1.0";

export const getSharedDependencies = (env: "consumer" | "producer") => {
  if (env === "consumer") {
    return {
      react: {
        singleton: true,
        requiredVersion: reactVersion,
        strictVersion: true,
      },
      "react-dom": {
        singleton: true,
        requiredVersion: reactVersion,
        strictVersion: true,
      },
      "@vuu-ui/core": {
        singleton: true,
        requiredVersion: vuuVersion,
        strictVersion: true,
      },
      "@vuu-ui/vuu-data-editing": {
        singleton: true,
        requiredVersion: vuuVersion,
        strictVersion: true,
      },
      "@vuu-ui/vuu-shell": {
        singleton: true,
        requiredVersion: vuuVersion,
        strictVersion: true,
      },
    };
  } else {
    return {
      react: {
        requiredVersion: reactVersion,
        strictVersion: true,
      },
      "react-dom": {
        requiredVersion: reactVersion,
        strictVersion: true,
      },
      "@vuu-ui/core": {
        singleton: true,
        requiredVersion: vuuVersion,
        strictVersion: true,
      },
      "@vuu-ui/vuu-data-editing": {
        singleton: true,
        requiredVersion: vuuVersion,
        strictVersion: true,
      },
      "@vuu-ui/vuu-shell": {
        requiredVersion: vuuVersion,
        strictVersion: true,
      },
    };
  }
};
