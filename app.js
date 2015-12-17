var express   = require('express');
var fs        = require('fs');
var request   = require('request');
var cheerio   = require('cheerio');
var app       = express();
var converter = require('json-2-csv');
var utils     = require('./utils/utils.js');


app.get('/espn/:year/:week', function(req, res){
  var _year = req.params.year;
  var _week = req.params.week;
  var pointsData = [];
  var baseUrl = 'http://games.espn.go.com/ffl/tools/projections';
  var url;
  ProcessNext(_week, 0);
  function ProcessNext(wk, ix) {
    if (ix < 12) {
      ix++;
    } else {
      ix = 1;
      wk++;
      if(wk > _week){
        utils.sortJsonArrayByProp(pointsData, 'vend_player_id');
        converter.json2csv(pointsData, function (err, csv) {
          if (err) throw err;
          fs.writeFile('projections/espn/espn-'+_year.toString()+'-'+_week.toString()+'.csv', csv, function(err){
            console.log('csv successfully written!');
          })
        })
        fs.writeFile('projections/espn/espn-'+_year.toString()+'-'+_week.toString()+'.json', JSON.stringify(pointsData, null, 4), function(err){
          console.log(pointsData.length);
          console.log('json successfully written!');
        })
        res.send('Check your console!')
        return;
      }
    }
    var _wk = wk;
    var _ix = (ix * 40) - 40;
    var url = baseUrl + '?&seasonId=2015&scoringPeriodId=' + _wk.toString() + '&startIndex=' + _ix.toString();
    request(url, function(error, response, html) {
      if(!error){
        var $ = cheerio.load(html);
        $('tr.pncPlayerRow').each(function(i){
          var name_text, team_pos, team_pos_arr;
          var json = { vend_player_id: "", season_year: "2015", week: "", full_name: "", team_pos: "", opponent: "", points: ""};
          var data = $(this);
          json.vend_player_id = data.find('td.playertablePlayerName > a').attr('playerid');
          json.week = _wk;
          json.full_name = data.find('td.playertablePlayerName > a').text().trim();
          json.opponent = data.find('td.playertablePlayerName').next().find('a').text().trim();
          json.points = data.find('td.appliedPoints').text().trim();
          name_text = data.find('td.playertablePlayerName').clone().children().remove().end().text().trim();
          name_text = name_text.toLowerCase();
          name_text = name_text.replace(', ', '');
          name_text = name_text.replace('*', '');
          name_text = name_text.replace('&nbsp;', ' ');
          name_text = name_text.replace(/[^\x00-\x7F]/g, " ");
          name_text = name_text.trim();
          team_pos = name_text.split(' ');
          json.team_pos = team_pos[0]+ ' '+team_pos[1];
          json.opponent = json.opponent.replace("@", "").toUpperCase();

          if (isNaN(json.points)) {
            json.points = 0;
          }
          if(json.opponent != 'BYE' && json.opponent != '' && Number(json.points) > 0) {
            pointsData.push(json);
          }
        })
        ProcessNext(wk, ix);
      }
    })
  }
})

app.get('/espn/history', function(req, res){
  var _curr = utils.getCurrentWeek();
  var _year = _curr.year;
  var _week = _curr.week;
  var pointsData = [];
  var baseUrl = 'http://games.espn.go.com/ffl/tools/projections';
  var url;
  ProcessNext(1, 0);
  function ProcessNext(wk, ix) {
    if (ix < 12) {
      ix++;
    } else {
      ix = 1;
      wk++;
      if(wk > _week){
        utils.sortJsonArrayByProp(pointsData, 'vend_player_id');
        converter.json2csv(pointsData, function (err, csv) {
          if (err) throw err;
          fs.writeFile('projections/espn/espn-history-'+_year.toString()+'-'+_week.toString()+'.csv', csv, function(err){
            console.log('csv successfully written!');
          })
        })
        fs.writeFile('projections/espn/espn-history-'+_year.toString()+'-'+_week.toString()+'.json', JSON.stringify(pointsData, null, 4), function(err){
          console.log(pointsData.length);
          console.log('json successfully written!');
        })
        res.send('Check your console!')
        return;
      }
    }
    var _wk = wk;
    var _ix = (ix * 40) - 40;
    var url = baseUrl + '?&seasonId=2015&scoringPeriodId=' + _wk.toString() + '&startIndex=' + _ix.toString();
    request(url, function(error, response, html) {
      if(!error){
        var $ = cheerio.load(html);
        $('tr.pncPlayerRow').each(function(i){
          var name_text, team_pos, team_pos_arr;
          var json = { vend_player_id: "", season_year: "2015", week: "", full_name: "", team_pos: "", opponent: "", points: ""};
          var data = $(this);
          json.vend_player_id = data.find('td.playertablePlayerName > a').attr('playerid');
          json.week = _wk;
          json.full_name = data.find('td.playertablePlayerName > a').text().trim();
          json.opponent = data.find('td.playertablePlayerName').next().find('a').text().trim();
          json.points = data.find('td.appliedPoints').text().trim();
          name_text = data.find('td.playertablePlayerName').clone().children().remove().end().text().trim();
          name_text = name_text.toLowerCase();
          name_text = name_text.replace(', ', '');
          name_text = name_text.replace('*', '');
          name_text = name_text.replace('&nbsp;', ' ');
          name_text = name_text.replace(/[^\x00-\x7F]/g, " ");
          name_text = name_text.trim();
          team_pos = name_text.split(' ');
          json.team_pos = team_pos[0]+ ' '+team_pos[1];
          json.opponent = json.opponent.replace("@", "").toUpperCase();

          if (isNaN(json.points)) {
            json.points = 0;
          }
          if(json.opponent != 'BYE' && json.opponent != '' && Number(json.points) > 0) {
            pointsData.push(json);
          }
        })
        ProcessNext(wk, ix);
      }
    })
  }
})

