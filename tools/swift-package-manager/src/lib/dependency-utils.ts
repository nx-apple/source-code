import { SwiftPackageManifest, SwiftPackageDependency } from './types';

/**
 * Utility functions for managing Swift package dependencies
 */

/**
 * Extract dependency name from a URL
 */
export function extractNameFromUrl(url: string): string {
  const match = url.match(/\/([^/]+?)(?:\.git)?$/);
  return match ? match[1] : url.split('/').pop() || url;
}

/**
 * Check if a dependency already exists in the manifest
 */
export function dependencyExists(manifest: SwiftPackageManifest, dependency: SwiftPackageDependency): boolean {
  return manifest.dependencies.some(dep => {
    if (dep.url && dependency.url) {
      return dep.url === dependency.url;
    }
    if (dep.path && dependency.path) {
      return dep.path === dependency.path;
    }
    return dep.name === dependency.name;
  });
}

/**
 * Find a dependency by name, URL, or path
 */
export function findDependency(
  manifest: SwiftPackageManifest, 
  identifier: string
): SwiftPackageDependency | undefined {
  return manifest.dependencies.find(dep => {
    return dep.name === identifier || 
           dep.url === identifier || 
           dep.path === identifier ||
           (dep.url && extractNameFromUrl(dep.url) === identifier);
  });
}

/**
 * Check if a dependency is used by any target
 */
export function isDependencyUsedInTargets(manifest: SwiftPackageManifest, dependencyName: string): boolean {
  return manifest.targets.some(target => 
    target.dependencies.includes(dependencyName)
  );
}

/**
 * Get targets that use a specific dependency
 */
export function getTargetsUsingDependency(manifest: SwiftPackageManifest, dependencyName: string): string[] {
  return manifest.targets
    .filter(target => target.dependencies.includes(dependencyName))
    .map(target => target.name);
}

/**
 * Validate version constraint format
 */
export function validateVersionConstraint(version: string): boolean {
  // Check for valid Swift Package Manager version formats
  const validPatterns = [
    /^from:\s*"[\d.]+(-[\w.]+)?"$/, // from: "1.0.0"
    /^branch:\s*"[\w\-/.]+"$/, // branch: "main"
    /^revision:\s*"[a-f0-9]+"$/, // revision: "abc123"
    /^[\d.]+(-[\w.]+)?$/, // Simple version: "1.0.0"
    /^"[\d.]+(-[\w.]+)?"$/, // Quoted version: "1.0.0"
    /^\..<[\d.]+(-[\w.]+)?$/, // Range: ..<2.0.0
    /^[\d.]+(-[\w.]+)?\..<[\d.]+(-[\w.]+)?$/, // Range: 1.0.0..<2.0.0
  ];

  return validPatterns.some(pattern => pattern.test(version));
}

/**
 * Format version constraint for Package.swift
 */
export function formatVersionConstraint(version: string): string {
  // If it already contains formatting keywords, return as-is
  if (version.includes('from:') || version.includes('branch:') || version.includes('revision:')) {
    return version;
  }

  // If it's a simple version number, wrap it with from:
  if (/^[\d.]+(-[\w.]+)?$/.test(version)) {
    return `from: "${version}"`;
  }

  // If it's already quoted, assume it's properly formatted
  if (version.startsWith('"') && version.endsWith('"')) {
    return `from: ${version}`;
  }

  // Default to from: with quotes
  return `from: "${version}"`;
}

/**
 * Get relative path between two directories
 */
export function getRelativePath(fromPath: string, toPath: string): string {
  const fromParts = fromPath.split('/').filter(p => p);
  const toParts = toPath.split('/').filter(p => p);
  
  // Find common prefix
  let commonLength = 0;
  for (let i = 0; i < Math.min(fromParts.length, toParts.length); i++) {
    if (fromParts[i] === toParts[i]) {
      commonLength++;
    } else {
      break;
    }
  }
  
  // Build relative path
  const upLevels = fromParts.length - commonLength;
  const downPath = toParts.slice(commonLength);
  
  const upParts = Array(upLevels).fill('..');
  const result = [...upParts, ...downPath].join('/') || '.';
  
  return result;
}

/**
 * Parse dependency string from Package.swift content
 */
export function parseDependencyString(dependencyString: string): SwiftPackageDependency | null {
  const trimmed = dependencyString.trim();
  
  // Parse .package(url: "...", ...)
  const urlMatch = trimmed.match(/\.package\s*\(\s*url:\s*"([^"]+)"(?:\s*,\s*(.+))?\s*\)/);
  if (urlMatch) {
    const url = urlMatch[1];
    const name = extractNameFromUrl(url);
    const versionPart = urlMatch[2];
    
    const dependency: SwiftPackageDependency = { name, url };
    
    if (versionPart) {
      const versionMatch = versionPart.match(/from:\s*"([^"]+)"/);
      const branchMatch = versionPart.match(/branch:\s*"([^"]+)"/);
      const revisionMatch = versionPart.match(/revision:\s*"([^"]+)"/);
      
      if (versionMatch) {
        dependency.version = versionMatch[1];
      } else if (branchMatch) {
        dependency.branch = branchMatch[1];
      } else if (revisionMatch) {
        dependency.commit = revisionMatch[1];
      }
    }
    
    return dependency;
  }
  
  // Parse .package(path: "...")
  const pathMatch = trimmed.match(/\.package\s*\(\s*path:\s*"([^"]+)"\s*\)/);
  if (pathMatch) {
    const path = pathMatch[1];
    const name = path.split('/').pop() || path;
    return { name, path };
  }
  
  return null;
}
