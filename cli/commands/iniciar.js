import { execSync } from 'node:child_process';
import chalk from 'chalk';

export default async function iniciar() {
  console.log(chalk.cyan('\n🚀 Iniciando o projeto em modo de desenvolvimento...'));
  console.log(chalk.blue('\n➡️ Executando: npm run dev\n'));

  try {
    execSync('npm run dev', { stdio: 'inherit' });
  } catch (err) {
    console.error(chalk.red('\n❌ Ocorreu um erro ao iniciar o projeto:'), err.message);
  }
}
