#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
  .name('rodar')
  .description('CLI para o boilerplate')
  .version('1.0.0');

program.parse();