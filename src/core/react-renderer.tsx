import { useMemo, useSyncExternalStore } from "react";
import { type RouteLitManager } from "./manager";
import { type ComponentStore } from "./component-store";
import Fragment from "../components/fragment";

interface Props {
  manager: RouteLitManager;
  componentStore: ComponentStore;
}

function getElement(
  name: string,
  key: string,
  address: number[] | undefined,
  props: Record<string, unknown>,
  children: RouteLitComponent[] | undefined,
  componentStore: ComponentStore
): React.ReactNode {
  if (name === "fragment") {
    return (
      <Fragment key={key as string} id={props.id as string} address={address} />
    );
  }
  const Component = componentStore.get(name);
  if (!Component) return null;
  return (
    <Component id={key} key={key} {...props}>
      {children?.map(renderComponentTree(componentStore))}
    </Component>
  );
}

function FinalComponent({
  c,
  componentStore,
}: {
  c: RouteLitComponent;
  componentStore: ComponentStore;
}): React.ReactNode {
  const element = useMemo(
    () =>
      getElement(c.name, c.key, c.address, c.props, c.children, componentStore),
    [c.name, c.key, c.address, c.props, c.children, componentStore]
  );
  const className = c.stale ? "rl-component rl-stale" : "rl-component";
  return <div className={className}>{element}</div>;
}

const renderComponentTree =
  (componentStore: ComponentStore) =>
  (c: RouteLitComponent): React.ReactNode => {
    return <FinalComponent key={c.key} c={c} componentStore={componentStore} />;
  };

function ReactRenderer({ manager, componentStore }: Props) {
  const componentsTree = useSyncExternalStore(
    manager.subscribe,
    manager.getComponentsTree
  );
  useSyncExternalStore(componentStore.subscribe, componentStore.getVersion);
  if (!componentsTree?.length) {
    return null;
  }
  return (
    <div className="rl-container">
      {componentsTree?.map(renderComponentTree(componentStore))}
    </div>
  );
}

export default ReactRenderer;
