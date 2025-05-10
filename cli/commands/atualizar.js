import { execSync } from 'node:child_process';
import readline from 'node:readline';
import chalk from 'chalk';

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, answer => {
    rl.close();
    resolve(answer);
  }));
}

export default async function atualizar() {
  console.log(chalk.cyan('\n🔄 Vamos salvar seu progresso no repositório Git.'));

  // Verifica se existe o remote origin
  let hasRemote = false;
  try {
    const remotes = execSync('git remote', { encoding: 'utf-8' }).split('\n');
    hasRemote = remotes.includes('origin');
  } catch {
    hasRemote = false;
  }

  if (!hasRemote) {
    console.log(chalk.red('\n❌ Não encontrei o repositório remoto (origin).'));
    console.log(chalk.yellow('➡️ Por favor, execute novamente o comando:'));
    console.log(chalk.blue('\n   node setup.js\n'));
    return;
  }

  const mensagem = await askQuestion('\n✏️  Descreva rapidamente o que você fez: ');

  if (!mensagem.trim()) {
    console.log(chalk.red('\n⚠️ Você precisa informar uma descrição para salvar.'));
    return;
  }

  try {
    console.log(chalk.blue('\n➡️ git add .'));
    execSync('git add .', { stdio: 'inherit' });

    console.log(chalk.blue(`\n➡️ git commit -m "${mensagem}"`));
    execSync(`git commit -m "${mensagem}"`, { stdio: 'inherit' });

    console.log(chalk.blue('\n➡️ git push origin main'));
    execSync('git push origin main', { stdio: 'inherit' });

    console.log(chalk.green('\n✅ Alterações salvas e enviadas com sucesso!\n'));
  } catch (err) {
    console.error(chalk.red('\n❌ Erro ao enviar para o repositório:'), err.message);
  }
}
