import sys
import nfldb
import datetime
import xlsxwriter
from xlsxwriter.utility import xl_rowcol_to_cell
import json

def cleanTeamNameDK(team):
    ret = team.upper()
    ret = ret.replace('JAX', 'JAC')
    return ret

def cleanPlayerNameDK(name):
    ret = name
    ret = ret.replace('Jamarcus Nelson', 'J.J. Nelson')
    ret = ret.replace('Fozzy Whittaker', 'Foswhitt Whittaker')
    ret = ret.replace('(Philly)', '')
    ret = ret.replace('Boobie Dixon', 'Anthony Dixon')
    ret = ret.replace('Tim Wright', 'Timothy Wright')
    return ret

def cleanPositionDK(pos):
  ret = pos.upper()
  ret = ret.replace('DEF', 'DST')
  ret = ret.replace('PK', 'K')
  return ret

def getItemFromDictList(lookupkey, valuekey, dlist):
    return (litem for litem in dlist if litem[lookupkey] == valuekey).next()

def nullValue():
    return None

db = nfldb.connect()
q = nfldb.Query(db)
year = 2015
week = 15

print 'load teamsbycity json'
with open('teams/teamsbycity.json') as data_file:    
  teamsbycity = json.load(data_file)

print 'load teamsbyname json'
with open('teams/teamsbyname.json') as data_file:    
  teamsbyname = json.load(data_file)

print 'load JSON-'+str(year)+'-'+str(week)+'-DK.json json'
with open('salary/JSON-'+str(year)+'-'+str(week)+'-DK.json') as data_file:    
  datadk = json.load(data_file)

print 'load JSON-'+str(year)+'-'+str(week)+'-FD.json json'
with open('salary/JSON-'+str(year)+'-'+str(week)+'-FD.json') as data_file:    
  datafd = json.load(data_file)

salaryoffense = []
salarydefense = []

for i, v in enumerate(datadk['data']):
  qteam = cleanTeamNameDK(v['teamAbbrev'])
  qname = cleanPlayerNameDK(v['Name'])
  qgame = nfldb.Query(db).game(season_year=year, week=week, season_type='Regular', team=qteam).as_games()
  if v['Position'] != 'DST':
    matches = nfldb.player_search(db, qname, limit=15)
    optplayers = {}
    cnt_plyr = 0
    cnt_zero = 0
    print '---------------------------'
    for (player, dist) in matches:
      if dist == 0:
        cnt_zero += 1
      cnt_plyr += 1
      optplayers[str(cnt_plyr)] = player
      print str(cnt_plyr) + ') Similarity score: %d, Player: %s' % (dist, player)
    if cnt_zero == 1:
      opt = '1'
    else:
      opt = raw_input('select the real...  ' + qname + ' (' + qteam + ', ' + v['Position'] + '): ')
    salaryoffense.append({
      '01salary_type': 'dk',
      '02player_id': optplayers[opt].player_id if optplayers[opt].player_id else '00',
      '03gsis_id': qgame[0].gsis_id,
      '04team': qteam,
      '05full_name': optplayers[opt].full_name,
      '06position': v['Position'],
      '07salary': v['Salary'],
      '08season_year': year,
      '09week': week,
      '10searchname': qname,
      '11check': optplayers[opt].full_name.upper() == v['Name'].upper()
    })
  else:
    salarydefense.append({
      '01salary_type': 'dk',
      '02team_id': qteam,
      '03gsis_id': qgame[0].gsis_id,
      '04team': qteam,
      '07salary': v['Salary'],
      '08season_year': year,
      '09week': week
    })

# DK: {"Position":"WR","Name":"Julio Jones","Salary":9200,"GameInfo":"TB@Atl 01:00PM ET","AvgPointsPerGame":25.143,"teamAbbrev":"Atl"}
# FD: {"Id":14190,"Position":"WR","First Name":"Julio","Last Name":"Jones","FPPG":19.7,"Played":7,"Salary":9200,"Game":"TB@ATL","Team":"ATL","Opponent":"TB","Injury Indicator":"","Injury Details":"","FIELD13":"","FIELD14":""}

for i, v in enumerate(datafd['data']):
  qteam = cleanTeamNameDK(v['Team'])
  qname =  v['First Name'] + ' ' + v['Last Name']
  qgame = nfldb.Query(db).game(season_year=year, week=week, season_type='Regular', team=qteam).as_games()
  if v['Position'] != 'D':
    matches = nfldb.player_search(db, qname, limit=15)
    optplayers = {}
    cnt_plyr = 0
    cnt_zero = 0
    print '---------------------------'
    for (player, dist) in matches:
      if dist == 0:
        cnt_zero += 1
      cnt_plyr += 1
      optplayers[str(cnt_plyr)] = player
      print str(cnt_plyr) + ') Similarity score: %d, Player: %s' % (dist, player)
    if cnt_zero == 1:
      opt = '1'
    else:
      opt = raw_input('select the real...  ' + qname + ' (' + qteam + ', ' + v['Position'] + '): ')
    salaryoffense.append({
      '01salary_type': 'fd',
      '02player_id': optplayers[opt].player_id if optplayers[opt].player_id else '00',
      '03gsis_id': qgame[0].gsis_id,
      '04team': qteam,
      '05full_name': optplayers[opt].full_name,
      '06position': v['Position'],
      '07salary': v['Salary'],
      '08season_year': year,
      '09week': week,
      '10searchname': qname,
      '11check': optplayers[opt].full_name.upper() == qname.upper()
    })
  else:
    salarydefense.append({
      '01salary_type': 'fd',
      '02team_id': qteam,
      '03gsis_id': qgame[0].gsis_id,
      '04team': qteam,
      '07salary': v['Salary'],
      '08season_year': year,
      '09week': week
    })

#Set up Worksheets
workbook = xlsxwriter.Workbook('salaries_' + str(year) + '_' + str(week) + '.xlsx')
fmt_data = workbook.add_format({'bold': False})
offense = workbook.add_worksheet('offense')
defense = workbook.add_worksheet('defense')

#PRINT OFFENSE SALARIES
offense.add_table('A1:K'+str(len(salaryoffense) + 1), {
  'columns': [
    {'header': 'salary_type'},
    {'header': 'player_id'},
    {'header': 'gsis_id'},
    {'header': 'team'},
    {'header': 'full_name'},
    {'header': 'position'},
    {'header': 'salary'},
    {'header': 'season_year'},
    {'header': 'week'},
    {'header': 'search_name'},
    {'header': 'check'}
  ]}
)

row = 1
for i, v in enumerate(salaryoffense):
  col = 0
  for key, val in sorted(v.iteritems()):
    offense.write(row, col, val, fmt_data)
    col += 1
  row += 1

#PRINT DEFENSE SALARIES
defense.add_table('A1:G'+str(len(salarydefense) + 1), {
  'columns': [
    {'header': 'salary_type'},
    {'header': 'team_id'},
    {'header': 'gsis_id'},
    {'header': 'team'},
    {'header': 'salary'},
    {'header': 'season_year'},
    {'header': 'week'}
  ]}
)

row = 1
for i, v in enumerate(salarydefense):
  col = 0
  for key, val in sorted(v.iteritems()):
    defense.write(row, col, val, fmt_data)
    col += 1
  row += 1

workbook.close()