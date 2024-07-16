document.getElementById('minimize').addEventListener('click', () => {
    window.electron.controlWindow('minimize');
});

document.getElementById('close').addEventListener('click', () => {
    window.electron.controlWindow('close');
});

/*
document.getElementById('player-search').addEventListener('keypress', async (e) => {
    if (e.key === 'Enter') {
        const player = e.target.value.trim();
        if (player) {
            const stats = await fetchPlayerStats(player);
            addPlayerStats(player, stats);
            e.target.value = '';
        }
    }
});
*/

document.getElementById('settings').addEventListener('click', () => {
    document.getElementById('config').style.display = 'block';
});

document.getElementById('save-config').addEventListener('click', () => {
    const client = document.getElementById('client-select').value;
    const logPath = document.getElementById('log-path').value;
    const keybind = document.getElementById('keybind').value;

    window.electron.saveConfig({ client, logPath, keybind });
    document.getElementById('config').style.display = 'none';
});

function addPlayerStats(player, stats) {
    const playerList = document.getElementById('player-list');
    const statsRow = document.createElement('div');
    statsRow.classList.add('stats-row');

    const playerName = document.createElement('div');
    playerName.classList.add('stat-item');
    playerName.textContent = player;
    statsRow.appendChild(playerName);

    const level = document.createElement('div');
    level.classList.add('stat-item');
    const levelValue = stats.stats.bedwars.level || 0;
    const levelBadgeSymbol = stats.stats.bedwars.level_badge?.symbol ?? "✫";
    const levelBadgeColor = stats.stats.bedwars.level_badge?.hex_color ?? "#000000";

    level.textContent = `[${levelValue} ${levelBadgeSymbol}]`;
    level.style.color = levelBadgeColor;
    statsRow.appendChild(level);


    const ws = document.createElement('div');
    ws.classList.add('stat-item');
    ws.textContent = stats.stats.bedwars.winstreak;
    statsRow.appendChild(ws);

    const fkdr = document.createElement('div');
    fkdr.classList.add('stat-item');
    let calculated = (stats.stats.bedwars.final_kills / stats.stats.bedwars.final_deaths).toFixed(2);
    let fkdrText = document.createTextNode(isNaN(calculated) ? '0' : calculated);
    fkdr.appendChild(fkdrText);
    statsRow.appendChild(fkdr);


    const wlr = document.createElement('div');
    wlr.classList.add('stat-item');
    let calculated2 = (stats.stats.bedwars.wins / stats.stats.bedwars.losses).toFixed(2);
    let wlrText = document.createTextNode(isNaN(calculated2) ? '0' : calculated2);
    wlr.appendChild(wlrText);
    statsRow.appendChild(wlr);

    const finals = document.createElement('div');
    finals.classList.add('stat-item');
    finals.textContent = stats.stats.bedwars.final_kills;
    statsRow.appendChild(finals);

    const wins = document.createElement('div');
    wins.classList.add('stat-item');
    wins.textContent = stats.stats.bedwars.wins;
    statsRow.appendChild(wins);

    playerList.appendChild(statsRow);
}

function removePlayerStats(player) {
    const playerList = document.getElementById('player-list');
    const rows = playerList.getElementsByClassName('stats-row');
    for (const row of rows) {
        if (row.firstChild.textContent === player) {
            playerList.removeChild(row);
            break;
        }
    }
}

function clearPlayerStats() {
    const playerList = document.getElementById('player-list');
    playerList.innerHTML = '';
}

async function fetchPlayerStats(player) {
    try {
        const response = await fetch(`https://mush.com.br/api/player/${player}`);
        const data = await response.json();

        /* console.log(data.response) */

        if (!data.success || !data.response) {
            return {
                profile_tag: { name: 'FAKE' },
                stats: {
                    bedwars: {
                        winstreak: '-',
                        final_kills: '-',
                        final_deaths: '-',
                        wins: '-',
                        losses: '-'
                    }
                }
            };
        }

        return data.response;
    } catch (error) {
        console.error('Erro ao buscar estatísticas do jogador:', error);
        return {
            profile_tag: { name: 'ERRO' },
            stats: {
                bedwars: {
                    winstreak: '-',
                    final_kills: '-',
                    final_deaths: '-',
                    wins: '-',
                    losses: '-'
                }
            }
        };
    }
}

window.electron.onNewLogLine(async (line) => {
    console.log('Nova linha do log recebida no renderer:', line);

    if (line.includes('[CHAT]')) {

        /* console.log(line) */

        if (line.includes("entrou na sala")) {
            let regex = /\[CHAT\] (\w+)/;
            let match = line.match(regex);

            if (match) {
                let name = match[1];
                fetchPlayerStats(name).then((stats) => {
                    addPlayerStats(name, stats);
                })
            }
        }

        if (line.includes('saiu da sala')) {
            let regex = /\[CHAT\] (\w+)/;
            let match = line.match(regex);

            if (match) {
                let name = match[1];
                removePlayerStats(name);
            }
        }

        if (line.includes('entrou no lobby') || line.includes("caiu de paraquedas!") || line.includes("invadiu o lobby!") || line.includes("t� na �rea!")) {
            clearPlayerStats();
        }

        if (line.includes(".clear n�o foi encontrado")) {
            clearPlayerStats()
        }

        if (line.includes(".hide n�o foi encontrado")) {
            window.electron.controlWindow('minimize');
        }

        if (line.includes(".show n�o foi encontrado")) {
            window.electron.controlWindow('restore');
        }
    }
});

