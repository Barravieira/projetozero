import { readdirSync, readFileSync } from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';

export default async function prompts() {
  try {
    const promptsDir = path.resolve('ajuda/prompts');
    const files = readdirSync(promptsDir).filter((f) => f.endsWith('.txt'));

    if (files.length === 0) {
      console.log(chalk.yellow('\n⚠️ Nenhum prompt encontrado na pasta ajuda/prompts.\n'));
      return;
    }

    // Mapeia nomes de arquivos para descrições amigáveis
    const descriptions = {
      'mono-tenant-start.txt': 'Iniciar novo projeto sem recurso de times',
      'mono-tenant-new-feature.txt': 'Adicionar nova funcionalidade (sem recurso de times)',
      'multi-tenant-start.txt': 'Iniciar novo projeto com recurso de times (multi-tenant)',
      'multi-tenant-new-feature.txt': 'Adicionar nova funcionalidade (com recurso de times)',
    };

    const choices = files.map((file) => ({
      name: descriptions[file] || file.replace('.txt', '').replace(/-/g, ' '),
      value: file,
    }));

    const { selectedPrompt } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedPrompt',
        message: 'Qual prompt você deseja visualizar?',
        choices,
      },
    ]);

    const promptPath = path.join(promptsDir, selectedPrompt);
    const content = readFileSync(promptPath, 'utf-8');

    console.log('\n' + chalk.green('=== Prompt Selecionado ===\n'));
    console.log(content);
    console.log('\n' + chalk.green('===========================\n'));
  } catch (err) {
    console.error(chalk.red('\n❌ Erro ao carregar os prompts:'), err.message);
  }
}
