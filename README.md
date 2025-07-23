# Autograde

Um aplicativo web pra te ajudar a montar a grade da PUC-Rio!

Todo semestre, um drama que o aluno da PUC passa é esse: como vai ficar meu horário? Vou conseguir pegar as turmas que eu quero, ou as vagas vão acabar? E depois ficamos um tempo pensando e tentando otimizar nossa grade da melhor forma possível.

Foi por causa disso que decidi fazer o Autograde. Inspirado em um projeto de Programação Modular que fiz com meus colegas de graduação, busquei criar um aplicativo que desse liberdade total e funcionalidade máxima para o usuário, permitindo especificar preferências e restrições para que várias grades possíveis possam ser analisadas e escolhidas.

Em vez de adicionar as disciplinas manualmente, exporte os dados do [micro-horário](https://www.puc-rio.br/microhorario) em formato CSV sem filtrar por nada (clique no botão de busca sem digitar nada em nenhum campo e depois exporte). Depois, abra e salve o CSV em um aplicativo de planilhas, para garantir a formatação interna do arquivo. Então, faça upload dele no Autograde pelo botão de importar CSV.

Importante: adicione pelo menos uma preferência de "Disciplinas Disponíveis" para limitar quais disciplinas o algoritmo irá tentar incluir nas grades. Coloque ali as disciplinas que você considera puxar no semestre. 

## Development Guidelines

- Maximally expressive business logic (fat, pure, testable).
- Minimal infra — ideally no server-side code, no serverless.
- Frontend-only deployment (e.g. GitHub Pages).
- Testability with end-to-end tests.
- Features and efficiency is more important than UI prettiness.
- Type safety always and everywhere.
