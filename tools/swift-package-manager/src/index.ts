export { createNodesV2, createDependencies } from './lib/plugin';
export * from './lib/types';

// Export generators for external access
export { default as swiftPackageGenerator } from './generators/swift-package/generator';

// Export executors for external access
export { default as swiftExecutor } from './executors/swift/executor';
