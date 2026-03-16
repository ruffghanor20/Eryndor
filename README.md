# Eryndor

RPG de texto em HTML, CSS e JavaScript com narrativa interativa, combate por turnos, progressao persistente, sistema meta e campanha expandida em ciclos.
![tela](image.png)
## Visao geral

O projeto evoluiu de uma campanha linear curta para uma estrutura maior, com:

- campanha ate o capitulo 10
- sistema de ciclos com `World Tier`
- falas e cenas reativas por memoria residual
- mercado meta com conquistas e contrabando
- novas cidades, tavernas, quests e eventos aleatorios
- cobertura visual para NPCs, lugares e monstros

## Como rodar

Como o jogo usa `fetch`, execute em um servidor local.

### Python

```bash
python -m http.server 5500
```

Abra em:

```bash
http://localhost:5500
```

### VS Code

Use a extensao `Live Server`.

## Gameplay

### Base do jogo

- menu inicial com `Novo Jogo` e `Continuar`
- 3 classes jogaveis: `Guerreiro`, `Ladino` e `Mago`
- combate por turnos com skills por classe, cooldown, critico e esquiva
- lojas com compra e venda
- inventario com equipamentos, consumiveis e raridades visuais
- progressao persistente entre tentativas e ciclos

### Progressao e nivelamento

- sistema de nivelamento de monstros por capitulo e por `World Tier`
- escalonamento de vida, ataque, recompensas e raridade em runs avancadas
- correcao de bugs ligados ao nivelamento e ao balanceamento de progressao
- reforco do sistema de melhoria de equipamentos por ouro
- equipamentos epicos e lendarios podem receber fortalecimento progressivo
- novos monstros unicos, novos bosses e variantes avancadas com funcao narrativa propria

### Morte e retorno

- ao morrer, o jogador volta ao ultimo checkpoint
- ouro e inventario mundano sao perdidos na derrota
- itens de contrabando e progressao meta permanecem disponiveis
- sistema de retorno evita quebrar o fluxo ao sair de tavernas, menus virtuais e cenas especiais

## Campanha e narrativa

### Estrutura da campanha

- capitulos 1 a 4: base da jornada, ruinas, revelacoes iniciais do Eclipse e primeiro falso final
- capitulos 5 a 8: arco intermediario e final expandido com novas areas, bosses e memoria residual mais forte
- capitulos 9 e 10: origem do loop, pacto do primeiro amanhecer, escolha ideologica final e encerramento verdadeiro

### Reatividade por ciclo

- sistema de ciclos com aumento de `World Tier`
- falas e cenas alteradas a cada novo ciclo por meio de `variants`, flags e memoria residual
- NPCs importantes passam a reconhecer ecos de runs anteriores
- missoes e objetivos tambem podem mudar conforme o ciclo atual
- escolha ideologica no arco final gera impacto narrativo persistente

### NPCs e expansao do mundo

- adicao de novas cidades, novas rotas e novas areas exploraveis
- inclusao de mais NPCs de historia, NPCs funcionais e NPCs ancora
- ampliacao do mapa com pontos de viagem, tavernas e retorno para cenas relevantes
- cenas extras para NPCs como `Liora`, `Elowen`, `Seraphine`, `Aldric`, `Observador`, `Ferreiro Exilado` e outros personagens de suporte

## Sistema meta

### Mercado Sombrio

- menu meta no topo da interface
- aba `Conquistas`
- aba `Loja de Contrabando`
- moeda de contrabando `shadowCoins`
- persistencia meta com `shadowCoins`, `achievements` e `contrabandUnlocks`

### Conquistas

As conquistas estao ligadas a eventos reais do jogo, incluindo:

- inicio de campanha
- primeira compra
- nivel 10
- conclusao de quest principal
- memoria residual despertada
- avancos de ciclo
- derrotas de bosses
- revelacoes narrativas importantes
- marcos de `World Tier`

### Contrabando

