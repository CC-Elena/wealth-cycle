import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const checks = [];
const warnings = [];

function commandVersion(command, args) {
  try {
    return execFileSync(command, args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
}

function check(condition, ok, fail) {
  checks.push({ ok: Boolean(condition), okMessage: ok, failMessage: fail });
}

const nodeMajor = Number.parseInt(process.versions.node.split('.')[0], 10);
check(
  nodeMajor >= 20,
  `Node ${process.version}`,
  `Node ${process.version} is below the required >=20 range.`,
);

const pnpmVersion = commandVersion('pnpm', ['--version']);
check(pnpmVersion, `pnpm ${pnpmVersion}`, 'pnpm is not available on PATH.');

const openspecVersion = commandVersion('openspec', ['--version']);
check(
  openspecVersion,
  `openspec ${openspecVersion}`,
  'OpenSpec CLI is not available on PATH.',
);

check(
  existsSync(join(root, 'node_modules')),
  'node_modules exists',
  'node_modules is missing; run pnpm install.',
);

const sqliteNativeBinaries = [
  {
    name: 'better-sqlite3',
    path: join(
      root,
      'node_modules/.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3/build/Release/better_sqlite3.node',
    ),
  },
  {
    name: 'better-sqlite3-multiple-ciphers',
    path: join(
      root,
      'node_modules/.pnpm/better-sqlite3-multiple-ciphers@12.9.0/node_modules/better-sqlite3-multiple-ciphers/build/Release/better_sqlite3.node',
    ),
  },
];

for (const binary of sqliteNativeBinaries) {
  if (!existsSync(binary.path)) {
    warnings.push(
      `${binary.name} native binary was not found. Static checks and builds can still run, but backend runtime access to SQLite/SQLCipher needs a C++20-capable toolchain or downloadable prebuilt packages.`,
    );
  }
}

console.log('Agent bootstrap check');
console.log('=====================');

for (const item of checks) {
  console.log(
    `${item.ok ? 'OK' : 'FAIL'} ${item.ok ? item.okMessage : item.failMessage}`,
  );
}

if (warnings.length > 0) {
  console.log('\nWarnings');
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}

const failed = checks.filter((item) => !item.ok);

if (failed.length > 0) {
  console.log('\nBootstrap: FAILED');
  process.exitCode = 1;
} else {
  console.log('\nBootstrap: OK');
}
