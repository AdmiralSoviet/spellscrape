var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');

var args = process.argv.slice(2);

var output = require('./output-lib.json');


function spell_scrape(url, callback) {
    request(url, function (error, response, html) {
        if (error) {
            console.log("Error has occured! Aborting!");
            return false;
        }
        var $ = cheerio.load(html);
        // The name
        const json = {
            url: url
        };
        json.name = $(".page-title").text().trim();
        // if nothing is found
        if (json.name == "Not Found" || !json.name) {
            console.log("Spell not found!");
            if (callback)
                callback(json);
            return false;
        }
        json.level = $(".ddb-statblock-item-level").find($(".ddb-statblock-item-value")).text().trim();
        json.ctime = $(".ddb-statblock-item-casting-time").find($(".ddb-statblock-item-value")).text().trim();
        json.range = $(".ddb-statblock-item-range-area").find($(".ddb-statblock-item-value")).text().trim();
        json.components = $(".ddb-statblock-item-components").find($(".ddb-statblock-item-value")).text().trim();
        json.duration = $(".ddb-statblock-item-duration").find($(".ddb-statblock-item-value")).text().trim();
        json.school = $(".ddb-statblock-item-school").find($(".ddb-statblock-item-value")).text().trim();
        for (property in json) {
            // fixing formatting stuff
            if (json.hasOwnProperty(property)) {
                json[property] = json[property].replace(/\r?\n|\r/g, " ");
                json[property] = json[property].replace(/ +/g, ' ');
                json[property] = json[property].replace(/ \)/g, ')');
            }
        }
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
        if (callback)
            callback(json);
    });
};

function asyncLoop(iterations, func, callback) {
    var index = 0;
    var done = false;
    var loop = {
        next: function () {
            if (done) {
                return;
            }

            if (index < iterations) {
                index++;
                func(loop);

            } else {
                done = true;
                callback();
            }
        },

        iteration: function () {
            return index - 1;
        },

        break: function () {
            done = true;
            callback();
        }
    };
    loop.next();
    return loop;
}

function spell_scrape_page(i = 1, callback) {
    request(`https://www.dndbeyond.com/spells?page=${i}`, function (error, response, html) {
        if (error) {
            console.log(`Error: ${error}`);
            return false;
        }
        var $ = cheerio.load(html);

        var link = [];
        $('.row.spell-name').find('a').each(function () {
            link.push($(this).attr('href'))
        });
        console.log("Added " + link.length + " links!");
        let i = 0;
        asyncLoop(link.length, function (loop) {
                console.log("Studying https://www.dndbeyond.com" + link[i]);
                spell_scrape("https://www.dndbeyond.com" + link[i], function () {
                    i++;
                    loop.next();
                })
            },
            function () {
                console.log('\nFinished studying page!');
                callback();
            }
        );
    });
}

args = args.join(" ");
args = args.toLowerCase().replace(/ /g, "-");

if (args == "all") {
    let i = 1;
    asyncLoop(24, function (loop) {
            console.log(`Studying page ${i}`);
            spell_scrape_page(i, function () {
                i++;
                loop.next();
            })
        },
        function () {
            console.log('\nFinished studying everything!')
        }
    );
} else {
    spell_scrape("https://www.dndbeyond.com/spells/" + args);
}