- itens de contrabando persistem entre jornadas
- os itens meta atravessam morte e reinicio
- o catalogo mistura equipamento persistente e bonus permanentes
- itens de contrabando seguem a fantasia de artefato raro, ilegal ou vindo de fora do fluxo normal do mundo

Exemplos de itens:

- `Lamina Fendida`
- `Manto do Vazio`
- `Luvas do Interdito`
- `Botas da Fresta`
- `Sigilo do Corvo`
- `Selo de Ferro Negro`

## Mundo, quests e eventos

### Quests

- quadro de missoes por taverna e por area
- diario de missoes com progresso, conclusao e recompensas
- quests principais e variacoes por ciclo
- missoes aleatorias distribuidas pelo mundo

### Travel e retorno

- mapa com cidades, areas e desbloqueios por progresso
- eventos aleatorios de estrada
- sistema de retorno para voltar de telas virtuais e cenas intermediarias sem perder contexto
- checkpoint e retorno ao ultimo save point apos derrota

## Assets e apresentacao visual

### Cobertura visual

- retratos proprios para NPCs principais e secundarios
- assets para cidades, lugares, monstros e bosses
- placeholders tecnicos para tudo que ainda nao tem arte final
- taberna compartilhada por asset unico
- carregamento automatico do asset correto por cena, NPC e inimigo

### Estrutura de assets

- `assets/images/scenes`: cidades, lugares, taberna e placeholders de cenario
- `assets/images/npcs`: retratos de NPCs principais, secundarios e funcionais
- `assets/images/enemies`: monstros, bosses e placeholders provisarios

### Catalogos de referencia

- `ASSETS_CATALOGO_GERAL.md`
- `NPC_ASSETS_RESUMO.md`
- `MONSTROS_ASSETS_RESUMO.md`
- `LUGARES_ASSETS_RESUMO.md`

Todos seguem o padrao:

- `asset`
- `codigo`
- `descricao`

## Audio

- pasta `assets/audio/` com trilhas em `.wav`
- integracao basica em `js/main.js`
- helper de musica em `js/scene-music-helper.js`
- a musica comeca apos a primeira interacao do usuario, conforme a politica do navegador

## Arquivos principais

- `js/main.js`: bootstrap do jogo
- `js/gameEngine.js`: estado, combate, `World Tier`, quests, morte, contrabando e progressao
- `js/ui.js`: interface, retratos, cenarios, menus meta, taberna e selecao de assets
- `data/chapters/chapter1.json` ate `data/chapters/chapter10.json`: campanha, variantes e novas cenas
- `data/quests/main_quests.json`: quests principais, quadro de tavernas e variacoes por ciclo
- `data/events/random_events.json`: eventos aleatorios de viagem
- `data/world/map.json`: cidades, areas e estrutura de travel
- `data/config.json`: itens, inimigos, equipamentos e chefes adicionais

## Estrutura principal do projeto

- `data/chapters`: capitulos da campanha
- `data/enemies`: catalogos de inimigos
- `data/quests`: definicoes de quests
- `data/world`: mapa e areas
- `js`: motor, interface, storage e bootstrap
- `assets/images`: imagens de cenarios, NPCs e inimigos
- `assets/audio`: trilhas e efeitos sonoros

## Observacoes

- o save usa `localStorage`
- `Reinicio Total` apaga o save e reinicia a run
- `Menu` volta para a tela inicial sem apagar o progresso atual
- parte dos chefes variantes reutiliza `imageKey` de inimigos existentes

## Referencias rapidas

- `ASSETS_CATALOGO_GERAL.md`: catalogo consolidado de assets
- `NPC_ASSETS_RESUMO.md`: resumo de NPCs
- `MONSTROS_ASSETS_RESUMO.md`: resumo de monstros
- `LUGARES_ASSETS_RESUMO.md`: resumo de lugares
- `agent.md`: guia de expansao narrativa e consistencia do projeto
