import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

const POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'OF', 'DH', 'SP', 'RP'];

const PLAYER_POOL = [
  // Catchers
  { name: 'Adley Rutschman', position: 'C', team: 'BAL', adp: 45 },
  { name: 'William Contreras', position: 'C', team: 'MIL', adp: 62 },
  { name: 'Salvador Perez', position: 'C', team: 'KC', adp: 105 },
  { name: 'J.T. Realmuto', position: 'C', team: 'PHI', adp: 120 },
  { name: 'Will Smith', position: 'C', team: 'LAD', adp: 85 },
  // First Basemen
  { name: 'Freddie Freeman', position: '1B', team: 'LAD', adp: 8 },
  { name: 'Vladimir Guerrero Jr.', position: '1B', team: 'TOR', adp: 12 },
  { name: 'Matt Olson', position: '1B', team: 'ATL', adp: 25 },
  { name: 'Pete Alonso', position: '1B', team: 'NYM', adp: 40 },
  { name: 'Cody Bellinger', position: '1B', team: 'CHC', adp: 75 },
  // Second Basemen
  { name: 'Marcus Semien', position: '2B', team: 'TEX', adp: 30 },
  { name: 'Jose Altuve', position: '2B', team: 'HOU', adp: 35 },
  { name: 'Ozzie Albies', position: '2B', team: 'ATL', adp: 55 },
  { name: 'Gleyber Torres', position: '2B', team: 'NYY', adp: 90 },
  { name: 'Jazz Chisholm Jr.', position: '2B', team: 'NYY', adp: 42 },
  // Third Basemen
  { name: 'Manny Machado', position: '3B', team: 'SD', adp: 22 },
  { name: 'Jose Ramirez', position: '3B', team: 'CLE', adp: 5 },
  { name: 'Rafael Devers', position: '3B', team: 'BOS', adp: 18 },
  { name: 'Austin Riley', position: '3B', team: 'ATL', adp: 28 },
  { name: 'Alex Bregman', position: '3B', team: 'HOU', adp: 65 },
  // Shortstops
  { name: 'Trea Turner', position: 'SS', team: 'PHI', adp: 15 },
  { name: 'Corey Seager', position: 'SS', team: 'TEX', adp: 20 },
  { name: 'Bobby Witt Jr.', position: 'SS', team: 'KC', adp: 3 },
  { name: 'Wander Franco', position: 'SS', team: 'TB', adp: 48 },
  { name: 'Carlos Correa', position: 'SS', team: 'MIN', adp: 70 },
  // Outfielders
  { name: 'Ronald Acuna Jr.', position: 'OF', team: 'ATL', adp: 1 },
  { name: 'Mookie Betts', position: 'OF', team: 'LAD', adp: 2 },
  { name: 'Juan Soto', position: 'OF', team: 'NYY', adp: 4 },
  { name: 'Mike Trout', position: 'OF', team: 'LAA', adp: 10 },
  { name: 'Kyle Tucker', position: 'OF', team: 'HOU', adp: 7 },
  { name: 'Julio Rodriguez', position: 'OF', team: 'SEA', adp: 9 },
  { name: 'Yordan Alvarez', position: 'OF', team: 'HOU', adp: 6 },
  { name: 'Fernando Tatis Jr.', position: 'OF', team: 'SD', adp: 11 },
  { name: 'Aaron Judge', position: 'OF', team: 'NYY', adp: 14 },
  { name: 'Corbin Carroll', position: 'OF', team: 'ARI', adp: 16 },
  { name: 'Luis Robert Jr.', position: 'OF', team: 'CWS', adp: 32 },
  { name: 'Byron Buxton', position: 'OF', team: 'MIN', adp: 58 },
  // Designated Hitters
  { name: 'Shohei Ohtani', position: 'DH', team: 'LAD', adp: 1 },
  { name: 'Marcell Ozuna', position: 'DH', team: 'ATL', adp: 38 },
  // Starting Pitchers
  { name: 'Spencer Strider', position: 'SP', team: 'ATL', adp: 13 },
  { name: 'Gerrit Cole', position: 'SP', team: 'NYY', adp: 17 },
  { name: 'Zack Wheeler', position: 'SP', team: 'PHI', adp: 19 },
  { name: 'Corbin Burnes', position: 'SP', team: 'BAL', adp: 21 },
  { name: 'Max Scherzer', position: 'SP', team: 'TEX', adp: 50 },
  { name: 'Justin Verlander', position: 'SP', team: 'HOU', adp: 55 },
  { name: 'Shane McClanahan', position: 'SP', team: 'TB', adp: 27 },
  { name: 'Logan Webb', position: 'SP', team: 'SF', adp: 33 },
  { name: 'Framber Valdez', position: 'SP', team: 'HOU', adp: 36 },
  { name: 'Pablo Lopez', position: 'SP', team: 'MIN', adp: 44 },
  { name: 'Tyler Glasnow', position: 'SP', team: 'LAD', adp: 26 },
  { name: 'Yu Darvish', position: 'SP', team: 'SD', adp: 68 },
  // Relief Pitchers
  { name: 'Emmanuel Clase', position: 'RP', team: 'CLE', adp: 52 },
  { name: 'Josh Hader', position: 'RP', team: 'HOU', adp: 78 },
  { name: 'Edwin Diaz', position: 'RP', team: 'NYM', adp: 88 },
  { name: 'Ryan Helsley', position: 'RP', team: 'STL', adp: 82 },
  { name: 'Devin Williams', position: 'RP', team: 'NYY', adp: 95 },
];