app.get('/fox/:year/:week', function(req, res){
  var _year = req.params.year;
  var _week = req.params.week;
  var baseUrl = 'http://www.foxsports.com/fantasy/football/commissioner/Research/Projections.aspx';
  var pointsData = [];
  var url;
  ProcessNext(_week, 0);
  function ProcessNext(wk, pg) {
    if (pg < 21) {
      pg++;
    } else {
      pg = 1;
      wk++;
      if(wk > _week){
        utils.sortJsonArrayByProp(pointsData, 'vend_player_id');
        converter.json2csv(pointsData, function (err, csv) {
          if (err) throw err;
          fs.writeFile('projections/fox/fox-'+_year.toString()+'-'+_week.toString()+'.csv', csv, function(err){
            console.log('csv successfully written!');
          })
        })
        fs.writeFile('projections/fox/fox-'+_year.toString()+'-'+_week.toString()+'.json', JSON.stringify(pointsData, null, 4), function(err){
          console.log(pointsData.length);
          console.log('json successfully written!');
        })
        res.send('Check your console!')
        return;
      }
    }
    var _wk = wk;
    var _pg = pg;
    var url = baseUrl + '?page=' + _pg.toString() + '&position=-1&split=4';
    request(url, function(error, response, html) {
      if(!error){
        var $ = cheerio.load(html);
        $('#playerTable > tbody > tr').each(function(i){
          var profile, profile_arr;
          var json = { vend_player_id: "", season_year: "2015", week: "", full_name: "", team_pos: "", opponent: "", points: ""};
          var data = $(this);

          profile = data.find('.wis_playerProfileLink').attr('href');
          profile_arr = profile.split('=');

          json.vend_player_id = profile_arr[1];
          json.full_name = data.find('.wis_playerProfileLink').text().trim();
          json.team_pos = data.find('.TeamPosPlayerInfo').text().trim();
          json.week = _wk;
          json.opponent = data.find('.wis_playerStatus_oppTeamName').text().trim().toUpperCase();
          json.points = data.find('td.right.statGroupSplit.wis_col_highlight').text().trim();
          json.opponent = json.opponent.replace("@", "");

          if (isNaN(json.points)) {
            json.points = 0;
          }
          if(json.opponent != 'BYE' && json.opponent != '' && Number(json.points) > 0) {
            pointsData.push(json);
          }
        })
        ProcessNext(wk, pg);
      }
    })
  }
})

