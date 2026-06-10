const reactVersion = "19.2.3";
const vuuVersion = "2.1.19-beta.3";

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
      "@vuu-ui/vuu-shell": {
        singleton: true,
        requiredVersion: vuuVersion,
        strictVersion: true,
      },
      "@vuu-ui/vuu-utils2": {
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
      "@vuu-ui/vuu-shell": {
        requiredVersion: vuuVersion,
        strictVersion: true,
      },
      "@vuu-ui/vuu-utils2": {
        requiredVersion: vuuVersion,
        strictVersion: true,
      },
    };
  }
};
