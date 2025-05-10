// setup.js
import { execSync } from 'node:child_process';
import { existsSync, copyFileSync } from 'node:fs';
import readline from 'node:readline';

console.log('\n📦 Oi pai! Vamos inicializar o novo projeto :)...\n');

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => {
    rl.question(query, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function run() {
  try {
    console.log('Primeiro de tudo, vamos instalar as dependências do projeto');
    console.log('➡️ npm install');
    execSync('npm install', { stdio: 'inherit' });

    if (!existsSync('.env')) {
      console.log('Agora vamos criar o arquivo .env para que você possa adicionar as configurações do projeto.');
      console.log('➡️ cp .env.example .env');
      copyFileSync('.env.example', '.env');
    } else {
      console.log('✅ O arquivo .env já existe. Não foi necessário copiar.');
      console.log('⚠️ Recomendo que você compare os arquivos .env e .env.example para ter certeza que não falta nenhuma chanve no .env');
    }

    console.log('Agora vamos remover o repositório base do projeto e adicionar o repositório que você criou');
    const sshUrl = await askQuestion('Digite o link SSH do novo repositório Git (ou deixe em branco para ignorar essa etapa): ');

    let remoteUpdated = false;

    if (sshUrl.trim()) {
      try {
        console.log('Certo, vamos atualizar o repositório');
        console.log('➡️ git remote remove origin');
        execSync('git remote remove origin', { stdio: 'ignore' });
      } catch {}
      console.log(`➡️ git remote add origin ${sshUrl}`);
      execSync(`git remote add origin ${sshUrl}`, { stdio: 'inherit' });
      remoteUpdated = true;
    } else {
      console.log('🔕 O repositório não será atualizado.');
    }

    if (remoteUpdated) {
      console.log('Como nós atualizamos o remote, vamos enviar agora os arquivos para o novo repositório');
    }

    console.log('\n✅✅✅ Pronto! O setup do projeto foi realizado. Você já pode abrir ele no editor e começar a trabalhar\n');
  } catch (err) {
    console.error('\n❌ Erro durante o setup:', err.message);
  }
}

run();
