import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const harnessPath = join(root, 'docs/harness/claude-progress.txt');
const featureListPath = join(root, 'docs/harness/feature-list.json');
const changesPath = join(root, 'openspec/changes');

const allowedActiveChanges = new Map([
  [
    'inventory-camera-quick-entry',
    {
      featureId: 'M12-A1',
      reason: 'Phase 12 Vision AI dependency is not ready yet',
    },
  ],
]);

function readText(path) {
  return readFileSync(path, 'utf8');
}

function getActiveSection(progressText) {
  const match = progressText.match(
    /## Active[^\n]*\n([\s\S]*?)(?=\n---|\n## |\s*$)/,
  );
  return match?.[1]?.trim() ?? '';
}

function flattenFeatures(featureList) {
  return featureList.milestones.flatMap((milestone) =>
    (milestone.features ?? []).map((feature) => ({
      milestoneId: milestone.id,
      milestoneTitle: milestone.title,
      ...feature,
    })),
  );
}

function listActiveChanges() {
  if (!existsSync(changesPath)) {
    return [];
  }

  return readdirSync(changesPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'archive')
    .map((entry) => {
      const changeDir = join(changesPath, entry.name);
      const tasksPath = join(changeDir, 'tasks.md');
      const tasksText = existsSync(tasksPath) ? readText(tasksPath) : '';
      const doneTasks = [...tasksText.matchAll(/^- \[x\]/gim)].length;
      const openTasks = [...tasksText.matchAll(/^- \[ \]/gim)].length;
      const totalTasks = doneTasks + openTasks;
      const allowance = allowedActiveChanges.get(entry.name);

      return {
        name: entry.name,
        path: `openspec/changes/${entry.name}`,
        tasksPath,
        doneTasks,
        openTasks,
        totalTasks,
        allowance,
      };
    });
}

function containsDoneReference(progressText, feature) {
  const doneLines = progressText
    .split('\n')
    .filter((line) => /\[DONE\]/i.test(line));
  const descriptionLead = feature.description.split(/[：:]/)[0];

  return doneLines.some(
    (line) => line.includes(feature.id) || line.includes(descriptionLead),
  );
}

function printList(title, items, formatter) {
  console.log(`\n${title}`);
  if (items.length === 0) {
    console.log('- none');
    return;
  }

  for (const item of items) {
    console.log(`- ${formatter(item)}`);
  }
}

const errors = [];
const warnings = [];

if (!existsSync(harnessPath)) {
  errors.push(`Missing Harness progress file: ${harnessPath}`);
}

if (!existsSync(featureListPath)) {
  errors.push(`Missing Harness feature list: ${featureListPath}`);
}

if (errors.length === 0) {
  const progressText = readText(harnessPath);
  const activeSection = getActiveSection(progressText);
  const featureList = JSON.parse(readText(featureListPath));
  const features = flattenFeatures(featureList);
  const activeChanges = listActiveChanges();
  const pendingFeatures = features.filter((feature) =>
    ['pending', 'in_progress'].includes(feature.status),
  );

  const activeSaysNone = /无进行中的核心实现任务|无进行中|none/i.test(
    activeSection,
  );

  for (const change of activeChanges) {
    const feature = change.allowance
      ? features.find((item) => item.id === change.allowance.featureId)
      : undefined;

    if (change.totalTasks > 0 && change.openTasks === 0) {
      errors.push(
        `${change.path} has all tasks complete but is still outside archive.`,
      );
    }

    if (!change.allowance) {
      if (activeSaysNone) {
        errors.push(
          `${change.path} is active while Harness Active says no active implementation task.`,
        );
      }

      const mentioned = activeSection.includes(change.name);
      if (!mentioned) {
        errors.push(`${change.path} is not mentioned in Harness Active.`);
      }
    }

    if (change.allowance) {
      const mentioned =
        activeSection.includes(change.name) ||
        activeSection.includes(change.allowance.featureId);

      if (!mentioned) {
        errors.push(
          `${change.path} is allowed, but Harness Active must mention ${change.name} or ${change.allowance.featureId}.`,
        );
      }

      if (!feature) {
        errors.push(
          `${change.path} allowance points to missing feature ${change.allowance.featureId}.`,
        );
      } else if (feature.status !== 'pending') {
        errors.push(
          `${change.path} allowance expects ${feature.id} to remain pending, found ${feature.status}.`,
        );
      }
    }
  }

  for (const feature of features) {
    const relatedChange = activeChanges.find(
      (change) => change.allowance?.featureId === feature.id,
    );

    if (feature.status === 'done' && relatedChange) {
      errors.push(
        `${feature.id} is done but ${relatedChange.path} is still active.`,
      );
    }

    if (
      ['pending', 'in_progress'].includes(feature.status) &&
      containsDoneReference(progressText, feature)
    ) {
      errors.push(
        `${feature.id} is ${feature.status} in feature-list but appears in Harness DONE entries.`,
      );
    }
  }

  if (activeChanges.length === 0 && !activeSaysNone) {
    warnings.push(
      'No active OpenSpec changes found, but Harness Active is not empty.',
    );
  }

  console.log('Agent workflow status');
  console.log('=====================');
  console.log(`Harness Active: ${activeSection || '(missing)'}`);

  printList(
    'Pending / in-progress features',
    pendingFeatures,
    (feature) => `${feature.id} [${feature.status}] ${feature.description}`,
  );

  printList('OpenSpec active changes', activeChanges, (change) => {
    const suffix = change.allowance
      ? `allowed (${change.allowance.featureId}: ${change.allowance.reason})`
      : 'requires active Harness task';
    return `${change.name} ${change.doneTasks}/${change.totalTasks} tasks, ${suffix}`;
  });
}

if (warnings.length > 0) {
  printList('Warnings', warnings, (warning) => warning);
}

if (errors.length > 0) {
  printList('Errors', errors, (error) => error);
  process.exitCode = 1;
} else {
  console.log('\nStatus: OK');
}
