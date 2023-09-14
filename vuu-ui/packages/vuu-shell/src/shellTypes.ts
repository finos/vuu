declare global {
  const vuuConfig: Promise<VuuConfig>;
}

export type SaveLocation = "local" | "remote";
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
  authUrl?: string;
  websocketUrl: string;
}
