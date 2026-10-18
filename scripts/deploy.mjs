import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const KEY = join(homedir(), '.ssh', 'id_kz_work');
const HOST = 'ubuntu@paitza.com';
const REMOTE_STAGING = 'gvr-dist';
const setupOnly = process.argv.includes('--setup-only');

const sshOpts = [
  '-i', KEY,
  '-o', 'HostName=194.238.43.155',
  '-o', 'HostKeyAlias=paitza.com',
  '-o', 'ServerAliveInterval=60',
  '-o', 'ServerAliveCountMax=20',
  '-o', 'ConnectTimeout=300',
  '-o', 'TCPKeepAlive=yes',
  '-o', 'BatchMode=yes',
];

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      windowsHide: true,
      cwd: ROOT,
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited ${code}`));
    });
  });
}

function ssh(remoteCommand) {
  return run('ssh', [...sshOpts, HOST, remoteCommand]);
}

if (!existsSync(KEY)) {
  console.error(`Нет SSH-ключа: ${KEY}`);
  process.exit(1);
}

const remoteScript = readFileSync(join(__dirname, 'remote-setup.sh'), 'utf8');
const remoteB64 = Buffer.from(remoteScript, 'utf8').toString('base64');

function remoteBash(mode) {
  // base64 — без heredoc, стабильно из Windows OpenSSH
  return `printf %s ${remoteB64} | base64 -d | bash -s -- ${mode}`;
}

console.log('Настройка /var/www/html и nginx на paitza.com…');
await ssh(remoteBash('setup'));

if (setupOnly) {
  console.log('Сервер настроен. Дальше: npm run build:web && npm run deploy');
  process.exit(0);
}

const indexPath = join(ROOT, 'dist', 'index.html');
if (!existsSync(indexPath)) {
  console.error('Нет dist/index.html. Сначала: npm run build:web');
  process.exit(1);
}

console.log('Загрузка dist в ~/gvr-dist (каталог принадлежит ubuntu, setstat проходит)…');
await ssh(`rm -rf ~/${REMOTE_STAGING} && mkdir -p ~/${REMOTE_STAGING}`);
await run('scp', [
  ...sshOpts,
  '-r',
  'dist/.',
  `${HOST}:${REMOTE_STAGING}/`,
]);

console.log('Публикация в /var/www/html…');
await ssh(remoteBash('publish'));

console.log('Готово: https://paitza.com/');
