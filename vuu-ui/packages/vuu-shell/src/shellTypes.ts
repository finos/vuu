declare global {
  const vuuConfig: VuuConfig;
}

export interface FeatureConfig {
  id: string;
  url: string;
  css?: string;
}

export type Features = {
  [key: string]: FeatureConfig;
};
export interface VuuConfig {
  features?: Features;
  websocketUrl: string;
}
