/**
 * React render counts for the instrumented pass, in the profiling build of
 * the benchmark app (bench:build builds it into dist/profiling).
 *
 * - commits and render time come from a <Profiler> around the Table: the
 *   number of commits in which the Table rendered, and the sum of their
 *   actualDuration
 * - per-component render counts come from a minimal React DevTools global
 *   hook. React calls the hook's onCommitFiberRoot after every commit; the
 *   probe walks the parts of the committed fiber tree that changed and counts
 *   the tracked components that rendered. selfMs is the components' own
 *   render time (selfBaseDuration), excluding their children; it is only
 *   recorded by profiling builds of React.
 *
 * installReactProbe must run before react-dom is evaluated, React looks for
 * the hook when it loads.
 */
import type { ComponentRenderStats, ReactStats } from "./types";

/** The parts of a React Fiber the probe reads */
interface Fiber {
  alternate: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
  elementType: unknown;
  type: unknown;
  flags: number;
  selfBaseDuration?: number;
}

interface FiberRoot {
  current: Fiber;
}

/** Fiber flag set on a fiber whose component function ran in this render */
const PERFORMED_WORK = 1;

const tracked = new Map<unknown, string>();
let stats: ReactStats = emptyStats();

function emptyStats(): ReactStats {
  const components: Record<string, ComponentRenderStats> = {};
  for (const name of tracked.values()) {
    components[name] = { renders: 0, mounts: 0, selfMs: 0 };
  }
  return { commits: 0, renderMs: 0, components };
}

const visit = (fiber: Fiber) => {
  const previous = fiber.alternate;
  const name = tracked.get(fiber.elementType) ?? tracked.get(fiber.type);
  if (name !== undefined) {
    const mounted = previous === null;
    if (mounted || (fiber.flags & PERFORMED_WORK) !== 0) {
      const component = stats.components[name];
      component.renders += 1;
      if (mounted) component.mounts += 1;
      component.selfMs += fiber.selfBaseDuration ?? 0;
    }
  }
  // a fiber whose children were not cloned has no work below it in this
  // commit, its subtree still holds fibers from earlier commits
  if (previous === null || fiber.child !== previous.child) {
    for (let child = fiber.child; child !== null; child = child.sibling) {
      visit(child);
    }
  }
};

export const installReactProbe = () => {
  let renderers = 0;
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    supportsFiber: true,
    renderers: new Map(),
    inject: () => ++renderers,
    onCommitFiberRoot: (_rendererId: number, root: FiberRoot) => {
      if (tracked.size > 0) visit(root.current);
    },
    onCommitFiberUnmount: () => undefined,
    onPostCommitFiberRoot: () => undefined,
    checkDCE: () => undefined,
  };
  window.__vuuReactProbe = {
    reset: () => {
      stats = emptyStats();
    },
    read: () => {
      const components: Record<string, ComponentRenderStats> = {};
      for (const [name, c] of Object.entries(stats.components)) {
        components[name] = { ...c, selfMs: Math.round(c.selfMs * 10) / 10 };
      }
      return {
        commits: stats.commits,
        renderMs: Math.round(stats.renderMs * 10) / 10,
        components,
      };
    },
  };
};

/**
 * Components to count, by the value passed to createElement (for memo
 * components, the memo object), keyed by the name used in the results.
 */
export const trackComponents = (components: Record<string, unknown>) => {
  for (const [name, component] of Object.entries(components)) {
    tracked.set(component, name);
  }
  stats = emptyStats();
};

/** onRender callback for the <Profiler> around the Table */
export const onProfilerRender = (_id: string, _phase: string, ms: number) => {
  stats.commits += 1;
  stats.renderMs += ms;
};
