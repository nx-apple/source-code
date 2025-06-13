import {
  CreateNodesV2,
  CreateDependencies,
  CreateNodesContext,
  CreateNodesResult,
  ProjectConfiguration,
  logger,
  createNodesFromFiles,
  joinPathFragments,
  RawProjectGraphDependency,
  DependencyType,
} from '@nx/devkit';
import { dirname, join, relative } from 'path';
import { existsSync } from 'fs';

import { SwiftPackageManagerOptions, SwiftPackageManifest } from './types';
import { parseSwiftPackageManifest } from './parser';
import { createSwiftTargets } from './targets';

export const createNodesV2: CreateNodesV2<SwiftPackageManagerOptions> = [
  '**/Package.swift',
  async (configFiles, options, context) => {
    return await createNodesFromFiles(
      (configFile, options, context) => createSwiftPackageNode(configFile, options, context),
      configFiles,
      options,
      context
    );
  },
];

async function createSwiftPackageNode(
  configFile: string,
  options: SwiftPackageManagerOptions | undefined,
  context: CreateNodesContext
): Promise<CreateNodesResult> {
  const opts: SwiftPackageManagerOptions = {
    buildCommand: 'swift build',
    testCommand: 'swift test',
    lintCommand: 'swiftlint',
    includeTestTargets: true,
    includeLintTargets: true,
    ...options,
  };
  const projectRoot = dirname(configFile);
  const packageSwiftPath = join(context.workspaceRoot, configFile);

  // Check if this is a valid project by looking for package.json or project.json
  const projectJsonPath = join(context.workspaceRoot, projectRoot, 'project.json');
  const packageJsonPath = join(context.workspaceRoot, projectRoot, 'package.json');
  const isExistingProject = existsSync(projectJsonPath) || existsSync(packageJsonPath);

  try {
    // Parse Package.swift
    const manifest = parseSwiftPackageManifest(packageSwiftPath);
    
    if (!manifest) {
      return {};
    }

    const projectName = manifest.name || projectRoot.split('/').pop() || 'swift-package';
    
    // If this is an existing project, only add targets
    if (isExistingProject) {
      const targets = createSwiftTargets(projectRoot, manifest, opts, context.workspaceRoot);
      return {
        projects: {
          [projectRoot]: {
            targets,
          },
        },
      };
    }

    // Create full project configuration for new projects
    const projectConfig: ProjectConfiguration = {
      name: projectName,
      root: projectRoot,
      projectType: 'library', // Could be 'application' for executables
      sourceRoot: joinPathFragments(projectRoot, 'Sources'),
      tags: [`lang:swift`, `type:${getProjectType(manifest)}`],
    };

    // Create targets for build, test, and lint
    const targets = createSwiftTargets(projectRoot, manifest, opts, context.workspaceRoot);
    projectConfig.targets = targets;

    return {
      projects: {
        [projectRoot]: projectConfig,
      },
    };
  } catch (error) {
    logger.warn(`Failed to process Swift package at ${configFile}: ${error}`);
    return {};
  }
}

function getProjectType(manifest: SwiftPackageManifest): string {
  const hasExecutable = manifest.targets.some(target => target.type === 'executable');
  return hasExecutable ? 'application' : 'library';
}

export const createDependencies: CreateDependencies<SwiftPackageManagerOptions> = (
  _options,
  context
): RawProjectGraphDependency[] => {
  const dependencies: RawProjectGraphDependency[] = [];
  const { execSync } = require('child_process');
  const { existsSync } = require('fs');

  // Build a map of project names to their roots for quick lookup
  const projectNameMap = new Map<string, string>();
  for (const [projectRoot, project] of Object.entries(context.projects)) {
    if (project.name) {
      projectNameMap.set(project.name, projectRoot);
    }
    // Also map by the directory name as fallback
    const dirName = projectRoot.split('/').pop();
    if (dirName) {
      projectNameMap.set(dirName, projectRoot);
    }
  }

  // Only process files that need to be analyzed (changed files)
  for (const [projectRoot, projectFiles] of Object.entries(context.filesToProcess.projectFileMap)) {
    const packageSwiftFiles = projectFiles.filter(file => file.file.endsWith('Package.swift'));
    
    for (const packageFile of packageSwiftFiles) {
      const packageDir = join(context.workspaceRoot, dirname(packageFile.file));
      
      try {
        if (!existsSync(packageDir)) {
          continue;
        }

        // Use Swift CLI to dump package information
        const result = execSync('swift package dump-package', {
          cwd: packageDir,
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'ignore']
        });

        const packageData = JSON.parse(result);
        
        // Process dependencies from Swift package dump output
        if (packageData.dependencies) {
          for (const dep of packageData.dependencies) {
            // Handle local file system dependencies
            if (dep.fileSystem) {
              for (const fsDep of dep.fileSystem) {
                if (fsDep.path) {
                  // Convert absolute path to relative project root
                  const targetProjectRoot = relative(context.workspaceRoot, fsDep.path);
                  
                  // Find the target project
                  const targetProject = Object.keys(context.projects).find(project => 
                    project === targetProjectRoot
                  );

                  if (targetProject) {
                    dependencies.push({
                      source: projectRoot,
                      target: targetProject,
                      type: DependencyType.static,
                      sourceFile: packageFile.file,
                    });
                  }
                }
              }
            }

            // Handle remote SCM dependencies (for completeness)
            if (dep.scm) {
              // For now, we don't create dependencies for external packages
              // but this could be extended to create external nodes
            }
          }
        }

        // Also check target dependencies within the package
        if (packageData.targets) {
          for (const target of packageData.targets) {
            if (target.dependencies) {
              for (const depInfo of target.dependencies) {
                // Handle byName dependencies which reference other packages
                if (depInfo.byName && depInfo.byName[0]) {
                  const depName = depInfo.byName[0];
                  
                  // Check if this dependency refers to another project in workspace
                  const targetProject = projectNameMap.get(depName);
                  if (targetProject && targetProject !== projectRoot) {
                    dependencies.push({
                      source: projectRoot,
                      target: targetProject,
                      type: DependencyType.static,
                      sourceFile: packageFile.file,
                    });
                  }
                }
              }
            }
          }
        }

      } catch (swiftError) {
        // If swift package dump-package fails, fall back to our parser
        logger.debug(`Swift dump-package failed for ${packageFile.file}: ${swiftError}`);
        try {
          const packagePath = join(context.workspaceRoot, packageFile.file);
          const manifest = parseSwiftPackageManifest(packagePath);
          
          if (manifest && manifest.dependencies) {
            for (const dep of manifest.dependencies) {
              if (dep.path) {
                // This is a local dependency
                const targetProjectRoot = relative(context.workspaceRoot, 
                  join(dirname(packagePath), dep.path));
                
                // Check if target project exists in workspace
                const targetProject = Object.keys(context.projects).find(project => 
                  project === targetProjectRoot
                );

                if (targetProject) {
                  dependencies.push({
                    source: projectRoot,
                    target: targetProject,
                    type: DependencyType.static,
                    sourceFile: packageFile.file,
                  });
                }
              }
            }
          }
        } catch (parseError) {
          logger.warn(`Failed to parse Swift package at ${packageFile.file}: ${parseError}`);
        }
      }
    }
  }

  return dependencies;
};
