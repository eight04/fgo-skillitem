var rp = require("request-promise-native"),
	cheerio = require("cheerio"),
	fs = require("fs");
	
function contentToItemMap($) {
	var map = {};
	
	$(this).contents().filter(function(){
		return !$(this).is("br");
	}).each(function() {
		var text = $(this).text().trim(),
			i;
		
		i = text.lastIndexOf("QP");
		
		if (i == text.length - 2) {
			map["QP"] = +text.substr(0, i).replace(/,/g, "");
			return;
		}
		
		var [item, count] = text.split("x");
		map[item] = +count || 1;
	});
	
	return map;
}

function normalizePage(page) {
	if (page == "//www9.atwiki.jp/f_go/pages/609.html") {
		page = "//www9.atwiki.jp/f_go/pages/117.html";
	}
	return page;
}
	
rp("https://www9.atwiki.jp/f_go/pages/160.html").then(function(body) {
	var $ = cheerio.load(body),
		out = {};
	
	$("#wikibody table tr").each(function(){
		var children = $(this).children(),
			firstText = children.first().text().trim();
			
		if (firstText == "No." || firstText == "1段階") {
			return;
		}
		
		var servant = {
			id: +children.eq(0).text().trim(),
			page: normalizePage(children.eq(2).find("a").attr("href")),
			rare: +children.eq(1).text().trim(),
			name: children.eq(2).text().trim(),
			cls: children.eq(3).text().trim()
		};
		
		if (servant.id != 1) {
			servant.ascension = children.slice(4).map(function() {
				return contentToItemMap.call(this, $);
			}).get();
		}
		
		out[servant.id] = servant;
	});
	
	return out;
	
}).then(function(out) {
	return rp("https://www9.atwiki.jp/f_go/pages/302.html").then(function(body) {
		var $ = cheerio.load(body),
			table = {};
		
		$("#wikibody table tr").each(function() {
			if ($(this).children().first().text().trim() == "Name") {
				return;
			}
			
			var servant = {
				page: normalizePage($(this).children().first().find("a").attr("href")),
				name: $(this).children().first().text().trim()
			};
			
			servant.skills = $(this).children().slice(1).map(function() {
				return contentToItemMap.call(this, $);
			}).get();
			
			table[servant.page] = servant;
		});
		
		var key, servant;
		for (key in out) {
			servant = out[key];
			
			if (!table[servant.page]) {
				console.log("No servant " + servant.page);
				continue;
			}
			servant.skills = table[servant.page].skills;
			servant.name = table[servant.page].name;
			
			delete table[servant.page];
		}
		
		var names = Object.keys(table);
		if (names.length) {
			throw new Error("Some servants still in table:\n" + names.join("\n"));
		}
		
		return out;
	});
	
}).then(function(out) {
	fs.writeFileSync("fgo-skillitem/data.js", "servants = " + JSON.stringify(out, null, "\t"));
});