const ROSTER_SLOTS = {
  C: 1, '1B': 1, '2B': 1, '3B': 1, SS: 1, OF: 3, DH: 1, SP: 5, RP: 2, BN: 3,
};

function DraftTool() {
  const [draftedPlayers, setDraftedPlayers] = useState([]);
  const [myTeam, setMyTeam] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('adp');
  const [draftLog, setDraftLog] = useState([]);
  const [numTeams, setNumTeams] = useState(12);
  const [myPickPosition, setMyPickPosition] = useState(1);
  const [currentPick, setCurrentPick] = useState(1);
  const [showSettings, setShowSettings] = useState(true);
  const [draftStarted, setDraftStarted] = useState(false);
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [draftLog]);

  const totalRounds = Object.values(ROSTER_SLOTS).reduce((a, b) => a + b, 0);

  const currentRound = Math.ceil(currentPick / numTeams);
  const isSnakeDraft = true;
  const pickInRound = ((currentPick - 1) % numTeams) + 1;
  const isReversed = currentRound % 2 === 0;
  const currentDraftPosition = isReversed ? numTeams - pickInRound + 1 : pickInRound;
  const isMyPick = currentDraftPosition === myPickPosition;

  const availablePlayers = useMemo(() => {
    const draftedNames = new Set(draftedPlayers.map((p) => p.name));
    let players = PLAYER_POOL.filter((p) => !draftedNames.has(p.name));

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      players = players.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.team.toLowerCase().includes(term)
      );
    }

    if (positionFilter !== 'ALL') {
      players = players.filter((p) => p.position === positionFilter);
    }

    players.sort((a, b) => {
      if (sortBy === 'adp') return a.adp - b.adp;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'position') return a.position.localeCompare(b.position);
      return 0;
    });

    return players;
  }, [draftedPlayers, searchTerm, positionFilter, sortBy]);

  const rosterNeeds = useMemo(() => {
    const filled = {};
    Object.keys(ROSTER_SLOTS).forEach((pos) => {
      filled[pos] = 0;
    });
    myTeam.forEach((p) => {
      if (filled[p.position] < ROSTER_SLOTS[p.position]) {
        filled[p.position]++;
      } else {
        filled['BN']++;
      }
    });
    const needs = {};
    Object.keys(ROSTER_SLOTS).forEach((pos) => {
      needs[pos] = ROSTER_SLOTS[pos] - filled[pos];
    });
    return needs;
  }, [myTeam]);

  const draftPlayer = useCallback(
    (player, toMyTeam) => {
      if (!draftStarted) return;
      setDraftedPlayers((prev) => [...prev, player]);
      const round = Math.ceil(currentPick / numTeams);
      const entry = {
        pick: currentPick,
        round,
        player,
        team: toMyTeam ? 'My Team' : `Team ${currentDraftPosition}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setDraftLog((prev) => [...prev, entry]);

      if (toMyTeam) {
        setMyTeam((prev) => [...prev, player]);
      }

      setCurrentPick((prev) => prev + 1);
    },
    [currentPick, numTeams, currentDraftPosition, draftStarted]
  );

  const undoLastPick = useCallback(() => {
    if (draftLog.length === 0) return;
    const lastEntry = draftLog[draftLog.length - 1];
    setDraftedPlayers((prev) => prev.slice(0, -1));
    setDraftLog((prev) => prev.slice(0, -1));
    if (lastEntry.team === 'My Team') {
      setMyTeam((prev) => prev.slice(0, -1));
    }
    setCurrentPick((prev) => prev - 1);
  }, [draftLog]);

  const resetDraft = useCallback(() => {
    setDraftedPlayers([]);
    setMyTeam([]);
    setDraftLog([]);
    setCurrentPick(1);
    setDraftStarted(false);
    setShowSettings(true);
  }, []);

  const startDraft = useCallback(() => {
    setDraftStarted(true);
    setShowSettings(false);
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Fantasy Baseball Draft Tool 2026</h1>
        <div style={styles.headerInfo}>
          {draftStarted && (
            <>
              <span style={styles.badge}>Round {currentRound}</span>
              <span style={styles.badge}>Pick {currentPick}</span>
              <span
                style={{
                  ...styles.badge,
                  backgroundColor: isMyPick ? '#22c55e' : '#64748b',
                }}
              >
                {isMyPick ? 'YOUR PICK' : `Team ${currentDraftPosition}'s Pick`}
              </span>
            </>
          )}
        </div>
      </header>

      {showSettings && !draftStarted && (
        <div style={styles.settingsPanel}>
          <h2 style={styles.sectionTitle}>Draft Settings</h2>
          <div style={styles.settingsGrid}>
            <label style={styles.label}>
              Number of Teams:
              <select
                value={numTeams}
                onChange={(e) => setNumTeams(Number(e.target.value))}
                style={styles.select}
              >
                {[8, 10, 12, 14, 16].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label style={styles.label}>
              Your Draft Position:
              <select
                value={myPickPosition}
                onChange={(e) => setMyPickPosition(Number(e.target.value))}
                style={styles.select}
              >
                {Array.from({ length: numTeams }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    #{n}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button onClick={startDraft} style={styles.startButton}>
            Start Draft
          </button>
        </div>
      )}

      {draftStarted && (
        <div style={styles.mainLayout}>
          {/* Left Panel — Available Players */}
          <div style={styles.leftPanel}>
            <h2 style={styles.sectionTitle}>
              Available Players ({availablePlayers.length})
            </h2>
            <div style={styles.filters}>
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                style={styles.select}
              >
                <option value="ALL">All Positions</option>
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={styles.select}
              >
                <option value="adp">Sort by ADP</option>
                <option value="name">Sort by Name</option>
                <option value="position">Sort by Position</option>
              </select>
            </div>
            <div style={styles.playerList}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ADP</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Pos</th>
                    <th style={styles.th}>Team</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {availablePlayers.map((player) => (
                    <tr key={player.name} style={styles.tr}>
                      <td style={styles.td}>{player.adp}</td>
                      <td style={{ ...styles.td, fontWeight: 600 }}>
                        {player.name}
                      </td>
                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.posBadge,
                            backgroundColor: getPositionColor(player.position),
                          }}
                        >
                          {player.position}
                        </span>
                      </td>
                      <td style={styles.td}>{player.team}</td>
                      <td style={styles.td}>
                        {isMyPick ? (
                          <button
                            onClick={() => draftPlayer(player, true)}
                            style={styles.draftButton}
                          >
                            Draft
                          </button>
                        ) : (
                          <button
                            onClick={() => draftPlayer(player, false)}
                            style={styles.markButton}
                          >
                            Taken
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Panel — My Team + Draft Log */}
          <div style={styles.rightPanel}>
            {/* Roster Needs */}
            <div style={styles.rosterNeeds}>
              <h3 style={styles.subTitle}>Roster Needs</h3>
              <div style={styles.needsGrid}>
                {Object.entries(rosterNeeds).map(([pos, needed]) => (
                  <div
                    key={pos}
                    style={{
                      ...styles.needBadge,
                      backgroundColor:
                        needed > 0 ? '#1e293b' : '#22c55e22',
                      color: needed > 0 ? '#f1f5f9' : '#22c55e',
                      border: needed > 0 ? '1px solid #334155' : '1px solid #22c55e44',
                    }}
                  >
                    {pos}: {needed}
                  </div>
                ))}
              </div>
            </div>

            {/* My Team */}
            <div style={styles.myTeamSection}>
              <h3 style={styles.subTitle}>My Team ({myTeam.length})</h3>
              <div style={styles.myTeamList}>
                {myTeam.length === 0 ? (
                  <p style={styles.emptyText}>No players drafted yet</p>
                ) : (
                  myTeam.map((player, idx) => (
                    <div key={idx} style={styles.myTeamPlayer}>
                      <span
                        style={{
                          ...styles.posBadge,
                          backgroundColor: getPositionColor(player.position),
                        }}
                      >
                        {player.position}
                      </span>
                      <span style={styles.playerName}>{player.name}</span>
                      <span style={styles.teamAbbr}>{player.team}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Draft Log */}
            <div style={styles.draftLogSection}>
              <h3 style={styles.subTitle}>Draft Log</h3>
              <div style={styles.draftLogList}>
                {draftLog.length === 0 ? (
                  <p style={styles.emptyText}>Draft has not started</p>
                ) : (
                  draftLog.map((entry, idx) => (
                    <div
                      key={idx}
                      style={{
                        ...styles.logEntry,
                        backgroundColor:
                          entry.team === 'My Team' ? '#22c55e11' : 'transparent',
                        borderLeft:
                          entry.team === 'My Team'
                            ? '3px solid #22c55e'
                            : '3px solid transparent',
                      }}
                    >
                      <span style={styles.logPick}>
                        R{entry.round} P{entry.pick}
                      </span>
                      <span style={styles.logPlayer}>
                        {entry.player.name}
                      </span>
                      <span style={styles.logTeam}>{entry.team}</span>
                    </div>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
            </div>

            {/* Controls */}
            <div style={styles.controls}>
              <button onClick={undoLastPick} style={styles.undoButton}>
                Undo Last Pick
              </button>
              <button onClick={resetDraft} style={styles.resetButton}>
                Reset Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getPositionColor(pos) {
  const colors = {
    C: '#6366f1',
    '1B': '#f59e0b',
    '2B': '#10b981',
    '3B': '#ef4444',
    SS: '#8b5cf6',
    OF: '#3b82f6',
    DH: '#ec4899',
    SP: '#14b8a6',
    RP: '#f97316',
  };
  return colors[pos] || '#64748b';
}

const styles = {
  container: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    minHeight: '100vh',
    padding: 0,
    margin: 0,
  },
  header: {
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #334155',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 700,
    background: 'linear-gradient(90deg, #3b82f6, #22c55e)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  headerInfo: {
    display: 'flex',
    gap: '8px',
  },
  badge: {
    backgroundColor: '#3b82f6',
    color: '#fff',
    padding: '4px 12px',
    borderRadius: '999px',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  settingsPanel: {
    maxWidth: '480px',
    margin: '80px auto',
    padding: '32px',
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    border: '1px solid #334155',
  },
  settingsGrid: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '0.9rem',
    color: '#94a3b8',
    flex: 1,
  },
  select: {
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '0.9rem',
  },
  startButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#22c55e',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
  mainLayout: {
    display: 'flex',
    height: 'calc(100vh - 65px)',
    overflow: 'hidden',
  },
  leftPanel: {
    flex: '1 1 60%',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #334155',
    padding: '16px',
    overflow: 'hidden',
  },
  rightPanel: {
    flex: '1 1 40%',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    overflow: 'hidden',
    gap: '12px',
  },
  sectionTitle: {
    margin: '0 0 12px 0',
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#f1f5f9',
  },
  subTitle: {
    margin: '0 0 8px 0',
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#94a3b8',
  },
  filters: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    color: '#e2e8f0',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '0.9rem',
    outline: 'none',
  },
  playerList: {
    flex: 1,
    overflowY: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '8px 12px',
    color: '#94a3b8',
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    borderBottom: '1px solid #334155',
    position: 'sticky',
    top: 0,
    backgroundColor: '#0f172a',
  },
  tr: {
    borderBottom: '1px solid #1e293b',
  },
  td: {
    padding: '8px 12px',
    fontSize: '0.9rem',
  },
  posBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#fff',
  },
  draftButton: {
    backgroundColor: '#22c55e',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 12px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontWeight: 600,
  },
  markButton: {
    backgroundColor: '#475569',
    color: '#e2e8f0',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 12px',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontWeight: 600,
  },
  rosterNeeds: {
    padding: '12px',
    backgroundColor: '#1e293b',
    borderRadius: '8px',
    border: '1px solid #334155',
  },
  needsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  needBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  myTeamSection: {
    flex: '1 1 40%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  myTeamList: {
    flex: 1,
    overflowY: 'auto',
  },
  myTeamPlayer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 0',
    borderBottom: '1px solid #1e293b',
  },
  playerName: {
    flex: 1,
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  teamAbbr: {
    fontSize: '0.8rem',
    color: '#64748b',
  },
  draftLogSection: {
    flex: '1 1 40%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  draftLogList: {
    flex: 1,
    overflowY: 'auto',
  },
  logEntry: {
    display: 'flex',
    gap: '8px',
    padding: '4px 8px',
    fontSize: '0.8rem',
    alignItems: 'center',
  },
  logPick: {
    color: '#64748b',
    fontWeight: 600,
    minWidth: '55px',
  },
  logPlayer: {
    flex: 1,
    fontWeight: 600,
  },
  logTeam: {
    color: '#94a3b8',
    fontSize: '0.75rem',
  },
  emptyText: {
    color: '#475569',
    fontStyle: 'italic',
    fontSize: '0.85rem',
    padding: '8px 0',
  },
  controls: {
    display: 'flex',
    gap: '8px',
    paddingTop: '8px',
  },
  undoButton: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#334155',
    color: '#e2e8f0',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85rem',
  },
  resetButton: {
    flex: 1,
    padding: '8px',
    backgroundColor: '#7f1d1d',
    color: '#fca5a5',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.85rem',
  },
};

export default DraftTool;
