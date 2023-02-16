declare global {
  const vuuConfig: Promise<VuuConfig>;
}

export interface FeatureConfig {
  name: string;
  title: string;
  url: string;
  css?: string;
}

export type Features = {
  [key: string]: FeatureConfig;
};
export interface VuuConfig {
  features: Features;
  websocketUrl: string;
}
