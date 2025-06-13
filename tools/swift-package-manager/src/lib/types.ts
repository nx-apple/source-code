/**
 * Options for the Swift Package Manager plugin
 */
export interface SwiftPackageManagerOptions {
  /**
   * Build command to run for swift packages (default: 'swift build')
   */
  buildCommand?: string;
  
  /**
   * Test command to run for swift packages (default: 'swift test')
   */
  testCommand?: string;
  
  /**
   * Lint command to run for swift packages (default: 'swiftlint')
   */
  lintCommand?: string;
  
  /**
   * Whether to include test targets (default: true)
   */
  includeTestTargets?: boolean;
  
  /**
   * Whether to include lint targets (default: true)
   */
  includeLintTargets?: boolean;
}

/**
 * Swift Package dependency structure
 */
export interface SwiftPackageDependency {
  name: string;
  url?: string;
  path?: string;
  version?: string;
  branch?: string;
  commit?: string;
}

/**
 * Swift Package target information
 */
export interface SwiftPackageTarget {
  name: string;
  type: 'executable' | 'library' | 'test';
  dependencies: string[];
  path?: string;
}

/**
 * Parsed Swift Package.swift content
 */
export interface SwiftPackageManifest {
  name: string;
  platforms?: Record<string, string>;
  dependencies: SwiftPackageDependency[];
  targets: SwiftPackageTarget[];
  products: Array<{
    name: string;
    type: 'executable' | 'library';
    targets: string[];
  }>;
}

/**
 * Generator schema for creating Swift packages
 */
export interface SwiftPackageGeneratorSchema {
  name: string;
  directory?: string;
  type: 'library' | 'executable';
  platforms?: string[];
  dependencies?: string[];
  tags?: string;
  skipFormat?: boolean;
}
