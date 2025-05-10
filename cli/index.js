#!/usr/bin/env node
import { Command } from 'commander';
import atualizar from './commands/atualizar.js';
import resetar from './commands/resetar.js';
import iniciar from './commands/iniciar.js';
import conectar from './commands/servidor/conectar.js';
import servidorAtualizar from './commands/servidor/atualizar.js';


const program = new Command();

program
  .name('rodar')
  .description('CLI para o boilerplate')
  .version('1.0.0');

// --ajuda customizada
program
  .addHelpCommand(false)
  .helpOption(false)
  .option('--ajuda', 'Exibe ajuda');

// Comandos diretos
program
  .command('atualizar')
  .description('Salva e envia o projeto para o Github')
  .action(atualizar);

program
  .command('resetar')
  .description('Descarta todas as alterações e volta ao último commit')
  .action(resetar);

program
  .command('iniciar')
  .description('Inicia o servidor de desenvolvimento')
  .action(iniciar);

// Subcomando: servidor
const servidor = new Command('servidor')
  .description('Comandos relacionados ao servidor');

servidor
  .command('conectar')
  .description('Conecta o projeto ao Firebase Hosting')
  .action(conectar);

servidor
  .command('atualizar')
  .description('Faz build e publica o projeto no Firebase Hosting')
  .action(servidorAtualizar);

program.addCommand(servidor);

program.parse();

const opts = program.opts();
if (opts.ajuda) {
  program.outputHelp();
  process.exit(0);
}
