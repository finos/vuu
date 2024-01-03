import { Contribution, HeaderProps } from "@finos/vuu-layout";
import { Header } from "@finos/vuu-layout";
import "./VuuBlotterHeader.css";

const classBase = "VuuBlotterHeader";

export type VuuBlotterHeaderProps = HeaderProps;

export const VuuBlotterHeader = ({
  className,
  ...props
}: VuuBlotterHeaderProps) => {
  // const showFilterRef = useRef(false);
  // const { setComponentProps } = useViewContext();
  // const toggleCommandLine = useCallback(() => {
  //   showFilterRef.current = !showFilterRef.current;
  //   setComponentProps({
  //     showFilter: showFilterRef.current,
  //   });
  // }, [setComponentProps]);
  const contributions: Contribution[] = [
    // {
    //   index: 0,
    //   location: "pre-title",
    //   content: (
    //     <Button
    //       className={`${classBase}-CommandButton`}
    //       data-icon="chevron-right"
    //       onClick={toggleCommandLine}
    //       variant="secondary"
    //     />
    //   ),
    // },
  ];
  return (
    <Header {...props} className={classBase} contributions={contributions} />
  );
};
