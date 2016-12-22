require("./fgo-skillitem/data");
require("./fgo-skillitem/data-item");

var fs = require("fs");

var missingImage = [],
	missingChinese = [],
	missingItem = {},
	invalidCount = [];

Object.values(servants).forEach(servant => {
	try {
		fs.accessSync("fgo-skillitem/images/svtNo_" + servant.id + ".png");
	} catch (err) {
		missingImage.push(servant);
	}
	
	if (!servant.chineseName) {
		missingChinese.push(servant);
	}
	
	for (var lvs of [servant.skills, servant.ascension]) {
		if (!lvs) continue;
		lvs.forEach(items => Object.keys(items).forEach(name => {
			if (!itemImage[name]) {
				missingItem[name] = true;
			}
			if (!Number.isInteger(items[name])) {
				invalidCount.push([servant, name]);
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
	console.log("Some items are lack of IDs!\n" + missingItem.join("\n") + "\n");
}
if (invalidCount.length) {
	console.log("Some items have invalid count!\n" + invalidCount.map(([s, n]) => `No.${s.id}: ${n}`));
}
