import { execSync } from 'node:child_process';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

export default async function () {
  console.log(chalk.cyan('\n🔗 Vamos conectar este projeto ao Firebase Hosting'));

  try {
    execSync('firebase --version', { stdio: 'ignore' });
  } catch {
    console.error(chalk.red('\n❌ firebase-tools não está instalado.'));
    console.log(chalk.yellow('➡️ Execute o setup novamente com:\n\n   node setup.js\n'));
    return;
  }

  try {
    console.log(chalk.blue('\n➡️ Autenticando com o Firebase (se necessário)...'));
    execSync('firebase login', { stdio: 'inherit' });
  } catch (err) {
    console.error(chalk.red('\n❌ Falha ao autenticar no Firebase:'), err.message);
    return;
  }

  try {
    console.log(chalk.blue('\n➡️ Iniciando configuração do Firebase Hosting...'));
    execSync('firebase init hosting', { stdio: 'inherit' });
  } catch (err) {
    console.error(chalk.red('\n❌ Erro durante o firebase init:'), err.message);
    return;
  }

  const firebaseJsonPath = path.resolve('firebase.json');
  if (!fs.existsSync(firebaseJsonPath)) {
    console.error(chalk.red('\n❌ Parece que a configuração não foi concluída corretamente.'));
    return;
  }

  console.log(chalk.green('\n✅ Projeto conectado ao Firebase Hosting com sucesso!'));
  console.log(chalk.cyan('\nPara publicar o projeto, use:'));
  console.log(chalk.blue('\n   firebase deploy --only hosting\n'));
}
