import "./Test.feature.css";

export interface TestFeatureProps {
  background?: string;
}

const TestFeature = ({ background = "pink" }: TestFeatureProps) => {
  return (
    <div
      className="vuuTestFeature"
      style={{ width: "100%", height: "100%", background }}
    >
      Test Feature
    </div>
  );
};
export default TestFeature;
