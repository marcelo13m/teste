# Recomeço 2.0

Aplicativo pessoal (PWA) para acompanhar o tempo desde uma data e horário, com metas, conquistas, calendário, estatísticas, diário e backup. Dados só no aparelho, sem conta, sem anúncios, sem servidor. HTML + CSS + JavaScript puros (sem frameworks, sem dependências, sem requisições externas).

## Arquivos (todos na raiz, sem pastas, para facilitar o envio pelo celular)
```
index.html  manifest.webmanifest  sw.js        página, instalação e cache offline (aumente VERSION em sw.js a cada atualização)
style.css                                      temas escuro/claro e cor de destaque
core.js  db.js  app.js                         lógica pura, IndexedDB e interface
icon-192.png  icon-512.png  icon-maskable-512.png   ícones próprios
```

## Como funciona (modelo de dados)
Cada acompanhamento tem **ciclos** (início → fim). O ciclo aberto é o atual. Registrar uma ocorrência **fecha** o ciclo atual e **abre** outro; nada é apagado nem sobrescrito. Daí saem: sequência atual, maior sequência, tempo total, conquistas (a data de desbloqueio é a data real em que algum ciclo atingiu a meta) e o calendário (só dias que de fato pertencem a um ciclo; nada é inventado). Horários são guardados em UTC (milissegundos) e exibidos no fuso do aparelho.

## Publicar de graça (GitHub Pages)
1. Crie conta em github.com e um repositório **público** chamado `recomeco`.
2. Extraia o ZIP e extraia o ZIP e envie **os 10 arquivos soltos** (Add file → Upload files; no celular, selecione todos de uma vez). Não envie o ZIP.
3. Settings → Pages → Build and deployment → *Deploy from a branch* → `main` / `(root)` → Save.
4. Em ~1 minuto o app estará em `https://SEU-USUARIO.github.io/recomeco/`.
Alternativas gratuitas: Cloudflare Pages ou Netlify (arraste a pasta). É necessário HTTPS (todos fornecem).
Nome discreto: o repositório e o endereço são públicos; use um nome neutro se isso importar para você.

## Instalar no Samsung Galaxy A16
1. Abra o endereço HTTPS no **Chrome** (ou no Samsung Internet).
2. Menu ⋮ → **Instalar app** (ou *Adicionar à tela inicial*). Também há o botão em Ajustes → Instalar aplicativo.
3. Abra pelo ícone. Faça a primeira abertura com internet; depois funciona offline.
4. Em Ajustes → Bateria do Android, deixe o app como *Sem restrições* se quiser que o relógio nunca pareça atrasado (o tempo é sempre calculado pela data de início, então fica correto mesmo após dias fechado).

## Atualizar o app no futuro
Edite os arquivos, **aumente `VERSION` em `sw.js`** (ex.: `recomeco-v2.0.1`), envie ao repositório. Na próxima abertura com internet o app baixa a versão nova (pode ser necessário fechar e abrir uma segunda vez). Dados em IndexedDB não são afetados. Se mudar o formato dos dados, aumente `v` e adicione a conversão em `migrate()` (`core.js`) com um teste.

## Backup e proteção de dados
- **Exportar/Importar** JSON em Ajustes. Importar valida o arquivo e guarda uma cópia do estado atual antes de substituir.
- **Cópias automáticas diárias** (últimos 7 dias) ficam no próprio aparelho e podem ser restauradas em Ajustes.
- O app pede ao navegador armazenamento persistente. Mesmo assim, **limpar dados do Chrome/desinstalar apaga tudo**, inclusive as cópias automáticas: exporte backups e guarde fora do celular.
- **Excluir todos os dados** exige digitar EXCLUIR e apaga tudo, inclusive as cópias.
- Migração: se existir a versão 1 (localStorage) no mesmo endereço, os dados são convertidos na primeira abertura. Ciclos antigos da v1 não podem ser reconstruídos (a v1 sobrescrevia a data de início); só o ciclo atual e os registros de ocorrência são preservados.

## Widget na tela inicial — investigação
**PWA não suporta widgets reais no Android.** O que existe (atalho, ícone, notificações) não é widget, e o app não finge ser. Para um widget de verdade é preciso um app Android nativo. Arquitetura recomendada, em ordem de esforço:
1. **Trusted Web Activity (Bubblewrap)** embrulha este PWA em um APK, sem mudar o código web. Dá app "de loja", mas **ainda não dá widget**.
2. **Módulo nativo de widget (Kotlin + Jetpack Glance / AppWidget)** dentro do mesmo APK. O widget lê *data de início do contador principal* de um `SharedPreferences` e calcula dias/horas localmente (sem rede). O PWA, ao salvar, avisa o lado nativo por uma ponte (`JavascriptInterface` em WebView) com `{id, nome, inicio}`. Seria a evolução natural, exigindo Android Studio e assinatura do APK; não está implementada aqui.
3. Opção sem Android Studio: GitHub Actions compilando o APK (como no seu projeto "Bom Dia, Todo Dia").

## Testes realizados
Rodados automaticamente em Chromium (viewport 390×844, simulando celular) com o app real servido por HTTP local: criação de contador, edição da data inicial (e rejeição de data futura), atualização do cronômetro, fechar/reabrir, funcionamento offline após o primeiro acesso (Service Worker), múltiplos contadores, ocorrência com tela de confirmação, reinício do cronômetro, preservação do histórico (ciclos), alteração de metas (e rejeição de entrada inválida), diário, exportação, exclusão de dados, importação (e rejeição de arquivo inválido), troca de tema, ausência de erros de JavaScript. Mais 11 testes unitários da lógica (testes).

## Limitações reais
- **Não foi testado em um Galaxy A16 físico nem a instalação pelo Chrome do Android** (prompt de instalação, ícone na tela inicial, Samsung Internet). Testes de instalação só são possíveis depois de publicar em HTTPS.
- Sem widget real (ver acima). Sem notificações/lembretes (PWA sem servidor push não agenda alertas confiáveis com o app fechado).
- Sem sincronização entre aparelhos, sem bloqueio por senha/biometria: quem desbloquear o celular e abrir o app vê os dados. O nome e o ícone são discretos, mas o app guarda os nomes que você digitar.
- Dados ficam no navegador; limpeza de dados ou desinstalação os apaga (use backups).
- O relógio mostra o tempo pelo relógio do aparelho; mudar a hora do sistema altera o cronômetro.
- Gráficos mostram dias acompanhados por semana/mês (últimas 8 semanas e 6 meses).
- Idioma único: português do Brasil.
