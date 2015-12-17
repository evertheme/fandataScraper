import sys
import nfldb
import xlsxwriter
from xlsxwriter.utility import xl_rowcol_to_cell
import json

db = nfldb.connect()
q = nfldb.Query(db)

def cleanTeamNameDK(team):
    ret = team.upper()
    ret = ret.replace('JAX', 'JAC')
    return ret

print 'load teamsbycity json'
with open('teams/teamsbycity.json') as data_file:    
  teamsbycity = json.load(data_file)

print 'load teamsbyname json'
with open('teams/teamsbyname.json') as data_file:    
  teamsbyname = json.load(data_file)

print 'load espn players'
with open('players/espn-players.json') as data_file:    
  players = json.load(data_file)

rtnPlayers = [];
fixPlayers = [];


for i, v in enumerate(players):

  espn_id = v['espn_player_id']
  espn_nm = v['full_name']
  team_po = v['team_pos']
  espn_op = cleanTeamNameDK(v['opponent'])
  nfld_id = '';

  qgame = nfldb.Query(db).game(season_year=v['season_year'], week=v['week'], season_type='Regular', team=espn_op).as_games()
  if len(qgame) < 1:
    qgameid = '9999999999'
  else:
    qgameid = qgame[0].gsis_id

  if "D/ST" not in espn_nm:
    matches = nfldb.player_search(db, espn_nm, limit=15)
    optplayers = {}
    cnt_plyr = 0
    cnt_zero = 0
    print '---------------------------'
    print '0) Not Found'
    optplayers['0'] = 'Not Found'
    for (player, dist) in matches:
      if dist == 0:
        cnt_zero += 1
      cnt_plyr += 1
      optplayers[str(cnt_plyr)] = player
      print str(cnt_plyr) + ') ' + str(espn_id) + ': Similarity score: %d, Player: %s' % (dist, player)
    if cnt_zero == 1:
      opt = '1'
    else:
      opt = raw_input('select the real...  ' + espn_nm + ' (' + str(team_po.replace(u'\xa0', u' ')) + '):')
    if opt == '0':
      fixPlayers.append({
        '1gsis_id': qgameid,
        '2player_id': 'none',
        '3espn_player_id': espn_id,
        '4full_name': espn_nm
      })
    else:
      rtnPlayers.append({
        '1gsis_id': qgameid,
        '2player_id' : optplayers[opt].player_id,
        '3espn_player_id' : espn_id,
        '4full_name': espn_nm
      })

#Set up Worksheets
workbook = xlsxwriter.Workbook('excel/espn-players.xlsx')
fmt_data = workbook.add_format({'bold': False})
resolved = workbook.add_worksheet('resolved')
missing = workbook.add_worksheet('missing')

#PRINT OFFENSE SALARIES
resolved.add_table('A1:D'+str(len(rtnPlayers) + 1), {
  'columns': [
    {'header': 'gsis_id'},
    {'header': 'player_id'},
    {'header': 'espn_player_id'},
    {'header': 'full_name'}
  ]}
)

row = 1
for i, v in enumerate(rtnPlayers):
  col = 0
  for key, val in sorted(v.iteritems()):
    resolved.write(row, col, val, fmt_data)
    col += 1
  row += 1

#PRINT DEFENSE SALARIES
missing.add_table('A1:D'+str(len(fixPlayers) + 1), {
  'columns': [
    {'header': 'gsis_id'},
    {'header': 'player_id'},
    {'header': 'espn_player_id'},
    {'header': 'full_name'}
  ]}
)

row = 1
for i, v in enumerate(fixPlayers):
  col = 0
  for key, val in sorted(v.iteritems()):
    missing.write(row, col, val, fmt_data)
    col += 1
  row += 1

workbook.close()