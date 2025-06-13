import { TargetConfiguration } from '@nx/devkit';
import { SwiftPackageManifest, SwiftPackageManagerOptions } from './types';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Create Nx targets for a Swift package
 */
export function createSwiftTargets(
  projectRoot: string,
  manifest: SwiftPackageManifest,
  options: SwiftPackageManagerOptions = {},
  workspaceRoot?: string
): Record<string, TargetConfiguration> {
  const targets: Record<string, TargetConfiguration> = {};

  // Build target
  targets.build = createBuildTarget(projectRoot, manifest, options);

  // Test target - check for Tests directory or test targets in manifest
  if (options.includeTestTargets !== false && shouldIncludeTestTarget(projectRoot, manifest, workspaceRoot)) {
    targets.test = createTestTarget(projectRoot, manifest, options);
  }

  // Lint target
  if (options.includeLintTargets !== false) {
    targets.lint = createLintTarget(projectRoot, manifest, options);
  }

  // Clean target
  targets.clean = createCleanTarget(projectRoot);

  return targets;
}

function createBuildTarget(
  projectRoot: string,
  manifest: SwiftPackageManifest,
  options: SwiftPackageManagerOptions
): TargetConfiguration {
  const command = options.buildCommand || 'swift build';
  
  return {
    command,
    options: {
      cwd: projectRoot,
    },
    cache: true,
    inputs: [
      '{projectRoot}/Package.swift',
      '{projectRoot}/Sources/**/*',
      '{projectRoot}/Package.resolved',
    ],
    outputs: ['{projectRoot}/.build'],
  };
}

function createTestTarget(
  projectRoot: string,
  manifest: SwiftPackageManifest,
  options: SwiftPackageManagerOptions
): TargetConfiguration {
  const command = options.testCommand || 'swift test';
  
  return {
    command,
    options: {
      cwd: projectRoot,
    },
    cache: true,
    inputs: [
      '{projectRoot}/Package.swift',
      '{projectRoot}/Sources/**/*',
      '{projectRoot}/Tests/**/*',
      '{projectRoot}/Package.resolved',
    ],
    outputs: ['{projectRoot}/.build'],
    dependsOn: ['^build'],
  };
}

function createLintTarget(
  projectRoot: string,
  manifest: SwiftPackageManifest,
  options: SwiftPackageManagerOptions
): TargetConfiguration {
  const command = options.lintCommand || 'swiftlint';
  
  return {
    command,
    options: {
      cwd: projectRoot,
    },
    cache: true,
    inputs: [
      '{projectRoot}/Sources/**/*.swift',
      '{projectRoot}/Tests/**/*.swift',
      '{projectRoot}/.swiftlint.yml',
    ],
  };
}

function createCleanTarget(projectRoot: string): TargetConfiguration {
  return {
    command: 'swift package clean',
    options: {
      cwd: projectRoot,
    },
  };
}

function shouldIncludeTestTarget(projectRoot: string, manifest: SwiftPackageManifest, workspaceRoot?: string): boolean {
  // Check if Tests directory exists
  if (workspaceRoot) {
    const testsDir = join(workspaceRoot, projectRoot, 'Tests');
    if (existsSync(testsDir)) {
      return true;
    }
  }
  
  // Also check if manifest has test targets (in case parser worked)
  return manifest.targets.some(target => target.type === 'test');
}
