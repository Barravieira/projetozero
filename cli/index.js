#!/usr/bin/env node
import { Command } from 'commander';
import atualizar from './commands/atualizar.js';

const program = new Command();

program
  .name('rodar')
  .description('CLI para o boilerplate')
  .version('1.0.0');

// Remove o comando e flag padrão de ajuda
program
  .addHelpCommand(false)
  .helpOption(false);

// Adiciona opção personalizada de ajuda
program
  .option('--ajuda', 'Exibe ajuda');

// Comandos disponíveis
program
  .command('atualizar')
  .description('Salva e envia o projeto para o repositório remoto')
  .action(atualizar);

// Parse e tratamento da flag --ajuda
program.parse();

const opts = program.opts();
if (opts.ajuda) {
  program.outputHelp();
  process.exit(0);
}
