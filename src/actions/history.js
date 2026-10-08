import { LOCATION_CHANGE } from 'connected-react-router';

import { Page, parsePath } from '../url';
import { api } from '../api/backend';
import * as Types from './types';
import {
  checkLastRoutesData,
  checkRoutesData,
  commitTimeline,
  loadDevice,
  pushTimelineRange,
} from './index';

function applyView(view) {
  return (dispatch, getState) => {
    const dongleChanged = Boolean(view.dongleId) && view.dongleId !== getState().dongleId;
    if (dongleChanged) dispatch(loadDevice(view.dongleId));

    const state = getState();
    const prime = view.name === Page.prime;
    const stream = view.name === Page.stream;
    const settings = view.name === Page.settings;
    if (prime !== state.primeNav) dispatch({ type: Types.ACTION_PRIME_NAV, primeNav: prime });
    if (stream !== state.streamNav) dispatch({ type: Types.ACTION_STREAM_NAV, streamNav: stream });
    if (settings !== state.settingsNav) dispatch({ type: Types.ACTION_SETTINGS_NAV, settingsNav: settings });

    if (view.name === Page.drive) {
      dispatch(commitTimeline(view.routeId, view.zoom?.start ?? null, view.zoom?.end ?? null));
    } else {
      dispatch(commitTimeline(null, null, null));
    }

    if (!dongleChanged) return;
    if (view.name === Page.drive) dispatch(checkRoutesData());
    else dispatch(checkLastRoutesData());
  };
}

export function applyLocation(pathname) {
  return (dispatch, getState) => {
    const view = parsePath(pathname);

    if (!view.dongleId) {
      dispatch(applyView({ name: Page.device, dongleId: getState().dongleId }));
      return;
    }

    if (view.name === Page.legacy) {
      dispatch(applyView({ name: Page.device, dongleId: view.dongleId }));
      api.routes.getRoutesSegments(view.dongleId, view.legacy.start, view.legacy.end).then((routesData) => {
        if (routesData && routesData.length > 0) {
          const logId = routesData[0].fullname.split('|')[1];
          const duration = routesData[0].end_time_utc_millis - routesData[0].start_time_utc_millis;
          dispatch(pushTimelineRange(logId, 0, duration));
        }
      }).catch((err) => {
        console.error('Error fetching routes data for log ID conversion', err);
      });
      return;
    }

    dispatch(applyView(view));
  };
}

export const onHistoryMiddleware = ({ dispatch }) => (next) => (action) => {
  if (!action) return;

  next(action);
  if (action.type === LOCATION_CHANGE) {
    dispatch(applyLocation(action.payload.location.pathname));
  }
};
