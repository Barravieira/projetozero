import { Command } from 'commander';

const program = new Command();

program
  .name('projeto')
  .description('CLI para o boilerplate')
  .version('1.0.0');

program.parse();