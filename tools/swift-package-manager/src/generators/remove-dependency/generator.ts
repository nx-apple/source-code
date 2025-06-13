import { Tree, readProjectConfiguration, formatFiles, logger } from '@nx/devkit';
import { join } from 'path';
import { extractNameFromUrl } from '../../lib/dependency-utils';

export interface RemoveDependencyGeneratorSchema {
  project: string;
  dependency: string;
  targets?: string[];
  removeFromPackage?: boolean;
}

export default async function removeDependencyGenerator(
  tree: Tree,
  options: RemoveDependencyGeneratorSchema
) {
  const projectConfig = readProjectConfiguration(tree, options.project);
  const packageSwiftPath = join(projectConfig.root, 'Package.swift');

  if (!tree.exists(packageSwiftPath)) {
    throw new Error(`Package.swift not found at ${packageSwiftPath}`);
  }

  // Read and parse the current Package.swift
  const packageContent = tree.read(packageSwiftPath, 'utf-8');
  if (!packageContent) {
    throw new Error(`Failed to read Package.swift at ${packageSwiftPath}`);
  }

  // Parse targets from Package.swift content
  const targetMatches = packageContent.matchAll(/\.target\s*\(\s*name:\s*"([^"]+)"/g);
  const testTargetMatches = packageContent.matchAll(/\.testTarget\s*\(\s*name:\s*"([^"]+)"/g);
  
  const targetNames = [
    ...Array.from(targetMatches, match => match[1]),
    ...Array.from(testTargetMatches, match => match[1])
  ];
  
  let updatedContent = packageContent;
  let dependencyFound = false;

  // Find the dependency name to remove from targets
  const dependencyName = findDependencyName(packageContent, options.dependency);
  
  if (!dependencyName) {
    throw new Error(`Dependency "${options.dependency}" not found in project "${options.project}"`);
  }

  // Remove dependency from targets if specified, otherwise remove from all targets
  if (options.targets && options.targets.length > 0) {
    for (const targetName of options.targets) {
      const result = removeDependencyFromTarget(updatedContent, targetName, dependencyName);
      updatedContent = result.content;
      if (result.removed) dependencyFound = true;
    }
  } else {
    // Remove from all targets
    for (const targetName of targetNames) {
      const result = removeDependencyFromTarget(updatedContent, targetName, dependencyName);
      updatedContent = result.content;
      if (result.removed) dependencyFound = true;
    }
  }

  // Remove from package dependencies if requested and not used by any targets anymore
  if (options.removeFromPackage !== false) {
    const isStillUsed = checkIfDependencyIsUsedInTargets(updatedContent, dependencyName);
    if (!isStillUsed) {
      updatedContent = removeDependencyFromPackage(updatedContent, options.dependency);
    } else {
      logger.warn(`Dependency "${dependencyName}" is still used in some targets, not removing from package dependencies`);
    }
  }

  if (!dependencyFound) {
    logger.warn(`Dependency "${dependencyName}" was not found in any targets`);
  }

  // Write the updated content back
  tree.write(packageSwiftPath, updatedContent);

  await formatFiles(tree);

  logger.info(`✅ Successfully removed dependency "${dependencyName}" from project "${options.project}"`);

  return () => {
    logger.info(`Run 'swift package resolve' in ${projectConfig.root} to update resolved dependencies`);
  };
}

function findDependencyName(packageContent: string, dependencyIdentifier: string): string | null {
  // First try to find by URL match in the dependencies
  const urlRegex = new RegExp(`\\.package\\s*\\(\\s*url:\\s*"([^"]*${dependencyIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"]*)"`, 'g');
  const urlMatch = urlRegex.exec(packageContent);
  if (urlMatch) {
    // Extract the dependency name from the URL
    return extractNameFromUrl(urlMatch[1]);
  }

  // Then try to find by path match
  const pathRegex = new RegExp(`\\.package\\s*\\(\\s*path:\\s*"([^"]*${dependencyIdentifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^"]*)"`, 'g');
  const pathMatch = pathRegex.exec(packageContent);
  if (pathMatch) {
    // Extract the dependency name from the path
    const pathParts = pathMatch[1].split('/');
    return pathParts[pathParts.length - 1];
  }

  // Finally, assume it's the actual dependency name used in targets
  return dependencyIdentifier;
}

