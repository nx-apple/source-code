import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  Tree,
  names,
  offsetFromRoot,
  ProjectConfiguration,
} from '@nx/devkit';
import * as path from 'path';
import { SwiftPackageGeneratorSchema } from '../../lib/types';

interface NormalizedSchema extends SwiftPackageGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

export default async function swiftPackageGenerator(tree: Tree, options: SwiftPackageGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);
  addProjectConfiguration(tree, normalizedOptions.projectName, createProjectConfiguration(normalizedOptions));
  addFiles(tree, normalizedOptions);
  
  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return () => {
    console.log(`
🎉 Swift package "${options.name}" created successfully!

📁 Location: ${normalizedOptions.projectRoot}

🚀 Next steps:
  • cd ${normalizedOptions.projectRoot}
  • swift build (to build the package)
  • swift test (to run tests)
  • nx build ${normalizedOptions.projectName} (to build with Nx)
  • nx test ${normalizedOptions.projectName} (to test with Nx)

📖 The package includes:
  • Package.swift (package manifest)
  • Source files in Sources/${names(options.name).className}/
  • Test files in Tests/${names(options.name).className}Tests/
  • README.md with documentation
  • .swiftlint.yml for code quality${options.type === 'library' ? `

📦 To use this library in other Swift packages:
  Add to Package.swift dependencies:
  .package(path: "../${options.name}")` : ''}
`);
  };
}

function normalizeOptions(tree: Tree, options: SwiftPackageGeneratorSchema): NormalizedSchema {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory ? `${names(options.directory).fileName}/${name}` : name;
  const projectName = options.name;
  const projectRoot = options.directory ? `${options.directory}/${name}` : `swift-packages/${name}`;
  const parsedTags = options.tags ? options.tags.split(',').map((s) => s.trim()) : [];

  // Normalize platforms - convert array of strings to properly formatted Swift platforms
  const normalizedPlatforms = options.platforms?.map(platform => {
    if (platform.includes('(')) {
      return platform; // Already formatted like "macOS(.v13)"
    }
    // Convert simple platform names to Swift format
    switch (platform.toLowerCase()) {
      case 'macos':
        return 'macOS(.v13)';
      case 'ios':
        return 'iOS(.v16)';
      case 'watchos':
        return 'watchOS(.v9)';
      case 'tvos':
        return 'tvOS(.v16)';
      default:
        return platform;
    }
  }) || ['macOS(.v13)', 'iOS(.v16)'];

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
    platforms: normalizedPlatforms,
  };
}

function createProjectConfiguration(options: NormalizedSchema): ProjectConfiguration {
  return {
    root: options.projectRoot,
    projectType: options.type === 'executable' ? 'application' : 'library',
    sourceRoot: `${options.projectRoot}/Sources`,
    tags: [...options.parsedTags, 'lang:swift', `type:${options.type}`],
  };
}

function addFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '',
    platforms: options.platforms || ['macOS(.v13)', 'iOS(.v16)'],
    dependencies: options.dependencies || [],
    className: names(options.name).className,
    propertyName: names(options.name).propertyName,
  };
  generateFiles(tree, path.join(__dirname, 'files'), options.projectRoot, templateOptions);
}
