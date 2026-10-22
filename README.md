# NFL Coach Matchups

A sortable browser app for exploring overall NFL head-coaching records under custom filters.

## Filters

- Winning percentage
- Games played
- Minimum week of the season
- Opponent record entering the game
- Include, exclude, or isolate playoff games
- Coach or team search

Click a coach to see the opponent-by-opponent breakdown for the selected filters.

## Data coverage

The included snapshot covers completed NFL regular-season and postseason games from 1966 through September 20, 2026. Opponent strength is measured immediately before kickoff. Ties count as half a win.

Bill Belichick's totals include both the Cleveland Browns and New England Patriots: **511 games, 333–178**.

## Run locally

No build step is required. Start a static web server in the repository folder:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Data sources

- [nflverse/nfldata](https://github.com/nflverse/nfldata)
- [spatto12/NFLCoaches](https://github.com/spatto12/NFLCoaches)
