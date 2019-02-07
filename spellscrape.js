var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');

var args = process.argv.slice(2);

var output = require('./output-lib.json');


function spell_scrape(url) {
    request(url, function (error, response, html) {
        if (error) {
            console.log("Error has occured! Aborting!");
            return false;
        }
        var $ = cheerio.load(html);
        // The name
        const json = {url: url};
        json.name = $(".page-title").text().trim();
        json.level = $(".ddb-statblock-item-level").find($(".ddb-statblock-item-value")).text().trim();
        json.ctime = $(".ddb-statblock-item-casting-time").find($(".ddb-statblock-item-value")).text().trim();
        json.range = $(".ddb-statblock-item-range-area").find($(".ddb-statblock-item-value")).text().trim();
        json.components = $(".ddb-statblock-item-components").find($(".ddb-statblock-item-value")).text().trim();
        json.duration = $(".ddb-statblock-item-duration").find($(".ddb-statblock-item-value")).text().trim();
        json.school = $(".ddb-statblock-item-school").find($(".ddb-statblock-item-value")).text().trim();
        json.roll = $(".more-info-content").text().match(/\d+d\d+/) ? $(".more-info-content").text().match(/\d+d\d+/).toString() : null;
        json.description = $(".more-info-content").find("p").text();
        
        output[json.name] = json;


        fs.writeFile('output-lib.json', JSON.stringify(output, null, 4), function (err) {
            console.log("\n'" + json.name + "' Spell Data successfuly extracted!");
            console.log("Name: " + json.name);
            console.log("Level: " + json.level);
            console.log("School: " + json.school);
            console.log("Components: " + json.components);
            console.log("Casting Time: " + json.ctime);
            console.log("Duration: " + json.duration);
            console.log("Range: " + json.range);
            console.log("Roll: " + json.roll);
            console.log("URL: " + json.url);
            console.log("Description: " + json.description);
            console.log("\n");
            console.log(`\nRaw Data: \n${JSON.stringify(json)}\n`);
        });
    });
};
args = args.join(" ");
args = args.toLowerCase().replace(/ /g, "-");
spell_scrape("https://www.dndbeyond.com/spells/"+args);

/* // ignore this, test to download every spell from a list at once
request(args[0], function (error, response, html) {
    if (error) {
        console.log("Error has occured! Aborting!");
        return false;
    }
    var $ = cheerio.load(html);

    var link = [];
    $('tbody').find('a').each(function () {
        link.push($(this).attr('href'))
    });
    console.log("Added " + link.length + "links!");

    for (var i = 0; i < link.length; i++) {
        console.log("Studying http://engl393-dnd5th.wikia.com" + link[i]);
        spell_scrape("http://engl393-dnd5th.wikia.com" + link[i]);
    }
});
*/