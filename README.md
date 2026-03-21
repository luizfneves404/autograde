# Autograde

**live at: https://autograde-c9b.pages.dev**

Um aplicativo web pra te ajudar a montar a grade da PUC-Rio!

Todo semestre, um drama que o aluno da PUC passa é esse: como vai ficar meu horário? Vou conseguir pegar as turmas que eu quero, ou as vagas vão acabar? E depois ficamos um tempo pensando e tentando otimizar nossa grade da melhor forma possível.

Foi por causa disso que decidi fazer o Autograde. Inspirado em um projeto de Programação Modular que fiz com meus colegas de graduação, busquei criar um aplicativo que desse liberdade total e funcionalidade máxima para o usuário, permitindo especificar preferências e restrições para que várias grades possíveis fossem geradas.

Se quiser usar as disciplinas que eu cadastrei (atualizado em 18/03/2026), clique em "Importar CSV Oficial". Se quiser usar o CSV mais atualizado possível, exporte os dados do [micro-horário](https://www.puc-rio.br/microhorario) em formato CSV sem filtrar por nada (clique no botão de busca sem digitar nada em nenhum campo e depois exporte). Depois, abra e salve o CSV em um aplicativo de planilhas, para garantir a formatação interna do arquivo. Então, faça upload dele no Autograde pelo botão de importar CSV.

Importante: adicione pelo menos uma preferência de "Disciplinas Disponíveis" para limitar quais disciplinas o algoritmo irá tentar incluir nas grades. Coloque ali as disciplinas que você considera puxar no semestre.

---

## Tech

- React 19 com React Compiler
- Vite 7, TypeScript 5.8 strict.
- Roteamento file-based com TanStack Router (search params totalmente tipados).
- Estado via Zustand v5 com persist.
- Formulários com TanStack Form + Zod v4 em todas as fronteiras de domínio.
- UI com shadcn/ui sobre Radix, estilizado com Tailwind v4.
- CSV parseado com PapaParse.
- Testes com Vitest, fast-check (property-based, seed fixo) e Playwright.
- Deploy estático no Cloudflare Pages, sem backend — tudo roda no browser. Não faça um servidor quando você não precisa.
- Package manager: pnpm