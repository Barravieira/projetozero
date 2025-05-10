import { execSync } from 'node:child_process';
import { existsSync, copyFileSync } from 'node:fs';
import path from 'path';
import fs from 'fs';
import readline from 'node:readline';

function toPackageName(name) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

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
    console.log('\n📦 Oi pai! Vamos inicializar o novo projeto :)...\n');

    const projectName = await askQuestion('📛 Primeiro de tudo, me diga: qual vai ser o nome do projeto? ');
    const packageName = toPackageName(projectName);

    console.log('Certo, agora vamos instalar as dependências do projeto');
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

    console.log('\nBeleza, vamos definir aplicar o nome do projeto aos lugares importantes...\n');
    const pkgPath = path.resolve('package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    pkg.name = packageName;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    console.log('\nAplicado nome do projeto ao package.json\n');

    const envPath = path.resolve('.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf-8');
      if (/^VITE_APP_NAME=.*/m.test(envContent)) {
        envContent = envContent.replace(/^VITE_APP_NAME=.*/m, `VITE_APP_NAME="${projectName}"`);
      } else {
        envContent += `\nVITE_APP_NAME="${projectName}"\n`;
      }
      fs.writeFileSync(envPath, envContent);
      console.log('\nAplicado nome do projeto no .env\n');
    }

    const htmlPath = path.resolve('index.html');
    if (fs.existsSync(htmlPath)) {
      let html = fs.readFileSync(htmlPath, 'utf-8');
      html = html.replace(/<title>.*<\/title>/, `<title>${projectName}</title>`);
      fs.writeFileSync(htmlPath, html);
      console.log('\nAdicionamos o nome do projeto ao título da aba, no navegador. \n');
    }

    console.log('Agora vamos remover o repositório base do projeto e adicionar o repositório que você criou');
    const sshUrl = await askQuestion('Digite o link SSH do novo repositório Git (ou deixe em branco apenas remover o base): ');

    let remoteUpdated = false;

    try {
      console.log('Certo, vamos atualizar o repositório');
      console.log('➡️ git remote remove origin');
      execSync('git remote remove origin', { stdio: 'ignore' });
    } catch {}

    if (sshUrl.trim()) {
      console.log(`➡️ git remote add origin ${sshUrl}`);
      execSync(`git remote add origin ${sshUrl}`, { stdio: 'inherit' });
      remoteUpdated = true;
    } else {
      console.log('🔕 Repositório base removido, mas nenhum novo adicionado.');
    }

    if (remoteUpdated) {
      console.log('Como nós atualizamos o remote, vamos enviar agora os arquivos para o novo repositório');
      
      try {
        console.log('➡️ git add .');
        execSync('git add .', { stdio: 'inherit' });

        console.log('➡️ git commit --allow-empty -m "[Automático] Primeiro commit"');
        execSync('git commit --allow-empty -m "[Automático] Primeiro commit"', { stdio: 'inherit' });

        console.log('➡️ git push -u origin HEAD');
        execSync('git push -u origin HEAD', { stdio: 'inherit' });

        console.log('✅ Projeto enviado com sucesso para o repositório!');
      } catch (error) {
        console.warn('⚠️ Não foi possível fazer o commit/push inicial automaticamente. Verifique se o repositório está vazio ou se há conflitos.');
      }
    }

    console.log('Agora vamos instalar um pacote global no seu computador, o firebase-tools. Ele é responsável por conectar o projeto ao Google Firebase.');

    try {
      console.log('➡️ npm install -g firebase-tools');
      execSync('npm install -g firebase-tools', { stdio: 'inherit' });
      console.log('✅ firebase-tools instalado com sucesso');
    } catch (err) {
      console.error('❌ Falha ao instalar o firebase-tools:', err.message);
    }

    console.log('\n✅✅✅ Pronto! O setup do projeto foi realizado. Você já pode abrir ele no editor e começar a trabalhar\n');
    console.log('\n--------------------\n');
    console.log('\nO que você precisa fazer agora:\n');
    console.log('\n 1. Abrir o arquivo .env e preencher os valores dos campos');
    console.log('\n 2. Rodar o comando `npm run dev` para visualizar o projeto em localhost');
  } catch (err) {
    console.error('\n❌ Erro durante o setup:', err.message);
  }
}

run();
