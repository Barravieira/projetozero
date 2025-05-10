import { execSync } from 'node:child_process';
import chalk from 'chalk';

export default async function () {
  console.log(chalk.cyan('\n🚀 Vamos atualizar o projeto online'));

  try {
    console.log(chalk.blue('\n➡️ Executando: npm run build'));
    execSync('npm run build', { stdio: 'inherit' });

    console.log(chalk.blue('\n➡️ Executando: firebase deploy --only hosting'));
    execSync('firebase deploy --only hosting', { stdio: 'inherit' });

    console.log(chalk.green('\n✅ Projeto atualizado com sucesso no Firebase Hosting!'));
  } catch (err) {
    console.error(chalk.red('\n❌ Ocorreu um erro durante o deploy:'), err.message);
  }
}
