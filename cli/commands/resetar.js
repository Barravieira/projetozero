import { execSync } from 'node:child_process';
import chalk from 'chalk';

export default async function resetar() {
  console.log(chalk.yellow('\n⚠️ Atenção! Isso vai descartar TODAS as alterações não salvas.'));
  console.log(chalk.yellow('Se você quiser manter algo, salve antes com:'));
  console.log(chalk.blue('\n   rodar atualizar\n'));

  try {
    console.log(chalk.blue('\n➡️ Executando: git checkout -f'));
    execSync('git checkout -f', { stdio: 'inherit' });
    console.log(chalk.green('\n✅ Tudo foi resetado com sucesso para o último comando de atualizar.'));
  } catch (err) {
    console.error(chalk.red('\n❌ Ocorreu um erro ao tentar resetar:'), err.message);
  }
}
