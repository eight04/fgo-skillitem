require("./fgo-skillitem/data");
require("./fgo-skillitem/data-item");
require("./fgo-skillitem/chinesedata");

var fs = require("fs");

var missingImage = [],
	missingChinese = [],
	missingItem = {};

Object.values(servants).forEach(servant => {
	try {
		fs.accessSync("fgo-skillitem/images/svtNo_" + servant.id + ".png");
	} catch (err) {
		missingImage.push(servant);
	}
	
	if (!svtChineseData[servant.id - 1]) {
		missingChinese.push(servant);
	}
	
	for (var lvs of [servant.skills, servant.ascension]) {
		if (!lvs) continue;
		lvs.forEach(items => Object.keys(items).forEach(name => {
			if (!itemImage[name]) {
				missingItem[name] = true;
			}
		}));
	}
});

missingItem = Object.keys(missingItem);

if (missingImage.length) {
	console.log("Some servants are lack of image!\n" + missingImage.map(s => `No.${s.id} ${s.name}`).join("\n") + "\n");
}
if (missingChinese.length) {
	console.log("Some servants are lack of chinese name!\n" + missingImage.map(s => `No.${s.id} ${s.name}`).join("\n") + "\n");
}
if (missingItem.length) {
	console.log("Some items are lack of IDs!\n" + missingItem.join("\n"));
}
