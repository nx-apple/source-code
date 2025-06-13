export { createNodesV2, createDependencies } from './lib/plugin';
export * from './lib/types';
export * from './lib/dependency-utils';

// Export generators for external access
export { default as swiftPackageGenerator } from './generators/swift-package/generator';
export { default as addDependencyGenerator } from './generators/add-dependency/generator';
export { default as removeDependencyGenerator } from './generators/remove-dependency/generator';

// Export executors for external access
export { default as swiftExecutor } from './executors/swift/executor';