app.get('/nfl/:year/:week', function(req, res){
  var _year = req.params.year;
  var _week = req.params.week;
  var baseUrl = 'http://fantasy.nfl.com/research/projections';
  var pointsData = [];
  var url;
  ProcessNext(_week, 0);
  function ProcessNext(wk, pg) {
    if (pg < 25) {
      pg++;
    } else {
      pg = 1;
      wk++;
      if(wk > _week){
        utils.sortJsonArrayByProp(pointsData, 'vend_player_id');
        converter.json2csv(pointsData, function (err, csv) {
          if (err) throw err;
          fs.writeFile('projections/nfl/nfl-'+_year.toString()+'-'+_week.toString()+'.csv', csv, function(err){
            console.log('csv successfully written!');
          })
        })
        fs.writeFile('projections/nfl/nfl-'+_year.toString()+'-'+_week.toString()+'.json', JSON.stringify(pointsData, null, 4), function(err){
          console.log(pointsData.length);
          console.log('json successfully written!');
        })
        res.send('Check your console!')
        return;
      }
    }
    var _wk = wk;
    var _pg = (pg * 25) - 24;
    console.log('offset: ' + _pg.toString());
    var url = baseUrl + '?offset='+_pg.toString()+'&position=O&sort=projectedPts&statCategory=projectedStats&statSeason='+_year.toString()+'&statType=weekProjectedStats&statWeek='+_wk.toString();
    request(url, function(error, response, html) {
      if(!error){
        var $ = cheerio.load(html);
        $('table.tableType-player > tbody > tr').each(function(i){
          var profile, profile_arr;
          var json = { vend_player_id: "", season_year: "2015", week: "", full_name: "", team_pos: "", opponent: "", points: ""};
          var data = $(this);

          profile = data.find('a.playerNameFull').attr('href');
          profile_arr = profile.split('=');

          json.vend_player_id = profile_arr[2];
          json.full_name = data.find('a.playerNameFull').text().trim();
          json.team_pos = data.find('td.playerNameAndInfo > div > em').text().trim();
          json.week = _wk;
          json.opponent = data.find('td.playerOpponent').text().trim().toUpperCase();
          json.points = data.find('span.playerWeekProjectedPts').text().trim();
          json.opponent = json.opponent.replace("@", "");

          if (isNaN(json.points)) {
            json.points = 0;
          }
          if(json.opponent != 'BYE' && json.opponent != '' && Number(json.points) > 0) {
            pointsData.push(json);
          }
        })
        ProcessNext(wk, pg);
      }
    })
  }
})

app.get('/nfl/history', function(req, res){
  var _curr = utils.getCurrentWeek();
  var _year = _curr.year;
  var _week = _curr.week;
  var baseUrl = 'http://fantasy.nfl.com/research/projections';
  var pointsData = [];
  var url;
  ProcessNext(1, 0);
  function ProcessNext(wk, pg) {
    if (pg < 25) {
      pg++;
    } else {
      pg = 1;
      wk++;
      if(wk > _week){
        utils.sortJsonArrayByProp(pointsData, 'vend_player_id');
        converter.json2csv(pointsData, function (err, csv) {
          if (err) throw err;
          fs.writeFile('projections/nfl/nfl-history-'+_year.toString()+'-'+_week.toString()+'.csv', csv, function(err){
            console.log('csv successfully written!');
          })
        })
        fs.writeFile('projections/nfl/nfl-history-'+_year.toString()+'-'+_week.toString()+'.json', JSON.stringify(pointsData, null, 4), function(err){
          console.log(pointsData.length);
          console.log('json successfully written!');
        })
        res.send('Check your console!')
        return;
      }
    }
    var _wk = wk;
    var _pg = (pg * 25) - 24;
    console.log('week ' + _wk.toString() + ' offset: ' + _pg.toString());
    var url = baseUrl + '?offset='+_pg.toString()+'&position=O&sort=projectedPts&statCategory=projectedStats&statSeason=2015&statType=weekProjectedStats&statWeek='+_wk.toString();
    request(url, function(error, response, html) {
      if(!error){
        var $ = cheerio.load(html);
        $('table.tableType-player > tbody > tr').each(function(i){
          var profile, profile_arr;
          var json = { vend_player_id: "", season_year: "2015", week: "", full_name: "", team_pos: "", opponent: "", points: ""};
          var data = $(this);

          profile = data.find('a.playerNameFull').attr('href');
          profile_arr = profile.split('=');

          json.vend_player_id = profile_arr[2];
          json.full_name = data.find('a.playerNameFull').text().trim();
          json.team_pos = data.find('td.playerNameAndInfo > div > em').text().trim();
          json.week = _wk;
          json.opponent = data.find('td.playerOpponent').text().trim().toUpperCase();
          json.points = data.find('span.playerWeekProjectedPts').text().trim();
          json.opponent = json.opponent.replace("@", "");

          if (isNaN(json.points)) {
            json.points = 0;
          }
          if(json.opponent != 'BYE' && json.opponent != '' && Number(json.points) > 0) {
            pointsData.push(json);
          }
        })
        ProcessNext(wk, pg);
      }
    })
  }
})

app.listen('8081')
console.log('Magic happens on port 8081');
exports = module.exports = app;