function removeDependencyFromTarget(content: string, targetName: string, dependencyName: string): { content: string; removed: boolean } {
  // Find the specific target and its dependencies
  const targetRegex = new RegExp(
    `(\\.(?:target|executableTarget|testTarget)\\s*\\(\\s*name:\\s*"${targetName}"[^\\)]*dependencies:\\s*\\[)([^\\]]*)([^\\)]*\\))`,
    'g'
  );

  let removed = false;
  const updatedContent = content.replace(targetRegex, (match, prefix, existingDeps, suffix) => {
    // Remove the dependency from the list
    const depArray = existingDeps
      .split(',')
      .map((dep: string) => dep.trim())
      .filter((dep: string) => {
        const cleanDep = dep.replace(/"/g, '').trim();
        if (cleanDep === dependencyName) {
          removed = true;
          return false;
        }
        return cleanDep.length > 0;
      });

    const updatedDeps = depArray.join(', ');
    return `${prefix}${updatedDeps}${suffix}`;
  });

  return { content: updatedContent, removed };
}

function removeDependencyFromPackage(content: string, dependencyIdentifier: string): string {
  // Find the dependencies array
  const dependenciesMatch = content.match(/(dependencies:\s*\[)([\s\S]*?)(\s*\])/);
  if (!dependenciesMatch) {
    throw new Error('Could not find dependencies array in Package.swift');
  }

  const [fullMatch, prefix, existingDeps, suffix] = dependenciesMatch;
  
  // Split dependencies into individual package declarations
  const packageDeclarations = [];
  let currentDeclaration = '';
  let parenCount = 0;
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < existingDeps.length; i++) {
    const char = existingDeps[i];
    
    if (escapeNext) {
      escapeNext = false;
      currentDeclaration += char;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      currentDeclaration += char;
      continue;
    }
    
    if (char === '"') {
      inString = !inString;
    }
    
    if (!inString) {
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
    }
    
    currentDeclaration += char;
    
    // If we've closed all parentheses and hit a comma (or end), we have a complete declaration
    if (!inString && parenCount === 0 && (char === ',' || i === existingDeps.length - 1)) {
      const trimmed = currentDeclaration.trim().replace(/,$/, '');
      if (trimmed && trimmed !== ',' && trimmed.includes('.package')) {
        packageDeclarations.push(trimmed);
      }
      currentDeclaration = '';
    }
  }
  
  // Filter out the dependency we want to remove
  const filteredDeclarations = packageDeclarations.filter(declaration => {
    // Check various ways the dependency might be referenced
    const containsUrl = declaration.includes(`url: "${dependencyIdentifier}"`);
    const containsPath = declaration.includes(`path: "${dependencyIdentifier}"`);
    const containsPartialUrl = dependencyIdentifier.includes('/') && declaration.includes(dependencyIdentifier);
    
    // Extract dependency name from URL if present
    let extractedName = '';
    const urlMatch = declaration.match(/url:\s*"([^"]+)"/);
    if (urlMatch) {
      extractedName = extractNameFromUrl(urlMatch[1]);
    }
    
    // Extract dependency name from path if present
    const pathMatch = declaration.match(/path:\s*"([^"]+)"/);
    if (pathMatch) {
      const pathParts = pathMatch[1].split('/');
      extractedName = pathParts[pathParts.length - 1];
    }
    
    const matchesName = extractedName === dependencyIdentifier;
    
    return !(containsUrl || containsPath || containsPartialUrl || matchesName);
  });

  // Reconstruct the dependencies array
  let updatedDeps = '';
  if (filteredDeclarations.length > 0) {
    updatedDeps = '\n        ' + filteredDeclarations.join(',\n        ') + '\n    ';
  }

  return content.replace(fullMatch, `${prefix}${updatedDeps}${suffix}`);
}

function checkIfDependencyIsUsedInTargets(content: string, dependencyName: string): boolean {
  // Check if the dependency is still referenced in any target
  const targetRegex = /\.(?:target|executableTarget|testTarget)\s*\([^)]*dependencies:\s*\[[^\]]*\]/g;
  let match;
  
  while ((match = targetRegex.exec(content)) !== null) {
    const targetBlock = match[0];
    if (targetBlock.includes(`"${dependencyName}"`)) {
      return true;
    }
  }
  
  return false;
}
