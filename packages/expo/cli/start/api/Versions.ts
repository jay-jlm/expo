import { ExpoConfig } from '@expo/config-types';
import semver from 'semver';

import { apiClient } from '../../utils/api';
import { EXPO_BETA } from '../../utils/env';
import { CommandError } from '../../utils/errors';
import { pickBy } from '../../utils/obj';
import { Cache } from './Cache';

export type SDKVersion = {
  androidExpoViewUrl?: string;
  expoReactNativeTag: string;
  /* deprecated */ exponentReactNativeTag?: string;
  expokitNpmPackage?: string;
  facebookReactNativeVersion: string;
  facebookReactVersion?: string;
  iosExpoViewUrl?: string;
  /* deprecated */ iosExponentViewUrl?: string;
  iosVersion?: string;
  isDeprecated?: boolean;
  packagesToInstallWhenEjecting?: { [name: string]: string };
  releaseNoteUrl?: string;
  iosClientUrl?: string;
  iosClientVersion?: string;
  androidClientUrl?: string;
  androidClientVersion?: string;
  relatedPackages?: { [name: string]: string };
  beta?: boolean;
};

export type SDKVersions = { [version: string]: SDKVersion };

type Versions = {
  androidUrl: string;
  androidVersion: string;
  iosUrl: string;
  iosVersion: string;
  sdkVersions: SDKVersions;
};

/** Get versions from remote endpoint. */
export async function getVersionsAsync(options?: { skipCache?: boolean }): Promise<Versions> {
  const versionCache = new Cache({
    getAsync: () =>
      apiClient
        .get('versions/latest')
        .json<{ data: Versions }>()
        .then(({ data }) => data),
    filename: 'versions.json',
    ttlMilliseconds: 0,
  });

  // Clear cache when opting in to beta because things can change quickly in beta
  if (EXPO_BETA || options?.skipCache) {
    versionCache.clearAsync();
  }

  return await versionCache.getAsync();
}

// NOTE(brentvatne): it is possible for an unreleased version to be published to
// the versions endpoint, but in some cases we only want to list out released
// versions
export async function getReleasedVersionsAsync(): Promise<SDKVersions> {
  const { sdkVersions } = await getVersionsAsync();
  return pickBy(
    sdkVersions,
    (data, _sdkVersionString) => !!data.releaseNoteUrl || (EXPO_BETA && data.beta)
  );
}

/** v1 >= v2. UNVERSIONED == true. nullish == false.  */
export function gte(v1: ExpoConfig['sdkVersion'], sdkVersion: string): boolean {
  if (!v1) {
    return false;
  }

  if (v1 === 'UNVERSIONED') {
    return true;
  }

  try {
    return semver.gte(v1, sdkVersion);
  } catch (e) {
    throw new CommandError(
      'INVALID_VERSION',
      `'${v1}' is not a valid version. Must be in the form of x.y.z`
    );
  }
}

/** v1 <= v2. UNVERSIONED == false. nullish == false.  */
export function lte(v1: ExpoConfig['sdkVersion'], v2: string): boolean {
  if (!v1 || v1 === 'UNVERSIONED') {
    return false;
  }

  try {
    return semver.lte(v1, v2);
  } catch {
    throw new CommandError(
      'INVALID_VERSION',
      `'${v1}' is not a valid version. Must be in the form of x.y.z`
    );
  }
}
