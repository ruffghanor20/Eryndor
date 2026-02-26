# Eryndor
RPG de texto em HTML/CSS/JS com narrativa interativa, combate por turnos, classes, inventário, múltiplos capítulos, trilha sonora dinâmica e empacotamento Android via Capacitor.
# RPG de Texto 

## Recursos
- Menu inicial com **Novo Jogo** e **Continuar**
- **3 classes**: Guerreiro, Ladino e Mago
- **Skills de combate** por classe com cooldown
- **Crítico e esquiva**
- **Lojas** com compra e venda
- **3 armas** e **3 armaduras**
- Consumíveis, elixires e **Amuleto da Salvaguarda**
- **Raridade** visual para itens
- **Progressão persistente** entre tentativas e ciclos
- **World Tier** para escalar inimigos a cada final
- Dados separados em **config.json** + **capítulos JSON**

## Como rodar
Como o jogo usa `fetch`, execute em um servidor local.

### Python
```bash
python -m http.server 5500
```

Abra:
```bash
http://localhost:5500
```

### VS Code
Use a extensão **Live Server**.

## Observações
- O save é feito em `localStorage`
- O botão **Reinício Total** apaga o save e reinicia a run
- O botão **Menu** volta para a tela inicial sem apagar o progresso


## Áudio incluso
- Pasta `assets/audio/` com 10 trilhas em `.wav`
- Integração básica já conectada em `js/main.js`
- Helper de música em `js/scene-music-helper.js`
- A música começa após a primeira interação do usuário, conforme as regras do navegador


## Atualização 4.1 — Mais capítulos
Esta versão adiciona:

- **Capítulo 3 — A Cripta Submersa**
- **Capítulo 4 — O Trono do Eclipse**
- Novos inimigos: **Espreitador Abissal**, **Sacerdote do Espelho**, **Colosso do Vazio** e **Rei do Eclipse**
- Novos itens de progressão: **Tônico Heroico**, **Elixir de Agilidade I**, **Elixir da Mente I**
- Novos equipamentos de fim de jogo: **Tridente de Maré**, **Manto Abissal**, **Lâmina do Eclipse** e **Égide do Eclipse**


