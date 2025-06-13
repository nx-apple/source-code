import { ExecutorContext, logger } from '@nx/devkit';
import { execSync } from 'child_process';
import { join } from 'path';

export interface SwiftExecutorOptions {
  command: string;
  args?: string[];
  cwd?: string;
}

export default async function runSwiftCommand(
  options: SwiftExecutorOptions,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const projectName = context.projectName;
  if (!projectName) {
    logger.error('No project name provided in context');
    return { success: false };
  }

  const projectRoot = context.projectsConfigurations?.projects[projectName]?.root;
  
  if (!projectRoot) {
    logger.error(`Could not find project root for ${projectName}`);
    return { success: false };
  }

  const cwd = options.cwd || join(context.root, projectRoot);
  const command = options.command;
  const args = options.args ? options.args.join(' ') : '';
  const fullCommand = `${command} ${args}`.trim();

  try {
    logger.info(`Executing: ${fullCommand} in ${cwd}`);
    
    execSync(fullCommand, {
      cwd,
      stdio: 'inherit',
      env: process.env,
    });

    return { success: true };
  } catch (error) {
    logger.error(`Command failed: ${fullCommand}`);
    logger.error(error);
    return { success: false };
  }
}
