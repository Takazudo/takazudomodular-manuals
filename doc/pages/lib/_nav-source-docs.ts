import { routeContext } from 'virtual:zudo-doc-route-context';
import { createRouteContext, type RouteContextPayload } from '@takazudo/zudo-doc/route-context';

export type { NavSourceDocs, NavSourceOptions } from '@takazudo/zudo-doc/nav-source-docs';

const routeCtx = createRouteContext(routeContext as unknown as RouteContextPayload);

export const {
  resolveNavSource,
  resolveVersionedLocaleSource,
  loadNavSourceDocs,
  stableMergeCategoryMeta,
  stableNavDocs,
} = routeCtx;
