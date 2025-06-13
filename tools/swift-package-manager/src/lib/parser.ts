import { readFileSync } from 'fs';
import { SwiftPackageManifest, SwiftPackageDependency, SwiftPackageTarget } from './types';

/**
 * Parse a Package.swift file and extract manifest information
 */
export function parseSwiftPackageManifest(packagePath: string): SwiftPackageManifest | null {
  console.log('Parser function called with:', packagePath);
  
  try {
    console.log('Parsing package at:', packagePath);
    
    const content = readFileSync(packagePath, 'utf-8');
    console.log('Read file content, length:', content.length);
    
    const name = extractPackageName(content);
    const dependencies = extractDependencies(content);
    const targets = extractTargets(content);
    const products = extractProducts(content);
    const platforms = extractPlatforms(content);
    
    const manifest: SwiftPackageManifest = {
      name,
      platforms,
      dependencies,
      targets,
      products
    };
    
    console.log('Returning manifest:', manifest);
    return manifest;
  } catch (error) {
    console.error(`Failed to parse Package.swift at ${packagePath}:`, error);
    return null;
  }
}

function extractPackageName(content: string): string {
  const nameMatch = content.match(/name:\s*"([^"]+)"/);
  return nameMatch ? nameMatch[1] : 'unknown-package';
}

function extractDependencies(content: string): SwiftPackageDependency[] {
  const dependencies: SwiftPackageDependency[] = [];
  
  // Extract dependencies array
  const depsMatch = content.match(/dependencies:\s*\[([\s\S]*?)\]/);
  if (!depsMatch) return dependencies;
  
  const depsContent = depsMatch[1];
  
  // Simple regex patterns for different dependency types
  const urlDeps = depsContent.matchAll(/\.package\s*\(\s*url:\s*"([^"]+)"[^)]*\)/g);
  for (const match of urlDeps) {
    const url = match[1];
    const name = extractNameFromUrl(url);
    dependencies.push({ name, url });
  }
  
  const pathDeps = depsContent.matchAll(/\.package\s*\(\s*path:\s*"([^"]+)"\s*\)/g);
  for (const match of pathDeps) {
    const path = match[1];
    const name = path.split('/').pop() || path;
    dependencies.push({ name, path });
  }
  
  return dependencies;
}

function extractTargets(content: string): SwiftPackageTarget[] {
  const targets: SwiftPackageTarget[] = [];
  
  const targetsMatch = content.match(/targets:\s*\[([\s\S]*?)\]/);
  if (!targetsMatch) return targets;
  
  const targetsContent = targetsMatch[1];
  
  // Extract target definitions
  const targetMatches = targetsContent.matchAll(/\.(?:target|executableTarget|testTarget)\s*\(\s*name:\s*"([^"]+)"[^)]*\)/g);
  
  for (const match of targetMatches) {
    const name = match[1];
    const fullMatch = match[0];
    
    let type: 'executable' | 'library' | 'test' = 'library';
    if (fullMatch.includes('.executableTarget')) {
      type = 'executable';
    } else if (fullMatch.includes('.testTarget')) {
      type = 'test';
    }
    
    const dependencies = extractTargetDependencies(fullMatch);
    
    targets.push({
      name,
      type,
      dependencies,
    });
  }
  
  return targets;
}

function extractProducts(content: string): Array<{ name: string; type: 'executable' | 'library'; targets: string[] }> {
  const products: Array<{ name: string; type: 'executable' | 'library'; targets: string[] }> = [];
  
  const productsMatch = content.match(/products:\s*\[([\s\S]*?)\]/);
  if (!productsMatch) return products;
  
  const productsContent = productsMatch[1];
  
  const productMatches = productsContent.matchAll(/\.(?:library|executable)\s*\(\s*name:\s*"([^"]+)"[^)]*\)/g);
  
  for (const match of productMatches) {
    const name = match[1];
    const fullMatch = match[0];
    
    const type: 'executable' | 'library' = fullMatch.includes('.executable') ? 'executable' : 'library';
    const targets = extractProductTargets(fullMatch);
    
    products.push({
      name,
      type,
      targets,
    });
  }
  
  return products;
}

function extractPlatforms(content: string): Record<string, string> | undefined {
  const platformsMatch = content.match(/platforms:\s*\[([\s\S]*?)\]/);
  if (!platformsMatch) return undefined;
  
  const platforms: Record<string, string> = {};
  const platformsContent = platformsMatch[1];
  
  const platformMatches = platformsContent.matchAll(/\.(\w+)\s*\(\s*[^)]*"?([^")]+)"?\s*\)/g);
  for (const match of platformMatches) {
    const platform = match[1];
    const version = match[2];
    platforms[platform] = version;
  }
  
  return Object.keys(platforms).length > 0 ? platforms : undefined;
}

function extractTargetDependencies(targetContent: string): string[] {
  const dependencies: string[] = [];
  
  const depsMatch = targetContent.match(/dependencies:\s*\[([\s\S]*?)\]/);
  if (!depsMatch) return dependencies;
  
  const depsContent = depsMatch[1];
  const depMatches = depsContent.matchAll(/"([^"]+)"/g);
  
  for (const match of depMatches) {
    dependencies.push(match[1]);
  }
  
  return dependencies;
}

function extractProductTargets(productContent: string): string[] {
  const targets: string[] = [];
  
  const targetsMatch = productContent.match(/targets:\s*\[([\s\S]*?)\]/);
  if (!targetsMatch) return targets;
  
  const targetsContent = targetsMatch[1];
  const targetMatches = targetsContent.matchAll(/"([^"]+)"/g);
  
  for (const match of targetMatches) {
    targets.push(match[1]);
  }
  
  return targets;
}

function extractNameFromUrl(url: string): string {
  // Extract package name from Git URL
  const match = url.match(/\/([^/]+?)(?:\.git)?$/);
  return match ? match[1] : url.split('/').pop() || url;
}
