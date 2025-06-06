# Base do projeto

Projeto base para clonar e usar como ponto inicial para o seu próximo projeto =)

## Estrutura de pastas

- ajuda/prompts/: nessa pasta você vai encontrar diversos arquivos com exemplos de prompts que você pode usar na IA para lhe
auxiliar com o projeto, seja iniciando ou seja durante o desenvolvimento
- ajuda/tutoriais/: nessa pasta você encontrará alguns arquivos com ajuda e passo a passo para você conseguir trabalhar com o projeto
- public/: onde são armazenados os arquivos públicos do projeto, como imagens, fontes, etc
- src/: nessa pasta é onde está contido o código-fonte do projeto realmente.

## Arquivos importantes

*.env*: Esse arquivo deve ser editado no início do projeto, para que funcione como esperado. Contém as chaves e acessos
aos serviços externos

## Como iniciar o projeto

  1. Vá até o Firebase Console: https://console.firebase.google.com/
  2. Crie um novo projeto firebase
  3. Inicialize uma aplicação
  4. Ative o Firebase Auth e o acesso via e-mail e senha
  5. Personalize os modelos de e-mail como quiser, para deixar em português
  6. Ative o Firebase Firestore e crie o banco de dados default.
  7. No Firebase Firestore, na aba de regras, substitua a regra para:
  ```bash
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if request.auth != null;
      }
    }
  }
  ```
  8. Ative o Storage, selecionando US-EAST. Para isso você precisará ativar o plano Blaze.
  9. No Storage, na aba de regras, substitua a regra para:
  ```bash
  rules_version = '2';
  service firebase.storage {
    match /b/{bucket}/o {
        match /{allPaths=**} {
        allow read, write: if request.auth != null;
        }
    }
    }
  ```
 10. Crie um novo repositório no Github. Salve seu endereço ssh.
 11. No seu terminal, vá até `C:\projetos\`
 12. Clone este repositório com `git clone git@github.com:paulomoraesdev/carlos_projeto.git nome-do-projeto`
 13. Rode o comando `cd nome-do-projeto` para acessar a pasta do projeto
 14. Execute o comando `node setup.js` para fazer o setup inicial. Nesse passo você precisará do link ssh que salvou.
 15. Após finalizar o fluxo, rode `rodar servidor conectar` e passe pelo fluxo de autenticação com o firebase.
 16. Abra o editor de código e seja feliz =)
 17. Você pode interagir com `rodar prompts` para visualizar os prompts predefinidos para você conversar com a IA.
 
 Os comandos que você pode rodar para te ajudar estão no CLI rodar. Para saber quais são, use `rodar --ajuda`